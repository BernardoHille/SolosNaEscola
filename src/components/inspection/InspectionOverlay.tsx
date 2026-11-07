"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import InspectionDescription, {
  type DescriptionLayout,
  markNarrationHeard,
  narrationHeard,
} from "@/components/inspection/InspectionDescription";
import InspectionMenuGrid from "@/components/inspection/InspectionMenuGrid";
import MicroscopeScreen, { type MicroscopeHandle } from "@/components/inspection/MicroscopeScreen";
import type { InspectionMenu } from "@/components/inspection/useInspection";
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
import { INSPECTION_DIM_OPACITY, type InspectionItem, type InspectionSet } from "@/data/inspection";
import type { ContainerState, InspectionViewer, MarkerPosition } from "@/lib/inspection/inspectionViewer";
import { nextStepLabel, stepPlural } from "@/lib/inspection/stepLabels";
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
  /** Menu de acervo (grupos ou peças) no lugar do modelo 3D, ou null. */
  menu?: InspectionMenu | null;
  /** Linha acima do título; padrão: o título do conjunto. */
  eyebrow?: string | null;
  /** Volta um nível (menus de acervo); Esc também volta. */
  onBack?: (() => void) | null;
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

/** Distância do painel lateral até a borda direita (px). */
const DOCK_GAP = 16;

/** Quanto uma tecla move a imagem do microscópio (fração da tela). */
const PAN_STEP = 0.12;

/** Altura reservada à legenda no menu com a descrição oculta (px): até três linhas, sem cobrir os cartões. */
const MENU_CAPTION_ROOM = 72;

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
 *
 * Acervos (Material de Origem) abrem antes num menu de cartões: grupos e, dentro do grupo, as
 * peças. O visualizador 3D continua montado por baixo (invisível), para a peça abrir sem espera.
 */
