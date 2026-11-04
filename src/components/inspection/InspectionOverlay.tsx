"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import InspectionDescription, { type DescriptionLayout } from "@/components/inspection/InspectionDescription";
import {
  BookIcon,
  BoxIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CloseIcon,
  LayersIcon,
  ResetViewIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "@/components/ui/icons";
import { INSPECTION_DIM_OPACITY, type InspectionSet } from "@/data/inspection";
import type { ContainerState, InspectionViewer, MarkerPosition } from "@/lib/inspection/inspectionViewer";
import { IS_DEV } from "@/lib/viewer/spawnOverride";

type InspectionOverlayProps = {
  set: InspectionSet;
  index: number;
  inputMode: "desktop" | "touch";
  onNext: () => void;
  onPrevious: () => void;
  /** Vai direto a uma etapa (miniaturas). */
  onGoTo: (index: number) => void;
  /** Chamado quando o visitante pede para fechar; o fechamento ocorre após o esmaecimento. */
  onClose: () => void;
};

/** Duração das transições (ms). O CSS usa os mesmos valores. */
const FADE_MS = 260;

const reducedMotion = () => window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Onde fica o painel de descrição: à direita em telas deitadas (computador, tablet ou celular na
 * horizontal), onde sobra largura; nas em pé, numa gaveta acima dos controles.
 */
const DOCKED_QUERY = "(min-width: 640px) and (orientation: landscape), (min-width: 1280px)";

/** Tela baixa (celular deitado): controles compactos, para sobrar altura para o modelo. */
const SHORT_QUERY = "(max-height: 500px)";

const useMedia = (query: string) =>
  useSyncExternalStore(
    (onChange) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );

/** A gaveta começa recolhida em telas pequenas (o modelo fica com o espaço todo). */
const startsOpen = () =>
  window.matchMedia(DOCKED_QUERY).matches || (window.innerWidth >= 640 && window.innerHeight >= 740);

/** Distância do painel lateral até a borda direita (px). */
const DOCK_GAP = 16;

/**
 * Largura livre mínima (px) entre o painel lateral e a sua imagem espelhada à esquerda para manter
 * o modelo e os controles centralizados na tela (eles são o foco). Abaixo disso (notebooks
 * estreitos, celular deitado), o painel reserva o seu espaço e o modelo se desloca para a esquerda.
 */
const CENTERED_MIN_WIDTH = 600;

const subscribeResize = (onChange: () => void) => {
  window.addEventListener("resize", onChange);
  return () => window.removeEventListener("resize", onChange);
};
const useViewportWidth = () => useSyncExternalStore(subscribeResize, () => window.innerWidth, () => 0);

const iconButton =
  "inline-flex size-10 items-center justify-center rounded-full bg-white/10 text-stone-100 transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200";

/**
 * Modo de inspeção (estilo "examinar item"): o museu escurece ao fundo, sem ser recarregado,
 * e o modelo 3D da etapa atual aparece no centro, com iluminação própria, para girar,
 * aproximar e comparar. Setas navegam pela sequência; Esc ou o botão fecha.
 */
export default function InspectionOverlay({
  set,
  index,
  inputMode,
  onNext,
  onPrevious,
  onGoTo,
  onClose,
}: InspectionOverlayProps) {
  const item = set.items[index];
  const count = set.items.length;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<InspectionViewer | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [shown, setShown] = useState(false);
  const [closing, setClosing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [markers, setMarkers] = useState<MarkerPosition[]>([]);
  const [showMarkers, setShowMarkers] = useState(true);
  const [container, setContainer] = useState<ContainerState>({ available: false, detached: false });
  // Altura dos controles inferiores: o modelo é enquadrado no espaço acima deles.
  const controlsRef = useRef<HTMLDivElement>(null);
  const [controlsHeight, setControlsHeight] = useState(0);
  // Painel de descrição: lateral (largura reservada à direita) ou gaveta (altura reservada embaixo).
  const docked = useMedia(DOCKED_QUERY);
  const short = useMedia(SHORT_QUERY);
  const layout: DescriptionLayout = docked ? "docked" : "sheet";
  const [descriptionOpen, setDescriptionOpen] = useState(startsOpen);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const hasDescriptionPanel = !!(set.overview || set.items.some((it) => it.description));
  const [descriptionSize, setDescriptionSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = controlsRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setControlsHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = descriptionRef.current;
    if (!el) {
      setDescriptionSize({ width: 0, height: 0 });
      return;
    }
    const observer = new ResizeObserver(() => setDescriptionSize({ width: el.offsetWidth, height: el.offsetHeight }));
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasDescriptionPanel]);

  // Entrada suave (o primeiro quadro é desenhado transparente).
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, reducedMotion() ? 0 : FADE_MS);
  }, [closing, onClose]);

  // Visualizador: criado uma vez por abertura (o código do motor só é baixado aqui).
  useEffect(() => {
    let disposed = false;
    let viewer: InspectionViewer | null = null;
    import("@/lib/inspection/inspectionViewer")
      .then(({ InspectionViewer }) => {
        const canvas = canvasRef.current;
        if (disposed || !canvas) return;
        viewer = new InspectionViewer(canvas, { onMarkers: setMarkers, onContainer: setContainer });
        viewerRef.current = viewer;
        // Desenvolvimento: handle no console para testes manuais.
        if (IS_DEV) (window as unknown as Record<string, unknown>).__SOLOS_INSPECTION__ = viewer;
        setViewerReady(true);
      })
      .catch(() => !disposed && setError("Não foi possível iniciar o visualizador 3D neste navegador."));
    return () => {
      disposed = true;
      viewer?.destroy();
      if (IS_DEV) delete (window as unknown as Record<string, unknown>).__SOLOS_INSPECTION__;
      viewerRef.current = null;
    };
  }, []);

  // Troca de etapa: substitui só o modelo, sem recriar o visualizador.
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewerReady || !viewer) return;
    let current = true;
    setLoading(true);
    setError(null);
    viewer
      .show(item)
      .then(() => {
        if (!current) return;
        setLoading(false);
        const next = set.items[index + 1];
        if (next) viewer.preload(next);
      })
      .catch(() => current && (setLoading(false), setError("Não foi possível carregar este modelo.")));
    return () => {
      current = false;
    };
  }, [viewerReady, item, index, set, retry]);

  // Foco no diálogo ao abrir; devolvido ao fechar.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  // Teclado: Esc fecha, setas navegam, R restaura, C tira/devolve a caixa, + e − aproximam.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
        return;
      }
      if (isTyping(e.target)) return;
      const viewer = viewerRef.current;
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          onNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          onPrevious();
          break;
        case "r":
        case "R":
          viewer?.reset();
          break;
        case "c":
        case "C":
          viewer?.setDetached();
          break;
        case "i":
        case "I":
          setDescriptionOpen((v) => !v);
          break;
        case "+":
        case "=":
          viewer?.zoomBy(0.8);
          break;
        case "-":
        case "_":
          viewer?.zoomBy(1.25);
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onNext, onPrevious, requestClose]);

  const visible = shown && !closing;
  const touch = inputMode === "touch";
  const hasMarkers = !!item.markers?.length;
  const hasDescription = hasDescriptionPanel;
  const showDock = hasDescription && docked && descriptionOpen;
  const viewportWidth = useViewportWidth();
  const dockSpace = descriptionSize.width + DOCK_GAP;
  const centered = viewportWidth - 2 * dockSpace >= CENTERED_MIN_WIDTH;
  const rightInset = showDock && !centered ? dockSpace : 0;
  const sheetHeight = hasDescription && !docked ? descriptionSize.height : 0;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="inspection-title"
      tabIndex={-1}
      className={`absolute inset-0 z-40 overflow-hidden text-stone-100 outline-none transition-opacity duration-[260ms] ease-out motion-reduce:transition-none ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Museu escurecido ao fundo, com um leve foco de luz atrás do objeto. */}
      <div className="absolute inset-0 bg-black" style={{ opacity: INSPECTION_DIM_OPACITY }} aria-hidden="true" />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 45% 40% at 50% 50%, rgba(255,236,200,0.10), transparent 70%)" }}
        aria-hidden="true"
      />

      {/* Área de manipulação do modelo. */}
      <div
        className={`absolute inset-x-0 top-0 transition-[opacity,transform] duration-[260ms] ease-out motion-reduce:transition-none ${
          visible && !loading ? "scale-100 opacity-100" : "scale-[0.97] opacity-0"
        }`}
        style={{ bottom: controlsHeight + sheetHeight, right: rightInset }}
      >
        <canvas
          ref={canvasRef}
          className="block touch-none select-none"
          role="img"
          aria-label={`Modelo 3D: ${item.title}. ${touch ? "Arraste para girar e use dois dedos para aproximar." : "Arraste para girar e use a roda do mouse para aproximar."}`}
        />
      </div>

      {/* Rótulos sobre partes do modelo (ex.: estágios da maquete). */}
      {hasMarkers && showMarkers && !loading && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {markers.map((m) => (
            <span
              key={m.label}
              className={`absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-[#FFD54A] ring-1 ring-[#FFD54A]/40 transition-opacity duration-200 sm:text-xs ${
                m.visible ? "opacity-100" : "opacity-0"
              }`}
              style={{ left: m.x, top: m.y - 6 }}
            >
              {m.label}
            </span>
          ))}
        </div>
      )}

      {loading && !error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" role="status">
          <span className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-[#FFD54A] motion-reduce:animate-none" />
          <span className="sr-only">Carregando modelo 3D…</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center p-6" role="alert">
          <div className="max-w-xs rounded-2xl bg-stone-950/90 p-5 text-center text-sm">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setRetry((n) => n + 1)}
              className="mt-3 rounded-full bg-white/15 px-4 py-1.5 font-medium hover:bg-white/25"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      )}

      {/* Cabeçalho: conjunto, objeto e etapa. */}
      <header
        className="pointer-events-none absolute left-4 top-4 sm:left-6 sm:top-6"
        style={{ right: Math.max(64, rightInset) }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-200/80 sm:text-[11px]">
          {set.title}
        </p>
        <h2 id="inspection-title" className={`mt-1 text-lg font-semibold leading-tight text-stone-50 ${short ? "" : "sm:text-2xl"}`}>
          {item.title}
        </h2>
        <p className="mt-1 font-mono text-xs text-stone-400" aria-label={`Etapa ${index + 1} de ${count}`}>
          <span className="text-stone-100">{pad(index + 1)}</span> / {pad(count)}
        </p>
      </header>

      <button
        type="button"
        onClick={requestClose}
        className={`${iconButton} absolute right-3 top-3 bg-black/45 sm:right-4 sm:top-4`}
        aria-label="Fechar inspeção"
        title="Fechar (Esc)"
      >
        <CloseIcon />
      </button>

      {/* Descrição: painel lateral ou gaveta acima dos controles. */}
      {/* Fica montado mesmo oculto, para manter a aba escolhida. */}
      {hasDescription && (
        <div
          ref={descriptionRef}
          className={
            docked
              ? `pointer-events-none absolute bottom-4 top-16 w-[clamp(17rem,30vw,24rem)] xl:w-[clamp(24rem,24vw,32rem)] flex-col sm:bottom-6 ${
                  descriptionOpen ? "flex" : "hidden"
                }`
              : "pointer-events-none absolute inset-x-0 mx-auto flex max-w-xl px-3 pb-1"
          }
          style={docked ? { right: DOCK_GAP } : { bottom: controlsHeight }}
        >
          <InspectionDescription
            set={set}
            index={index}
            layout={layout}
            open={descriptionOpen}
            onOpenChange={setDescriptionOpen}
            onNext={onNext}
          />
        </div>
      )}

      {/* Controles inferiores. */}
      <div
        ref={controlsRef}
        style={{ right: rightInset }}
        className={`absolute bottom-0 left-0 flex flex-col items-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
          short ? "gap-1.5" : "gap-2 sm:pb-6"
        }`}
      >
        {/* Sempre ocupa o espaço (a altura dos controles não muda entre as etapas). */}
        <p
          className={`pointer-events-none rounded-full bg-black/55 px-3 py-1 text-center text-xs text-[#FFE89A] ring-1 ring-[#FFD54A]/30 backdrop-blur-sm transition-opacity duration-200 sm:text-[13px] ${
            container.available && !container.detached && !loading ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden={!container.available || container.detached}
        >
          {touch ? "Toque na caixa ou na rocha para tirar a rocha da caixa" : "Clique na caixa ou na rocha para tirar a rocha da caixa"}
        </p>
        <p className={`pointer-events-none text-center text-[11px] text-stone-400 sm:text-xs ${short ? "hidden" : ""}`}>
          {touch
            ? "Arraste para girar · Dois dedos para aproximar e deslocar"
            : "Arraste para girar · Roda do mouse para aproximar · Botão direito para deslocar · Duplo clique ou R para restaurar"}
        </p>
        <div className="flex items-center gap-2 rounded-full bg-black/55 p-1.5 backdrop-blur-sm">
          <button
            type="button"
            onClick={onPrevious}
            disabled={index === 0}
            className={iconButton}
            aria-label="Objeto anterior"
            title="Anterior (←)"
          >
            <ChevronLeftIcon />
          </button>
          <button
            type="button"
            onClick={() => viewerRef.current?.zoomBy(1.25)}
            className={`${iconButton} max-sm:hidden`}
            aria-label="Afastar"
            title="Afastar (−)"
          >
            <ZoomOutIcon />
          </button>
          <button
            type="button"
            onClick={() => viewerRef.current?.reset()}
            className={iconButton}
            aria-label="Restaurar orientação"
            title="Restaurar orientação (R)"
          >
            <ResetViewIcon />
          </button>
          <button
            type="button"
            onClick={() => viewerRef.current?.zoomBy(0.8)}
            className={`${iconButton} max-sm:hidden`}
            aria-label="Aproximar"
            title="Aproximar (+)"
          >
            <ZoomInIcon />
          </button>
          {container.available && (
            <button
              type="button"
              onClick={() => viewerRef.current?.setDetached()}
              aria-pressed={container.detached}
              className={`${iconButton} ${container.detached ? "bg-[#FFD54A]/25 text-[#FFE89A]" : ""}`}
              aria-label={container.detached ? "Pôr de volta na caixa" : "Tirar da caixa"}
              title={container.detached ? "Pôr de volta na caixa (C)" : "Tirar da caixa (C)"}
            >
              <BoxIcon />
            </button>
          )}
          {hasDescription && docked && (
            <button
              type="button"
              onClick={() => setDescriptionOpen((v) => !v)}
              aria-pressed={descriptionOpen}
              className={`${iconButton} ${descriptionOpen ? "bg-[#FFD54A]/25 text-[#FFE89A]" : ""}`}
              aria-label="Mostrar descrição"
              title="Descrição (I)"
            >
              <BookIcon />
            </button>
          )}
          {hasMarkers && (
            <button
              type="button"
              onClick={() => setShowMarkers((v) => !v)}
              aria-pressed={showMarkers}
              className={`${iconButton} ${showMarkers ? "bg-[#FFD54A]/25 text-[#FFE89A]" : ""}`}
              aria-label="Mostrar estágios"
              title="Mostrar estágios"
            >
              <LayersIcon />
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            disabled={index === count - 1}
            className={iconButton}
            aria-label="Próximo objeto"
            title="Próximo (→)"
          >
            <ChevronRightIcon />
          </button>
        </div>

        {/* Sequência do conjunto: ir direto a qualquer etapa. */}
        <nav aria-label={`Etapas de ${set.title}`} className="w-full max-w-md">
          <ol className="flex justify-center gap-2 sm:gap-3">
            {set.items.map((it, i) => {
              const active = i === index;
              return (
                <li key={it.id} className="min-w-0 flex-1 sm:flex-none">
                  <button
                    type="button"
                    onClick={() => onGoTo(i)}
                    aria-current={active ? "step" : undefined}
                    aria-label={`Etapa ${i + 1}: ${it.title}`}
                    title={it.title}
                    className={`group flex w-full flex-col items-center gap-1 rounded-xl p-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 ${short ? "sm:w-14" : "sm:w-24"} ${
                      active ? "bg-[#FFD54A]/15" : "hover:bg-white/10"
                    }`}
                  >
                    <span
                      className={`relative block aspect-square w-full max-w-16 overflow-hidden rounded-lg bg-black/45 ring-1 transition-[box-shadow,opacity] sm:max-w-none ${
                        active ? "ring-2 ring-[#FFD54A]" : "opacity-75 ring-white/15 group-hover:opacity-100"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- miniaturas estáticas pequenas */}
                      <img
                        src={it.thumbnail}
                        alt=""
                        width={96}
                        height={96}
                        draggable={false}
                        className="size-full object-contain"
                      />
                      <span className="absolute left-1 top-1 rounded bg-black/65 px-1 font-mono text-[10px] leading-4 text-stone-100">
                        {i + 1}
                      </span>
                    </span>
                    <span
                      className={`w-full truncate text-center text-[10px] leading-tight sm:text-[11px] ${
                        active ? "text-[#FFE89A]" : "text-stone-300"
                      } ${short ? "sr-only" : ""}`}
                    >
                      {it.shortTitle}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </div>
  );
}
