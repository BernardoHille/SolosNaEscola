/**
 * Módulos da exposição: junta os tópicos do roteiro (`exhibition.json`), os volumes de interação
 * (`interactions.json`, agrupados por `setId`), os conjuntos de inspeção existentes e as paradas
 * do mapa (`exhibitionMap.json`) numa lista só, usada pelo catálogo, pelo minimapa, pelo
 * progresso e pela visita guiada.
 *
 * Um módulo está disponível quando o tópico tem `setId`, esse conjunto existe no app, há pelo
 * menos um volume com esse `setId` e o mapa tem uma parada para ele. Os volumes de um mesmo
 * conjunto (as caixas do módulo 01, as prateleiras do 02, os perfis do 11) formam um módulo só.
 *
 * Sem dependências do app (testado por `tests/visit.test.mjs`).
 */
import type { Point } from "./mapGeometry.ts";

export type ExhibitionTopic = { number: number; title: string; summary: string; setId?: string };

export type VolumeLike = {
  id: string;
  setId: string;
  position: [number, number, number];
  rotationDeg: [number, number, number];
  size: [number, number, number];
};

/** Área ocupada por um volume no plano X/Z (para o mapa e para a chegada). */
export type Footprint = { x: number; z: number; width: number; depth: number; yawDeg: number };

export type ExhibitionModule = {
  /** `setId` quando disponível; `topico-NN` quando ainda não há interação. */
  id: string;
  number: number;
  title: string;
  summary: string;
  setId: string | null;
  available: boolean;
  volumeIds: string[];
  /** Centro dos volumes (x, z): onde o módulo aparece no mapa. */
  position: Point | null;
  /** Ponto de parada caminhável em frente ao módulo (x, z). */
  stop: Point | null;
  footprints: Footprint[];
};

/** Distância (m) do ponto de parada, ou da área do módulo, em que o visitante "chegou". */
export const ARRIVAL_RADIUS = 1.0;
export const ARRIVAL_NEAR_OBJECT = 1.3;

export const formatModuleNumber = (n: number) => String(n).padStart(2, "0");

export function buildExhibitionModules(
  topics: ExhibitionTopic[],
  volumes: VolumeLike[],
  knownSetIds: Iterable<string>,
  stops: Record<string, Point>,
): ExhibitionModule[] {
  const known = new Set(knownSetIds);
  const bySet = new Map<string, VolumeLike[]>();
  for (const v of volumes) {
    if (!bySet.has(v.setId)) bySet.set(v.setId, []);
    bySet.get(v.setId)!.push(v);
  }
  return [...topics]
    .sort((a, b) => a.number - b.number)
    .map((t) => {
      const group = (t.setId && bySet.get(t.setId)) || [];
      const stop = (t.setId && stops[t.setId]) || null;
      const available = !!t.setId && known.has(t.setId) && group.length > 0 && !!stop;
      const position: Point | null = group.length
        ? [
            group.reduce((s, v) => s + v.position[0], 0) / group.length,
            group.reduce((s, v) => s + v.position[2], 0) / group.length,
          ]
        : null;
      return {
        id: available ? t.setId! : `topico-${formatModuleNumber(t.number)}`,
        number: t.number,
        title: t.title,
        summary: t.summary,
        setId: available ? t.setId! : null,
        available,
        volumeIds: available ? group.map((v) => v.id) : [],
        position: available ? position : null,
        stop: available ? [stop![0], stop![1]] : null,
        footprints: available
          ? group.map((v) => ({
              x: v.position[0],
              z: v.position[2],
              width: v.size[0],
              depth: v.size[2],
              yawDeg: v.rotationDeg[1],
            }))
          : [],
      };
    });
}

/**
 * Sequência da visita guiada: os módulos disponíveis na ordem de `route`, sem repetição; os
 * disponíveis que a lista ainda não cita entram no fim, pela numeração do roteiro (um módulo
 * novo aparece no percurso sem editar a lista). Ids da lista sem módulo disponível são ignorados.
 */
