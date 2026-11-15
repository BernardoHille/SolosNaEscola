"use client";

import BrandLogo from "@/components/brand/BrandLogo";
import { GearIcon, HelpIcon, InfoIcon, PlayIcon } from "@/components/ui/icons";
import type { VisitMode } from "@/lib/visit/visitProgress";
import type { LoadFailure, LoadingStep } from "@/lib/viewer/loadMessages";

type StartScreenProps = {
  /** Visível (ao abrir o site e ao voltar ao menu). Escondida, sai com um esmaecimento curto. */
  visible: boolean;
  step: LoadingStep;
  /** Falha no carregamento (mostrada no lugar do botão de início). */
  failure: LoadFailure | null;
  failureDetail?: string;
  /** A cena já está pronta atrás da tela: o véu fica translúcido e a exposição aparece ao fundo. */
  sceneVisible: boolean;
  /** Modo da visita escolhido antes de entrar. */
  mode: VisitMode;
  onModeChange: (mode: VisitMode) => void;
  /** Etapa de onde a visita guiada começa (1-based) e total de etapas. */
  guidedStep: { step: number; total: number };
  /** Reabre a lista de locais da visita guiada. */
  onOpenRoute: () => void;
  onStart: () => void;
  onRetry: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  onOpenAbout: () => void;
};

const secondary =
  "inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-medium text-ink/80 transition-colors hover:bg-ink/8 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

/**
 * Tela inicial: logo, apresentação, "Iniciar visita" e o preparo da exposição.
 *
 * O viewer é criado e o SOG baixado por trás desta tela, desde a abertura do site: o visitante não
 * precisa clicar para começar o download. O botão só é liberado com a visita realmente pronta.
 * Enquanto ela aparece a visita fica suspensa (sem movimento, captura do mouse, objetos, joystick ou
 * mapa). Antes da cena ficar pronta o fundo é um degradê; depois a exposição aparece por trás de um
 * véu. Como o viewer só redesenha quando algo muda, a cena parada ao fundo não gasta quadros.
 */
