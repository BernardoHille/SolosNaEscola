import assert from "node:assert/strict";
import test from "node:test";

import {
  AdaptiveQualityController,
  DEFAULT_ADAPTIVE_CONFIG,
  estimateRefreshHz,
  frameStats,
  initialLevel,
  parseStoredLevel,
  serializeLevel,
} from "../src/lib/viewer/adaptiveQuality.ts";

/**
 * Simulador: o tempo de quadro é uma função do nível (orçamento e escala) e do instante. Quadros
 * saem em múltiplos do período da tela (sincronismo vertical), como no navegador.
 */
function simulate(controller, { seconds, frameMs, refreshHz = 60, streaming = () => false, start = 0, cpuMs }) {
  const vsync = 1000 / refreshHz;
  // Antes de andar, a cena parada: ticks ociosos no ritmo da tela (tela inicial, visitante parado).
  for (let i = 0; i < 90; i++) controller.idleTick(start - 3000 + i * vsync);
  let t = start;
  const end = start + seconds * 1000;
  const levels = [];
  while (t < end) {
    const cost = frameMs(controller.budget, controller.scale, t);
    const dt = Math.max(vsync, Math.ceil(cost / vsync - 1e-9) * vsync);
    t += dt;
    controller.frame({ t, streaming: streaming(t), cpuMs: cpuMs?.(cost) });
    levels.push(controller.current);
  }
  return { t, levels };
}

const changesIn = (levels) =>
  levels.reduce((n, l, i) => (i && (l.budgetIndex !== levels[i - 1].budgetIndex || l.scaleIndex !== levels[i - 1].scaleIndex) ? n + 1 : n), 0);

/** Custo proporcional às gaussianas e aos pixels. */
const gpuCost = ({ perMillion, perPixel, base = 1 }) => (budget, scale) =>
  base + (budget / 1e6) * perMillion + scale * scale * perPixel;

test("1. aparelho que mantém 60 FPS fica no máximo e não alterna", () => {
  const c = new AdaptiveQualityController({ device: "desktop", budgetEffective: true });
  c.setActive(true, 0);
  // 3 M gaussianas custam 9 ms: sobra margem até no topo.
  const { levels } = simulate(c, { seconds: 300, frameMs: gpuCost({ perMillion: 2, perPixel: 3 }) });
  assert.deepEqual(c.current, { budgetIndex: 0, scaleIndex: 0 });
  // Só sobe (do inicial 2,2 M para 3 M), nunca volta.
  assert.ok(changesIn(levels) <= 1, `mudanças: ${changesIn(levels)}`);
});

test("2. aparelho que só mantém 30 FPS: meta de toque 30, sem reduzir à toa", () => {
  const c = new AdaptiveQualityController({ device: "touch", budgetEffective: true });
  c.setActive(true, 0);
  // Tela de 30 Hz (modo economia): a meta efetiva vira 30 e nada é reduzido.
  simulate(c, { seconds: 120, refreshHz: 30, frameMs: () => 10 });
  const snap = c.snapshot(120_000);
  assert.ok(snap.targetFps <= 30, `meta ${snap.targetFps}`);
  assert.ok(c.current.budgetIndex <= initialLevel("touch").budgetIndex, "não reduziu abaixo do inicial");
});

test("3. queda temporária por streaming não reduz a qualidade", () => {
  const c = new AdaptiveQualityController({ device: "desktop", budgetEffective: true, initial: { budgetIndex: 0 } });
  c.setActive(true, 0);
  // 6 s de quadros lentos (40 ms) enquanto blocos chegam; depois, rápidos.
  simulate(c, {
    seconds: 40,
    frameMs: (_b, _s, t) => (t > 5000 && t < 11000 ? 40 : 8),
    streaming: (t) => t > 5000 && t < 11500,
  });
  assert.equal(c.current.budgetIndex, 0);
  assert.equal(c.snapshot(40_000).changes, 0);
});

