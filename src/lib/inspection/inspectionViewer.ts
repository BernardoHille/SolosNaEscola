/**
 * Visualizador dos modelos inspecionados (GLB), independente do viewer do Gaussian Splatting.
 *
 * Usa uma segunda aplicação PlayCanvas (o motor já instalado, compartilhado com o viewer)
 * num canvas próprio e transparente, sobreposto ao museu escurecido. O splat continua
 * desenhado ao fundo, sem ser recarregado nem redesenhado enquanto a inspeção está aberta.
 *
 * - Renderização sob demanda: só desenha quando algo muda (arrasto, zoom, carregamento).
 * - Iluminação de estúdio: ambiente procedural (IBL, sem arquivo HDR) com uma janela de luz
 *   suave, luz principal com sombras suaves (a rocha sombreia o fundo e as paredes da caixa)
 *   e contraluz. As luzes ficam paradas e o objeto gira, como numa mesa giratória.
 * - Câmera fixa olhando para −Z; o objeto gira em torno do centro da sua caixa delimitadora.
 * - Arrastar gira o objeto livremente (eixos da tela); roda/pinça aproxima dentro de limites
 *   que impedem a câmera de entrar no objeto; botão direito, Shift+arrastar ou dois dedos
 *   deslocam a vista de forma limitada; duplo clique restaura a orientação inicial.
 * - Itens com recipiente (`container`): clicar/tocar na caixa ou no conteúdo (a rocha) esmaece a
 *   caixa e reenquadra só o conteúdo; clicar na rocha de novo devolve a caixa.
 * - Modelos carregados sob demanda e guardados enquanto a inspeção está aberta (voltar a uma
 *   etapa não baixa de novo); `destroy()` libera tudo.
 */
import {
  ADDRESS_CLAMP_TO_EDGE,
  ADDRESS_REPEAT,
  Application,
  type Asset,
  BLEND_NONE,
  BLEND_NORMAL,
  BoundingBox,
  Color,
  type Entity as EntityType,
  Entity,
  EnvLighting,
  FILLMODE_NONE,
  FILTER_LINEAR,
  GAMMA_SRGB,
  type GraphicsDevice,
  LAYERID_WORLD,
  type MeshInstance,
  PIXELFORMAT_RGBA8,
  Quat,
  Ray,
  RESOLUTION_AUTO,
  SHADOW_PCF5_32F,
  type StandardMaterial,
  Texture,
  TEXTUREPROJECTION_EQUIRECT,
  TEXTURETYPE_RGBM,
  TONEMAP_ACES2,
  Vec3,
} from "playcanvas";

import type { InspectionItem } from "@/data/inspection";

export type MarkerPosition = { label: string; x: number; y: number; visible: boolean };

/** Estado do recipiente do item atual (caixa de madeira das rochas). */
export type ContainerState = { available: boolean; detached: boolean };

export type InspectionViewerCallbacks = {
  /** Posições na tela (px) dos rótulos do modelo atual; vazio se não houver. */
  onMarkers?: (markers: MarkerPosition[]) => void;
  /** O item atual tem recipiente? O conteúdo está fora dele? */
  onContainer?: (state: ContainerState) => void;
};

const FOV = 30;
/** Folga do enquadramento inicial (deixa espaço para a interface). */
const FIT_MARGIN = 1.35;
/** Distância mínima em raios da esfera envolvente: a câmera nunca entra no objeto. */
const MIN_DISTANCE_RADII = 1.08;
const MAX_DISTANCE_FIT = 2.2;
/** Deslocamento máximo da vista, em raios. */
const MAX_PAN_RADII = 0.6;
const ROTATE_DEG_PER_PX = 0.35;
const PITCH_LIMIT_DEG = 85;
/** Clique: até este deslocamento (px) e duração (ms). */
const CLICK_SLOP_PX = 6;
const CLICK_MAX_MS = 450;
/** Espera por um segundo clique (duplo clique restaura a vista, não alterna a caixa). */
const DOUBLE_CLICK_MS = 260;
/** Esmaecimento da caixa (s). */
const CONTAINER_FADE_S = 0.28;

