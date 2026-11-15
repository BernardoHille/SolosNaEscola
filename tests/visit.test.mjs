/**
 * Testes do sistema de orientação (minimapa, catálogo, progresso e visita guiada).
 *
 * Uso: npm test   (Node >= 22.18 executa o TypeScript de src/lib/visit diretamente)
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildExhibitionModules,
  buildGuidedRoute,
  distanceToFootprint,
  hasArrived,
  isInFrontOf,
  nearestObjectPoint,
  spreadPoints,
} from "../src/lib/visit/exhibitionModules.ts";
import {
  decodeGrid,
  isWalkable,
  mapHeadingDeg,
  mapToWorld,
  relativeBearingDeg,
  worldToMap,
} from "../src/lib/visit/mapGeometry.ts";
import { findPath, lineOfSight, pathLength } from "../src/lib/visit/pathfinding.ts";
import {
  EMPTY_VISIT,
  markExplored,
  parseStoredVisit,
  progressLabel,
  progressOf,
  serializeVisit,
} from "../src/lib/visit/visitProgress.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const json = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));
const read = (path) => readFileSync(resolve(root, path), "utf8");

const exhibition = json("src/data/exhibition.json");
const map = json("src/data/exhibitionMap.json");
const interactions = json("src/data/interactions.json");
const grid = decodeGrid(map);
const ENTRANCE = [-0.27, -4.1];

/** Ids dos conjuntos registrados no app (lidos das chaves de inspectionSets/inspectionCatalogs). */
const knownSetIds = () => {
  const ids = [];
  for (const file of ["src/data/inspectionSets.ts", "src/data/inspectionCatalogs.ts"]) {
    for (const [, constName] of read(file).matchAll(/\[([A-Z_]+)\.id\]/g)) {
      const source = read(file).match(new RegExp(`import \\{[^}]*\\b${constName}\\b[^}]*\\} from "\\./(\\w+)"`));
      const path = source[1] === "inspection" ? "src/data/inspection.ts" : `src/data/${source[1]}.ts`;
      const body = read(path).split(`export const ${constName}`)[1];
      ids.push(body.match(/id: "([^"]+)"/)[1]);
    }
  }
  return ids;
};
const modules = () => buildExhibitionModules(exhibition.topics, interactions.volumes, knownSetIds(), map.stops);

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test("mapa: mundo ↔ mapa, entrada embaixo, sem espelhamento", () => {
  const b = map.bounds;
  const [u, v] = worldToMap(b, ENTRANCE[0], ENTRANCE[1]);
  const [x, z] = mapToWorld(b, u, v);
  close(x, ENTRANCE[0]);
  close(z, ENTRANCE[1]);
  // A entrada (−Z) fica na metade de baixo do mapa; o fundo da sala (+Z), em cima.
  assert.ok(v > (b.maxZ - b.minZ) * 0.8);
  assert.ok(worldToMap(b, 0, 3)[1] < worldToMap(b, 0, -3)[1]);
  // Quem entra olhando para +Z tem −X à direita: −X fica à direita no mapa.
  assert.ok(worldToMap(b, -3, 0)[0] > worldToMap(b, 3, 0)[0]);
  // Yaw 180 (olhando para dentro da sala) aponta para cima; 90 (−X) para a direita.
  close(mapHeadingDeg(180), 0);
  close(mapHeadingDeg(90), 90);
  close(Math.abs(mapHeadingDeg(0)), 180);
});

test("direção relativa: em frente, à direita, à esquerda e atrás", () => {
  // Olhando para +Z (yaw 180): +Z em frente, −X à direita, +X à esquerda.
  close(relativeBearingDeg([0, 0], 180, [0, 5]), 0);
  close(relativeBearingDeg([0, 0], 180, [-5, 0]), 90);
  close(relativeBearingDeg([0, 0], 180, [5, 0]), -90);
  close(Math.abs(relativeBearingDeg([0, 0], 180, [0, -5])), 180);
});

test("mapa gerado a partir da colisão atual", () => {
  const meta = json("public/models/museu_web.voxel.json");
  assert.equal(map.collision.nodeCount, meta.nodeCount, "rode npm run map depois de npm run collision");
  assert.equal(map.collision.leafDataCount, meta.leafDataCount);
  assert.ok(map.floorPath.startsWith("M") && map.furniturePath.startsWith("M"));
  assert.equal(grid.cells.length, map.cols * map.rows);
  assert.ok(isWalkable(grid, ...ENTRANCE), "a entrada é caminhável");
  // Sobre os móveis não se anda: o centro de cada volume não é caminhável.
  for (const v of interactions.volumes) assert.ok(!isWalkable(grid, v.position[0], v.position[2]), v.id);
});

