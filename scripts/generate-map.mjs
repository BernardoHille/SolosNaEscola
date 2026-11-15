#!/usr/bin/env node
/**
 * Gera a planta do minimapa e os pontos de parada dos módulos a partir da colisão por voxels.
 *
 * Uso:   npm run map      (rode de novo depois de `npm run collision` ou ao mudar `interactions.json`)
 *
 * Entrada:  public/models/museu_web.voxel.json/.bin  (a mesma colisão do Walk Mode; não é modificada)
 *           src/data/collision.json                  (altura da cápsula e ponto de partida da geração)
 *           src/data/interactions.json               (volumes de interação, agrupados por `setId`)
 * Saída:    src/data/exhibitionMap.json
 *
 * O que sai, tudo em metros:
 * - `floorPath` e `furniturePath`: contornos (SVG, regra evenodd) do piso livre e dos móveis, no
 *   espaço do mapa (ver `mapGeometry.ts`: u = maxX − x, v = maxZ − z, entrada embaixo);
 * - `grid`: grade de 10 cm do espaço caminhável com folga para a cápsula do Walk Mode (base64,
 *   1 bit por célula), usada para calcular o percurso até um módulo;
 * - `stops`: um ponto de parada por conjunto (`setId`), na área caminhável, em frente ao volume.
 *
 * Classificação de cada coluna (x, z) da grade de 5 cm da colisão:
 * - piso livre: há voxel sólido no piso (−0,3 a 0,1 m) e nenhum entre 0,15 e 1,7 m;
 * - móvel: sólido em parte da faixa de 0,15 a 1,7 m (mesas, estantes, bancadas);
 * - parede ou exterior: sólido em quase toda a faixa (≥ 85 %).
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));

const config = readJson("src/data/collision.json");
const meta = readJson(`public/${config.voxelFile}`);
const interactions = readJson("src/data/interactions.json");
const bin = readFileSync(resolve(root, "public", config.voxelFile.replace(/\.json$/, ".bin")));

const SOLID = 0xff000000;
const BAND = [0.15, 1.7];
const FLOOR = [-0.3, 0.1];
const WALL_FRACTION = 0.85;
const CELL = 0.1;
const CLEARANCE = config.generation.carveCapsule.radius;
/** Distância mínima e máxima (m) entre a frente do volume e o ponto de parada. */
const STOP_RANGE = [0.45, 1.6];

// --- Octree (formato v1.1 do splat-transform, o mesmo lido pelo viewer) -------------------------

const words = new Uint32Array(bin.buffer, bin.byteOffset, bin.byteLength / 4);
const nodes = words.subarray(0, meta.nodeCount);
const leafData = words.subarray(meta.nodeCount, meta.nodeCount + meta.leafDataCount);
const res = meta.voxelResolution;
const gmin = meta.gridBounds.min;
const dims = [0, 1, 2].map((a) => Math.round((meta.gridBounds.max[a] - gmin[a]) / res));
const [NX, NY, NZ] = dims;
const L = meta.leafSize;
const solid = new Uint8Array(NX * NY * NZ);
const idx = (x, y, z) => (z * NY + y) * NX + x;
const set = (x, y, z) => {
  if (x < NX && y < NY && z < NZ) solid[idx(x, y, z)] = 1;
};

const popcount = (n) => {
  let c = 0;
  for (; n; n &= n - 1) c++;
  return c;
};

function visit(i, level, bx, by, bz) {
  const node = nodes[i] >>> 0;
  const size = 1 << (level + 1);
  if (node === SOLID) {
    for (let z = bz * L; z < (bz + size) * L; z++)
      for (let y = by * L; y < (by + size) * L; y++) for (let x = bx * L; x < (bx + size) * L; x++) set(x, y, z);
    return;
  }
  const childMask = (node >>> 24) & 0xff;
  if (level < 0 || childMask === 0) {
    const leaf = node & 0xffffff;
    const lo = leafData[leaf * 2] >>> 0;
    const hi = leafData[leaf * 2 + 1] >>> 0;
    for (let b = 0; b < 64; b++) {
      const on = b < 32 ? (lo >>> b) & 1 : (hi >>> (b - 32)) & 1;
      if (on) set(bx * L + (b & 3), by * L + ((b >> 2) & 3), bz * L + (b >> 4));
    }
    return;
  }
  const base = node & 0xffffff;
  const half = 1 << level;
  for (let o = 0; o < 8; o++) {
    if (!(childMask & (1 << o))) continue;
    const child = base + popcount(childMask & ((1 << o) - 1));
    visit(child, level - 1, bx + (o & 1) * half, by + ((o >> 1) & 1) * half, bz + ((o >> 2) & 1) * half);
  }
}
visit(0, meta.treeDepth - 1, 0, 0, 0);

// --- Colunas (5 cm) ------------------------------------------------------------------------------