export default function InspectionOverlay({
  set,
  index,
  inputMode,
  onNext,
  onPrevious,
  onGoTo,
  onClose,
  menu = null,
  eyebrow = null,
  onBack = null,
}: InspectionOverlayProps) {
  const item = menu ? undefined : set.items[index];
  const inMenu = !!menu;
  // Item em 2D (telinha do microscópio): no lugar do modelo; o visualizador 3D fica sem uso.
  const microscope = item?.microscope ?? null;
  const microscopeRef = useRef<MicroscopeHandle | null>(null);
  const count = set.items.length;
  // Conjunto de um item só (ex.: Atração do Solo pelo Ímã): sem contador, setas nem faixa.
  const single = count === 1;
  const noun = set.stepNoun ?? "Etapa";
  // Frase narrada agora: legenda discreta quando o painel de descrição está recolhido.
  const [caption, setCaption] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<InspectionViewer | null>(null);
  const [viewerReady, setViewerReady] = useState(false);
  const [shown, setShown] = useState(false);
  const [closing, setClosing] = useState(false);
  const [retry, setRetry] = useState(0);
  const [viewerError, setViewerError] = useState<string | null>(null);
  // Resultado do último carregamento (por peça e tentativa): "carregando" é não ter o da atual.
  const [loaded, setLoaded] = useState<{ key: string; error: string | null } | null>(null);
  const [markers, setMarkers] = useState<MarkerPosition[]>([]);
  const [showMarkers, setShowMarkers] = useState(true);
  // Estágio sendo narrado (o rótulo dele cresce e acende sobre o modelo).
  const [speakingMarker, setSpeakingMarker] = useState<string | null>(null);
  const [container, setContainer] = useState<ContainerState>({ available: false, detached: false });
  // Caixa com tampa ainda fechada (`animation.openOnClick`): a dica vira o botão "Abrir a tampa".
  const [openable, setOpenable] = useState(false);
  // Áudio da narração do painel: relógio da animação do modelo (itens com `animation`).
  const narrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const setNarrationAudio = useCallback((audio: HTMLAudioElement | null) => {
    narrationAudioRef.current = audio;
  }, []);
  const itemRef = useRef(item);
  useEffect(() => {
    itemRef.current = item;
  }, [item]);
  // Abrir a tampa: a narração salta para o fim do trecho da caixa fechada (1º par de `sync`) e toca
  // dali; a tampa abre junto, conduzida por ela.
  const openLid = useCallback(() => {
    const it = itemRef.current;
    const audio = narrationAudioRef.current;
    const url = it?.narration?.audioUrl;
    const at = it?.animation?.openOnClick ? it.animation.sync[0]?.[0] : undefined;
    if (!audio || !url || at === undefined || audio.src !== new URL(url, window.location.href).href) return;
    if (audio.currentTime < at || audio.ended) audio.currentTime = at;
    audio.play().then(() => markNarrationHeard(url), () => {});
  }, []);
  const openLidRef = useRef(openLid);
  // Altura dos controles inferiores: o modelo é enquadrado no espaço acima deles.
  const controlsRef = useRef<HTMLDivElement>(null);
  const [controlsHeight, setControlsHeight] = useState(0);
  // Painel de descrição: lateral (largura reservada à direita) ou gaveta (altura reservada embaixo).
  const docked = useMedia(DOCKED_QUERY);
  const short = useMedia(SHORT_QUERY);
  const layout: DescriptionLayout = docked ? "docked" : "sheet";
  // A descrição começa oculta e só aparece pelo botão (livro ou "Ler") ou pela tecla I: o modelo fica
  // com o espaço todo, e a narração continua, com a legenda.
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const hasDescriptionPanel = !!(set.overview || set.items.some((it) => it.description));
  const [descriptionSize, setDescriptionSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = controlsRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setControlsHeight(el.offsetHeight));
    observer.observe(el);
    return () => observer.disconnect();
    // Menu e inspeção usam elementos de controle diferentes.
  }, [inMenu]);

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
        viewer = new InspectionViewer(canvas, {
          onMarkers: setMarkers,
          onContainer: setContainer,
          onOpenable: setOpenable,
          onOpenRequest: () => openLidRef.current(),
        });
        viewerRef.current = viewer;
        // A animação segue a narração do item: parada antes do play, pausada com ela e, depois do
        // fim (ou com a narração já ouvida numa visita anterior, sem tocar de novo), no último quadro.
        viewer.setNarrationClock(() => {
          const audio = narrationAudioRef.current;
          const url = itemRef.current?.narration?.audioUrl;
          if (!audio || !url || audio.src !== new URL(url, window.location.href).href) return null;
          if (audio.ended) return Infinity;
          // A caixa com tampa volta fechada numa nova visita: abre-se de novo pelo clique.
          const reopen = !!itemRef.current?.animation?.openOnClick;
          if (audio.paused && audio.currentTime === 0) return narrationHeard(url) && !reopen ? Infinity : 0;
          return audio.currentTime;
        });
        // Desenvolvimento: handle no console para testes manuais.
        if (IS_DEV) (window as unknown as Record<string, unknown>).__SOLOS_INSPECTION__ = viewer;
        setViewerReady(true);
      })
      .catch(() => !disposed && setViewerError("Não foi possível iniciar o visualizador 3D neste navegador."));
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
    // Menu: nada a carregar (o último modelo fica guardado, invisível). Item 2D: a telinha carrega a imagem.
    if (!item || item.microscope) return;
    let current = true;
    const key = `${item.id}#${retry}`;
    viewer
      .show(item)
      .then(() => {
        if (!current) return;
        setLoaded({ key, error: null });
        const next = set.items[index + 1];
        if (next && !next.microscope) viewer.preload(next);
      })
      .catch(() => current && setLoaded({ key, error: "Não foi possível carregar este modelo." }));
    return () => {
      current = false;
    };
  }, [viewerReady, item, index, set, retry]);

  const preload = useCallback((it: InspectionItem) => {
    if (it.microscope) new Image().src = it.microscope.image;
    else viewerRef.current?.preload(it);
  }, []);

  // Item 2D: já deixa a imagem da amostra seguinte pronta.
  useEffect(() => {
    const next = microscope ? set.items[index + 1] : null;
    if (next) preload(next);
  }, [microscope, set, index, preload]);

  const current = item && loaded?.key === `${item.id}#${retry}` ? loaded : null;
  // O item 2D não depende do 3D: funciona mesmo num navegador em que o visualizador não abre.
  const error = (microscope ? null : viewerError) ?? current?.error ?? null;
  const loading = !!item && !current && (!!microscope || !viewerError);

  // Foco no diálogo ao abrir; devolvido ao fechar.
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previous?.focus?.();
  }, []);

  // Teclado: Esc volta (menus) ou fecha, setas navegam, R restaura, C tira/devolve a caixa,
  // + e − aproximam; no item 2D, W, A, S e D movem a imagem.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      if (e.key === "Escape") {
        e.preventDefault();
        if (onBack) onBack();
        else requestClose();
        return;
      }
      if (isTyping(e.target) || inMenu) return;
      const viewer = viewerRef.current;
      const zoomable = microscopeRef.current ?? viewer;
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
          zoomable?.reset();
          break;
        case "c":
        case "C":
          viewer?.setDetached();
          break;
        case "i":
        case "I":
          setDescriptionOpen((v) => !v);
          break;
        case "o":
        case "O":
          openLidRef.current();
          break;
        case "+":
        case "=":
          zoomable?.zoomBy(0.8);
          break;
        case "-":
        case "_":
          zoomable?.zoomBy(1.25);
          break;
        case "w":
        case "W":
          microscopeRef.current?.panBy(0, PAN_STEP);
          break;
        case "s":
        case "S":
          microscopeRef.current?.panBy(0, -PAN_STEP);
          break;
        case "a":
        case "A":
          microscopeRef.current?.panBy(PAN_STEP, 0);
          break;
        case "d":
        case "D":
          microscopeRef.current?.panBy(-PAN_STEP, 0);
          break;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onNext, onPrevious, requestClose, onBack, inMenu]);

  const visible = shown && !closing;
  const touch = inputMode === "touch";
  const hasMarkers = !!item?.markers?.length;
  const hasDescription = hasDescriptionPanel;
  const showDock = hasDescription && docked && descriptionOpen;
  const viewportWidth = useViewportWidth();
  const dockSpace = descriptionSize.width + DOCK_GAP;
  const centered = viewportWidth - 2 * dockSpace >= CENTERED_MIN_WIDTH;
  const rightInset = showDock && !centered ? dockSpace : 0;
  const sheetHeight = hasDescription && !docked ? descriptionSize.height : 0;
  // O menu nunca passa por baixo do painel lateral (os cartões ficam todos à vista).
  const menuRight = showDock ? dockSpace : 0;
  const many = count > 5;

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
          visible && !loading && item ? "scale-100 opacity-100" : "scale-[0.97] opacity-0"
        } ${item ? "" : "invisible"}`}
        style={{ bottom: controlsHeight + sheetHeight, right: rightInset }}
        aria-hidden={!item}
      >
        <canvas
          ref={canvasRef}
          className={`block touch-none select-none ${microscope ? "invisible" : ""}`}
          role="img"
          aria-hidden={!!microscope}
          aria-label={
            item && !microscope
              ? `Modelo 3D: ${item.title}. ${touch ? "Arraste para girar e use dois dedos para aproximar." : "Arraste para girar e use a roda do mouse para aproximar."}`
              : undefined
          }
        />
        {item && microscope && (
          <MicroscopeScreen
            key={`${item.id}#${retry}`}
            ref={microscopeRef}
            image={microscope.image}
            width={microscope.width}
            height={microscope.height}
            title={item.title}
            short={short}
            maxWidth={showDock && centered ? viewportWidth - 2 * dockSpace - DOCK_GAP : undefined}
            onLoad={() => setLoaded({ key: `${item.id}#${retry}`, error: null })}
            onError={() => setLoaded({ key: `${item.id}#${retry}`, error: "Não foi possível carregar esta imagem." })}
          />
        )}
      </div>

      {/* Menu do acervo: grupos ou peças, no lugar do modelo. */}
      {menu && (
        <InspectionMenuGrid
          menu={menu}
          style={{
            bottom: controlsHeight + sheetHeight + (hasDescription && !descriptionOpen ? MENU_CAPTION_ROOM : 0),
            right: menuRight,
          }}
          onPreload={preload}
        />
      )}

      {/* Rótulos sobre partes do modelo (ex.: estágios da maquete). */}
      {hasMarkers && showMarkers && !loading && (
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          {markers.map((m) => (
            <span
              key={m.label}
              className={`absolute origin-bottom -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-wide ring-1 transition-[opacity,transform,background-color,color] duration-200 motion-reduce:transition-none sm:text-xs ${
                m.visible ? "opacity-100" : "opacity-0"
              } ${
                speakingMarker === m.label
                  ? "z-10 scale-125 bg-[#FFD54A] text-stone-950 ring-[#FFD54A] shadow-[0_0_16px_rgba(255,213,74,0.6)]"
                  : "bg-black/70 text-[#FFD54A] ring-[#FFD54A]/40"
              }`}
              style={{ left: m.x, top: m.y - 6 }}
            >
              {m.label}
            </span>
          ))}
        </div>
      )}

      {item && loading && !error && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center" role="status">
          <span className="size-8 animate-spin rounded-full border-2 border-white/20 border-t-[#FFD54A] motion-reduce:animate-none" />
          <span className="sr-only">{microscope ? "Carregando imagem…" : "Carregando modelo 3D…"}</span>
        </div>
      )}
      {item && error && (
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

      {/* Cabeçalho: voltar (menus), conjunto, objeto e etapa. */}
      <header
        className="pointer-events-none absolute left-4 top-4 flex items-start gap-3 sm:left-6 sm:top-6"
        style={{ right: Math.max(64, menu ? menuRight : rightInset) }}
      >
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className={`${iconButton} pointer-events-auto shrink-0 bg-black/45`}
            aria-label="Voltar"
            title="Voltar (Esc)"
          >
            <ChevronLeftIcon />
          </button>
        )}
        <div className="min-w-0">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-200/80 sm:text-[11px]">
            {eyebrow ?? set.title}
          </p>
          <h2 id="inspection-title" className={`mt-1 text-lg font-semibold leading-tight text-stone-50 ${short ? "" : "sm:text-2xl"}`}>
            {item ? item.title : set.title}
          </h2>
          {item && !single && (
            <p className="mt-1 font-mono text-xs text-stone-400" aria-label={`${noun} ${index + 1} de ${count}`}>
              <span className="text-stone-100">{pad(index + 1)}</span> / {pad(count)}
            </p>
          )}
        </div>
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
            onSpeakingMarker={setSpeakingMarker}
            onCaption={setCaption}
            onAudio={setNarrationAudio}
          />
        </div>
      )}

      {/* Legenda da narração com o painel de descrição recolhido. */}
      {/* Em tela baixa, a legenda cobriria os botões do aparelho; o texto continua no painel. */}
      {hasDescription && !descriptionOpen && caption && !(microscope && short) && (
        <div
          className="pointer-events-none absolute left-0 flex justify-center px-4"
          style={{ bottom: controlsHeight + sheetHeight + 8, right: menu ? menuRight : rightInset }}
          aria-hidden="true"
        >
          <p
            key={caption}
            className="inspection-caption max-w-xl rounded-lg bg-black/60 px-3 py-1.5 text-center text-[13px] leading-snug text-stone-100 backdrop-blur-sm sm:text-sm"
          >
            {caption}
          </p>
        </div>
      )}

      {/* Controles inferiores. */}
      {menu ? (
        // Menu: só o botão que reabre a descrição (painel lateral); na gaveta, ela mesma basta.
        <div
          ref={controlsRef}
          style={{ right: menuRight }}
          className={`absolute bottom-0 left-0 flex flex-col items-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
            short ? "" : "sm:pb-6"
          } ${hasDescription && docked && !descriptionOpen ? "" : "hidden"}`}
        >
          <div className="flex items-center gap-2 rounded-full bg-black/55 p-1.5 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setDescriptionOpen(true)}
              className={iconButton}
              aria-label="Mostrar descrição"
              title="Descrição (I)"
            >
              <BookIcon />
            </button>
          </div>
        </div>
      ) : (
      <div
        ref={controlsRef}
        style={{ right: rightInset }}
        className={`absolute bottom-0 left-0 flex flex-col items-center px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] ${
          short ? "gap-1.5" : "gap-2 sm:pb-6"
        }`}
      >
        {/* Sempre ocupa o espaço (a altura dos controles não muda entre as etapas). Caixa com tampa
            fechada: no lugar da dica, o botão que abre a tampa (o mesmo que clicar na caixa). */}
        {openable && !microscope && !loading ? (
          <button
            type="button"
            onClick={openLid}
            className="rounded-full bg-[#FFD54A] px-3 py-1 text-center text-xs font-semibold text-stone-950 shadow-[0_0_16px_rgba(255,213,74,0.45)] transition-colors hover:bg-[#FFE89A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFE89A] sm:text-[13px]"
          >
            {touch ? "Abrir a tampa · ou toque na caixa" : "Abrir a tampa · ou clique na caixa"}
          </button>
        ) : (
        <p
          className={`pointer-events-none rounded-full bg-black/55 px-3 py-1 text-center text-xs text-[#FFE89A] ring-1 ring-[#FFD54A]/30 backdrop-blur-sm transition-opacity duration-200 sm:text-[13px] ${
            (microscope || (container.available && !container.detached)) && !loading ? "opacity-100" : "opacity-0"
          } ${microscope && short ? "hidden" : ""}`}
          aria-hidden={!microscope && (!container.available || container.detached)}
        >
          {microscope
            ? touch
              ? "Aproxime com dois dedos e arraste a imagem"
              : "Aproxime com a roda do mouse e arraste a imagem"
            : touch
              ? "Toque na caixa ou na rocha para tirar a rocha da caixa"
              : "Clique na caixa ou na rocha para tirar a rocha da caixa"}
        </p>
        )}
        <div className="flex items-center gap-2 rounded-full bg-black/55 p-1.5 backdrop-blur-sm">
          <button
            type="button"
            onClick={onPrevious}
            disabled={index === 0}
            hidden={single}
            className={iconButton}
            aria-label={`${noun} anterior`}
            title="Anterior (←)"
          >
            <ChevronLeftIcon />
          </button>
          {/* No item 2D, aproximar, afastar e restaurar são os botões do próprio aparelho. */}
          {!microscope && (
            <>
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
            </>
          )}
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
            hidden={single}
            className={iconButton}
            aria-label={nextStepLabel(noun)}
            title="Próximo (→)"
          >
            <ChevronRightIcon />
          </button>
        </div>

        {/* Sequência do conjunto: ir direto a qualquer etapa. */}
        <nav
          aria-label={`${stepPlural(noun)} de ${set.title}`}
          hidden={single}
          className={`w-full ${count > 4 ? "max-w-2xl" : "max-w-md"}`}
        >
          <ol className={`flex justify-center ${many ? "gap-1 sm:gap-2" : "gap-2 sm:gap-3"}`}>
            {set.items.map((it, i) => {
              const active = i === index;
              return (
                <li key={it.id} className="min-w-0 flex-1 sm:flex-none">
                  <button
                    type="button"
                    onClick={() => onGoTo(i)}
                    aria-current={active ? "step" : undefined}
                    aria-label={`${noun} ${i + 1}: ${it.title}`}
                    title={it.title}
                    className={`group flex w-full flex-col items-center gap-1 rounded-xl p-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 ${short ? "sm:w-14" : count > 4 ? "sm:w-[4.5rem]" : "sm:w-24"} ${
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
                      } ${short ? "sr-only" : many ? "max-sm:sr-only" : ""}`}
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
      )}
    </div>
  );
}
