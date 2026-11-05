/**
 * Volumes de interação: caixas invisíveis posicionadas no espaço do Gaussian Splatting,
 * associadas a objetos da exposição. O splat não tem malhas separadas por objeto; estes
 * volumes fazem esse papel para mira, proximidade e destaque.
 *
 * Os valores ficam em `interactions.json` (mesmo formato copiado pela calibração em
 * `?debugInteractions=1`).
 */
import data from "./interactions.json";

export type Vec3 = [number, number, number];

/** Caixa orientada no espaço de mundo do viewer. */
export type OrientedBox = {
  /** Centro, em metros (espaço de mundo do viewer). */
  position: Vec3;
  /** Rotação em graus (X, Y, Z; ordem de aplicação Y·X·Z). A frente é o +Z local. */
  rotationDeg: Vec3;
  /** Dimensões (largura X, altura Y, profundidade Z), em metros. */
  size: Vec3;
};

/**
 * Bloqueador invisível (ex.: lateral de um móvel): o raio que o atinge antes de um volume
 * não seleciona esse volume. É a oclusão que o splat, sem geometria por objeto, não oferece.
 */
export type Occluder = OrientedBox & { id: string };

export type InteractionVolume = OrientedBox & {
  /** Identificador único (igual ao do item do conjunto, quando houver). */
  id: string;
  /** Nome curto exibido no indicador de interação. */
  label: string;
  /** Conjunto educativo aberto por este volume (`INSPECTION_SETS` ou `INSPECTION_CATALOGS`). */
  setId: string;
  /** Ordem do objeto no conjunto (informativo; a inspeção sempre começa pela etapa 1). */
  order: number;
  /** Distância máxima (m) da câmera até o volume para a interação ficar disponível. */
  maxDistance: number;
};

export const INTERACTION_VOLUMES = data.volumes as InteractionVolume[];
export const INTERACTION_OCCLUDERS = (data.occluders ?? []) as Occluder[];

/** Formato do JSON copiado pela calibração (pronto para colar em `interactions.json`). */
export function serializeVolumes(volumes: InteractionVolume[], occluders: Occluder[] = INTERACTION_OCCLUDERS) {
  const round = (n: number) => Math.round(n * 1000) / 1000;
  const box = <T extends OrientedBox>(v: T) => ({
    ...v,
    position: v.position.map(round),
    rotationDeg: v.rotationDeg.map((n) => Math.round(n * 10) / 10),
    size: v.size.map(round),
  });
  return JSON.stringify(
    {
      $comment: data.$comment,
      volumes: volumes.map((v) => ({ ...box(v), maxDistance: round(v.maxDistance) })),
      occluders: occluders.map(box),
    },
    null,
    2,
  );
}
