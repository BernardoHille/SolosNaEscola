/**
 * Módulo 08 · Densidade do Solo: a mesa das garrafas em frente aos painéis do campo. Três garrafas de
 * mesmo volume, cada uma sobre uma balança, do solo mais leve ao mais pesado.
 *
 * Gerado por `processo/inspecao-web/modulo08_dados.py` (fora do repositório) a partir do roteiro e
 * da gravação da equipe. Acervo de grupo único, sem texto geral: abre direto no menu dos itens, sem
 * narração nem painel de descrição.
 *
 * Modelos: derivados do acervo em que só as texturas do solo são reduzidas (`modulo08_glb_web.py`).
 * As leituras das balanças são ilustrativas: o roteiro só fixa a ordem das massas.
 */
import type { InspectionCatalog, InspectionItem } from "./inspection";

const AUDIO = "/audio/inspection/densidade-do-solo";
const MODELS = "/models/inspection/densidade";
const THUMBS = "/models/inspection/thumbs";

/** De frente e de cima, para a etiqueta e o visor da balança (ambos em +Z) ficarem legíveis. */
const VIEW: InspectionItem["view"] = { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 18, fitScale: 0.82 };

const ITENS: InspectionItem[] = [
  {
    id: "garrafa-08-03-organico",
    order: 1,
    title: "Solo orgânico",
    shortTitle: "Orgânico",
    model: { url: `${MODELS}/garrafa_08_03_organico_web.glb`, sizeBytes: 5_471_640 },
    view: VIEW,
    thumbnail: `${THUMBS}/garrafa-08-03-organico.webp`,
    description: `Observe este recipiente com solo orgânico.

Agora repare na balança.

Mesmo ocupando o mesmo volume que os outros solos, ele apresenta o menor peso.

Isso significa que este é o solo de menor densidade entre os três.

Mas o que isso quer dizer???

A densidade está relacionada à quantidade de massa presente em um determinado volume.

Ou seja, quando comparamos recipientes do mesmo tamanho, o solo mais leve é o menos denso.

No caso do solo orgânico, isso acontece porque ele possui maior quantidade de matéria orgânica e, em geral, menor massa no mesmo volume.

Por isso, ele aparece como o mais leve nesta comparação.`,
    narration: { audioUrl: `${AUDIO}/garrafa-08-03-organico.m4a`, cues: [0, 3.05, 5.11, 9.57, 13.41, 14.99, 19.89, 25.05, 33.15] },
  },
  {
    id: "garrafa-08-02-argiloso",
    order: 2,
    title: "Solo argiloso",
    shortTitle: "Argiloso",
    model: { url: `${MODELS}/garrafa_08_02_argiloso_web.glb`, sizeBytes: 5_162_268 },
    view: VIEW,
    thumbnail: `${THUMBS}/garrafa-08-02-argiloso.webp`,
    description: `Agora, observe o solo argiloso.

Repare novamente na balança.

Este solo apresenta um peso intermediário.

Isso mostra que sua densidade também é intermediária, ficando entre o solo orgânico e o solo arenoso.

Mesmo com o mesmo volume, diferentes tipos de solo podem apresentar massas diferentes.

E é justamente isso que estamos observando aqui.

O solo argiloso não é o mais leve, mas também não é o mais pesado.

Ele ocupa uma posição intermediária nessa comparação de densidade.`,
    narration: { audioUrl: `${AUDIO}/garrafa-08-02-argiloso.m4a`, cues: [0, 2.02, 3.96, 6.84, 12.74, 18.34, 21.42, 25.18] },
  },
  {
    id: "garrafa-08-01-arenoso",
    order: 3,
    title: "Solo arenoso",
    shortTitle: "Arenoso",
    model: { url: `${MODELS}/garrafa_08_01_arenoso_web.glb`, sizeBytes: 5_497_516 },
    view: VIEW,
    thumbnail: `${THUMBS}/garrafa-08-01-arenoso.webp`,
    description: `Agora, vamos observar o solo arenoso.

Veja o valor indicado na balança.

Entre os três tipos de solo, este é o que apresenta o maior peso.

Como os recipientes possuem o mesmo volume, isso significa que o solo arenoso é o mais denso nesta comparação.

Interessante, não é???

Mesmo parecendo mais solto ao toque, ele é o que apresenta maior massa no mesmo espaço.

Isso nos mostra que densidade não é a mesma coisa que dureza.

Aqui, estamos comparando a quantidade de massa presente em um mesmo volume.

E, nesse caso, o solo arenoso é o mais denso dos três.`,
    narration: { audioUrl: `${AUDIO}/garrafa-08-01-arenoso.m4a`, cues: [0, 2.46, 4.84, 8.1, 14.92, 16.94, 22.5, 26.04, 30.16] },
  },
];

export const DENSIDADE_DO_SOLO: InspectionCatalog = {
  id: "densidade-do-solo",
  title: "Densidade do Solo",
  stepNoun: "Item",
  menuEyebrow: "Escolha um item",
  groups: [{ id: "densidade", title: "Densidade do Solo", items: ITENS }],
};