export default function StartScreen({
  visible,
  step,
  failure,
  failureDetail,
  sceneVisible,
  mode,
  onModeChange,
  guidedStep,
  onOpenRoute,
  onStart,
  onRetry,
  onOpenSettings,
  onOpenHelp,
  onOpenAbout,
}: StartScreenProps) {
  const showBar = !failure && step.progress !== null && !step.ready;

  return (
    <div
      className={`absolute inset-0 z-40 transition-[opacity,visibility] duration-500 ease-out motion-reduce:transition-none ${
        visible ? "visible opacity-100" : "pointer-events-none invisible opacity-0"
      }`}
      aria-hidden={!visible}
    >
      {/* Fundo: degradê de terra com os círculos da logo enquanto a cena carrega. */}
      <div
        className={`absolute inset-0 transition-opacity duration-1000 ease-out ${sceneVisible && !failure ? "opacity-0" : "opacity-100"}`}
        style={{
          background:
            "radial-gradient(42rem 30rem at 18% 22%, rgba(253,84,56,0.16), transparent 70%), radial-gradient(38rem 28rem at 82% 30%, rgba(255,186,95,0.15), transparent 70%), radial-gradient(46rem 32rem at 50% 100%, rgba(224,211,194,0.10), transparent 70%), linear-gradient(180deg, #241f1b 0%, #171411 100%)",
        }}
        aria-hidden="true"
      />
      {/* Véu sobre a cena: mantém o texto legível sem esconder a exposição. */}
      <div
        className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_45%,rgba(23,20,17,0.35),rgba(23,20,17,0.72))] sm:backdrop-blur-[3px]"
        aria-hidden="true"
      />

      <div className="relative flex h-full flex-col overflow-y-auto px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="flex flex-1 items-center justify-center py-4 short:py-1">
          <section
            role="dialog"
            aria-labelledby="start-title"
            className="w-full max-w-[29rem] rounded-[1.75rem] bg-paper/95 px-6 pb-6 pt-7 text-center text-ink shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:px-9 sm:pb-8 sm:pt-9 short:max-w-[34rem] short:rounded-3xl short:pb-4 short:pt-4"
          >
            <h1 id="start-title" className="m-0">
              <BrandLogo preload className="mx-auto w-[min(100%,17rem)] sm:w-[19rem] short:w-32" />
            </h1>
            <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink/60 sm:text-[11px] sm:tracking-[0.24em] short:mt-2">
              Exposição Didática de Solos · UFPR
            </p>
            <p className="mx-auto mt-3 max-w-[36ch] text-[15px] leading-relaxed text-ink/80 short:mt-1.5 short:max-w-[50ch] short:text-[13px] short:leading-snug">
              Caminhe pela Exposição Didática de Solos da UFPR em um ambiente tridimensional, conheça os experimentos e
              examine de perto os objetos expostos.
            </p>

            {!failure && (
              <div className="mt-5 short:mt-3">
                <div
                  role="radiogroup"
                  aria-label="Modo de visita"
                  className="mx-auto grid max-w-[20rem] grid-cols-2 gap-1 rounded-full bg-ink/[0.07] p-1"
                >
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
                      onClick={() => onModeChange(id)}
                      className={`rounded-full px-3 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink short:py-1.5 ${
                        mode === id ? "bg-ink text-paper shadow-sm" : "text-ink/60 hover:text-ink"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <p className="mt-2 min-h-[1.25rem] text-xs text-ink/60">
                  {mode === "guided" ? (
                    <>
                      Começa na etapa {guidedStep.step} de {guidedStep.total} ·{" "}
                      <button
                        type="button"
                        onClick={onOpenRoute}
                        className="font-semibold text-ink underline underline-offset-2 hover:text-black focus-visible:outline-2 focus-visible:outline-ink"
                      >
                        ver locais
                      </button>
                    </>
                  ) : (
                    "Caminhe livremente e escolha o que visitar."
                  )}
                </p>
              </div>
            )}

            {failure ? (
              <div role="alert" className="mt-6 rounded-2xl bg-ember/10 px-4 py-4 text-left">
                <p className="text-sm font-semibold text-ink">{failure.title}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-ink/75">{failure.message}</p>
                {failureDetail && <p className="mt-2 break-words font-mono text-[11px] text-ink/45">{failureDetail}</p>}
                {failure.canRetry && (
                  <button
                    type="button"
                    onClick={onRetry}
                    className="mt-3 inline-flex items-center justify-center rounded-full bg-ink px-5 py-2 text-sm font-semibold text-paper transition-colors hover:bg-black focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    Tentar novamente
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onStart}
                disabled={!step.ready}
                autoFocus
                className="group mt-4 short:mt-2 short:py-2.5 inline-flex w-full items-center justify-center gap-3 rounded-full bg-ink py-3.5 pl-5 pr-6 text-[15px] font-semibold uppercase tracking-[0.14em] text-paper shadow-[0_10px_24px_rgba(50,51,50,0.28)] transition-[background-color,transform,opacity] hover:bg-black active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ink disabled:cursor-progress disabled:opacity-45 disabled:shadow-none disabled:active:scale-100 sm:w-auto sm:min-w-[16rem]"
              >
                <span
                  className={`inline-flex size-7 items-center justify-center rounded-full transition-colors ${
                    step.ready ? "bg-highlight text-ink" : "bg-paper/15 text-paper"
                  }`}
                >
                  <PlayIcon className="size-3.5 translate-x-px" />
                </span>
                {step.ready ? "Iniciar visita" : "Preparando…"}
              </button>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-1 gap-y-1 short:mt-1.5">
              <button type="button" onClick={onOpenSettings} className={secondary}>
                <GearIcon className="size-4" />
                Configurações
              </button>
              <button type="button" onClick={onOpenHelp} className={secondary}>
                <HelpIcon className="size-4" />
                Como navegar
              </button>
              <button type="button" onClick={onOpenAbout} className={secondary}>
                <InfoIcon className="size-4" />
                Sobre a exposição
              </button>
            </div>
          </section>
        </div>

        {/* Preparo da reconstrução: discreto, no rodapé. */}
        {!failure && (
          <div className="mx-auto w-full max-w-[22rem] pb-1 text-center" role="status" aria-live="polite">
            <div
              className={`h-[3px] overflow-hidden rounded-full bg-white/15 transition-opacity duration-500 ${step.ready ? "opacity-0" : "opacity-100"}`}
              role="progressbar"
              aria-label="Preparo da exposição 3D"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={showBar ? (step.progress ?? undefined) : undefined}
            >
              {showBar ? (
                <div
                  className={`h-full rounded-full bg-highlight transition-[width] duration-200 ease-out ${step.progress === 100 ? "animate-pulse" : ""}`}
                  style={{ width: `${step.progress}%` }}
                />
              ) : (
                !step.ready && (
                  <div className="h-full w-1/3 animate-[indeterminate_1.4s_ease-in-out_infinite] rounded-full bg-highlight/60" />
                )
              )}
            </div>
            <p className="mt-2 text-xs text-stone-200/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]">
              {step.label}
              {step.detail && <span className="tabular-nums text-stone-300/75"> · {step.detail}</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
