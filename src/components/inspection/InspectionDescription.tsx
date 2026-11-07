"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

import { ChevronRightIcon, ChevronUpIcon, CloseIcon, PauseIcon, PlayIcon } from "@/components/ui/icons";
import type { InspectionItem, InspectionSet } from "@/data/inspection";
import { goToStepLabel, nextStepLabel } from "@/lib/inspection/stepLabels";

export type DescriptionLayout = "docked" | "sheet";

type InspectionDescriptionProps = {
  set: InspectionSet;
  index: number;
  /** "docked": painel lateral (telas largas); "sheet": gaveta acima dos controles. */
  layout: DescriptionLayout;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNext: () => void;
  /** Rótulo do estágio (`markers[].label`) sendo narrado agora, ou null. */
  onSpeakingMarker?: (label: string | null) => void;
  /** Frase sendo narrada agora (legenda com o painel recolhido), ou null. */
  onCaption?: (text: string | null) => void;
  /** Elemento de áudio da narração (relógio da animação do modelo), ou null ao desmontar. */
  onAudio?: (audio: HTMLAudioElement | null) => void;
};

type Tab = "intro" | "item";

/** Frase curta de "fala" ("Percebeu a diferença?", "Vamos descobrir!"): aparece em destaque. */
const isCallout = (p: string) => p.length <= 64 && /(\?|!|\.\.\.)$/.test(p);

