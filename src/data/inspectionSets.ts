/** Conjuntos sem menu (abertos pelos volumes de interação com o `setId` do conjunto). */
import { ATRACAO_DO_IMA } from "./atracaoDoIma";
import { COMPACTACAO_E_INFILTRACAO } from "./compactacaoEInfiltracao";
import { DESLIZAMENTO_E_INUNDACAO } from "./deslizamentoEInundacao";
import { EROSAO_EOLICA_DO_SOLO } from "./erosaoEolicaDoSolo";
import { EROSAO_HIDRICA_DO_SOLO } from "./erosaoHidricaDoSolo";
import { IMPACTO_DA_GOTA_DA_CHUVA } from "./impactoDaGotaDaChuva";
import { FORMACAO_DO_SOLO, type InspectionSet } from "./inspection";
import { MAQUETE_DA_VOCOROCA } from "./maqueteDaVocoroca";
import { POROSIDADE_DO_SOLO } from "./porosidadeDoSolo";
import { SOLO_COMO_FILTRO } from "./soloComoFiltro";
import { SOLO_NA_PAISAGEM } from "./soloNaPaisagem";
import { TEMPERATURA_DO_SOLO } from "./temperaturaDoSolo";

export const INSPECTION_SETS: Record<string, InspectionSet> = {
  [FORMACAO_DO_SOLO.id]: FORMACAO_DO_SOLO,
  [ATRACAO_DO_IMA.id]: ATRACAO_DO_IMA,
  [POROSIDADE_DO_SOLO.id]: POROSIDADE_DO_SOLO,
  [SOLO_NA_PAISAGEM.id]: SOLO_NA_PAISAGEM,
  [EROSAO_HIDRICA_DO_SOLO.id]: EROSAO_HIDRICA_DO_SOLO,
  [EROSAO_EOLICA_DO_SOLO.id]: EROSAO_EOLICA_DO_SOLO,
  [DESLIZAMENTO_E_INUNDACAO.id]: DESLIZAMENTO_E_INUNDACAO,
  [MAQUETE_DA_VOCOROCA.id]: MAQUETE_DA_VOCOROCA,
  [TEMPERATURA_DO_SOLO.id]: TEMPERATURA_DO_SOLO,
  [SOLO_COMO_FILTRO.id]: SOLO_COMO_FILTRO,
  [IMPACTO_DA_GOTA_DA_CHUVA.id]: IMPACTO_DA_GOTA_DA_CHUVA,
  [COMPACTACAO_E_INFILTRACAO.id]: COMPACTACAO_E_INFILTRACAO,
};
