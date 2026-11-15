"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { AVAILABLE_IDS, GUIDED_ROUTE } from "@/data/exhibitionModules";
import {
  EMPTY_VISIT,
  markExplored as addExplored,
  parseStoredVisit,
  serializeVisit,
  VISIT_STORAGE_KEY,
  type StoredVisit,
  type VisitMode,
} from "@/lib/visit/visitProgress";

const load = () => {
  try {
    return parseStoredVisit(window.localStorage.getItem(VISIT_STORAGE_KEY), AVAILABLE_IDS, GUIDED_ROUTE.length);
  } catch {
    return { ...EMPTY_VISIT };
  }
};

/**
 * Registro da visita (módulos explorados, modo, etapa guiada, minimapa) com gravação automática
 * no `localStorage`. Sem armazenamento (navegação privada, bloqueio), tudo funciona durante a
 * visita e só não é lembrado depois.
 */
export function useVisitRecord() {
  const [record, setRecord] = useState<StoredVisit>(EMPTY_VISIT);
  const loaded = useRef(false);

  // Lido depois da montagem: a página é pré-renderizada sem `window`.
  useEffect(() => {
    const id = window.setTimeout(() => {
      setRecord(load());
      loaded.current = true;
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    if (!loaded.current) return;
    try {
      window.localStorage.setItem(VISIT_STORAGE_KEY, serializeVisit(record));
    } catch {
      // Sem armazenamento: o registro vale só para esta visita.
    }
  }, [record]);

  const markExplored = useCallback(
    (id: string) =>
      setRecord((r) => {
        const explored = addExplored(r.explored, id, AVAILABLE_IDS);
        return explored === r.explored ? r : { ...r, explored };
      }),
    [],
  );
  const resetProgress = useCallback(() => setRecord((r) => ({ ...r, explored: [] })), []);
  const setMode = useCallback((mode: VisitMode) => setRecord((r) => (r.mode === mode ? r : { ...r, mode })), []);
  const setGuideStep = useCallback(
    (step: number) =>
      setRecord((r) => {
        const guideStep = Math.min(Math.max(step, 0), Math.max(GUIDED_ROUTE.length - 1, 0));
        return r.guideStep === guideStep ? r : { ...r, guideStep };
      }),
    [],
  );
  const setMinimapOpen = useCallback(
    (open: boolean) => setRecord((r) => (r.minimapOpen === open ? r : { ...r, minimapOpen: open })),
    [],
  );

  return { record, markExplored, resetProgress, setMode, setGuideStep, setMinimapOpen };
}

export type VisitRecord = ReturnType<typeof useVisitRecord>;
