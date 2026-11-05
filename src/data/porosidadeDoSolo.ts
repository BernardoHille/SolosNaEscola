/**
 * Módulo 06 · Porosidade do Solo: a bandeja com a pedra, a esponja e o torrão, na mesa em frente ao
 * painel do campo verde.
 *
 * Gerado por `processo/inspecao-web/modulo06_dados.py` (fora do repositório) a partir da gravação da
 * equipe (texto e `cues` pela transcrição com marcação de palavras) e de um derivado do GLB do acervo:
 * só cor e opacidade da água e da esponja mudam, para a água aparecer em WebGL (`modulo06_glb_web.py`).
 *
 * O GLB tem um clipe de 23 s (24 q/s): água na pedra (não absorve, escorre), na esponja (as gotas
 * ficam paradas e só depois entram) e no torrão (infiltração rápida), e quadro final parado. A
 * animação segue a narração (`animation.sync`), parando entre os materiais em instantes sem gotas no
 * ar; depois de "Isso mostra..." o clipe corre em velocidade normal até o último quadro e fica nele.
 */
import type { InspectionSet } from "./inspection";

const AUDIO = "/audio/inspection/porosidade-do-solo";

export const POROSIDADE_DO_SOLO: InspectionSet = {
  id: "porosidade-do-solo",
  title: "Porosidade do Solo",
  stepNoun: "Experimento",
  items: [
    {
      id: "modulo-06-porosidade-do-solo",
      order: 1,
      title: "Pedra, esponja e torrão",
      shortTitle: "Porosidade do solo",
      model: { url: "/models/inspection/porosidade/modulo_06_porosidade_solo_web.glb", sizeBytes: 12_665_792 },
      // Frente da cena (+Z): a pedra, a esponja e o torrão lado a lado na bandeja, com o frasco atrás.
      // O enquadramento considera todo o trajeto do frasco: `fitScale` aproxima para a água aparecer.
      view: { rotationDeg: [0, 0, 0], yawDeg: -12, pitchDeg: 35, fitScale: 0.7 },
      thumbnail: "/models/inspection/thumbs/modulo-06-porosidade-do-solo.webp",
      description: `Você já imaginou que o solo pode guardar água e ar ao mesmo tempo?

Isso acontece por causa da porosidade.

Os poros são pequenos espaços vazios que existem entre as partículas do solo.

Agora, vamos comparar três materiais. Uma pedra, uma esponja e um torrão de solo.

Começamos pela pedra.

Observe o que acontece quando a água é colocada sobre ela.

A água não entra na pedra. Ela apenas escorre pela superfície.

Isso acontece porque, nesse caso, a pedra não apresenta poros significativos para armazenar água.

Agora, vamos observar a esponja.

A esponja possui muitos poros.

Quando a água entra, ela começa a ser absorvida e armazenada nesses espaços.

Por isso, a esponja é um bom exemplo de material poroso.

Mas agora vem a parte mais interessante.

Vamos observar o torrão de solo.

Assim como a esponja, o solo também possui poros.

Quando a água entra no torrão, ela consegue se infiltrar nesses espaços.

Isso mostra que o solo não é um material compacto.

Ele possui poros onde ficam armazenados água e ar.

E esses dois elementos são essenciais para a vida.

As plantas precisam de água para se desenvolver. E também precisam de oxigênio, que fica armazenado no ar presente nos poros do solo.

Por isso, a porosidade é uma característica muito importante.

Ela ajuda a explicar como o solo armazena a água, permite a circulação de ar e sustenta a vida das plantas.`,
      narration: { audioUrl: `${AUDIO}/00-porosidade.m4a`, cues: [0, 3.98, 6.74, 11.32, 17.16, 18.82, 21.66, 25.8, 31.82, 34.62, 36.4, 40.88, 44.42, 46.74, 49.14, 53.02, 56.3, 59.6, 63.32, 66.58, 74.36, 78.12] },
      animation: { sync: [[17.16, 0.0], [18.82, 1.6], [25.38, 5.8], [31.82, 5.8], [33.44, 7.25], [38.0, 11.96], [44.0, 14.0], [46.74, 14.0], [48.6, 14.87], [52.06, 14.87], [53.02, 15.83], [56.3, 19.0], [60.3, 23.0]] },
    },
  ],
};