export function buildGuidedRoute(modules: ExhibitionModule[], route: string[]): ExhibitionModule[] {
  const available = new Map(modules.filter((m) => m.available).map((m) => [m.id, m]));
  const out: ExhibitionModule[] = [];
  for (const id of route) {
    const m = available.get(id);
    if (m && !out.includes(m)) out.push(m);
  }
  for (const m of modules) if (m.available && !out.includes(m)) out.push(m);
  return out;
}

/** Distância horizontal de um ponto à área (caixa orientada) de um volume. */
export function distanceToFootprint(f: Footprint, [x, z]: Point) {
  const yaw = (f.yawDeg * Math.PI) / 180;
  const dx = x - f.x;
  const dz = z - f.z;
  // Coordenadas locais (eixo X local = (cos, −sin), eixo Z local = (sin, cos)).
  const lx = dx * Math.cos(yaw) - dz * Math.sin(yaw);
  const lz = dx * Math.sin(yaw) + dz * Math.cos(yaw);
  const ox = Math.max(0, Math.abs(lx) - f.width / 2);
  const oz = Math.max(0, Math.abs(lz) - f.depth / 2);
  return Math.hypot(ox, oz);
}

/** O ponto está do lado da frente do volume (+Z local), de onde ele pode ser inspecionado. */
export function isInFrontOf(f: Footprint, [x, z]: Point) {
  const yaw = (f.yawDeg * Math.PI) / 180;
  return (x - f.x) * Math.sin(yaw) + (z - f.z) * Math.cos(yaw) > f.depth / 2;
}

/**
 * O visitante está no módulo: perto da parada ou ao lado de algum dos volumes, do lado da frente
 * (atrás de uma estante não conta).
 */
export function hasArrived(m: ExhibitionModule, pos: Point) {
  if (!m.stop) return false;
  if (Math.hypot(pos[0] - m.stop[0], pos[1] - m.stop[1]) <= ARRIVAL_RADIUS) return true;
  return m.footprints.some((f) => isInFrontOf(f, pos) && distanceToFootprint(f, pos) <= ARRIVAL_NEAR_OBJECT);
}

/** Centro do volume do módulo mais próximo do visitante (para onde olhar ao chegar). */
export function nearestObjectPoint(m: ExhibitionModule, pos: Point): Point | null {
  let best: Point | null = null;
  let bestD = Infinity;
  for (const f of m.footprints) {
    const d = distanceToFootprint(f, pos);
    if (d < bestD) {
      bestD = d;
      best = [f.x, f.z];
    }
  }
  return best;
}

/**
 * Afasta pontos que ficariam um sobre o outro no mapa (ex.: módulos 01 e 02, na mesma estante),
 * mantendo-os o mais perto possível da posição real. Devolve novas posições, na mesma ordem.
 */
export function spreadPoints(points: Point[], minDistance: number, iterations = 24): Point[] {
  const out = points.map(([x, z]) => [x, z] as Point);
  for (let it = 0; it < iterations; it++) {
    let moved = false;
    for (let a = 0; a < out.length; a++)
      for (let b = a + 1; b < out.length; b++) {
        let dx = out[b][0] - out[a][0];
        let dz = out[b][1] - out[a][1];
        let d = Math.hypot(dx, dz);
        if (d >= minDistance) continue;
        if (d < 1e-6) {
          dx = 1;
          dz = 0;
          d = 1;
        }
        const push = (minDistance - Math.hypot(out[b][0] - out[a][0], out[b][1] - out[a][1])) / 2 + 1e-6;
        out[a] = [out[a][0] - (dx / d) * push, out[a][1] - (dz / d) * push];
        out[b] = [out[b][0] + (dx / d) * push, out[b][1] + (dz / d) * push];
        moved = true;
      }
    if (!moved) break;
  }
  return out;
}
