"use client";

import { useEffect, useState } from "react";

import { NAV_GRID } from "@/data/exhibitionModules";
import { hasArrived, type ExhibitionModule } from "@/lib/visit/exhibitionModules";
import type { Point } from "@/lib/visit/mapGeometry";
import { findPath } from "@/lib/visit/pathfinding";

import type { VisitorTracker } from "./useVisitorTracker";

/** Recalcula o percurso quando o visitante andou isto (m) desde o último cálculo... */
const RECOMPUTE_DISTANCE = 0.35;
/** ...e no máximo uma vez neste intervalo (ms). */
const RECOMPUTE_INTERVAL_MS = 300;

export type Guidance = {
  /** Percurso caminhável até a parada do módulo (pontos x, z), ou null sem destino/sem ligação. */
  path: Point[] | null;
  /** O visitante está no módulo (perto da parada ou ao lado do objeto). */
  arrived: boolean;
};

/**
 * Orientação até um módulo: percurso sobre a grade caminhável derivada da colisão e chegada.
 * Atualiza o estado React só quando o percurso é recalculado ou a chegada muda, nunca a cada
 * quadro. Chegar não marca o módulo como explorado: isso só acontece ao abrir a inspeção.
 */
export function useGuidance(tracker: VisitorTracker, target: ExhibitionModule | null): Guidance {
  const [state, setState] = useState<Guidance & { targetId: string | null }>({
    path: null,
    arrived: false,
    targetId: null,
  });

  useEffect(() => {
    if (!target?.stop) return;
    const stop = target.stop;
    let lastPos: Point | null = null;
    let lastAt = 0;
    let arrived: boolean | null = null;
    let timer: number | undefined;

    const compute = () => {
      timer = undefined;
      const pose = tracker.get();
      if (!pose) return;
      const pos: Point = [pose.x, pose.z];
      lastPos = pos;
      lastAt = performance.now();
      arrived = hasArrived(target, pos);
      setState({ path: findPath(NAV_GRID, pos, stop), arrived, targetId: target.id });
    };

    const unsubscribe = tracker.subscribe((pose) => {
      const pos: Point = [pose.x, pose.z];
      const nowArrived = hasArrived(target, pos);
      const moved = !lastPos || Math.hypot(pos[0] - lastPos[0], pos[1] - lastPos[1]) >= RECOMPUTE_DISTANCE;
      if (nowArrived !== arrived || (moved && timer === undefined)) {
        const wait = nowArrived !== arrived ? 0 : Math.max(0, RECOMPUTE_INTERVAL_MS - (performance.now() - lastAt));
        window.clearTimeout(timer);
        timer = window.setTimeout(compute, wait);
      }
    });
    const first = window.setTimeout(compute, 0);
    return () => {
      unsubscribe();
      window.clearTimeout(first);
      window.clearTimeout(timer);
    };
  }, [tracker, target]);

  if (!target || state.targetId !== target.id) return { path: null, arrived: false };
  return { path: state.path, arrived: state.arrived };
}