test("4. queda persistente por excesso de gaussianas reduz o orçamento primeiro, e estabiliza", () => {
  const c = new AdaptiveQualityController({ device: "desktop", budgetEffective: true, initial: { budgetIndex: 0 } });
  c.setActive(true, 0);
  // 3 M custam 3 + 3×8 = 27 ms (≈ 37 FPS); 60 FPS exige ≤ ~1,4 M.
  const { levels } = simulate(c, { seconds: 240, frameMs: gpuCost({ perMillion: 8, perPixel: 2 }) });
  assert.ok(c.budget <= 1_600_000, `orçamento ${c.budget}`);
  assert.equal(c.current.scaleIndex, 0, "a resolução não caiu: o gargalo era de gaussianas");
  // Sem alternância: depois de estabilizar, poucas mudanças no final.
  // No trecho final, no máximo uma sondagem de aumento e sua volta (o bloqueio dobra a cada falha).
  assert.ok(changesIn(levels.slice(-levels.length / 3)) <= 2);
});

test("5. gargalo por pixel: reduzir gaussianas não ajuda, então a resolução cai", () => {
  const c = new AdaptiveQualityController({ device: "desktop", budgetEffective: true, initial: { budgetIndex: 0 } });
  c.setActive(true, 0);
  // Custo quase só de pixels: 25 ms em escala 1.
  simulate(c, { seconds: 240, frameMs: gpuCost({ perMillion: 0.05, perPixel: 24 }) });
  assert.ok(c.current.scaleIndex > 0, "a resolução foi reduzida");
  assert.ok(c.snapshot(240_000).pixelBound, "gargalo de pixels detectado");
  assert.ok(c.current.budgetIndex <= 3, `orçamento não foi ao chão: ${c.current.budgetIndex}`);
});

test("6. aparelho que não alcança a meta nem no mínimo para no limite, sem oscilar", () => {
  const c = new AdaptiveQualityController({ device: "touch", budgetEffective: true });
  c.setActive(true, 0);
  const { levels } = simulate(c, { seconds: 400, frameMs: () => 80 });
  const { budgets, scales } = DEFAULT_ADAPTIVE_CONFIG;
  assert.deepEqual(c.current, { budgetIndex: budgets.length - 1, scaleIndex: scales.length - 1 });
  assert.equal(c.snapshot(400_000).state, "limite");
  // Depois de chegar ao chão, nenhuma mudança.
  assert.equal(changesIn(levels.slice(-levels.length / 4)), 0);
});

test("7. recuperação gradual: com desempenho sobrando, sobe um degrau por vez", () => {
  const { budgets, scales } = DEFAULT_ADAPTIVE_CONFIG;
  const c = new AdaptiveQualityController({
    device: "desktop",
    budgetEffective: true,
    initial: { budgetIndex: budgets.length - 1, scaleIndex: scales.length - 1 },
  });
  c.setActive(true, 0);
  const { levels } = simulate(c, { seconds: 400, frameMs: () => 6 });
  // Cada passo muda um eixo só e por um degrau.
  for (let i = 1; i < levels.length; i++) {
    const db = Math.abs(levels[i].budgetIndex - levels[i - 1].budgetIndex);
    const ds = Math.abs(levels[i].scaleIndex - levels[i - 1].scaleIndex);
    assert.ok(db + ds <= 1, "um degrau de um eixo por vez");
  }
  // Primeiro a resolução volta ao máximo.
  assert.equal(c.current.scaleIndex, 0);
  assert.ok(c.current.budgetIndex < budgets.length - 1, "o orçamento também subiu");
});

test("7b. aumento que derruba o FPS é desfeito e não é repetido logo em seguida", () => {
  const c = new AdaptiveQualityController({ device: "desktop", budgetEffective: true, initial: { budgetIndex: 3 } });
  c.setActive(true, 0);
  // Até 1,2 M cabe em 60 FPS; 1,6 M já passa (19 ms).
  const { levels } = simulate(c, { seconds: 600, frameMs: (b) => (b > 1_200_000 ? 19 : 12) });
  assert.equal(c.current.budgetIndex, 3);
  // Tentativas espaçadas pelo bloqueio que dobra: poucas em 10 minutos.
  assert.ok(changesIn(levels) <= 10, `mudanças: ${changesIn(levels)}`);
});

