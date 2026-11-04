/**
 * Geometria dos volumes de interação (caixas orientadas): raio × caixa, distância, lado
 * frontal e projeção na tela com recorte no plano próximo. Matemática pura, sem dependência
 * do motor, para poder ser testada isoladamente.
 *
 * Matrizes 4×4 em ordem de colunas (convenção do PlayCanvas/WebGL).
 */
import type { InteractionVolume, Occluder, OrientedBox, Vec3 } from "@/data/interactions";

export type Mat4 = ArrayLike<number>;
export type Vec2 = [number, number];

const DEG = Math.PI / 180;

export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s];
export const length = (a: Vec3) => Math.hypot(a[0], a[1], a[2]);
export const normalize = (a: Vec3): Vec3 => scale(a, 1 / (length(a) || 1));

/** Eixos locais (X, Y, Z) do volume no mundo. Rotação composta Ry · Rx · Rz. */
export function volumeAxes(v: Pick<InteractionVolume, "rotationDeg">): [Vec3, Vec3, Vec3] {
  const [rx, ry, rz] = v.rotationDeg.map((d) => d * DEG);
  const [cx, sx, cy, sy, cz, sz] = [Math.cos(rx), Math.sin(rx), Math.cos(ry), Math.sin(ry), Math.cos(rz), Math.sin(rz)];
  // Colunas de R = Ry · Rx · Rz.
  const ax: Vec3 = [cy * cz + sy * sx * sz, cx * sz, -sy * cz + cy * sx * sz];
  const ay: Vec3 = [-cy * sz + sy * sx * cz, cx * cz, sy * sz + cy * sx * cz];
  const az: Vec3 = [sy * cx, -sx, cy * cx];
  return [ax, ay, az];
}

/** Os 8 cantos do volume no mundo (índice: bit 0 = X, bit 1 = Y, bit 2 = Z). */
export function volumeCorners(v: OrientedBox): Vec3[] {
  const axes = volumeAxes(v);
  const half = scale(v.size, 0.5);
  const corners: Vec3[] = [];
  for (let i = 0; i < 8; i++) {
    let p = v.position;
    for (let k = 0; k < 3; k++) p = add(p, scale(axes[k], (i >> k) & 1 ? half[k] : -half[k]));
    corners.push(p);
  }
  return corners;
}

/** Arestas da caixa (pares de índices de `volumeCorners`). */
export const BOX_EDGES: [number, number][] = [
  [0, 1], [2, 3], [4, 5], [6, 7],
  [0, 2], [1, 3], [4, 6], [5, 7],
  [0, 4], [1, 5], [2, 6], [3, 7],
];

const toLocal = (p: Vec3, v: OrientedBox, axes = volumeAxes(v)): Vec3 => {
  const d = sub(p, v.position);
  return [dot(d, axes[0]), dot(d, axes[1]), dot(d, axes[2])];
};

/**
 * Distância ao longo do raio até a entrada no volume (0 se a origem estiver dentro), ou
 * null se o raio não o atinge. `dir` deve ser unitário.
 */
export function rayVolume(origin: Vec3, dir: Vec3, v: OrientedBox): number | null {
  const axes = volumeAxes(v);
  const o = toLocal(origin, v, axes);
  const d: Vec3 = [dot(dir, axes[0]), dot(dir, axes[1]), dot(dir, axes[2])];
  let tMin = 0;
  let tMax = Infinity;
  for (let k = 0; k < 3; k++) {
    const h = v.size[k] / 2;
    if (Math.abs(d[k]) < 1e-9) {
      if (o[k] < -h || o[k] > h) return null;
      continue;
    }
    let t1 = (-h - o[k]) / d[k];
    let t2 = (h - o[k]) / d[k];
    if (t1 > t2) [t1, t2] = [t2, t1];
    tMin = Math.max(tMin, t1);
    tMax = Math.min(tMax, t2);
    if (tMin > tMax) return null;
  }
  return tMin;
}

/** Distância do ponto à superfície do volume (0 dentro dele). */
export function distanceToVolume(p: Vec3, v: OrientedBox): number {
  const l = toLocal(p, v);
  const out: Vec3 = [0, 1, 2].map((k) => Math.max(0, Math.abs(l[k]) - v.size[k] / 2)) as Vec3;
  return length(out);
}

/** Ângulo máximo, a partir da frente do volume, de onde ele pode ser visto e usado. */
export const MAX_VIEW_ANGLE_DEG = 70;

/**
 * O ponto está à frente do volume (além da face +Z local) e dentro de `MAX_VIEW_ANGLE_DEG`
 * da direção frontal? É a oclusão disponível: o splat não tem geometria por objeto, e os
 * objetos ficam dentro de nichos de expositor, então não se interage com eles por trás nem
 * de lado, através das laterais e do fundo do móvel.
 */
export function isInFront(p: Vec3, v: OrientedBox): boolean {
  const l = toLocal(p, v);
  if (l[2] <= v.size[2] / 2) return false;
  return Math.atan2(Math.hypot(l[0], l[1]), l[2]) <= MAX_VIEW_ANGLE_DEG * DEG;
}

/**
 * Volume selecionado por um raio: o mais próximo atingido, com a origem à frente dele e a
 * menos de `maxDistance`, e sem nenhum bloqueador atingido antes.
 */
