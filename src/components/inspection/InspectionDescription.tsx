"use client";

import { useEffect, useId, useRef, useState } from "react";

import { ChevronRightIcon, ChevronUpIcon, CloseIcon } from "@/components/ui/icons";
import type { InspectionItem, InspectionSet } from "@/data/inspection";

export type DescriptionLayout = "docked" | "sheet";

type InspectionDescriptionProps = {
  set: InspectionSet;
  index: number;
  /** "docked": painel lateral (telas largas); "sheet": gaveta acima dos controles. */
  layout: DescriptionLayout;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNext: () => void;
};

type Tab = "intro" | "item";

/** Frase curta de "fala" ("Percebeu a diferença?", "Vamos descobrir!"): aparece em destaque. */
const isCallout = (p: string) => p.length <= 64 && /(\?|!|\.\.\.)$/.test(p);

const paragraphs = (text?: string) =>
  (text ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

/** Atraso da entrada de cada linha (ms): efeito de caixa de diálogo de jogo. */
const STAGGER_MS = 70;

function Lines({ text, start = 0 }: { text?: string; start?: number }) {
  return paragraphs(text).map((p, i) =>
    isCallout(p) ? (
      <p
        key={i}
        className="inspection-line text-[15px] font-semibold leading-snug text-[#FFE89A] sm:text-base xl:text-lg 2xl:text-xl"
        style={{ animationDelay: `${(start + i) * STAGGER_MS}ms` }}
      >
        {p}
      </p>
    ) : (
      <p
        key={i}
        className="inspection-line text-sm leading-relaxed text-stone-200 xl:text-base 2xl:text-[17px]"
        style={{ animationDelay: `${(start + i) * STAGGER_MS}ms` }}
      >
        {p}
      </p>
    ),
  );
}

function ItemBody({ item }: { item: InspectionItem }) {
  const before = paragraphs(item.description).length;
  const stages = item.markers?.filter((m) => m.description) ?? [];
  return (
    <>
      <Lines text={item.description} />
      {stages.length > 0 && (
        <ol className="space-y-2">
          {stages.map((m, i) => (
            <li
              key={m.node}
              className="inspection-line flex gap-3 rounded-lg bg-white/[0.04] p-2.5 ring-1 ring-white/10"
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
      <Lines text={item.closing} start={before + stages.length} />
    </>
  );
}

/**
 * Painel de descrição do modo de inspeção, no estilo das caixas de texto de jogos: moldura
 * escura translúcida com filete âmbar, aba de introdução do conjunto e aba da etapa atual,
 * parágrafos que entram em sequência e um botão "continuar" no fim. Em telas largas fica
 * encaixado à direita; nas estreitas vira uma gaveta acima dos controles, que pode ser
 * recolhida até sobrar só a barra do título.
 */
export default function InspectionDescription({
  set,
  index,
  layout,
  open,
  onOpenChange,
  onNext,
}: InspectionDescriptionProps) {
  const item = set.items[index];
  const hasIntro = !!set.overview;
  const [tab, setTab] = useState<Tab>(hasIntro ? "intro" : "item");
  // Ao trocar de etapa, o painel passa a mostrar o texto dela.
  const [shownIndex, setShownIndex] = useState(index);
  if (shownIndex !== index) {
    setShownIndex(index);
    setTab("item");
  }
  const contentKey = tab === "intro" ? "intro" : item.id;

  // Texto novo com a gaveta recolhida: um ponto pulsante na barra avisa que há o que ler.
  const [seenKey, setSeenKey] = useState<string | null>(open ? contentKey : null);
  if (open && seenKey !== contentKey) setSeenKey(contentKey);
  const unread = !open && seenKey !== contentKey;

  const bodyRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    bodyRef.current?.scrollTo({ top: 0 });
  }, [contentKey]);

  const id = useId();
  const titleId = `${id}-title`;
  const bodyId = `${id}-body`;
  const docked = layout === "docked";
  const last = index === set.items.length - 1;
  const heading = tab === "intro" ? set.title : item.title;
  const stepLabel = `Etapa ${index + 1}`;

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
      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] xl:px-3 xl:text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-amber-200 ${
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
          {tabButton("item", stepLabel)}
        </div>
        <span className="min-w-0 flex-1" />
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
        className={`min-h-0 overflow-y-auto overscroll-contain px-4 pb-3 pt-3 xl:px-6 xl:pb-5 xl:pt-4 [scrollbar-color:rgba(255,213,74,0.4)_transparent] [scrollbar-width:thin] ${
          docked ? "flex-auto" : "max-h-[min(32vh,18rem)]"
        }`}
      >
        <h3 id={titleId} className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200/80 xl:text-[11px]">
          {heading}
        </h3>
        {/* A chave reinicia a entrada em sequência a cada texto novo. */}
        <div key={contentKey} className="mt-2 space-y-3 xl:mt-3 xl:space-y-4">
          {tab === "intro" ? <Lines text={set.overview} /> : <ItemBody item={item} />}
        </div>

        {/* "Continuar", como o indicador ▼ das caixas de diálogo. */}
        {(tab === "intro" || !last) && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => (tab === "intro" ? setTab("item") : onNext())}
              className="group inline-flex items-center gap-1 rounded-full bg-[#FFD54A]/15 py-1.5 pl-3.5 pr-2.5 text-xs font-semibold xl:py-2 xl:pl-4 xl:pr-3 xl:text-sm text-[#FFE89A] ring-1 ring-[#FFD54A]/40 transition-colors hover:bg-[#FFD54A]/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
            >
              {tab === "intro" ? `Ir para a ${stepLabel.toLowerCase()}` : "Próxima etapa"}
              <ChevronRightIcon className="size-4 transition-transform group-hover:translate-x-0.5 motion-safe:animate-pulse motion-reduce:transition-none" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
