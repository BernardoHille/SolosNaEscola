/**
 * Controlador de qualidade adaptativa (modo "Automático").
 *
 * Módulo puro: não conhece PlayCanvas nem React. Recebe os quadros renderizados (instante, duração
 * desde o quadro anterior, tempo de CPU do tick e se havia streaming de blocos em andamento) e
 * devolve o nível de qualidade em uso: um índice na escada de orçamentos de gaussianas e outro na
 * escada de resoluções. A ligação com o viewer fica em `useRenderQuality.ts`.
 *
 * Princípio: usar a maior qualidade que o aparelho sustenta, não a menor que funciona.
 *
 * Regras (valores em `DEFAULT_ADAPTIVE_CONFIG`, calibráveis):
 * - Mede numa janela móvel (≈ 4 s) só de quadros contínuos: intervalos longos (câmera parada, o
 *   viewer renderiza sob demanda) separam trechos e não contam como lentidão.
 * - Não decide durante o aquecimento (após começar, voltar do segundo plano ou de uma pausa), nem
 *   com a janela dominada por quadros de streaming de blocos: queda breve de carregamento não reduz
 *   a qualidade.
 * - Reduz um degrau quando o FPS médio fica abaixo de `downRatio` × meta durante `downHoldMs`.
 *   Reduz primeiro o orçamento de gaussianas; a resolução só cai com o orçamento no mínimo, ou se
 *   reduzir gaussianas não melhorou o tempo de quadro (gargalo por pixel), ou se o orçamento não
 *   tem efeito (SOG de arquivo único).
 * - Aumenta um degrau (um só eixo por vez: primeiro devolve a resolução, depois o orçamento) quando
 *   o FPS fica perto da meta por `upHoldMs` com tempos de quadro estáveis. O aumento é um teste: se
 *   provocar queda persistente logo depois, volta e aquele nível fica bloqueado por um tempo que
 *   dobra a cada nova falha (proteção contra alternância).
 * - Depois de cada mudança, espera `settleMs` (estabilização) antes de avaliar de novo.
 * - A meta efetiva nunca passa da taxa de atualização observada da tela: um aparelho travado em
 *   30 Hz não é "lento" para uma meta de 60.
 */

export type DeviceClass = "desktop" | "touch";

export type AdaptiveConfig = {
  /** Orçamentos de gaussianas, do maior para o menor. */
  budgets: readonly number[];
  /** Escalas de resolução, da maior para a menor. */
  scales: readonly number[];
  /** Meta de FPS por classe de aparelho. */
  targetFps: Record<DeviceClass, number>;
  /** Meta para aparelhos de toque que sustentam 60 FPS no nível inicial. */
  touchHighTargetFps: number;
  /** Duração da janela móvel de medição. */
  windowMs: number;
  /** Intervalo acima do qual dois quadros não são considerados contínuos. */
  gapMs: number;
  /** Tempo mínimo de quadros contínuos na janela para decidir. */
  minSampleMs: number;
  /** Espera após início, retomada ou pausa. */
  warmupMs: number;
  /** Espera após cada mudança de nível. */
  settleMs: number;
  /** Fração da meta abaixo da qual há queda. */
  downRatio: number;
  /** Tempo contínuo abaixo de `downRatio` para reduzir. */
  downHoldMs: number;
  /** Fração da meta acima da qual há folga. */
  upRatio: number;
  /** Tempo contínuo com folga e estabilidade para tentar aumentar. */
  upHoldMs: number;
  /** p95 do tempo de quadro máximo (em múltiplos do tempo da meta) para considerar estável. */
  upMaxP95Ratio: number;
  /** Tempo de observação de um aumento: queda nesse período desfaz o aumento. */
  probeMs: number;
  /** Bloqueio inicial de um nível que falhou (dobra a cada falha). */
  backoffMs: number;
  backoffMaxMs: number;
  /** Fração máxima de quadros com streaming na janela para decidir. */
  maxStreamingShare: number;
  /** Melhora mínima do tempo de quadro para considerar eficaz uma redução de orçamento. */
  minBudgetGain: number;
};

