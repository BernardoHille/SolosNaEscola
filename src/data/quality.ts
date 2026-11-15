/**
 * Modos de qualidade da visita.
 *
 * Cada modo manual combina duas grandezas independentes:
 * - `scale`: fração da resolução de renderização em cada eixo (o custo por pixel cresce com
 *   ≈ escala²). Aplicada por `applyRenderScale` (`src/lib/viewer/renderScale.ts`).
 * - `splatBudget`: orçamento global de gaussianas do motor (`app.scene.gsplat.splatBudget`). Só tem
 *   efeito na cena em Streamed SOG (`lod-meta.json`), que tem níveis de detalhe e é dividida em
 *   blocos espaciais; no SOG de arquivo único (modo `legacy`) as ≈ 3,0 milhões de gaussianas são
 *   sempre desenhadas e só a resolução muda.
 *
 * O orçamento funciona no modo `target` do motor: o detalhe sobe primeiro nos blocos mais próximos
 * da câmera, até gastar o orçamento (ver `docs/lod-streaming.md`). "Alto" (3,0 M) cobre a cena
 * inteira no nível mais fino, a mesma quantidade do SOG publicado: o computador não perde nada.
 *
 * O modo "Automático" (padrão) escolhe orçamento e resolução pelo desempenho medido; ver
 * `src/lib/viewer/adaptiveQuality.ts`.
 */
export type ManualQualityId = "alto" | "medio" | "baixo" | "muito-baixo";
export type RenderQualityId = "auto" | ManualQualityId;

export type RenderQuality = {
  id: ManualQualityId;
  label: string;
  /** Fração da resolução máxima do viewer, em cada eixo. */
  scale: number;
  /** Orçamento global de gaussianas (Streamed SOG). */
  splatBudget: number;
};

/** Do maior para o menor. */
export const RENDER_QUALITIES: readonly RenderQuality[] = [
  { id: "alto", label: "Alto", scale: 1, splatBudget: 3_000_000 },
  { id: "medio", label: "Médio", scale: 0.75, splatBudget: 1_500_000 },
  { id: "baixo", label: "Baixo", scale: 0.5, splatBudget: 750_000 },
  { id: "muito-baixo", label: "Muito baixo", scale: 0.25, splatBudget: 350_000 },
];

/** Opções mostradas nas configurações: o automático primeiro. */
export const QUALITY_OPTIONS: readonly { id: RenderQualityId; label: string }[] = [
  { id: "auto", label: "Automático" },
  ...RENDER_QUALITIES.map(({ id, label }) => ({ id, label })),
];

/** Padrão antes de o visitante escolher: o automático, em qualquer aparelho. */
export const DEFAULT_RENDER_QUALITY: RenderQualityId = "auto";

/**
 * Padrão anterior ao modo automático (resolução máxima no computador e metade em celulares e
 * tablets). Mantido para quem força o SOG antigo e para comparação.
 */
export function defaultRenderQuality(inputMode: "desktop" | "touch"): ManualQualityId {
  return inputMode === "touch" ? "baixo" : "alto";
}

export function findRenderQuality(id: string | null | undefined): RenderQuality | undefined {
  return RENDER_QUALITIES.find((quality) => quality.id === id);
}

/** Valida uma preferência salva: um modo manual conhecido ou "auto". */
export function parseQualityPreference(value: string | null | undefined): RenderQualityId | null {
  if (value === "auto") return "auto";
  return findRenderQuality(value)?.id ?? null;
}
