import { EntranceIcon, FullscreenIcon, HelpIcon } from "./icons";

type VisitControlsProps = {
  onReturnToEntrance: () => void;
  onHelp: () => void;
  fullscreen: { supported: boolean; active: boolean; toggle: () => void };
};

const roundButton =
  "pointer-events-auto inline-flex size-10 items-center justify-center rounded-full bg-black/45 text-stone-100 backdrop-blur-sm transition-colors hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200";

/** Controles mínimos da visita: voltar à entrada, ajuda e tela cheia. */
export default function VisitControls({ onReturnToEntrance, onHelp, fullscreen }: VisitControlsProps) {
  return (
    <>
      <div className="pointer-events-none absolute right-3 top-3 z-10 flex gap-2 sm:right-4 sm:top-4">
        <button type="button" onClick={onHelp} className={roundButton} aria-label="Como navegar" title="Como navegar">
          <HelpIcon />
        </button>
        {fullscreen.supported && (
          <button
            type="button"
            onClick={fullscreen.toggle}
            className={roundButton}
            aria-label={fullscreen.active ? "Sair da tela cheia" : "Tela cheia"}
            title={fullscreen.active ? "Sair da tela cheia" : "Tela cheia"}
          >
            <FullscreenIcon active={fullscreen.active} />
          </button>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-[max(0.75rem,env(safe-area-inset-bottom))] right-3 z-10 sm:right-4">
        <button
          type="button"
          onClick={onReturnToEntrance}
          className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-black/45 py-2 pl-3 pr-4 text-sm font-medium text-stone-100 backdrop-blur-sm transition-colors hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
        >
          <EntranceIcon />
          Voltar à entrada
        </button>
      </div>
    </>
  );
}
