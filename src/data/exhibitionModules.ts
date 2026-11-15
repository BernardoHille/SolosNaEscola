/**
 * Módulos da exposição montados a partir dos dados do app (fonte única do catálogo, do
 * minimapa, do progresso e da visita guiada):
 *
 * - `exhibition.json`: os 27 tópicos do roteiro e a ordem da visita guiada;
 * - `inspectionSets.ts` e `inspectionCatalogs.ts`: os conjuntos de inspeção existentes;
 * - `interactions.json`: os volumes no splat, agrupados por `setId`;
 * - `exhibitionMap.json`: a planta e as paradas, derivadas da colisão (`npm run map`).
 *
 * Para um módulo novo aparecer em tudo isso basta o conjunto, os volumes, o `setId` no tópico de
 * `exhibition.json` e `npm run map` (ver README, "Mapa e visita").
 */
import exhibition from "./exhibition.json";
import mapData from "./exhibitionMap.json";
import { INSPECTION_CATALOGS } from "./inspectionCatalogs";
import { INSPECTION_SETS } from "./inspectionSets";
import { INTERACTION_VOLUMES } from "./interactions";
import {
  buildExhibitionModules,
  buildGuidedRoute,
  type ExhibitionModule,
  type ExhibitionTopic,
} from "@/lib/visit/exhibitionModules";
import { decodeGrid, type MapData, type Point } from "@/lib/visit/mapGeometry";

export const EXHIBITION_MAP = mapData as unknown as MapData;
export const NAV_GRID = decodeGrid(EXHIBITION_MAP);

export const EXHIBITION_MODULES: ExhibitionModule[] = buildExhibitionModules(
  exhibition.topics as ExhibitionTopic[],
  INTERACTION_VOLUMES,
  [...Object.keys(INSPECTION_SETS), ...Object.keys(INSPECTION_CATALOGS)],
  EXHIBITION_MAP.stops as Record<string, Point>,
);

export const AVAILABLE_MODULES = EXHIBITION_MODULES.filter((m) => m.available);
export const AVAILABLE_IDS = AVAILABLE_MODULES.map((m) => m.id);

export const GUIDED_ROUTE: ExhibitionModule[] = buildGuidedRoute(EXHIBITION_MODULES, exhibition.guidedRoute);

const BY_ID = new Map(EXHIBITION_MODULES.map((m) => [m.id, m]));
export const moduleById = (id: string | null | undefined) => (id ? BY_ID.get(id) ?? null : null);
