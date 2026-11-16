/**
 * Módulo 12 · Ciclo do Nitrogênio: a mesa da fileira do meio, de frente para a parede da entrada, com os
 * alimentos, a bola do ar, a molécula, os potes de inoculantes, raízes, fertilizantes, grãos e urina, a planta
 * leguminosa e o banner do ciclo.
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

const AUDIO = "/audio/inspection/ciclo-do-nitrogenio";
const MODELS = "/models/inspection/ciclo-do-nitrogenio";
const THUMBS = "/models/inspection/thumbs";

/** Banner: de frente e sem inclinação, como o do módulo 05. */
const VIEW_BANNER: InspectionItem["view"] = { rotationDeg: [0, 0, 0], yawDeg: 0, pitchDeg: 0, fitScale: 0.9 };

const ITENS: InspectionItem[] = [
  {
    id: "modulo-12-02-alimentos-e-proteinas",
    order: 1,
    title: "Alimentos e proteínas",
    shortTitle: "Alimentos e proteínas",
    model: { url: `${MODELS}/alimentos_12_01_web.glb`, sizeBytes: 2_394_872 },
    thumbnail: `${THUMBS}/modulo-12-02-alimentos-e-proteinas.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-12-02-alimentos-e-proteinas.m4a`, cues: [0, 2.0, 9.04, 14.06, 18.71, 22.15] },
    description: `Observe estes alimentos.

Ovos, carnes, leite e outros alimentos presentes no nosso dia a dia são fontes de proteínas.

E sabe o que todas as proteínas têm em comum? Elas contêm nitrogênio.

Esse elemento é fundamental para construir e manter diferentes estruturas do nosso corpo.

Mas o nitrogênio que encontramos nos alimentos não surgiu do nada.

Ele passou por uma série de transformações na natureza antes de chegar até nós.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -10, pitchDeg: 45 },
  },
  {
    id: "modulo-12-03-nitrogenio-no-ar",
    order: 2,
    title: "Nitrogênio no ar",
    shortTitle: "Nitrogênio no ar",
    model: { url: `${MODELS}/bola_e_molecula_12_web.glb`, sizeBytes: 1_823_028 },
    thumbnail: `${THUMBS}/modulo-12-03-nitrogenio-no-ar.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-12-03-nitrogenio-no-ar.m4a`, cues: [0, 2.55, 5.27, 10.15, 14.84, 20.46, 27.51] },
    description: `Esta bola representa o ar que respiramos.

E aqui vai uma informação surpreendente.

Cerca de 78% do ar atmosférico é formado por nitrogênio.

Isso mesmo. Existe muito mais nitrogênio do que oxigênio na atmosfera.

No ar, ele aparece principalmente na forma de moléculas com dois átomos fortemente ligados.

Essa ligação é tão resistente que a maioria dos seres vivos não consegue utilizar diretamente esse nitrogênio.

Por isso, ele precisa ser transformado em outras formas químicas.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -15, pitchDeg: 15 },
  },
  {
    id: "modulo-12-04-inoculantes",
    order: 3,
    title: "Inoculantes",
    shortTitle: "Inoculantes",
    model: { url: `${MODELS}/inoculantes_12_04_web.glb`, sizeBytes: 878_768 },
    thumbnail: `${THUMBS}/modulo-12-04-inoculantes.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-12-04-inoculantes.m4a`, cues: [0, 3.17, 4.93, 11.78, 19.55, 25.19] },
    description: `Estes pequenos frascos contêm inoculantes utilizados na agricultura.

Mas o que são inoculantes?

São produtos que contêm micro-organismos selecionados, como bactérias, capazes de aproveitar o nitrogênio do ar.

Quando aplicadas às culturas adequadas, essas bactérias podem ajudar as plantas a obter o nitrogênio necessário para seu desenvolvimento.

Esse processo é especialmente importante no cultivo de leguminosas, como a soja e o feijão.

Assim, organismos tão pequenos conseguem desempenhar um papel enorme na agricultura.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 22 },
  },
  {
    id: "modulo-12-05-raizes-com-nodulos",
    order: 4,
    title: "Raízes com nódulos",
    shortTitle: "Raízes com nódulos",
    model: { url: `${MODELS}/raizes_12_05_web.glb`, sizeBytes: 4_155_512 },
    thumbnail: `${THUMBS}/modulo-12-05-raizes-com-nodulos.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-12-05-raizes-com-nodulos.m4a`, cues: [0, 5.04, 12.21, 16.05, 18.87, 24.77] },
    description: `Repare nestas pequenas bolinhas presentes nas raízes. Elas são chamadas de nódulos.

