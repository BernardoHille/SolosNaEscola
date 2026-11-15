"use client";

import { ExpandIcon, MapIcon, MinimizeIcon } from "@/components/ui/icons";
import type { ExhibitionModule } from "@/lib/visit/exhibitionModules";
import type { Point } from "@/lib/visit/mapGeometry";

import MiniMap from "./MiniMap";
import type { VisitorTracker } from "./useVisitorTracker";

type MiniMapDockProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Abre o painel "Mapa e visita" (com o módulo escolhido, se houver). */
  onExpand: (moduleId?: string) => void;
  modules: ExhibitionModule[];
  explored: ReadonlySet<string>;
  targetId: string | null;
  path: Point[] | null;
  tracker: VisitorTracker;
  touch: boolean;
};

const small =
  "inline-flex size-6 items-center justify-center rounded-full text-stone-300 transition-colors hover:bg-white/10 hover:text-highlight focus-visible:outline-2 focus-visible:outline-highlight";

/**
 * Minimapa compacto, abaixo dos controles. Recolhido, vira um botão pequeno com o ícone do mapa.
 * Passar o mouse num ponto mostra o nome do módulo; clicar abre o painel com ele escolhido.
 */
export default function MiniMapDock({
  open,
  onOpenChange,
  onExpand,
  modules,
  explored,
  targetId,
  path,
  tracker,
  touch,
}: MiniMapDockProps) {
  // No canto superior direito (a engrenagem fica no esquerdo), no computador e no toque; longe do
  // joystick e do painel de orientação, que no toque ficam embaixo.
  const position =
    "pointer-events-auto absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-10 sm:right-4 sm:top-4";

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className={`${position} inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-earth/65 text-stone-100 shadow-lg backdrop-blur-sm transition-colors hover:bg-earth/85 hover:text-highlight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight`}
        aria-label="Mostrar minimapa"
        title="Mostrar minimapa"
      >
        <MapIcon className="size-[18px]" />
      </button>
    );
  }

  return (
    <div className={`${position} ${touch ? "w-36" : "w-44"} rounded-2xl border border-white/10 bg-earth/70 p-1.5 shadow-lg backdrop-blur-sm`}>
      <div className="flex items-center justify-between pb-1 pl-1.5">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-200/85">
          <span className="size-1.5 rounded-full bg-clay" aria-hidden="true" />
          Mapa
        </span>
        <span className="flex">
          <button type="button" onClick={() => onExpand()} className={small} aria-label="Abrir mapa e visita" title="Abrir mapa e visita">
            <ExpandIcon className="size-3.5" />
          </button>
          <button type="button" onClick={() => onOpenChange(false)} className={small} aria-label="Recolher minimapa" title="Recolher minimapa">
            <MinimizeIcon className="size-3.5" />
          </button>
        </span>
      </div>
      <MiniMap
        modules={modules}
        explored={explored}
        targetId={targetId}
        path={path}
        tracker={tracker}
        variant="compact"
        onSelect={(id) => onExpand(id)}
      />
    </div>
  );
}
