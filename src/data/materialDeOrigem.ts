/**
 * Módulo 02 · Material de Origem: as 20 bandejas de rochas da estante, em três grupos.
 *
 * Gerado por `processo/inspecao-web/modulo02_dados.py` (fora do repositório) a partir do roteiro
 * da equipe, do catálogo do acervo (`catalogo_web.json`: nós da bandeja, da etiqueta e das
 * rochas) e dos tempos da narração. Edições à mão são possíveis; o formato é o de `inspection.ts`.
 *
 * Modelos: versões web dos GLBs do acervo (mesma geometria; mapas de normal e rugosidade em JPEG
 * de até 1024 px). Bandeja e etiqueta formam o recipiente: clicar na rocha ou na bandeja as esconde.
 */
import type { InspectionCatalog, InspectionItem } from "./inspection";

const AUDIO = "/audio/inspection/material-de-origem";
const MODELS = "/models/inspection/rochas";
const THUMBS = "/models/inspection/thumbs";

/** Vista inicial de três quartos, a mesma das fotos de apresentação do acervo. */
const VIEW: InspectionItem["view"] = { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 30 };

const IGNEAS: InspectionItem[] = [
  {
    id: "rocha-02-06-granito",
    order: 1,
    title: "Granito",
    shortTitle: "Granito",
    model: { url: `${MODELS}/rocha_02_06_granito.glb`, sizeBytes: 3_742_596 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo06", "Bandeja_Frente_mo06", "Bandeja_Fundo_mo06", "Bandeja_Esquerda_mo06", "Bandeja_Direita_mo06", "Etiqueta_mo06"] },
    thumbnail: `${THUMBS}/rocha-02-06-granito.webp`,
    description: `Este é o granito! Uma das rochas mais conhecidas do mundo.

Ele se forma quando o magma esfria lentamente, nas profundezas da Terra.

Esse resfriamento permite o crescimento de cristais que podemos observar a olho nu.

Repare nos pequenos minerais de cores diferentes!

O granito é muito utilizado na construção civil, em pisos, revestimentos e bancadas.

Talvez você já tenha visto essa rocha na sua própria casa!`,
    narration: { audioUrl: `${AUDIO}/rocha-02-06-granito.m4a`, cues: [0, 4.16, 7.42, 13.7, 16.92, 21.88] },
  },
  {
    id: "rocha-02-07-basalto-amigdaloide",
    order: 2,
    title: "Basalto amigdaloide",
    shortTitle: "Basalto amigdaloide",
    model: { url: `${MODELS}/rocha_02_07_basalto-amigdaloide.glb`, sizeBytes: 3_226_072 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo07", "Bandeja_Frente_mo07", "Bandeja_Fundo_mo07", "Bandeja_Esquerda_mo07", "Bandeja_Direita_mo07", "Etiqueta_mo07"] },
    thumbnail: `${THUMBS}/rocha-02-07-basalto-amigdaloide.webp`,
    description: `Esta rocha tem uma história muito interessante!

Ela é um basalto amigdaloide.

Quando a lava estava esfriando, bolhas de gás deixaram pequenas cavidades na rocha.

Com o passar do tempo, essas cavidades foram preenchidas por outros minerais, trazidos pela circulação da água.

Observe a superfície!

Consegue encontrar essas pequenas estruturas?

Elas ajudam a contar a história do que aconteceu com a rocha depois de sua formação!`,
    narration: { audioUrl: `${AUDIO}/rocha-02-07-basalto-amigdaloide.m4a`, cues: [0, 2.36, 4.42, 9.18, 14.18, 16.56, 19.14] },
  },
  {
    id: "rocha-02-08-riolito",
    order: 3,
    title: "Riolito",
    shortTitle: "Riolito",
    model: { url: `${MODELS}/rocha_02_08_riolito.glb`, sizeBytes: 2_500_424 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo08", "Bandeja_Frente_mo08", "Bandeja_Fundo_mo08", "Bandeja_Esquerda_mo08", "Bandeja_Direita_mo08", "Etiqueta_mo08"] },
    thumbnail: `${THUMBS}/rocha-02-08-riolito.webp`,
    description: `Este é o riolito, uma rocha de origem vulcânica!

Ele se forma quando uma lava rica em sílica esfria e se solidifica na superfície terrestre.

E aqui vai uma curiosidade!

O riolito possui uma composição mineralógica muito parecida com a do granito.

A grande diferença está no ambiente de formação e na velocidade de resfriamento.

Enquanto o granito se forma lentamente em profundidade, o riolito esfria muito mais rápido, próximo ou na superfície!`,
    narration: { audioUrl: `${AUDIO}/rocha-02-08-riolito.m4a`, cues: [0, 3.12, 8.54, 10.34, 14.82, 19.84] },
  },
  {
    id: "rocha-02-09-obsidiana",
    order: 4,
    title: "Obsidiana",
    shortTitle: "Obsidiana",
    model: { url: `${MODELS}/rocha_02_09_obsidiana.glb`, sizeBytes: 1_720_512 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo09", "Bandeja_Frente_mo09", "Bandeja_Fundo_mo09", "Bandeja_Esquerda_mo09", "Bandeja_Direita_mo09", "Etiqueta_mo09"] },
    thumbnail: `${THUMBS}/rocha-02-09-obsidiana.webp`,
    description: `À primeira vista, esta rocha pode até parecer um pedaço de vidro!

E sabe por quê?

Porque a obsidiana é justamente um vidro vulcânico!

Ela se forma quando a lava esfria tão rapidamente que não há tempo suficiente para formar cristais.

Uma curiosidade é que a obsidiana pode produzir bordas extremamente afiadas.

Por isso, diferentes povos a utilizaram para fabricar ferramentas de corte e pontas de instrumentos.

Interessante, não é?`,
    narration: { audioUrl: `${AUDIO}/rocha-02-09-obsidiana.m4a`, cues: [0, 3.86, 4.46, 8.2, 13.84, 18.51, 25.08] },
  },
  {
    id: "rocha-02-10-basalto",
    order: 5,
    title: "Basalto",
    shortTitle: "Basalto",
    model: { url: `${MODELS}/rocha_02_10_basalto.glb`, sizeBytes: 2_924_668 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo10", "Bandeja_Frente_mo10", "Bandeja_Fundo_mo10", "Bandeja_Esquerda_mo10", "Bandeja_Direita_mo10", "Etiqueta_mo10"] },
    thumbnail: `${THUMBS}/rocha-02-10-basalto.webp`,
    description: `Este é o basalto, uma rocha formada pelo resfriamento da lava vulcânica.

Ele costuma apresentar uma coloração escura e cristais tão pequenos que nem sempre conseguimos distingui-los a olho nu.

E aqui no Brasil temos muito basalto!

Grandes derrames de lava cobriram extensas áreas do Sul do país há milhões de anos, inclusive no Paraná.

Essas rochas também estão relacionadas à formação de muitos solos avermelhados encontrados na região.`,
    narration: { audioUrl: `${AUDIO}/rocha-02-10-basalto.m4a`, cues: [0, 4.78, 11.58, 14.28, 20.82] },
  },
  {
    id: "rocha-02-11-diabasio",
    order: 6,
    title: "Diabásio",
    shortTitle: "Diabásio",
    model: { url: `${MODELS}/rocha_02_11_diabasio.glb`, sizeBytes: 3_594_728 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo11", "Bandeja_Frente_mo11", "Bandeja_Fundo_mo11", "Bandeja_Esquerda_mo11", "Bandeja_Direita_mo11", "Etiqueta_mo11"] },
    thumbnail: `${THUMBS}/rocha-02-11-diabasio.webp`,
    description: `Esta é uma rocha chamada diabásio!

Ela tem uma composição muito parecida com a do basalto, mas existe uma diferença importante.

Enquanto o basalto geralmente esfria na superfície, o diabásio se forma quando o magma se solidifica abaixo dela, muitas vezes em fraturas da crosta terrestre.

Isso permite o desenvolvimento de cristais um pouco maiores.

Observe a textura e compare com o basalto!

Consegue perceber alguma diferença?`,
    narration: { audioUrl: `${AUDIO}/rocha-02-11-diabasio.m4a`, cues: [0, 2.7, 8.24, 17.54, 21.08, 23.68] },
  },
  {
    id: "rocha-02-12-sienito",
    order: 7,
    title: "Sienito",
    shortTitle: "Sienito",
    model: { url: `${MODELS}/rocha_02_12_sienito.glb`, sizeBytes: 4_507_056 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo12", "Bandeja_Frente_mo12", "Bandeja_Fundo_mo12", "Bandeja_Esquerda_mo12", "Bandeja_Direita_mo12", "Etiqueta_mo12"] },
    thumbnail: `${THUMBS}/rocha-02-12-sienito.webp`,
    description: `Este é o sienito!

Assim como o granito, ele se forma pelo resfriamento lento do magma no interior da Terra.

Mas existe uma diferença interessante entre essas duas rochas!

O granito possui uma quantidade significativa de quartzo, enquanto o sienito normalmente apresenta muito pouco ou nenhum.

O sienito é rico em minerais chamados feldspatos, responsáveis por grande parte de sua composição.

Observe seus cristais e tente comparar sua aparência com a do granito!`,
    narration: { audioUrl: `${AUDIO}/rocha-02-12-sienito.m4a`, cues: [0, 2.04, 6.76, 10.3, 18.16, 24.36] },
  },
];

const SEDIMENTARES: InspectionItem[] = [
  {
    id: "rocha-02-01-carvao",
    order: 1,
    title: "Carvão mineral",
    shortTitle: "Carvão mineral",
    model: { url: `${MODELS}/rocha_02_01_carvao.glb`, sizeBytes: 2_579_820 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo01", "Bandeja_Frente_mo01", "Bandeja_Fundo_mo01", "Bandeja_Esquerda_mo01", "Bandeja_Direita_mo01", "Etiqueta_mo01"] },
    thumbnail: `${THUMBS}/rocha-02-01-carvao.webp`,
    description: `Você sabia que uma rocha pode se formar a partir de plantas?

Este é o carvão mineral!

Ele se originou de restos vegetais acumulados em antigos ambientes pantanosos, que foram soterrados e transformados ao longo de milhões de anos.

Por ser rico em carbono, o carvão é utilizado como fonte de energia.

Incrível pensar que estamos observando um material que já fez parte de antigas florestas, não é?`,
    narration: { audioUrl: `${AUDIO}/rocha-02-01-carvao.m4a`, cues: [0, 3.9, 5.62, 13.98, 18.32] },
  },
  {
    id: "rocha-02-02-conglomerado",
    order: 2,
    title: "Conglomerado",
    shortTitle: "Conglomerado",
    model: { url: `${MODELS}/rocha_02_02_conglomerado.glb`, sizeBytes: 4_888_612 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo02", "Bandeja_Frente_mo02", "Bandeja_Fundo_mo02", "Bandeja_Esquerda_mo02", "Bandeja_Direita_mo02", "Etiqueta_mo02"] },
    thumbnail: `${THUMBS}/rocha-02-02-conglomerado.webp`,
    description: `Olhe só esta rocha! Este é o conglomerado.

Ele é formado por fragmentos arredondados de outras rochas, que foram transportados pela água e, com o tempo, ficaram unidos por um cimento natural.

Observe sua superfície!

Consegue identificar os diferentes fragmentos?

Os conglomerados podem se formar em ambientes como rios e praias, e ajudam os geólogos a descobrir como a água transportava materiais no passado.`,
    narration: { audioUrl: `${AUDIO}/rocha-02-02-conglomerado.m4a`, cues: [0, 3.04, 10.3, 12.84, 15.0] },
  },
  {
    id: "rocha-02-03-arenito",
    order: 3,
    title: "Arenito",
    shortTitle: "Arenito",
    model: { url: `${MODELS}/rocha_02_03_arenito.glb`, sizeBytes: 4_240_940 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo03", "Bandeja_Frente_mo03", "Bandeja_Fundo_mo03", "Bandeja_Esquerda_mo03", "Bandeja_Direita_mo03", "Etiqueta_mo03"] },
    thumbnail: `${THUMBS}/rocha-02-03-arenito.webp`,
    description: `Já imaginou transformar a areia de uma praia em uma rocha?

Pois é exatamente assim que surge o arenito!

Ele se forma quando grãos de areia se acumulam e, ao longo do tempo, são compactados e cimentados.

É uma rocha encontrada em diferentes ambientes, inclusive em antigas regiões desérticas.

Observe sua textura. Dependendo da amostra, é possível perceber os pequenos grãos que formam essa rocha!`,
    narration: { audioUrl: `${AUDIO}/rocha-02-03-arenito.m4a`, cues: [0, 3.48, 6.38, 11.86, 17.48] },
  },
  {
    id: "rocha-02-04-folhelho",
    order: 4,
    title: "Folhelho",
    shortTitle: "Folhelho",
    model: { url: `${MODELS}/rocha_02_04_folhelho.glb`, sizeBytes: 2_403_960 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo04", "Bandeja_Frente_mo04", "Bandeja_Fundo_mo04", "Bandeja_Esquerda_mo04", "Bandeja_Direita_mo04", "Etiqueta_mo04"] },
    thumbnail: `${THUMBS}/rocha-02-04-folhelho.webp`,
    description: `Este é o folhelho!

Ele se forma pelo acúmulo de partículas muito pequenas, como argila e silte, geralmente depositadas em ambientes de águas tranquilas.

Com o passar do tempo, esses sedimentos são compactados e se transformam em rocha.

Uma característica interessante é sua tendência a se dividir em camadas bem finas.

E sabe o que é mais curioso? Alguns folhelhos podem preservar fósseis de organismos que viveram há milhões de anos!`,
    narration: { audioUrl: `${AUDIO}/rocha-02-04-folhelho.m4a`, cues: [0, 1.34, 9.0, 13.34, 19.3] },
  },
  {
    id: "rocha-02-05-calcario",
    order: 5,
    title: "Calcário",
    shortTitle: "Calcário",
    model: { url: `${MODELS}/rocha_02_05_calcario.glb`, sizeBytes: 4_007_900 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo05", "Bandeja_Frente_mo05", "Bandeja_Fundo_mo05", "Bandeja_Esquerda_mo05", "Bandeja_Direita_mo05", "Etiqueta_mo05"] },
    thumbnail: `${THUMBS}/rocha-02-05-calcario.webp`,
    description: `Você sabia que uma rocha pode ter origem em conchas e esqueletos de antigos organismos marinhos?

Este é o calcário!

Muitos calcários se formam pelo acúmulo desses materiais no fundo dos mares, enquanto outros surgem pela precipitação de minerais na água.

O calcário também é muito importante para nós!

Ele é utilizado na fabricação de cimento e, quando preparado adequadamente, pode ajudar a corrigir a acidez dos solos agrícolas.`,
    narration: { audioUrl: `${AUDIO}/rocha-02-05-calcario.m4a`, cues: [0, 6.46, 7.9, 14.94, 17.66] },
  },
];

const METAMORFICAS: InspectionItem[] = [
  {
    id: "rocha-02-13-gnaisse",
    order: 1,
    title: "Gnaisse",
    shortTitle: "Gnaisse",
    model: { url: `${MODELS}/rocha_02_13_gnaisse.glb`, sizeBytes: 4_793_424 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo13", "Bandeja_Frente_mo13", "Bandeja_Fundo_mo13", "Bandeja_Esquerda_mo13", "Bandeja_Direita_mo13", "Etiqueta_mo13"] },
    thumbnail: `${THUMBS}/rocha-02-13-gnaisse.webp`,
    description: `Esta é uma rocha chamada gnaisse!

Ela se forma quando outras rochas são submetidas a temperaturas e pressões elevadas, no interior da Terra.

Uma de suas características mais interessantes é a presença de faixas com minerais de cores diferentes.

Observe essas faixas!

Elas se formam durante a reorganização dos minerais, provocada pelo metamorfismo.

Em alguns casos, essas estruturas ficam até dobradas, registrando as enormes forças que atuaram sobre a rocha!`,
    narration: { audioUrl: `${AUDIO}/rocha-02-13-gnaisse.m4a`, cues: [0, 1.74, 8.3, 13.58, 15.48, 19.9] },
  },
  {
    id: "rocha-02-14-migmatito",
    order: 2,
    title: "Migmatito",
    shortTitle: "Migmatito",
    model: { url: `${MODELS}/rocha_02_14_migmatito.glb`, sizeBytes: 4_997_580 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo14", "Bandeja_Frente_mo14", "Bandeja_Fundo_mo14", "Bandeja_Esquerda_mo14", "Bandeja_Direita_mo14", "Etiqueta_mo14"] },
    thumbnail: `${THUMBS}/rocha-02-14-migmatito.webp`,
    description: `Olhe só esta rocha! Ela se chama migmatito.

E sua formação é bastante curiosa!

O migmatito se forma quando uma rocha é submetida a temperaturas tão elevadas que parte de seus minerais começa a derreter.

Quando esse material volta a se solidificar, encontramos uma mistura de características metamórficas e ígneas.

Observe seus padrões e suas faixas!

Essa rocha registra condições extremas de temperatura e transformação no interior da Terra.`,
    narration: { audioUrl: `${AUDIO}/rocha-02-14-migmatito.m4a`, cues: [0, 3.06, 5.88, 12.8, 17.9, 22.1] },
  },
  {
    id: "rocha-02-15-quartzito",
    order: 3,
    title: "Quartzito",
    shortTitle: "Quartzito",
    model: { url: `${MODELS}/rocha_02_15_quartzito.glb`, sizeBytes: 4_506_972 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo15", "Bandeja_Frente_mo15", "Bandeja_Fundo_mo15", "Bandeja_Esquerda_mo15", "Bandeja_Direita_mo15", "Etiqueta_mo15"] },
    thumbnail: `${THUMBS}/rocha-02-15-quartzito.webp`,
    description: `Você se lembra do arenito, aquela rocha formada por grãos de areia?

Pois é! Quando um arenito rico em quartzo passa por altas temperaturas e pressões, ele pode se transformar em quartzito!

Durante esse processo, os grãos de quartzo se recristalizam, formando uma rocha muito resistente.

Por causa dessa resistência, o quartzito pode formar serras e relevos que permanecem mesmo após longos períodos de erosão.

É impressionante como a mesma areia pode dar origem a materiais tão diferentes!`,
    narration: { audioUrl: `${AUDIO}/rocha-02-15-quartzito.m4a`, cues: [0, 4.75, 12.39, 18.47, 24.97] },
  },
  {
    id: "rocha-02-16-filito",
    order: 4,
    title: "Filito",
    shortTitle: "Filito",
    model: { url: `${MODELS}/rocha_02_16_filito.glb`, sizeBytes: 2_944_720 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo16", "Bandeja_Frente_mo16", "Bandeja_Fundo_mo16", "Bandeja_Esquerda_mo16", "Bandeja_Direita_mo16", "Etiqueta_mo16"] },
    thumbnail: `${THUMBS}/rocha-02-16-filito.webp`,
    description: `Este é o filito!

Ele se forma pela transformação de rochas ricas em minerais argilosos, submetidas à pressão e ao calor.

Uma característica muito interessante é o brilho que pode aparecer em sua superfície.

Esse brilho é provocado por pequenos minerais, como as micas, que ficam orientados durante o metamorfismo.

Observe a rocha de diferentes ângulos!

Dependendo da iluminação, você poderá perceber esse aspecto levemente brilhante, quase acetinado.`,
    narration: { audioUrl: `${AUDIO}/rocha-02-16-filito.m4a`, cues: [0, 1.92, 8.44, 12.86, 18.8, 21.5] },
  },
  {
    id: "rocha-02-17-xisto",
    order: 5,
    title: "Xisto",
    shortTitle: "Xisto",
    model: { url: `${MODELS}/rocha_02_17_xisto.glb`, sizeBytes: 4_696_504 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo17", "Bandeja_Frente_mo17", "Bandeja_Fundo_mo17", "Bandeja_Esquerda_mo17", "Bandeja_Direita_mo17", "Etiqueta_mo17"] },
    thumbnail: `${THUMBS}/rocha-02-17-xisto.webp`,
    description: `Agora temos o xisto!

Esta rocha se forma quando materiais preexistentes passam por transformações causadas pela pressão e pela temperatura.

Uma característica marcante é a orientação de seus minerais, que podem formar planos bem definidos.

Muitos xistos possuem minerais chamados micas, responsáveis por um brilho característico.

Observe a superfície com atenção!

Em algumas amostras, é possível identificar pequenos cristais brilhantes, que ajudam a revelar sua estrutura.`,
    narration: { audioUrl: `${AUDIO}/rocha-02-17-xisto.m4a`, cues: [0, 1.91, 8.19, 13.93, 19.73, 22.43] },
  },
  {
    id: "rocha-02-18-itabirito",
    order: 6,
    title: "Itabirito",
    shortTitle: "Itabirito",
    model: { url: `${MODELS}/rocha_02_18_itabirito.glb`, sizeBytes: 3_180_584 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo18", "Bandeja_Frente_mo18", "Bandeja_Fundo_mo18", "Bandeja_Esquerda_mo18", "Bandeja_Direita_mo18", "Etiqueta_mo18"] },
    thumbnail: `${THUMBS}/rocha-02-18-itabirito.webp`,
    description: `Esta é uma rocha muito importante para o Brasil: o itabirito!

Ela apresenta camadas ricas em minerais de ferro, alternadas com outras ricas em quartzo.

Essas estruturas registram processos geológicos extremamente antigos, que aconteceram há bilhões de anos.

O itabirito é muito encontrado em Minas Gerais, especialmente na região conhecida como Quadrilátero Ferrífero.

E sabe por que ele é tão importante?

Porque está associado a algumas das principais reservas de minério de ferro do Brasil!`,
    narration: { audioUrl: `${AUDIO}/rocha-02-18-itabirito.m4a`, cues: [0, 3.98, 9.18, 15.26, 21.8, 23.72] },
  },
  {
    id: "rocha-02-19-marmore",
    order: 7,
    title: "Mármore",
    shortTitle: "Mármore",
    model: { url: `${MODELS}/rocha_02_19_marmore.glb`, sizeBytes: 2_965_864 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo19", "Bandeja_Frente_mo19", "Bandeja_Fundo_mo19", "Bandeja_Esquerda_mo19", "Bandeja_Direita_mo19", "Etiqueta_mo19"] },
    thumbnail: `${THUMBS}/rocha-02-19-marmore.webp`,
    description: `Você provavelmente já ouviu falar do mármore!

Mas sabia que ele se forma a partir da transformação de outras rochas, como o calcário?

Quando essas rochas são submetidas a altas temperaturas e pressões, seus minerais se recristalizam, formando o mármore.

Ele pode apresentar diferentes cores e padrões, dependendo das impurezas presentes.

Por sua beleza, é muito utilizado em esculturas, pisos e revestimentos.

Algumas das esculturas mais famosas da história foram feitas com esse material!`,
    narration: { audioUrl: `${AUDIO}/rocha-02-19-marmore.m4a`, cues: [0, 2.52, 7.12, 13.62, 18.66, 23.26] },
  },
  {
    id: "rocha-02-20-ardosia",
    order: 8,
    title: "Ardósia",
    shortTitle: "Ardósia",
    model: { url: `${MODELS}/rocha_02_20_ardosia.glb`, sizeBytes: 2_100_624 },
    view: VIEW,
    container: { nodes: ["Bandeja_Base_mo20", "Bandeja_Frente_mo20", "Bandeja_Fundo_mo20", "Bandeja_Esquerda_mo20", "Bandeja_Direita_mo20", "Etiqueta_mo20"] },
    thumbnail: `${THUMBS}/rocha-02-20-ardosia.webp`,
    description: `Chegamos à ardósia!

Ela se forma quando rochas sedimentares ricas em argila, como o folhelho, passam por transformações provocadas pela pressão e pela temperatura.

Uma característica muito interessante é sua capacidade de se dividir em placas finas e relativamente planas.

Por isso, a ardósia é bastante utilizada em pisos, telhados e revestimentos.

Observe sua superfície!

Essa estrutura em planos é resultado das transformações que aconteceram durante sua formação.`,
    narration: { audioUrl: `${AUDIO}/rocha-02-20-ardosia.m4a`, cues: [0, 1.36, 9.72, 16.16, 21.92, 23.88] },
  },
];

export const MATERIAL_DE_ORIGEM: InspectionCatalog = {
  id: "material-de-origem",
  title: "Material de Origem",
  stepNoun: "Rocha",
  overview: `Por que existem tantos tipos diferentes de solo???

A resposta começa bem antes da formação do próprio solo!

Tudo parte de um material de origem, que geralmente é uma rocha.

Com o passar do tempo, essas rochas sofrem transformações e podem dar origem a solos com características muito diferentes.

Mas você sabia que nem todas as rochas são formadas da mesma maneira?

Elas são divididas em três grandes grupos: as ígneas, as sedimentares e as metamórficas.

E tem mais! Até mesmo sedimentos, como as areias das praias e das dunas, podem dar origem ao solo ao longo do tempo.

Agora, que tal conhecer essas rochas mais de perto?

Escolha um dos três grupos e descubra como cada tipo de rocha se forma!`,
  overviewNarration: { audioUrl: `${AUDIO}/00-geral.m4a`, cues: [0, 3.2, 6.68, 10.52, 17.56, 21.86, 28.0, 36.2, 39.24] },
  groups: [
    {
      id: "igneas",
      title: "Rochas ígneas",
      overview: `Vamos começar pelas rochas ígneas!

Você sabia que algumas rochas têm sua origem no magma, aquele material extremamente quente que existe no interior da Terra?

Pois é!

As rochas ígneas se formam quando o magma esfria e se solidifica.

Isso pode acontecer tanto nas profundezas da crosta terrestre quanto na superfície.

E dependendo de como esse processo acontece, podemos encontrar rochas com aparências bastante diferentes!

Aqui, temos cinco exemplos: granito, obsidiana, basalto, riolito e sienito.

Que tal observar cada uma delas?

Escolha uma rocha, gire o modelo e preste atenção na sua cor e na sua textura.

Será que todas têm a mesma aparência???

Compare as amostras e procure identificar as diferenças!

E lembre-se: dependendo de sua composição, essas rochas podem dar origem a solos com características minerais bastante variadas.`,
      overviewNarration: { audioUrl: `${AUDIO}/grupo-igneas.m4a`, cues: [0, 2.2, 8.38, 10.18, 14.14, 19.04, 24.58, 30.46, 32.6, 37.34, 39.76, 43.68] },
      items: IGNEAS,
    },
    {
      id: "sedimentares",
      title: "Rochas sedimentares",
      overview: `Agora, vamos conhecer as rochas sedimentares!

Você já imaginou que pequenos grãos de areia e outros sedimentos podem, com o tempo, se transformar em rochas?

É exatamente isso que acontece!

As rochas sedimentares se formam pelo acúmulo de sedimentos que, ao longo do tempo, passam por processos de compactação e transformação até se tornarem rochas.

Esse processo é chamado de litificação.

Aqui, temos cinco exemplos: arenito, conglomerado, folhelho, carvão mineral e calcário.

Observe as amostras com atenção.

Será que conseguimos perceber diferenças entre os materiais que formam essas rochas???

Escolha uma delas, aproxime o modelo e explore sua superfície!

Compare as cores, as texturas e os diferentes aspectos de cada rocha.

E sabe o que é interessante?

Dependendo dos minerais presentes e do tamanho das partículas que compõem essas rochas, elas podem dar origem a solos bastante diferentes!`,
      overviewNarration: { audioUrl: `${AUDIO}/grupo-sedimentares.m4a`, cues: [0, 2.94, 9.0, 11.18, 20.94, 23.38, 29.96, 31.91, 36.82, 40.66, 45.6, 47.24] },
      items: SEDIMENTARES,
    },
    {
      id: "metamorficas",
      title: "Rochas metamórficas",
      overview: `Chegamos agora às rochas metamórficas!

E aqui temos uma transformação muito interessante!

Você sabia que uma rocha pode se transformar em outro tipo de rocha???

Isso acontece quando uma rocha já existente é submetida a condições muito elevadas de pressão, temperatura ou à combinação das duas.

Essas condições podem modificar seus minerais e sua estrutura, dando origem a uma rocha metamórfica.

E o mais curioso é que essa transformação acontece sem que a rocha precise derreter completamente!

Nesta coleção, temos oito exemplos: gnaisse, migmatito, quartzito, filito, xisto, itabirito, mármore e ardósia.

Agora, escolha uma dessas rochas e observe seus detalhes.

Perceba as diferenças de cor e textura entre elas.

Será que você consegue identificar características que distinguem uma rocha da outra???

Explore os modelos e compare!

Assim como nos outros grupos, as rochas metamórficas também podem dar origem a solos variados, dependendo das características da rocha original.

Isso nos ajuda a entender por que encontramos tanta diversidade de solos na natureza!`,
      overviewNarration: { audioUrl: `${AUDIO}/grupo-metamorficas.m4a`, cues: [0, 2.9, 5.92, 8.72, 18.08, 23.58, 28.69, 37.34, 41.52, 45.06, 48.64, 52.32, 61.22] },
      items: METAMORFICAS,
    },
  ],
};
