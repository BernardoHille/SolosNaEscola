import type { RenderQualityId } from "@/data/quality";

import { EntranceIcon, FullscreenIcon, HelpIcon, MapIcon } from "./icons";
import QualityMenu from "./QualityMenu";

type VisitControlsProps = {
  onReturnToEntrance: () => void;
  /** Abre e fecha o painel "Mapa e visita" (minimapa ampliado, catálogo, progresso e modo). */
  onMap: () => void;
  mapOpen: boolean;
  onHelp: () => void;
  fullscreen: { supported: boolean; active: boolean; toggle: () => void };
  quality: {
    level: RenderQualityId;
    onChange: (id: RenderQualityId) => void;
    open: boolean;
    onOpenChange: (open: boolean) => void;
  };
};

const roundButton =
  "pointer-events-auto inline-flex size-9 items-center justify-center rounded-full bg-black/45 text-stone-100 backdrop-blur-sm transition-colors hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200 sm:size-10";

/** Controles mínimos da visita: mapa e visita, ajuda, qualidade, tela cheia e voltar à entrada. */
export default function VisitControls({ onReturnToEntrance, onMap, mapOpen, onHelp, fullscreen, quality }: VisitControlsProps) {
  return (
    <>
      <div className="pointer-events-none absolute right-3 top-3 z-20 flex gap-1.5 sm:right-4 sm:top-4 sm:gap-2">
        <button
          type="button"
          onClick={onMap}
          className={`${roundButton} ${mapOpen ? "bg-black/70 text-[#FFD54A]" : ""}`}
          aria-label="Mapa e visita"
          title="Mapa e visita (M)"
          aria-expanded={mapOpen}
        >
          <MapIcon />
        </button>
        <button type="button" onClick={onHelp} className={roundButton} aria-label="Como navegar" title="Como navegar">
          <HelpIcon />
        </button>
        <QualityMenu {...quality} buttonClassName={roundButton} />
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
