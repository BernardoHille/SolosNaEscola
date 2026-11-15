import assert from "node:assert/strict";
import test from "node:test";

import { describeFailure, loadingStep } from "../src/lib/viewer/loadMessages.ts";
import { DEFAULT_NARRATION, parseNarrationSettings } from "../src/lib/audio/narration.ts";

const MB = 1_000_000;

test("tela inicial: o botão só fica livre com a cena pronta e o Walk Mode ativo", () => {
  for (const phase of ["idle", "initializing", "downloading", "processing"]) {
    assert.equal(loadingStep({ phase, progress: 50 }, true, 100 * MB).ready, false, phase);
  }
  // Cena pronta, mas a colisão ainda não liberou o Walk Mode.
  const waiting = loadingStep({ phase: "ready", progress: 100 }, false, 100 * MB);
  assert.equal(waiting.ready, false);
  assert.match(waiting.label, /navegação/);
  const ready = loadingStep({ phase: "ready", progress: 100 }, true, 100 * MB);
  assert.equal(ready.ready, true);
  assert.equal(ready.label, "Pronto para visitar.");
});

test("tela inicial: o percentual mostrado é o do motor (sem simulação)", () => {
  const step = loadingStep({ phase: "downloading", progress: 42 }, false, 200 * MB);
  assert.equal(step.progress, 42);
  assert.match(step.detail, /^42% · 84,0 de 200,0 MB$/);
  // Antes do download não há número a mostrar.
  assert.equal(loadingStep({ phase: "initializing", progress: 0 }, false, 200 * MB).progress, null);
  // Download concluído não é visita pronta.
  const processing = loadingStep({ phase: "processing", progress: 100 }, false, 200 * MB);
  assert.equal(processing.progress, 100);
  assert.equal(processing.ready, false);
});

test("tela inicial: cada falha tem mensagem própria; sem WebGL não há nova tentativa", () => {
  assert.equal(describeFailure({ phase: "unsupported", progress: 0 }).canRetry, false);
  const kinds = ["network", "http", "engine", "collision"];
  const titles = new Set(kinds.map((errorKind) => describeFailure({ phase: "error", progress: 0, errorKind }).title));
  assert.equal(titles.size, kinds.length);
  for (const errorKind of kinds) assert.equal(describeFailure({ phase: "error", progress: 0, errorKind }).canRetry, true);
});

test("narrações: preferência salva é validada", () => {
  assert.deepEqual(parseNarrationSettings(null), DEFAULT_NARRATION);
  assert.deepEqual(parseNarrationSettings("{quebrado"), DEFAULT_NARRATION);
  assert.deepEqual(parseNarrationSettings('{"enabled":false,"volume":0.4}'), { enabled: false, volume: 0.4 });
  assert.deepEqual(parseNarrationSettings('{"enabled":"sim","volume":7}'), { enabled: true, volume: 1 });
  assert.deepEqual(parseNarrationSettings('{"volume":-2}'), { enabled: true, volume: 0 });
});
