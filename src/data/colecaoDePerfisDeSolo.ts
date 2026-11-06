/**
 * Módulo 11 · Coleção de Perfis de Solo: a parede com as doze placas de solo e o mapa. Cada placa e o mapa têm
 * o seu destaque, e todos levam ao mesmo menu: o mapa e os oito tipos de solo da narração.
 *
 * Gerado por `processo/inspecao-web/modulo11_dados.py` (fora do repositório) a partir do texto e da
 * gravação da equipe. Acervo de grupo único com texto geral: abre no menu dos itens, com a introdução narrada.
 *
 * Modelos: as placas do acervo sem alteração. A narração é uma por tipo de solo; quando há mais de uma placa do
 * mesmo tipo (Organossolo 2, Neossolo 2, Latossolo 3), o item mostra todas lado a lado (`modulo11_glb_web.py`).
 * A ordem do menu é a da narração; na parede, o Cambissolo vem antes do Gleissolo.
 */
import type { InspectionCatalog, InspectionItem } from "./inspection";

const AUDIO = "/audio/inspection/colecao-de-perfis-de-solo";
const MODELS = "/models/inspection/perfis";
const THUMBS = "/models/inspection/thumbs";

/** A frente das placas é vertical: pouca inclinação, e o giro a leva para a luz principal, que vem da esquerda. */
const VIEW: InspectionItem["view"] = { rotationDeg: [0, 0, 0], yawDeg: -24, pitchDeg: 4 };
/** O mapa é uma folha sem iluminação, vista de frente. */
const VIEW_MAPA: InspectionItem["view"] = { rotationDeg: [0, 0, 0], yawDeg: 0, pitchDeg: 0, fitScale: 0.72 };

