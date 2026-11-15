"use client";

import { useEffect, useRef } from "react";

import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, NavigationArrowIcon } from "@/components/ui/icons";
import { formatModuleNumber, nearestObjectPoint, type ExhibitionModule } from "@/lib/visit/exhibitionModules";
import { relativeBearingDeg, type Point } from "@/lib/visit/mapGeometry";
import { pathLength, steeringPoint } from "@/lib/visit/pathfinding";

import type { Guidance } from "./useGuidance";
import type { VisitorTracker } from "./useVisitorTracker";

type GuidedControls = {
  step: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
  onEnd: () => void;
};

type VisitNavigationPanelProps = {
  target: ExhibitionModule;
  explored: boolean;
  guidance: Guidance;
  tracker: VisitorTracker;
  inputMode: "desktop" | "touch";
  /** Visita guiada; sem isso, é a orientação até um módulo escolhido no mapa. */
  guided: GuidedControls | null;
  onStop: () => void;
};

const button =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-highlight disabled:cursor-default disabled:opacity-35";

/**
 * Painel pequeno de orientação: módulo de destino, seta que acompanha o olhar e a posição do
 * visitante (atualizada direto no DOM a cada quadro) e distância pelo percurso caminhável. Na
 * visita guiada, também a etapa e os botões Anterior/Próximo. Não move a câmera.
 */
export default function VisitNavigationPanel({
  target,
  explored,
  guidance,
  tracker,
  inputMode,
  guided,
  onStop,
}: VisitNavigationPanelProps) {
  const arrowRef = useRef<HTMLSpanElement>(null);
  const distanceRef = useRef<HTMLSpanElement>(null);
  const { path, arrived } = guidance;

  useEffect(() => {
    const stop = target.stop;
    if (!stop) return;
    return tracker.subscribe(({ x, z, yawDeg }) => {
      const pos: Point = [x, z];
      // Chegou: a seta aponta para o objeto. Antes, para o próximo canto do percurso ou, sem
      // percurso, para a parada em linha reta.
      const steer = arrived
        ? (nearestObjectPoint(target, pos) ?? stop)
        : path && path.length > 1
          ? steeringPoint(path)
          : stop;
      const rest = path && path.length > 1 ? pathLength(path.slice(1)) : 0;
      const meters = Math.hypot(steer[0] - x, steer[1] - z) + rest;
      if (arrowRef.current) arrowRef.current.style.transform = `rotate(${relativeBearingDeg(pos, yawDeg, steer).toFixed(1)}deg)`;
      if (distanceRef.current) distanceRef.current.textContent = meters < 1 ? "menos de 1 m" : `≈ ${Math.round(meters)} m`;
    });
  }, [tracker, path, target, arrived]);

  const title = `${formatModuleNumber(target.number)} · ${target.title}`;
  const isLast = guided ? guided.step >= guided.total - 1 : false;
  const suggestNext = guided && explored && !isLast;
  const touch = inputMode === "touch";

  return (
    <section
      aria-label={guided ? "Visita guiada" : "Orientação até o módulo"}
      className={`pointer-events-auto absolute z-10 rounded-2xl border border-white/10 bg-earth/80 px-3 py-2.5 text-stone-100 shadow-xl backdrop-blur-md ${
        touch
          ? // Em pé: embaixo, logo acima do joystick (o alto fica com a engrenagem e o minimapa).
            // Deitado (tela baixa): embaixo, no centro, ao lado do joystick.
            "bottom-[calc(max(1rem,env(safe-area-inset-bottom))+8rem)] left-3 right-3 mx-auto max-w-sm sm:right-auto sm:mx-0 sm:w-[22rem] short:bottom-[max(0.75rem,env(safe-area-inset-bottom))] short:left-1/2 short:-translate-x-1/2"
          : "bottom-[max(1rem,env(safe-area-inset-bottom))] left-1/2 w-[min(22rem,calc(100%-24rem))] min-w-[17rem] -translate-x-1/2"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${
            arrived ? "bg-[#FFD54A] text-stone-950" : "bg-white/10 text-[#FFD54A]"
          }`}
          aria-hidden="true"
        >
          <span ref={arrowRef} className="inline-flex transition-transform duration-150 ease-out">
            <NavigationArrowIcon className="size-4" />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-clay/90">
            {guided ? `Visita guiada · Etapa ${formatModuleNumber(guided.step + 1)} de ${formatModuleNumber(guided.total)}` : "Orientação"}
          </p>
          <p className="truncate text-sm font-semibold leading-snug text-stone-50" title={title}>
            {title}
          </p>
          <p className="text-xs leading-snug text-stone-300" aria-live="polite">
            {arrived ? (
              explored ? (
                "Você chegou ao módulo · já explorado"
              ) : (
                <>Você chegou ao módulo · {touch ? "toque no objeto destacado" : "mire no objeto e tecle E"}</>
              )
            ) : (
              <>
                <span ref={distanceRef} />
                {path ? " até lá" : " em linha reta"}
              </>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={guided ? guided.onEnd : onStop}
          className="-m-1 shrink-0 rounded-full p-1.5 text-stone-400 transition-colors hover:bg-white/10 hover:text-stone-100 focus-visible:outline-2 focus-visible:outline-highlight"
          aria-label={guided ? "Encerrar visita guiada" : "Parar a orientação"}
          title={guided ? "Encerrar visita guiada" : "Parar a orientação"}
        >
          <CloseIcon className="size-4" />
        </button>
      </div>

      {guided && (
        <>
          <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
            <div className="h-full rounded-full bg-[#FFD54A]/70" style={{ width: `${((guided.step + 1) / guided.total) * 100}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <button type="button" onClick={guided.onPrevious} disabled={guided.step === 0} className={`${button} hover:bg-white/10`}>
              <ChevronLeftIcon className="size-3.5" />
              Anterior
            </button>
            {isLast ? (
              <span className="text-xs text-stone-400">Última etapa</span>
            ) : (
              <button
                type="button"
                onClick={guided.onNext}
                className={`${button} ${
                  suggestNext ? "bg-[#FFD54A] text-stone-950 hover:bg-[#ffe07a]" : "hover:bg-white/10"
                }`}
              >
                {suggestNext ? "Continuar para o próximo módulo" : "Próximo"}
                <ChevronRightIcon className="size-3.5" />
              </button>
            )}
          </div>
        </>
      )}
    </section>
  );
}