const yOf = (iy) => gmin[1] + (iy + 0.5) * res;
const walk5 = new Uint8Array(NX * NZ);
const furn5 = new Uint8Array(NX * NZ);
let bandCount = 0;
for (let iy = 0; iy < NY; iy++) if (yOf(iy) > BAND[0] && yOf(iy) < BAND[1]) bandCount++;
for (let z = 0; z < NZ; z++) {
  for (let x = 0; x < NX; x++) {
    let floor = false;
    let band = 0;
    for (let iy = 0; iy < NY; iy++) {
      if (!solid[idx(x, iy, z)]) continue;
      const y = yOf(iy);
      if (y > FLOOR[0] && y < FLOOR[1]) floor = true;
      if (y > BAND[0] && y < BAND[1]) band++;
    }
    if (floor && band === 0) walk5[z * NX + x] = 1;
    else if (band > 0 && band / bandCount < WALL_FRACTION) furn5[z * NX + x] = 1;
  }
}

// Folga da cápsula: livre só onde todo o disco de raio CLEARANCE é piso livre.
const r5 = Math.round(CLEARANCE / res);
const clear5 = new Uint8Array(NX * NZ);
for (let z = 0; z < NZ; z++) {
  for (let x = 0; x < NX; x++) {
    if (!walk5[z * NX + x]) continue;
    let ok = true;
    for (let dz = -r5; dz <= r5 && ok; dz++) {
      for (let dx = -r5; dx <= r5; dx++) {
        if (dx * dx + dz * dz > r5 * r5) continue;
        const xx = x + dx;
        const zz = z + dz;
        if (xx < 0 || zz < 0 || xx >= NX || zz >= NZ || !walk5[zz * NX + xx]) {
          ok = false;
          break;
        }
      }
    }
    clear5[z * NX + x] = ok ? 1 : 0;
  }
}

// --- Grade de 10 cm, recortada na sala -----------------------------------------------------------

const step = Math.round(CELL / res);
let minI = Infinity;
let maxI = -Infinity;
let minK = Infinity;
let maxK = -Infinity;
for (let z = 0; z < NZ; z++)
  for (let x = 0; x < NX; x++)
    if (walk5[z * NX + x]) {
      minI = Math.min(minI, x);
      maxI = Math.max(maxI, x);
      minK = Math.min(minK, z);
      maxK = Math.max(maxK, z);
    }
const margin = 4; // células de 5 cm (20 cm) em volta do piso
minI = Math.max(0, minI - margin) - (Math.max(0, minI - margin) % step);
minK = Math.max(0, minK - margin) - (Math.max(0, minK - margin) % step);
const cols = Math.ceil((Math.min(NX, maxI + margin + 1) - minI) / step);
const rows = Math.ceil((Math.min(NZ, maxK + margin + 1) - minK) / step);
const round = (n, d = 3) => Math.round(n * 10 ** d) / 10 ** d;
const minX = round(gmin[0] + minI * res);
const minZ = round(gmin[2] + minK * res);
const maxX = round(minX + cols * CELL);
const maxZ = round(minZ + rows * CELL);

const down = (src, rule) => {
  const out = new Uint8Array(cols * rows);
  for (let k = 0; k < rows; k++)
    for (let i = 0; i < cols; i++) {
      let n = 0;
      for (let a = 0; a < step; a++)
        for (let b = 0; b < step; b++) {
          const x = minI + i * step + a;
          const z = minK + k * step + b;
          if (x < NX && z < NZ && src[z * NX + x]) n++;
        }
      out[k * cols + i] = rule(n) ? 1 : 0;
    }
  return out;
};
const half = (step * step) / 2;
const floorCells = down(walk5, (n) => n >= half);
const furnitureCells = down(furn5, (n) => n >= half);
let navCells = down(clear5, (n) => n > 0);

// Só o espaço ligado à entrada (o ponto de partida da colisão) conta como caminhável.
const cellOf = (x, z) => [Math.floor((x - minX) / CELL), Math.floor((z - minZ) / CELL)];
const centerOf = (i, k) => [minX + (i + 0.5) * CELL, minZ + (k + 0.5) * CELL];
{
  const [si, sk] = cellOf(config.generation.seedPosition[0], config.generation.seedPosition[2]);
  if (!navCells[sk * cols + si]) throw new Error("O ponto de partida da colisão não está na área caminhável.");
  const reached = new Uint8Array(cols * rows);
  const queue = [sk * cols + si];
  reached[queue[0]] = 1;
  while (queue.length) {
    const c = queue.pop();
    const i = c % cols;
    const k = (c - i) / cols;
    for (const [di, dk] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const ii = i + di;
      const kk = k + dk;
      if (ii < 0 || kk < 0 || ii >= cols || kk >= rows) continue;
      const n = kk * cols + ii;
      if (navCells[n] && !reached[n]) {
        reached[n] = 1;
        queue.push(n);
      }
    }
  }
  navCells = reached;
}

// --- Contornos (SVG) -----------------------------------------------------------------------------