Dentro desses nódulos vivem bactérias que conseguem transformar o nitrogênio do ar em uma forma que pode ser aproveitada pela planta.

Esse processo recebe o nome de fixação biológica do nitrogênio.

É uma parceria entre a planta e as bactérias.

A planta oferece nutrientes para os micro-organismos, enquanto eles ajudam a fornecer nitrogênio.

Uma relação em que os dois organismos podem sair beneficiados.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 22 },
  },
  {
    id: "modulo-12-06-planta-leguminosa",
    order: 5,
    title: "Planta leguminosa",
    shortTitle: "Planta leguminosa",
    model: { url: `${MODELS}/planta_12_06_web.glb`, sizeBytes: 2_094_248 },
    thumbnail: `${THUMBS}/modulo-12-06-planta-leguminosa.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-12-06-planta-leguminosa.m4a`, cues: [0, 1.55, 9.18, 15.22, 21.87] },
    description: `Esta é uma planta leguminosa.

Plantas desse grupo, como o feijão e a soja, podem desenvolver uma associação muito importante com bactérias presentes em suas raízes.

Essas bactérias ajudam a transformar o nitrogênio atmosférico em compostos que a planta consegue utilizar.

O nitrogênio participa da formação de proteínas e de outras substâncias essenciais para o crescimento vegetal.

Por isso, essa parceria é tão importante para a natureza e para a agricultura.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 18 },
  },
  {
    id: "modulo-12-07-fertilizantes-nitrogenados",
    order: 6,
    title: "Fertilizantes nitrogenados",
    shortTitle: "Fertilizantes",
    model: { url: `${MODELS}/fertilizantes_12_07_web.glb`, sizeBytes: 974_400 },
    thumbnail: `${THUMBS}/modulo-12-07-fertilizantes-nitrogenados.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-12-07-fertilizantes-nitrogenados.m4a`, cues: [0, 4.35, 7.59, 13.03, 18.7, 27.13] },
    description: `Aqui temos dois exemplos de fertilizantes: a ureia e o nitrato de amônio.

Eles são utilizados para fornecer nitrogênio às plantas.

Diferentemente da fixação biológica, esses fertilizantes são produzidos por processos industriais.

Na agricultura, eles podem ser importantes para atender às necessidades nutricionais das culturas.

Mas seu uso exige cuidado. A aplicação em excesso pode causar desperdício, aumentar os custos de produção e provocar impactos ambientais.

