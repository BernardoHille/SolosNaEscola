/** Acervos com menu (abertos pelos volumes de interação com o `setId` do acervo). */
import { AR_NO_SOLO } from "./arNoSolo";
import { CICLO_DO_CALCIO } from "./cicloDoCalcio";
import { CICLO_DO_NITROGENIO } from "./cicloDoNitrogenio";
import { COLECAO_DE_PERFIS_DE_SOLO } from "./colecaoDePerfisDeSolo";
import { COMPACTACAO_DO_SOLO } from "./compactacaoDoSolo";
import { CORES_DO_SOLO } from "./coresDoSolo";
import { DENSIDADE_DO_SOLO } from "./densidadeDoSolo";
import type { InspectionCatalog } from "./inspection";
import { HORIZONTES_DO_SOLO } from "./horizontesDoSolo";
import { MATERIAL_DE_ORIGEM } from "./materialDeOrigem";
import { OBJETOS_E_ARTES_FEITOS_COM_SOLO } from "./objetosEArtesFeitosComSolo";
import { SOLO_AMPLIADO } from "./soloAmpliado";
import { SOLO_URBANO_E_SOLO_RURAL } from "./soloUrbanoESoloRural";
import { TEXTURA_DO_SOLO } from "./texturaDoSolo";
import { VERMICOMPOSTAGEM } from "./vermicompostagem";
import { VIDA_NO_SOLO } from "./vidaNoSolo";

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
  [VIDA_NO_SOLO.id]: VIDA_NO_SOLO,
  [CICLO_DO_NITROGENIO.id]: CICLO_DO_NITROGENIO,
  [CICLO_DO_CALCIO.id]: CICLO_DO_CALCIO,
  [VERMICOMPOSTAGEM.id]: VERMICOMPOSTAGEM,
  [CORES_DO_SOLO.id]: CORES_DO_SOLO,
  [OBJETOS_E_ARTES_FEITOS_COM_SOLO.id]: OBJETOS_E_ARTES_FEITOS_COM_SOLO,
};