export const DEFAULT_ADAPTIVE_CONFIG: AdaptiveConfig = {
  budgets: [3_000_000, 2_200_000, 1_600_000, 1_200_000, 900_000, 700_000, 500_000, 350_000],
  scales: [1, 0.85, 0.75, 0.6, 0.5],
  targetFps: { desktop: 60, touch: 30 },
  touchHighTargetFps: 60,
  windowMs: 4000,
  gapMs: 250,
  minSampleMs: 2500,
  warmupMs: 3000,
  settleMs: 4000,
  downRatio: 0.85,
  downHoldMs: 4000,
  upRatio: 0.95,
  upHoldMs: 15000,
  upMaxP95Ratio: 1.35,
  probeMs: 6000,
  backoffMs: 60000,
  backoffMaxMs: 8 * 60000,
  maxStreamingShare: 0.5,
  minBudgetGain: 0.05,
};

export type AdaptiveLevel = { budgetIndex: number; scaleIndex: number };

export type ControllerState =
  | "pausado"
  | "aquecendo"
  | "estabilizando"
  | "monitorando"
  | "reduzindo"
  | "aumentando"
  | "testando"
  | "limite";

export type Bottleneck = "indefinido" | "taxa de atualização" | "streaming" | "gaussianas" | "pixels" | "CPU";

export type FrameSample = {
  /** Instante do quadro (ms, relógio monotônico). */
  t: number;
  /** Tempo de CPU do tick do motor (ms), se medido. */
  cpuMs?: number;
  /** Havia blocos sendo baixados/decodificados neste quadro. */
  streaming?: boolean;
};

export type WindowStats = {
  frames: number;
  /** Duração somada dos intervalos contínuos (ms). */
  spanMs: number;
  fps: number;
  meanMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  cpuMeanMs: number | null;
  streamingShare: number;
};

export type AdaptiveSnapshot = {
  level: AdaptiveLevel;
  budget: number;
  scale: number;
  state: ControllerState;
  targetFps: number;
  refreshHz: number | null;
  bottleneck: Bottleneck;
  lastReason: string | null;
  lastChangeAt: number | null;
  stats: WindowStats | null;
  /** O orçamento de gaussianas tem efeito (cena com LOD). */
  budgetEffective: boolean;
  /** Reduzir gaussianas deixou de melhorar o tempo de quadro: o gargalo é por pixel. */
  pixelBound: boolean;
  changes: number;
};

const percentile = (sorted: number[], p: number) => {
  if (!sorted.length) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[i];
};

/** Estatísticas de uma lista de intervalos de quadro (ms). Exportada para os testes e o diagnóstico. */
export function frameStats(intervals: number[], cpu: number[] = [], streamingFrames = 0): WindowStats {
  const sorted = [...intervals].sort((a, b) => a - b);
  const spanMs = intervals.reduce((s, v) => s + v, 0);
  const frames = intervals.length;
  return {
    frames,
    spanMs,
    fps: spanMs > 0 ? (frames * 1000) / spanMs : 0,
    meanMs: frames ? spanMs / frames : 0,
    p50Ms: percentile(sorted, 50),
    p95Ms: percentile(sorted, 95),
    p99Ms: percentile(sorted, 99),
    cpuMeanMs: cpu.length ? cpu.reduce((s, v) => s + v, 0) / cpu.length : null,
    streamingShare: frames ? streamingFrames / frames : 0,
  };
}

/** Taxas de atualização comuns, para arredondar a estimativa. */
const COMMON_RATES = [24, 30, 48, 50, 60, 72, 75, 90, 100, 120, 144, 165, 240];

/**
 * Taxa de atualização estimada a partir de intervalos de ticks ociosos (mediana): sem nada a
 * desenhar, o laço do navegador segue o ritmo da tela.
 */
export function estimateRefreshHz(intervals: number[]): number | null {
  if (intervals.length < 30) return null;
  const sorted = [...intervals].sort((a, b) => a - b);
  const typical = percentile(sorted, 50);
  if (!(typical > 0)) return null;
  const hz = 1000 / typical;
  let best = COMMON_RATES[0];
  for (const rate of COMMON_RATES) if (Math.abs(rate - hz) < Math.abs(best - hz)) best = rate;
  // Só arredonda quando está perto de uma taxa comum (±8 %).
  return Math.abs(best - hz) / best <= 0.08 ? best : Math.round(hz);
}

