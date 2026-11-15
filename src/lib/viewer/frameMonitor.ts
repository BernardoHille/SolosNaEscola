/**
 * Monitor de quadros do motor, compartilhado pelo controlador automático e pelo diagnóstico.
 *
 * Do laço do PlayCanvas (`AppBase.tick`):
 * - `frameupdate` abre cada tick e `frameend` o fecha: a diferença é o tempo de CPU do tick
 *   (atualização + envio dos comandos de desenho). Não é o tempo de GPU.
 * - `postrender` só dispara quando o tick desenhou. O viewer desenha sob demanda: com a câmera
 *   parada, os ticks seguem sem desenho ("ociosos"), no ritmo da tela.
 * - `frame:ready` do sistema gsplat informa quantos arquivos de blocos estão sendo carregados.
 *   Um quadro é marcado como "streaming" quando havia carga em andamento ou terminou há pouco.
 *
 * Os quadros são entregues aos ouvintes sem cópia de estado do motor.
 */
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";

export type MonitoredFrame = {
  t: number;
  /** Intervalo desde o tick anterior (ms). */
  dt: number;
  /** Tempo de CPU do tick (ms). */
  cpuMs: number;
  rendered: boolean;
  streaming: boolean;
  /** Arquivos de blocos em carga no último `frame:ready`. */
  loading: number;
};

/** Depois que a carga zera, os quadros ainda contam como streaming por este tempo (decodificação, upload). */
const STREAMING_TAIL_MS = 600;

type GsplatSystemEvents = {
  on(name: "frame:ready", cb: (camera: unknown, layer: unknown, ready: boolean, loading: number) => void): unknown;
  off(name: "frame:ready", cb: (camera: unknown, layer: unknown, ready: boolean, loading: number) => void): unknown;
};

export function monitorFrames(viewer: ViewerHandle, listener: (frame: MonitoredFrame) => void) {
  const { app } = viewer;
  let tickStart = 0;
  let lastTick: number | null = null;
  let rendered = false;
  let loading = 0;
  let lastLoadingAt = -Infinity;

  const onUpdate = () => {
    tickStart = performance.now();
    rendered = false;
  };
  const onRender = () => {
    rendered = true;
  };
  const onEnd = () => {
    const now = performance.now();
    const dt = lastTick === null ? 0 : now - lastTick;
    lastTick = now;
    listener({
      t: now,
      dt,
      cpuMs: now - tickStart,
      rendered,
      streaming: loading > 0 || now - lastLoadingAt < STREAMING_TAIL_MS,
      loading,
    });
  };
  const onReady = (_camera: unknown, _layer: unknown, _ready: boolean, count: number) => {
    loading = count;
    if (count > 0) lastLoadingAt = performance.now();
  };

  const gsplatSystem = (app.systems as unknown as { gsplat?: GsplatSystemEvents }).gsplat;
  app.on("frameupdate", onUpdate);
  app.on("postrender", onRender);
  app.on("frameend", onEnd);
  gsplatSystem?.on("frame:ready", onReady);
  return () => {
    app.off("frameupdate", onUpdate);
    app.off("postrender", onRender);
    app.off("frameend", onEnd);
    gsplatSystem?.off("frame:ready", onReady);
  };
}
