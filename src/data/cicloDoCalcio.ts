/**
 * Módulo 13 · Ciclo do Cálcio: a mesa ao lado da do 12, com o fêmur, a caixa de leite, o vaso com a planta e a
 * vaca de brinquedo, o vaso de solo, o calcário moído, a rocha calcária, as conchas e o banner do ciclo.
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

const AUDIO = "/audio/inspection/ciclo-do-calcio";
const MODELS = "/models/inspection/ciclo-do-calcio";
const THUMBS = "/models/inspection/thumbs";

/** Banner: de frente e sem inclinação, como o do módulo 05. */
const VIEW_BANNER: InspectionItem["view"] = { rotationDeg: [0, 0, 0], yawDeg: 0, pitchDeg: 0, fitScale: 0.9 };

const ITENS: InspectionItem[] = [
  {
    id: "modulo-13-02-ossos-e-dentes",
    order: 1,
    title: "Ossos e dentes",
    shortTitle: "Ossos e dentes",
    model: { url: `${MODELS}/osso_13_01_web.glb`, sizeBytes: 3_541_456 },
    thumbnail: `${THUMBS}/modulo-13-02-ossos-e-dentes.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-13-02-ossos-e-dentes.m4a`, cues: [0, 1.65, 7.25, 11.15, 19.28, 24.21] },
    description: `Observe esses ossos.

Grande parte do cálcio presente no corpo humano está armazenada nos ossos e dentes.

Esse mineral contribui para sua resistência e estrutura.

Mas o cálcio não serve apenas para isso. Ele também participa da contração muscular e de processos importantes para o funcionamento do organismo.

E agora surge uma pergunta. De onde veio o cálcio que forma nossos ossos?

A resposta começa na nossa alimentação.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -15, pitchDeg: 35 },
  },
  {
    id: "modulo-13-03-leite",
    order: 2,
    title: "Leite",
    shortTitle: "Leite",
    model: { url: `${MODELS}/leite_13_02_web.glb`, sizeBytes: 297_344 },
    thumbnail: `${THUMBS}/modulo-13-03-leite.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-13-03-leite.m4a`, cues: [0, 3.94, 8.67, 10.84, 16.99, 21.62] },
    description: `O leite é uma das fontes mais conhecidas de cálcio na alimentação.

Esse elemento é importante para a formação e manutenção dos ossos e dentes.

Mas o leite não é a única fonte.

Também podemos encontrar cálcio em outros alimentos e em bebidas vegetais enriquecidas com esse mineral.

E, no caso do leite de vaca, de onde será que veio o cálcio presente nele?

Vamos seguir esse caminho.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -25, pitchDeg: 12 },
  },
  {
    id: "modulo-13-04-vaca-e-planta",
    order: 3,
    title: "Vaca e planta",
    shortTitle: "Vaca e planta",
    model: { url: `${MODELS}/planta_e_vaca_13_03_web.glb`, sizeBytes: 2_727_372 },
    thumbnail: `${THUMBS}/modulo-13-04-vaca-e-planta.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-13-04-vaca-e-planta.m4a`, cues: [0.0, 25.81] },
    view: { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 20 },
    // Um rótulo por parte da narração (aceso enquanto ela é narrada).
    markers: [
      { node: "Vaca_de_Brinquedo", label: "Vaca", description: "Esta é a vaca, um dos animais que nos fornecem leite. O cálcio presente no leite vem dos nutrientes que o animal obtém durante sua alimentação. Quando uma vaca consome plantas, ela absorve diferentes elementos minerais, incluindo o cálcio. Parte desse cálcio é utilizada pelo organismo e outra parte pode ser transferida para o leite. Mas as plantas também precisam obter esse elemento de algum lugar, e é aí que entra o solo." },
      { node: "Grama_Artificial", label: "Planta", description: "As plantas também precisam de cálcio para crescer. Esse elemento participa da formação das paredes celulares e de diferentes processos de desenvolvimento vegetal. Mas, diferentemente dos animais, as plantas não precisam se alimentar de outros seres vivos para obter cálcio. Elas absorvem esse nutriente do solo por meio de suas raízes. Assim, o solo desempenha um papel essencial no fornecimento de minerais para as plantas. E esses minerais acabam chegando aos animais e aos seres humanos pela alimentação." },
    ],
  },
  {
    id: "modulo-13-06-solo",
    order: 4,
    title: "Solo",
    shortTitle: "Solo",
    model: { url: `${MODELS}/solo_13_04_web.glb`, sizeBytes: 3_027_588 },
    thumbnail: `${THUMBS}/modulo-13-06-solo.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-13-06-solo.m4a`, cues: [0, 2.84, 6.59, 15.16, 19.8] },
    description: `Este recipiente representa o solo.

É nele que encontramos parte do cálcio disponível para as plantas.

Esse cálcio pode vir da transformação das rochas que deram origem ao solo ou da aplicação de corretivos agrícolas, como o calcário.

Quando está em uma forma disponível, o cálcio pode ser absorvido pelas raízes.

Assim, um elemento que originalmente fazia parte das rochas passa a participar do crescimento das plantas e da alimentação dos animais.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 30 },
  },
  {
    id: "modulo-13-07-calcario-moido",
    order: 5,
    title: "Calcário moído",
    shortTitle: "Calcário moído",
    model: { url: `${MODELS}/calcario_moido_13_05_web.glb`, sizeBytes: 409_804 },
    thumbnail: `${THUMBS}/modulo-13-07-calcario-moido.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-13-07-calcario-moido.m4a`, cues: [0, 2.08, 6.44, 10.3, 16.73, 23.09] },
    description: `Este pó é o calcário moído.