test("8. sem efeito do orçamento (SOG único), só a resolução é ajustada", () => {
  const c = new AdaptiveQualityController({ device: "desktop", budgetEffective: false, initial: { budgetIndex: 1 } });
  c.setActive(true, 0);
  simulate(c, { seconds: 120, frameMs: (_b, s) => 6 + 30 * s * s });
  assert.equal(c.current.budgetIndex, 1, "orçamento intocado");
  assert.ok(c.current.scaleIndex > 0);
});

test("8b. no teto (resolução máxima, orçamento sem efeito) o estado não diz que está aumentando", () => {
  const c = new AdaptiveQualityController({ device: "desktop", budgetEffective: false, initial: { budgetIndex: 1 } });
  c.setActive(true, 0);
  const { t } = simulate(c, { seconds: 60, frameMs: () => 5 });
  assert.deepEqual(c.current, { budgetIndex: 1, scaleIndex: 0 });
  assert.equal(c.snapshot(t).state, "monitorando");
});

test("9. aba em segundo plano / pausa: o intervalo longo não conta e há novo aquecimento", () => {
  const c = new AdaptiveQualityController({ device: "desktop", budgetEffective: true, initial: { budgetIndex: 0 } });
  c.setActive(true, 0);
  simulate(c, { seconds: 20, frameMs: () => 8 });
  c.setActive(false, 20_000);
  assert.equal(c.snapshot(20_000).state, "pausado");
  // Volta 60 s depois: o primeiro intervalo é enorme e é ignorado.
  c.setActive(true, 80_000);
  c.frame({ t: 80_016 });
  assert.equal(c.snapshot(80_016).state, "aquecendo");
  simulate(c, { seconds: 30, frameMs: () => 8, start: 80_016 });
  assert.equal(c.snapshot(110_000).changes, 0);
});

test("10. navegação prolongada com ruído: sem ciclos de alternância", () => {
  const c = new AdaptiveQualityController({ device: "touch", budgetEffective: true });
  c.setActive(true, 0);
  // Custo perto do limite de 30 FPS com ruído determinístico e engasgos ocasionais.
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const { levels } = simulate(c, {
    seconds: 1800,
    frameMs: (b, s) => 8 + (b / 1e6) * 22 + s * s * 6 + rand() * 6 + (rand() < 0.01 ? 120 : 0),
  });
  const last = levels.slice(-Math.floor(levels.length / 2));
  assert.ok(changesIn(last) <= 8, `mudanças na segunda metade: ${changesIn(last)}`);
});

test("aparelho de toque que sustenta 60 passa a buscar 60", () => {
  const c = new AdaptiveQualityController({ device: "touch", budgetEffective: true });
  c.setActive(true, 0);
  simulate(c, { seconds: 15, frameMs: () => 9 });
  assert.equal(c.snapshot(15_000).targetFps > 50, true);
});

test("estatísticas: média, percentis e taxa de atualização", () => {
  const s = frameStats([10, 10, 10, 20], [2, 2], 1);
  assert.equal(s.frames, 4);
  assert.equal(s.spanMs, 50);
  assert.equal(s.fps, 80);
  assert.equal(s.p50Ms, 10);
  assert.equal(s.p95Ms, 20);
  assert.equal(s.cpuMeanMs, 2);
  assert.equal(s.streamingShare, 0.25);
  assert.equal(estimateRefreshHz(Array(60).fill(1000 / 60)), 60);
  assert.equal(estimateRefreshHz(Array(60).fill(1000 / 120)), 120);
  assert.equal(estimateRefreshHz([16]), null);
});

test("nível salvo: validado e ignorado se a escada mudou", () => {
  const level = { budgetIndex: 2, scaleIndex: 1 };
  assert.deepEqual(parseStoredLevel(serializeLevel(level)), level);
  assert.equal(parseStoredLevel('{"budgetIndex":2,"scaleIndex":1,"budgets":3}'), null);
  assert.equal(parseStoredLevel('{"budgetIndex":99,"scaleIndex":1,"budgets":8}'), null);
  assert.equal(parseStoredLevel("{quebrado"), null);
  assert.equal(parseStoredLevel(null), null);
});
