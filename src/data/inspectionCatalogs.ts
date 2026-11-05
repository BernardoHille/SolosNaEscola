/** Acervos com menu (abertos pelos volumes de interação com o `setId` do acervo). */
import type { InspectionCatalog } from "./inspection";
import { HORIZONTES_DO_SOLO } from "./horizontesDoSolo";
import { MATERIAL_DE_ORIGEM } from "./materialDeOrigem";
import { TEXTURA_DO_SOLO } from "./texturaDoSolo";

export const INSPECTION_CATALOGS: Record<string, InspectionCatalog> = {
  [MATERIAL_DE_ORIGEM.id]: MATERIAL_DE_ORIGEM,
  [HORIZONTES_DO_SOLO.id]: HORIZONTES_DO_SOLO,
  [TEXTURA_DO_SOLO.id]: TEXTURA_DO_SOLO,
};
