/**
 * Testes da camada de interação e dos dados da inspeção.
 *
 * Uso: npm test   (Node >= 22.18: o Node executa o TypeScript de geometry.ts diretamente)
 */
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import { animationTimeAt } from "../src/lib/inspection/animationSync.ts";
import { MICROSCOPE_HOME, MICROSCOPE_MAX_ZOOM, clampView, panBy, viewTransform, zoomAt } from "../src/lib/inspection/microscopeView.ts";
import { goToStepLabel, nextStepLabel, stepPlural } from "../src/lib/inspection/stepLabels.ts";
import {
  castRay,
  convexHull,
  distanceToVolume,
  isInFront,
  projectedOutline,
  rayVolume,
  volumeAxes,
} from "../src/lib/interaction/geometry.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const json = (path) => JSON.parse(readFileSync(resolve(root, path), "utf8"));

const box = (over = {}) => ({
  id: "v",
  label: "v",
  setId: "s",
  order: 1,
  position: [0, 0, 0],
  rotationDeg: [0, 0, 0],
  size: [1, 1, 1],
  maxDistance: 3,
  ...over,
});

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

test("raio atinge a face frontal e erra ao lado", () => {
  const v = box();
  close(rayVolume([0, 0, 3], [0, 0, -1], v), 2.5);
  assert.equal(rayVolume([2, 0, 3], [0, 0, -1], v), null);
  // De dentro do volume, a distância é zero.
  assert.equal(rayVolume([0, 0, 0], [0, 0, -1], v), 0);
});

test("o volume mais próximo atingido tem a menor distância", () => {
  const near = box({ position: [0, 0, 1] });
  const far = box({ position: [0, 0, -1] });
  const o = [0, 0, 4];
  const d = [0, 0, -1];
  assert.ok(rayVolume(o, d, near) < rayVolume(o, d, far));
});

test("rotação: yaw de 90° leva a frente (+Z local) para +X", () => {
  const [, , az] = volumeAxes({ rotationDeg: [0, 90, 0] });
  close(az[0], 1);
  close(az[2], 0);
  // Raio vindo de +X atinge o volume girado; vindo de +Z, também (caixa cúbica), mas a
  // frente agora é +X.
  assert.ok(isInFront([3, 0, 0], box({ rotationDeg: [0, 90, 0] })));
  assert.ok(!isInFront([0, 0, 3], box({ rotationDeg: [0, 90, 0] })));
});

test("só interage pela frente, dentro do cone de visão", () => {
  const v = box({ size: [0.2, 0.15, 0.2] });
  assert.ok(isInFront([0, 0, 1.5], v)); // de frente
  assert.ok(isInFront([1, 0, 1.5], v)); // ~34° de lado
  assert.ok(!isInFront([0, 0, -1.5], v)); // por trás
  assert.ok(!isInFront([1.1, 0, 0.17], v)); // quase de lado (~81°), através da lateral do móvel
});

test("bloqueador na frente impede a seleção; atrás, não", () => {
  const v = box({ maxDistance: 5 });
  const wall = { id: "w", position: [0, 0, 2], rotationDeg: [0, 0, 0], size: [2, 2, 0.1] };
  const behind = { id: "b", position: [0, 0, -2], rotationDeg: [0, 0, 0], size: [2, 2, 0.1] };
  assert.equal(castRay([0, 0, 4], [0, 0, -1], [v]), v);
  assert.equal(castRay([0, 0, 4], [0, 0, -1], [v], [wall]), null);
  assert.equal(castRay([0, 0, 4], [0, 0, -1], [v], [behind]), v);
});

test("distância até a superfície do volume", () => {
  const v = box();
  close(distanceToVolume([0, 0, 2], v), 1.5);
  close(distanceToVolume([0.2, 0.1, 0], v), 0);
  close(distanceToVolume([1.5, 1.5, 0], v), Math.hypot(1, 1));
});

test("contorno projetado acompanha a câmera e some atrás dela", () => {
  // Câmera em z = 5 olhando para −Z (matriz de visão = translação −5), perspectiva 60°.
  const f = 1 / Math.tan(Math.PI / 6);
  const near = 0.1;
  const far = 100;
  const proj = [f, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) / (near - far), -1, 0, 0, (2 * far * near) / (near - far), 0];
  const viewProj = proj.slice();
  // proj · translação(0, 0, −5): só a última coluna muda.
  for (let r = 0; r < 4; r++) viewProj[12 + r] = proj[8 + r] * -5 + proj[12 + r];
  const outline = projectedOutline(viewProj, box(), 800, 600);
  assert.ok(outline.length >= 4);
  for (const [x, y] of outline) {
    assert.ok(x > 300 && x < 500 && y > 200 && y < 400, `ponto fora do centro: ${x},${y}`);
  }
  // Volume atrás da câmera: nada a desenhar.
  assert.equal(projectedOutline(viewProj, box({ position: [0, 0, 20] }), 800, 600).length, 0);
});

test("casco convexo descarta pontos internos", () => {
  const hull = convexHull([
    [0, 0],
    [2, 0],
    [2, 2],
    [0, 2],
    [1, 1],
  ]);
  assert.equal(hull.length, 4);
});

