/**
 * Visualizador dos modelos inspecionados (GLB), independente do viewer do Gaussian Splatting.
 *
 * Usa uma segunda aplicação PlayCanvas (o motor já instalado, compartilhado com o viewer)
 * num canvas próprio e transparente, sobreposto ao museu escurecido. O splat continua
 * desenhado ao fundo, sem ser recarregado nem redesenhado enquanto a inspeção está aberta.
 *
 * - Renderização sob demanda: só desenha quando algo muda (arrasto, zoom, carregamento).
 * - Câmera fixa olhando para −Z; o objeto gira em torno do centro da sua caixa delimitadora.
 * - Arrastar gira o objeto livremente (eixos da tela); roda/pinça aproxima dentro de limites
 *   que impedem a câmera de entrar no objeto; botão direito, Shift+arrastar ou dois dedos
 *   deslocam a vista de forma limitada; duplo clique restaura a orientação inicial.
 * - Modelos carregados sob demanda e guardados enquanto a inspeção está aberta (voltar a uma
 *   etapa não baixa de novo); `destroy()` libera tudo.
 */
import {
  Application,
  type Asset,
  Color,
  type Entity as EntityType,
  Entity,
  FILLMODE_NONE,
  GAMMA_SRGB,
  type MeshInstance,
  Quat,
  RESOLUTION_AUTO,
  TONEMAP_LINEAR,
  Vec3,
  BoundingBox,
} from "playcanvas";

import type { InspectionItem } from "@/data/inspection";

export type MarkerPosition = { label: string; x: number; y: number; visible: boolean };

export type InspectionViewerCallbacks = {
  /** Posições na tela (px) dos rótulos do modelo atual; vazio se não houver. */
  onMarkers?: (markers: MarkerPosition[]) => void;
};

const FOV = 30;
/** Folga do enquadramento inicial (deixa espaço para a interface). */
const FIT_MARGIN = 1.6;
/** Distância mínima em raios da esfera envolvente: a câmera nunca entra no objeto. */
const MIN_DISTANCE_RADII = 1.08;
const MAX_DISTANCE_FIT = 2.2;
/** Deslocamento máximo da vista, em raios. */
const MAX_PAN_RADII = 0.6;
const ROTATE_DEG_PER_PX = 0.35;
const PITCH_LIMIT_DEG = 85;

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

type Loaded = {
  item: InspectionItem;
  root: EntityType;
  radius: number;
  fitDistance: number;
  markers: { label: string; entity: EntityType }[];
};

export class InspectionViewer {
  private readonly app: Application;
  private readonly camera: Entity;
  /** Gira com o visitante (orientação livre). */
  private readonly pivot: Entity;
  private readonly cache = new Map<string, Promise<Asset>>();
  private current: Loaded | null = null;
  private loadToken = 0;

  private rotation = new Quat();
  private targetRotation = new Quat();
  private distance = 1;
  private targetDistance = 1;
  private pan = [0, 0];
  private targetPan = [0, 0];

