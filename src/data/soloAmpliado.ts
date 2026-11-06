/**
 * Módulo 10 · Solo Ampliado: a mesa dos quatro microscópios digitais. O visitante escolhe uma amostra e a
 * explora numa telinha 2D que lembra a do aparelho: aproxima, afasta e arrasta a imagem.
 *
 * Gerado por `processo/inspecao-web/modulo10_dados.py` (fora do repositório). A equipe enviou o áudio e as
 * imagens: o texto vem da transcrição da gravação, revisada à mão, sem o encerramento.
 */
import type { InspectionCatalog, InspectionItem } from "./inspection";

const AUDIO = "/audio/inspection/solo-ampliado";
const IMAGES = "/images/inspection/solo-ampliado";
const THUMBS = "/models/inspection/thumbs";

const AMOSTRAS: InspectionItem[] = [
  {
    id: "solo-organico",
    order: 1,
    title: "Solo orgânico",
    shortTitle: "Orgânico",
    microscope: { image: `${IMAGES}/solo-organico.webp`, width: 1672, height: 941 },
    thumbnail: `${THUMBS}/solo-organico.webp`,
    description: `Agora, observe o solo orgânico.

Perceba que esta amostra apresenta restos de plantas em diferentes estágios de decomposição.

Esses materiais orgânicos fazem parte da formação desse tipo de solo.

Por isso, ele costuma ter aspecto mais irregular e uma composição diferente dos solos minerais.

Aproxime a imagem e explore os detalhes.

Você consegue identificar fragmentos que lembram folhas, fibras ou outros restos vegetais?

Isso mostra como a matéria orgânica participa da formação do solo.`,
    narration: { audioUrl: `${AUDIO}/solo-organico.m4a`, cues: [0, 2.28, 7.4, 11.36, 16.7, 19.7, 25.24] },
  },
  {
    id: "solo-cascalhento",
    order: 2,
    title: "Solo cascalhento",
    shortTitle: "Cascalhento",
    microscope: { image: `${IMAGES}/solo-cascalhento.webp`, width: 1671, height: 941 },
    thumbnail: `${THUMBS}/solo-cascalhento.webp`,
    description: `Agora, temos o solo cascalhento.

Observe como esta amostra apresenta partículas bem maiores.

Esses fragmentos maiores são chamados de cascalhos, e muitos deles podem ser vistos até a olho nu.

Com ampliação, fica ainda mais fácil perceber seu tamanho e sua forma.

Aproxime a imagem e compare os fragmentos.

Repare como esse solo é formado por partículas grandes, bem diferentes das que veremos nas próximas amostras.`,
    narration: { audioUrl: `${AUDIO}/solo-cascalhento.m4a`, cues: [0, 2.0, 5.58, 10.64, 15.92, 18.92] },
  },
  {
    id: "solo-arenoso",
    order: 3,
    title: "Solo arenoso",
    shortTitle: "Arenoso",
    microscope: { image: `${IMAGES}/solo-arenoso.webp`, width: 1672, height: 941 },
    thumbnail: `${THUMBS}/solo-arenoso.webp`,
    description: `Agora, observe o solo arenoso.

Aqui, os grãos são menores que os cascalhos, mas ainda podem ser percebidos com bastante clareza.

Note como eles aparecem mais soltos, separados uns dos outros.

Em muitos casos, esses grãos lembram pequenos fragmentos ou até pequenos cacos brilhantes.

Use o zoom para observar melhor.

Você percebe como as partículas parecem mais individualizadas neste solo?

Essa é uma das características marcantes do solo arenoso.`,
    narration: { audioUrl: `${AUDIO}/solo-arenoso.m4a`, cues: [0, 1.83, 7.51, 10.73, 16.57, 18.81, 22.87] },
  },
  {
    id: "solo-argiloso",
    order: 4,
    title: "Solo argiloso",
    shortTitle: "Argiloso",
    microscope: { image: `${IMAGES}/solo-argiloso.webp`, width: 1672, height: 941 },
    thumbnail: `${THUMBS}/solo-argiloso.webp`,
    description: `Agora, vamos observar o solo argiloso.

Aqui, acontece algo interessante.

As partículas de argila são muito menores que as da areia.

Na verdade, elas são tão pequenas que não conseguimos enxergá-las individualmente em um microscópio comum.

Então, o que vemos são agregados, ou seja, pequenos agrupamentos de partículas unidas.

Por isso, essa amostra pode até parecer formada por estruturas maiores, mas elas são resultado da união de partículas muito finas.

Aproxime a imagem e observe sua organização.

Assim, percebemos que nem sempre o que parece maior realmente é composto por grãos maiores.`,
    narration: { audioUrl: `${AUDIO}/solo-argiloso.m4a`, cues: [0, 2.34, 4.52, 7.66, 14.74, 20.54, 28.64, 32.0] },
  },
];

export const SOLO_AMPLIADO: InspectionCatalog = {
  id: "solo-ampliado",
  title: "Solo Ampliado",
  stepNoun: "Amostra",
  menuEyebrow: "Escolha uma amostra",
  overview: `Você já imaginou observar o solo bem de perto, como se estivesse usando um microscópio?

Aqui, você poderá explorar quatro tipos de solo ampliados.

Use os controles para aproximar, afastar e observar cada amostra com atenção.

Quando aumentamos o solo, começamos a perceber diferenças no tamanho, na forma e na organização das partículas.

E essas diferenças ajudam a entender como cada solo se comporta.

Agora, escolha uma amostra e observe com calma.

O que será que muda de um solo para outro quando olhamos tão de perto?`,
  overviewNarration: { audioUrl: `${AUDIO}/00-geral.m4a`, cues: [0, 4.94, 9.08, 13.98, 20.44, 23.36, 27.76] },
  groups: [{ id: "amostras", title: "Solo Ampliado", items: AMOSTRAS }],
};
