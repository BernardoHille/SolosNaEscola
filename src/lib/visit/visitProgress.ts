/**
 * Registro da visita guardado no navegador (`localStorage`): módulos explorados, modo de visita,
 * etapa da visita guiada e preferência do minimapa. Nada sai do navegador.
 *
 * Um módulo conta como explorado quando o visitante abre a inspeção dele (não basta passar
 * perto, ver o destaque ou escolhê-lo no mapa). O total é o número de módulos disponíveis na
 * versão atual; ids que não correspondem a um módulo disponível (antigos ou removidos) são
 * descartados ao carregar.
 *
 * Sem dependências do app (testado por `tests/visit.test.mjs`).
 */

export const VISIT_STORAGE_KEY = "solos:visita";

export type VisitMode = "free" | "guided";

export type StoredVisit = {
  version: 1;
  /** `setId` dos módulos explorados, na ordem em que foram abertos. */
  explored: string[];
  mode: VisitMode;
  /** Etapa atual da visita guiada (índice na sequência). */
  guideStep: number;
  /** Minimapa compacto aberto (`null`: ainda não escolhido; vale o padrão do aparelho). */
  minimapOpen: boolean | null;
};

export const EMPTY_VISIT: StoredVisit = { version: 1, explored: [], mode: "free", guideStep: 0, minimapOpen: null };

/** Lê o registro salvo, descartando o que não for válido. Nunca lança erro. */
export function parseStoredVisit(raw: string | null, availableIds: string[], routeLength: number): StoredVisit {
  if (!raw) return { ...EMPTY_VISIT };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ...EMPTY_VISIT };
  }
  if (!data || typeof data !== "object") return { ...EMPTY_VISIT };
  const d = data as Record<string, unknown>;
  const known = new Set(availableIds);
  const explored = Array.isArray(d.explored)
    ? [...new Set(d.explored.filter((id): id is string => typeof id === "string" && known.has(id)))]
    : [];
  const mode: VisitMode = d.mode === "guided" ? "guided" : "free";
  const step = typeof d.guideStep === "number" && Number.isFinite(d.guideStep) ? Math.floor(d.guideStep) : 0;
  const guideStep = routeLength > 0 ? Math.min(Math.max(step, 0), routeLength - 1) : 0;
  const minimapOpen = typeof d.minimapOpen === "boolean" ? d.minimapOpen : null;
  return { version: 1, explored, mode, guideStep, minimapOpen };
}

export const serializeVisit = (v: StoredVisit) => JSON.stringify(v);

/** Acrescenta um módulo explorado; devolve o mesmo array se nada mudou. */
export function markExplored(explored: string[], id: string, availableIds: string[]): string[] {
  if (explored.includes(id) || !availableIds.includes(id)) return explored;
  return [...explored, id];
}

export function progressOf(explored: string[], availableIds: string[]) {
  const known = new Set(availableIds);
  const count = new Set(explored.filter((id) => known.has(id))).size;
  return { count, total: availableIds.length };
}

/** "7 de 18 módulos explorados" (singular quando há um só módulo). */
export const progressLabel = ({ count, total }: { count: number; total: number }) =>
  `${count} de ${total} ${total === 1 ? "módulo explorado" : "módulos explorados"}`;
