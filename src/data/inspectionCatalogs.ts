/** Acervos com menu (abertos pelos volumes de interação com o `setId` do acervo). */
import { AR_NO_SOLO } from "./arNoSolo";
import { COLECAO_DE_PERFIS_DE_SOLO } from "./colecaoDePerfisDeSolo";
import { COMPACTACAO_DO_SOLO } from "./compactacaoDoSolo";
import { DENSIDADE_DO_SOLO } from "./densidadeDoSolo";
import type { InspectionCatalog } from "./inspection";
import { HORIZONTES_DO_SOLO } from "./horizontesDoSolo";
import { MATERIAL_DE_ORIGEM } from "./materialDeOrigem";
import { SOLO_AMPLIADO } from "./soloAmpliado";
import { SOLO_URBANO_E_SOLO_RURAL } from "./soloUrbanoESoloRural";
import { TEXTURA_DO_SOLO } from "./texturaDoSolo";

export const INSPECTION_CATALOGS: Record<string, InspectionCatalog> = {
  [MATERIAL_DE_ORIGEM.id]: MATERIAL_DE_ORIGEM,
  [HORIZONTES_DO_SOLO.id]: HORIZONTES_DO_SOLO,
  [TEXTURA_DO_SOLO.id]: TEXTURA_DO_SOLO,
  [AR_NO_SOLO.id]: AR_NO_SOLO,
  [DENSIDADE_DO_SOLO.id]: DENSIDADE_DO_SOLO,
  [COMPACTACAO_DO_SOLO.id]: COMPACTACAO_DO_SOLO,
  [SOLO_AMPLIADO.id]: SOLO_AMPLIADO,
  [COLECAO_DE_PERFIS_DE_SOLO.id]: COLECAO_DE_PERFIS_DE_SOLO,
  [SOLO_URBANO_E_SOLO_RURAL.id]: SOLO_URBANO_E_SOLO_RURAL,
};