type Sample = { t: number; dt: number; cpuMs?: number; streaming: boolean };

export class AdaptiveQualityController {
  readonly config: AdaptiveConfig;
  private readonly device: DeviceClass;
  private level: AdaptiveLevel;
  private readonly initial: AdaptiveLevel;
  private samples: Sample[] = [];
  private lastFrameT: number | null = null;
  private active = false;
  private warmupUntil = 0;
  private settleUntil = 0;
  private belowSince: number | null = null;
  private aboveSince: number | null = null;
  private probe: { from: AdaptiveLevel; until: number; key: string } | null = null;
  private blocked = new Map<string, { until: number; failures: number }>();
  private budgetEffective: boolean;
  private pixelBound = false;
  private ineffectiveBudgetSteps = 0;
  private pendingBudgetCheck: { meanMsBefore: number; at: number } | null = null;
  private target: number;
  private refreshHz: number | null = null;
  private refreshIntervals: number[] = [];
  private lastIdleT: number | null = null;
  private lastReason: string | null = null;
  private lastChangeAt: number | null = null;
  private changes = 0;
  private atFloor = false;
  private highTargetChecked = false;
  private lastStats: WindowStats | null = null;
  private listeners = new Set<(s: AdaptiveSnapshot) => void>();

  constructor(options: {
    device: DeviceClass;
    budgetEffective: boolean;
    initial?: Partial<AdaptiveLevel>;
    config?: Partial<AdaptiveConfig>;
  }) {
    this.config = { ...DEFAULT_ADAPTIVE_CONFIG, ...options.config };
    this.device = options.device;
    this.budgetEffective = options.budgetEffective;
    const start = { ...initialLevel(options.device, this.config), ...options.initial };
    this.level = this.clampLevel(start);
    this.initial = { ...this.level };
    this.target = this.config.targetFps[options.device];
  }

  /** Nível atual (índices nas escadas). */
  get current(): AdaptiveLevel {
    return { ...this.level };
  }

  get budget() {
    return this.config.budgets[this.level.budgetIndex];
  }

  get scale() {
    return this.config.scales[this.level.scaleIndex];
  }

  /** Meta efetiva: a da classe do aparelho, limitada pela taxa de atualização observada. */
  get effectiveTarget() {
    const cap = this.refreshHz ? this.refreshHz * 0.98 : Infinity;
    return Math.min(this.target, cap);
  }

