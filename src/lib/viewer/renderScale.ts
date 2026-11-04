/**
 * Resolução de renderização da visita (modos de qualidade, ver `src/data/quality.ts`).
 *
 * O viewer dimensiona o backbuffer do canvas a partir do tamanho CSS do próprio canvas
 * (observado com ResizeObserver) multiplicado pela densidade de pixels limitada. Para
 * renderizar com uma fração `s` da resolução sem tocar no código do viewer, o canvas passa a
 * ocupar `s` × 100% do contêiner e é ampliado de volta com `transform: scale(1/s)`: o viewer
 * desenha menos pixels e a imagem continua cobrindo a tela inteira.
 *
 * As coordenadas de entrada continuam corretas: o olhar usa deslocamentos (movementX, screenX)
 * e a escolha de um ponto no piso usa `offsetX / clientWidth`, ambos no espaço local do canvas.
 */
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";

export function applyRenderScale(viewer: ViewerHandle, scale: number) {
  const canvas = viewer.app.graphicsDevice.canvas as HTMLCanvasElement | undefined;
  if (!canvas) return;
  const { style } = canvas;
  if (!(scale > 0) || scale >= 1) {
    style.removeProperty("width");
    style.removeProperty("height");
    style.removeProperty("transform");
    style.removeProperty("transform-origin");
  } else {
    style.width = `${scale * 100}%`;
    style.height = `${scale * 100}%`;
    style.transformOrigin = "0 0";
    style.transform = `scale(${1 / scale})`;
  }
  viewer.app.renderNextFrame = true;
}

/**
 * Mantém o "Quality" nativo do viewer num nível de resolução cheia. Em celulares o viewer
 * começa em `performance`, que já corta a resolução pela metade; somado à escala da visita,
 * isso dobraria a redução. O nível escolhido é o primeiro disponível acima de `performance`
 * (o orçamento de splats não afeta o SOG de arquivo único).
 */
export function pinViewerQuality(viewer: ViewerHandle) {
  const { state, events } = viewer;
  const pin = () => {
    if (state.quality !== "performance") return;
    const full = state.qualityAvailable.find((level) => level !== "performance");
    if (full) state.quality = full;
  };
  pin();
  const handles = [events.on("quality:changed", pin), events.on("qualityAvailable:changed", pin)];
  return () => handles.forEach((handle) => handle.off());
}
