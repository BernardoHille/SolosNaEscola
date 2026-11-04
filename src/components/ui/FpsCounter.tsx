"use client";

import { useEffect, useState } from "react";
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";

/** Janela da média e intervalo de atualização do número exibido. */
const WINDOW_MS = 1000;
const UPDATE_MS = 500;

/**
 * Contador discreto de quadros por segundo.
 *
 * Conta os quadros que o viewer realmente renderiza (evento `postrender` do motor, disparado
 * só quando há render; `frameend` dispara a cada tick do navegador, mesmo sem desenhar). O viewer
 * renderiza sob demanda: com a câmera parada e nada mudando, não desenha quadros novos. Nesse
 * caso o contador mostra "—" em vez de um número baixo que pareceria lentidão.
 */
export default function FpsCounter({ viewer }: { viewer: ViewerHandle | null }) {
  const [fps, setFps] = useState<number | null>(null);

  useEffect(() => {
    if (!viewer) return;
    const frames: number[] = [];
    const onFrame = () => frames.push(performance.now());
    viewer.app.on("postrender", onFrame);
    const id = window.setInterval(() => {
      const now = performance.now();
      while (frames.length && frames[0] < now - WINDOW_MS) frames.shift();
      const first = frames[0];
      const last = frames[frames.length - 1];
      // Parado (sem quadro recente) ou quadros insuficientes para medir.
      if (last === undefined || now - last >= UPDATE_MS || frames.length < 2) {
        setFps(null);
        return;
      }
      // Pela duração real dos quadros da janela: correto também logo após a cena voltar a mudar.
      setFps(Math.round(((frames.length - 1) * 1000) / (last - first)));
    }, UPDATE_MS);
    return () => {
      window.clearInterval(id);
      viewer.app.off("postrender", onFrame);
    };
  }, [viewer]);

  return (
    <p
      aria-hidden="true"
      title={fps === null ? "Cena parada: o viewer só redesenha quando algo muda" : "Quadros por segundo"}
      className="rounded-md bg-black/35 px-1.5 py-0.5 font-mono text-[10px] leading-tight tabular-nums text-stone-300/75"
    >
      {fps ?? "—"} fps
    </p>
  );
}
