/**
 * Módulo 07 · Ar no Solo: as duas mesas em frente aos painéis do campo, com o frasco de água e os
 * dois recipientes com planta (solo com e sem oxigênio).
 *
 * Gerado por `processo/inspecao-web/modulo07_dados.py` (fora do repositório) a partir do roteiro e
 * da gravação da equipe. Acervo de grupo único, sem texto geral: abre direto no menu dos itens, sem
 * narração nem painel de descrição.
 *
 * Modelos: as plantas são GLBs do acervo copiados sem alteração. O do torrão é um derivado em que só
 * cor e opacidade dos materiais transparentes mudam, para o vidro e a água aparecerem em WebGL
 * (`modulo07_glb_web.py`).
 *
 * O torrão tem um clipe de 14 s (24 q/s). A animação segue a narração (`animation.sync`): o torrão
 * fica parado até “...dentro da água”, entra na água nessa palavra e as bolhas correm sem pausa até
 * “...em forma de bolhas”; depois, a turvação termina em velocidade real e fica no último quadro.
 */
import type { InspectionCatalog, InspectionItem } from "./inspection";

const AUDIO = "/audio/inspection/ar-no-solo";
const MODELS = "/models/inspection/ar";
const THUMBS = "/models/inspection/thumbs";

/** Frasco de frente, um pouco de cima. O enquadramento considera a queda do torrão, por isso aproxima. */
const VIEW_TORRAO: InspectionItem["view"] = { rotationDeg: [0, 0, 0], yawDeg: -10, pitchDeg: 12, fitScale: 0.8 };
/** Plantas: de frente, com a etiqueta (+Z) para o visitante e um pouco de cima, para ver as folhas. */
const VIEW_PLANTA: InspectionItem["view"] = { rotationDeg: [0, 0, 0], yawDeg: 15, pitchDeg: 14 };

const ITENS: InspectionItem[] = [
  {
    id: "modulo-07-ar-no-solo",
    order: 1,
    title: "Torrão de solo dentro da água",
    shortTitle: "Torrão na água",
    model: { url: `${MODELS}/modulo_07_ar_no_solo_web.glb`, sizeBytes: 9_205_416 },
    view: VIEW_TORRAO,
    thumbnail: `${THUMBS}/modulo-07-ar-no-solo.webp`,
    description: `Você acha que existe ar no solo???

Pode parecer estranho... mas sim, existe!

Agora, observe este torrão de solo sendo colocado dentro da água.

Percebeu essas bolhas saindo do solo???

Essas bolhas mostram que havia ar preso nos poros do solo.

Quando o torrão entra em contato com a água, a água começa a ocupar esses espaços.

E, ao entrar nos poros, ela empurra o ar para fora.

Por isso, o ar sai em forma de bolhas.

Isso nos mostra que o solo não é um material compacto.

Ele possui espaços vazios, chamados poros, onde podem ficar armazenados água e ar.

E esses dois elementos são essenciais para a vida no solo!`,
    narration: { audioUrl: `${AUDIO}/modulo-07-ar-no-solo.m4a`, cues: [0, 1.79, 4.83, 8.71, 11.21, 14.65, 18.85, 22.25, 24.51, 27.47, 32.99] },
    animation: { sync: [[4.83, 0.0], [8.02, 0.75], [8.13, 0.86], [24.27, 11.7], [26.57, 14.0]] },
  },
  {
    id: "solo-com-oxigenio-07-02",
    order: 2,
    title: "Planta no solo com oxigênio",
    shortTitle: "Com oxigênio",
    model: { url: `${MODELS}/solo_com_oxigenio_07_02.glb`, sizeBytes: 2_370_660 },
    view: VIEW_PLANTA,
    thumbnail: `${THUMBS}/solo-com-oxigenio-07-02.webp`,
    description: `Agora, observe esta planta em um solo com oxigênio.

Aqui, os poros do solo apresentam um equilíbrio entre água e ar.

E por que isso é tão importante???

Porque as raízes das plantas também respiram!

Elas precisam de oxigênio para continuar vivas e se desenvolver bem.

Quando há ar suficiente no solo, a planta consegue manter suas funções, crescer e permanecer saudável.

Por isso, um solo com boa aeração favorece o desenvolvimento das plantas.

É nesse tipo de solo que as raízes encontram melhores condições para crescer.`,
    narration: { audioUrl: `${AUDIO}/solo-com-oxigenio-07-02.m4a`, cues: [0, 3.43, 7.29, 9.19, 11.89, 15.71, 21.65, 25.77] },
  },
  {
    id: "solo-sem-oxigenio-07-03",
    order: 3,
    title: "Planta no solo sem oxigênio",
    shortTitle: "Sem oxigênio",
    model: { url: `${MODELS}/solo_sem_oxigenio_07_03.glb`, sizeBytes: 2_177_220 },
    view: VIEW_PLANTA,
    thumbnail: `${THUMBS}/solo-sem-oxigenio-07-03.webp`,
    description: `Agora, observe esta planta em um solo sem oxigênio.

Neste caso, os poros do solo estão ocupados quase totalmente por água.

E o que acontece quando não sobra espaço para o ar???

As raízes deixam de receber o oxigênio de que precisam para respirar.

Sem oxigênio, a planta começa a sofrer.

Ela perde vigor, pode murchar e, com o tempo, pode até morrer.

Isso mostra que as plantas não precisam apenas de água.

Elas também precisam de ar no solo.

Por isso, o equilíbrio entre água e oxigênio é fundamental para a vida das plantas.`,
    narration: { audioUrl: `${AUDIO}/solo-sem-oxigenio-07-03.m4a`, cues: [0, 3.34, 8.26, 11.62, 15.68, 18.32, 22.32, 25.18, 27.9] },
  },
];

export const AR_NO_SOLO: InspectionCatalog = {
  id: "ar-no-solo",
  title: "Ar no Solo",
  stepNoun: "Item",
  menuEyebrow: "Escolha um item",
  groups: [{ id: "ar", title: "Ar no Solo", items: ITENS }],
};
