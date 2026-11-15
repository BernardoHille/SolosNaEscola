/**
 * Percurso até um módulo sobre a grade caminhável derivada da colisão (`exhibitionMap.json`).
 *
 * A* em 8 direções (sem cortar quinas de obstáculos), seguido de uma simplificação por linha
 * de visada na mesma grade: o percurso resultante só passa por células livres com a folga da
 * cápsula do Walk Mode. É uma orientação, não um trajeto obrigatório: o visitante continua
 * andando livremente e o percurso é recalculado conforme ele se move.
 *
 * Sem dependências do app (testado por `tests/visit.test.mjs`).
 */
import { cellCenter, nearestWalkable, type NavGrid, type Point } from "./mapGeometry.ts";

/** Fila de prioridade mínima (heap binário) de índices de célula. */
class MinHeap {
  private items: number[] = [];
  private readonly score: Float64Array;
  constructor(score: Float64Array) {
    this.score = score;
  }
  get size() {
    return this.items.length;
  }
  push(c: number) {
    const a = this.items;
    a.push(c);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.score[a[p]] <= this.score[a[i]]) break;
      [a[p], a[i]] = [a[i], a[p]];
      i = p;
    }
  }
  pop(): number {
    const a = this.items;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && this.score[a[l]] < this.score[a[m]]) m = l;
        if (r < a.length && this.score[a[r]] < this.score[a[m]]) m = r;
        if (m === i) break;
        [a[m], a[i]] = [a[i], a[m]];
        i = m;
      }
    }
    return top;
  }
}

const STEPS: [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

/** Sequência de células (índices) de `start` a `goal`, ou null se não houver ligação. */
export function findCellPath(g: NavGrid, start: number, goal: number): number[] | null {
  if (start < 0 || goal < 0 || !g.cells[start] || !g.cells[goal]) return null;
  const n = g.cells.length;
  const cost = new Float64Array(n).fill(Infinity);
  const score = new Float64Array(n).fill(Infinity);
  const from = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const gi = goal % g.cols;
  const gk = (goal - gi) / g.cols;
  const h = (c: number) => {
    const i = c % g.cols;
    const k = (c - i) / g.cols;
    const dx = Math.abs(i - gi);
    const dk = Math.abs(k - gk);
    return Math.max(dx, dk) + (Math.SQRT2 - 1) * Math.min(dx, dk);
  };
  const heap = new MinHeap(score);
  cost[start] = 0;
  score[start] = h(start);
  heap.push(start);
  while (heap.size) {
    const c = heap.pop();
    if (closed[c]) continue;
    if (c === goal) {
      const path = [c];
      for (let p = from[c]; p >= 0; p = from[p]) path.push(p);
      return path.reverse();
    }
    closed[c] = 1;
    const i = c % g.cols;
    const k = (c - i) / g.cols;
    for (const [di, dk, w] of STEPS) {
      const ii = i + di;
      const kk = k + dk;
      if (ii < 0 || kk < 0 || ii >= g.cols || kk >= g.rows) continue;
      const nb = kk * g.cols + ii;
      if (!g.cells[nb] || closed[nb]) continue;
      // Diagonal só se as duas células ortogonais também estiverem livres (não corta quinas).
      if (di && dk && (!g.cells[k * g.cols + ii] || !g.cells[kk * g.cols + i])) continue;
      const next = cost[c] + w;
      if (next < cost[nb]) {
        cost[nb] = next;
        from[nb] = c;
        score[nb] = next + h(nb);
        heap.push(nb);
      }
    }
  }
  return null;
}

/** Há linha de visada livre (todas as células atravessadas caminháveis) entre dois pontos? */
export function lineOfSight(g: NavGrid, a: Point, b: Point): boolean {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const steps = Math.max(1, Math.ceil(len / (g.cell / 3)));
  for (let s = 0; s <= steps; s++) {
    const t = s / steps;
    const x = a[0] + (b[0] - a[0]) * t;
    const z = a[1] + (b[1] - a[1]) * t;
    const i = Math.floor((x - g.bounds.minX) / g.cell);
    const k = Math.floor((z - g.bounds.minZ) / g.cell);
    if (i < 0 || k < 0 || i >= g.cols || k >= g.rows || !g.cells[k * g.cols + i]) return false;
  }
  return true;
}

/** Percurso simplificado em pontos do mundo (x, z), de `from` a `to`, ou null. */
export function findPath(g: NavGrid, from: Point, to: Point): Point[] | null {
  const start = nearestWalkable(g, from[0], from[1]);
  const goal = nearestWalkable(g, to[0], to[1]);
  const cells = findCellPath(g, start, goal);
  if (!cells) return null;
  const pts: Point[] = cells.map((c) => cellCenter(g, c));
  // O primeiro ponto é a posição real do visitante quando ela é caminhável.
  if (lineOfSight(g, from, pts[0])) pts[0] = [from[0], from[1]];
  const out: Point[] = [pts[0]];
  let anchor = 0;
  for (let j = 2; j < pts.length; j++) {
    if (!lineOfSight(g, pts[anchor], pts[j])) {
      out.push(pts[j - 1]);
      anchor = j - 1;
    }
  }
  if (pts.length > 1) out.push(pts[pts.length - 1]);
  return out;
}

export const pathLength = (path: Point[]) =>
  path.reduce((s, p, j) => (j ? s + Math.hypot(p[0] - path[j - 1][0], p[1] - path[j - 1][1]) : 0), 0);

/**
 * Ponto para onde a seta deve apontar: o primeiro canto do percurso (ou o destino), visto do
 * primeiro ponto. Como o percurso é simplificado por visada, esse ponto é sempre visível em
 * linha reta pela grade.
 */
export const steeringPoint = (path: Point[]): Point => path[Math.min(1, path.length - 1)];
