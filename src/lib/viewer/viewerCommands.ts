/**
 * Comandos de estado do viewer usados pela ferramenta de calibração. Escritas em
 * `viewer.state` ficam concentradas aqui (chaves graváveis documentadas da API).
 */
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";

/** Alterna entre Walk e Fly (somente calibração). Walk exige `walkAllowed`. */
export function toggleWalkOrFly(viewer: ViewerHandle) {
  const { state } = viewer;
  if (!state.loaded) return;
  if (state.cameraMode === "walk") state.cameraMode = "fly";
  else if (state.walkAllowed) state.cameraMode = "walk";
}

/** Entra no Walk Mode se as pré-condições estiverem satisfeitas. */
export function enterWalkIfReady(viewer: ViewerHandle) {
  const { state } = viewer;
  if (state.loaded && state.walkAllowed && state.cameraMode !== "walk") state.cameraMode = "walk";
}

/** Liga/desliga a sobreposição de depuração dos voxels (requer WebGPU). */
export function toggleCollisionOverlay(viewer: ViewerHandle) {
  const { state } = viewer;
  if (state.hasCollisionOverlay) state.collisionOverlayEnabled = !state.collisionOverlayEnabled;
}

/**
 * Captura (ou libera) o mouse no Walk Mode em computadores: liga o modo de jogo do
 * viewer (`gamingControls`), que usa a Pointer Lock API — o cursor some e o movimento
 * do mouse gira a câmera. O viewer libera o cursor sozinho quando o navegador encerra
 * a captura (tecla Esc) e então volta `gamingControls` para false.
 *
 * Deve ser chamado dentro de um gesto do usuário (tecla ou clique): o navegador recusa
 * a captura fora disso. Em telas de toque o modo de jogo nunca é ligado.
 */
export function setMouseCapture(viewer: ViewerHandle, captured: boolean) {
  const { state } = viewer;
  if (captured && (!state.loaded || state.cameraMode !== "walk" || state.inputMode !== "desktop")) return;
  if (state.gamingControls !== captured) state.gamingControls = captured;
}
