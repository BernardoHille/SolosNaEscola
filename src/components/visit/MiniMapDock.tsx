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
  "inline-flex size-6 items-center justify-center rounded-full text-stone-300 transition-colors hover:bg-white/10 hover:text-stone-50 focus-visible:outline-2 focus-visible:outline-amber-200";

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
  // Computador: abaixo dos controles. Toque: acima de "Voltar à entrada", longe do painel de
  // orientação (que no toque fica no alto) e do joystick (embaixo, à esquerda).
  const position = touch
    ? "pointer-events-auto absolute bottom-[calc(max(0.75rem,env(safe-area-inset-bottom))+3rem)] right-3 z-10"
    : "pointer-events-auto absolute right-3 top-[3.75rem] z-10 sm:right-4 sm:top-[4.25rem]";

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className={`${position} inline-flex size-9 items-center justify-center rounded-full bg-black/45 text-stone-100 backdrop-blur-sm transition-colors hover:bg-black/65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200`}
        aria-label="Mostrar minimapa"
        title="Mostrar minimapa"
      >
        <MapIcon className="size-[18px]" />
      </button>
    );
  }

  return (
    <div className={`${position} ${touch ? "w-36" : "w-44"} rounded-xl bg-black/50 p-1.5 shadow-lg backdrop-blur-sm`}>
      <div className="flex items-center justify-between pb-1 pl-1">
        <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-stone-300/80">Mapa</span>
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