/**
 * De onde vem a luz principal (câmera olhando para −Z): do alto, à esquerda e um pouco à
 * frente. A sombra da rocha cai para a direita e para o fundo, dentro da caixa.
 */
const KEY_FROM: [number, number, number] = [-0.7, 1.2, 0.6];
const RIM_FROM: [number, number, number] = [0.6, 0.5, -1];
/** Intensidade do ambiente (IBL): mais baixa que a luz principal, para dar volume. */
const ENVIRONMENT_INTENSITY = 0.6;

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

type Frame = { center: Vec3; radius: number };

type Loaded = {
  item: InspectionItem;
  holder: EntityType;
  full: Frame;
  /** Enquadramento só do conteúdo (sem o recipiente), se houver recipiente. */
  content: Frame | null;
  container: EntityType | null;
  contentMeshes: MeshInstance[];
  fitDistance: number;
  markers: { label: string; entity: EntityType }[];
};

export class InspectionViewer {
  private readonly app: Application;
  private readonly camera: Entity;
  private readonly keyLight: Entity;
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
  private center = new Vec3();
  private targetCenter = new Vec3();

  /** Conteúdo fora do recipiente? */
  private detached = false;
  /** Opacidade atual e alvo do recipiente (1 = visível). */
  private containerOpacity = 1;
  private containerTarget = 1;

  private readonly pointers = new Map<number, { x: number; y: number }>();
  private dragMode: "rotate" | "pan" | null = null;
  private pinchStart: { dist: number; distance: number } | null = null;
  private press: { x: number; y: number; time: number } | null = null;
  private clickTimer: number | undefined;
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

    // Ambiente de estúdio (IBL): luz difusa direcional e reflexos suaves. Sem céu visível:
    // a câmera só desenha a camada do mundo e o fundo continua transparente.
    app.scene.ambientLight = new Color(0, 0, 0);
    app.scene.envAtlas = createStudioEnvironment(app.graphicsDevice);
    app.scene.skyboxIntensity = ENVIRONMENT_INTENSITY;

    this.camera = new Entity("InspectionCamera");
    this.camera.addComponent("camera", {
      clearColor: new Color(0, 0, 0, 0),
      fov: FOV,
      nearClip: 0.01,
      farClip: 30,
      layers: [LAYERID_WORLD],
      // ACES 2: comprime os realces (etiqueta, divisórias brancas) e dá contraste de foto sem
      // a saturação do ACES clássico; com a iluminação de estúdio foi o mais próximo das
      // fotos de referência (comparado com linear, neutro e ACES).
      toneMapping: TONEMAP_ACES2,
      gammaCorrection: GAMMA_SRGB,
    });
    app.root.addChild(this.camera);

    // Luz principal com sombra suave e contraluz fria para destacar o contorno.
    this.keyLight = new Entity("Key");
    this.keyLight.addComponent("light", {
      type: "directional",
      intensity: 2,
      color: new Color(1, 0.96, 0.9),
      castShadows: true,
      shadowType: SHADOW_PCF5_32F,
      shadowResolution: 2048,
      // Objetos pequenos (≈ 30 cm): viés baixo, senão a sombra da rocha some (medido).
      shadowBias: 0.008,
      normalOffsetBias: 0.01,
      shadowDistance: 4,
    });
    this.keyLight.setRotation(lightRotationFrom(KEY_FROM));
    app.root.addChild(this.keyLight);
    const rim = new Entity("Rim");
    rim.addComponent("light", { type: "directional", intensity: 0.45, color: new Color(0.88, 0.93, 1), castShadows: false });
    rim.setRotation(lightRotationFrom(RIM_FROM));
    app.root.addChild(rim);

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

    // Enquadramentos medidos no espaço do pivô, ainda sem rotação nem deslocamento.
    this.pivot.setLocalRotation(Quat.IDENTITY);
    holder.setLocalPosition(0, 0, 0);
    const full = frameOf(meshInstancesOf(root));

