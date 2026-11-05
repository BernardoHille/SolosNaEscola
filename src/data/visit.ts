/**
 * Configuração da visita em primeira pessoa (Walk Mode).
 *
 * Convenções (espaço de mundo do viewer, após `SCENE_SCALE`):
 * - Unidade: metro.
 * - Eixo Y para cima; o piso da sala está em y ≈ 0.
 * - A entrada da exposição fica em −Z; o interior se estende para +Z.
 * - Yaw em graus em torno de Y: 0° olha para −Z, 90° para −X, 180° para +Z.
 * - Pitch em graus: positivo olha para cima.
 */
import voxelMeta from "../../public/models/museu_web.voxel.json";
import collision from "./collision.json";

/**
 * Fator de escala uniforme aplicado ao splat em runtime (o arquivo SOG não é alterado)
 * e, com o mesmo valor, na geração dos voxels de colisão.
 *
 * O SOG exportado não está em metros (piso→teto ≈ 0,68 unidade). O fator foi estimado
 * medindo o vão da porta de entrada no próprio SOG (≈ 0,388 unidade de altura) e
 * assumindo a altura padrão de porta de 2,10 m: 2,10 / 0,388 ≈ 5,4.
 * Para recalibrar, altere `sceneScale` em `collision.json` e rode `npm run collision`.
 */
export const SCENE_SCALE: number = collision.sceneScale;

/**
 * Versão da colisão, derivada dos próprios metadados: muda quando a colisão é regenerada
 * (contagens da octree) ou deslocada (`solosVerticalOffset`).
 */
const COLLISION_VERSION = [
  voxelMeta.nodeCount,
  voxelMeta.leafDataCount,
  (voxelMeta as { solosVerticalOffset?: number }).solosVerticalOffset ?? 0,
].join("-");

/**
 * URL pública dos metadados de colisão; o `.voxel.bin` deve estar ao lado. O parâmetro `v`
 * evita que navegadores e CDN sirvam uma colisão antiga do cache (`/models/*` é cacheado por
 * 1 dia): o viewer deriva a URL do `.voxel.bin` trocando a extensão, então ele vale para os
 * dois arquivos.
 */
export const COLLISION_URL = `/${collision.voxelFile}?v=${COLLISION_VERSION}`;

/** Pose de partida do visitante. */
export type SpawnPose = {
  /** Posição dos olhos, em metros. O Walk Mode ajusta Y para piso + 1,5 m. */
  position: [number, number, number];
  /** Direção horizontal do olhar, em graus (ver convenções acima). */
  yawDeg: number;
  /** Inclinação vertical do olhar, em graus. */
  pitchDeg: number;
  /**
   * Campo de visão vertical, em graus. Observação: o WalkController da versão
   * instalada (1.42) usa FOV fixo de 90° durante a caminhada; este valor vale para a
   * pose inicial antes da entrada no Walk Mode.
   */
  fov: number;
};

/**
 * Entrada da exposição: sobre o tapete cinza, no lado interno, centralizado no vão
 * da porta e olhando para o interior (+Z).
 *
 * Origem dos valores: medidos em renderizações do próprio SOG (vista superior e vista
 * frontal da porta geradas com o SplatTransform): centro do tapete cinza em
 * x ≈ −0,05, z ≈ −0,76 unidade do modelo, multiplicados por `SCENE_SCALE`.
 * Ajuste fino: rota de calibração `/dev/camera` (somente em desenvolvimento).
 */
export const ENTRANCE_SPAWN: SpawnPose = {
  position: [-0.27, 1.5, -4.1],
  yawDeg: 180,
  pitchDeg: -5,
  fov: 90,
};

/**
 * Velocidade de caminhada, como fração da entrada máxima de `setMoveInput` (−1…1).
 * Os valores em m/s resultantes estão documentados no README.
 */
export const MOVEMENT = {
  walk: 0.45,
  run: 0.75,
} as const;

/**
 * Zoom de detalhes (botão direito do mouse): ampliação da imagem e constante de tempo da
 * transição, que assenta em cerca de 0,2 s.
 */
export const DETAIL_ZOOM = {
  factor: 2.5,
  smoothingSeconds: 0.06,
} as const;

/** Vetor de direção (unitário) correspondente a yaw/pitch. */
export function directionFromAngles(yawDeg: number, pitchDeg: number): [number, number, number] {
  const yaw = (yawDeg * Math.PI) / 180;
  const pitch = (pitchDeg * Math.PI) / 180;
  return [-Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch)];
}

/** Yaw/pitch correspondentes a um vetor de direção. */
export function anglesFromDirection([x, y, z]: [number, number, number]): { yawDeg: number; pitchDeg: number } {
  const len = Math.hypot(x, y, z) || 1;
  const yawDeg = (Math.atan2(-x, -z) * 180) / Math.PI;
  const pitchDeg = (Math.asin(Math.max(-1, Math.min(1, y / len))) * 180) / Math.PI;
  return { yawDeg: (yawDeg + 360) % 360, pitchDeg };
}

/** Converte a pose de partida no formato `CameraPose` (posição + alvo) do viewer. */
export function spawnToCameraPose(spawn: SpawnPose) {
  const [dx, dy, dz] = directionFromAngles(spawn.yawDeg, spawn.pitchDeg);
  const [px, py, pz] = spawn.position;
  return {
    position: [px, py, pz] as [number, number, number],
    target: [px + dx, py + dy, pz + dz] as [number, number, number],
    fov: spawn.fov,
  };
}
