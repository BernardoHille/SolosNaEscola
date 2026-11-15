import { GearIcon } from "./icons";

type SettingsButtonProps = { open: boolean; onClick: () => void };

/**
 * Único controle fixo da visita: a engrenagem, no canto superior esquerdo (o minimapa fica no
 * direito), abre as configurações
 * (mapa e visita, ajuda, entrada, menu inicial, qualidade, tela cheia, áudio e "Sobre").
 */
export default function SettingsButton({ open, onClick }: SettingsButtonProps) {
  return (
    <div className="pointer-events-none absolute left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 sm:left-4 sm:top-4">
      <button
        type="button"
        onClick={onClick}
        className={`pointer-events-auto inline-flex size-10 items-center justify-center rounded-full border border-white/10 bg-earth/65 text-stone-100 shadow-lg backdrop-blur-sm transition-colors hover:bg-earth/85 hover:text-highlight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight ${
          open ? "text-highlight" : ""
        }`}
        aria-label="Configurações"
        title="Configurações"
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <GearIcon className="size-[19px]" />
      </button>
    </div>
  );
}
