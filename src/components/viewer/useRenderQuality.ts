"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";

import {
  DEFAULT_RENDER_QUALITY,
  findRenderQuality,
  parseQualityPreference,
  type RenderQualityId,
} from "@/data/quality";
import {
  AdaptiveQualityController,
  type AdaptiveSnapshot,
  parseStoredLevel,
  serializeLevel,
} from "@/lib/viewer/adaptiveQuality";
import { pinColorRefresh } from "@/lib/viewer/colorRefresh";
import { monitorFrames } from "@/lib/viewer/frameMonitor";
import { applyRenderScale, pinViewerQuality } from "@/lib/viewer/renderScale";
import { pinSplatBudget } from "@/lib/viewer/splatBudget";

export const QUALITY_STORAGE_KEY = "solos:render-quality";
/** Último nível estável do automático neste aparelho: ponto de partida da próxima visita. */
export const AUTO_LEVEL_STORAGE_KEY = "solos:auto-quality";
/** Orçamento até o modo da visita ser aplicado (no mesmo commit do React): o da cena inteira. */
const INITIAL_BUDGET = 3_000_000;

const read = (key: string) => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string | null) => {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // Sem armazenamento: vale só nesta visita.
  }
};

export type RenderQualityState = {
  /** Preferência do visitante ("auto" ou um modo manual). */
  level: RenderQualityId;
  setLevel: (id: RenderQualityId) => void;
  resetLevel: () => void;
  /** Orçamento e escala em uso agora (do modo manual ou do automático). */
  applied: { budget: number; scale: number };
  /** Estado do controlador automático (só no modo automático). */
  auto: AdaptiveSnapshot | null;
};

/**
 * Qualidade da visita aplicada ao viewer, sem recriá-lo: resolução (`applyRenderScale`) e orçamento
 * de gaussianas (`pinSplatBudget`). No modo "Automático" (padrão), o controlador de
 * `adaptiveQuality.ts` escolhe os dois pelo desempenho medido; nos modos manuais, nada sobrescreve a
 * escolha do visitante.
 *
 * @param budgetEffective - a cena tem LOD (Streamed SOG); no SOG único só a resolução muda.
 * @param evaluating - a visita está em andamento (sem menu, painel ou inspeção): só então o
 *   automático mede e decide.
 */
export function useRenderQuality(
  viewer: ViewerHandle | null,
  inputMode: "desktop" | "touch",
  { budgetEffective, evaluating }: { budgetEffective: boolean; evaluating: boolean },
): RenderQualityState {
  const [chosen, setChosen] = useState<RenderQualityId | null>(() =>
    typeof window === "undefined" ? null : parseQualityPreference(read(QUALITY_STORAGE_KEY)),
  );
  const level = chosen ?? DEFAULT_RENDER_QUALITY;
  const manual = level === "auto" ? null : findRenderQuality(level) ?? null;

  const [auto, setAuto] = useState<AdaptiveSnapshot | null>(null);
  const controllerRef = useRef<AdaptiveQualityController | null>(null);
  const budgetRef = useRef<ReturnType<typeof pinSplatBudget> | null>(null);
  const evaluatingRef = useRef(evaluating);

  // Proteções que valem para qualquer modo: o "Quality" nativo fora de `performance` (que cortaria
  // a resolução de novo), cores dependentes do ângulo a cada ~1° e o orçamento da visita.
  useEffect(() => {
    if (!viewer) return;
    const unpinQuality = pinViewerQuality(viewer);
    const unpinColor = pinColorRefresh(viewer);
    const budget = pinSplatBudget(viewer, manual?.splatBudget ?? INITIAL_BUDGET);
    budgetRef.current = budget;
    return () => {
      unpinQuality();
      unpinColor();
      budget.dispose();
      budgetRef.current = null;
    };
    // O orçamento inicial é corrigido logo abaixo; recriar o pino a cada troca não é necessário.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer]);

  // Modo manual: valores fixos do modo escolhido.
  useEffect(() => {
    if (!viewer || !manual) return;
    applyRenderScale(viewer, manual.scale);
    budgetRef.current?.set(manual.splatBudget);
  }, [viewer, manual]);

  // Modo automático: um controlador por viewer, alimentado pelos quadros do motor.
  const isAuto = level === "auto";
  useEffect(() => {
    if (!viewer || !isAuto) return;
    const controller = new AdaptiveQualityController({
      device: inputMode,
      budgetEffective,
      initial: parseStoredLevel(read(AUTO_LEVEL_STORAGE_KEY)) ?? undefined,
    });
    controllerRef.current = controller;
    let appliedKey = "";
    let savedKey = read(AUTO_LEVEL_STORAGE_KEY);
    const apply = (snap: AdaptiveSnapshot) => {
      const key = `${snap.budget}:${snap.scale}`;
      if (key !== appliedKey) {
        appliedKey = key;
        applyRenderScale(viewer, snap.scale);
        budgetRef.current?.set(snap.budget);
      }
      // Guarda só níveis estáveis (não o meio de um teste de aumento).
      if (snap.state === "monitorando" || snap.state === "limite") {
        const serialized = serializeLevel(snap.level);
        if (serialized !== savedKey) {
          savedKey = serialized;
          write(AUTO_LEVEL_STORAGE_KEY, serialized);
        }
      }
    };
    apply(controller.snapshot(performance.now()));
    const unsubscribe = controller.subscribe(apply);

    const visible = () => document.visibilityState === "visible";
    controller.setActive(evaluatingRef.current && visible(), performance.now());
    const stopFrames = monitorFrames(viewer, (frame) => {
      if (frame.rendered) controller.frame({ t: frame.t, cpuMs: frame.cpuMs, streaming: frame.streaming });
      else controller.idleTick(frame.t);
    });
    const onVisibility = () => controller.setActive(evaluatingRef.current && visible(), performance.now());
    document.addEventListener("visibilitychange", onVisibility);

    // Estado exposto (orçamento/escala aplicados e painel de diagnóstico): consultado duas vezes por
    // segundo, mas só vira estado do React quando algo exibido muda, para não re-renderizar a
    // exposição inteira à toa.
    let shownKey = "";
    const id = window.setInterval(() => {
      const snap = controller.snapshot(performance.now());
      const key = [snap.state, snap.budget, snap.scale, snap.targetFps, snap.refreshHz, snap.bottleneck, snap.changes].join("|");
      if (key === shownKey) return;
      shownKey = key;
      setAuto(snap);
    }, 500);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      stopFrames();
      unsubscribe();
      controllerRef.current = null;
      setAuto(null);
    };
  }, [viewer, isAuto, inputMode, budgetEffective]);

  // Pausa durante menus, painéis, inspeção e tela inicial.
  useEffect(() => {
    evaluatingRef.current = evaluating;
    const visible = typeof document === "undefined" || document.visibilityState === "visible";
    controllerRef.current?.setActive(evaluating && visible, performance.now());
  }, [evaluating]);

  const setLevel = useCallback((id: RenderQualityId) => {
    setChosen(id);
    write(QUALITY_STORAGE_KEY, id);
  }, []);

  /** Esquece a escolha e o aprendizado do automático: volta ao padrão. */
  const resetLevel = useCallback(() => {
    setChosen(null);
    write(QUALITY_STORAGE_KEY, null);
    write(AUTO_LEVEL_STORAGE_KEY, null);
  }, []);

  const applied = manual
    ? { budget: manual.splatBudget, scale: manual.scale }
    : { budget: auto?.budget ?? 0, scale: auto?.scale ?? 1 };

  return { level, setLevel, resetLevel, applied, auto };
}
