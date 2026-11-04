/**
 * Pose de entrada "de teste", usada somente em desenvolvimento pela calibração
 * (`/dev/camera`). Fica no localStorage do navegador de quem calibra e NUNCA é lida
 * em produção: `IS_DEV` é uma constante de build e o código abaixo vira `null`.
 *
 * Para tornar uma pose definitiva, copie-a no painel e cole em `ENTRANCE_SPAWN`
 * (`src/data/visit.ts`).
 */
import type { SpawnPose } from "@/data/visit";

export const IS_DEV = process.env.NODE_ENV !== "production";

const KEY = "solos:dev-spawn-override";

const isSpawnPose = (value: unknown): value is SpawnPose => {
  const v = value as SpawnPose;
  return (
    !!v &&
    Array.isArray(v.position) &&
    v.position.length === 3 &&
    v.position.every(Number.isFinite) &&
    Number.isFinite(v.yawDeg) &&
    Number.isFinite(v.pitchDeg) &&
    Number.isFinite(v.fov)
  );
};

export function readSpawnOverride(): SpawnPose | null {
  if (!IS_DEV) return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return isSpawnPose(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSpawnOverride(spawn: SpawnPose | null) {
  if (!IS_DEV) return;
  try {
    if (spawn) window.localStorage.setItem(KEY, JSON.stringify(spawn));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Armazenamento indisponível: a calibração continua funcionando sem persistir.
  }
}

/** Texto TypeScript pronto para colar em `src/data/visit.ts`. */
export function formatSpawnPose(spawn: SpawnPose): string {
  const n = (v: number) => Number(v.toFixed(3));
  return [
    "export const ENTRANCE_SPAWN: SpawnPose = {",
    `  position: [${spawn.position.map(n).join(", ")}],`,
    `  yawDeg: ${n(spawn.yawDeg)},`,
    `  pitchDeg: ${n(spawn.pitchDeg)},`,
    `  fov: ${n(spawn.fov)},`,
    "};",
  ].join("\n");
}
