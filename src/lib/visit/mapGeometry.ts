/**
 * Geometria do minimapa: passagem entre o mundo 3D (plano X/Z de `visit.ts`) e o mapa 2D.
 *
 * O mapa fica com a entrada embaixo e o interior da sala para cima, como o visitante vê ao
 * entrar (olhando para +Z):
 *
 *   u = maxX − x   (direita do mapa = −X, a direita de quem entra)
 *   v = maxZ − z   (cima do mapa = +Z)
 *
 * É uma rotação de 180° da vista de cima, não um espelhamento: esquerda e direita do mapa batem
 * com as do visitante. As unidades do mapa são metros (o SVG usa `viewBox` em metros).
 *
 * Sem dependências do app (testado por `tests/visit.test.mjs`).
 */

export type MapBounds = { minX: number; minZ: number; maxX: number; maxZ: number };

/** Grade caminhável (1 = livre com folga para a cápsula do Walk Mode). */
export type NavGrid = {
  bounds: MapBounds;
  cell: number;
  cols: number;
  rows: number;
  cells: Uint8Array;
};

export type MapData = {
  bounds: MapBounds;
  cell: number;
  cols: number;
  rows: number;
  grid: string;
  floorPath: string;
  furniturePath: string;
  stops: Record<string, [number, number]>;
};

export type Point = [number, number];

export const mapSize = (b: MapBounds): Point => [b.maxX - b.minX, b.maxZ - b.minZ];

export const worldToMap = (b: MapBounds, x: number, z: number): Point => [b.maxX - x, b.maxZ - z];

export const mapToWorld = (b: MapBounds, u: number, v: number): Point => [b.maxX - u, b.maxZ - v];

/**
 * Rotação (graus, sentido horário a partir de "para cima") do indicador do visitante no mapa,
 * para o yaw do viewer (0° olha para −Z, 90° para −X).
 */
export const mapHeadingDeg = (yawDeg: number) => normalizeDeg(180 - yawDeg);

/** Ângulo em (−180, 180]. */
export function normalizeDeg(deg: number) {
  const d = (((deg % 360) + 360) % 360) as number;
  return d > 180 ? d - 360 : d;
}

/** Yaw (convenção de `visit.ts`) da direção de `from` para `to`, no plano X/Z. */
export const yawTowards = (from: Point, to: Point) =>
  (Math.atan2(-(to[0] - from[0]), -(to[1] - from[1])) * 180) / Math.PI;

/**
 * Direção de `to` em relação ao olhar, em graus no sentido horário da tela: 0 = em frente,
 * 90 = à direita, ±180 = atrás. (No viewer o yaw cresce girando para a esquerda.)
 */
export const relativeBearingDeg = (from: Point, yawDeg: number, to: Point) =>
  normalizeDeg(yawDeg - yawTowards(from, to));

export function decodeGrid(data: Pick<MapData, "bounds" | "cell" | "cols" | "rows" | "grid">): NavGrid {
  const bin = atob(data.grid);
  const cells = new Uint8Array(data.cols * data.rows);
  for (let c = 0; c < cells.length; c++) cells[c] = (bin.charCodeAt(c >> 3) >> (c & 7)) & 1;
  return { bounds: data.bounds, cell: data.cell, cols: data.cols, rows: data.rows, cells };
}

export const cellIndex = (g: NavGrid, x: number, z: number): number => {
  const i = Math.floor((x - g.bounds.minX) / g.cell);
  const k = Math.floor((z - g.bounds.minZ) / g.cell);
  return i < 0 || k < 0 || i >= g.cols || k >= g.rows ? -1 : k * g.cols + i;
};

export const cellCenter = (g: NavGrid, c: number): Point => {
  const i = c % g.cols;
  const k = (c - i) / g.cols;
  return [g.bounds.minX + (i + 0.5) * g.cell, g.bounds.minZ + (k + 0.5) * g.cell];
};

export const isWalkable = (g: NavGrid, x: number, z: number) => {
  const c = cellIndex(g, x, z);
  return c >= 0 && g.cells[c] === 1;
};

/** Célula caminhável mais próxima (até `maxRadius` m), ou −1. */
export function nearestWalkable(g: NavGrid, x: number, z: number, maxRadius = 1.5): number {
  const c0 = cellIndex(g, x, z);
  if (c0 >= 0 && g.cells[c0]) return c0;
  const i0 = Math.floor((x - g.bounds.minX) / g.cell);
  const k0 = Math.floor((z - g.bounds.minZ) / g.cell);
  const rMax = Math.ceil(maxRadius / g.cell);
  let best = -1;
  let bestD = Infinity;
  for (let r = 1; r <= rMax && best < 0; r++) {
    for (let dk = -r; dk <= r; dk++)
      for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dk)) !== r) continue;
        const i = i0 + di;
        const k = k0 + dk;
        if (i < 0 || k < 0 || i >= g.cols || k >= g.rows || !g.cells[k * g.cols + i]) continue;
        const d = di * di + dk * dk;
        if (d < bestD) {
          bestD = d;
          best = k * g.cols + i;
        }
      }
  }
  return best;
}
