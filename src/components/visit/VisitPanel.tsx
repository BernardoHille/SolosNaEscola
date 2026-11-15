"use client";

import { useEffect, useRef, useState } from "react";

import { CheckIcon, CloseIcon } from "@/components/ui/icons";
import { formatModuleNumber, type ExhibitionModule } from "@/lib/visit/exhibitionModules";
import type { Point } from "@/lib/visit/mapGeometry";
import { progressLabel, type VisitMode } from "@/lib/visit/visitProgress";

import MiniMap, { MARKER_COLORS } from "./MiniMap";
import type { VisitorTracker } from "./useVisitorTracker";

type VisitPanelProps = {
  modules: ExhibitionModule[];
  route: ExhibitionModule[];
  explored: ReadonlySet<string>;
  progress: { count: number; total: number };
  mode: VisitMode;
  guideStep: number;
  targetId: string | null;
  path: Point[] | null;
  tracker: VisitorTracker;
  /** Módulo já escolhido ao abrir (ex.: clique num ponto do minimapa). */
  initialSelectedId: string | null;
  onClose: () => void;
  /** Visita guiada a partir de uma etapa (fecha o painel). */
  onStartGuided: (step: number) => void;
  onEndGuided: () => void;
  /** Orientação até um módulo, fora da visita guiada (fecha o painel). */
  onOrient: (id: string) => void;
  onStopOrientation: () => void;
  onResetProgress: () => void;
};

const chip = "rounded-full px-2 py-0.5 text-[10px] font-medium";
const action =
  "inline-flex items-center justify-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight";
const primary = `${action} bg-[#FFD54A] text-stone-950 hover:bg-[#ffe07a]`;
const secondary = `${action} bg-white/10 text-stone-100 hover:bg-white/20`;

/**
 * Painel "Mapa e visita": progresso, modo de visita (livre ou guiada), mapa ampliado e catálogo
 * dos 27 módulos do roteiro. Escolher um módulo só o localiza no mapa e, se o visitante quiser,
 * orienta até ele: não há teletransporte nem abertura da inspeção à distância.
 */
