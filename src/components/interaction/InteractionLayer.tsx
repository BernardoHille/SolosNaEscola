"use client";

import { useEffect, useRef, useState } from "react";
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";

import type { InteractionVolume } from "@/data/interactions";
import { InteractionManager } from "@/lib/interaction/interactionManager";

type InteractionLayerProps = {
  viewer: ViewerHandle;
  /** Área do viewer (mesmo retângulo do canvas). */
  container: HTMLElement;
  volumes: InteractionVolume[];
  /** Falso com painel, menu ou inspeção abertos: nada é destacado nem aberto. */
  enabled: boolean;
  inputMode: "desktop" | "touch";
  mouseCaptured: boolean;
  /** Calibração (`?debugInteractions=1`): desenha os volumes. */
  debug?: { selectedId: string | null } | null;
  onInspect: (volume: InteractionVolume) => void;
  onManager?: (manager: InteractionManager | null) => void;
};

/** Deslocamento (px) a partir do qual um clique vira arrasto de olhar. */
const CLICK_SLOP_PX = 6;
/** Toque mais curto que isto e com pouco movimento é um toque simples. */
const TAP_MAX_MS = 500;
const TAP_SLOP_PX = 16;

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

const Key = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex min-w-6 items-center justify-center rounded border border-white/30 bg-white/10 px-1.5 py-0.5 font-sans text-[11px] font-semibold text-stone-50">
    {children}
  </kbd>
);

/**
 * Objetos interativos sobre o Gaussian Splatting: destaque amarelo do objeto mirado,
 * indicador "[E] Inspecionar" e abertura da inspeção (tecla E, clique ou toque).
 */