test("paradas: uma por conjunto, caminhável, ligada à entrada, em frente e ao alcance do volume", () => {
  const sets = new Set(interactions.volumes.map((v) => v.setId));
  assert.deepEqual(new Set(Object.keys(map.stops)), sets);
  for (const [setId, stop] of Object.entries(map.stops)) {
    assert.ok(isWalkable(grid, ...stop), setId);
    assert.ok(findPath(grid, ENTRANCE, stop), `${setId}: sem percurso a partir da entrada`);
    const volumes = interactions.volumes.filter((v) => v.setId === setId);
    const reach = volumes.some((v) => {
      const yaw = (v.rotationDeg[1] * Math.PI) / 180;
      const front = (stop[0] - v.position[0]) * Math.sin(yaw) + (stop[1] - v.position[2]) * Math.cos(yaw);
      return front > 0 && Math.hypot(stop[0] - v.position[0], stop[1] - v.position[2]) < v.maxDistance;
    });
    assert.ok(reach, `${setId}: parada fora do alcance ou atrás do volume`);
  }
});

test("percurso: só por células caminháveis e mais longo que a reta quando há móvel no meio", () => {
  const from = ENTRANCE;
  const to = map.stops["solo-ampliado"];
  const path = findPath(grid, from, to);
  assert.ok(path.length >= 2);
  for (let j = 1; j < path.length; j++) assert.ok(lineOfSight(grid, path[j - 1], path[j]));
  assert.ok(pathLength(path) >= Math.hypot(to[0] - from[0], to[1] - from[1]) - 1e-6);
  // Da frente da fileira do meio para trás dela, a reta atravessa as mesas; o percurso contorna.
  const front = map.stops["ar-no-solo"];
  const back = map.stops["solo-na-paisagem"];
  assert.ok(!lineOfSight(grid, front, back));
  assert.ok(pathLength(findPath(grid, front, back)) > Math.hypot(back[0] - front[0], back[1] - front[1]) + 1);
});

test("módulos: 27 tópicos, volumes agrupados por conjunto, disponíveis só os com interação", () => {
  const all = modules();
  assert.equal(all.length, 27);
  assert.deepEqual(
    all.map((m) => m.number),
    Array.from({ length: 27 }, (_, i) => i + 1),
  );
  const available = all.filter((m) => m.available);
  // Todo conjunto com volume vira exatamente um módulo disponível.
  const sets = [...new Set(interactions.volumes.map((v) => v.setId))].sort();
  assert.deepEqual(available.map((m) => m.setId).sort(), sets);
  const formation = all.find((m) => m.setId === "formacao-do-solo");
  assert.equal(formation.volumeIds.length, interactions.volumes.filter((v) => v.setId === "formacao-do-solo").length);
  assert.ok(formation.volumeIds.length > 1);
  const profiles = all.find((m) => m.setId === "colecao-de-perfis-de-solo");
  assert.ok(profiles.volumeIds.length > 10);
  // Sem conjunto: indisponível, sem ação possível (sem setId, posição ou parada).
  for (const n of [12, 13, 21, 22, 23, 24, 25, 26, 27]) {
    const m = all.find((t) => t.number === n);
    assert.equal(m.available, false, `módulo ${n}`);
    assert.equal(m.setId, null);
    assert.equal(m.stop, null);
    assert.equal(m.position, null);
  }
  for (const m of all) assert.ok(m.title && m.summary.endsWith("."), `módulo ${m.number}`);
});

test("módulo com setId mas sem conjunto ou sem volume não fica disponível", () => {
  const topics = [
    { number: 1, title: "A", summary: "a.", setId: "existe" },
    { number: 2, title: "B", summary: "b.", setId: "sem-conjunto" },
    { number: 3, title: "C", summary: "c.", setId: "sem-volume" },
  ];
  const vol = (setId) => ({ id: setId, setId, position: [0, 1, 0], rotationDeg: [0, 0, 0], size: [1, 1, 1] });
  const out = buildExhibitionModules(topics, [vol("existe"), vol("sem-conjunto")], ["existe", "sem-volume"], {
    existe: [0, 1],
    "sem-conjunto": [0, 1],
    "sem-volume": [0, 1],
  });
  assert.deepEqual(
    out.map((m) => m.available),
    [true, false, false],
  );
});

test("visita guiada: ordem do roteiro, todos os disponíveis, sem repetição", () => {
  const all = modules();
  const route = buildGuidedRoute(all, exhibition.guidedRoute);
  assert.deepEqual(
    route.map((m) => m.id),
    exhibition.guidedRoute,
  );
  assert.equal(route.length, all.filter((m) => m.available).length);
  // A sequência segue a numeração do roteiro.
  for (let j = 1; j < route.length; j++) assert.ok(route[j].number > route[j - 1].number);
  // Ids desconhecidos são ignorados e disponíveis fora da lista entram no fim.
  const partial = buildGuidedRoute(all, ["inexistente", "textura-do-solo", "textura-do-solo"]);
  assert.equal(partial[0].id, "textura-do-solo");
  assert.equal(partial.length, route.length);
  // Cada etapa tem percurso a partir da anterior (começando na entrada).
  let pos = ENTRANCE;
  for (const m of route) {
    assert.ok(findPath(grid, pos, m.stop), m.id);
    pos = m.stop;
  }
});