const paragraphs = (text?: string) =>
  (text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/** Textos falados, na ordem dos `cues`: parágrafos, estágios ("Rótulo: descrição") e fechamento. */
const spokenBlocks = (set: InspectionSet, item: InspectionItem | undefined, tab: Tab) => {
  if (tab === "intro" || !item) return paragraphs(set.overview);
  const stages = (item.markers ?? []).filter((m) => m.description).map((m) => `${m.label}: ${m.description}`);
  return [...paragraphs(item.description), ...stages, ...paragraphs(item.closing)];
};

/** Frases de um bloco (para a legenda mostrar uma de cada vez). */
const sentences = (text: string) => text.match(/[^.!?…]+(?:[.!?…]+["”»)]*|$)/g)?.map((s) => s.trim()).filter(Boolean) ?? [text];

/**
 * Frase falada no instante `t` dentro de um bloco que começa em `from` e termina em `to`: o tempo
 * do bloco é repartido entre as frases na proporção do número de caracteres (estimativa simples).
 */
const sentenceAt = (text: string, t: number, from: number, to: number) => {
  const parts = sentences(text);
  const total = parts.reduce((n, s) => n + s.length, 0);
  let at = from;
  for (const s of parts) {
    at += ((to - from) * s.length) / total;
    if (t < at) return s;
  }
  return parts[parts.length - 1];
};

/**
 * Narrações que já começaram a tocar nesta visita (até recarregar a página). Ao voltar a um texto
 * já ouvido (ir e voltar nos menus, reabrir a inspeção), ela não recomeça sozinha: fica no ▶.
 */
const HEARD = new Set<string>();

/** A narração deste endereço já começou a tocar nesta visita? */
export const narrationHeard = (url: string) => HEARD.has(url);

/** Conta como ouvida a narração que começou a tocar fora do painel (ex.: ao abrir a tampa da caixa). */
export const markNarrationHeard = (url: string) => void HEARD.add(url);

/** Atraso da entrada de cada linha (ms): efeito de caixa de diálogo de jogo. */
const STAGGER_MS = 70;

/** Bloco que está sendo narrado: fundo e contorno âmbar suaves. */
const blockBase = "-mx-2 rounded-md px-2 py-0.5 ring-1 transition-[background-color,box-shadow] duration-300";
const blockState = (active: boolean) => (active ? "bg-[#FFD54A]/10 ring-[#FFD54A]/30" : "ring-transparent");

type BlockProps = { start?: number; active: number };

function Lines({ text, start = 0, active }: BlockProps & { text?: string }) {
  return paragraphs(text).map((p, i) =>
    isCallout(p) ? (
      <p
        key={i}
        data-block={start + i}
        className={`inspection-line ${blockBase} ${blockState(active === start + i)} text-[15px] font-semibold leading-snug text-[#FFE89A] sm:text-base xl:text-lg 2xl:text-xl`}
        style={{ animationDelay: `${(start + i) * STAGGER_MS}ms` }}
      >
        {p}
      </p>
    ) : (
      <p
        key={i}
        data-block={start + i}
        className={`inspection-line ${blockBase} ${blockState(active === start + i)} text-sm leading-relaxed text-stone-200 xl:text-base 2xl:text-[17px]`}
        style={{ animationDelay: `${(start + i) * STAGGER_MS}ms` }}
      >
        {p}
      </p>
    ),
  );
}

function ItemBody({ item, active }: { item: InspectionItem; active: number }) {
  const before = paragraphs(item.description).length;
  const stages = item.markers?.filter((m) => m.description) ?? [];
  return (
    <>
      <Lines text={item.description} active={active} />
      {stages.length > 0 && (
        <ol className="space-y-2">
          {stages.map((m, i) => (
            <li
              key={m.node}
              data-block={before + i}
              className={`inspection-line flex gap-3 rounded-lg p-2.5 ring-1 transition-[background-color,box-shadow] duration-300 ${
                active === before + i ? "bg-[#FFD54A]/10 ring-[#FFD54A]/40" : "bg-white/[0.04] ring-white/10"
              }`}
              style={{ animationDelay: `${(before + i) * STAGGER_MS}ms` }}
            >
              <span className="h-fit shrink-0 whitespace-nowrap rounded-full bg-black/70 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-[#FFD54A] ring-1 ring-[#FFD54A]/40">
                {m.label}
              </span>
              <span className="text-sm leading-snug text-stone-200 xl:text-base 2xl:text-[17px]">{m.description}</span>
            </li>
          ))}
        </ol>
      )}
      <Lines text={item.closing} start={before + stages.length} active={active} />
    </>
  );
}

/**
 * Painel de descrição do modo de inspeção, no estilo das caixas de texto de jogos: moldura
 * escura translúcida com filete âmbar, aba de introdução do conjunto e aba da etapa atual,
 * parágrafos que entram em sequência e um botão "continuar" no fim. Em telas largas fica
 * encaixado à direita; nas estreitas vira uma gaveta acima dos controles, que pode ser
 * recolhida até sobrar só a barra do título.
 *
 * Narração: começa sozinha a cada texto novo (abertura, troca de etapa, de aba ou de menu); o
 * botão redondo da barra (ou N) pausa e retoma. O bloco falado fica destacado e acompanha a
 * rolagem; com o painel recolhido, a frase falada vira legenda (`onCaption`).
 *
 * Num menu de acervo, o conjunto não tem etapas: só a aba de introdução, com o texto do acervo
 * ou do grupo.
 */
export default function InspectionDescription({
  set,
  index,
  layout,
  open,
  onOpenChange,
  onNext,
  onSpeakingMarker,
  onCaption,
  onAudio,
}: InspectionDescriptionProps) {
  const item = set.items[index] as InspectionItem | undefined;
  const hasIntro = !!set.overview;
  const firstTab = (s: InspectionSet): Tab => (s.overview ? "intro" : "item");
  const [tab, setTab] = useState<Tab>(firstTab(set));
  // Conjunto novo (menu, grupo, peça): volta à primeira aba. Etapa nova: mostra o texto dela.
  const [shown, setShown] = useState({ setId: set.id, index });
  if (shown.setId !== set.id || shown.index !== index) {
    setTab(shown.setId !== set.id ? firstTab(set) : "item");
    setShown({ setId: set.id, index });
  }
  const contentKey = tab === "intro" || !item ? `${set.id}:intro` : item.id;

  // Texto novo com a gaveta recolhida: um ponto pulsante na barra avisa que há o que ler.
  const [seenKey, setSeenKey] = useState<string | null>(open ? contentKey : null);
  if (open && seenKey !== contentKey) setSeenKey(contentKey);
  const unread = !open && seenKey !== contentKey;

  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [contentKey]);

  // Narração: um único elemento de áudio, trocado junto com o texto.
  const narration = tab === "intro" || !item ? set.overviewNarration : item.narration;
  const url = narration?.audioUrl;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onAudioRef = useRef(onAudio);
  useEffect(() => {
    onAudioRef.current = onAudio;
  }, [onAudio]);
  const [playing, setPlaying] = useState(false);
  const [ended, setEnded] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;
    const onTime = () => setTime(audio.currentTime);
    const onPlay = () => {
      setPlaying(true);
      setEnded(false);
    };
    const onPause = () => setPlaying(false);
    // Trocar o `src` cancela o evento "pause" que estava na fila: o estado é conferido de novo
    // quando o novo áudio começa a carregar (sem isso, o botão ficaria em "pausar" à toa).
    const onReload = () => setPlaying(!audio.paused);
    const onMeta = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onEnded = () => {
      setPlaying(false);
      setEnded(true);
    };
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("emptied", onReload);
    audio.addEventListener("loadstart", onReload);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnded);
    onAudioRef.current?.(audio);
    return () => {
      onAudioRef.current?.(null);
      audio.pause();
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("emptied", onReload);
      audio.removeEventListener("loadstart", onReload);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnded);
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    setTime(0);
    setEnded(false);
    setDuration(0);
    if (!url) {
      audio.removeAttribute("src");
      return;
    }
    audio.src = url;
    // Começa sozinha na primeira vez. A inspeção é aberta por um clique ou tecla do visitante, então
    // o navegador permite o som; se ainda assim recusar, o botão de play fica à disposição.
    if (HEARD.has(url)) return;
    audio.play().then(() => HEARD.add(url), () => {});
  }, [url]);

  const toggleNarration = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !url) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    if (audio.ended) audio.currentTime = 0;
    audio.play().then(() => HEARD.add(url), () => {});
  }, [url]);

  // Tecla N: tocar / pausar.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey || e.repeat || (e.key !== "n" && e.key !== "N")) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      toggleNarration();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleNarration]);

  // Bloco falado agora (índice em `cues`); nenhum antes do play e depois do fim.
  let active = -1;
  if (narration?.cues && (playing || (time > 0 && !ended))) {
    for (let i = 0; i < narration.cues.length; i++) if (narration.cues[i] <= time + 0.05) active = i;
  }
  const progress = ended ? 1 : duration > 0 ? Math.min(1, time / duration) : 0;

  // Estágio da maquete sendo narrado: o rótulo correspondente sobre o modelo também acende.
  let speakingMarker: string | null = null;
  if (tab === "item" && item && playing && active >= 0) {
    const stages = item.markers?.filter((m) => m.description) ?? [];
    const k = active - paragraphs(item.description).length;
    speakingMarker = stages[k]?.label ?? null;
  }
  useEffect(() => {
    onSpeakingMarker?.(speakingMarker);
  }, [onSpeakingMarker, speakingMarker]);

  // Legenda: a frase falada agora dentro do bloco ativo.
  let caption: string | null = null;
  if (playing && active >= 0 && narration?.cues) {
    const text = spokenBlocks(set, item, tab)[active];
    const to = narration.cues[active + 1] ?? (duration || time + 1);
    if (text) caption = sentenceAt(text, time, narration.cues[active], to);
  }
  useEffect(() => {
    onCaption?.(caption);
  }, [onCaption, caption]);
  useEffect(() => () => onCaption?.(null), [onCaption]);

  // Mantém o bloco falado à vista, rolando só o painel (também ao abrir no meio da narração).
  useEffect(() => {
    const body = bodyRef.current;
    if (!open || active < 0 || !body) return;
    const el = body.querySelector<HTMLElement>(`[data-block="${active}"]`);
    if (!el) return;
    const top = el.offsetTop;
    const bottom = top + el.offsetHeight;
    if (top >= body.scrollTop + 8 && bottom <= body.scrollTop + body.clientHeight - 8) return;
    const smooth = !window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    body.scrollTo({ top: Math.max(0, top - body.clientHeight / 4), behavior: smooth ? "smooth" : "auto" });
  }, [active, contentKey, open]);

  const id = useId();
  const titleId = `${id}-title`;
  const bodyId = `${id}-body`;
  const docked = layout === "docked";
  const last = index === set.items.length - 1;
  const heading = tab === "intro" || !item ? set.title : item.title;
  const noun = set.stepNoun ?? "Etapa";
  // Conjunto de um item só: a aba leva só o nome ("Experimento").
  const stepLabel = set.items.length === 1 ? noun : `${noun} ${index + 1}`;

  const tabButton = (value: Tab, label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === value}
      aria-controls={bodyId}
      onClick={() => {
        setTab(value);
        if (!open) onOpenChange(true);
      }}
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] xl:px-3 xl:text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-200 ${
        tab === value ? "bg-[#FFD54A] text-stone-950" : "text-stone-300 hover:bg-white/10"
      }`}
    >
      {label}
    </button>
  );

  return (
    <section
      aria-labelledby={titleId}
      className={`pointer-events-auto relative flex min-h-0 flex-col overflow-hidden rounded-2xl border border-white/10 bg-stone-950/80 shadow-[0_12px_40px_rgba(0,0,0,0.55)] backdrop-blur-md ${
        docked ? "max-h-full" : "w-full"
      }`}
    >
      {/* Filete âmbar e cantos de moldura, como nos painéis de jogos. */}
      <span className="pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-r bg-[#FFD54A]/80" aria-hidden="true" />
      <span className="pointer-events-none absolute right-2 top-2 size-2 border-r border-t border-[#FFD54A]/50" aria-hidden="true" />
      <span className="pointer-events-none absolute bottom-2 right-2 size-2 border-b border-r border-[#FFD54A]/50" aria-hidden="true" />

      {/* Barra do título: abas e, na gaveta, o botão de recolher/expandir. */}
      <div className="flex items-center gap-2 border-b border-white/10 py-1.5 pl-4 pr-2 xl:py-2.5 xl:pl-6 xl:pr-3">
        <div role="tablist" aria-label="Textos" className="flex min-w-0 items-center gap-1">
          {hasIntro && tabButton("intro", "Introdução")}
          {item && tabButton("item", stepLabel)}
        </div>
        <span className="min-w-0 flex-1" />
        {url && (
          <button
            type="button"
            onClick={toggleNarration}
            aria-pressed={playing}
            className={`relative inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-200 xl:size-9 ${
              playing ? "text-[#FFE89A]" : "text-stone-300"
            }`}
            aria-label={playing ? "Pausar narração" : "Ouvir narração"}
            title={playing ? "Pausar narração (N)" : "Ouvir narração (N)"}
          >
            {/* Anel de progresso da narração. */}
            <svg viewBox="0 0 36 36" className="absolute inset-0 size-full -rotate-90" aria-hidden="true">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="2" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="#FFD54A"
                strokeWidth="2"
                strokeLinecap="round"
                pathLength={1}
                strokeDasharray="1"
                strokeDashoffset={1 - progress}
                className={`transition-[stroke-dashoffset] duration-300 ease-linear motion-reduce:transition-none ${
                  progress > 0 ? "opacity-100" : "opacity-0"
                }`}
              />
            </svg>
            {playing ? <PauseIcon className="size-3.5 xl:size-4" /> : <PlayIcon className="size-3.5 translate-x-px xl:size-4" />}
          </button>
        )}
        {docked ? (
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex size-8 items-center justify-center rounded-full text-stone-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-200"
            aria-label="Ocultar descrição"
            title="Ocultar descrição (I)"
          >
            <CloseIcon className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onOpenChange(!open)}
            aria-expanded={open}
            aria-controls={bodyId}
            className="inline-flex h-8 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-stone-200 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-200"
            title={open ? "Recolher descrição (I)" : "Ler descrição (I)"}
          >
            {unread && (
              <span className="relative flex size-2" aria-hidden="true">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#FFD54A] opacity-75 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-[#FFD54A]" />
              </span>
            )}
            <span>{open ? "Recolher" : "Ler"}</span>
            <ChevronUpIcon className={`size-4 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>

      <div
        ref={bodyRef}
        id={bodyId}
        role="tabpanel"
        hidden={!open}
        aria-live="polite"
        className={`relative min-h-0 overflow-y-auto overscroll-contain px-4 pb-3 pt-3 xl:px-6 xl:pb-5 xl:pt-4 [scrollbar-color:rgba(255,213,74,0.4)_transparent] [scrollbar-width:thin] ${
          docked ? "flex-auto" : "max-h-[min(32vh,18rem)]"
        }`}
      >
        <h3 id={titleId} className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/80 xl:text-[11px]">
          {heading}
        </h3>
        {/* A chave reinicia a entrada em sequência a cada texto novo. */}
        <div key={contentKey} className="mt-2 space-y-3 xl:mt-3 xl:space-y-4">
          {tab === "intro" || !item ? <Lines text={set.overview} active={active} /> : <ItemBody item={item} active={active} />}
        </div>

        {/* "Continuar", como o indicador ▼ das caixas de diálogo (não há etapas num menu). */}
        {item && (tab === "intro" || !last) && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => (tab === "intro" ? setTab("item") : onNext())}
              className="group inline-flex items-center gap-1 rounded-full bg-[#FFD54A]/15 py-1.5 pl-3.5 pr-2.5 text-xs font-semibold xl:py-2 xl:pl-4 xl:pr-3 xl:text-sm text-[#FFE89A] ring-1 ring-[#FFD54A]/40 transition-colors hover:bg-[#FFD54A]/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
            >
              {tab === "intro" ? goToStepLabel(noun, stepLabel) : nextStepLabel(noun)}
              <ChevronRightIcon className="size-4 transition-transform group-hover:translate-x-0.5 motion-safe:animate-pulse motion-reduce:transition-none" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
