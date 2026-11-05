"use client";

import { useCallback, useMemo, useState } from "react";

import { INSPECTION_SETS, type InspectionCatalog, type InspectionItem, type InspectionSet } from "@/data/inspection";
import { INSPECTION_CATALOGS } from "@/data/inspectionCatalogs";

/** Cartão de um menu de acervo (grupo ou peça). */
export type InspectionMenuCard = {
  id: string;
  title: string;
  subtitle?: string;
  /** Miniaturas: várias (grupo, em mosaico) ou uma (peça). */
  thumbnails: string[];
  /** Peça aberta pelo cartão (para pré-carregar o modelo ao passar o cursor). */
  item?: InspectionItem;
  onSelect: () => void;
};

export type InspectionMenu = {
  variant: "groups" | "items";
  cards: InspectionMenuCard[];
};

export type InspectionState = {
  /**
   * Conjunto mostrado agora, ou null com a inspeção fechada. Num menu de acervo, é um conjunto
   * sem peças, só com o texto (e a narração) do acervo ou do grupo.
   */
  set: InspectionSet | null;
  /** Etapa atual (0 = primeira). */
  index: number;
  /** Menu de acervo aberto (grupos ou peças de um grupo), ou null na inspeção 3D. */
  menu: InspectionMenu | null;
  /** Linha acima do título (ex.: "Material de Origem · Rochas ígneas"). */
  eyebrow: string | null;
  /** Volta um nível nos menus de acervo; null quando não há para onde voltar. */
  back: (() => void) | null;
  open: (setId: string) => void;
  close: () => void;
  next: () => void;
  previous: () => void;
  /** Vai direto a uma etapa (miniaturas). */
  goTo: (index: number) => void;
};

type State =
  | { kind: "set"; setId: string; index: number }
  | { kind: "catalog"; catalogId: string; groupId: string | null; index: number | null };

const menuSet = (id: string, title: string, overview: string, narration: InspectionCatalog["overviewNarration"]) =>
  ({ id: `${id}:menu`, title, overview, overviewNarration: narration, items: [] }) satisfies InspectionSet;

/**
 * Estado da inspeção. Conjuntos em sequência (Formação do Solo) abrem sempre na primeira etapa.
 * Acervos (Material de Origem) abrem no menu dos grupos; um grupo abre o menu das suas peças; uma
 * peça abre a inspeção 3D, com as setas e as miniaturas percorrendo as peças do grupo.
 */
export function useInspection(): InspectionState {
  const [state, setState] = useState<State | null>(null);

  const catalog = state?.kind === "catalog" ? (INSPECTION_CATALOGS[state.catalogId] ?? null) : null;
  const groupId = state?.kind === "catalog" ? state.groupId : null;
  const group = catalog?.groups.find((g) => g.id === groupId) ?? null;
  const menuIndex = state?.kind === "catalog" ? state.index : 0;
  // Menu das peças do grupo (nenhuma peça aberta).
  const choosingItem = menuIndex === null;

  const selectGroup = useCallback(
    (id: string) => setState((s) => (s?.kind === "catalog" ? { ...s, groupId: id, index: null } : s)),
    [],
  );
  const selectItem = useCallback((i: number) => setState((s) => (s?.kind === "catalog" ? { ...s, index: i } : s)), []);

  // Objetos estáveis entre renderizações (o visualizador e a narração dependem da identidade).
  const view = useMemo(() => {
    if (!catalog) return null;
    if (!group) {
      return {
        set: menuSet(catalog.id, catalog.title, catalog.overview, catalog.overviewNarration),
        eyebrow: "Escolha um grupo",
        menu: {
          variant: "groups",
          cards: catalog.groups.map((g) => ({
            id: g.id,
            title: g.title,
            subtitle: `${g.items.length} ${g.items.length === 1 ? "rocha" : "rochas"}`,
            thumbnails: g.items.map((it) => it.thumbnail),
            onSelect: () => selectGroup(g.id),
          })),
        } satisfies InspectionMenu,
      };
    }
    if (choosingItem) {
      return {
        set: menuSet(group.id, group.title, group.overview, group.overviewNarration),
        eyebrow: catalog.title,
        menu: {
          variant: "items",
          cards: group.items.map((it, i) => ({
            id: it.id,
            title: it.title,
            thumbnails: [it.thumbnail],
            item: it,
            onSelect: () => selectItem(i),
          })),
        } satisfies InspectionMenu,
      };
    }
    return {
      set: { id: group.id, title: group.title, stepNoun: catalog.stepNoun, items: group.items } satisfies InspectionSet,
      eyebrow: `${catalog.title} · ${group.title}`,
      menu: null,
    };
  }, [catalog, group, choosingItem, selectGroup, selectItem]);

  let set: InspectionSet | null = null;
  let index = 0;
  if (state?.kind === "set") {
    set = INSPECTION_SETS[state.setId] ?? null;
    index = state.index;
  } else if (view) {
    set = view.set;
    index = menuIndex ?? 0;
  }
  const count = set?.items.length ?? 0;

  const open = useCallback((setId: string) => {
    if (INSPECTION_SETS[setId]) setState({ kind: "set", setId, index: 0 });
    else if (INSPECTION_CATALOGS[setId]) setState({ kind: "catalog", catalogId: setId, groupId: null, index: null });
  }, []);
  const close = useCallback(() => setState(null), []);
  const goBack = useCallback(
    () =>
      setState((s) => {
        if (s?.kind !== "catalog") return null;
        if (s.index !== null) return { ...s, index: null };
        if (s.groupId !== null) return { ...s, groupId: null };
        return null;
      }),
    [],
  );
  const canGoBack = state?.kind === "catalog" && (state.groupId !== null || state.index !== null);

  const next = useCallback(
    () =>
      setState((s) => (s && s.index !== null && s.index < count - 1 ? ({ ...s, index: s.index + 1 } as State) : s)),
    [count],
  );
  const previous = useCallback(
    () => setState((s) => (s && s.index !== null && s.index > 0 ? ({ ...s, index: s.index - 1 } as State) : s)),
    [],
  );
  const goTo = useCallback(
    (i: number) =>
      setState((s) => (s && s.index !== null && i >= 0 && i < count && i !== s.index ? ({ ...s, index: i } as State) : s)),
    [count],
  );

  return useMemo(
    () => ({
      set,
      index,
      menu: view?.menu ?? null,
      eyebrow: view?.eyebrow ?? null,
      back: canGoBack ? goBack : null,
      open,
      close,
      next,
      previous,
      goTo,
    }),
    [set, index, view, canGoBack, goBack, open, close, next, previous, goTo],
  );
}