test("chegada: perto da parada ou ao lado do objeto, não do outro lado da sala", () => {
  const m = modules().find((t) => t.setId === "textura-do-solo");
  assert.ok(hasArrived(m, m.stop));
  assert.ok(!hasArrived(m, ENTRANCE));
  const f = m.footprints[0];
  close(distanceToFootprint(f, [f.x, f.z]), 0);
  // Um ponto 2 m em frente ao centro está a 2 − profundidade/2 da caixa.
  const yaw = (f.yawDeg * Math.PI) / 180;
  close(distanceToFootprint(f, [f.x + 2 * Math.sin(yaw), f.z + 2 * Math.cos(yaw)]), 2 - f.depth / 2, 1e-9);
});

test("chegada só do lado da frente; ao chegar, a seta aponta para o objeto mais próximo", () => {
  const m = modules().find((t) => t.setId === "textura-do-solo");
  const f = m.footprints[0];
  const yaw = (f.yawDeg * Math.PI) / 180;
  const front = [f.x + Math.sin(yaw) * (f.depth / 2 + 0.5), f.z + Math.cos(yaw) * (f.depth / 2 + 0.5)];
  const back = [f.x - Math.sin(yaw) * (f.depth / 2 + 0.5), f.z - Math.cos(yaw) * (f.depth / 2 + 0.5)];
  assert.ok(isInFrontOf(f, front) && !isInFrontOf(f, back));
  const lone = { ...m, stop: [99, 99] };
  assert.ok(hasArrived(lone, front));
  assert.ok(!hasArrived(lone, back), "atrás do móvel não conta");
  assert.deepEqual(nearestObjectPoint(m, front), [f.x, f.z]);
});

test("pontos do mapa: módulos no mesmo móvel ficam separados, os demais não se movem", () => {
  const pts = [
    [1.04, -4.41],
    [1.27, -4.47],
    [-4.8, 0.5],
  ];
  const out = spreadPoints(pts, 0.4);
  assert.ok(Math.hypot(out[0][0] - out[1][0], out[0][1] - out[1][1]) >= 0.4 - 1e-6);
  assert.deepEqual(out[2], pts[2]);
  // Coincidentes também se separam.
  const same = spreadPoints([[0, 0], [0, 0]], 0.3);
  assert.ok(Math.hypot(same[0][0] - same[1][0], same[0][1] - same[1][1]) >= 0.3 - 1e-6);
});

test("progresso: abrir conta uma vez, só módulos disponíveis, total da versão atual", () => {
  const ids = modules()
    .filter((m) => m.available)
    .map((m) => m.id);
  let explored = [];
  explored = markExplored(explored, "textura-do-solo", ids);
  const same = markExplored(explored, "textura-do-solo", ids);
  assert.equal(same, explored, "reabrir não muda a contagem");
  assert.equal(markExplored(explored, "topico-12", ids), explored, "indisponível não conta");
  const p = progressOf(explored, ids);
  assert.deepEqual(p, { count: 1, total: ids.length });
  assert.equal(progressLabel(p), `1 de ${ids.length} módulos explorados`);
  assert.equal(ids.length, 18);
});

test("progresso salvo: leitura segura, ids antigos descartados, etapa dentro do percurso", () => {
  const ids = ["a", "b", "c"];
  assert.deepEqual(parseStoredVisit(null, ids, 3), EMPTY_VISIT);
  assert.deepEqual(parseStoredVisit("{quebrado", ids, 3), EMPTY_VISIT);
  assert.deepEqual(parseStoredVisit("42", ids, 3), EMPTY_VISIT);
  const v = parseStoredVisit(
    JSON.stringify({ explored: ["a", "velho", "a", 7, "c"], mode: "guided", guideStep: 9, minimapOpen: false }),
    ids,
    3,
  );
  assert.deepEqual(v, { version: 1, explored: ["a", "c"], mode: "guided", guideStep: 2, minimapOpen: false });
  assert.deepEqual(parseStoredVisit(serializeVisit(v), ids, 3), v);
  assert.equal(parseStoredVisit(JSON.stringify({ mode: "x", guideStep: -4 }), ids, 3).mode, "free");
  assert.equal(parseStoredVisit(JSON.stringify({ guideStep: -4 }), ids, 3).guideStep, 0);
});

test("progresso registrado na abertura da inspeção, por todas as entradas", () => {
  // O registro fica no callback único que abre a inspeção (tecla E, clique e toque passam por ele).
  const src = read("src/components/viewer/Exhibition.tsx");
  assert.match(src, /const inspect = useCallback\(\s*\(volume: InteractionVolume\) => \{[^}]*markExplored\(volume\.setId\)/s);
  assert.match(read("src/components/interaction/InteractionLayer.tsx"), /onInspect/);
});
