"use client";

import { useEffect, useId, useRef } from "react";

import { RENDER_QUALITIES, findRenderQuality, type RenderQualityId } from "@/data/quality";

import { CheckIcon, QualityIcon } from "./icons";

type QualityMenuProps = {
  level: RenderQualityId;
  onChange: (id: RenderQualityId) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buttonClassName: string;
};

/** Botão redondo que abre a lista dos modos de qualidade. */
export default function QualityMenu({ level, onChange, open, onOpenChange, buttonClassName }: QualityMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const current = findRenderQuality(level);
  const label = `Qualidade: ${current?.label ?? ""}`;

  // Fecha ao tocar/clicar fora ou com Esc.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={rootRef} className="pointer-events-auto relative">
      <button
        type="button"
        onClick={() => onOpenChange(!open)}
        className={buttonClassName}
        aria-label={label}
        title={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
      >
        <QualityIcon />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          aria-label="Qualidade"
          className="absolute right-0 top-full mt-2 w-44 rounded-2xl bg-black/75 p-1.5 text-sm text-stone-100 shadow-xl backdrop-blur-md"
        >
          <p className="px-3 pb-1 pt-1.5 text-xs font-medium uppercase tracking-wide text-stone-400">Qualidade</p>
          {RENDER_QUALITIES.map((quality) => {
            const selected = quality.id === level;
            return (
              <button
                key={quality.id}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => {
                  onChange(quality.id);
                  onOpenChange(false);
                }}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-amber-200 ${
                  selected ? "font-semibold text-amber-100" : ""
                }`}
              >
                {quality.label}
                {selected && <CheckIcon className="size-4" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
