import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { validateStreamedSog } from "../scripts/lod/validate-streamed-sog.mjs";
import {
  DEFAULT_RENDER_QUALITY,
  QUALITY_OPTIONS,
  RENDER_QUALITIES,
  parseQualityPreference,
} from "../src/data/quality.ts";
import { describeFailure, loadingStep } from "../src/lib/viewer/loadMessages.ts";
import { isStreamedContent, parseSplatSource } from "../src/lib/viewer/splatSourceParam.ts";

const manifest = JSON.parse(readFileSync(new URL("../src/data/streamedSplat.json", import.meta.url), "utf8"));
const publishedDir = new URL(`../public${manifest.url.replace(/\/lod-meta\.json$/, "")}`, import.meta.url);

test("Streamed SOG publicado: índice válido e todos os blocos presentes", () => {
  const result = validateStreamedSog(fileURLToPath(publishedDir));
  assert.deepEqual(result.errors, []);
  assert.equal(result.summary.lodLevels, 4);
  assert.deepEqual(result.summary.counts, manifest.lodCounts);
  assert.equal(result.summary.bytes, manifest.totalBytes);
});

test("Streamed SOG publicado: níveis reais e decrescentes, LOD 0 com a cena inteira", () => {
  const [lod0, ...rest] = manifest.lodCounts;
  // A mesma quantidade do SOG publicado e do projeto SuperSplat.
  assert.equal(lod0, 2_994_965);
  let previous = lod0;
  for (const count of rest) {
    assert.ok(count < previous * 0.6, `nível com ${count} não reduz o anterior (${previous})`);
    previous = count;
  }
  // Divisão espacial: vários blocos (nós), não quatro arquivos inteiros trocados.
  assert.ok(manifest.leafNodes >= 50, `nós: ${manifest.leafNodes}`);
  assert.ok(manifest.filesByLod[0] > 1, "o LOD 0 está dividido em vários arquivos");
});

test("Streamed SOG publicado: blocos em SOG v2, a versão que o viewer 1.42 (PlayCanvas 2.23) lê", () => {
  // Com v3 o parser do motor falha em `loadTextures` e o carregamento trava (docs/lod-streaming.md).
  const index = JSON.parse(readFileSync(new URL(`${publishedDir.href}/lod-meta.json`), "utf8"));
  for (const name of index.filenames) {
    const meta = JSON.parse(readFileSync(new URL(`${publishedDir.href}/${name}`), "utf8"));
    assert.equal(meta.version, 2, `${name}: SOG v${meta.version}`);
  }
});

test("Streamed SOG publicado: caminho versionado pelo hash do conteúdo", () => {
  assert.match(manifest.url, /^\/models\/museu_streamed\/[0-9a-f]{10}\/lod-meta\.json$/);
  assert.ok(manifest.url.includes(manifest.version));
});

test("o SOG antigo continua publicado (retorno e comparação A/B)", () => {
  assert.ok(existsSync(new URL("../public/models/museu_web.sog", import.meta.url)));
});

test("validador: aponta arquivo ausente, folha fora do arquivo e soma errada", () => {
  const dir = mkdtempSync(join(tmpdir(), "solos-lod-"));
  mkdirSync(join(dir, "0_0"));
  writeFileSync(
    join(dir, "0_0", "meta.json"),
    JSON.stringify({ count: 10, means: { files: ["means_l.webp"] } }),
  );
  writeFileSync(join(dir, "0_0", "means_l.webp"), "x");
  writeFileSync(
    join(dir, "lod-meta.json"),
    JSON.stringify({
      lodLevels: 2,
      counts: [10, 5],
      filenames: ["0_0/meta.json", "1_0/meta.json", "../fora/meta.json"],
      tree: {
        bound: { min: [0, 0, 0], max: [1, 1, 1] },
        lods: { 0: { file: 0, offset: 5, count: 10 }, 1: { file: 1, offset: 0, count: 4 } },
      },
    }),
  );
  const { ok, errors } = validateStreamedSog(dir);
  assert.equal(ok, false);
  const text = errors.join("\n");
  assert.match(text, /arquivo ausente: 1_0\/meta.json/);
  assert.match(text, /folha fora do arquivo/);
  assert.match(text, /nível 1: folhas somam 4/);
  assert.match(text, /caminho não relativo/);
});

test("fonte do Gaussian: ?splat= escolhe; sem parâmetro, streamed com recuo automático", () => {
  assert.deepEqual(parseSplatSource("?splat=legacy"), { id: "legacy", forced: true });
  assert.deepEqual(parseSplatSource("?splat=streamed&diag=1"), { id: "streamed", forced: true });
  assert.deepEqual(parseSplatSource(""), { id: "streamed", forced: false });
  assert.deepEqual(parseSplatSource("?splat=outra"), { id: "streamed", forced: false });
  assert.equal(isStreamedContent("lod-meta.json"), true);
  assert.equal(isStreamedContent("museu_web.sog"), false);
});

test("qualidade: automático é o padrão; modos manuais em ordem decrescente de orçamento e resolução", () => {
  assert.equal(DEFAULT_RENDER_QUALITY, "auto");
  assert.equal(QUALITY_OPTIONS[0].id, "auto");
  assert.equal(QUALITY_OPTIONS.length, 5);
  for (let i = 1; i < RENDER_QUALITIES.length; i++) {
    assert.ok(RENDER_QUALITIES[i].splatBudget < RENDER_QUALITIES[i - 1].splatBudget);
    assert.ok(RENDER_QUALITIES[i].scale < RENDER_QUALITIES[i - 1].scale);
  }
  // "Alto" cobre a cena inteira no nível mais fino: o computador não perde detalhe.
  assert.ok(RENDER_QUALITIES[0].splatBudget >= manifest.lodCounts[0]);
  // "Muito baixo" ainda cabe acima do nível mais grosso (a sala inteira continua visível).
  assert.ok(RENDER_QUALITIES.at(-1).splatBudget >= manifest.lodCounts.at(-1));
});

test("qualidade: preferências salvas antigas continuam valendo; lixo vira padrão", () => {
  assert.equal(parseQualityPreference("medio"), "medio");
  assert.equal(parseQualityPreference("auto"), "auto");
  assert.equal(parseQualityPreference("ultra"), null);
  assert.equal(parseQualityPreference(null), null);
});

test("tela inicial no streamed: sem megabytes fictícios; libera com a primeira versão e a colisão", () => {
  const downloading = loadingStep({ phase: "downloading", progress: 40, streamed: true }, false, 1e9);
  assert.equal(downloading.label, "Carregando ambiente inicial…");
  assert.doesNotMatch(downloading.detail, /MB/);
  assert.equal(downloading.progress, 40);
  assert.equal(loadingStep({ phase: "initializing", progress: 0, streamed: true }, false, 0).label, "Preparando exposição…");
  assert.equal(loadingStep({ phase: "ready", progress: 100, streamed: true }, false, 0).ready, false);
  const ready = loadingStep({ phase: "ready", progress: 100, streamed: true }, true, 0);
  assert.equal(ready.ready, true);
  assert.equal(ready.label, "Pronto para visitar.");
});

test("falha definitiva de bloco tem mensagem própria e permite nova tentativa", () => {
  const failure = describeFailure({ phase: "error", progress: 0, errorKind: "chunk" });
  assert.equal(failure.canRetry, true);
  assert.match(failure.title, /não chegou/);
});