export default function InteractionLayer({
  viewer,
  container,
  volumes,
  enabled,
  inputMode,
  mouseCaptured,
  debug = null,
  onInspect,
  onManager,
}: InteractionLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const managerRef = useRef<InteractionManager | null>(null);
  const [target, setTarget] = useState<InteractionVolume | null>(null);
  const [near, setNear] = useState(false);
  // Último alvo, mantido durante o esmaecimento do indicador.
  const [label, setLabel] = useState("");

  const onInspectRef = useRef(onInspect);
  const enabledRef = useRef(enabled);
  useEffect(() => {
    onInspectRef.current = onInspect;
    enabledRef.current = enabled;
  });

  const aimMode = inputMode === "desktop" && !mouseCaptured ? "pointer" : "center";

  // Gerenciador: um por viewer.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const manager = new InteractionManager(viewer, container, svg, {
      onTargetChange: (v) => {
        setTarget(v);
        if (v) setLabel(v.label);
      },
      onNearChange: setNear,
    });
    managerRef.current = manager;
    onManager?.(manager);
    return () => {
      manager.destroy();
      managerRef.current = null;
      onManager?.(null);
    };
    // `onManager` é estável (setter de estado) — só o viewer e o contêiner recriam.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewer, container]);

  useEffect(() => managerRef.current?.setVolumes(volumes), [volumes]);
  useEffect(() => managerRef.current?.setEnabled(enabled), [enabled]);
  useEffect(() => managerRef.current?.setAimMode(aimMode), [aimMode]);
  const selectedId = debug?.selectedId ?? null;
  const debugOn = !!debug;
  useEffect(() => managerRef.current?.setDebug(debugOn, selectedId), [debugOn, selectedId]);

  // Entradas: tecla E, clique (mouse capturado ou cursor livre) e toque simples.
  useEffect(() => {
    const open = (v: InteractionVolume | null) => {
      if (!v || !enabledRef.current) return false;
      onInspectRef.current(v);
      return true;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "KeyE" || e.repeat || e.ctrlKey || e.altKey || e.metaKey || isTyping(e.target)) return;
      if (open(managerRef.current?.getTarget() ?? null)) e.preventDefault();
    };

    // Cursor sobre a área do viewer (mira pelo cursor no computador).
    const onMouseMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || document.pointerLockElement) return;
      const r = container.getBoundingClientRect();
      const inside =
        e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom &&
        container.contains(e.target as Node);
      managerRef.current?.setPointer(inside ? [e.clientX - r.left, e.clientY - r.top] : null);
    };
    const onMouseOut = (e: MouseEvent) => {
      if (!e.relatedTarget) managerRef.current?.setPointer(null);
    };

    // Clique com o mouse. Capturado: abre o alvo mirado. Cursor livre: o pressionar sobre um
    // objeto destacado é retido; se virar arrasto, é entregue ao viewer (olhar) a partir do
    // ponto original; se for um clique, abre a inspeção e o viewer não recebe nada (não há
    // "andar até o ponto").
    const forwarded = new WeakSet<Event>();
    let pending: { down: PointerEvent; canvas: HTMLCanvasElement; volume: InteractionVolume } | null = null;
    const onPointerDown = (e: PointerEvent) => {
      if (forwarded.has(e) || e.pointerType !== "mouse" || e.button !== 0) return;
      if (!(e.target instanceof HTMLCanvasElement) || !container.contains(e.target)) return;
      const v = enabledRef.current ? (managerRef.current?.getTarget() ?? null) : null;
      if (!v) return;
      e.stopPropagation();
      if (document.pointerLockElement) {
        open(v);
        return;
      }
      pending = { down: e, canvas: e.target, volume: v };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!pending || e.pointerId !== pending.down.pointerId) return;
      const { down, canvas } = pending;
      if (Math.abs(e.clientX - down.clientX) + Math.abs(e.clientY - down.clientY) < CLICK_SLOP_PX) return;
      pending = null;
      const start = new PointerEvent("pointerdown", {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: down.pointerId,
        pointerType: down.pointerType,
        isPrimary: down.isPrimary,
        clientX: down.clientX,
        clientY: down.clientY,
        screenX: down.screenX,
        screenY: down.screenY,
        button: down.button,
        buttons: down.buttons,
      });
      forwarded.add(start);
      canvas.dispatchEvent(start);
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!pending || e.pointerId !== pending.down.pointerId) return;
      const { volume } = pending;
      pending = null;
      e.stopPropagation();
      open(volume);
    };

    // Toque simples sobre um objeto: abre a inspeção (o viewer não recebe toques simples,
    // ver touchTapFilter). Só observa: não interfere no olhar.
    const touches = new Map<number, { x: number; y: number; t: number }>();
    const onTouchDown = (e: PointerEvent) => {
      if (e.pointerType !== "touch" || !(e.target instanceof HTMLCanvasElement) || !container.contains(e.target)) return;
      touches.set(e.pointerId, { x: e.clientX, y: e.clientY, t: performance.now() });
    };
    const onTouchUp = (e: PointerEvent) => {
      const start = touches.get(e.pointerId);
      if (!start) return;
      touches.delete(e.pointerId);
      if (e.type !== "pointerup" || touches.size > 0) return;
      if (performance.now() - start.t > TAP_MAX_MS) return;
      if (Math.abs(e.clientX - start.x) + Math.abs(e.clientY - start.y) > TAP_SLOP_PX) return;
      const r = container.getBoundingClientRect();
      open(managerRef.current?.pick(e.clientX - r.left, e.clientY - r.top) ?? null);
    };

    const capture = { capture: true } as const;
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointermove", onMouseMove, { passive: true });
    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("pointerdown", onPointerDown, capture);
    window.addEventListener("pointermove", onPointerMove, capture);
    window.addEventListener("pointerup", onPointerUp, capture);
    window.addEventListener("pointerdown", onTouchDown, capture);
    window.addEventListener("pointerup", onTouchUp, capture);
    window.addEventListener("pointercancel", onTouchUp, capture);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointermove", onMouseMove);
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("pointerdown", onPointerDown, capture);
      window.removeEventListener("pointermove", onPointerMove, capture);
      window.removeEventListener("pointerup", onPointerUp, capture);
      window.removeEventListener("pointerdown", onTouchDown, capture);
      window.removeEventListener("pointerup", onTouchUp, capture);
      window.removeEventListener("pointercancel", onTouchUp, capture);
    };
  }, [container]);

  const active = enabled && !!target;
  const touch = inputMode === "touch";
  const showReticle = enabled && near && aimMode === "center";

  return (
    <>
      <svg
        ref={svgRef}
        className="pointer-events-none absolute inset-0 z-[5] size-full overflow-visible"
        aria-hidden="true"
      />

      {showReticle && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute left-1/2 top-1/2 z-[6] size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border transition-colors duration-200 ${
            active ? "border-[#FFD54A] bg-[#FFD54A]/70" : "border-white/70 bg-white/20"
          }`}
        />
      )}

      <div
        className={`absolute left-1/2 top-[calc(50%+2.75rem)] z-[6] -translate-x-1/2 transition-all duration-200 ease-out motion-reduce:transition-none ${
          active ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-1 opacity-0"
        }`}
        aria-hidden={!active}
        inert={!active}
      >
        {touch ? (
          <button
            type="button"
            tabIndex={active ? 0 : -1}
            onClick={() => target && enabled && onInspect(target)}
            className={`${active ? "pointer-events-auto" : ""} flex items-center gap-2 rounded-full bg-black/60 py-2 pl-3 pr-4 text-sm font-medium text-stone-50 ring-1 ring-[#FFD54A]/60 backdrop-blur-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200`}
          >
            <span className="size-2 rounded-full bg-[#FFD54A]" aria-hidden="true" />
            Inspecionar
            <span className="sr-only">{label}</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 whitespace-nowrap rounded-full bg-black/55 py-1.5 pl-2 pr-3 text-[13px] text-stone-100 backdrop-blur-sm">
            <Key>E</Key>
            <span className="font-medium">Inspecionar</span>
            <span className="text-stone-300/80">· {label}</span>
          </div>
        )}
      </div>
      <p className="sr-only" aria-live="polite">
        {active ? `${label}: pode ser inspecionado. ${touch ? "Toque em Inspecionar." : "Pressione E."}` : ""}
      </p>
    </>
  );
}
