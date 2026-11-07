/**
 * Módulo 16 · Erosão Hídrica do Solo: o suporte com os três galões deitados (plantas, folhas e restos de plantas,
 * solo descoberto), o regador e os copos que recebem a água de cada um, na mesa encostada na parede esquerda.
 *
 * Gerado por `processo/inspecao-web/modulo16_dados.py` (fora do repositório) a partir da gravação da equipe
 * (`erosaosolo.aac`, sem o "Observe esta animação." do começo) e do roteiro (p. 51–53). Não houve texto enviado:
 * as frases são as da transcrição, com pontuação revista. Como a maquete 01: abertura, uma etapa por galão (o
 * rótulo dele acende enquanto é narrada) e fechamento.
 *
 * Modelo: o GLB do acervo com a linha do tempo espaçada entre as etapas (`modulo16_glb_web.py`): no original elas
 * se sobrepõem, e não há instante sem água no ar entre uma e outra. A animação segue a narração (`animation.sync`):
 * cada etapa roda em velocidade normal a partir da primeira frase dela e para, antes da próxima, sem água no ar;
 * no fechamento, os copos vêm para a frente e o sedimento assenta.
 */
import type { InspectionSet } from "./inspection";

const AUDIO = "/audio/inspection/erosao-hidrica-do-solo";

export const EROSAO_HIDRICA_DO_SOLO: InspectionSet = {
  id: "erosao-hidrica-do-solo",
  title: "Erosão Hídrica do Solo",
  stepNoun: "Experimento",
  items: [
    {
      id: "modulo-16-erosao-hidrica",
      order: 1,
      title: "Plantas, palha e solo descoberto",
      shortTitle: "Erosão hídrica do solo",
      model: { url: "/models/inspection/erosao/modulo_16_erosao_hidrica_web.glb", sizeBytes: 9_099_872 },
      thumbnail: "/models/inspection/thumbs/modulo-16-erosao-hidrica.webp",
      narration: { audioUrl: `${AUDIO}/modulo-16-erosao-hidrica.m4a`, cues: [0, 6.51, 13.65, 30.35, 49.25, 64.37, 66.83, 70.21, 74.29, 80.13, 84.73, 87.85] },
      description: `Aqui vemos três situações diferentes que ajudam a entender como a água da chuva pode provocar erosão no solo.

A erosão hídrica acontece quando a água atinge a superfície e carrega partículas do solo para outros lugares.`,
      closing: `Compare a água coletada em cada situação.

No solo protegido por plantas, a água sai mais limpa.

No solo com cobertura de folhas, a proteção ainda ajuda bastante.

Já no solo descoberto, a água fica mais barrenta, mostrando que houve maior remoção de terra.

Essa terra transportada pela água pode chegar a rios, lagos e represas.

Quando isso acontece, ocorre o acúmulo de sedimentos.

Por isso, manter o solo coberto é uma das formas mais importantes de reduzir a erosão e preservar esse recurso tão importante.`,
      // De frente e de cima: os três galões, o regador e os copos.
      view: { rotationDeg: [0, 0, 0], yawDeg: -10, pitchDeg: 24, fitScale: 0.72 },
      // Uma etapa por galão, na ordem da narração.
      markers: [
        {
          node: "Galao_G_M16",
          label: "Plantas",
          description: "Na primeira etapa, o solo está coberto por plantas. A vegetação ajuda a proteger a superfície contra o impacto direto da chuva. Além disso, as raízes contribuem para manter as partículas unidas, enquanto parte da água consegue se infiltrar. Por isso, a perda de solo é menor.",
        },
        {
          node: "Galao_R_M16",
          label: "Folhas",
          description: "Na segunda etapa, o solo está coberto por folhas e restos de plantas. Essa cobertura também funciona como proteção. Ela reduz o impacto das gotas de chuva e diminui a velocidade da água sobre a superfície. Nesse caso, ainda pode haver alguma perda de solo, mas ela tende a ser menor do que em um solo sem proteção.",
        },
        {
          node: "Galao_S_M16",
          label: "Solo nu",
          description: "Agora, observe a terceira etapa. Aqui, o solo está descoberto. Sem plantas e sem cobertura, a chuva atinge diretamente a superfície. E a água escorre com mais facilidade. Com isso, uma quantidade maior de partículas é arrastada.",
        },
      ],
      // Introdução: tampas e regador. Cada etapa a partir da sua primeira frase, em velocidade normal, parando sem
      // água no ar; no fechamento ("Compare a água coletada…"), os copos vêm para a frente e o sedimento assenta.
      animation: { sync: [[0.0, 0.0], [4.95, 4.95], [13.65, 4.95], [24.57, 15.87], [30.35, 15.87], [41.35, 26.87], [49.25, 26.87], [57.93, 35.55], [64.37, 35.55], [71.32, 42.5]] },
    },
  ],
};
