/**
 * Adaptador de leitura da pose da câmera.
 *
 * A API pública do SuperSplat Viewer não expõe a pose da câmera. Este módulo é o único
 * ponto do projeto que lê o componente de câmera do PlayCanvas através de
 * `viewer.app` (campo público do handle, "para o que a API não cobre"). Somente leitura:
 * nada aqui altera o estado do viewer.
 */
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";
import type { CameraComponent } from "playcanvas";

import { anglesFromDirection } from "@/data/visit";

export type CameraReading = {
  position: [number, number, number];
  forward: [number, number, number];
  yawDeg: number;
  pitchDeg: number;
  fov: number;
};

const round = (n: number, digits = 3) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

export function readCameraPose(viewer: ViewerHandle): CameraReading | null {
  const camera = viewer.app.root.findComponents("camera")[0] as CameraComponent | undefined;
  if (!camera) return null;
  const p = camera.entity.getPosition();
  const f = camera.entity.forward;
  const forward: [number, number, number] = [f.x, f.y, f.z];
  const { yawDeg, pitchDeg } = anglesFromDirection(forward);
  return {
    position: [round(p.x), round(p.y), round(p.z)],
    forward: [round(f.x), round(f.y), round(f.z)],
    yawDeg: round(yawDeg, 1),
    pitchDeg: round(pitchDeg, 1),
    fov: round(camera.fov, 1),
  };
}
