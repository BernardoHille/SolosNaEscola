"use client";

import { useEffect, useState } from "react";

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/**
 * Liga e desliga um estado por uma tecla (`code`, ex.: "KeyP"), começando sempre desligado.
 * Ignora a tecla com Ctrl, Alt ou Meta, a repetição de tecla segurada e a digitação em campos.
 * Só escuta enquanto `active`.
 */
export function useKeyToggle(code: string, active: boolean) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!active) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== code || e.repeat || e.ctrlKey || e.altKey || e.metaKey || isTyping(e.target)) return;
      setOn((value) => !value);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [code, active]);

  return on;
}
