/**
 * Configuração da exposição "Solos na Escola".
 *
 * Este arquivo concentra os parâmetros editáveis da experiência (modelo e aparência),
 * separados do componente de renderização. O formato segue o "Experience Settings" v2
 * do SuperSplat Viewer:
 * https://github.com/playcanvas/supersplat-viewer/blob/main/docs/api.md#settings-schema
 *
 * A pose inicial da visita e os parâmetros de caminhada ficam em `visit.ts`.
 */
import type { ExperienceSettings } from "@playcanvas/supersplat-viewer/settings";

import { COLLISION_URL, ENTRANCE_SPAWN, SCENE_SCALE, type SpawnPose, spawnToCameraPose } from "./visit";

/** Modelo 3D Gaussian Splatting publicado em `public/models/`. */
export const MODEL = {
  /** URL pública (relativa à origem do site) do arquivo SOG. */
  url: "/models/museu_web.sog",
  /** Nome do arquivo; o viewer escolhe o parser pela extensão. */
  filename: "museu_web.sog",
  /** Tamanho em bytes, usado apenas como referência na interface. */
  sizeBytes: 45_722_033,
  /** Quantidade de gaussianas, conforme `meta.json` do SOG. */
  splatCount: 2_994_965,
  /** Escala uniforme aplicada em runtime para trabalhar em metros (ver `visit.ts`). */
  scale: SCENE_SCALE,
  /** Dados de colisão por voxels (par `.voxel.json` / `.voxel.bin`). */
  collisionUrl: COLLISION_URL,
} as const;

/**
 * Monta o Experience Settings v2 a partir de uma pose de partida. A única câmera
 * definida é a entrada da exposição; o viewer a usa como pose inicial antes de o
 * Walk Mode ser ativado.
 */
export function buildExperienceSettings(spawn: SpawnPose): ExperienceSettings {
  return {
    version: 2,
    // "linear" é o tonemapping salvo no projeto SuperSplat.
    tonemapping: "linear",
    highPrecisionRendering: false,
    background: {
      color: [0, 0, 0],
    },
    postEffectSettings: {
      sharpness: { enabled: false, amount: 0 },
      bloom: { enabled: false, intensity: 0.1, blurLevel: 2 },
      grading: { enabled: false, brightness: 1, contrast: 1, saturation: 1, tint: [1, 1, 1] },
      vignette: { enabled: false, intensity: 0.5, inner: 0.3, outer: 0.75, curvature: 1 },
      fringing: { enabled: false, intensity: 0.5 },
    },
    animTracks: [],
    cameras: [{ initial: spawnToCameraPose(spawn) }],
    // Hotspots/anotações serão adicionados em etapas futuras.
    annotations: [],
    startMode: "default",
  };
}

/** Experience Settings v2 da visita pública. */
export const EXPERIENCE_SETTINGS: ExperienceSettings = buildExperienceSettings(ENTRANCE_SPAWN);