test("dados: volumes apontam para conjuntos e itens existentes", () => {
  const { volumes } = json("src/data/interactions.json");
  const source = readFileSync(resolve(root, "src/data/inspection.ts"), "utf8");
  const catalog = ["materialDeOrigem.ts", "horizontesDoSolo.ts", "atracaoDoIma.ts", "texturaDoSolo.ts", "porosidadeDoSolo.ts", "arNoSolo.ts", "densidadeDoSolo.ts", "compactacaoDoSolo.ts", "soloAmpliado.ts"]
    .map((f) => readFileSync(resolve(root, "src/data", f), "utf8"))
    .join("\n");
  const ids = new Set();
  for (const v of volumes) {
    assert.ok(!ids.has(v.id), `id repetido: ${v.id}`);
    ids.add(v.id);
    assert.ok(
      [
        "formacao-do-solo",
        "material-de-origem",
        "horizontes-do-solo",
        "atracao-do-solo-pelo-ima",
        "textura-do-solo",
        "porosidade-do-solo",
        "ar-no-solo",
        "densidade-do-solo",
        "compactacao-do-solo",
        "solo-ampliado",
      ].includes(v.setId),
      `${v.id}: ${v.setId}`,
    );
    if (v.setId === "formacao-do-solo") {
      assert.ok(source.includes(`id: "${v.id}"`), `item ausente em inspection.ts: ${v.id}`);
    } else {
      assert.ok(catalog.includes(`id: "${v.setId}"`), `acervo ausente: ${v.setId}`);
    }
    assert.equal(v.position.length, 3);
    assert.ok(v.size.every((n) => n > 0));
    assert.ok(v.maxDistance > 0);
  }
  const occluders = json("src/data/interactions.json").occluders ?? [];
  for (const o of occluders) {
    assert.equal(o.position.length, 3);
    assert.ok(o.size.every((n) => n > 0), o.id);
  }
  assert.deepEqual(
    volumes.filter((v) => v.setId === "formacao-do-solo").map((v) => v.order),
    [1, 2, 3, 4],
  );
  // Material de Origem: uma faixa por prateleira, de cima para baixo (ígneas, metamórficas,
  // sedimentares), todas abrindo o menu dos grupos.
  const shelf = volumes.filter((v) => v.setId === "material-de-origem");
  assert.deepEqual(
    shelf.map((v) => v.id),
    ["material-igneas", "material-metamorficas", "material-sedimentares"],
  );
  for (let i = 1; i < shelf.length; i++) assert.ok(shelf[i].position[1] < shelf[i - 1].position[1]);
  // Horizontes do Solo: um volume só, sobre as cinco caixas da mesa em frente à estante.
  const table = volumes.filter((v) => v.setId === "horizontes-do-solo");
  assert.deepEqual(
    table.map((v) => v.id),
    ["horizontes"],
  );
  assert.ok(table[0].position[2] > shelf[0].position[2], "a mesa fica à frente da estante");
  // Atração do Solo pelo Ímã: a mesa ao lado da dos horizontes (à direita, sem sobrepor).
  const magnet = volumes.filter((v) => v.setId === "atracao-do-solo-pelo-ima");
  assert.equal(magnet.length, 1);
  const right = (v) => v.position[0] + v.size[0] / 2;
  const left = (v) => v.position[0] - v.size[0] / 2;
  assert.ok(left(magnet[0]) >= right(table[0]), "bandejas à direita das caixas dos horizontes");
  assert.ok(Math.abs(magnet[0].position[1] - table[0].position[1]) < 0.05, "mesma altura de tampo");
  // Textura do Solo: um volume na mesa em frente à janela (x ≈ 4), com a frente para −X (sala).
  const texture = volumes.filter((v) => v.setId === "textura-do-solo");
  assert.equal(texture.length, 1);
  assert.deepEqual(texture[0].rotationDeg, [0, -90, 0]);
  assert.ok(texture[0].position[0] > 3.7 && texture[0].position[0] < 4.3, "mesa da janela");
  // Porosidade do Solo: um volume na mesa em frente ao painel do campo verde (z ≈ 0), com a frente
  // para −Z, de onde o visitante olha o painel.
  const porosity = volumes.filter((v) => v.setId === "porosidade-do-solo");
  assert.equal(porosity.length, 1);
  assert.deepEqual(porosity[0].rotationDeg, [0, 180, 0]);
  assert.ok(porosity[0].position[2] + porosity[0].size[2] / 2 < 0, "à frente do painel central");
  // Ar no Solo: um volume nas duas mesas do mesmo painel, à esquerda da porosidade (x menor).
  const air = volumes.filter((v) => v.setId === "ar-no-solo");
  assert.equal(air.length, 1);
  assert.deepEqual(air[0].rotationDeg, [0, 180, 0]);
  assert.ok(right(air[0]) <= left(porosity[0]), "não sobrepõe a mesa da porosidade");
  // Densidade do Solo: a mesa seguinte, depois das do Ar no Solo (x menor), de frente para −Z.
  const density = volumes.filter((v) => v.setId === "densidade-do-solo");
  assert.equal(density.length, 1);
  assert.deepEqual(density[0].rotationDeg, [0, 180, 0]);
  assert.ok(right(density[0]) <= left(air[0]), "não sobrepõe as mesas do Ar no Solo");
  const compaction = volumes.filter((v) => v.setId === "compactacao-do-solo");
  assert.equal(compaction.length, 1);
  assert.deepEqual(compaction[0].rotationDeg, [0, 180, 0]);
  assert.ok(right(compaction[0]) <= left(density[0]), "não sobrepõe a mesa da Densidade do Solo");
  // Os microscópios ficam numa mesa ao longo de Z, com as telas voltadas para −X.
  const zoomed = volumes.filter((v) => v.setId === "solo-ampliado");
  assert.equal(zoomed.length, 1);
  assert.deepEqual(zoomed[0].rotationDeg, [0, -90, 0]);
});

test("rótulos de navegação concordam com o nome do passo", () => {
  assert.equal(nextStepLabel("Etapa"), "Próxima etapa");
  assert.equal(nextStepLabel("Rocha"), "Próxima rocha");
  assert.equal(nextStepLabel("Item"), "Próximo item");
  assert.equal(nextStepLabel("Experimento"), "Próximo experimento");
  assert.equal(goToStepLabel("Etapa", "Etapa 1"), "Ir para a etapa 1");
  assert.equal(goToStepLabel("Experimento", "Experimento"), "Ir para o experimento");
  assert.equal(stepPlural("Amostra"), "Amostras");
  assert.equal(stepPlural("Item"), "Itens");
});

