import Dialog from "./Dialog";
import { GearIcon } from "./icons";

type HelpPanelProps = {
  inputMode: "desktop" | "touch";
  onClose: () => void;
};

const Key = ({ children }: { children: React.ReactNode }) => (
  <kbd className="mx-0.5 inline-flex min-w-6 items-center justify-center rounded-md border border-white/20 bg-white/10 px-1.5 py-px align-[1px] font-sans text-[11px] font-medium text-stone-100">
    {children}
  </kbd>
);

const Item = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <li className="leading-relaxed">
    <strong className="font-semibold text-stone-50">{title}:</strong> {children}
  </li>
);

/** Instruções curtas de navegação. Fecha pelo X, pelo fundo ou por Esc. */
export default function HelpPanel({ inputMode, onClose }: HelpPanelProps) {
  const touch = inputMode === "touch";

  return (
    <Dialog titleId="help-title" eyebrow="Como navegar" title="Caminhe pela exposição" onClose={onClose} closeLabel="Fechar instruções">
      {touch ? (
        <ul className="mt-2 space-y-2">
          <Item title="Andar">use o controle circular no canto inferior esquerdo.</Item>
          <Item title="Olhar ao redor">arraste um dedo na tela; a câmera segue o dedo.</Item>
          <Item title="Objetos">mire nos objetos destacados em amarelo e toque em “Inspecionar”.</Item>
          <Item title="Mapa">o minimapa mostra onde você está; toque no ícone do mapa para abri-lo.</Item>
        </ul>
      ) : (
        <ul className="mt-2 space-y-2">
          <Item title="Andar">
            <Key>W</Key>
            <Key>A</Key>
            <Key>S</Key>
            <Key>D</Key> ou as setas
          </Item>
          <Item title="Mais rápido">
            segure <Key>Shift</Key>
          </Item>
          <Item title="Olhar ao redor">ao começar a andar, o cursor some e o mouse passa a girar a câmera.</Item>
          <Item title="Ver detalhes">segure o botão direito do mouse para aproximar a visão; ao soltar, ela volta.</Item>
          <Item title="Liberar o cursor">
            <Key>Esc</Key>
          </Item>
          <Item title="Com o cursor livre">arraste para olhar ou clique no piso para ir até ele.</Item>
          <Item title="Objetos">
            quando um objeto ficar destacado em amarelo, tecle <Key>E</Key> ou clique nele para inspecionar.
          </Item>
          <Item title="Mapa e visita">
            tecle <Key>M</Key> para ver onde você está, os módulos, o que já explorou e a visita guiada.
          </Item>
        </ul>
      )}

      <p className="mt-4 flex items-start gap-2 rounded-2xl bg-white/5 px-3 py-2.5 text-xs leading-relaxed text-stone-300">
        <GearIcon className="mt-px size-4 shrink-0 text-clay" />
        <span>
          A engrenagem, no canto superior direito, reúne o mapa e a visita guiada, a volta à entrada, a qualidade
          gráfica, a tela cheia e o som das narrações.
        </span>
      </p>
    </Dialog>
  );
}