export default function VisitPanel({
  modules,
  route,
  explored,
  progress,
  mode,
  guideStep,
  targetId,
  path,
  tracker,
  initialSelectedId,
  onClose,
  onStartGuided,
  onEndGuided,
  onOrient,
  onStopOrientation,
  onResetProgress,
}: VisitPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(initialSelectedId ?? targetId);
  const [confirmReset, setConfirmReset] = useState(false);
  const [askResume, setAskResume] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const available = modules.filter((m) => m.available);
  const selected = available.find((m) => m.id === selectedId) ?? null;
  const guided = mode === "guided";
  const current = guided ? route[guideStep] : null;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const locate = (id: string) => {
    setSelectedId(id);
    mapRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  const chooseGuided = () => {
    if (guided) return;
    if (guideStep > 0) setAskResume(true);
    else onStartGuided(0);
  };

  const routeIndex = selected ? route.findIndex((m) => m.id === selected.id) : -1;

  return (
    <div
      className="panel-backdrop absolute inset-0 z-50 flex items-end bg-stone-950/40 sm:items-stretch sm:justify-end sm:bg-stone-950/20 sm:p-3"
      onClick={onClose}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="visit-panel-title"
        className="panel-card flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-stone-900/95 text-sm text-stone-200 shadow-[0_24px_60px_rgba(0,0,0,0.45)] backdrop-blur-md sm:max-h-none sm:w-[23rem] sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 px-5 pb-3 pt-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-clay/85">Mapa e visita</p>
            <h2 id="visit-panel-title" className="mt-1 text-lg font-semibold text-stone-50">
              Explorar exposição
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="-m-1 rounded-full p-1.5 text-stone-400 hover:bg-white/10 hover:text-stone-100 focus-visible:outline-2 focus-visible:outline-highlight"
            aria-label="Fechar mapa e visita"
          >
            <CloseIcon />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
          {/* Progresso */}
          <div>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-xs font-medium text-stone-200">{progressLabel(progress)}</p>
              {progress.count > 0 && !confirmReset && (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  className="text-[11px] text-stone-400 underline-offset-2 hover:text-stone-200 hover:underline"
                >
                  Reiniciar progresso
                </button>
              )}
            </div>
            <div
              className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.count}
              aria-label="Módulos explorados"
            >
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{ background: MARKER_COLORS.explored, width: `${progress.total ? (progress.count / progress.total) * 100 : 0}%` }}
              />
            </div>
            {confirmReset && (
              <div className="mt-2 rounded-xl bg-white/5 p-3 text-xs leading-snug" role="alertdialog" aria-label="Reiniciar progresso">
                <p>Apagar o registro dos módulos explorados neste navegador? A etapa da visita guiada não muda.</p>
                <div className="mt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => setConfirmReset(false)} className={secondary}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onResetProgress();
                      setConfirmReset(false);
                    }}
                    className={primary}
                  >
                    Reiniciar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Modo de visita */}
          <div className="mt-4">
            <div className="grid grid-cols-2 gap-1 rounded-full bg-white/5 p-1" role="radiogroup" aria-label="Modo de visita">
              {(
                [
                  ["free", "Visita livre"],
                  ["guided", "Visita guiada"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={mode === id}
                  onClick={() => (id === "guided" ? chooseGuided() : guided && onEndGuided())}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-highlight ${
                    mode === id ? "bg-paper text-ink" : "text-stone-400 hover:text-stone-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {askResume && !guided && (
              <div className="mt-2 rounded-xl bg-white/5 p-3 text-xs leading-snug">
                <p>
                  Você parou na etapa {formatModuleNumber(guideStep + 1)} de {formatModuleNumber(route.length)} ·{" "}
                  {route[guideStep]?.title}.
                </p>
                <div className="mt-2 flex justify-end gap-2">
                  <button type="button" onClick={() => onStartGuided(0)} className={secondary}>
                    Recomeçar
                  </button>
                  <button type="button" onClick={() => onStartGuided(guideStep)} className={primary}>
                    Continuar
                  </button>
                </div>
              </div>
            )}
            <p className="mt-2 text-xs leading-snug text-stone-400">
              {guided && current ? (
                <>
                  Etapa {formatModuleNumber(guideStep + 1)} de {formatModuleNumber(route.length)}: {current.title}. Você
                  continua andando livremente; o painel indica o caminho até cada módulo.{" "}
                  <button type="button" onClick={onEndGuided} className="text-stone-200 underline underline-offset-2">
                    Encerrar visita guiada
                  </button>
                </>
              ) : (
                "Na visita guiada, os módulos são indicados um a um, na ordem do roteiro. Você caminha até eles."
              )}
            </p>
          </div>

          {/* Mapa */}
          <div ref={mapRef} className="mt-4 scroll-mt-3 rounded-2xl border border-white/5 bg-stone-950/55 p-2">
            <MiniMap
              modules={available}
              explored={explored}
              targetId={targetId}
              selectedId={selectedId}
              path={path}
              tracker={tracker}
              variant="large"
              onSelect={setSelectedId}
            />
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 px-1 text-[10px] text-stone-400">
              <Legend color={MARKER_COLORS.pending} label="não explorado" />
              <Legend color={MARKER_COLORS.explored} label="explorado" />
              <Legend color={MARKER_COLORS.target} label="destino" />
              <span className="ml-auto">entrada embaixo</span>
            </div>
          </div>

          {selected ? (
            <div className="mt-2 rounded-xl bg-white/5 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold leading-snug text-stone-50">
                  <span className="text-stone-400">{formatModuleNumber(selected.number)}</span> {selected.title}
                </p>
                <Status explored={explored.has(selected.id)} />
              </div>
              <p className="mt-1 text-xs leading-snug text-stone-300">{selected.summary}</p>
              <div className="mt-2.5 flex flex-wrap justify-end gap-2">
                {selected.id === targetId ? (
                  !guided && (
                    <button type="button" onClick={onStopOrientation} className={secondary}>
                      Parar orientação
                    </button>
                  )
                ) : guided ? (
                  routeIndex >= 0 && (
                    <button type="button" onClick={() => onStartGuided(routeIndex)} className={primary}>
                      Ir para esta etapa
                    </button>
                  )
                ) : (
                  <button type="button" onClick={() => onOrient(selected.id)} className={primary}>
                    Orientar até aqui
                  </button>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-2 px-1 text-xs text-stone-400">Escolha um ponto no mapa ou um módulo da lista.</p>
          )}

          {/* Catálogo */}
          <h3 className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-clay/85">
            Módulos da exposição · {available.length} de {modules.length} disponíveis
          </h3>
          <ul className="mt-2 space-y-1.5">
            {modules.map((m) => (
              <li
                key={m.id}
                className={`rounded-xl px-3 py-2.5 ${
                  m.available ? (m.id === selectedId ? "bg-white/10 ring-1 ring-[#FFD54A]/50" : "bg-white/5") : "opacity-45"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="mt-px w-5 shrink-0 text-xs font-semibold tabular-nums text-stone-400">
                    {formatModuleNumber(m.number)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-snug text-stone-100">{m.title}</p>
                      {m.available ? (
                        <Status explored={explored.has(m.id)} />
                      ) : (
                        <span className={`${chip} shrink-0 bg-white/5 text-stone-400`}>Ainda não disponível</span>
                      )}
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-snug text-stone-400">{m.summary}</p>
                    {m.available && (
                      <button
                        type="button"
                        onClick={() => locate(m.id)}
                        className="mt-1.5 text-xs font-medium text-highlight/90 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-highlight"
                      >
                        Localizar no mapa
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11px] leading-snug text-stone-500">
            Títulos e descrições do Roteiro da Visita Autoguiada (2026). O progresso fica só neste navegador.
          </p>
        </div>
      </section>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="size-2 rounded-full" style={{ background: color }} aria-hidden="true" />
      {label}
    </span>
  );
}

function Status({ explored }: { explored: boolean }) {
  return explored ? (
    <span className={`${chip} inline-flex shrink-0 items-center gap-0.5 bg-[#8fcf9f]/15 text-[#ade0b8]`}>
      <CheckIcon className="size-3" />
      Explorado
    </span>
  ) : (
    <span className={`${chip} shrink-0 bg-white/5 text-stone-400`}>Não explorado</span>
  );
}
