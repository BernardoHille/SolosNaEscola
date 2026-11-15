/**
 * Módulo 20 · Vida no Solo: a mesa encostada na parede esquerda, na frente da sala, com a caixa entomológica, os
 * frascos com fauna do solo, os fragmentos de cupinzeiro e as placas de Petri com fungos e bactérias.
 *
 * Gerado por `processo/inspecao-web/modulo20_dados.py` (fora do repositório) a partir da gravação enviada em
 * 2026-11-15 (vídeo com as narrações dos módulos que faltavam) e do roteiro (p. 61–63). Não houve texto escrito:
 * as frases são as da transcrição, conferidas trecho a trecho. Narrações sem os títulos lidos nem a fonte
 * ("Baseado nas páginas 61 a 63 do manual") (`narracao_modulo20.py`). Acervo de grupo único com texto geral:
 * abre no menu dos itens, com a explicação geral narrada.
 *
 * Modelos: os objetos separados do acervo (o conjunto tem 17 MB). A narração apresenta a caixa entomológica e os
 * frascos juntos, então eles formam um item só; a caixa e o cupinzeiro têm as texturas PNG regravadas em JPEG; as
 * placas vão sem alteração (`modulo20_glb_web.py`). O conteúdo dos frascos é interpretação do acervo.
 */
import type { InspectionCatalog, InspectionItem } from "./inspection";

const AUDIO = "/audio/inspection/vida-no-solo";
const MODELS = "/models/inspection/vida-no-solo";
const THUMBS = "/models/inspection/thumbs";

const ITENS: InspectionItem[] = [
  {
    id: "modulo-20-01-insetos-e-fauna",
    order: 1,
    title: "Caixa de insetos e fauna do solo",
    shortTitle: "Insetos e fauna do solo",
    model: { url: `${MODELS}/caixa_fauna_20_web.glb`, sizeBytes: 7_358_660 },
    thumbnail: `${THUMBS}/modulo-20-01-insetos-e-fauna.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-20-01-insetos-e-fauna.m4a`, cues: [0, 2.96, 6.84, 11.24, 18.84, 22.64, 25.74] },
    description: `Observe esta coleção de organismos encontrados no solo.

Aqui podemos conhecer diferentes representantes da fauna do solo.

Eles apresentam tamanhos, formas e hábitos bastante variados.

Alguns se alimentam de restos vegetais, outros de pequenos organismos, e muitos participam da transformação da matéria orgânica.

Essa diversidade ajuda a manter o funcionamento do solo.

Explore os exemplares e observe suas diferenças.

Quantos tipos de organismos você consegue identificar?`,
    // De frente e bem de cima: os insetos alfinetados no fundo da caixa e, à esquerda, os frascos.
    view: { rotationDeg: [0, 0, 0], yawDeg: -10, pitchDeg: 40 },
  },
  {
    id: "modulo-20-02-cupinzeiro",
    order: 2,
    title: "Cupinzeiro",
    shortTitle: "Cupinzeiro",
    model: { url: `${MODELS}/cupinzeiro_20_03_web.glb`, sizeBytes: 2_280_968 },
    thumbnail: `${THUMBS}/modulo-20-02-cupinzeiro.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-20-02-cupinzeiro.m4a`, cues: [0, 2.84, 8.04, 10.44, 15.36, 19.64, 23.98] },
    description: `Esta estrutura é um fragmento de cupinzeiro.

Os cupins são conhecidos por construir galerias e estruturas que podem ser bastante complexas.

Mas o trabalho deles vai muito além disso.

Ao movimentar partículas e construir túneis, esses animais modificam a estrutura do solo.

As galerias também podem favorecer a entrada de água e a circulação de ar.

Além disso, muitos cupins participam da decomposição de materiais vegetais.

Assim, esses pequenos animais ajudam a transformar o ambiente onde vivem.`,
    // De frente, como a foto 112: a face com as galerias.
    view: { rotationDeg: [0, 0, 0], yawDeg: -14, pitchDeg: 22 },
    container: {
      node: "Bandeja_Plastica_M20",
      labels: { hint: "na bandeja ou nos fragmentos para tirar os fragmentos da bandeja", detach: "Tirar da bandeja", attach: "Pôr de volta na bandeja" },
    },
  },
  {
    id: "modulo-20-03-fungos-e-bacterias",
    order: 3,
    title: "Fungos e bactérias",
    shortTitle: "Fungos e bactérias",
    model: { url: `${MODELS}/placas_20_04_microrganismos.glb`, sizeBytes: 2_041_788 },
    thumbnail: `${THUMBS}/modulo-20-03-fungos-e-bacterias.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-20-03-fungos-e-bacterias.m4a`, cues: [0, 3.52, 9.3, 14.6, 21.6, 25.02, 29.6] },
    description: `Nestas placas, podemos observar colônias de fungos e bactérias.

Embora muitos desses organismos sejam microscópicos, seu crescimento pode formar estruturas visíveis.

Eles desempenham um papel fundamental na decomposição de restos vegetais e animais.

Durante esse processo, nutrientes são transformados e podem voltar a ser aproveitados por outros seres vivos.

Lembra das bactérias que ajudam as leguminosas a obter nitrogênio?

Elas são outro exemplo de como os microrganismos contribuem para a vida no solo.

Sem esses organismos, a reciclagem natural dos nutrientes seria muito diferente.`,
    // De cima, para ver as colônias através das tampas.
    view: { rotationDeg: [0, 0, 0], yawDeg: 0, pitchDeg: 45 },
    container: {
      nodes: ["Tampa_1", "Tampa_2", "Tampa_3"],
      labels: { hint: "nas tampas ou nas placas para tirar as tampas", detach: "Tirar as tampas", attach: "Pôr as tampas de volta" },
    },
  },
];

export const VIDA_NO_SOLO: InspectionCatalog = {
  id: "vida-no-solo",
  title: "Vida no Solo",
  overview: `Debaixo dos nossos pés existe um ambiente cheio de vida.

O solo abriga uma enorme diversidade de organismos, desde pequenos insetos até fungos e bactérias microscópicas.

Esses seres vivos ajudam a decompor restos de plantas e animais, reciclar nutrientes e manter a estrutura do solo.

E cada organismo desempenha uma função importante.

Nesta coleção, vamos conhecer alguns desses habitantes e descobrir como eles contribuem para o equilíbrio da natureza.`,
  overviewNarration: { audioUrl: `${AUDIO}/geral.m4a`, cues: [0, 3.4, 10.54, 17.66, 20.48] },
  stepNoun: "Item",
  menuEyebrow: "Escolha um item",
  groups: [{ id: "vida-no-solo", title: "Vida no Solo", items: ITENS }],
};
