"use client";

import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type PointerEvent, type Ref } from "react";

import { ResetViewIcon, ZoomInIcon, ZoomOutIcon } from "@/components/ui/icons";
import {
  MICROSCOPE_HOME,
  MICROSCOPE_MAX_ZOOM,
  panBy,
  viewTransform,
  zoomAt,
  type MicroscopeView,
} from "@/lib/inspection/microscopeView";

export type MicroscopeHandle = {
  /** Mesma convenção do visualizador 3D: fator da distância (< 1 aproxima). */
  zoomBy: (distanceFactor: number) => void;
  reset: () => void;
  /** Move a imagem, em frações da tela. */
  panBy: (dx: number, dy: number) => void;
};

type MicroscopeScreenProps = {
  ref?: Ref<MicroscopeHandle>;
  image: string;
  width: number;
  height: number;
  title: string;
  /** Tela baixa (celular deitado): sem a haste, e menos folga em volta. */
  short: boolean;
  /** Largura máxima do aparelho (px), quando o painel lateral está aberto. */
  maxWidth?: number;
  onLoad: () => void;
  onError: () => void;
};

/** Moldura em volta da tela, em fração da largura do aparelho. */
const BEZEL = 0.035;
const MAX_WIDTH = 960;
const SIDE_GAP = 24;
/** Alturas fixas (px): faixa dos botões e haste abaixo do aparelho. */
const STRIP_HEIGHT = 56;
const NECK_HEIGHT = 44;
/** Folgas (px): acima, o cabeçalho; abaixo, a legenda da narração. */
const TOP_INSET = 100;
const BOTTOM_INSET = 64;
const SHORT_INSET = 8;
/** Em tela baixa, o aparelho vai para a direita (o título fica livre) e não passa sob o botão de fechar. */
const SHORT_RIGHT = 64;
/** Sensibilidade da roda do mouse. */
const WHEEL_SPEED = 0.002;
const SMOOTH = "transform 160ms ease-out";

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

type Point = { x: number; y: number };

const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

function DeviceButton({ label, disabled, onClick, children }: { label: string; disabled?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="group inline-flex h-10 w-14 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-amber-200 disabled:cursor-not-allowed"
    >
      <span className="flex h-6 w-11 items-center justify-center rounded-full bg-stone-100 text-stone-800 shadow-[inset_0_-1px_2px_rgba(0,0,0,0.25)] transition-[background-color,transform,opacity] group-hover:bg-white group-active:translate-y-px group-disabled:opacity-35 group-disabled:group-hover:bg-stone-100 [&>svg]:size-4">
        {children}
      </span>
    </button>
  );
}

/**
 * Telinha do microscópio digital, em 2D: o aparelho com a imagem ampliada da amostra. Aproxima e afasta
 * pelos botões, pela roda do mouse e com dois dedos (também com dois cliques), e a imagem é arrastada.
 *
 * O enquadramento fica em ref e vai direto ao `transform` da imagem: arrastar não redesenha o componente.
 */