/** Contorno das células marcadas, em coordenadas do mapa (u = maxX − x, v = maxZ − z). */
function outline(cells) {
  const filled = (i, k) => i >= 0 && k >= 0 && i < cols && k < rows && cells[k * cols + i] === 1;
  // Arestas orientadas (sentido horário em i/k), indexadas pelo vértice de saída.
  const out = new Map();
  const add = (a, b) => {
    const key = `${a[0]},${a[1]}`;
    if (!out.has(key)) out.set(key, []);
    out.get(key).push(b);
  };
  for (let k = 0; k < rows; k++)
    for (let i = 0; i < cols; i++) {
      if (!filled(i, k)) continue;
      if (!filled(i, k - 1)) add([i, k], [i + 1, k]);
      if (!filled(i + 1, k)) add([i + 1, k], [i + 1, k + 1]);
      if (!filled(i, k + 1)) add([i + 1, k + 1], [i, k + 1]);
      if (!filled(i - 1, k)) add([i, k + 1], [i, k]);
    }
  const toMap = ([i, k]) => `${round(maxX - (minX + i * CELL), 2)} ${round(maxZ - (minZ + k * CELL), 2)}`;
  const parts = [];
  for (const [startKey] of out) {
    while (out.get(startKey)?.length) {
      const loop = [startKey.split(",").map(Number)];
      let key = startKey;
      for (;;) {
        const next = out.get(key).pop();
        if (!out.get(key).length) out.delete(key);
        key = `${next[0]},${next[1]}`;
        if (key === startKey) break;
        loop.push(next);
      }
      // Remove vértices colineares.
      const pts = loop.filter((p, j) => {
        const a = loop[(j - 1 + loop.length) % loop.length];
        const b = loop[(j + 1) % loop.length];
        return (p[0] - a[0]) * (b[1] - p[1]) - (p[1] - a[1]) * (b[0] - p[0]) !== 0;
      });
      if (pts.length >= 3) parts.push(`M${pts.map(toMap).join("L")}Z`);
    }
  }
  return parts.join("");
}

// --- Pontos de parada ----------------------------------------------------------------------------

const nav = (x, z) => {
  const [i, k] = cellOf(x, z);
  return i >= 0 && k >= 0 && i < cols && k < rows && navCells[k * cols + i] === 1;
};
const groups = new Map();
for (const v of interactions.volumes) {
  if (!groups.has(v.setId)) groups.set(v.setId, []);
  groups.get(v.setId).push(v);
}
const stops = {};
for (const [setId, volumes] of groups) {
  const cx = volumes.reduce((s, v) => s + v.position[0], 0) / volumes.length;
  const cz = volumes.reduce((s, v) => s + v.position[2], 0) / volumes.length;
  // Volume de referência: o mais perto do centro do grupo (ex.: o perfil do meio da parede).
  const anchor = [...volumes].sort(
    (a, b) => Math.hypot(a.position[0] - cx, a.position[2] - cz) - Math.hypot(b.position[0] - cx, b.position[2] - cz),
  )[0];
  const yaw = (anchor.rotationDeg[1] * Math.PI) / 180;
  const front = [Math.sin(yaw), Math.cos(yaw)]; // +Z local no plano X/Z
  const side = [Math.cos(yaw), -Math.sin(yaw)];
  let stop = null;
  for (let d = STOP_RANGE[0]; d <= STOP_RANGE[1] + 1e-9 && !stop; d += 0.05) {
    // De frente para o centro do volume e, se ali houver obstáculo, um pouco para os lados.
    for (const s of [0, 0.15, -0.15, 0.3, -0.3]) {
      const x = anchor.position[0] + front[0] * (anchor.size[2] / 2 + d) + side[0] * s;
      const z = anchor.position[2] + front[1] * (anchor.size[2] / 2 + d) + side[1] * s;
      if (nav(x, z)) {
        const [i, k] = cellOf(x, z);
        const [sx, sz] = centerOf(i, k);
        stop = [round(sx, 2), round(sz, 2)];
        break;
      }
    }
  }
  if (!stop) throw new Error(`Sem ponto de parada caminhável em frente a ${setId}.`);
  stops[setId] = stop;
}

// --- Saída ---------------------------------------------------------------------------------------

const bytes = new Uint8Array(Math.ceil((cols * rows) / 8));
navCells.forEach((v, c) => {
  if (v) bytes[c >> 3] |= 1 << (c & 7);
});

const out = {
  $comment:
    "Gerado por scripts/generate-map.mjs (npm run map) a partir da colisão por voxels e de interactions.json. Não edite à mão.",
  collision: { nodeCount: meta.nodeCount, leafDataCount: meta.leafDataCount },
  bounds: { minX, minZ, maxX, maxZ },
  cell: CELL,
  cols,
  rows,
  clearance: CLEARANCE,
  floorPath: outline(floorCells),
  furniturePath: outline(furnitureCells),
  grid: Buffer.from(bytes).toString("base64"),
  stops,
};
const file = resolve(root, "src/data/exhibitionMap.json");
writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);
console.log(
  `Mapa ${cols}×${rows} células de ${CELL} m (x ${minX}…${maxX}, z ${minZ}…${maxZ}); ` +
    `${navCells.reduce((s, v) => s + v, 0)} caminháveis; ${Object.keys(stops).length} paradas.`,
);
