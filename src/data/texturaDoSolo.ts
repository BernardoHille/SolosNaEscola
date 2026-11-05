/**
 * Módulo 05 · Textura do Solo: a mesa em frente à janela (placa de granulometria, os copos de solo
 * arenoso, siltoso e argiloso) e o banner “Você conhece os grãos que formam o solo?”.
 *
 * Gerado por `processo/inspecao-web/modulo05_dados.py` (fora do repositório) a partir do roteiro
 * da equipe e dos tempos da narração. Acervo de grupo único: abre direto no menu, com o texto geral.
 *
 * Modelos: placa e copos são GLBs do acervo copiados sem alteração. O banner não tem modelo no
 * acervo: é um plano com a textura retificada de duas fotos da equipe (tamanho medido no splat).
 */
import type { InspectionCatalog, InspectionItem } from "./inspection";

const AUDIO = "/audio/inspection/textura-do-solo";
const MODELS = "/models/inspection/textura";
const THUMBS = "/models/inspection/thumbs";

/** A placa está deitada no arquivo (amostras para +Y): em pé, de frente, com o título em cima. */
const VIEW_PLACA: InspectionItem["view"] = { rotationDeg: [90, 0, 0], yawDeg: 0, pitchDeg: 0, fitScale: 0.9 };
/** Copos: três quartos de cima, com a etiqueta (+Z) para o visitante. */
const VIEW_COPO: InspectionItem["view"] = { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 30 };
/** Banner: de frente, mais perto (plano e alto, o enquadramento padrão sobra). */
const VIEW_BANNER: InspectionItem["view"] = { rotationDeg: [0, 0, 0], yawDeg: 0, pitchDeg: 0, fitScale: 0.9 };