export default function MicroscopeScreen({ ref, image, width, height, title, short, maxWidth, onLoad, onError }: MicroscopeScreenProps) {
  const areaRef = useRef<HTMLDivElement>(null);
  const screenRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const viewRef = useRef<MicroscopeView>(MICROSCOPE_HOME);
  const pointersRef = useRef(new Map<number, Point>());
  const [area, setArea] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);

  const apply = useCallback((view: MicroscopeView, smooth: boolean) => {
    viewRef.current = view;
    const img = imageRef.current;
    if (img) {
      img.style.transition = smooth && !reducedMotion() ? SMOOTH : "none";
      img.style.transform = viewTransform(view);
    }
    const bar = barRef.current;
    if (bar) bar.style.width = `${((view.zoom - 1) / (MICROSCOPE_MAX_ZOOM - 1)) * 100}%`;
    setZoom(view.zoom);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      zoomBy: (distanceFactor) => apply(zoomAt(viewRef.current, 1 / distanceFactor), true),
      reset: () => apply(MICROSCOPE_HOME, true),
      panBy: (dx, dy) => apply(panBy(viewRef.current, dx, dy), true),
    }),
    [apply],
  );

  useLayoutEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const measure = () => setArea({ width: el.offsetWidth, height: el.offsetHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Roda do mouse (o React registra `wheel` como passivo, e aqui a página não pode rolar).
  useEffect(() => {
    const el = screenRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const delta = e.deltaY * (e.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : 1);
      apply(zoomAt(viewRef.current, Math.exp(-delta * WHEEL_SPEED), (e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height), false);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [apply]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setDragging(true);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const pointers = pointersRef.current;
    const previous = pointers.get(e.pointerId);
    if (!previous) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const others = [...pointers].filter(([id]) => id !== e.pointerId).map(([, p]) => p);
    const moved = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, moved);
    if (others.length === 1) {
      // Dois dedos: aproxima em torno do ponto entre eles e acompanha o movimento desse ponto.
      const before = midpoint(previous, others[0]);
      const after = midpoint(moved, others[0]);
      const factor = distance(moved, others[0]) / Math.max(1, distance(previous, others[0]));
      const zoomed = zoomAt(viewRef.current, factor, (before.x - rect.left) / rect.width, (before.y - rect.top) / rect.height);
      apply(panBy(zoomed, (after.x - before.x) / rect.width, (after.y - before.y) / rect.height), false);
    } else if (others.length === 0) {
      apply(panBy(viewRef.current, (moved.x - previous.x) / rect.width, (moved.y - previous.y) / rect.height), false);
    }
  };

  const onPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(e.pointerId);
    if (pointersRef.current.size === 0) setDragging(false);
  };

  const onDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (viewRef.current.zoom >= MICROSCOPE_MAX_ZOOM) {
      apply(MICROSCOPE_HOME, true);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    apply(zoomAt(viewRef.current, 2, (e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height), true);
  };

  // Maior aparelho que cabe na área, com a tela na proporção da imagem.
  const neck = short ? 0 : NECK_HEIGHT;
  const top = short ? SHORT_INSET : TOP_INSET;
  const bottom = short ? SHORT_INSET : BOTTOM_INSET;
  const perWidth = BEZEL + (1 - 2 * BEZEL) * (height / width);
  const bodyWidth = Math.max(
    0,
    Math.min(area.width - SIDE_GAP, maxWidth ?? Infinity, MAX_WIDTH, (area.height - top - bottom - STRIP_HEIGHT - neck) / perWidth),
  );
  const bezel = bodyWidth * BEZEL;
  const cursor = dragging ? "cursor-grabbing" : zoom > 1 ? "cursor-grab" : "cursor-zoom-in";

  return (
    <div
      ref={areaRef}
      className={`absolute inset-0 flex flex-col justify-center ${short ? "items-end" : "items-center"}`}
      style={{ paddingTop: top, paddingBottom: bottom, paddingRight: short ? SHORT_RIGHT : 0 }}
    >
      <div
        className="pointer-events-auto rounded-2xl border-b-2 border-stone-400/70 bg-gradient-to-b from-[#2b2b2e] to-[#141416] shadow-[0_18px_50px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,255,255,0.08)]"
        style={{ width: bodyWidth, padding: `${bezel}px ${bezel}px 0` }}
      >
        <div
          ref={screenRef}
          role="img"
          aria-label={`Imagem ampliada: ${title}`}
          className={`relative touch-none select-none overflow-hidden rounded-md bg-black ring-1 ring-black ${cursor}`}
          style={{ aspectRatio: `${width} / ${height}` }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          onDoubleClick={onDoubleClick}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- o zoom e o arraste são feitos por transform */}
          <img
            ref={imageRef}
            src={image}
            alt=""
            width={width}
            height={height}
            draggable={false}
            onLoad={onLoad}
            onError={onError}
            className="absolute inset-0 size-full origin-center will-change-transform"
          />
          {/* Vidro da tela e informações, como no aparelho. Sem número de aumento: o zoom é só da imagem. */}
          <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.35)]" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-x-2.5 bottom-1.5 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-wider text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9)] sm:text-xs" aria-hidden="true">
            <span className="truncate">{title}</span>
            <span className="flex shrink-0 items-center gap-1.5">
              Zoom
              <span className="block h-1.5 w-12 overflow-hidden rounded-full bg-white/30 shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:w-16">
                <span ref={barRef} className="block h-full w-0 bg-white" />
              </span>
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-1 sm:gap-2" style={{ height: STRIP_HEIGHT }}>
          <DeviceButton label="Afastar (−)" disabled={zoom <= 1} onClick={() => apply(zoomAt(viewRef.current, 0.8), true)}>
            <ZoomOutIcon />
          </DeviceButton>
          <DeviceButton label="Aproximar (+)" disabled={zoom >= MICROSCOPE_MAX_ZOOM} onClick={() => apply(zoomAt(viewRef.current, 1.25), true)}>
            <ZoomInIcon />
          </DeviceButton>
          <DeviceButton label="Restaurar imagem (R)" disabled={zoom <= 1} onClick={() => apply(MICROSCOPE_HOME, true)}>
            <ResetViewIcon />
          </DeviceButton>
          <span className="ml-1 size-1.5 rounded-full bg-sky-400 shadow-[0_0_6px_rgba(56,189,248,0.9)]" aria-hidden="true" />
        </div>
      </div>
      {/* Haste do aparelho: só lembra o microscópio. */}
      {neck > 0 && bodyWidth > 0 && (
        <div className="flex flex-col items-center" style={{ height: neck }} aria-hidden="true">
          <div className="h-3 bg-gradient-to-r from-[#111] via-[#2d2d30] to-[#111]" style={{ width: bodyWidth * 0.2 }} />
          <div
            className="h-5"
            style={{
              width: bodyWidth * 0.14,
              background: "repeating-linear-gradient(90deg, #8d8d90 0 2px, #d8d8da 2px 4px, #6f6f72 4px 5px)",
            }}
          />
          <div className="h-3 rounded-b-md bg-gradient-to-r from-[#111] via-[#2d2d30] to-[#111]" style={{ width: bodyWidth * 0.17 }} />
        </div>
      )}
    </div>
  );
}