const ITENS: InspectionItem[] = [
  {
    id: "mapa-dos-solos",
    order: 1,
    title: "Mapa dos solos",
    shortTitle: "Mapa dos solos",
    model: { url: `${MODELS}/mapa_11_13_solos_do_parana.glb`, sizeBytes: 2_630_504 },
    view: VIEW_MAPA,
    thumbnail: `${THUMBS}/mapa-dos-solos.webp`,
    description: `Agora, observe o mapa dos solos.

Ele nos ajuda a perceber que os diferentes tipos de solo não estão distribuídos de forma aleatória na paisagem.

Cada solo costuma ocorrer com maior frequência em determinadas regiões, de acordo com o relevo, o clima, a drenagem e o material de origem.

Isso significa que, em um mesmo estado, podemos encontrar muitos tipos diferentes de solo.

O mapa também mostra que o solo faz parte da paisagem e influencia a agricultura, a ocupação humana e o ambiente como um todo.

Interessante, não é?

O solo que encontramos em um lugar pode ser bem diferente do solo encontrado em outro.`,
    narration: { audioUrl: `${AUDIO}/mapa-dos-solos.m4a`, cues: [0, 2.53, 8.79, 17.49, 23.07, 30.39, 31.89] },
  },
  {
    id: "organossolo",
    order: 2,
    title: "Organossolo",
    shortTitle: "Organossolo",
    model: { url: `${MODELS}/perfis_organossolo.glb`, sizeBytes: 2_156_024 },
    view: VIEW,
    thumbnail: `${THUMBS}/perfis-organossolo.webp`,
    description: `Este é o Organossolo.

Ele é um solo rico em matéria orgânica, formado pelo acúmulo de restos vegetais ao longo do tempo.

Por isso, geralmente apresenta coloração escura.

Esse tipo de solo costuma ocorrer em áreas muito úmidas ou em ambientes onde a decomposição da matéria orgânica acontece de forma mais lenta.

Apesar de ser rico em matéria orgânica, isso não significa, necessariamente, que seja um solo quimicamente fértil.

Observe o perfil e repare na sua coloração escura.

Ela é uma das características mais marcantes desse solo.`,
    narration: { audioUrl: `${AUDIO}/organossolo.m4a`, cues: [0, 0.9, 7.36, 10.74, 18.92, 26.02, 30.08] },
  },
  {
    id: "neossolo",
    order: 3,
    title: "Neossolo",
    shortTitle: "Neossolo",
    model: { url: `${MODELS}/perfis_neossolo.glb`, sizeBytes: 2_358_476 },
    view: VIEW,
    thumbnail: `${THUMBS}/perfis-neossolo.webp`,
    description: `Agora temos o Neossolo.

Este é um solo jovem, pouco desenvolvido.

Ele ainda se parece bastante com o material de origem e, por isso, normalmente apresenta poucas camadas bem definidas.

Em muitos casos, também é um solo raso ou pouco profundo.

Isso mostra que ele ainda está em um estágio inicial de formação.

Observe o perfil e perceba como ele apresenta menos desenvolvimento que outros solos da coleção.

O Neossolo nos ajuda a entender como começa a formação de um solo.`,
    narration: { audioUrl: `${AUDIO}/neossolo.m4a`, cues: [0, 1.73, 4.27, 10.47, 13.67, 17.59, 24.05] },
  },
  {
    id: "gleissolo",
    order: 4,
    title: "Gleissolo",
    shortTitle: "Gleissolo",
    model: { url: `${MODELS}/perfil_11_06_gleissolo.glb`, sizeBytes: 1_158_748 },
    view: VIEW,
    thumbnail: `${THUMBS}/perfis-gleissolo.webp`,
    description: `Este é o Gleissolo.

Uma de suas principais características é o excesso de água em condição natural.

Por isso, ele costuma ocorrer em áreas mal drenadas, como várzeas de rios.

Esse excesso de água influencia sua aparência, dando ao solo uma coloração mais acinzentada.

Essa cor está relacionada às condições de encharcamento e à pouca circulação de ar no solo.

Observe o perfil com atenção.

A presença de água no ambiente é um dos fatores que mais influenciam esse tipo de solo.`,
    narration: { audioUrl: `${AUDIO}/gleissolo.m4a`, cues: [0, 1.29, 5.97, 10.79, 15.85, 20.73, 22.97] },
  },
  {
    id: "cambissolo",
    order: 5,
    title: "Cambissolo",
    shortTitle: "Cambissolo",
    model: { url: `${MODELS}/perfil_11_05_cambissolo.glb`, sizeBytes: 1_393_184 },
    view: VIEW,
    thumbnail: `${THUMBS}/perfis-cambissolo.webp`,
    description: `Agora, observe o Cambissolo.

Ele é um solo em estágio intermediário de desenvolvimento.

Isso significa que ele já evoluiu mais que um solo jovem, mas ainda não atingiu um estágio muito avançado.

Em geral, ele já apresenta o horizonte B, embora esse horizonte costume ser mais delgado.

Por isso, dizemos que o Cambissolo ainda está em evolução.

Observe o perfil e tente perceber essa condição intermediária.

Ele representa uma etapa importante no processo de desenvolvimento dos solos.`,
    narration: { audioUrl: `${AUDIO}/cambissolo.m4a`, cues: [0, 2.4, 5.66, 11.62, 17.32, 21.46, 25.8] },
  },
  {
    id: "espodossolo",
    order: 6,
    title: "Espodossolo",
    shortTitle: "Espodossolo",
    model: { url: `${MODELS}/perfil_11_07_espodossolo.glb`, sizeBytes: 1_390_980 },
    view: VIEW,
    thumbnail: `${THUMBS}/perfis-espodossolo.webp`,
    description: `Este é o Espodossolo.

Ele é um solo que apresenta acúmulo de matéria orgânica e minerais em profundidade.

Uma de suas características mais interessantes é o contraste entre os horizontes, com diferenças visuais bem marcantes.

Além disso, esse tipo de solo geralmente apresenta altos teores de areia.

Observe o perfil e repare nas diferenças entre as camadas.

Esse contraste ajuda a identificar o Espodossolo e mostra como os materiais podem se redistribuir dentro do solo ao longo do tempo.`,
    narration: { audioUrl: `${AUDIO}/espodossolo.m4a`, cues: [0, 1.7, 6.26, 13.12, 17.74, 21.5] },
  },
  {
    id: "argissolo",
    order: 7,
    title: "Argissolo",
    shortTitle: "Argissolo",
    model: { url: `${MODELS}/perfil_11_10_argissolo.glb`, sizeBytes: 1_575_156 },
    view: VIEW,
    thumbnail: `${THUMBS}/perfis-argissolo.webp`,
    description: `Agora temos o Argissolo.

Uma característica importante desse solo é o acúmulo de argila no horizonte B.

Isso faz com que exista uma diferença de textura entre as camadas do solo.

Em geral, o horizonte A possui menos argila, enquanto o horizonte B possui mais.

Essa mudança pode influenciar a infiltração da água e, em alguns casos, favorecer processos de erosão.

Observe o perfil e repare nas diferenças entre as camadas.

O Argissolo mostra como a distribuição da argila pode mudar bastante dentro de um mesmo solo.`,
    narration: { audioUrl: `${AUDIO}/argissolo.m4a`, cues: [0, 2.36, 7.1, 11.18, 17.66, 23.9, 27.2] },
  },
  {
    id: "nitossolo",
    order: 8,
    title: "Nitossolo",
    shortTitle: "Nitossolo",
    model: { url: `${MODELS}/perfil_11_11_nitossolo.glb`, sizeBytes: 1_786_632 },
    view: VIEW,
    thumbnail: `${THUMBS}/perfis-nitossolo.webp`,
    description: `Este é o Nitossolo.

Ele é um solo profundo, bem desenvolvido e com boa estrutura.

Normalmente apresenta coloração avermelhada e boa drenagem.

Essas características favorecem o crescimento das raízes, já que o solo oferece boas condições físicas para o desenvolvimento das plantas.

Observe o perfil e repare em sua aparência mais homogênea e em sua coloração.

O Nitossolo é um exemplo de solo bastante estruturado e importante em muitas áreas agrícolas.`,
    narration: { audioUrl: `${AUDIO}/nitossolo.m4a`, cues: [0, 1.37, 5.05, 8.75, 17.05, 21.81] },
  },
  {
    id: "latossolo",
    order: 9,
    title: "Latossolo",
    shortTitle: "Latossolo",
    model: { url: `${MODELS}/perfis_latossolo.glb`, sizeBytes: 4_796_800 },
    view: VIEW,
    thumbnail: `${THUMBS}/perfis-latossolo.webp`,
    description: `Por fim, temos o Latossolo.

Este é um solo muito desenvolvido e muito profundo.

Ele passou por intenso intemperismo ao longo do tempo, ou seja, por um longo processo de transformação.

É também um dos solos mais comuns no Brasil.

Por ser muito intemperizado, apresenta características bem diferentes de solos jovens.

Observe o perfil e perceba sua profundidade e seu alto grau de desenvolvimento.

O Latossolo nos mostra como o solo pode se transformar ao longo de muito tempo, até atingir um estágio bastante avançado.`,
    narration: { audioUrl: `${AUDIO}/latossolo.m4a`, cues: [0, 2.38, 5.7, 11.2, 13.86, 19.46, 24.56] },
  },
];

export const COLECAO_DE_PERFIS_DE_SOLO: InspectionCatalog = {
  id: "colecao-de-perfis-de-solo",
  title: "Coleção de Perfis de Solo",
  overview: `Você acha que os solos são todos iguais???

À primeira vista, eles podem até parecer parecidos, mas na verdade existe uma grande diversidade de solos na natureza.

Nesta coleção, você poderá observar diferentes perfis de solo e perceber como eles variam em cor, profundidade e grau de desenvolvimento.

Essas diferenças estão relacionadas a fatores como o material de origem, o relevo, o clima e o tempo de formação.

Nesta sequência, os solos mais jovens aparecem primeiro, e os mais desenvolvidos aparecem depois.

Agora, escolha um perfil e observe com atenção.

O que será que muda de um tipo de solo para outro???`,
  overviewNarration: { audioUrl: `${AUDIO}/00-geral.m4a`, cues: [0, 2.4, 9.2, 17.44, 24.98, 31.72, 34.7] },
  stepNoun: "Item",
  menuEyebrow: "Escolha um item",
  groups: [{ id: "perfis", title: "Coleção de Perfis de Solo", items: ITENS }],
};
