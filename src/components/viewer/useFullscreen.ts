"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

import {
  exitFullscreen,
  FULLSCREEN_EVENTS,
  fullscreenElement,
  fullscreenSupported,
  requestFullscreen,
} from "@/lib/viewer/fullscreen";

/** Tela cheia do conjunto (viewer e interface), não só do canvas. */
export function useFullscreen(target: RefObject<HTMLElement | null>) {
  const [supported, setSupported] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const sync = () => {
      setSupported(fullscreenSupported());
      setActive(!!target.current && fullscreenElement() === target.current);
    };
    const id = window.setTimeout(sync, 0);
    FULLSCREEN_EVENTS.forEach((type) => document.addEventListener(type, sync));
    return () => {
      window.clearTimeout(id);
      FULLSCREEN_EVENTS.forEach((type) => document.removeEventListener(type, sync));
    };
  }, [target]);

  /** Pede tela cheia; chamar direto no gesto do visitante. */
  const enter = useCallback(() => requestFullscreen(target.current), [target]);
  const toggle = useCallback(() => {
    if (fullscreenElement()) exitFullscreen();
    else requestFullscreen(target.current);
  }, [target]);

  return { supported, active, enter, toggle };
}
