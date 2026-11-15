"use client";

import Dialog from "@/components/ui/Dialog";
import { CheckIcon } from "@/components/ui/icons";
import { formatModuleNumber, type ExhibitionModule } from "@/lib/visit/exhibitionModules";

type GuidedRoutePanelProps = {
  /** Etapas da visita guiada, na ordem do roteiro. */
  route: ExhibitionModule[];
  explored: ReadonlySet<string>;
  /** Etapa de onde a visita guiada começa (ou continua). */
  step: number;
  onChooseStep: (step: number) => void;
  onClose: () => void;
};

/**
 * Lista dos locais da visita guiada, aberta ao escolher "Visita guiada" na tela inicial: mostra a
 * ordem das etapas, o que já foi explorado e de onde a visita começa. Tocar numa etapa a escolhe
 * como ponto de partida; o visitante pode fechar a lista quando quiser.
 */
export default function GuidedRoutePanel({ route, explored, step, onChooseStep, onClose }: GuidedRoutePanelProps) {
  const done = route.filter((m) => explored.has(m.id)).length;

  return (
    <Dialog titleId="route-title" eyebrow="Visita guiada" title="Locais da visita" onClose={onClose} closeLabel="Fechar lista">
      <p className="leading-relaxed text-stone-300">
        Os módulos são indicados um a um, nesta ordem, enquanto você caminha. Toque numa etapa para começar por ela.
      </p>
      <p className="mt-1 text-xs text-stone-400">
        {done} de {route.length} já explorados
      </p>

      <ol className="mt-3 space-y-1">
        {route.map((m, i) => {
          const current = i === step;
          const isExplored = explored.has(m.id);
          return (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => onChooseStep(i)}
                aria-current={current ? "step" : undefined}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-highlight ${
                  current ? "bg-highlight/12 ring-1 ring-highlight/60" : "hover:bg-white/6"
                }`}
              >
                <span
                  className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold tabular-nums ${
                    current ? "bg-highlight text-stone-950" : "bg-white/8 text-stone-300"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-stone-100">{m.title}</span>
                  <span className="block text-[11px] text-stone-400">Módulo {formatModuleNumber(m.number)}</span>
                </span>
                {current ? (
                  <span className="shrink-0 text-[11px] font-semibold text-highlight">{i === 0 ? "Início" : "Começa aqui"}</span>
                ) : (
                  isExplored && (
                    <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] text-[#ade0b8]">
                      <CheckIcon className="size-3" />
                      Explorado
                    </span>
                  )
                )}
              </button>
            </li>
          );
        })}
      </ol>

      <div className="sticky -bottom-5 -mx-5 -mb-5 mt-3 border-t border-white/10 bg-stone-900/95 px-5 py-3">
        <button
          type="button"
          onClick={onClose}
          className="w-full rounded-full bg-paper py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight"
        >
          Pronto
        </button>
      </div>
    </Dialog>
  );
}