  private readonly pointers = new Map<number, { x: number; y: number }>();
  private dragMode: "rotate" | "pan" | null = null;
  private pinchStart: { dist: number; distance: number } | null = null;
  private readonly resizeObserver: ResizeObserver;
  private readonly disposers: (() => void)[] = [];
  private lastMarkers = "";
  private destroyed = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly callbacks: InspectionViewerCallbacks = {},
  ) {
    const app = new Application(canvas, {
      graphicsDeviceOptions: { alpha: true, antialias: true, premultipliedAlpha: true, powerPreference: "high-performance" },
      devtools: false,
    });
    this.app = app;
    app.setCanvasFillMode(FILLMODE_NONE);
    app.setCanvasResolution(RESOLUTION_AUTO);
    app.graphicsDevice.maxPixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    app.autoRender = false;
    app.scene.ambientLight = new Color(0.3, 0.3, 0.31);

    this.camera = new Entity("InspectionCamera");
    this.camera.addComponent("camera", {
      clearColor: new Color(0, 0, 0, 0),
      fov: FOV,
      nearClip: 0.01,
      farClip: 30,
      // Linear: as texturas já trazem a cor medida das fotos; outros operadores saturavam a
      // madeira (testado).
      toneMapping: TONEMAP_LINEAR,
      gammaCorrection: GAMMA_SRGB,
    });
    app.root.addChild(this.camera);

    // Iluminação própria do objeto inspecionado: luz principal quente do alto à esquerda,
    // preenchimento suave à direita e contraluz para destacar o contorno.
    const light = (name: string, euler: [number, number, number], intensity: number, color: Color) => {
      const e = new Entity(name);
      e.addComponent("light", { type: "directional", intensity, color, castShadows: false });
      e.setEulerAngles(...euler);
      app.root.addChild(e);
    };
    light("Key", [50, -35, 0], 1.15, new Color(1, 0.97, 0.92));
    light("Fill", [25, 60, 0], 0.45, new Color(0.9, 0.94, 1));
    light("Rim", [140, 0, 0], 0.45, new Color(1, 1, 1));

    this.pivot = new Entity("Pivot");
    app.root.addChild(this.pivot);

    app.on("update", (dt: number) => this.tick(dt));
    app.start();

    this.resizeObserver = new ResizeObserver(() => this.resize());
    // O canvas recebe tamanho fixo em px de `resizeCanvas`; quem muda de tamanho é o pai.
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
    this.resize();
    this.attachInput();
  }

  /** Aplicação PlayCanvas (somente inspeção e testes em desenvolvimento). */
  get application() {
    return this.app;
  }

  /** Mostra um item (substitui o atual). Resolve quando o modelo estiver visível. */
  async show(item: InspectionItem): Promise<void> {
    const token = ++this.loadToken;
    this.clearCurrent();
    const asset = await this.loadAsset(item.model.url);
    if (this.destroyed || token !== this.loadToken) return;

    const root = (asset.resource as { instantiateRenderEntity: () => EntityType }).instantiateRenderEntity();
    // Correção de eixos do arquivo (configurável por item).
    const orient = new Entity("Orient");
    orient.setLocalEulerAngles(...item.view.rotationDeg);
    orient.addChild(root);
    const holder = new Entity("Holder");
    holder.addChild(orient);
    this.pivot.addChild(holder);

    // Centraliza pela caixa delimitadora (no espaço do pivô, ainda sem rotação).
    this.pivot.setLocalRotation(Quat.IDENTITY);
    const box = worldBounds(root);
    holder.setLocalPosition(-box.center.x, -box.center.y, -box.center.z);
    const radius = Math.max(box.halfExtents.length(), 0.01);

    const markers = (item.markers ?? []).flatMap(({ node, label }) => {
      const entity = root.findByName(node) as EntityType | null;
      return entity ? [{ label, entity }] : [];
    });

    this.current = { item, root: holder, radius, fitDistance: this.fitDistance(radius), markers };
    this.reset(true);
  }

  /** Baixa um modelo antecipadamente (ex.: a próxima etapa). */
  preload(item: InspectionItem) {
    this.loadAsset(item.model.url).catch(() => undefined);
  }

  /** Volta à orientação, ao zoom e ao enquadramento iniciais do item. */
  reset(immediate = false) {
    const c = this.current;
    if (!c) return;
    const { yawDeg, pitchDeg } = c.item.view;
    this.targetRotation = new Quat().setFromEulerAngles(pitchDeg, 0, 0).mul(new Quat().setFromEulerAngles(0, yawDeg, 0));
    this.targetDistance = c.fitDistance;
    this.targetPan = [0, 0];
    if (immediate || reducedMotion()) {
      this.rotation.copy(this.targetRotation);
      this.distance = this.targetDistance;
      this.pan = [...this.targetPan];
    }
    this.app.renderNextFrame = true;
  }

  /** Aproxima (fator < 1) ou afasta (> 1). */
  zoomBy(factor: number) {
    const c = this.current;
    if (!c) return;
    this.targetDistance = clamp(this.targetDistance * factor, c.radius * MIN_DISTANCE_RADII, c.fitDistance * MAX_DISTANCE_FIT);
    this.app.renderNextFrame = true;
  }

  /** Gira pelos eixos da tela (graus). */
  rotateBy(yawDeg: number, pitchDeg: number) {
    const yaw = new Quat().setFromAxisAngle(Vec3.UP, yawDeg);
    const pitch = new Quat().setFromAxisAngle(Vec3.RIGHT, pitchDeg);
    this.targetRotation = yaw.mul(pitch).mul(this.targetRotation).normalize();
    this.app.renderNextFrame = true;
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.loadToken++;
    this.resizeObserver.disconnect();
    for (const dispose of this.disposers) dispose();
    this.pointers.clear();
    // O motor não devolve o contexto WebGL ao ser destruído; sem isto, abrir e fechar a
    // inspeção várias vezes acumularia contextos até o navegador descartar outros (inclusive
    // o do museu).
    const gl = (this.app.graphicsDevice as unknown as { gl?: WebGLRenderingContext | null }).gl;
    this.app.destroy();
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    this.cache.clear();
  }

  private loadAsset(url: string): Promise<Asset> {
    let promise = this.cache.get(url);
    if (!promise) {
      promise = new Promise<Asset>((resolve, reject) => {
        this.app.assets.loadFromUrl(url, "container", (err, asset) => {
          if (err || !asset) reject(new Error(typeof err === "string" ? err : `Falha ao carregar ${url}`));
          else resolve(asset);
        });
      });
      promise.catch(() => this.cache.delete(url));
      this.cache.set(url, promise);
    }
    return promise;
  }

  private clearCurrent() {
    this.current?.root.destroy();
    this.current = null;
    this.emitMarkers([]);
    this.app.renderNextFrame = true;
  }

  private fitDistance(radius: number) {
    const aspect = this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight) || 1;
    const halfV = (FOV / 2) * (Math.PI / 180);
    const halfH = Math.atan(Math.tan(halfV) * aspect);
    return (radius / Math.sin(Math.min(halfV, halfH))) * FIT_MARGIN;
  }

  private resize() {
    if (this.destroyed) return;
    const box = this.canvas.parentElement ?? this.canvas;
    const w = box.clientWidth;
    const h = box.clientHeight;
    if (!w || !h) return;
    this.app.resizeCanvas(w, h);
    const c = this.current;
    if (c) {
      const fit = this.fitDistance(c.radius);
      const ratio = fit / c.fitDistance;
      c.fitDistance = fit;
      this.targetDistance *= ratio;
      this.distance *= ratio;
    }
    this.app.renderNextFrame = true;
  }

  private tick(dt: number) {
    const c = this.current;
    if (!c) return;
    const k = reducedMotion() ? 1 : 1 - Math.exp(-dt * 16);
    let moving = false;

    const dotQ = Math.abs(
      this.rotation.x * this.targetRotation.x +
        this.rotation.y * this.targetRotation.y +
        this.rotation.z * this.targetRotation.z +
        this.rotation.w * this.targetRotation.w,
    );
    if (dotQ < 0.999999) {
      this.rotation.slerp(this.rotation, this.targetRotation, k);
      moving = true;
    } else this.rotation.copy(this.targetRotation);

    const step = (from: number, to: number, eps: number) => {
      if (Math.abs(to - from) < eps) return to;
      moving = true;
      return from + (to - from) * k;
    };
    const eps = c.radius * 1e-4;
    this.distance = step(this.distance, this.targetDistance, eps);
    this.pan = [step(this.pan[0], this.targetPan[0], eps), step(this.pan[1], this.targetPan[1], eps)];

    this.pivot.setLocalRotation(this.rotation);
    this.camera.setLocalPosition(this.pan[0], this.pan[1], this.distance);
    if (moving) this.app.renderNextFrame = true;
    if (this.app.renderNextFrame) this.updateMarkers();
  }

  private updateMarkers() {
    const c = this.current;
    if (!c || !c.markers.length) return;
    const camera = this.camera.camera;
    if (!camera) return;
    // Rótulos só com a frente do objeto voltada para o visitante.
    const front = this.rotation.transformVector(new Vec3(0, 0, 1));
    const frontFacing = front.z > 0.3;
    const screen = new Vec3();
    const markers = c.markers.map(({ label, entity }) => {
      const box = worldBounds(entity);
      const top = new Vec3(box.center.x, box.center.y + box.halfExtents.y, box.center.z + box.halfExtents.z);
      camera.worldToScreen(top, screen);
      return { label, x: screen.x, y: screen.y, visible: frontFacing && screen.z > 0 };
    });
    this.emitMarkers(markers);
  }

  private emitMarkers(markers: MarkerPosition[]) {
    const key = markers.map((m) => `${m.label}:${Math.round(m.x)},${Math.round(m.y)},${m.visible}`).join("|");
    if (key === this.lastMarkers) return;
    this.lastMarkers = key;
    this.callbacks.onMarkers?.(markers);
  }

  private attachInput() {
    const canvas = this.canvas;
    const on = <K extends keyof HTMLElementEventMap>(
      type: K,
      handler: (event: HTMLElementEventMap[K]) => void,
      options?: AddEventListenerOptions,
    ) => {
      canvas.addEventListener(type, handler, options);
      this.disposers.push(() => canvas.removeEventListener(type, handler, options));
    };

    const pinchDistance = () => {
      const [a, b] = [...this.pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };

    on("pointerdown", (e) => {
      canvas.setPointerCapture?.(e.pointerId);
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.pointers.size === 2) {
        this.dragMode = "pan";
        this.pinchStart = { dist: pinchDistance(), distance: this.targetDistance };
      } else {
        this.dragMode = e.button === 2 || e.shiftKey ? "pan" : "rotate";
      }
    });
    on("pointermove", (e) => {
      const prev = this.pointers.get(e.pointerId);
      if (!prev) return;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const c = this.current;
      if (!c) return;
      if (this.pointers.size >= 2 && this.pinchStart) {
        const ratio = this.pinchStart.dist / Math.max(1, pinchDistance());
        this.targetDistance = clamp(
          this.pinchStart.distance * ratio,
          c.radius * MIN_DISTANCE_RADII,
          c.fitDistance * MAX_DISTANCE_FIT,
        );
        // Dois dedos também deslocam (metade do movimento de cada dedo).
        this.panBy(dx / 2, dy / 2);
      } else if (this.dragMode === "pan") {
        this.panBy(dx, dy);
      } else if (this.dragMode === "rotate") {
        this.rotateDrag(dx, dy);
      }
      this.app.renderNextFrame = true;
    });
    const end = (e: PointerEvent) => {
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinchStart = null;
      if (this.pointers.size === 0) this.dragMode = null;
      else if (this.pointers.size === 1) this.dragMode = "rotate";
    };
    on("pointerup", end);
    on("pointercancel", end);
    on(
      "wheel",
      (e) => {
        e.preventDefault();
        const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
        this.zoomBy(Math.exp(clamp(delta, -200, 200) * 0.0015));
      },
      { passive: false },
    );
    on("dblclick", () => this.reset());
    on("contextmenu", (e) => e.preventDefault());
  }

  private rotateDrag(dx: number, dy: number) {
    // Arrastar na horizontal gira em torno do eixo vertical da tela; na vertical, em torno
    // do eixo horizontal (com limite para não virar de cabeça para baixo de uma vez).
    const pitch = clamp(dy * ROTATE_DEG_PER_PX, -PITCH_LIMIT_DEG, PITCH_LIMIT_DEG);
    this.rotateBy(dx * ROTATE_DEG_PER_PX, pitch);
  }

  private panBy(dx: number, dy: number) {
    const c = this.current;
    if (!c) return;
    // Pixels → metros no plano do objeto.
    const h = Math.max(1, this.canvas.clientHeight);
    const metersPerPx = (2 * this.targetDistance * Math.tan((FOV / 2) * (Math.PI / 180))) / h;
    const max = c.radius * MAX_PAN_RADII;
    this.targetPan = [
      clamp(this.targetPan[0] - dx * metersPerPx, -max, max),
      clamp(this.targetPan[1] + dy * metersPerPx, -max, max),
    ];
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Caixa delimitadora (mundo) de todas as malhas sob uma entidade. */
function worldBounds(entity: EntityType): BoundingBox {
  const box = new BoundingBox();
  let first = true;
  const renders = entity.findComponents("render") as unknown as { meshInstances: readonly MeshInstance[] }[];
  for (const render of renders) {
    for (const mi of render.meshInstances) {
      if (first) box.copy(mi.aabb);
      else box.add(mi.aabb);
      first = false;
    }
  }
  return box;
}
