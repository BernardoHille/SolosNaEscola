/**
 * Enquadramento da imagem na telinha do microscópio: `zoom` (1 = imagem inteira) e o ponto da imagem no
 * centro da tela (`cx`, `cy`, de 0 a 1). Em frações, para valer em qualquer tamanho de tela.
 */
export type MicroscopeView = { zoom: number; cx: number; cy: number };

export const MICROSCOPE_HOME: MicroscopeView = { zoom: 1, cx: 0.5, cy: 0.5 };

/** Acima disso, a imagem (cerca de 1670 px de largura) já aparece borrada numa tela comum. */
export const MICROSCOPE_MAX_ZOOM = 5;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/** A imagem sempre cobre a tela: sem bordas vazias, em qualquer zoom. */
export function clampView({ zoom, cx, cy }: MicroscopeView): MicroscopeView {
  const z = clamp(zoom, 1, MICROSCOPE_MAX_ZOOM);
  const half = 0.5 / z;
  return { zoom: z, cx: clamp(cx, half, 1 - half), cy: clamp(cy, half, 1 - half) };
}

/** Multiplica o zoom mantendo parado o ponto da imagem sob (`sx`, `sy`), em frações da tela. */
export function zoomAt(view: MicroscopeView, factor: number, sx = 0.5, sy = 0.5): MicroscopeView {
  const zoom = clamp(view.zoom * factor, 1, MICROSCOPE_MAX_ZOOM);
  const px = view.cx + (sx - 0.5) / view.zoom;
  const py = view.cy + (sy - 0.5) / view.zoom;
  return clampView({ zoom, cx: px - (sx - 0.5) / zoom, cy: py - (sy - 0.5) / zoom });
}

/** Arrasta a imagem por (`dx`, `dy`), em frações da tela: ela acompanha o dedo ou o cursor. */
export function panBy(view: MicroscopeView, dx: number, dy: number): MicroscopeView {
  return clampView({ zoom: view.zoom, cx: view.cx - dx / view.zoom, cy: view.cy - dy / view.zoom });
}

/** `transform` CSS da imagem, que ocupa a tela inteira com a origem no centro. */
export function viewTransform({ zoom, cx, cy }: MicroscopeView): string {
  return `scale(${zoom}) translate(${(0.5 - cx) * 100}%, ${(0.5 - cy) * 100}%)`;
}