export function castRay(
  origin: Vec3,
  dir: Vec3,
  volumes: readonly InteractionVolume[],
  occluders: readonly Occluder[] = [],
): InteractionVolume | null {
  let best: InteractionVolume | null = null;
  let bestT = Infinity;
  for (const v of volumes) {
    if (!isInFront(origin, v) || distanceToVolume(origin, v) > v.maxDistance) continue;
    const t = rayVolume(origin, dir, v);
    if (t !== null && t < bestT) {
      best = v;
      bestT = t;
    }
  }
  if (!best) return null;
  for (const o of occluders) {
    const t = rayVolume(origin, dir, o);
    if (t !== null && t < bestT) return null;
  }
  return best;
}

/** Ponto multiplicado pela matriz (resultado em coordenadas de recorte). */
export function transform(m: Mat4, p: Vec3): [number, number, number, number] {
  const [x, y, z] = p;
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
    m[3] * x + m[7] * y + m[11] * z + m[15],
  ];
}

/** Recorte mínimo em w (antes do plano da câmera nada é projetado). */
const W_EPS = 0.01;

const toScreen = (c: [number, number, number, number], width: number, height: number): Vec2 => [
  (c[0] / c[3] * 0.5 + 0.5) * width,
  (0.5 - (c[1] / c[3]) * 0.5) * height,
];

/** Projeta um ponto em pixels da área de visualização; null se estiver atrás da câmera. */
export function projectPoint(viewProj: Mat4, p: Vec3, width: number, height: number): Vec2 | null {
  const c = transform(viewProj, p);
  return c[3] > W_EPS ? toScreen(c, width, height) : null;
}

/** Segmento 3D recortado na frente da câmera e projetado; null se estiver todo atrás. */
export function projectSegment(viewProj: Mat4, a: Vec3, b: Vec3, width: number, height: number): [Vec2, Vec2] | null {
  let ca = transform(viewProj, a);
  let cb = transform(viewProj, b);
  if (ca[3] <= W_EPS && cb[3] <= W_EPS) return null;
  const lerp = (p: number[], q: number[], t: number) => p.map((x, i) => x + (q[i] - x) * t) as typeof ca;
  if (ca[3] <= W_EPS) ca = lerp(ca, cb, (W_EPS - ca[3]) / (cb[3] - ca[3]));
  else if (cb[3] <= W_EPS) cb = lerp(cb, ca, (W_EPS - cb[3]) / (ca[3] - cb[3]));
  return [toScreen(ca, width, height), toScreen(cb, width, height)];
}

/** Casco convexo (cadeia monótona), no sentido anti-horário. */
export function convexHull(points: Vec2[]): Vec2[] {
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (o: Vec2, a: Vec2, b: Vec2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: Vec2[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper: Vec2[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
    upper.push(p);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

/** Contorno do volume na tela: casco convexo das arestas recortadas e projetadas. */
export function projectedOutline(viewProj: Mat4, v: OrientedBox, width: number, height: number): Vec2[] {
  const corners = volumeCorners(v);
  const points: Vec2[] = [];
  for (const [i, j] of BOX_EDGES) {
    const seg = projectSegment(viewProj, corners[i], corners[j], width, height);
    if (seg) points.push(seg[0], seg[1]);
  }
  return convexHull(points);
}

/** Inversa de uma matriz 4×4 (ordem de colunas); null se for singular. */
export function invert(m: Mat4): number[] | null {
  const a = Array.from(m);
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = a;
  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;
  const det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
  if (!det) return null;
  const s = 1 / det;
  return [
    (a11 * b11 - a12 * b10 + a13 * b09) * s,
    (a02 * b10 - a01 * b11 - a03 * b09) * s,
    (a31 * b05 - a32 * b04 + a33 * b03) * s,
    (a22 * b04 - a21 * b05 - a23 * b03) * s,
    (a12 * b08 - a10 * b11 - a13 * b07) * s,
    (a00 * b11 - a02 * b08 + a03 * b07) * s,
    (a32 * b02 - a30 * b05 - a33 * b01) * s,
    (a20 * b05 - a22 * b02 + a23 * b01) * s,
    (a10 * b10 - a11 * b08 + a13 * b06) * s,
    (a01 * b08 - a00 * b10 - a03 * b06) * s,
    (a30 * b04 - a31 * b02 + a33 * b00) * s,
    (a21 * b02 - a20 * b04 - a23 * b00) * s,
    (a11 * b07 - a10 * b09 - a12 * b06) * s,
    (a00 * b09 - a01 * b07 + a02 * b06) * s,
    (a31 * b01 - a30 * b03 - a32 * b00) * s,
    (a20 * b03 - a21 * b01 + a22 * b00) * s,
  ];
}

/** Direção (unitária) do raio que passa pelo pixel (x, y) da área de visualização. */
export function rayThroughPixel(inverseViewProj: Mat4, x: number, y: number, width: number, height: number): Vec3 {
  const nx = (x / width) * 2 - 1;
  const ny = 1 - (y / height) * 2;
  const unproject = (z: number): Vec3 => {
    const c = transform(inverseViewProj, [nx, ny, z]);
    return [c[0] / c[3], c[1] / c[3], c[2] / c[3]];
  };
  return normalize(sub(unproject(1), unproject(-1)));
}
