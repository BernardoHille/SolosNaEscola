import Dialog from "@/components/ui/Dialog";
import { AVAILABLE_MODULES, EXHIBITION_MODULES } from "@/data/exhibitionModules";

type AboutPanelProps = { onClose: () => void };

/**
 * "Sobre a exposição": o programa, a exposição física e esta versão digital. Textos resumidos da
 * apresentação do roteiro da visita autoguiada (2ª edição, 2026); as contagens de módulos vêm dos
 * dados do app.
 */
export default function AboutPanel({ onClose }: AboutPanelProps) {
  const available = AVAILABLE_MODULES.length;
  const total = EXHIBITION_MODULES.length;

  return (
    <Dialog titleId="about-title" eyebrow="Sobre a exposição" title="Exposição Didática de Solos" onClose={onClose} brand widthClass="max-w-lg">
      <div className="space-y-3 leading-relaxed text-stone-300">
        <p>
          A <strong className="font-semibold text-stone-100">Exposição Didática de Solos</strong> faz parte do Programa de
          Extensão Universitária Solo na Escola, do Departamento de Solos e Engenharia Agrícola da Universidade Federal do
          Paraná. Implantada em 2002 no campus Agrárias, em Curitiba, ela apoia o ensino sobre solos do ensino fundamental
          ao superior e recebe também a comunidade.
        </p>
        <p>
          Em cerca de 100 m², reúne experimentos interativos, maquetes, banners e uma coleção de perfis de solo em tamanho
          natural, para mostrar o solo como parte essencial das paisagens naturais, rurais e urbanas.
        </p>
      </div>

      <h3 className="mt-5 text-[10px] font-semibold uppercase tracking-[0.22em] text-clay/85">Esta visita digital</h3>
      <div className="mt-2 space-y-3 leading-relaxed text-stone-300">
        <p>
          O ambiente foi reconstruído em 3D a partir de imagens da sala real (Gaussian Splatting). Você caminha pela
          exposição em primeira pessoa e inspeciona os objetos em modelos 3D, com textos e narrações.
        </p>
        <p>
          {available} dos {total} módulos do roteiro já podem ser inspecionados; os demais aparecem no catálogo do mapa
          como “Ainda não disponível”.
        </p>
      </div>

      <dl className="mt-5 grid gap-x-4 gap-y-2 rounded-2xl bg-white/5 px-4 py-3 text-xs sm:grid-cols-[auto_1fr]">
        <dt className="text-stone-400">Conteúdo</dt>
        <dd className="text-stone-200">Exposição Didática de Solos: roteiro da visita autoguiada, 2ª edição (UFPR, 2026)</dd>
        <dt className="text-stone-400">Realização</dt>
        <dd className="text-stone-200">Programa Solo na Escola/UFPR · Departamento de Solos e Engenharia Agrícola</dd>
        <dt className="text-stone-400">Mais informações</dt>
        <dd>
          <a
            href="https://www.agrarias.ufpr.br/solonaescola"
            target="_blank"
            rel="noreferrer"
            className="text-highlight underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-highlight"
          >
            agrarias.ufpr.br/solonaescola
          </a>
        </dd>
      </dl>
    </Dialog>
  );
}
