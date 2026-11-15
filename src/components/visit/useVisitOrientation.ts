"use client";

import { useCallback, useMemo, useState } from "react";
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";

import { AVAILABLE_IDS, GUIDED_ROUTE, moduleById } from "@/data/exhibitionModules";
import { progressOf } from "@/lib/visit/visitProgress";

import { useGuidance } from "./useGuidance";
import { useVisitorTracker } from "./useVisitorTracker";
import { useVisitRecord } from "./useVisitRecord";

/**
 * Orientação da visita num lugar só: posição do visitante, registro da visita (explorados, modo,
 * etapa, minimapa), destino atual (etapa da visita guiada ou módulo escolhido no mapa) e o
 * percurso até ele.
 */
export function useVisitOrientation(viewer: ViewerHandle | null) {
  const tracker = useVisitorTracker(viewer);
  const visit = useVisitRecord();
  const { markExplored, setMode, setGuideStep, setMinimapOpen, resetProgress, resetAll } = visit;
  const { explored: exploredIds, mode, guideStep, minimapOpen } = visit.record;
  const [orientTargetId, setOrientTargetId] = useState<string | null>(null);
  const guided = mode === "guided";
  const target = guided ? (GUIDED_ROUTE[guideStep] ?? null) : moduleById(orientTargetId);
  const guidance = useGuidance(tracker, target);
  const explored = useMemo(() => new Set(exploredIds), [exploredIds]);
  const progress = progressOf(exploredIds, AVAILABLE_IDS);

  const startGuided = useCallback(
    (step: number) => {
      setGuideStep(step);
      setMode("guided");
      setOrientTargetId(null);
    },
    [setGuideStep, setMode],
  );
  const endGuided = useCallback(() => setMode("free"), [setMode]);
  const stopOrientation = useCallback(() => setOrientTargetId(null), []);
  /** Esquece o registro inteiro (explorados, modo, etapa, minimapa) e o destino atual. */
  const forget = useCallback(() => {
    resetAll();
    setOrientTargetId(null);
  }, [resetAll]);

  return {
    tracker,
    explored,
    progress,
    mode,
    guided,
    guideStep,
    minimapOpen,
    target,
    guidance,
    markExplored,
    setGuideStep,
    setMinimapOpen,
    resetProgress,
    forget,
    setMode,
    startGuided,
    endGuided,
    orientTo: setOrientTargetId,
    stopOrientation,
  };
}
