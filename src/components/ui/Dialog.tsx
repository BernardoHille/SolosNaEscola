"use client";

import { useEffect, type ReactNode } from "react";

import BrandLogo from "@/components/brand/BrandLogo";

import { CloseIcon } from "./icons";

type DialogProps = {
  /** Id do título (para `aria-labelledby`). */
  titleId: string;
  /** Rótulo pequeno acima do título. */
  eyebrow?: string;
  title: string;
  onClose: () => void;
  closeLabel?: string;
  /** Faixa clara com a logo no topo do painel. */
  brand?: boolean;
  /** Largura máxima do cartão (classe Tailwind). */
  widthClass?: string;
  children: ReactNode;
};

/**
 * Painel temporário centralizado sobre a exposição: fundo escurecido (clicar nele fecha), botão X e
 * tecla Esc. Abre por cima de tudo, inclusive da tela inicial. Enquanto ele está aberto a visita
 * fica suspensa (ver `Exhibition`): o cursor é devolvido e o teclado não move o visitante.
 *
 * No celular o cartão ocupa a largura e rola por dentro (uma só barra de rolagem).
 */
export default function Dialog({
  titleId,
  eyebrow,
  title,
  onClose,
  closeLabel = "Fechar",
  brand = false,
  widthClass = "max-w-md",
  children,
}: DialogProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="panel-backdrop absolute inset-0 z-50 flex items-end justify-center bg-stone-950/45 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:items-center sm:p-6"
      onClick={onClose}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`panel-card flex max-h-full w-full ${widthClass} flex-col overflow-hidden rounded-3xl border border-white/10 bg-stone-900/95 text-sm text-stone-200 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-md`}
        onClick={(e) => e.stopPropagation()}
      >
        {brand && (
          <div className="flex shrink-0 items-center bg-paper px-5 py-3">
            <BrandLogo className="w-28" />
          </div>
        )}
        <header className="flex shrink-0 items-start justify-between gap-4 px-5 pb-2 pt-4">
          <div>
            {eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-clay/85">{eyebrow}</p>}
            <h2 id={titleId} className="mt-1 text-lg font-semibold tracking-tight text-stone-50">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="-m-1 rounded-full p-1.5 text-stone-400 transition-colors hover:bg-white/10 hover:text-stone-100 focus-visible:outline-2 focus-visible:outline-highlight"
            aria-label={closeLabel}
            title={`${closeLabel} (Esc)`}
          >
            <CloseIcon />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 [scrollbar-color:rgba(255,255,255,0.18)_transparent] [scrollbar-width:thin]">
          {children}
        </div>
      </section>
    </div>
  );
}
