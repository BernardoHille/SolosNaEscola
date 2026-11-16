/**
 * Módulo 22 · Cores do Solo: a bandeja inclinada com os potes de solos claros, avermelhados e amarelados e
 * escuros, e as placas de Petri com o quartzo, os pregos enferrujados e as folhas secas.
 *
 * Gerado por `processo/inspecao-web/modulos12a27_dados.py` (fora do repositório) a partir da gravação enviada em
 * 2026-11-15 (vídeo com as narrações dos módulos que faltavam) e do roteiro. Não houve texto escrito: as frases são
 * as da transcrição de cada parte, conferidas trecho a trecho (`modulos12a27_textos.py`). Narrações sem os títulos
 * lidos nem a fonte (`narracao_modulos12a24.py`). Itens que a narração apresenta juntos formam um modelo só; com
 * várias partes no mesmo objeto, cada parte acende o rótulo do seu nó.
 *
 * Modelos: versões web dos GLBs do acervo (texturas em JPEG; `modulos12a27_glb_web.py`).
 */
import type { InspectionCatalog, InspectionItem } from "./inspection";

const AUDIO = "/audio/inspection/cores-do-solo";
const MODELS = "/models/inspection/cores-do-solo";
const THUMBS = "/models/inspection/thumbs";

const ITENS: InspectionItem[] = [
  {
    id: "modulo-22-02-solos-claros-e-quartzo",
    order: 1,
    title: "Solos claros e quartzo",
    shortTitle: "Solos claros e quartzo",
    model: { url: `${MODELS}/claros_e_quartzo_22_web.glb`, sizeBytes: 1_942_388 },
    thumbnail: `${THUMBS}/modulo-22-02-solos-claros-e-quartzo.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-22-02-solos-claros-e-quartzo.m4a`, cues: [0, 2.42, 7.78, 11.74, 15.95, 21.83] },
    description: `Observe estas amostras de solos claros.

Tons brancos e esbranquiçados podem estar relacionados à presença de minerais como o quartzo.

O quartzo é um mineral muito resistente e bastante comum na natureza.

Ele também está presente em grandes quantidades em rochas como o arenito.

Ao longo do tempo, a transformação dessas rochas pode originar materiais ricos em quartzo.

Repare como essas amostras são diferentes dos solos avermelhados e escuros da coleção.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -15, pitchDeg: 25 },
  },
  {
    id: "modulo-22-03-solos-avermelhados-e-amarelados",
    order: 2,
    title: "Solos avermelhados e amarelados",
    shortTitle: "Avermelhados e amarelados",
    model: { url: `${MODELS}/vermelhos_e_pregos_22_web.glb`, sizeBytes: 1_714_436 },
    thumbnail: `${THUMBS}/modulo-22-03-solos-avermelhados-e-amarelados.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-22-03-solos-avermelhados-e-amarelados.m4a`, cues: [0.0, 28.31] },
    view: { rotationDeg: [0, 0, 0], yawDeg: -15, pitchDeg: 25 },
    // Um rótulo por parte da narração (aceso enquanto ela é narrada).
    markers: [
      { node: "Pote_Solo_Vermelho", label: "Solos avermelhados", description: "O vermelho é uma cor muito comum em diversos solos brasileiros. Ela está frequentemente relacionada à presença de minerais de ferro, especialmente a hematita. E aqui existe uma comparação interessante. A cor avermelhada do solo tem relação com processos químicos semelhantes aos que produzem a ferrugem. Observe os materiais enferrujados da coleção e compare as cores. Percebe a semelhança? É uma forma de compreender como os minerais influenciam a aparência dos solos." },
      { node: "Pote_Solo_Amarelo", label: "Solos amarelados", description: "Agora temos os solos amarelados. Assim como acontece com os solos vermelhos, essa coloração também está relacionada à presença de minerais ricos em ferro. Um deles é a goethita, que apresenta tonalidades amareladas e amarronzadas. A presença desses minerais ajuda a explicar por que solos de diferentes regiões podem apresentar cores tão distintas. Compare esta amostra com a avermelhada. Mesmo quando as cores são diferentes, o ferro pode estar relacionado às duas." },
      { node: "Placa_22_02_Pregos_Enferrujados", label: "Pregos enferrujados" },
    ],
  },
  {
    id: "modulo-22-05-solos-escuros",
    order: 3,
    title: "Solos escuros",
    shortTitle: "Solos escuros",
    model: { url: `${MODELS}/escuros_e_folhas_22_web.glb`, sizeBytes: 1_715_748 },
    thumbnail: `${THUMBS}/modulo-22-05-solos-escuros.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-22-05-solos-escuros.m4a`, cues: [0, 3.39, 7.83, 14.73, 20.5, 25.23] },
    description: `Observe como estes solos apresentam cores bem mais escuras.

Essa coloração costuma estar relacionada à presença de matéria orgânica.

Restos de plantas e animais passam por processos de decomposição, formando materiais que podem escurecer o solo.

Isso é bastante comum em horizontes superficiais e em solos com grande acúmulo de matéria orgânica.

Mas atenção! Um solo escuro não é necessariamente mais fértil.

A cor oferece pistas importantes, mas precisamos observar outras características para compreender a qualidade do solo.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -15, pitchDeg: 25 },
  },
];

export const CORES_DO_SOLO: InspectionCatalog = {
  id: "cores-do-solo",
  title: "Cores do Solo",
  overview: `O solo pode apresentar uma variedade enorme de cores.

Existem solos avermelhados, amarelados, claros e até quase pretos.

Mas essas cores não aparecem por acaso.

Elas estão relacionadas aos minerais presentes no solo, à matéria orgânica e às condições em que ele se formou.

Por isso, a cor é uma das características que os pesquisadores observam ao estudar os solos.

Nesta coleção, vamos descobrir o que algumas dessas cores podem revelar.`,
  overviewNarration: { audioUrl: `${AUDIO}/geral.m4a`, cues: [0, 3.09, 7.86, 10.38, 16.92, 21.78] },
  stepNoun: "Item",
  menuEyebrow: "Escolha um item",
  groups: [
    { id: "cores-do-solo", title: "Cores do Solo", items: ITENS },
  ],
};