    const container = item.container ? containerOf(root, item.container) : null;
    let content: Frame | null = null;
    let contentMeshes: MeshInstance[] = [];
    if (container) {
      const inContainer = new Set(meshInstancesOf(container));
      contentMeshes = meshInstancesOf(root).filter((mi) => !inContainer.has(mi));
      if (contentMeshes.length) content = frameOf(contentMeshes);
    }

    const markers = (item.markers ?? []).flatMap(({ node, label }) => {
      const entity = root.findByName(node) as EntityType | null;
      return entity ? [{ label, entity }] : [];
    });

    this.current = {
      item,
      holder,
      full,
      content,
      container: content ? container : null,
      contentMeshes,
      fitDistance: this.fitDistance(full.radius),
      markers,
    };
    this.detached = false;
    this.containerOpacity = 1;
    this.containerTarget = 1;
    this.emitContainer();
    this.reset(true);
  }

  /** Baixa um modelo antecipadamente (ex.: a próxima etapa). */
  preload(item: InspectionItem) {
    this.loadAsset(item.model.url).catch(() => undefined);
  }

  /** Volta à orientação, ao zoom e ao enquadramento iniciais do item (mantém a caixa como está). */
  reset(immediate = false) {
    const c = this.current;
    if (!c) return;
    const { yawDeg, pitchDeg } = c.item.view;
    this.targetRotation = new Quat().setFromEulerAngles(pitchDeg, 0, 0).mul(new Quat().setFromEulerAngles(0, yawDeg, 0));
    const frame = this.frame();
    c.fitDistance = this.fitDistance(frame.radius);
    this.targetDistance = c.fitDistance;
    this.targetPan = [0, 0];
    this.targetCenter.copy(frame.center);
    if (immediate || reducedMotion()) {
      this.rotation.copy(this.targetRotation);
      this.distance = this.targetDistance;
      this.pan = [...this.targetPan];
      this.center.copy(this.targetCenter);
    }
    this.app.renderNextFrame = true;
  }

  /** Aproxima (fator < 1) ou afasta (> 1). */
  zoomBy(factor: number) {
    const c = this.current;
    if (!c) return;
    this.targetDistance = clamp(this.targetDistance * factor, this.frame().radius * MIN_DISTANCE_RADII, c.fitDistance * MAX_DISTANCE_FIT);
    this.app.renderNextFrame = true;
  }

  /** Gira pelos eixos da tela (graus). */
  rotateBy(yawDeg: number, pitchDeg: number) {
    const yaw = new Quat().setFromAxisAngle(Vec3.UP, yawDeg);
    const pitch = new Quat().setFromAxisAngle(Vec3.RIGHT, pitchDeg);
    this.targetRotation = yaw.mul(pitch).mul(this.targetRotation).normalize();
    this.app.renderNextFrame = true;
  }

  /**
   * Tira o conteúdo do recipiente (esmaece a caixa e enquadra só a rocha) ou o devolve.
   * Sem argumento, alterna.
   */
  setDetached(detached = !this.detached) {
    const c = this.current;
    if (!c?.container || detached === this.detached) return;
    this.detached = detached;
    this.containerTarget = detached ? 0 : 1;
    if (!detached) c.container.enabled = true;
    setCastShadows(c.container, !detached);
    const frame = this.frame();
    const fit = this.fitDistance(frame.radius);
    // Mantém o zoom relativo do visitante ao trocar de enquadramento.
    this.targetDistance = clamp((this.targetDistance / c.fitDistance) * fit, frame.radius * MIN_DISTANCE_RADII, fit * MAX_DISTANCE_FIT);
    c.fitDistance = fit;
    this.targetCenter.copy(frame.center);
    this.targetPan = [0, 0];
    if (reducedMotion()) {
      this.containerOpacity = this.containerTarget;
      this.distance = this.targetDistance;
      this.center.copy(this.targetCenter);
      this.pan = [0, 0];
    }
    this.applyContainerOpacity();
    this.emitContainer();
    this.app.renderNextFrame = true;
  }

  /**
   * Imagem do quadro atual (PNG, fundo transparente). Usada para gerar as miniaturas da
   * sequência em desenvolvimento.
   */
  snapshot(): string {
    this.tick(0);
    this.app.render();
    return this.canvas.toDataURL("image/png");
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.loadToken++;
    window.clearTimeout(this.clickTimer);
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

  private frame(): Frame {
    const c = this.current!;
    return this.detached && c.content ? c.content : c.full;
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
    const c = this.current;
    if (c?.container) restoreOpaque(c.container);
    c?.holder.destroy();
    this.current = null;
    this.detached = false;
    this.emitMarkers([]);
    this.emitContainer();
    this.app.renderNextFrame = true;
  }

  private emitContainer() {
    this.callbacks.onContainer?.({ available: !!this.current?.container, detached: this.detached });
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
      const fit = this.fitDistance(this.frame().radius);
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
    const eps = c.full.radius * 1e-4;
    this.distance = step(this.distance, this.targetDistance, eps);
    this.pan = [step(this.pan[0], this.targetPan[0], eps), step(this.pan[1], this.targetPan[1], eps)];
    this.center.set(
      step(this.center.x, this.targetCenter.x, eps),
      step(this.center.y, this.targetCenter.y, eps),
      step(this.center.z, this.targetCenter.z, eps),
    );

    // Esmaecimento da caixa, em velocidade constante.
    if (this.containerOpacity !== this.containerTarget) {
      const delta = dt / CONTAINER_FADE_S;
      this.containerOpacity =
        this.containerTarget > this.containerOpacity
          ? Math.min(this.containerTarget, this.containerOpacity + delta)
          : Math.max(this.containerTarget, this.containerOpacity - delta);
      this.applyContainerOpacity();
      moving = true;
    }

    this.pivot.setLocalRotation(this.rotation);
    c.holder.setLocalPosition(-this.center.x, -this.center.y, -this.center.z);
    this.camera.setLocalPosition(this.pan[0], this.pan[1], this.distance);
    // Sombras só até onde a câmera pode estar (resolução melhor).
    const light = this.keyLight.light;
    if (light) light.shadowDistance = this.distance + c.full.radius * 2;
    if (moving) this.app.renderNextFrame = true;
    if (this.app.renderNextFrame) this.updateMarkers();
  }

  private applyContainerOpacity() {
    const container = this.current?.container;
    if (!container) return;
    const opacity = this.containerOpacity;
    if (opacity <= 0) {
      container.enabled = false;
      restoreOpaque(container);
      return;
    }
    container.enabled = true;
    if (opacity >= 1) {
      restoreOpaque(container);
      return;
    }
    for (const material of materialsOf(container)) {
      material.blendType = BLEND_NORMAL;
      material.opacity = opacity;
      material.depthWrite = false;
      material.update();
    }
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
      const box = worldBounds(meshInstancesOf(entity));
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

  /**
   * O ponto da tela (px do canvas) está sobre um item com recipiente: a caixa (enquanto
   * visível) ou o conteúdo (a rocha)? Testa as caixas delimitadoras das malhas — as paredes
   * são malhas separadas, com caixas justas.
   */
  private hitsContent(x: number, y: number) {
    const c = this.current;
    const camera = this.camera.camera;
    if (!c?.content || !c.container || !camera) return false;
    const near = camera.screenToWorld(x, y, camera.nearClip);
    const far = camera.screenToWorld(x, y, camera.farClip);
    const ray = new Ray(near, far.sub(near).normalize());
    // Sem a caixa, só a rocha recebe o clique (que devolve a caixa).
    const meshes = this.detached ? c.contentMeshes : [...c.contentMeshes, ...meshInstancesOf(c.container)];
    return meshes.some((mi) => mi.aabb.intersectsRay(ray));
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
    const local = (e: PointerEvent | MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top] as const;
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
        this.press = null;
        this.pinchStart = { dist: pinchDistance(), distance: this.targetDistance };
      } else {
        this.dragMode = e.button === 2 || e.shiftKey ? "pan" : "rotate";
        this.press = e.button === 0 ? { x: e.clientX, y: e.clientY, time: performance.now() } : null;
      }
      canvas.style.cursor = "grabbing";
    });
    on("pointermove", (e) => {
      const prev = this.pointers.get(e.pointerId);
      if (!prev) {
        // Sem botão pressionado: indica onde o clique tira a rocha da caixa (ou a devolve).
        if (e.pointerType === "mouse") canvas.style.cursor = this.hitsContent(...local(e)) ? "pointer" : "grab";
        return;
      }
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (this.press && Math.hypot(e.clientX - this.press.x, e.clientY - this.press.y) > CLICK_SLOP_PX) this.press = null;
      const c = this.current;
      if (!c) return;
      if (this.pointers.size >= 2 && this.pinchStart) {
        const ratio = this.pinchStart.dist / Math.max(1, pinchDistance());
        this.targetDistance = clamp(
          this.pinchStart.distance * ratio,
          this.frame().radius * MIN_DISTANCE_RADII,
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
      const press = this.press;
      this.press = null;
      if (
        e.type === "pointerup" &&
        press &&
        this.pointers.size === 1 &&
        performance.now() - press.time < CLICK_MAX_MS &&
        this.hitsContent(...local(e))
      ) {
        // Aguarda um possível segundo clique (duplo clique restaura a vista).
        window.clearTimeout(this.clickTimer);
        this.clickTimer = window.setTimeout(() => this.setDetached(), DOUBLE_CLICK_MS);
      }
      this.pointers.delete(e.pointerId);
      if (this.pointers.size < 2) this.pinchStart = null;
      if (this.pointers.size === 0) this.dragMode = null;
      else if (this.pointers.size === 1) this.dragMode = "rotate";
      if (this.pointers.size === 0) canvas.style.cursor = "grab";
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
    on("dblclick", () => {
      window.clearTimeout(this.clickTimer);
      this.reset();
    });
    on("contextmenu", (e) => e.preventDefault());
    canvas.style.cursor = "grab";
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
    const max = this.frame().radius * MAX_PAN_RADII;
    this.targetPan = [
      clamp(this.targetPan[0] - dx * metersPerPx, -max, max),
      clamp(this.targetPan[1] + dy * metersPerPx, -max, max),
    ];
  }
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Rotação de uma luz direcional que vem de `from` (a luz aponta para o seu −Y local). */
function lightRotationFrom(from: [number, number, number]): Quat {
  const to = new Vec3(-from[0], -from[1], -from[2]).normalize();
  const down = new Vec3(0, -1, 0);
  const axis = new Vec3().cross(down, to);
  const angle = Math.acos(clamp(down.dot(to), -1, 1)) * (180 / Math.PI);
  return axis.length() < 1e-6 ? new Quat() : new Quat().setFromAxisAngle(axis.normalize(), angle);
}

/**
 * Recipiente do item: um nó do GLB (caixa de madeira) ou vários (bandeja de cartão em cinco
 * peças e a etiqueta). Vários nós são reunidos num grupo novo, filho da mesma raiz, com a
 * transformação local preservada — o arquivo não muda, só a hierarquia em memória.
 */
function containerOf(root: EntityType, spec: NonNullable<InspectionItem["container"]>): EntityType | null {
  if ("node" in spec) return (root.findByName(spec.node) as EntityType | null) ?? null;
  const parts = spec.nodes.map((n) => root.findByName(n) as EntityType | null).filter((e): e is EntityType => !!e);
  if (!parts.length) return null;
  const group = new Entity("Recipiente");
  root.addChild(group);
  for (const part of parts) {
    const parent = part.parent;
    if (parent === root) {
      root.removeChild(part);
      group.addChild(part);
    } else {
      part.reparent(group);
    }
  }
  return group;
}

function meshInstancesOf(entity: EntityType): MeshInstance[] {
  const renders = entity.findComponents("render") as unknown as { meshInstances: readonly MeshInstance[] }[];
  return renders.flatMap((r) => [...r.meshInstances]);
}

function materialsOf(entity: EntityType): StandardMaterial[] {
  return [...new Set(meshInstancesOf(entity).map((mi) => mi.material as StandardMaterial))];
}

function setCastShadows(entity: EntityType, cast: boolean) {
  for (const render of entity.findComponents("render") as unknown as { castShadows: boolean }[]) render.castShadows = cast;
}

function restoreOpaque(entity: EntityType) {
  for (const material of materialsOf(entity)) {
    if (material.blendType === BLEND_NONE && material.opacity === 1) continue;
    material.blendType = BLEND_NONE;
    material.opacity = 1;
    material.depthWrite = true;
    material.update();
  }
}

/** Caixa delimitadora (mundo) de um conjunto de malhas. */
function worldBounds(meshes: MeshInstance[]): BoundingBox {
  const box = new BoundingBox();
  meshes.forEach((mi, i) => (i === 0 ? box.copy(mi.aabb) : box.add(mi.aabb)));
  return box;
}

function frameOf(meshes: MeshInstance[]): Frame {
  const box = worldBounds(meshes);
  return { center: box.center.clone(), radius: Math.max(box.halfExtents.length(), 0.01) };
}

/**
 * Ambiente de estúdio procedural (equiretangular, RGBM): céu claro e neutro, horizonte médio,
 * chão escuro e uma janela de luz grande e suave no alto, do lado da luz principal. Gera o
 * atlas de iluminação (difusa + reflexos pré-filtrados) usado pelos materiais PBR.
 */
function createStudioEnvironment(device: GraphicsDevice): Texture {
  const width = 256;
  const height = 128;
  const data = new Uint8Array(width * height * 4);
  // Janela de luz: direção aproximada da luz principal (de cima, à esquerda e à frente).
  const key = normalize3([-0.45, 0.8, 0.4]);
  const rim = normalize3([0.3, 0.35, -0.9]);
  for (let y = 0; y < height; y++) {
    const elevation = Math.PI / 2 - ((y + 0.5) / height) * Math.PI;
    const ce = Math.cos(elevation);
    const se = Math.sin(elevation);
    for (let x = 0; x < width; x++) {
      const azimuth = ((x + 0.5) / width) * Math.PI * 2;
      const dir = [ce * Math.sin(azimuth), se, ce * Math.cos(azimuth)];
      let rgb: number[];
      if (se >= 0) {
        const t = Math.pow(se, 0.6);
        rgb = mix([0.34, 0.32, 0.3], [0.6, 0.6, 0.6], t);
      } else {
        const t = Math.pow(-se, 0.5);
        rgb = mix([0.22, 0.2, 0.18], [0.06, 0.055, 0.05], t);
      }
      const k = smoothstep(0.82, 0.95, dot3(dir, key));
      const r = smoothstep(0.9, 0.97, dot3(dir, rim));
      rgb = rgb.map((v, i) => v + k * [3.2, 3.05, 2.85][i] + r * [0.9, 0.95, 1.0][i]);
      // RGBM com raiz quadrada (decodificação do motor: (8·a·rgb)²).
      const s = rgb.map(Math.sqrt);
      const m = Math.min(1, Math.max(...s, 1e-4) / 8);
      const a = Math.ceil(m * 255) / 255;
      const o = (y * width + x) * 4;
      for (let i = 0; i < 3; i++) data[o + i] = Math.round(clamp(s[i] / (a * 8), 0, 1) * 255);
      data[o + 3] = Math.round(a * 255);
    }
  }
  const equirect = new Texture(device, {
    name: "StudioEnvironment",
    width,
    height,
    format: PIXELFORMAT_RGBA8,
    type: TEXTURETYPE_RGBM,
    projection: TEXTUREPROJECTION_EQUIRECT,
    mipmaps: false,
    minFilter: FILTER_LINEAR,
    magFilter: FILTER_LINEAR,
    addressU: ADDRESS_REPEAT,
    addressV: ADDRESS_CLAMP_TO_EDGE,
    levels: [data],
  });
  const source = EnvLighting.generateLightingSource(equirect, { size: 128 });
  const atlas = EnvLighting.generateAtlas(source, { size: 512 });
  equirect.destroy();
  source.destroy();
  return atlas;
}

const mix = (a: number[], b: number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
const dot3 = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const normalize3 = (a: number[]) => {
  const l = Math.hypot(a[0], a[1], a[2]);
  return a.map((v) => v / l);
};
