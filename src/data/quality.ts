/**
 * Modos de qualidade da visita.
 *
 * Por que resolução e não o "Quality" do viewer: os níveis nativos do SuperSplat Viewer
 * (`state.quality`) mudam o orçamento de splats, que só tem efeito em cenas com níveis de
 * detalhe (LOD). O SOG da exposição é um arquivo único (≈ 3,0 milhões de splats), sempre
 * desenhado por inteiro; ali os níveis nativos diferem apenas na resolução do nível mais baixo.
 * Por isso a qualidade é controlada pela resolução de renderização, em degraus iguais, sem
 * alterar o modelo. O custo de desenhar splats cresce com o número de pixels (≈ escala²).
 */
export type RenderQualityId = "alto" | "medio" | "baixo" | "muito-baixo";

export type RenderQuality = {
  id: RenderQualityId;
  label: string;
  /** Fração da resolução máxima do viewer, em cada eixo. */
  scale: number;
};

/** Do maior para o menor. */
export const RENDER_QUALITIES: readonly RenderQuality[] = [
  { id: "alto", label: "Alto", scale: 1 },
  { id: "medio", label: "Médio", scale: 0.75 },
  { id: "baixo", label: "Baixo", scale: 0.5 },
  { id: "muito-baixo", label: "Muito baixo", scale: 0.25 },
];

/**
 * Padrão antes de o visitante escolher. Equivale ao que o viewer já fazia sozinho: resolução
 * máxima no computador e metade em celulares e tablets.
 */
export function defaultRenderQuality(inputMode: "desktop" | "touch"): RenderQualityId {
  return inputMode === "touch" ? "baixo" : "alto";
}

export function findRenderQuality(id: string | null | undefined): RenderQuality | undefined {
  return RENDER_QUALITIES.find((quality) => quality.id === id);
}