Por isso, é importante utilizar a quantidade adequada para cada situação.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 22 },
  },
  {
    id: "modulo-12-08-graos-de-feijao-e-soja",
    order: 7,
    title: "Grãos de feijão e soja",
    shortTitle: "Grãos de feijão e soja",
    model: { url: `${MODELS}/graos_12_08_web.glb`, sizeBytes: 3_335_760 },
    thumbnail: `${THUMBS}/modulo-12-08-graos-de-feijao-e-soja.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-12-08-graos-de-feijao-e-soja.m4a`, cues: [0, 1.99, 10.23, 13.76, 19.45, 24.68] },
    description: `Observe estes grãos de feijão e soja.

Durante seu crescimento, as plantas absorveram nitrogênio e utilizaram esse elemento para produzir proteínas e outras substâncias.

Parte desse nitrogênio ficou armazenada nos grãos.

E quando consumimos esses alimentos, o nitrogênio passa a fazer parte do nosso organismo.

Isso mostra como um elemento presente no ambiente pode chegar até nós por meio da alimentação.

O ciclo do nitrogênio também faz parte da nossa vida.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 25 },
  },
  {
    id: "modulo-12-09-urina-e-retorno-do-nitrogenio",
    order: 8,
    title: "Urina e retorno do nitrogênio",
    shortTitle: "Urina",
    model: { url: `${MODELS}/urina_12_09_web.glb`, sizeBytes: 380_460 },
    thumbnail: `${THUMBS}/modulo-12-09-urina-e-retorno-do-nitrogenio.webp`,
    narration: { audioUrl: `${AUDIO}/modulo-12-09-urina-e-retorno-do-nitrogenio.m4a`, cues: [0, 3.05, 8.67, 12.49, 17.31, 24.51] },
    description: `O nitrogênio também precisa sair do nosso organismo.

Durante o metabolismo das proteínas, nosso corpo produz substâncias que contêm nitrogênio.

Uma delas é a ureia, eliminada principalmente pela urina.

Quando esses materiais chegam ao ambiente, micro-organismos podem transformá-los novamente.

Assim, o nitrogênio pode retornar ao solo, ser aproveitado pelas plantas ou, por outros processos, voltar à atmosfera.

É mais uma etapa desse ciclo natural.`,
    view: { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 18 },
  },
  {
    id: "banner-12-10-ciclo-do-nitrogenio",
    order: 9,
    title: "Banner do ciclo do nitrogênio",
    shortTitle: "Banner do ciclo",
    model: { url: `${MODELS}/banner_12_10_ciclo_do_nitrogenio.glb`, sizeBytes: 812_948 },
    thumbnail: `${THUMBS}/banner-12-10-ciclo-do-nitrogenio.webp`,
    narration: { audioUrl: `${AUDIO}/banner-12-10-ciclo-do-nitrogenio.m4a`, cues: [0, 3.47, 6.87, 13.01, 17.42, 23.44, 30.31, 32.22] },
    description: `Agora acompanhe o ciclo completo do nitrogênio neste esquema.

Tudo começa com o nitrogênio presente na atmosfera.

Bactérias e outros processos naturais transformam esse gás em compostos que podem ser utilizados pelas plantas.

Os animais obtêm nitrogênio ao se alimentar de plantas ou de outros animais.

Depois, resíduos orgânicos e a decomposição devolvem parte desse elemento ao solo.

Outros micro-organismos podem transformar compostos nitrogenados e liberar novamente nitrogênio para a atmosfera.

E assim, o ciclo continua.

Esse movimento é fundamental para manter a vida e a disponibilidade de nutrientes na natureza.`,
    view: VIEW_BANNER,
  },
];

export const CICLO_DO_NITROGENIO: InspectionCatalog = {
  id: "ciclo-do-nitrogenio",
  title: "Ciclo do Nitrogênio",
  overview: `O nitrogênio está presente em praticamente todos os seres vivos.

Ele faz parte das proteínas, que são essenciais para o crescimento e funcionamento do nosso organismo.

Mas existe uma curiosidade.

Mesmo que a maior parte do ar seja formada por nitrogênio, as plantas não conseguem utilizar diretamente esse gás.

Para isso, ele precisa passar por algumas transformações.

Esse caminho que o nitrogênio percorre entre o ar, o solo, as plantas e os animais é chamado de ciclo do nitrogênio.

Vamos conhecer como ele funciona.`,
  overviewNarration: { audioUrl: `${AUDIO}/geral.m4a`, cues: [0, 3.12, 8.2, 10.45, 17.17, 20.57, 26.49] },
  stepNoun: "Item",
  menuEyebrow: "Escolha um item",
  groups: [
    { id: "ciclo-do-nitrogenio", title: "Ciclo do Nitrogênio", items: ITENS },
  ],
};
