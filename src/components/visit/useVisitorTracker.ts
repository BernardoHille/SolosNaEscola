"use client";

import { useEffect, useMemo, useRef } from "react";
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";
import type { CameraComponent } from "playcanvas";

import { anglesFromDirection } from "@/data/visit";

/** Posição do visitante no plano X/Z e direção horizontal do olhar (yaw de `visit.ts`). */
export type VisitorPose = { x: number; z: number; yawDeg: number };

export type VisitorTracker = {
  /** Última pose lida (null antes do primeiro quadro). */
  get: () => VisitorPose | null;
  /** Recebe a pose a cada quadro em que a câmera mudou; devolve a função de cancelamento. */
  subscribe: (listener: (pose: VisitorPose) => void) => () => void;
};

/**
 * Posição e orientação do visitante, lidas da câmera do viewer a cada quadro renderizado
 * (`postrender`). O viewer só redesenha quando algo muda, então isso não cria um laço de
 * renderização nem força o splat a ser redesenhado; parado, nada é recalculado.
 *
 * Os ouvintes atualizam o DOM diretamente (marcador do mapa, seta): sem estado React por quadro.
 * Somente leitura (mesmo acesso de `cameraPose.ts`): nada aqui altera a câmera.
 */
export function useVisitorTracker(viewer: ViewerHandle | null): VisitorTracker {
  const poseRef = useRef<VisitorPose | null>(null);
  const listenersRef = useRef(new Set<(pose: VisitorPose) => void>());

  useEffect(() => {
    if (!viewer) return;
    let camera: CameraComponent | undefined;
    const read = () => {
      camera ??= viewer.app.root.findComponents("camera")[0] as CameraComponent | undefined;
      if (!camera) return;
      const p = camera.entity.getPosition();
      const f = camera.entity.forward;
      const last = poseRef.current;
      const { yawDeg } = anglesFromDirection([f.x, f.y, f.z]);
      if (last && Math.abs(last.x - p.x) < 1e-4 && Math.abs(last.z - p.z) < 1e-4 && Math.abs(last.yawDeg - yawDeg) < 0.05)
        return;
      const pose = { x: p.x, z: p.z, yawDeg };
      poseRef.current = pose;
      for (const listener of listenersRef.current) listener(pose);
    };
    read();
    viewer.app.on("postrender", read);
    return () => {
      viewer.app.off("postrender", read);
      poseRef.current = null;
    };
  }, [viewer]);

  return useMemo(
    () => ({
      get: () => poseRef.current,
      subscribe: (listener) => {
        listenersRef.current.add(listener);
        if (poseRef.current) listener(poseRef.current);
        return () => listenersRef.current.delete(listener);
      },
    }),
    [],
  );
}
