"use client";

import { useCallback, useMemo, useState } from "react";

import { INSPECTION_SETS, type InspectionSet } from "@/data/inspection";

export type InspectionState = {
  /** Conjunto aberto, ou null com a inspeção fechada. */
  set: InspectionSet | null;
  /** Etapa atual (0 = primeira). */
  index: number;
  open: (setId: string) => void;
  close: () => void;
  next: () => void;
  previous: () => void;
};

/**
 * Estado da inspeção: conjunto aberto e etapa atual. Abrir sempre começa pela primeira
 * etapa; as setas não passam do início nem do fim da sequência.
 */
export function useInspection(): InspectionState {
  const [state, setState] = useState<{ setId: string; index: number } | null>(null);
  const set = state ? (INSPECTION_SETS[state.setId] ?? null) : null;
  const count = set?.items.length ?? 0;

  const open = useCallback((setId: string) => {
    if (INSPECTION_SETS[setId]) setState({ setId, index: 0 });
  }, []);
  const close = useCallback(() => setState(null), []);
  const next = useCallback(
    () => setState((s) => (s && s.index < count - 1 ? { ...s, index: s.index + 1 } : s)),
    [count],
  );
  const previous = useCallback(() => setState((s) => (s && s.index > 0 ? { ...s, index: s.index - 1 } : s)), []);

  return useMemo(
    () => ({ set, index: state?.index ?? 0, open, close, next, previous }),
    [set, state?.index, open, close, next, previous],
  );
}
