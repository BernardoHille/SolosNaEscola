/**
 * Identificação, por mira, dos objetos interativos do Gaussian Splatting.
 *
 * O splat não tem malhas por objeto: cada objeto interativo é representado por um volume
 * invisível (caixa orientada, `interactions.json`). A cada quadro renderizado pelo viewer
 * (`postrender`), lança um raio da câmera:
 *
 * - pelo centro da tela, quando o mouse está capturado (Walk Mode estilo jogo) ou no toque;
 * - pela posição do cursor, quando o cursor está livre no computador.
 *
 * O volume mais próximo atingido vira o alvo, desde que a câmera esteja do lado da frente
 * dele e a menos de `maxDistance`. O destaque é o contorno do volume projetado na tela
 * (casco convexo dos cantos), redesenhado a cada quadro: acompanha posição e perspectiva
 * sem tocar na renderização do splat.
 *
 * Somente leitura da câmera do viewer (`viewer.app`); nada aqui altera o estado do viewer.
 */
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";
import type { CameraComponent } from "playcanvas";

import type { InteractionVolume, Vec3 } from "@/data/interactions";

import {
  add,
  BOX_EDGES,
  distanceToVolume,
  invert,
  isInFront,
  type Mat4,
  projectedOutline,
  projectPoint,
  projectSegment,
  rayThroughPixel,
  rayVolume,
  scale,
  volumeAxes,
  volumeCorners,
} from "./geometry";

export type AimMode = "center" | "pointer";

export type InteractionCallbacks = {
  /** Alvo atual mudou (null = nenhum). */
  onTargetChange: (volume: InteractionVolume | null) => void;
  /** O visitante entrou/saiu do alcance de algum volume (mostra a mira). */
  onNearChange: (near: boolean) => void;
};

/** Margem, além de `maxDistance`, em que a mira já aparece. */
const NEAR_MARGIN = 0.75;
/** Tempo do esmaecimento do destaque (o CSS usa o mesmo valor). */
export const HIGHLIGHT_FADE_MS = 220;

const SVG_NS = "http://www.w3.org/2000/svg";

const pathFrom = (points: [number, number][]) =>
  points.length < 3 ? "" : `M${points.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join("L")}Z`;

export class InteractionManager {
  private volumes: InteractionVolume[] = [];
  private enabled = true;
  private aimMode: AimMode = "center";
  private pointer: [number, number] | null = null;
  private target: InteractionVolume | null = null;
  private near = false;
  private debug = false;
  private selectedId: string | null = null;

  /** Volume desenhado: o alvo atual ou, durante o esmaecimento, o último alvo. */
  private shown: InteractionVolume | null = null;
  private fadeTimer: number | undefined;

  private readonly highlight: SVGGElement;
  private readonly glowPath: SVGPathElement;
  private readonly linePath: SVGPathElement;
  private readonly debugLayer: SVGGElement;
  private readonly offRender: () => void;
  private camera: CameraComponent | null = null;
  private destroyed = false;

  constructor(
    private readonly viewer: ViewerHandle,
    private readonly container: HTMLElement,
    private readonly svg: SVGSVGElement,
    private readonly callbacks: InteractionCallbacks,
  ) {
    this.highlight = document.createElementNS(SVG_NS, "g");
    this.highlight.setAttribute("data-interaction-highlight", "");
    this.highlight.style.opacity = "0";
    this.highlight.style.transition = `opacity ${HIGHLIGHT_FADE_MS}ms ease-out`;
    this.glowPath = document.createElementNS(SVG_NS, "path");
    this.linePath = document.createElementNS(SVG_NS, "path");
    for (const [path, attrs] of [
      [this.glowPath, { fill: "rgba(255,213,74,0.10)", stroke: "rgba(255,213,74,0.28)", "stroke-width": "9" }],
      [this.linePath, { fill: "none", stroke: "#FFD54A", "stroke-width": "2" }],
    ] as const) {
      for (const [k, v] of Object.entries(attrs)) path.setAttribute(k, v);
      path.setAttribute("stroke-linejoin", "round");
      this.highlight.appendChild(path);
    }
    this.debugLayer = document.createElementNS(SVG_NS, "g");
    this.debugLayer.setAttribute("data-interaction-debug", "");
    svg.append(this.highlight, this.debugLayer);

    const onRender = () => this.update();
    viewer.app.on("postrender", onRender);
    this.offRender = () => viewer.app.off("postrender", onRender);
  }

  setVolumes(volumes: InteractionVolume[]) {
    this.volumes = volumes;
    this.update();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    this.update();
  }

  setAimMode(mode: AimMode) {
    this.aimMode = mode;
    this.update();
  }

  /** Posição do cursor na área de visualização (px), ou null fora dela. */
  setPointer(pointer: [number, number] | null) {
    this.pointer = pointer;
    if (this.aimMode === "pointer") this.update();
  }

  setDebug(debug: boolean, selectedId: string | null = null) {
    this.debug = debug;
    this.selectedId = selectedId;
    this.update();
  }

  getTarget() {
    return this.target;
  }

  /** Volume atingido pelo raio que passa por um pixel (ex.: toque na tela). */
  pick(x: number, y: number): InteractionVolume | null {
    const view = this.readView();
    if (!view || !this.enabled) return null;
    const inverse = invert(view.viewProj);
    if (!inverse) return null;
    return this.cast(view.origin, rayThroughPixel(inverse, x, y, view.width, view.height));
  }

  /** Câmera atual (posição e direção central), para a calibração. */
  readCamera(): { position: Vec3; forward: Vec3 } | null {
    const view = this.readView();
    return view && { position: view.origin, forward: view.forward };
  }

