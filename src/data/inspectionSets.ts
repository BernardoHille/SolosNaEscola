/** Conjuntos sem menu (abertos pelos volumes de interação com o `setId` do conjunto). */
import { ATRACAO_DO_IMA } from "./atracaoDoIma";
import { FORMACAO_DO_SOLO, type InspectionSet } from "./inspection";
import { POROSIDADE_DO_SOLO } from "./porosidadeDoSolo";

export const INSPECTION_SETS: Record<string, InspectionSet> = {
  [FORMACAO_DO_SOLO.id]: FORMACAO_DO_SOLO,
  [ATRACAO_DO_IMA.id]: ATRACAO_DO_IMA,
  [POROSIDADE_DO_SOLO.id]: POROSIDADE_DO_SOLO,
};