test("dados: os quatro GLBs existem, com o tamanho cadastrado, e são glTF binário", () => {
  const source = readFileSync(resolve(root, "src/data/inspection.ts"), "utf8");
  const models = [...source.matchAll(/url: "(\/models\/inspection\/[^"]+\.glb)", sizeBytes: ([\d_]+)/g)];
  assert.equal(models.length, 4);
  for (const [, url, size] of models) {
    const file = resolve(root, "public", url.slice(1));
    assert.equal(statSync(file).size, Number(size.replaceAll("_", "")), url);
    assert.equal(readFileSync(file).subarray(0, 4).toString("latin1"), "glTF", url);
  }
});

/** JSON de um GLB (primeiro bloco). */
const glbJson = (file) => {
  const buf = readFileSync(file);
  const length = buf.readUInt32LE(12);
  return JSON.parse(buf.subarray(20, 20 + length).toString("utf8"));
};

test("dados: recipientes (caixas) existem nos GLBs e há conteúdo fora deles", () => {
  const source = readFileSync(resolve(root, "src/data/inspection.ts"), "utf8");
  const items = [...source.matchAll(/url: "(\/models\/inspection\/[^"]+\.glb)"[^\n]*\n\s*container: \{ node: "([^"]+)" \}/g)];
  // Só as rochas (caixas 1 e 2); o solo da caixa 3 não sai da caixa.
  assert.equal(items.length, 2);
  for (const [, url, node] of items) {
    const gltf = glbJson(resolve(root, "public", url.slice(1)));
    const index = gltf.nodes.findIndex((n) => n.name === node);
    assert.ok(index >= 0, `${node} ausente em ${url}`);
    // Algum nó com malha fora da caixa (a rocha / o solo).
    const inside = new Set();
    const walk = (i) => {
      inside.add(i);
      for (const c of gltf.nodes[i].children ?? []) walk(c);
    };
    walk(index);
    assert.ok(gltf.nodes.some((n, i) => n.mesh !== undefined && !inside.has(i)), url);
  }
});

test("dados: miniaturas existem e são WebP", () => {
  const source = readFileSync(resolve(root, "src/data/inspection.ts"), "utf8");
  const thumbs = [...source.matchAll(/thumbnail: "(\/models\/inspection\/thumbs\/[^"]+\.webp)"/g)].map((m) => m[1]);
  assert.equal(thumbs.length, 4);
  for (const url of thumbs) {
    const buf = readFileSync(resolve(root, "public", url.slice(1)));
    assert.equal(buf.subarray(0, 4).toString("latin1"), "RIFF", url);
    assert.equal(buf.subarray(8, 12).toString("latin1"), "WEBP", url);
  }
});

