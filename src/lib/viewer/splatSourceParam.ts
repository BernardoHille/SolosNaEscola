/**
 * Leitura de `?splat=legacy|streamed` (comparação A/B). Módulo puro, testado em
 * `tests/streamedSog.test.mjs`; as fontes em si ficam em `src/data/splatSources.ts`.
 */
export type SplatSourceId = "legacy" | "streamed";

export const DEFAULT_SPLAT_SOURCE: SplatSourceId = "streamed";

/** Lê `?splat=` da URL. `forced` indica escolha explícita (sem recuo automático). */
export function parseSplatSource(search: string): { id: SplatSourceId; forced: boolean } {
  let value: string | null = null;
  try {
    value = new URLSearchParams(search).get("splat");
  } catch {
    value = null;
  }
  if (value === "legacy" || value === "streamed") return { id: value, forced: true };
  return { id: DEFAULT_SPLAT_SOURCE, forced: false };
}

/** O nome do arquivo identifica um Streamed SOG (o parser do motor usa o mesmo critério). */
export function isStreamedContent(filename: string) {
  return filename.toLowerCase() === "lod-meta.json";
}
