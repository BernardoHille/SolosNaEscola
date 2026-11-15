/**
 * Fontes do Gaussian da exposição e a escolha entre elas (comparação A/B e retorno ao SOG antigo).
 *
 * - `streamed` (padrão): Streamed SOG com 4 níveis de detalhe e blocos espaciais
 *   (`public/models/museu_streamed/<versão>/lod-meta.json`), gerado por `npm run lod:build`.
 * - `legacy`: o SOG de arquivo único publicado antes (`public/models/museu_web.sog`), intacto.
 *
 * As duas têm o mesmo espaço de coordenadas (mesma origem, orientação e unidade), então a escala da
 * cena, a colisão, a entrada e os volumes de interação valem para ambas (ver `docs/lod-streaming.md`).
 *
 * Escolha por URL: `?splat=legacy` ou `?splat=streamed`. É seguro em produção: só alterna entre os
 * dois arquivos publicados. Sem parâmetro, vale `DEFAULT_SPLAT_SOURCE`; se o Streamed SOG falhar
 * antes de a cena ficar pronta, a exposição volta sozinha ao SOG único (a não ser que o parâmetro
 * tenha forçado o streamed, para que a falha apareça nos testes).
 */
import { type SplatSourceId } from "@/lib/viewer/splatSourceParam";

import streamed from "./streamedSplat.json";

export { DEFAULT_SPLAT_SOURCE, parseSplatSource, type SplatSourceId } from "@/lib/viewer/splatSourceParam";

export type SplatSource = {
  id: SplatSourceId;
  url: string;
  filename: string;
  /** Tem níveis de detalhe: o orçamento de gaussianas tem efeito. */
  streamed: boolean;
  /** Bytes de um download completo (no streamed, de todos os níveis; nunca baixado inteiro). */
  totalBytes: number;
  /** Gaussianas no nível mais fino. */
  splatCount: number;
};

export const SPLAT_SOURCES: Record<SplatSourceId, SplatSource> = {
  legacy: {
    id: "legacy",
    url: "/models/museu_web.sog",
    filename: "museu_web.sog",
    streamed: false,
    totalBytes: 45_722_033,
    splatCount: 2_994_965,
  },
  streamed: {
    id: "streamed",
    url: streamed.url,
    filename: "lod-meta.json",
    streamed: true,
    totalBytes: streamed.totalBytes,
    splatCount: streamed.lodCounts[0],
  },
};

/** Manifesto do Streamed SOG publicado (gerado por `scripts/lod/finalize-streamed-sog.mjs`). */
export const STREAMED_MANIFEST = streamed;
