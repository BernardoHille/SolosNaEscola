import { CloseIcon } from "./icons";

type HelpPanelProps = {
  inputMode: "desktop" | "touch";
  onClose: () => void;
};

const Key = ({ children }: { children: React.ReactNode }) => (
  <kbd className="inline-flex min-w-6 items-center justify-center rounded border border-white/25 bg-white/10 px-1.5 py-0.5 font-sans text-[11px] font-medium text-stone-100">
    {children}
  </kbd>
);

/** Instruções curtas de navegação. Fecha pelo botão, pelo fundo ou por Esc. */
export default function HelpPanel({ inputMode, onClose }: HelpPanelProps) {
  const touch = inputMode === "touch";

  return (
    <div
      className="absolute inset-0 z-30 flex items-end justify-center bg-black/30 p-3 sm:items-center"
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        className="w-full max-w-sm rounded-2xl bg-stone-950/90 p-5 text-sm text-stone-200 shadow-2xl backdrop-blur-md"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/70">Como visitar</p>
            <h2 id="help-title" className="mt-1 text-lg font-semibold text-stone-50">
              Caminhe pela exposição
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            className="-m-1 rounded-full p-1.5 text-stone-400 hover:bg-white/10 hover:text-stone-100"
            aria-label="Fechar instruções"
          >
            <CloseIcon />
          </button>
        </header>

        {touch ? (
          <ul className="mt-4 space-y-2.5 leading-snug">
            <li>
              <strong className="text-stone-50">Andar:</strong> use o controle circular no canto inferior esquerdo.
            </li>
            <li>
              <strong className="text-stone-50">Olhar ao redor:</strong> arraste um dedo na tela; a câmera
              segue o dedo.
            </li>
            <li>
              <strong className="text-stone-50">Objetos:</strong> mire nos objetos destacados em amarelo e toque
              em “Inspecionar”.
            </li>
          </ul>
        ) : (
          <ul className="mt-4 space-y-2.5 leading-snug">
            <li className="flex flex-wrap items-center gap-1.5">
              <strong className="text-stone-50">Andar:</strong> <Key>W</Key>
              <Key>A</Key>
              <Key>S</Key>
              <Key>D</Key> ou as setas
            </li>
            <li className="flex flex-wrap items-center gap-1.5">
              <strong className="text-stone-50">Mais rápido:</strong> segure <Key>Shift</Key>
            </li>
            <li>
              <strong className="text-stone-50">Olhar ao redor:</strong> ao começar a andar, o cursor some e
              o mouse passa a girar a câmera.
            </li>
            <li className="flex flex-wrap items-center gap-1.5">
              <strong className="text-stone-50">Liberar o cursor:</strong> <Key>Esc</Key>
            </li>
            <li>
              <strong className="text-stone-50">Com o cursor livre:</strong> arraste para olhar ou clique no piso
              para ir até ele.
            </li>
            <li className="flex flex-wrap items-center gap-1.5">
              <strong className="text-stone-50">Objetos:</strong> quando um objeto ficar destacado em amarelo,
              tecle <Key>E</Key> ou clique nele para inspecionar.
            </li>
          </ul>
        )}

        <p className="mt-4 text-xs leading-relaxed text-stone-400">
          O botão “Voltar à entrada” leva você de volta ao início da exposição.
        </p>
      </section>
    </div>
  );
}
