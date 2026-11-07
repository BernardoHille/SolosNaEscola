/**
 * Módulo 18 · Deslizamento e Inundação: os dois aquários lado a lado na mesa encostada na parede esquerda, a
 * encosta com casas e o terreno plano perto do rio, que recebem a mesma chuva.
 *
 * Gerado por `processo/inspecao-web/modulo18_dados.py` (fora do repositório) a partir do texto enviado, da
 * gravação da equipe (`inundacao.aac`, sem os títulos lidos "01. Deslizamento de terra" e "2. Inundação") e do
 * roteiro (p. 57–59). Na ordem do roteiro: primeiro o deslizamento, depois a inundação.
 *
 * Modelos: os GLBs do acervo, sem alteração (clipes de 24 s, chuva de 1,5 a 18,8 s). A animação segue a narração
 * (`animation.sync`): a chuva liga na frase que fala dela, e no deslizamento o solo cede em "O solo começa a ceder!".
 */
import type { InspectionSet } from "./inspection";

const AUDIO = "/audio/inspection/deslizamento-e-inundacao";
const MODELS = "/models/inspection/deslizamento-inundacao";

export const DESLIZAMENTO_E_INUNDACAO: InspectionSet = {
  id: "deslizamento-e-inundacao",
  title: "Deslizamento e Inundação",
  stepNoun: "Aquário",
  items: [
    {
      id: "modulo-18-01-deslizamento",
      order: 1,
      title: "Deslizamento de terra",
      shortTitle: "Deslizamento",
      model: { url: `${MODELS}/aquario_18_01_deslizamento.glb`, sizeBytes: 5_507_764 },
      thumbnail: "/models/inspection/thumbs/modulo-18-01-deslizamento.webp",
      narration: { audioUrl: `${AUDIO}/modulo-18-01-deslizamento.m4a`, cues: [0, 3.17, 7.73, 13.25, 15.71, 18.99, 21.83, 24.05, 28.41, 31.61, 37.95, 43.41] },
      description: `Imagine morar em uma casa construída na encosta de um morro.

Em dias de chuva intensa, essa situação pode se tornar perigosa!

Nesta animação, temos algumas casas construídas sobre um terreno bastante inclinado.

Observe o que acontece quando a chuva começa a cair.

A água entra no solo e pode diminuir sua estabilidade.

E quando o terreno não consegue mais se manter firme...

O solo começa a ceder!

Veja como a terra se movimenta, arrastando as casas junto com ela!

Esse fenômeno é chamado de deslizamento de terra.

A retirada da vegetação e a ocupação inadequada de encostas podem aumentar o risco desses acontecimentos.

As consequências podem ser graves, incluindo a destruição de moradias e o soterramento de pessoas.

Por isso, ocupar áreas inclinadas exige planejamento e cuidados especiais para garantir a segurança da população.`,
      // De frente e um pouco de cima, como as prévias do acervo.
      view: { rotationDeg: [0, 0, 0], yawDeg: -12, pitchDeg: 18, fitScale: 0.9, fitIgnore: ["Chuva"] },
      // Parado até a chuva ligar; clipe 1.5 s em "Observe o que acontece quand…"; 7.0 s em "O solo começa a ceder!…"; depois, velocidade normal.
      animation: { sync: [[0, 0], [13.17, 0], [14.67, 1.5], [21.83, 7.0], [38.83, 24.0]] },
    },
    {
      id: "modulo-18-02-inundacao",
      order: 2,
      title: "Inundação",
      shortTitle: "Inundação",
      model: { url: `${MODELS}/aquario_18_02_inundacao.glb`, sizeBytes: 2_173_172 },
      thumbnail: "/models/inspection/thumbs/modulo-18-02-inundacao.webp",
      narration: { audioUrl: `${AUDIO}/modulo-18-02-inundacao.m4a`, cues: [0, 3.01, 7.17, 13.27, 17.15, 19.11, 25.75, 29.19, 32.91, 35.53, 42.49, 48.81] },
      description: `Agora, vamos observar uma situação diferente!

Aqui, temos casas construídas em uma região plana, próxima a um rio.

Essas áreas são chamadas de várzeas e costumam apresentar solos naturalmente muito úmidos.

Mas o que acontece quando uma chuva intensa atinge esse terreno???

Observe a animação!

A água começa a se acumular na superfície, porque o solo já está com excesso de água e não consegue absorver toda a chuva.

Veja como o nível da água sobe rapidamente!

Aos poucos, as casas ficam parcialmente submersas.

Isso representa uma inundação!

Esse fenômeno pode acontecer quando a água ocupa áreas normalmente secas, especialmente nas proximidades de rios.

E quando construímos casas em regiões naturalmente sujeitas a inundações, colocamos a população em risco.

Por isso, conhecer as características do solo e respeitar as áreas de inundação dos rios é fundamental para planejar cidades mais seguras.`,
      // De frente e um pouco de cima, como as prévias do acervo.
      view: { rotationDeg: [0, 0, 0], yawDeg: -12, pitchDeg: 18, fitScale: 0.9, fitIgnore: ["Chuva"] },
      // Parado até a chuva ligar; clipe 1.5 s em "Observe a animação!…"; depois, velocidade normal.
      animation: { sync: [[0, 0], [15.65, 0], [17.15, 1.5], [39.65, 24.0]] },
    },
  ],
};
