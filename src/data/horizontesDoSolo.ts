/**
 * Módulo 03 · Horizontes do Solo: as cinco caixas da mesa em frente à estante (O, A, B, C e R).
 *
 * Gerado por `processo/inspecao-web/modulo03_dados.py` (fora do repositório) a partir da fala da
 * gravação da equipe (revisada), do catálogo do acervo (`catalogo_web.json`) e dos tempos da
 * narração. Acervo de grupo único: abre direto no menu das amostras, com o texto geral.
 *
 * Modelos: GLBs do acervo copiados sem alteração. Só a Camada R (pedras) sai da caixa; os
 * horizontes são material solto e ficam nela.
 */
import type { InspectionCatalog, InspectionItem } from "./inspection";

const AUDIO = "/audio/inspection/horizontes-do-solo";
const MODELS = "/models/inspection/horizontes";
const THUMBS = "/models/inspection/thumbs";

/** Vista inicial de três quartos, de cima: mostra o conteúdo da caixa e a etiqueta. */
const VIEW: InspectionItem["view"] = { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 35 };

const AMOSTRAS: InspectionItem[] = [
  {
    id: "horizonte-03-01-o",
    order: 1,
    title: "Horizonte O",
    shortTitle: "Horizonte O",
    model: { url: `${MODELS}/horizonte_03_01_o.glb`, sizeBytes: 4_283_620 },
    view: VIEW,
    thumbnail: `${THUMBS}/horizonte-03-01-o.webp`,
    description: `Vamos começar pelo horizonte O.

Este é o horizonte mais superficial, rico em matéria orgânica.

Ele é formado pelo acúmulo de restos de plantas e animais que vão se decompondo ao longo do tempo.

Você já reparou naquela camada de folhas e outros materiais que encontramos sobre o chão de uma floresta?

Pois é, esses materiais contribuem para a formação do horizonte O.

Observe a amostra e perceba a presença de materiais orgânicos em diferentes estágios de decomposição.`,
    narration: { audioUrl: `${AUDIO}/horizonte-03-01-o.m4a`, cues: [0, 2.78, 6.58, 12.2, 17.46, 22.48] },
  },
  {
    id: "horizonte-03-02-a",
    order: 2,
    title: "Horizonte A",
    shortTitle: "Horizonte A",
    model: { url: `${MODELS}/horizonte_03_02_a.glb`, sizeBytes: 4_765_964 },
    view: VIEW,
    thumbnail: `${THUMBS}/horizonte-03-02-a.webp`,
    description: `Este é o horizonte A.

Ele é formado por uma mistura de minerais e matéria orgânica.

Uma de suas principais características é a coloração geralmente mais escura que a dos horizontes B e C.

Mas você sabe por que isso acontece?

É porque o horizonte A costuma apresentar uma quantidade maior de matéria orgânica, que contribui para a sua coloração.

Observe a amostra com atenção.

Consegue perceber a diferença de cor em relação aos outros horizontes?`,
    narration: { audioUrl: `${AUDIO}/horizonte-03-02-a.m4a`, cues: [0, 2.12, 5.58, 11.2, 13.32, 21.16, 23.58] },
  },
  {
    id: "horizonte-03-03-b",
    order: 3,
    title: "Horizonte B",
    shortTitle: "Horizonte B",
    model: { url: `${MODELS}/horizonte_03_03_b.glb`, sizeBytes: 4_808_684 },
    view: VIEW,
    thumbnail: `${THUMBS}/horizonte-03-03-b.webp`,
    description: `Agora vamos conhecer o horizonte B.

Diferentemente do horizonte A, ele costuma apresentar uma quantidade menor de matéria orgânica, mas tem uma característica muito interessante.

Suas cores podem ser bastante marcantes, variando entre tons de vermelho, amarelo e marrom.

A presença de um horizonte B bem desenvolvido é uma das características de solos que passaram por transformações mais intensas ao longo do tempo.

Observe sua coloração.

Qual dessas cores você consegue identificar nesta amostra?`,
    narration: { audioUrl: `${AUDIO}/horizonte-03-03-b.m4a`, cues: [0, 2.51, 10.43, 16.69, 25.21, 27.57] },
  },
  {
    id: "horizonte-03-04-c",
    order: 4,
    title: "Horizonte C",
    shortTitle: "Horizonte C",
    model: { url: `${MODELS}/horizonte_03_04_c.glb`, sizeBytes: 6_077_556 },
    view: VIEW,
    thumbnail: `${THUMBS}/horizonte-03-04-c.webp`,
    description: `Este é o horizonte C.

Aqui encontramos um material que ainda passou por poucas transformações.

Por isso, suas características são mais parecidas com as da rocha que deu origem ao solo.

Observe a amostra.

É possível encontrar diferentes cores e fragmentos que lembram o material de origem.

E sabe o que é interessante?

O horizonte C representa uma região do solo onde a transformação do material original ainda é relativamente pequena.

Isso ajuda a compreender como o solo se desenvolve a partir das rochas.`,
    narration: { audioUrl: `${AUDIO}/horizonte-03-04-c.m4a`, cues: [0, 2.17, 6.13, 11.87, 13.55, 18.37, 20.35, 27.39] },
  },
  {
    id: "camada-03-05-r",
    order: 5,
    title: "Camada R",
    shortTitle: "Camada R",
    model: { url: `${MODELS}/camada_03_05_r.glb`, sizeBytes: 3_508_012 },
    view: VIEW,
    container: { nodes: ["Base_h05", "Parede_Frontal_h05", "Parede_Traseira_h05", "Lateral_Esquerda_h05", "Lateral_Direita_h05", "Etiqueta_h05"] },
    thumbnail: `${THUMBS}/camada-03-05-r.webp`,
    description: `Por fim, chegamos à camada R.

Você se lembra da rocha mãe que vimos na formação do solo?

Pois é! Aqui encontramos novamente o material de origem.

Essa camada é formada pela rocha que ainda não passou por transformações significativas.

Ela representa a base rochosa a partir da qual o solo pode se desenvolver.`,
    closing: `E agora que conhecemos todos os horizontes, você percebeu como o solo pode mudar desde a superfície até a rocha original?

Essas diferenças mostram como o solo se transforma e se organiza ao longo do tempo.`,
    narration: { audioUrl: `${AUDIO}/camada-03-05-r.m4a`, cues: [0, 2.44, 4.76, 9.74, 15.24, 19.78, 27.52] },
  },
];

export const HORIZONTES_DO_SOLO: InspectionCatalog = {
  id: "horizontes-do-solo",
  title: "Horizontes do Solo",
  stepNoun: "Amostra",
  menuEyebrow: "Escolha uma amostra",
  overview: `Você já reparou que o solo não é igual da superfície até as camadas mais profundas?

Mas por que será que ele apresenta tantas diferenças?

Ao longo do tempo, o solo desenvolve diferentes camadas, chamadas de horizontes.

Cada horizonte possui características próprias, como cor, textura e composição.

Essas diferenças estão relacionadas à presença de matéria orgânica, minerais e ao grau de transformação do material de origem.

Agora, vamos conhecer essas camadas mais de perto.

Escolha uma das amostras e observe o que torna cada horizonte diferente dos outros.`,
  overviewNarration: { audioUrl: `${AUDIO}/00-geral.m4a`, cues: [0, 5.6, 9.24, 14.1, 19.68, 26.6, 30.62] },
  groups: [{ id: "horizontes", title: "Horizontes do Solo", items: AMOSTRAS }],
};