  subscribe(listener: (s: AdaptiveSnapshot) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  setBudgetEffective(value: boolean) {
    this.budgetEffective = value;
  }

  /**
   * Liga ou pausa a avaliação (segundo plano, menus, inspeção, tela inicial). Ao voltar, a janela
   * é descartada e há um novo aquecimento.
   */
  setActive(value: boolean, now: number) {
    if (value === this.active) return;
    this.active = value;
    this.resetWindow();
    if (value) this.warmupUntil = now + this.config.warmupMs;
    this.emit(now);
  }

  /** Registra um quadro renderizado; devolve true quando o nível mudou. */
  frame(sample: FrameSample): boolean {
    const { t } = sample;
    const prev = this.lastFrameT;
    this.lastFrameT = t;
    if (!this.active || prev === null) return false;
    const dt = t - prev;
    // Intervalo longo: a câmera parou (renderização sob demanda) ou a aba ficou oculta. Separa
    // trechos; não é lentidão.
    if (!(dt > 0) || dt > this.config.gapMs) return false;
    this.samples.push({ t, dt, cpuMs: sample.cpuMs, streaming: !!sample.streaming });
    const cutoff = t - this.config.windowMs;
    let drop = 0;
    while (drop < this.samples.length && this.samples[drop].t < cutoff) drop++;
    if (drop) this.samples.splice(0, drop);
    return this.evaluate(t);
  }

  /**
   * Registra um tick do laço do navegador em que nada foi desenhado (cena parada). Esses ticks
   * seguem o ritmo da tela, não o custo da cena: são a medida da taxa de atualização. Quadros
   * renderizados não servem para isso, porque um aparelho lento travado em 30 FPS pareceria uma
   * tela de 30 Hz.
   */
  idleTick(t: number) {
    const prev = this.lastIdleT;
    this.lastIdleT = t;
    if (prev === null) return;
    const dt = t - prev;
    if (!(dt > 0) || dt > this.config.gapMs) return;
    this.refreshIntervals.push(dt);
    if (this.refreshIntervals.length > 600) this.refreshIntervals.splice(0, this.refreshIntervals.length - 600);
    this.refreshHz = estimateRefreshHz(this.refreshIntervals) ?? this.refreshHz;
  }

  snapshot(now: number): AdaptiveSnapshot {
    return {
      level: this.current,
      budget: this.budget,
      scale: this.scale,
      state: this.state(now),
      targetFps: this.effectiveTarget,
      refreshHz: this.refreshHz,
      bottleneck: this.bottleneck(),
      lastReason: this.lastReason,
      lastChangeAt: this.lastChangeAt,
      stats: this.lastStats,
      budgetEffective: this.budgetEffective,
      pixelBound: this.pixelBound,
      changes: this.changes,
    };
  }

  private state(now: number): ControllerState {
    if (!this.active) return "pausado";
    if (now < this.warmupUntil) return "aquecendo";
    if (this.probe) return "testando";
    if (now < this.settleUntil) return "estabilizando";
    if (this.belowSince !== null) return this.atFloor ? "limite" : "reduzindo";
    // "aumentando" só quando há um degrau acima disponível (no teto, ou com o degrau bloqueado, só monitora).
    if (this.aboveSince !== null && now - this.aboveSince > this.config.upHoldMs / 3 && this.higher(now)) {
      return "aumentando";
    }
    return "monitorando";
  }

  private bottleneck(): Bottleneck {
    const s = this.lastStats;
    if (!s || s.frames < 10) return "indefinido";
    if (s.streamingShare > this.config.maxStreamingShare) return "streaming";
    if (this.refreshHz && s.fps >= this.refreshHz * 0.95) return "taxa de atualização";
    // CPU ocupada quase o quadro inteiro: o tick do motor (JS + envio de comandos) é o limite.
    if (s.cpuMeanMs !== null && s.cpuMeanMs >= s.meanMs * 0.85) return "CPU";
    if (this.pixelBound || !this.budgetEffective) return "pixels";
    return "gaussianas";
  }

  private resetWindow() {
    this.samples = [];
    this.lastFrameT = null;
    this.belowSince = null;
    this.aboveSince = null;
  }

  private windowStats(): WindowStats {
    const intervals = this.samples.map((s) => s.dt);
    const cpu = this.samples.flatMap((s) => (s.cpuMs === undefined ? [] : [s.cpuMs]));
    const streaming = this.samples.reduce((n, s) => n + (s.streaming ? 1 : 0), 0);
    return frameStats(intervals, cpu, streaming);
  }

  private evaluate(now: number): boolean {
    const cfg = this.config;
    const stats = this.windowStats();
    this.lastStats = stats;
    if (now < this.warmupUntil) return false;
    if (stats.spanMs < cfg.minSampleMs) return false;

    // Uma redução de orçamento recente: mede se ajudou (detecção de gargalo por pixel).
    if (this.pendingBudgetCheck && now >= this.settleUntil && stats.streamingShare <= cfg.maxStreamingShare) {
      const gain = 1 - stats.meanMs / this.pendingBudgetCheck.meanMsBefore;
      this.ineffectiveBudgetSteps = gain < cfg.minBudgetGain ? this.ineffectiveBudgetSteps + 1 : 0;
      if (this.ineffectiveBudgetSteps >= 2) this.pixelBound = true;
      this.pendingBudgetCheck = null;
    }

    // Streaming de blocos domina a janela: queda temporária, nada é decidido.
    if (stats.streamingShare > cfg.maxStreamingShare) {
      this.belowSince = null;
      this.aboveSince = null;
      return false;
    }

    const target = this.effectiveTarget;
    const below = stats.fps < target * cfg.downRatio;
    const targetFrameMs = 1000 / target;
    const stable = stats.p95Ms <= targetFrameMs * cfg.upMaxP95Ratio;
    const above = stats.fps >= target * cfg.upRatio && stable;

    // Teste de aumento em curso: queda persistente desfaz; sem queda até o fim, aceita.
    if (this.probe) {
      if (below && stats.spanMs >= cfg.minSampleMs && now >= this.settleUntil) {
        const failed = this.probe;
        this.probe = null;
        const prev = this.blocked.get(failed.key);
        const failures = (prev?.failures ?? 0) + 1;
        const wait = Math.min(cfg.backoffMaxMs, cfg.backoffMs * 2 ** (failures - 1));
        this.blocked.set(failed.key, { until: now + wait, failures });
        return this.change(failed.from, now, `aumento desfeito: ${stats.fps.toFixed(0)} FPS < ${(target * cfg.downRatio).toFixed(0)}`);
      }
      if (now >= this.probe.until) this.probe = null;
      return false;
    }

    if (now < this.settleUntil) return false;

    // Aparelho de toque que sustenta 60 no nível inicial: passa a buscar 60.
    if (
      this.device === "touch" &&
      !this.highTargetChecked &&
      this.target < cfg.touchHighTargetFps &&
      stats.spanMs >= cfg.minSampleMs
    ) {
      this.highTargetChecked = true;
      const cap = this.refreshHz ?? cfg.touchHighTargetFps;
      if (stats.fps >= Math.min(cfg.touchHighTargetFps, cap) * 0.92 && cap >= cfg.touchHighTargetFps * 0.95) {
        this.target = cfg.touchHighTargetFps;
        this.lastReason = `meta elevada para ${cfg.touchHighTargetFps} FPS (aparelho sustenta)`;
        this.emit(now);
        return false;
      }
    }

    if (below) {
      this.aboveSince = null;
      this.belowSince ??= now;
      if (now - this.belowSince < cfg.downHoldMs) return false;
      // Meta de 60 num aparelho de toque que já está no nível inicial ou abaixo: volta a meta para
      // 30 em vez de sacrificar a imagem.
      if (this.device === "touch" && this.target > cfg.targetFps.touch && !this.isAbove(this.level, this.initial)) {
        this.target = cfg.targetFps.touch;
        this.belowSince = null;
        this.lastReason = "meta de volta a 30 FPS";
        this.emit(now);
        return false;
      }
      const next = this.lower(stats);
      if (!next) {
        this.atFloor = true;
        return false;
      }
      if (next.budgetIndex !== this.level.budgetIndex) {
        this.pendingBudgetCheck = { meanMsBefore: stats.meanMs, at: now };
      }
      const what = next.budgetIndex !== this.level.budgetIndex ? "orçamento" : "resolução";
      return this.change(next, now, `redução de ${what}: ${stats.fps.toFixed(0)} FPS < ${(target * cfg.downRatio).toFixed(0)} por ${(cfg.downHoldMs / 1000).toFixed(0)} s`);
    }

    this.belowSince = null;
    this.atFloor = false;
    if (!above) {
      this.aboveSince = null;
      return false;
    }
    this.aboveSince ??= now;
    if (now - this.aboveSince < cfg.upHoldMs) return false;
    const next = this.higher(now);
    if (!next) return false;
    const from = this.current;
    const what = next.scaleIndex !== this.level.scaleIndex ? "resolução" : "orçamento";
    const changed = this.change(next, now, `aumento de ${what}: ${stats.fps.toFixed(0)} FPS estáveis por ${(cfg.upHoldMs / 1000).toFixed(0)} s`);
    this.probe = { from, until: now + cfg.settleMs + cfg.probeMs, key: levelKey(next) };
    return changed;
  }

  private isAbove(a: AdaptiveLevel, b: AdaptiveLevel) {
    return a.budgetIndex < b.budgetIndex || a.scaleIndex < b.scaleIndex;
  }

  /** Próximo degrau para baixo, um eixo só. */
  private lower(stats: WindowStats): AdaptiveLevel | null {
    const { budgets, scales } = this.config;
    const canBudget = this.budgetEffective && this.level.budgetIndex < budgets.length - 1;
    const canScale = this.level.scaleIndex < scales.length - 1;
    const preferScale = this.pixelBound || !this.budgetEffective;
    // CPU como limite: menos gaussianas também reduzem ordenação e envio; não adianta baixar pixels.
    const cpuBound = stats.cpuMeanMs !== null && stats.cpuMeanMs >= stats.meanMs * 0.85;
    if (canBudget && (!preferScale || cpuBound || !canScale)) {
      return { ...this.level, budgetIndex: this.level.budgetIndex + 1 };
    }
    if (canScale) return { ...this.level, scaleIndex: this.level.scaleIndex + 1 };
    return null;
  }

  /** Próximo degrau para cima: primeiro devolve a resolução, depois o orçamento. */
  private higher(now: number): AdaptiveLevel | null {
    const candidates: AdaptiveLevel[] = [];
    if (this.level.scaleIndex > 0) candidates.push({ ...this.level, scaleIndex: this.level.scaleIndex - 1 });
    if (this.budgetEffective && this.level.budgetIndex > 0) {
      candidates.push({ ...this.level, budgetIndex: this.level.budgetIndex - 1 });
    }
    for (const candidate of candidates) {
      const block = this.blocked.get(levelKey(candidate));
      if (!block || now >= block.until) return candidate;
    }
    return null;
  }

  private change(next: AdaptiveLevel, now: number, reason: string) {
    const clamped = this.clampLevel(next);
    if (clamped.budgetIndex === this.level.budgetIndex && clamped.scaleIndex === this.level.scaleIndex) return false;
    this.level = clamped;
    this.lastReason = reason;
    this.lastChangeAt = now;
    this.changes++;
    this.settleUntil = now + this.config.settleMs;
    // Quadros medidos no nível anterior não valem para o novo.
    this.samples = [];
    this.belowSince = null;
    this.aboveSince = null;
    this.atFloor = false;
    this.emit(now);
    return true;
  }

  private clampLevel(level: AdaptiveLevel): AdaptiveLevel {
    const clamp = (v: number, max: number) => Math.max(0, Math.min(max, Math.round(v)));
    return {
      budgetIndex: clamp(level.budgetIndex, this.config.budgets.length - 1),
      scaleIndex: clamp(level.scaleIndex, this.config.scales.length - 1),
    };
  }

  private emit(now: number) {
    if (!this.listeners.size) return;
    const snap = this.snapshot(now);
    for (const listener of this.listeners) listener(snap);
  }
}

const levelKey = (level: AdaptiveLevel) => `${level.budgetIndex}:${level.scaleIndex}`;

/**
 * Nível inicial conservador: no computador, 2,2 M gaussianas em resolução cheia; em celulares e
 * tablets, 700 mil em 75 % da resolução. O controlador sobe ou desce a partir daí.
 */
export function initialLevel(device: DeviceClass, config: AdaptiveConfig = DEFAULT_ADAPTIVE_CONFIG): AdaptiveLevel {
  const budgetIndex = (target: number) => {
    const i = config.budgets.findIndex((b) => b <= target);
    return i < 0 ? config.budgets.length - 1 : i;
  };
  const scaleIndex = (target: number) => {
    const i = config.scales.findIndex((s) => s <= target);
    return i < 0 ? config.scales.length - 1 : i;
  };
  return device === "touch"
    ? { budgetIndex: budgetIndex(700_000), scaleIndex: scaleIndex(0.75) }
    : { budgetIndex: budgetIndex(2_200_000), scaleIndex: 0 };
}

/** Lê o último nível estável salvo (ponto de partida da próxima visita). */
export function parseStoredLevel(value: string | null, config: AdaptiveConfig = DEFAULT_ADAPTIVE_CONFIG): AdaptiveLevel | null {
  if (!value) return null;
  try {
    const data = JSON.parse(value) as Partial<AdaptiveLevel> & { budgets?: number };
    // Salvo com outra escada (mudança de calibração): ignora.
    if (data.budgets !== config.budgets.length) return null;
    const { budgetIndex, scaleIndex } = data;
    if (!Number.isInteger(budgetIndex) || !Number.isInteger(scaleIndex)) return null;
    if (budgetIndex! < 0 || budgetIndex! >= config.budgets.length) return null;
    if (scaleIndex! < 0 || scaleIndex! >= config.scales.length) return null;
    return { budgetIndex: budgetIndex!, scaleIndex: scaleIndex! };
  } catch {
    return null;
  }
}

export function serializeLevel(level: AdaptiveLevel, config: AdaptiveConfig = DEFAULT_ADAPTIVE_CONFIG) {
  return JSON.stringify({ ...level, budgets: config.budgets.length });
}
