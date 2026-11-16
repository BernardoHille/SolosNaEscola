/**
 * Módulo 21 · Vermicompostagem: a bandeja com o vermicomposto e a garrafa de chorume e, ao lado, as caixas da
 * vermicomposteira, na mesa da parede esquerda (dois volumes de interação).
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

const AUDIO = "/audio/inspection/vermicompostagem";
const MODELS = "/models/inspection/vermicompostagem";
const THUMBS = "/models/inspection/thumbs";

const ITENS: InspectionItem[] = [
  {
    id: "modulo-21-02-minhocas",
    order: 1,
    title: "Minhocas",
    shortTitle: "Minhocas",
    model: { url: `${MODELS}/minhocas_21_02_web.glb`, sizeBytes: 2_162_600 },
    thumbnail: `${THUMBS}/modulo-21-02-minhocas.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-21-02-minhocas.m4a`, cues: [0, 4.34, 9.98, 13.15, 20.2, 25.19] },
    description: `Aqui estão algumas das principais trabalhadoras da vermicomposteira: as minhocas.

Elas se alimentam de matéria orgânica em decomposição e dos micro-organismos associados a ela.

E possuem uma característica muito interessante.

As minhocas respiram através da pele; por isso, precisam de um ambiente úmido, mas não completamente encharcado.

Elas também são sensíveis à luz e costumam procurar locais escuros.

Além de participar da decomposição, seus movimentos ajudam a criar galerias que favorecem a circulação de água e ar no solo.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -15, pitchDeg: 45 },
  },
  {
    id: "modulo-21-03-vermicomposto",
    order: 2,
    title: "Vermicomposto",
    shortTitle: "Vermicomposto",
    model: { url: `${MODELS}/vermicomposto_21_04_web.glb`, sizeBytes: 481_624 },
    thumbnail: `${THUMBS}/modulo-21-03-vermicomposto.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-21-03-vermicomposto.m4a`, cues: [0, 1.85, 7.44, 15.21, 20.03] },
    description: `Este material escuro é o vermicomposto.

Ele é resultado da transformação de resíduos orgânicos pela ação das minhocas e de outros organismos.

Durante esse processo, os materiais são decompostos e transformados em um composto que contém nutrientes importantes para as plantas.

Quando está bem estabilizado, o vermicomposto pode ser utilizado como adubo.

Observe sua aparência. É curioso perceber como restos de alimentos e vegetais podem dar origem a um material tão diferente.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 20 },
  },
  {
    id: "modulo-21-04-liquido-da-vermicomposteira",
    order: 3,
    title: "Líquido coletado na vermicomposteira",
    shortTitle: "Líquido (chorume)",
    model: { url: `${MODELS}/chorume_21_03_web.glb`, sizeBytes: 286_492 },
    thumbnail: `${THUMBS}/modulo-21-04-liquido-da-vermicomposteira.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-21-04-liquido-da-vermicomposteira.m4a`, cues: [0, 8.42, 12.19, 18.53, 24.46] },
    description: `Na parte inferior da vermicomposteira, pode se acumular um líquido produzido durante a decomposição e a passagem da água pelos materiais orgânicos.

O manual da exposição chama esse líquido de chorume.

Ele pode conter substâncias dissolvidas e nutrientes, mas sua composição varia bastante.

Por isso, não deve ser utilizado diretamente nas plantas sem os cuidados e o tratamento adequados.

Essa parte da vermicomposteira mostra que a decomposição também envolve a movimentação de água e de substâncias presentes nos resíduos.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 12 },
  },
  {
    id: "modulo-21-05-outros-organismos",
    order: 4,
    title: "Outros organismos da vermicomposteira",
    shortTitle: "Outros organismos",
    model: { url: `${MODELS}/vermicomposteira_21_01_web.glb`, sizeBytes: 613_668 },
    thumbnail: `${THUMBS}/modulo-21-05-outros-organismos.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-21-05-outros-organismos.m4a`, cues: [0, 1.85, 7.15, 11.05, 15.19, 22.49] },
    description: `As minhocas não trabalham sozinhas.

Dentro de uma vermicomposteira também podem viver ácaros e muitos outros organismos pequenos.

Alguns se alimentam de fungos, bactérias ou restos vegetais.

Juntos, eles participam da decomposição dos resíduos orgânicos.

Ao observar esses organismos com ampliação, conseguimos perceber que existe uma comunidade inteira trabalhando nesse processo.

É um pequeno ecossistema onde diferentes seres vivos contribuem para a transformação da matéria orgânica.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -25, pitchDeg: 18 },
  },
  {
    id: "modulo-21-06-alimentacao-das-minhocas",
    order: 5,
    title: "Alimentação das minhocas",
    shortTitle: "Alimentação das minhocas",
    model: { url: `${MODELS}/alimentacao_21_web.glb`, sizeBytes: 2_268_232 },
    thumbnail: `${THUMBS}/modulo-21-06-alimentacao-das-minhocas.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-21-06-alimentacao-das-minhocas.m4a`, cues: [0, 5.16, 9.99, 14.22, 21.33] },
    description: `Uma vermicomposteira precisa receber os materiais adequados para funcionar bem.

Restos de vegetais podem servir de alimento para os organismos que vivem nela.

Mas nem todo resíduo doméstico deve ser colocado na vermicomposteira.

É importante escolher os materiais corretamente, evitar o excesso de umidade e manter condições adequadas para as minhocas.

Assim, conseguimos transformar parte dos resíduos orgânicos em adubo e reduzir a quantidade de materiais descartados no lixo comum.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -15, pitchDeg: 35 },
  },
];

export const VERMICOMPOSTAGEM: InspectionCatalog = {
  id: "vermicompostagem",
  title: "Vermicompostagem",
  overview: `Restos de frutas, verduras e outros materiais vegetais podem se transformar em um excelente adubo.

E alguns dos responsáveis por essa transformação são as minhocas.

Esse processo recebe o nome de vermicompostagem.

Dentro da vermicomposteira, minhocas e outros organismos participam da decomposição dos resíduos orgânicos.

Com o tempo, esses materiais são transformados em um composto rico em nutrientes.

Assim, aquilo que seria descartado pode voltar a contribuir para o crescimento de novas plantas.`,
  overviewNarration: { audioUrl: `${AUDIO}/geral.m4a`, cues: [0, 5.85, 10.13, 14.7, 20.32, 24.48] },
  stepNoun: "Item",
  menuEyebrow: "Escolha um item",
  groups: [
    { id: "vermicompostagem", title: "Vermicompostagem", items: ITENS },
  ],
};
