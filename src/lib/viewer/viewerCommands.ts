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