test("dados: textos da introdução, das etapas e dos estágios da maquete", () => {
  const source = readFileSync(resolve(root, "src/data/inspection.ts"), "utf8");
  // Introdução do conjunto.
  assert.match(source, /overview: `Você já parou para pensar/);
  // Um texto por etapa (4) e um por estágio da maquete (4), mais o fechamento.
  const descriptions = [...source.matchAll(/^\s+description:\s*[`"]/gm)];
  assert.equal(descriptions.length, 8);
  assert.match(source, /closing: `Cada horizonte/);
  // A ordem acompanha a sequência do roteiro.
  const order = ["primeira caixa", "segunda caixa", "terceira caixa", "maquete da formação do solo"];
  const positions = order.map((t) => source.indexOf(t));
  assert.ok(positions.every((p) => p > 0), positions.join());
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test("dados: narração (arquivos MP4/AAC e um cue por bloco do texto)", async () => {
  const { FORMACAO_DO_SOLO: set } = await import("../src/data/inspection.ts");
  const blocks = (text) => (text ?? "").split(/\n\s*\n/).filter((p) => p.trim()).length;
  const entries = [
    [set.overviewNarration, blocks(set.overview)],
    ...set.items.map((it) => [
      it.narration,
      blocks(it.description) + (it.markers?.filter((m) => m.description).length ?? 0) + blocks(it.closing),
    ]),
  ];
  assert.equal(entries.length, 5);
  for (const [narration, count] of entries) {
    assert.ok(narration, "narração ausente");
    const buf = readFileSync(resolve(root, "public", narration.audioUrl.slice(1)));
    assert.equal(buf.subarray(4, 8).toString("latin1"), "ftyp", narration.audioUrl);
    assert.ok(buf.length < 400_000, narration.audioUrl);
    assert.equal(narration.cues.length, count, narration.audioUrl);
    assert.equal(narration.cues[0], 0);
    for (let i = 1; i < narration.cues.length; i++) assert.ok(narration.cues[i] > narration.cues[i - 1]);
  }
});

test("dados: Material de Origem (grupos, modelos, recipientes, miniaturas e narração)", async () => {
  const { MATERIAL_DE_ORIGEM: catalog } = await import("../src/data/materialDeOrigem.ts");
  const blocks = (text) => (text ?? "").split(/\n\s*\n/).filter((p) => p.trim()).length;
  const checkNarration = (narration, count) => {
    assert.ok(narration, "narração ausente");
    const buf = readFileSync(resolve(root, "public", narration.audioUrl.slice(1)));
    assert.equal(buf.subarray(4, 8).toString("latin1"), "ftyp", narration.audioUrl);
    assert.ok(buf.length < 500_000, narration.audioUrl);
    assert.equal(narration.cues.length, count, narration.audioUrl);
    assert.equal(narration.cues[0], 0);
    for (let i = 1; i < narration.cues.length; i++) assert.ok(narration.cues[i] > narration.cues[i - 1], narration.audioUrl);
  };

  assert.equal(catalog.stepNoun, "Rocha");
  checkNarration(catalog.overviewNarration, blocks(catalog.overview));
  assert.deepEqual(
    catalog.groups.map((g) => [g.id, g.items.length]),
    [
      ["igneas", 7],
      ["sedimentares", 5],
      ["metamorficas", 8],
    ],
  );
  const ids = new Set();
  for (const group of catalog.groups) {
    checkNarration(group.overviewNarration, blocks(group.overview));
    group.items.forEach((item, i) => {
      assert.ok(!ids.has(item.id), item.id);
      ids.add(item.id);
      assert.equal(item.order, i + 1, item.id);
      // Modelo web: existe, tem o tamanho cadastrado, é glTF binário e cabe na rede.
      const file = resolve(root, "public", item.model.url.slice(1));
      const size = statSync(file).size;
      assert.equal(size, item.model.sizeBytes, item.model.url);
      assert.ok(size < 6_000_000, item.model.url);
      assert.equal(readFileSync(file).subarray(0, 4).toString("latin1"), "glTF", item.model.url);
      // Bandeja e etiqueta existem no GLB; a rocha (malha fora delas) também.
      const gltf = glbJson(file);
      const container = item.container.nodes.map((name) => gltf.nodes.findIndex((n) => n.name === name));
      assert.ok(container.every((k) => k >= 0), `${item.id}: ${item.container.nodes}`);
      const inside = new Set();
      const walk = (k) => {
        inside.add(k);
        for (const c of gltf.nodes[k].children ?? []) walk(c);
      };
      container.forEach(walk);
      assert.ok(gltf.nodes.some((n, k) => n.mesh !== undefined && !inside.has(k)), item.id);
      // Miniatura WebP.
      const thumb = readFileSync(resolve(root, "public", item.thumbnail.slice(1)));
      assert.equal(thumb.subarray(8, 12).toString("latin1"), "WEBP", item.thumbnail);
      checkNarration(item.narration, blocks(item.description));
    });
  }
  assert.equal(ids.size, 20);
});

test("dados: Horizontes do Solo (grupo único, modelos, caixa da camada R, miniaturas e narração)", async () => {
  const { HORIZONTES_DO_SOLO: catalog } = await import("../src/data/horizontesDoSolo.ts");
  const blocks = (text) => (text ?? "").split(/\n\s*\n/).filter((p) => p.trim()).length;
  const checkNarration = (narration, count) => {
    assert.ok(narration, "narração ausente");
    const buf = readFileSync(resolve(root, "public", narration.audioUrl.slice(1)));
    assert.equal(buf.subarray(4, 8).toString("latin1"), "ftyp", narration.audioUrl);
    assert.ok(buf.length < 600_000, narration.audioUrl);
    assert.equal(narration.cues.length, count, narration.audioUrl);
    assert.equal(narration.cues[0], 0);
    for (let i = 1; i < narration.cues.length; i++) assert.ok(narration.cues[i] > narration.cues[i - 1], narration.audioUrl);
  };

  assert.equal(catalog.groups.length, 1, "grupo único: abre direto no menu das amostras");
  checkNarration(catalog.overviewNarration, blocks(catalog.overview));
  const items = catalog.groups[0].items;
  assert.deepEqual(
    items.map((it) => it.title),
    ["Horizonte O", "Horizonte A", "Horizonte B", "Horizonte C", "Camada R"],
  );
  for (const [i, item] of items.entries()) {
    assert.equal(item.order, i + 1, item.id);
    const file = resolve(root, "public", item.model.url.slice(1));
    assert.equal(statSync(file).size, item.model.sizeBytes, item.model.url);
    assert.ok(item.model.sizeBytes < 6_500_000, item.model.url);
    assert.equal(readFileSync(file).subarray(0, 4).toString("latin1"), "glTF", item.model.url);
    const thumb = readFileSync(resolve(root, "public", item.thumbnail.slice(1)));
    assert.equal(thumb.subarray(8, 12).toString("latin1"), "WEBP", item.thumbnail);
    checkNarration(item.narration, blocks(item.description) + blocks(item.closing));
  }
  // Só a Camada R (pedras) sai da caixa; os horizontes (solo solto) não.
  assert.deepEqual(
    items.map((it) => !!it.container),
    [false, false, false, false, true],
  );
  const r = items[4];
  const gltf = glbJson(resolve(root, "public", r.model.url.slice(1)));
  const container = r.container.nodes.map((name) => gltf.nodes.findIndex((n) => n.name === name));
  assert.ok(container.every((k) => k >= 0), `${r.container.nodes}`);
  assert.ok(gltf.nodes.some((n, k) => n.mesh !== undefined && !container.includes(k) && n.name.startsWith("Pedra")));
});

test("dados: Textura do Solo (grupo único, placa, copos, banner, miniaturas e narração)", async () => {
  const { TEXTURA_DO_SOLO: catalog } = await import("../src/data/texturaDoSolo.ts");
  const blocks = (text) => (text ?? "").split(/\n\s*\n/).filter((p) => p.trim()).length;
  const checkNarration = (narration, count) => {
    assert.ok(narration, "narração ausente");
    const buf = readFileSync(resolve(root, "public", narration.audioUrl.slice(1)));
    assert.equal(buf.subarray(4, 8).toString("latin1"), "ftyp", narration.audioUrl);
    assert.ok(buf.length < 600_000, narration.audioUrl);
    assert.equal(narration.cues.length, count, narration.audioUrl);
    assert.equal(narration.cues[0], 0);
    for (let i = 1; i < narration.cues.length; i++) assert.ok(narration.cues[i] > narration.cues[i - 1], narration.audioUrl);
  };

  assert.equal(catalog.groups.length, 1, "grupo único: abre direto no menu");
  checkNarration(catalog.overviewNarration, blocks(catalog.overview));
  const items = catalog.groups[0].items;
  assert.deepEqual(
    items.map((it) => it.title),
    ["Placa de granulometria", "Solo arenoso", "Solo siltoso", "Solo argiloso", "Banner de textura do solo"],
  );
  for (const [i, item] of items.entries()) {
    assert.equal(item.order, i + 1, item.id);
    assert.ok(!item.container, item.id);
    const file = resolve(root, "public", item.model.url.slice(1));
    assert.equal(statSync(file).size, item.model.sizeBytes, item.model.url);
    assert.ok(item.model.sizeBytes < 6_500_000, item.model.url);
    assert.equal(readFileSync(file).subarray(0, 4).toString("latin1"), "glTF", item.model.url);
    const thumb = readFileSync(resolve(root, "public", item.thumbnail.slice(1)));
    assert.equal(thumb.subarray(8, 12).toString("latin1"), "WEBP", item.thumbnail);
    checkNarration(item.narration, blocks(item.description) + blocks(item.closing));
  }
  // Banner: plano único com textura própria (derivado do splat), sem iluminação.
  const banner = glbJson(resolve(root, "public", items[4].model.url.slice(1)));
  assert.equal(banner.images.length, 1);
  assert.ok(banner.extensionsUsed.includes("KHR_materials_unlit"));
});

test("animação conduzida pela narração: parada antes, interpolada, parada no último quadro", () => {
  const sync = [
    [24.7, 0],
    [31.42, 7],
    [40.38, 15.958],
  ];
  close(animationTimeAt(0, sync, 16), 0);
  close(animationTimeAt(24.7, sync, 16), 0);
  close(animationTimeAt((24.7 + 31.42) / 2, sync, 16), 3.5);
  close(animationTimeAt(35.9, sync, 16), 7 + ((35.9 - 31.42) / (40.38 - 31.42)) * 8.958);
  close(animationTimeAt(50, sync, 16), 15.958);
  // Narração já ouvida (sem tocar de novo): o último quadro.
  close(animationTimeAt(Infinity, sync, 16), 15.958);
  close(animationTimeAt(5, [[0, 0], [1, 30]], 16), 16);
});

test("dados: Atração do Solo pelo Ímã (um item, GLB animado, sincronia e narração)", async () => {
  const { ATRACAO_DO_IMA: set } = await import("../src/data/atracaoDoIma.ts");
  const blocks = (text) => (text ?? "").split(/\n\s*\n/).filter((p) => p.trim()).length;
  assert.equal(set.items.length, 1, "um experimento só: sem setas nem faixa");
  assert.ok(!set.overview);
  const [item] = set.items;
  const file = resolve(root, "public", item.model.url.slice(1));
  assert.equal(statSync(file).size, item.model.sizeBytes, item.model.url);
  assert.ok(item.model.sizeBytes < 6_500_000, item.model.url);
  assert.equal(readFileSync(file).subarray(0, 4).toString("latin1"), "glTF", item.model.url);
  // Um clipe de animação, sem extensões; os dois casos e o disco de magnetita estão no GLB.
  const gltf = glbJson(file);
  assert.equal(gltf.animations?.length, 1);
  assert.deepEqual(gltf.extensionsUsed ?? [], []);
  for (const name of ["placa_com_ima", "placa_sem_ima", "disco_magnetita_girassol", "pote_com_magnetita", "pote_sem_magnetita"]) {
    assert.ok(gltf.nodes.some((n) => n.name === name), name);
  }
  const clip = Math.max(...gltf.animations[0].samplers.map((sm) => gltf.accessors[sm.input].max[0]));
  // Narração: um cue por parágrafo.
  const narration = item.narration;
  const audio = readFileSync(resolve(root, "public", narration.audioUrl.slice(1)));
  assert.equal(audio.subarray(4, 8).toString("latin1"), "ftyp", narration.audioUrl);
  assert.ok(audio.length < 600_000, narration.audioUrl);
  assert.equal(narration.cues.length, blocks(item.description));
  assert.equal(narration.cues[0], 0);
  for (let i = 1; i < narration.cues.length; i++) assert.ok(narration.cues[i] > narration.cues[i - 1]);
  // Sincronia: crescente; o despejo sem magnetita começa com "Na primeira...", o com magnetita
  // com "Mas observe..."; termina no último quadro do clipe.
  const sync = item.animation.sync;
  for (let i = 1; i < sync.length; i++) {
    assert.ok(sync[i][0] > sync[i - 1][0]);
    assert.ok(sync[i][1] >= sync[i - 1][1]);
  }
  const paragraphs = item.description.split(/\n\s*\n/);
  const cueOf = (start) => narration.cues[paragraphs.findIndex((p) => p.startsWith(start))];
  assert.deepEqual(sync[0], [cueOf("Na primeira"), 0]);
  assert.deepEqual(sync[1], [cueOf("Mas observe"), 7]);
  assert.ok(Math.abs(sync[sync.length - 1][1] - clip) < 0.05, `${sync[sync.length - 1][1]} vs ${clip}`);
  assert.ok(sync[sync.length - 1][0] < narration.cues[narration.cues.length - 1] + 20);
  const thumb = readFileSync(resolve(root, "public", item.thumbnail.slice(1)));
  assert.equal(thumb.subarray(8, 12).toString("latin1"), "WEBP", item.thumbnail);
});

test("dados: Porosidade do Solo (um item, GLB animado, sincronia e narração)", async () => {
  const { POROSIDADE_DO_SOLO: set } = await import("../src/data/porosidadeDoSolo.ts");
  const blocks = (text) => (text ?? "").split(/\n\s*\n/).filter((p) => p.trim()).length;
  assert.equal(set.items.length, 1, "um experimento só: sem setas nem faixa");
  assert.ok(!set.overview);
  const [item] = set.items;
  const file = resolve(root, "public", item.model.url.slice(1));
  assert.equal(statSync(file).size, item.model.sizeBytes, item.model.url);
  assert.ok(item.model.sizeBytes < 13_000_000, item.model.url);
  assert.equal(readFileSync(file).subarray(0, 4).toString("latin1"), "glTF", item.model.url);
  // Um clipe de animação, sem extensões; os três materiais, a bandeja e o frasco estão no GLB.
  const gltf = glbJson(file);
  assert.equal(gltf.animations?.length, 1);
  assert.deepEqual(gltf.extensionsUsed ?? [], []);
  for (const name of ["Bandeja", "Pedra", "Esponja", "Torrao", "Frasco"]) {
    assert.ok(gltf.nodes.some((n) => n.name === name), name);
  }
  const clip = Math.max(...gltf.animations[0].samplers.map((sm) => gltf.accessors[sm.input].max[0]));
  // Narração: um cue por parágrafo.
  const narration = item.narration;
  const audio = readFileSync(resolve(root, "public", narration.audioUrl.slice(1)));
  assert.equal(audio.subarray(4, 8).toString("latin1"), "ftyp", narration.audioUrl);
  assert.ok(audio.length < 700_000, narration.audioUrl);
  assert.equal(narration.cues.length, blocks(item.description));
  assert.equal(narration.cues[0], 0);
  for (let i = 1; i < narration.cues.length; i++) assert.ok(narration.cues[i] > narration.cues[i - 1]);
  // Sincronia: crescente, com cada material começando na sua fala e o último quadro no fim.
  const sync = item.animation.sync;
  for (let i = 1; i < sync.length; i++) {
    assert.ok(sync[i][0] > sync[i - 1][0]);
    assert.ok(sync[i][1] >= sync[i - 1][1]);
  }
  const paragraphs = item.description.split(/\n\s*\n/);
  const cueOf = (start) => narration.cues[paragraphs.findIndex((p) => p.startsWith(start))];
  const clipAt = (start) => animationTimeAt(cueOf(start), sync, clip);
  close(clipAt("Começamos pela pedra"), 0);
  close(clipAt("Observe o que acontece"), 1.6);
  close(clipAt("Agora, vamos observar a esponja"), 5.8); // parado depois da pedra, sem gotas no ar
  close(clipAt("Vamos observar o torrão"), 14);
  close(clipAt("Quando a água entra no torrão"), 15.83); // primeira célula molhada do torrão
  close(clipAt("Isso mostra que"), 19);
  // Depois do último par, o clipe fica parado no último quadro.
  assert.ok(Math.abs(sync[sync.length - 1][1] - clip) < 0.05, `${sync[sync.length - 1][1]} vs ${clip}`);
  // Torrão em velocidade normal; absorção da esponja mais lenta (o contraste do roteiro).
  const speed = (from) => {
    const i = sync.findIndex(([, a]) => a === from);
    return (sync[i + 1][1] - sync[i][1]) / (sync[i + 1][0] - sync[i][0]);
  };
  assert.ok(speed(11.96) < 0.5, "absorção lenta na esponja");
  assert.ok(Math.abs(speed(15.83) - 1) < 0.1, "infiltração em velocidade normal no torrão");
  const thumb = readFileSync(resolve(root, "public", item.thumbnail.slice(1)));
  assert.equal(thumb.subarray(8, 12).toString("latin1"), "WEBP", item.thumbnail);
});

test("dados: Ar no Solo (menu sem texto geral, torrão animado, duas plantas, sincronia e narração)", async () => {
  const { AR_NO_SOLO: catalog } = await import("../src/data/arNoSolo.ts");
  const blocks = (text) => (text ?? "").split(/\n\s*\n/).filter((p) => p.trim()).length;
  assert.equal(catalog.groups.length, 1, "grupo único: abre direto no menu");
  assert.ok(!catalog.overview, "o roteiro não tem texto geral");
  assert.ok(!catalog.overviewNarration);
  const items = catalog.groups[0].items;
  assert.deepEqual(
    items.map((it) => it.title),
    ["Torrão de solo dentro da água", "Planta no solo com oxigênio", "Planta no solo sem oxigênio"],
  );
  for (const [i, item] of items.entries()) {
    assert.equal(item.order, i + 1, item.id);
    const file = resolve(root, "public", item.model.url.slice(1));
    assert.equal(statSync(file).size, item.model.sizeBytes, item.model.url);
    assert.ok(item.model.sizeBytes < 10_000_000, item.model.url);
    assert.equal(readFileSync(file).subarray(0, 4).toString("latin1"), "glTF", item.model.url);
    const thumb = readFileSync(resolve(root, "public", item.thumbnail.slice(1)));
    assert.equal(thumb.subarray(8, 12).toString("latin1"), "WEBP", item.thumbnail);
    const { narration } = item;
    const audio = readFileSync(resolve(root, "public", narration.audioUrl.slice(1)));
    assert.equal(audio.subarray(4, 8).toString("latin1"), "ftyp", narration.audioUrl);
    assert.ok(audio.length < 300_000, narration.audioUrl);
    assert.equal(narration.cues.length, blocks(item.description), narration.audioUrl);
    assert.equal(narration.cues[0], 0);
    for (let c = 1; c < narration.cues.length; c++) assert.ok(narration.cues[c] > narration.cues[c - 1], narration.audioUrl);
  }
  // Só o torrão tem animação: um clipe, sem extensões; as plantas são modelos parados.
  const [torrao, ...plantas] = items;
  const gltf = glbJson(resolve(root, "public", torrao.model.url.slice(1)));
  assert.equal(gltf.animations?.length, 1);
  assert.deepEqual(gltf.extensionsUsed ?? [], []);
  const clip = Math.max(...gltf.animations[0].samplers.map((sm) => gltf.accessors[sm.input].max[0]));
  for (const planta of plantas) {
    assert.ok(!planta.animation, planta.id);
    assert.ok(!glbJson(resolve(root, "public", planta.model.url.slice(1))).animations?.length, planta.id);
  }
  // Sincronia: crescente; parado até “...dentro da água”, entrando na água nessa palavra; a bolha
  // corre sem pausa (nenhum trecho parado) e o último par chega ao último quadro.
  const sync = torrao.animation.sync;
  for (let i = 1; i < sync.length; i++) {
    assert.ok(sync[i][0] > sync[i - 1][0]);
    assert.ok(sync[i][1] > sync[i - 1][1], "sem pausa: nada fica parado no ar");
  }
  const paragraphs = torrao.description.split(/\n\s*\n/);
  const cueOf = (start) => torrao.narration.cues[paragraphs.findIndex((p) => p.startsWith(start))];
  close(animationTimeAt(cueOf("Você acha"), sync, clip), 0);
  assert.equal(sync[0][1], 0);
  assert.ok(Math.abs(sync[sync.length - 1][1] - clip) < 0.05, `${sync[sync.length - 1][1]} vs ${clip}`);
});

test("dados: Densidade do Solo (menu sem texto geral, do mais leve ao mais pesado, garrafas e narração)", async () => {
  const { DENSIDADE_DO_SOLO: catalog } = await import("../src/data/densidadeDoSolo.ts");
  const blocks = (text) => (text ?? "").split(/\n\s*\n/).filter((p) => p.trim()).length;
  assert.equal(catalog.groups.length, 1, "grupo único: abre direto no menu");
  assert.ok(!catalog.overview, "o roteiro não tem texto geral");
  assert.ok(!catalog.overviewNarration);
  const items = catalog.groups[0].items;
  // A ordem do roteiro é o inverso da numeração das pastas do acervo: o id tem de seguir o título.
  assert.deepEqual(
    items.map((it) => [it.title, it.id]),
    [
      ["Solo orgânico", "garrafa-08-03-organico"],
      ["Solo argiloso", "garrafa-08-02-argiloso"],
      ["Solo arenoso", "garrafa-08-01-arenoso"],
    ],
  );
  for (const [i, item] of items.entries()) {
    assert.equal(item.order, i + 1, item.id);
    assert.ok(!item.animation, item.id);
    const file = resolve(root, "public", item.model.url.slice(1));
    assert.equal(statSync(file).size, item.model.sizeBytes, item.model.url);
    assert.ok(item.model.sizeBytes < 6_500_000, item.model.url);
    assert.equal(readFileSync(file).subarray(0, 4).toString("latin1"), "glTF", item.model.url);
    // Garrafa e balança no mesmo modelo, sem extensões; o PET é o único material transparente.
    const gltf = glbJson(file);
    const soil = item.id.split("-").pop();
    assert.deepEqual(gltf.extensionsUsed ?? [], []);
    for (const node of [`solo_${soil}`, `pet_${soil}`, `etiqueta_${soil}`, `balanca_painel_${soil}`]) {
      assert.ok(gltf.nodes.some((n) => n.name === node), `${item.id}: ${node}`);
    }
    assert.deepEqual(
      gltf.materials.filter((m) => m.alphaMode === "BLEND").map((m) => m.name),
      [`pet_${soil}`],
    );
    const thumb = readFileSync(resolve(root, "public", item.thumbnail.slice(1)));
    assert.equal(thumb.subarray(8, 12).toString("latin1"), "WEBP", item.thumbnail);
    const { narration } = item;
    const audio = readFileSync(resolve(root, "public", narration.audioUrl.slice(1)));
    assert.equal(audio.subarray(4, 8).toString("latin1"), "ftyp", narration.audioUrl);
    assert.ok(audio.length < 300_000, narration.audioUrl);
    assert.equal(narration.cues.length, blocks(item.description), narration.audioUrl);
    assert.equal(narration.cues[0], 0);
    for (let c = 1; c < narration.cues.length; c++) assert.ok(narration.cues[c] > narration.cues[c - 1], narration.audioUrl);
  }
});

test("dados: Compactação do Solo (menu sem texto geral, duas caixas, cavalo só no compactado)", async () => {
  const { COMPACTACAO_DO_SOLO: catalog } = await import("../src/data/compactacaoDoSolo.ts");
  const blocks = (text) => (text ?? "").split(/\n\s*\n/).filter((p) => p.trim()).length;
  assert.equal(catalog.groups.length, 1, "grupo único: abre direto no menu");
  assert.ok(!catalog.overview, "o roteiro não tem texto geral");
  assert.ok(!catalog.overviewNarration);
  const items = catalog.groups[0].items;
  assert.deepEqual(
    items.map((it) => [it.title, it.id]),
    [
      ["Solo não compactado", "caixa-09-01-nao-compactado"],
      ["Solo compactado", "caixa-09-02-compactado"],
    ],
  );
  const expected = [
    { has: ["Madeira_Solto", "Solo_Nao_Compactado", "Base_solto"], lacks: ["Solo_Compactado", "Cavalo"] },
    { has: ["Madeira_Comp", "Solo_Compactado", "Base_comp", "Cavalo"], lacks: ["Solo_Nao_Compactado", "Madeira_Solto"] },
  ];
  for (const [i, item] of items.entries()) {
    assert.equal(item.order, i + 1, item.id);
    assert.ok(!item.animation, item.id);
    // Solo é material solto: pela regra de `inspection.ts`, não usa "Tirar da caixa".
    assert.ok(!item.container, item.id);
    const file = resolve(root, "public", item.model.url.slice(1));
    assert.equal(statSync(file).size, item.model.sizeBytes, item.model.url);
    assert.ok(item.model.sizeBytes < 7_000_000, item.model.url);
    assert.equal(readFileSync(file).subarray(0, 4).toString("latin1"), "glTF", item.model.url);
    const gltf = glbJson(file);
    assert.deepEqual(gltf.extensionsUsed ?? [], []);
    const names = gltf.nodes.map((n) => n.name);
    for (const node of expected[i].has) assert.ok(names.includes(node), `${item.id}: falta ${node}`);
    for (const node of expected[i].lacks) assert.ok(!names.includes(node), `${item.id}: sobra ${node}`);
    const thumb = readFileSync(resolve(root, "public", item.thumbnail.slice(1)));
    assert.equal(thumb.subarray(8, 12).toString("latin1"), "WEBP", item.thumbnail);
    const { narration } = item;
    const audio = readFileSync(resolve(root, "public", narration.audioUrl.slice(1)));
    assert.equal(audio.subarray(4, 8).toString("latin1"), "ftyp", narration.audioUrl);
    assert.ok(audio.length < 400_000, narration.audioUrl);
    assert.equal(narration.cues.length, blocks(item.description), narration.audioUrl);
    assert.equal(narration.cues[0], 0);
    for (let c = 1; c < narration.cues.length; c++) assert.ok(narration.cues[c] > narration.cues[c - 1], narration.audioUrl);
  }
});

test("dados: Solo Ampliado (menu com texto geral, quatro imagens 2D, sem o encerramento)", async () => {
  const { SOLO_AMPLIADO: catalog } = await import("../src/data/soloAmpliado.ts");
  const blocks = (text) => (text ?? "").split(/\n\s*\n/).filter((p) => p.trim()).length;
  const checkAudio = (narration, text) => {
    const audio = readFileSync(resolve(root, "public", narration.audioUrl.slice(1)));
    assert.equal(audio.subarray(4, 8).toString("latin1"), "ftyp", narration.audioUrl);
    assert.ok(audio.length < 300_000, narration.audioUrl);
    assert.equal(narration.cues.length, blocks(text), narration.audioUrl);
    assert.equal(narration.cues[0], 0);
    for (let c = 1; c < narration.cues.length; c++) assert.ok(narration.cues[c] > narration.cues[c - 1], narration.audioUrl);
  };
  assert.equal(catalog.groups.length, 1, "grupo único: abre direto no menu");
  checkAudio(catalog.overviewNarration, catalog.overview);
  const items = catalog.groups[0].items;
  assert.deepEqual(
    items.map((it) => [it.title, it.id]),
    [
      ["Solo orgânico", "solo-organico"],
      ["Solo cascalhento", "solo-cascalhento"],
      ["Solo arenoso", "solo-arenoso"],
      ["Solo argiloso", "solo-argiloso"],
    ],
  );
  for (const [i, item] of items.entries()) {
    assert.equal(item.order, i + 1, item.id);
    assert.ok(!item.model && !item.view, `${item.id}: item 2D, sem modelo`);
    const { image, width, height } = item.microscope;
    const file = readFileSync(resolve(root, "public", image.slice(1)));
    assert.equal(file.subarray(8, 12).toString("latin1"), "WEBP", image);
    assert.ok(file.length < 600_000, image);
    assert.ok(Math.abs(width / height - 16 / 9) < 0.02, `${item.id}: proporção da tela`);
    const thumb = readFileSync(resolve(root, "public", item.thumbnail.slice(1)));
    assert.equal(thumb.subarray(8, 12).toString("latin1"), "WEBP", item.thumbnail);
    checkAudio(item.narration, item.description);
  }
  // O usuário pediu para cortar o encerramento da gravação.
  const all = [catalog.overview, ...items.map((it) => it.description)].join("\n");
  assert.ok(!/encerramento|quatro amostras|Interessante, não é/i.test(all));
});

test("telinha do microscópio: a imagem sempre cobre a tela e o zoom mantém o ponto sob o cursor", () => {
  assert.deepEqual(clampView({ zoom: 0.2, cx: 0.9, cy: 0.1 }), MICROSCOPE_HOME);
  assert.equal(clampView({ zoom: 99, cx: 0.5, cy: 0.5 }).zoom, MICROSCOPE_MAX_ZOOM);
  // Sem zoom, não há o que arrastar.
  assert.deepEqual(panBy(MICROSCOPE_HOME, 0.3, -0.2), MICROSCOPE_HOME);
  // O ponto da imagem sob (0,75; 0,25) continua sob ele depois de aproximar.
  const under = (v, sx, sy) => [v.cx + (sx - 0.5) / v.zoom, v.cy + (sy - 0.5) / v.zoom];
  const zoomed = zoomAt({ zoom: 2, cx: 0.5, cy: 0.5 }, 1.5, 0.75, 0.25);
  assert.equal(zoomed.zoom, 3);
  const [ax, ay] = under({ zoom: 2, cx: 0.5, cy: 0.5 }, 0.75, 0.25);
  const [bx, by] = under(zoomed, 0.75, 0.25);
  assert.ok(Math.abs(ax - bx) < 1e-9 && Math.abs(ay - by) < 1e-9);
  // Arrastar para a direita mostra o que está à esquerda; o arraste para na borda da imagem.
  assert.ok(panBy({ zoom: 2, cx: 0.5, cy: 0.5 }, 0.1, 0).cx < 0.5);
  assert.equal(panBy({ zoom: 2, cx: 0.5, cy: 0.5 }, 5, 0).cx, 0.25);
  assert.equal(viewTransform(MICROSCOPE_HOME), "scale(1) translate(0%, 0%)");
  assert.equal(viewTransform({ zoom: 2, cx: 0.25, cy: 0.75 }), "scale(2) translate(25%, -25%)");
});
