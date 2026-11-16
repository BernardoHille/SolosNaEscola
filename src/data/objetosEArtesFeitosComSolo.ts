/**
 * Módulo 23 · Objetos e Artes Feitos com Solo: a estante do fundo, com materiais de construção, cerâmica
 * popular e artística, as casinhas da queima da cerâmica e os materiais de pintura com terra.
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

const AUDIO = "/audio/inspection/objetos-e-artes-feitos-com-solo";
const MODELS = "/models/inspection/objetos-e-artes-feitos-com-solo";
const THUMBS = "/models/inspection/thumbs";

const CONSTRUCAO: InspectionItem[] = [
  {
    id: "modulo-23-02-tijolos-ceramicos",
    order: 1,
    title: "Tijolos cerâmicos",
    shortTitle: "Tijolos",
    model: { url: `${MODELS}/tijolos_23_02_web.glb`, sizeBytes: 215_588 },
    thumbnail: `${THUMBS}/modulo-23-02-tijolos-ceramicos.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-23-02-tijolos-ceramicos.m4a`, cues: [0, 5.02, 8.74, 17.66, 21.18, 25.72] },
    description: `Esses são tijolos cerâmicos, materiais muito utilizados na construção de casas e edifícios.

Eles são produzidos principalmente a partir de materiais argilosos.

Primeiro, a massa é preparada e moldada no formato desejado. Depois, os tijolos passam por um processo de secagem e queima, que aumenta sua resistência.

Observe os espaços vazios presentes em alguns deles.

Esses furos ajudam a reduzir o peso das peças e fazem parte de sua fabricação.

É interessante perceber como o material retirado do solo pode se transformar em parte das construções que usamos todos os dias.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -25, pitchDeg: 25 },
  },
  {
    id: "modulo-23-03-telhas",
    order: 2,
    title: "Telhas",
    shortTitle: "Telhas",
    model: { url: `${MODELS}/telha_23_04_web.glb`, sizeBytes: 47_232 },
    thumbnail: `${THUMBS}/modulo-23-03-telhas.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-23-03-telhas.m4a`, cues: [0, 2.25, 6.98, 14.5, 19.31, 21.63, 29.33] },
    description: `Esta é uma telha de cerâmica.

Assim como os tijolos, ela pode ser produzida a partir de materiais argilosos.

Depois de moldada, seca e queimada, a peça ganha resistência e pode ser utilizada na cobertura de construções.

Seu formato ajuda a conduzir a água da chuva para fora do telhado.

E aqui vai uma curiosidade.

A cor avermelhada de muitas telhas está relacionada à presença de minerais de ferro na argila e às transformações que acontecem durante a queima.

Mais uma utilidade do solo no nosso cotidiano.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 45 },
  },
  {
    id: "modulo-23-04-azulejos-e-revestimentos",
    order: 3,
    title: "Azulejos e revestimentos",
    shortTitle: "Revestimentos",
    model: { url: `${MODELS}/revestimentos_23_03_web.glb`, sizeBytes: 155_404 },
    thumbnail: `${THUMBS}/modulo-23-04-azulejos-e-revestimentos.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-23-04-azulejos-e-revestimentos.m4a`, cues: [0, 4.06, 8.35, 15.72, 20.7, 25.26] },
    description: `Observe esta peça de revestimento cerâmico.

Materiais desse tipo são utilizados em pisos e paredes de muitas construções.

Sua fabricação envolve matérias-primas minerais, incluindo argilas, que são moldadas e submetidas a altas temperaturas.

Algumas peças também recebem esmaltes, responsáveis por diferentes cores e acabamentos.

Além de proteger superfícies, os revestimentos podem ter uma função decorativa.

É mais um exemplo de como materiais de origem mineral podem participar tanto da construção quanto da aparência dos ambientes.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -15, pitchDeg: 55 },
  },
  {
    id: "modulo-23-05-vasos-de-barro",
    order: 4,
    title: "Vasos e recipientes de barro",
    shortTitle: "Vasos de barro",
    model: { url: `${MODELS}/vaso_e_prato_23_01_web.glb`, sizeBytes: 264_116 },
    thumbnail: `${THUMBS}/modulo-23-05-vasos-de-barro.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-23-05-vasos-de-barro.m4a`, cues: [0, 4.32, 10.49, 17.73, 23.95] },
    description: `Este recipiente mostra uma das utilizações mais antigas da argila.

Quando o material argiloso é misturado com água, ele pode adquirir uma consistência que permite moldá-lo.

Essa propriedade é chamada de plasticidade. Assim, é possível produzir vasos, potes, tigelas e muitos outros objetos.

Depois de passar pela secagem e pela queima, a peça se torna uma cerâmica mais resistente.

Diferentes povos utilizam essa técnica há milhares de anos, mostrando uma relação muito antiga entre os seres humanos e o solo.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 25 },
  },
  {
    id: "modulo-23-06-peca-esferica-decorativa",
    order: 5,
    title: "Peça cerâmica esférica decorativa",
    shortTitle: "Peça esférica",
    model: { url: `${MODELS}/luminaria_23_05_web.glb`, sizeBytes: 1_595_264 },
    thumbnail: `${THUMBS}/modulo-23-06-peca-esferica-decorativa.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-23-06-peca-esferica-decorativa.m4a`, cues: [0, 3.55, 8.38, 14.35, 17.71, 20.95] },
    description: `Olhe esta peça de cerâmica com formato arredondado e várias aberturas.

Ela mostra que a argila também pode ser utilizada para criar objetos decorativos.

Antes da queima, o material pode ser moldado, perfurado e trabalhado para produzir diferentes formas.

Depois, o calor transforma a peça em cerâmica.

Observe os recortes e os detalhes de sua superfície.

Eles mostram como um material relativamente simples pode ser transformado em um objeto cheio de formas e possibilidades artísticas.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 20 },
  },
];

const ARTE_POPULAR: InspectionItem[] = [
  {
    id: "modulo-23-07-vaso-decorado",
    order: 1,
    title: "Vaso de cerâmica decorado",
    shortTitle: "Vaso decorado",
    model: { url: `${MODELS}/pote_23_06_web.glb`, sizeBytes: 516_088 },
    thumbnail: `${THUMBS}/modulo-23-07-vaso-decorado.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-23-07-vaso-decorado.m4a`, cues: [0, 3.64, 7.9, 15.32, 21.49] },
    description: `Este vaso é um exemplo de arte popular produzida com materiais do solo.

Observe os desenhos e as cores utilizados em sua decoração.

Além da função de guardar materiais, objetos de cerâmica também podem representar tradições e expressões culturais.

Em muitas regiões, o conhecimento sobre a produção dessas peças é transmitido entre gerações de artesãos.

Assim, a argila se transforma não apenas em um objeto, mas também em uma forma de expressão cultural.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 20 },
  },
  {
    id: "modulo-23-08-figura-humana",
    order: 2,
    title: "Figura humana em cerâmica",
    shortTitle: "Figura humana",
    model: { url: `${MODELS}/boneca_e_boi_23_web.glb`, sizeBytes: 959_816 },
    thumbnail: `${THUMBS}/modulo-23-08-figura-humana.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-23-08-figura-humana.m4a`, cues: [0, 5.51, 9.15, 14.1, 17.88, 25.62] },
    description: `Esta peça representa uma figura humana e mostra outra possibilidade de utilização da cerâmica.

Observe os detalhes do corpo, das roupas e da decoração.

A modelagem permite que os artistas transformem a argila em figuras e personagens.

Depois, a peça pode receber diferentes acabamentos e cores.

Na arte popular, essas representações frequentemente fazem parte da expressão de costumes, personagens e tradições culturais.

É uma maneira de transformar um material natural em algo que também conta histórias.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -15, pitchDeg: 12 },
  },
  {
    id: "modulo-23-09-pratos-pintados",
    order: 3,
    title: "Pratos de cerâmica pintados",
    shortTitle: "Pratos pintados",
    model: { url: `${MODELS}/pratos_23_09_web.glb`, sizeBytes: 635_256 },
    thumbnail: `${THUMBS}/modulo-23-09-pratos-pintados.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-23-09-pratos-pintados.m4a`, cues: [0, 4.64, 8.1, 12.62, 18.44, 23.98] },
    description: `Estes pratos mostram como a cerâmica também pode ser utilizada como suporte para pinturas.

Observe seus desenhos, cores e elementos decorativos.

Depois de moldada, a peça pode receber diferentes técnicas de decoração.

Assim, um objeto que normalmente utilizamos no cotidiano também pode se transformar em uma obra artística.

A cerâmica permite unir formas, pinturas e tradições culturais em uma mesma peça.

Compare os pratos e perceba como cada decoração apresenta características diferentes.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -10, pitchDeg: 55 },
  },
];

const ARTE_ERUDITA: InspectionItem[] = [
  {
    id: "modulo-23-10-escultura-organica",
    order: 1,
    title: "Escultura de formas orgânicas",
    shortTitle: "Escultura orgânica",
    model: { url: `${MODELS}/escultura_organica_23_12_web.glb`, sizeBytes: 961_004 },
    thumbnail: `${THUMBS}/modulo-23-10-escultura-organica.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-23-10-escultura-organica.m4a`, cues: [0, 4.54, 8.46, 16.17, 21.43, 26.32] },
    description: `Esta escultura mostra uma utilização mais livre e expressiva dos materiais do solo.

Observe suas formas arredondadas e a maneira como o material foi trabalhado.

Na criação artística, a argila pode ser moldada para representar pessoas, objetos ou formas abstratas.

Diferentemente de um tijolo ou de uma telha, uma escultura não precisa ter uma função prática.

Ela pode existir simplesmente para expressar uma ideia ou provocar uma interpretação.

E tudo isso pode começar com o material encontrado na natureza.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -25, pitchDeg: 20 },
  },
  {
    id: "modulo-23-11-rosto-humano",
    order: 2,
    title: "Escultura de rosto humano",
    shortTitle: "Rosto humano",
    model: { url: `${MODELS}/rosto_23_11_web.glb`, sizeBytes: 609_028 },
    thumbnail: `${THUMBS}/modulo-23-11-rosto-humano.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-23-11-rosto-humano.m4a`, cues: [0, 2.01, 4.59, 11.44, 17.1, 22.97] },
    description: `Observe este rosto esculpido.

Perceba os detalhes dos olhos, do nariz e da boca.

A argila permite que o artista trabalhe superfícies e volumes para representar expressões e características humanas.

Durante a modelagem, pequenas alterações no material podem mudar bastante a aparência da obra.

Por isso, a cerâmica também é utilizada na produção de esculturas e representações artísticas.

É interessante perceber como um material tão comum pode adquirir formas tão detalhadas.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -15, pitchDeg: 12 },
  },
  {
    id: "modulo-23-12-placas-gravadas",
    order: 3,
    title: "Placas artísticas gravadas",
    shortTitle: "Placas gravadas",
    model: { url: `${MODELS}/placas_23_13_web.glb`, sizeBytes: 1_015_796 },
    thumbnail: `${THUMBS}/modulo-23-12-placas-gravadas.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-23-12-placas-gravadas.m4a`, cues: [0, 4.6, 10.44, 15.9, 21.46, 22.72] },
    description: `Estas placas mostram como materiais argilosos podem receber desenhos e gravações.

Enquanto a argila ainda está moldável, o artista pode pressionar, riscar ou marcar sua superfície.

Essas técnicas permitem criar texturas, linhas e diferentes composições visuais.

Depois da secagem e da queima, essas marcas podem permanecer registradas na cerâmica.

Observe os detalhes.

A superfície do material deixa de ser apenas uma estrutura e passa a fazer parte da própria expressão artística.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -10, pitchDeg: 55 },
  },
  {
    id: "modulo-23-13-recipiente-artistico",
    order: 4,
    title: "Recipiente artístico modelado",
    shortTitle: "Recipiente artístico",
    model: { url: `${MODELS}/jarra_23_10_web.glb`, sizeBytes: 797_612 },
    thumbnail: `${THUMBS}/modulo-23-13-recipiente-artistico.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-23-13-recipiente-artistico.m4a`, cues: [0, 5.64, 9.7, 15.15, 19.81, 25.89] },
    description: `Esta peça demonstra como um objeto semelhante a um recipiente também pode ser trabalhado artisticamente.

Observe seu formato, suas curvas e a maneira como a superfície foi modelada.

A argila úmida permite criar formas variadas, que podem ser simples ou bastante elaboradas.

Na arte, a modelagem não precisa seguir apenas uma função prática.

O artista pode explorar proporções, texturas e formatos diferentes para criar uma obra própria.

Assim, técnica e criatividade se encontram em um mesmo material.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 20 },
  },
];

const PRODUCAO: InspectionItem[] = [
  {
    id: "modulo-23-14-etapas-da-ceramica",
    order: 1,
    title: "Da massa à cerâmica queimada",
    shortTitle: "Etapas da cerâmica",
    model: { url: `${MODELS}/casas_23_14_web.glb`, sizeBytes: 1_118_748 },
    thumbnail: `${THUMBS}/modulo-23-14-etapas-da-ceramica.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-23-14-etapas-da-ceramica.m4a`, cues: [0.0, 30.17, 56.64, 82.69] },
    view: { rotationDeg: [0, 0, 0], yawDeg: -15, pitchDeg: 25 },
    // Um rótulo por parte da narração (aceso enquanto ela é narrada).
    markers: [
      { node: "Massa_Ceramica", label: "Massa cerâmica", description: "Tudo começa com este material, a massa cerâmica. Antes de se transformar em um vaso, uma telha ou uma escultura, a argila precisa ser preparada. Quando possui água na quantidade adequada, ela pode ser moldada em diferentes formas. Mas existe uma diferença importante entre a argila crua e a cerâmica queimada. A massa ainda não passou pelas transformações provocadas pelo calor e pode ser desfeita ou deformada com mais facilidade. Vamos acompanhar como esse material se transforma durante a produção da cerâmica." },
      { node: "Casa_Crua", label: "Casa não queimada", description: "Agora, a massa cerâmica já foi moldada no formato de uma pequena casa. Observe os detalhes das paredes e do telhado. Mesmo com esse formato, a peça ainda não passou pela queima. Por isso, continua mais frágil e pode sofrer danos com maior facilidade. A secagem retira parte da água, mas é o processo de queima que provoca transformações importantes na resistência do material. Vamos comparar esta casa com as que já passaram pelo forno." },
      { node: "Casa_Queimada", label: "Casa queimada", description: "Esta casa já passou pelo processo de queima. Durante esse processo, a massa cerâmica é submetida a altas temperaturas. O calor provoca mudanças no material, fazendo com que ele adquira maior resistência. A temperatura também pode influenciar a cor, a textura e outras propriedades da peça. Compare esta casa com a que ainda não foi queimada. Mesmo que o formato seja parecido, o material já passou por transformações muito importantes." },
      { node: "Casa_Esmaltada", label: "Segunda casa queimada", description: "Observe agora esta outra casa de cerâmica. Ela também passou por um processo de queima, mas representa uma condição diferente de temperatura. A temperatura utilizada no forno pode modificar a aparência e as propriedades do material. Dependendo da composição da argila e das condições de queima, podem surgir mudanças na cor e na resistência da peça. Compare as duas casas queimadas. Esse experimento mostra que não basta apenas moldar a argila. O processo de fabricação também influencia o resultado final." },
    ],
  },
];

const PINTURA: InspectionItem[] = [
  {
    id: "modulo-23-18-tintas-e-pigmentos",
    order: 1,
    title: "Tintas e pigmentos feitos com solo",
    shortTitle: "Tintas e pigmentos",
    model: { url: `${MODELS}/pigmentos_23_web.glb`, sizeBytes: 3_163_900 },
    thumbnail: `${THUMBS}/modulo-23-18-tintas-e-pigmentos.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-23-18-tintas-e-pigmentos.m4a`, cues: [0, 4.01, 8.32, 12.92, 20.35, 25.67] },
    description: `Você sabia que também é possível produzir tintas utilizando materiais do solo?

Observe estes recipientes com pigmentos de diferentes cores.

Alguns minerais presentes no solo podem ser utilizados para produzir tintas naturais.

Tons vermelhos, amarelos e marrons, por exemplo, podem estar relacionados à presença de minerais ricos em ferro.

Esses materiais podem ser preparados e utilizados em pinturas e produções artísticas.

Assim, além de servir para modelar objetos, o solo também pode fornecer as cores utilizadas para decorá-los.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -15, pitchDeg: 25 },
  },
  {
    id: "modulo-23-19-giz-de-solo",
    order: 2,
    title: "Giz produzido com solo",
    shortTitle: "Giz de solo",
    model: { url: `${MODELS}/pintura_com_terra_23_17_web.glb`, sizeBytes: 697_056 },
    thumbnail: `${THUMBS}/modulo-23-19-giz-de-solo.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-23-19-giz-de-solo.m4a`, cues: [0, 5.09, 10.77, 16.38, 19.57, 25.43] },
    description: `Estes pequenos pedaços de giz mostram mais uma possibilidade de utilização dos materiais do solo.

Com matérias-primas adequadas, é possível produzir materiais utilizados para desenhar.

As diferentes cores podem estar relacionadas aos minerais e pigmentos empregados na fabricação.

Observe os tons presentes nesta coleção.

Eles mostram como características naturais do solo podem ser aproveitadas em atividades artísticas.

Desde uma escultura até um simples desenho, os materiais da natureza fazem parte de muitas formas de expressão humana.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 30 },
  },
];

export const OBJETOS_E_ARTES_FEITOS_COM_SOLO: InspectionCatalog = {
  id: "objetos-e-artes-feitos-com-solo",
  title: "Objetos e Artes Feitos com Solo",
  overview: `O solo está presente em muito mais coisas do que imaginamos.

Além de sustentar as plantas e participar da produção de alimentos, ele também fornece materiais utilizados em construções, utensílios e obras de arte.

Um dos exemplos mais importantes é a argila.

Quando está úmida, ela pode ser moldada em diferentes formatos.

Depois, dependendo do processo utilizado, pode se transformar em objetos resistentes e duráveis.

Nesta coleção, você encontrará peças que mostram como o solo participa do nosso cotidiano e da expressão artística.

Escolha um objeto para conhecer sua história.`,
  overviewNarration: { audioUrl: `${AUDIO}/geral.m4a`, cues: [0, 3.07, 12.24, 15.34, 18.86, 24.52, 32.78] },
  stepNoun: "Item",
  menuEyebrow: "Escolha um item",
  groups: [
    { id: "construcao", title: "Materiais de construção e utensílios", items: CONSTRUCAO },
    { id: "arte-popular", title: "Arte popular", items: ARTE_POPULAR },
    { id: "arte-erudita", title: "Arte erudita e outras expressões", items: ARTE_ERUDITA },
    { id: "producao", title: "Etapas da produção da cerâmica", items: PRODUCAO },
    { id: "pintura", title: "Materiais para pintura e desenho", items: PINTURA },
  ],
};