  destroy() {
    this.destroyed = true;
    window.clearTimeout(this.fadeTimer);
    this.offRender();
    this.highlight.remove();
    this.debugLayer.remove();
  }

  /** Recalcula alvo e desenho. Chamado a cada quadro renderizado e quando algo muda. */
  update() {
    if (this.destroyed) return;
    const view = this.readView();
    let target: InteractionVolume | null = null;
    let near = false;

    if (view && this.enabled) {
      near = this.volumes.some(
        (v) => isInFront(view.origin, v) && distanceToVolume(view.origin, v) <= v.maxDistance + NEAR_MARGIN,
      );
      let dir: Vec3 | null = view.forward;
      if (this.aimMode === "pointer") {
        const inverse = this.pointer && invert(view.viewProj);
        dir = inverse && this.pointer ? rayThroughPixel(inverse, this.pointer[0], this.pointer[1], view.width, view.height) : null;
      }
      if (dir) target = this.cast(view.origin, dir);
    }

    if (near !== this.near) {
      this.near = near;
      this.callbacks.onNearChange(near);
    }
    if (target?.id !== this.target?.id) {
      this.target = target;
      this.callbacks.onTargetChange(target);
    }

    this.drawHighlight(view);
    this.drawDebug(view);
  }

  private cast(origin: Vec3, dir: Vec3): InteractionVolume | null {
    let best: InteractionVolume | null = null;
    let bestT = Infinity;
    for (const v of this.volumes) {
      if (!isInFront(origin, v) || distanceToVolume(origin, v) > v.maxDistance) continue;
      const t = rayVolume(origin, dir, v);
      if (t !== null && t < bestT) {
        best = v;
        bestT = t;
      }
    }
    return best;
  }

  private readView() {
    if (!this.camera || !this.camera.entity?.enabled) {
      this.camera = (this.viewer.app.root.findComponents("camera")[0] as CameraComponent | undefined) ?? null;
    }
    const camera = this.camera;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    if (!camera || !width || !height) return null;
    const p = camera.entity.getPosition();
    const f = camera.entity.forward;
    const proj = camera.projectionMatrix.data;
    const viewM = camera.viewMatrix.data;
    const viewProj = multiply(proj, viewM);
    return { origin: [p.x, p.y, p.z] as Vec3, forward: [f.x, f.y, f.z] as Vec3, viewProj, width, height };
  }

  private drawHighlight(view: ReturnType<InteractionManager["readView"]>) {
    if (this.target) {
      window.clearTimeout(this.fadeTimer);
      this.fadeTimer = undefined;
      this.shown = this.target;
      this.highlight.style.opacity = "1";
    } else if (this.shown && this.fadeTimer === undefined) {
      this.highlight.style.opacity = "0";
      this.fadeTimer = window.setTimeout(() => {
        this.fadeTimer = undefined;
        if (!this.target) this.shown = null;
      }, HIGHLIGHT_FADE_MS);
    }
    const d = view && this.shown ? pathFrom(projectedOutline(view.viewProj, this.shown, view.width, view.height)) : "";
    this.glowPath.setAttribute("d", d);
    this.linePath.setAttribute("d", d);
  }

  private drawDebug(view: ReturnType<InteractionManager["readView"]>) {
    this.debugLayer.replaceChildren();
    if (!this.debug || !view) return;
    const { viewProj, width, height } = view;
    const line = (a: Vec3, b: Vec3, color: string, w: number) => {
      const seg = projectSegment(viewProj, a, b, width, height);
      if (!seg) return;
      const el = document.createElementNS(SVG_NS, "line");
      el.setAttribute("x1", seg[0][0].toFixed(1));
      el.setAttribute("y1", seg[0][1].toFixed(1));
      el.setAttribute("x2", seg[1][0].toFixed(1));
      el.setAttribute("y2", seg[1][1].toFixed(1));
      el.setAttribute("stroke", color);
      el.setAttribute("stroke-width", String(w));
      this.debugLayer.appendChild(el);
    };
    for (const v of this.volumes) {
      const selected = v.id === this.selectedId;
      const corners = volumeCorners(v);
      for (const [i, j] of BOX_EDGES) line(corners[i], corners[j], selected ? "#7dd3fc" : "rgba(125,211,252,0.6)", selected ? 2 : 1);
      // Eixos locais: X vermelho, Y verde, Z (frente) azul.
      const axes = volumeAxes(v);
      const len = Math.max(0.12, Math.min(...v.size) * 0.6);
      (["#ef4444", "#22c55e", "#3b82f6"] as const).forEach((color, k) =>
        line(v.position, add(v.position, scale(axes[k], len)), color, 2),
      );
      const top = add(v.position, scale(axes[1], v.size[1] / 2 + 0.03));
      const at = projectPoint(viewProj, top, width, height);
      if (!at) continue;
      const text = document.createElementNS(SVG_NS, "text");
      text.setAttribute("x", at[0].toFixed(1));
      text.setAttribute("y", at[1].toFixed(1));
      text.setAttribute("text-anchor", "middle");
      text.setAttribute("font-size", "11");
      text.setAttribute("font-family", "ui-monospace, monospace");
      text.setAttribute("fill", selected ? "#e0f2fe" : "rgba(224,242,254,0.85)");
      text.setAttribute("paint-order", "stroke");
      text.setAttribute("stroke", "rgba(0,0,0,0.8)");
      text.setAttribute("stroke-width", "3");
      text.textContent = `${v.id} (${v.position.map((n) => n.toFixed(2)).join(", ")})`;
      this.debugLayer.appendChild(text);
    }
  }
}

/** a · b para matrizes 4×4 em ordem de colunas. */
function multiply(a: Mat4, b: Mat4): number[] {
  const out = new Array<number>(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      out[c * 4 + r] =
        a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return out;
}