const AMOSTRAS: InspectionItem[] = [
  {
    id: "placa-05-01-granulometria",
    order: 1,
    title: "Placa de granulometria",
    shortTitle: "Placa de granulometria",
    model: { url: `${MODELS}/placa_05_01_granulometria.glb`, sizeBytes: 3_690_800 },
    view: VIEW_PLACA,
    thumbnail: `${THUMBS}/placa-05-01-granulometria.webp`,
    description: `Agora, observe esta placa!

Ela apresenta partículas de diferentes tamanhos, organizadas da maior para a menor.

Esse tamanho dos grãos é chamado de granulometria.

Primeiro, temos o cascalho, formado por fragmentos maiores, facilmente visíveis a olho nu.

Depois, encontramos a areia grossa e a areia fina, com grãos cada vez menores.

Em seguida, temos o silte, formado por partículas tão pequenas que não conseguimos distingui-las individualmente a olho nu.

E, por último, a argila, com partículas ainda menores!

Você consegue perceber como os grãos vão ficando cada vez mais finos???

Essa diferença de tamanho é fundamental para entender as características dos solos!`,
    narration: { audioUrl: `${AUDIO}/placa-05-01-granulometria.m4a`, cues: [0, 1.58, 5.84, 8.5, 14.36, 19.22, 26.2, 30.12, 34.64] },
  },
  {
    id: "copo-05-02-arenoso",
    order: 2,
    title: "Solo arenoso",
    shortTitle: "Solo arenoso",
    model: { url: `${MODELS}/copo_05_02_arenoso.glb`, sizeBytes: 2_635_572 },
    view: VIEW_COPO,
    thumbnail: `${THUMBS}/copo-05-02-arenoso.webp`,
    description: `Vamos conhecer o solo arenoso!

Você já caminhou descalço pela areia de uma praia?

Pois é! A sensação desse solo é bastante parecida.

Ele possui uma grande proporção de partículas do tamanho areia, que podem ser percebidas individualmente pelo toque.

Por isso, apresenta uma textura mais áspera e granulada.

Observe a amostra!

Consegue imaginar a sensação desses pequenos grãos passando entre seus dedos???

Essa é uma das principais características dos solos arenosos!`,
    narration: { audioUrl: `${AUDIO}/copo-05-02-arenoso.m4a`, cues: [0, 1.9, 4.76, 7.64, 13.88, 17.72, 19.08, 23.26] },
  },
  {
    id: "copo-05-03-siltoso",
    order: 3,
    title: "Solo siltoso",
    shortTitle: "Solo siltoso",
    model: { url: `${MODELS}/copo_05_03_siltoso.glb`, sizeBytes: 2_314_336 },
    view: VIEW_COPO,
    thumbnail: `${THUMBS}/copo-05-03-siltoso.webp`,
    description: `Agora, temos o solo siltoso!

E aqui a sensação é bem diferente!

O silte possui partículas muito menores que as da areia, tão pequenas que não conseguimos distingui-las individualmente a olho nu.

Por isso, quando esfregamos um solo siltoso entre os dedos, ele apresenta uma sensação lisa e macia, semelhante ao talco.

Interessante, não é?

Quem diria que o tamanho de partículas tão pequenas poderia mudar tanto a sensação do solo???`,
    narration: { audioUrl: `${AUDIO}/copo-05-03-siltoso.m4a`, cues: [0, 1.89, 4.27, 11.69, 19.45, 20.95] },
  },
  {
    id: "copo-05-04-argiloso",
    order: 4,
    title: "Solo argiloso",
    shortTitle: "Solo argiloso",
    model: { url: `${MODELS}/copo_05_04_argiloso.glb`, sizeBytes: 2_546_660 },
    view: VIEW_COPO,
    thumbnail: `${THUMBS}/copo-05-04-argiloso.webp`,
    description: `Chegamos ao solo argiloso!

Ele possui uma grande proporção de partículas de argila, ainda menores que as de silte.

E sabe o que é mais interessante?

Quando está úmido, esse solo apresenta uma sensação pegajosa e pode ser moldado com facilidade!

É justamente essa característica que permite utilizar materiais argilosos na fabricação de vasos e outros objetos de cerâmica.

Você já tentou moldar alguma coisa usando barro molhado???

Então provavelmente já percebeu algumas dessas características!`,
    narration: { audioUrl: `${AUDIO}/copo-05-04-argiloso.m4a`, cues: [0, 1.54, 7.8, 9.74, 16.48, 24.0, 27.4] },
  },
  {
    id: "banner-05-05-textura",
    order: 5,
    title: "Banner de textura do solo",
    shortTitle: "Banner de textura do solo",
    model: { url: `${MODELS}/banner_05_05_textura.glb`, sizeBytes: 269_608 },
    view: VIEW_BANNER,
    thumbnail: `${THUMBS}/banner-05-05-textura.webp`,
    description: `Agora, vamos observar o tamanho das partículas de uma maneira diferente!

Neste banner, podemos comparar as dimensões dos grãos de areia, silte e argila.

Repare na diferença entre eles!

A areia possui partículas maiores, o silte apresenta partículas intermediárias, e a argila é formada pelas menores partículas desse grupo.

Mas aqui vai uma informação importante!

Todos os solos apresentam uma mistura dessas partículas. O que muda é a proporção de cada uma delas!

É por isso que podemos encontrar solos arenosos, siltosos e argilosos.

E agora que você conhece essas diferenças...

Será que conseguiria identificar a textura de um solo apenas pela sensação ao tocá-lo???`,
    narration: { audioUrl: `${AUDIO}/banner-05-05-textura.m4a`, cues: [0, 4.12, 9.5, 11.58, 19.56, 22.12, 28.54, 32.98, 35.38] },
  },
];

export const TEXTURA_DO_SOLO: InspectionCatalog = {
  id: "textura-do-solo",
  title: "Textura do Solo",
  stepNoun: "Item",
  menuEyebrow: "Escolha um item",
  overview: `Por que alguns solos são mais ásperos, enquanto outros são macios ou até pegajosos???

Isso acontece porque o solo é formado por partículas de diferentes tamanhos!

Essas partículas incluem areia, silte e argila.

A proporção entre elas é o que chamamos de textura do solo.

E o mais interessante é que essas diferenças podem ser percebidas até pelo toque!

Agora, vamos explorar as amostras e descobrir o que torna cada tipo de solo tão diferente!`,
  overviewNarration: { audioUrl: `${AUDIO}/00-geral.m4a`, cues: [0, 5.58, 9.54, 12.6, 15.68, 20.62] },
  groups: [{ id: "textura", title: "Textura do Solo", items: AMOSTRAS }],
};
