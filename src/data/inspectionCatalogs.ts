/** Acervos com menu de grupos (abertos pelos volumes de interação com o `setId` do acervo). */
import type { InspectionCatalog } from "./inspection";
import { MATERIAL_DE_ORIGEM } from "./materialDeOrigem";

export const INSPECTION_CATALOGS: Record<string, InspectionCatalog> = {
  [MATERIAL_DE_ORIGEM.id]: MATERIAL_DE_ORIGEM,
};
