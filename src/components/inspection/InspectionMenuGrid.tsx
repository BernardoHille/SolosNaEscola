"use client";

import type { CSSProperties } from "react";

import type { InspectionMenu, InspectionMenuCard } from "@/components/inspection/useInspection";
import { ChevronRightIcon } from "@/components/ui/icons";
import type { InspectionItem } from "@/data/inspection";

type InspectionMenuGridProps = {
  menu: InspectionMenu;
  /** Limites da área livre (abaixo do cabeçalho, acima dos controles, ao lado do painel). */
  style: CSSProperties;
  /** Pré-carrega o modelo de uma peça quando o cursor passa pelo cartão. */
  onPreload?: (item: InspectionItem) => void;
};

const cardBase =
  "group relative flex w-full overflow-hidden rounded-2xl bg-stone-950/70 text-left ring-1 ring-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.45)] backdrop-blur-sm transition-[box-shadow,background-color,transform] duration-200 hover:bg-stone-900/80 hover:ring-2 hover:ring-[#FFD54A]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD54A] motion-safe:hover:-translate-y-0.5";

/**
 * Mosaico 3×2 de miniaturas: com mais de seis peças, o último ladrilho mostra quantas faltam;
 * com cinco, a primeira ocupa as duas linhas (sem ladrilho vazio).
 */
function Mosaic({ thumbnails }: { thumbnails: string[] }) {
  const max = 6;
  const shown = thumbnails.length > max ? thumbnails.slice(0, max - 1) : thumbnails.slice(0, max);
  const rest = thumbnails.length - shown.length;
  const tall = thumbnails.length === 5;
  return (
    <span className="grid aspect-[3/2] w-full grid-cols-3 grid-rows-2 gap-px overflow-hidden bg-black/40">
      {shown.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element -- miniaturas estáticas pequenas
        <img
          key={src}
          src={src}
          alt=""
          draggable={false}
          className={`size-full min-h-0 object-cover ${tall && i === 0 ? "row-span-2" : ""}`}
        />
      ))}
      {rest > 0 && (
        <span className="flex items-center justify-center bg-stone-900 font-mono text-sm text-stone-300">+{rest}</span>
      )}
    </span>
  );
}

function GroupCard({ card }: { card: InspectionMenuCard }) {
  return (
    <button type="button" onClick={card.onSelect} className={`${cardBase} flex-row sm:flex-col`}>
      <span className="w-36 shrink-0 self-center sm:w-full">
        <Mosaic thumbnails={card.thumbnails} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-4 py-3 sm:py-4">
        <span className="text-sm font-bold uppercase tracking-[0.14em] text-stone-50 sm:text-base xl:text-lg">{card.title}</span>
        <span className="flex items-center justify-between gap-2 text-xs text-stone-400 sm:text-sm">
          {card.subtitle}
          <span className="inline-flex items-center gap-0.5 font-semibold text-[#FFE89A] opacity-80 transition-opacity group-hover:opacity-100">
            Explorar
            <ChevronRightIcon className="size-4 transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none" />
          </span>
        </span>
      </span>
    </button>
  );
}

function ItemCard({ card, index, onPreload }: { card: InspectionMenuCard; index: number; onPreload?: (item: InspectionItem) => void }) {
  return (
    <button
      type="button"
      onClick={card.onSelect}
      onPointerEnter={() => card.item && onPreload?.(card.item)}
      onFocus={() => card.item && onPreload?.(card.item)}
      className={`${cardBase} flex-col`}
    >
      <span className="relative block aspect-square w-full bg-black/40">
        {/* eslint-disable-next-line @next/next/no-img-element -- miniaturas estáticas pequenas */}
        <img src={card.thumbnails[0]} alt="" draggable={false} className="size-full object-cover" />
        <span className="absolute left-1.5 top-1.5 rounded bg-black/65 px-1.5 font-mono text-[11px] leading-5 text-stone-100">
          {index + 1}
        </span>
      </span>
      {/* Duas linhas no celular: nos títulos longos, o fim ("sem oxigênio") é o que distingue os itens. */}
      <span className="line-clamp-2 px-3 py-2 text-center text-xs font-semibold text-stone-100 sm:text-sm">{card.title}</span>
    </button>
  );
}

/**
 * Menu de um acervo no modo de inspeção: cartões dos grupos (com mosaico das peças) ou das peças
 * de um grupo. Ocupa a área do modelo; o painel de descrição continua ao lado com o texto do
 * acervo ou do grupo.
 */
export default function InspectionMenuGrid({ menu, style, onPreload }: InspectionMenuGridProps) {
  const groups = menu.variant === "groups";
  return (
    <div
      className="absolute left-0 top-0 overflow-y-auto overscroll-contain px-4 pb-4 pt-24 sm:px-6 sm:pt-28 [scrollbar-color:rgba(255,213,74,0.4)_transparent] [scrollbar-width:thin]"
      style={style}
    >
      <ul
        className={`mx-auto grid gap-3 sm:gap-4 ${
          groups
            ? "max-w-4xl grid-cols-1 sm:grid-cols-3"
            : "max-w-4xl grid-cols-2 min-[480px]:grid-cols-3 lg:grid-cols-4"
        }`}
      >
        {menu.cards.map((card, i) => (
          <li key={card.id} className="inspection-line flex" style={{ animationDelay: `${i * 50}ms` }}>
            {groups ? <GroupCard card={card} /> : <ItemCard card={card} index={i} onPreload={onPreload} />}
          </li>
        ))}
      </ul>
    </div>
  );
}
