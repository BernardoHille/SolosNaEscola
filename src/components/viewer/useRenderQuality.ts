"use client";

import { useCallback, useEffect, useState } from "react";
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";

import { defaultRenderQuality, findRenderQuality, type RenderQualityId } from "@/data/quality";
import { pinColorRefresh } from "@/lib/viewer/colorRefresh";
import { applyRenderScale, pinViewerQuality } from "@/lib/viewer/renderScale";

export const QUALITY_STORAGE_KEY = "solos:render-quality";

function readStored(): RenderQualityId | null {
  try {
    return findRenderQuality(window.localStorage.getItem(QUALITY_STORAGE_KEY))?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Modo de qualidade escolhido pelo visitante (lembrado neste navegador) e aplicado ao viewer.
 * Sem escolha salva, usa o padrão do tipo de aparelho.
 */
export function useRenderQuality(viewer: ViewerHandle | null, inputMode: "desktop" | "touch") {
  const [chosen, setChosen] = useState<RenderQualityId | null>(() =>
    typeof window === "undefined" ? null : readStored(),
  );
  const level = chosen ?? defaultRenderQuality(inputMode);
  const scale = findRenderQuality(level)?.scale ?? 1;

  useEffect(() => {
    if (!viewer) return;
    const unpinQuality = pinViewerQuality(viewer);
    // Cores dependentes do ângulo recalculadas só a cada ~1°, não em todo passo (ver colorRefresh).
    const unpinColor = pinColorRefresh(viewer);
    return () => {
      unpinQuality();
      unpinColor();
    };
  }, [viewer]);

  useEffect(() => {
    if (viewer) applyRenderScale(viewer, scale);
  }, [viewer, scale]);

  const setLevel = useCallback((id: RenderQualityId) => {
    setChosen(id);
    try {
      window.localStorage.setItem(QUALITY_STORAGE_KEY, id);
    } catch {
      // Sem armazenamento: a escolha vale só nesta visita.
    }
  }, []);

  /** Esquece a escolha: volta ao padrão do aparelho. */
  const resetLevel = useCallback(() => {
    setChosen(null);
    try {
      window.localStorage.removeItem(QUALITY_STORAGE_KEY);
    } catch {
      // Sem armazenamento: nada a apagar.
    }
  }, []);

  return { level, setLevel, resetLevel };
}