Ele é produzido a partir da extração e moagem de rochas calcárias.

Na agricultura, sua principal função é corrigir a acidez do solo.

Além disso, muitos calcários agrícolas também fornecem cálcio e, dependendo de sua composição, magnésio.

Ao melhorar as condições químicas do solo, a aplicação adequada de calcário pode favorecer o desenvolvimento das plantas.

Por isso, esse material é muito utilizado na agricultura brasileira.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 20 },
  },
  {
    id: "modulo-13-08-rocha-calcaria",
    order: 6,
    title: "Rocha calcária",
    shortTitle: "Rocha calcária",
    model: { url: `${MODELS}/rocha_calcaria_13_06_web.glb`, sizeBytes: 1_787_768 },
    thumbnail: `${THUMBS}/modulo-13-08-rocha-calcaria.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-13-08-rocha-calcaria.m4a`, cues: [0, 3.65, 7.35, 11.47, 19.04, 20.22] },
    description: `Esta é uma rocha calcária, rica em minerais que contêm cálcio.

Ela é uma importante matéria-prima para a produção do calcário agrícola.

E aqui no Paraná encontramos grandes ocorrências dessas rochas.

Municípios como Rio Branco do Sul, Almirante Tamandaré e Itaperuçu possuem atividades relacionadas ao calcário.

Observe a rocha.

É interessante perceber como um material extraído da natureza pode ser utilizado para melhorar as condições de cultivo dos alimentos que consumimos.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 30 },
  },
  {
    id: "modulo-13-09-conchas",
    order: 7,
    title: "Conchas",
    shortTitle: "Conchas",
    model: { url: `${MODELS}/conchas_13_07_web.glb`, sizeBytes: 1_930_552 },
    thumbnail: `${THUMBS}/modulo-13-09-conchas.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-13-09-conchas.m4a`, cues: [0, 1.13, 4.97, 9.89, 14.67, 20.93] },
    description: `Olhe estas conchas.

Muitas conchas são formadas principalmente por carbonato de cálcio.

Organismos marinhos utilizam esse material para construir suas estruturas de proteção.

Quando esses organismos morrem, suas conchas podem se acumular no fundo dos mares.

Ao longo de milhões de anos, esses depósitos podem participar da formação de novas rochas calcárias.

Assim, o cálcio continua circulando entre a água, os organismos e as rochas.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -15, pitchDeg: 35 },
  },
  {
    id: "banner-13-10-ciclo-do-calcio",
    order: 8,
    title: "Banner do ciclo do cálcio",
    shortTitle: "Banner do ciclo",
    model: { url: `${MODELS}/banner_13_10_ciclo_do_calcio.glb`, sizeBytes: 767_272 },
    thumbnail: `${THUMBS}/banner-13-10-ciclo-do-calcio.webp`,
    narration: { audioUrl: `${AUDIO}/banner-13-10-ciclo-do-calcio.m4a`, cues: [0, 1.63, 5.83, 9.13, 15.36, 20.83, 27.88] },
    description: `Vamos reunir tudo o que aprendemos.

O cálcio pode estar presente nas rochas e ser liberado durante sua transformação.

No solo, ele pode ser absorvido pelas raízes das plantas.

Os animais obtêm cálcio ao se alimentar, e nós também recebemos esse elemento por meio dos alimentos.

Quando os seres vivos morrem e se decompõem, parte do cálcio retorna ao ambiente.

Outra parte pode ser transportada pela água até rios e mares, participando da formação de conchas e novos sedimentos.

Esse é o ciclo do cálcio, um processo que conecta as rochas, o solo, a água e todos nós.`,
    view: VIEW_BANNER,
  },
];

export const CICLO_DO_CALCIO: InspectionCatalog = {
  id: "ciclo-do-calcio",
  title: "Ciclo do Cálcio",
  overview: `O cálcio é um elemento essencial para a vida.

Ele participa da formação dos ossos e dentes, além de desempenhar diversas funções no nosso organismo.

Mas de onde vem todo esse cálcio?

A resposta envolve as rochas, o solo, as plantas e os animais.

Na natureza, o cálcio circula continuamente entre esses componentes. Esse processo é chamado de ciclo do cálcio.

Vamos acompanhar o caminho desse elemento desde as rochas até o nosso corpo.`,
  overviewNarration: { audioUrl: `${AUDIO}/geral.m4a`, cues: [0, 2.21, 8.08, 10.26, 14.61, 21.73] },
  stepNoun: "Item",
  menuEyebrow: "Escolha um item",
  groups: [
    { id: "ciclo-do-calcio", title: "Ciclo do Cálcio", items: ITENS },
  ],
};
