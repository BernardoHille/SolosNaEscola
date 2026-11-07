/**
 * Módulo 17 · Erosão Eólica do Solo: os dois aquários lado a lado na mesa encostada na parede esquerda, o com
 * cobertura vegetal e o sem cobertura, que recebem o mesmo vento.
 *
 * Gerado por `processo/inspecao-web/modulo17_dados.py` (fora do repositório) a partir do texto enviado, da
 * gravação da equipe (`erosaoeolica.aac`, sem os títulos lidos "01. Solo com cobertura vegetal" e "02. Solo sem
 * cobertura vegetal") e do roteiro (p. 54–56). Na ordem do roteiro: primeiro com cobertura, depois sem.
 *
 * Modelos: os GLBs do acervo, sem alteração (clipe `erosao_eolica`, 24 s, vento de 1,5 a 19,6 s). A animação
 * segue a narração (`animation.sync`): o vento liga no começo da frase que fala dele.
 */
import type { InspectionSet } from "./inspection";

const AUDIO = "/audio/inspection/erosao-eolica-do-solo";
const MODELS = "/models/inspection/erosao-eolica";

export const EROSAO_EOLICA_DO_SOLO: InspectionSet = {
  id: "erosao-eolica-do-solo",
  title: "Erosão Eólica do Solo",
  stepNoun: "Aquário",
  items: [
    {
      id: "modulo-17-01-solo-com-cobertura",
      order: 1,
      title: "Solo com cobertura vegetal",
      shortTitle: "Com cobertura",
      model: { url: `${MODELS}/aquario_17_01_solo_com_cobertura.glb`, sizeBytes: 6_425_024 },
      thumbnail: "/models/inspection/thumbs/modulo-17-01-solo-com-cobertura.webp",
      narration: { audioUrl: `${AUDIO}/modulo-17-01-solo-com-cobertura.m4a`, cues: [0, 2.51, 8.85, 11.57, 13.51, 16.45, 23.37, 28.65, 31.63] },
      description: `O vento também pode provocar erosão no solo!

Esse processo é chamado de erosão eólica e acontece quando o vento remove e transporta partículas de terra.

Mas será que a vegetação consegue impedir isso???

Observe esta primeira animação!

Aqui, temos um solo protegido por plantas.

Quando o vento começa a soprar, a vegetação funciona como uma barreira, diminuindo sua velocidade próximo à superfície.

Além disso, as raízes ajudam a manter as partículas do solo mais estáveis.

Perceba que quase não existe movimentação de terra!

Isso mostra como a cobertura vegetal é importante para proteger o solo contra a ação do vento.`,
      // De frente e um pouco de cima, como as prévias do acervo.
      view: { rotationDeg: [0, 0, 0], yawDeg: -12, pitchDeg: 14, fitScale: 0.85 },
      // Parado até o vento ligar, no começo de "Quando o vento começa a soprar, a vegeta…".
      animation: { sync: [[0, 0], [14.95, 0], [16.45, 1.5], [36.28, 24.0]] },
    },
    {
      id: "modulo-17-02-solo-sem-cobertura",
      order: 2,
      title: "Solo sem cobertura vegetal",
      shortTitle: "Sem cobertura",
      model: { url: `${MODELS}/aquario_17_02_solo_sem_cobertura.glb`, sizeBytes: 6_681_960 },
      thumbnail: "/models/inspection/thumbs/modulo-17-02-solo-sem-cobertura.webp",
      narration: { audioUrl: `${AUDIO}/modulo-17-02-solo-sem-cobertura.m4a`, cues: [0, 4.51, 8.89, 11.55, 18.57, 21.17, 24.21, 31.57, 33.97, 40.15] },
      description: `Agora, observe o que acontece quando o solo está completamente descoberto!

Sem a proteção das plantas, o vento atinge diretamente a superfície.

Veja como as partículas começam a se movimentar!

Parte do solo é levantada e transportada pelo vento, podendo ser carregada para outros lugares.

Percebeu a diferença em relação à primeira animação???

Esse fenômeno é chamado de erosão eólica.

Ele pode ser especialmente intenso em regiões secas, onde existe pouca vegetação e o solo fica mais exposto.

E as consequências podem ser sérias!

A perda das partículas superficiais pode prejudicar a fertilidade do solo e dificultar o desenvolvimento das plantas.

Por isso, manter a vegetação e evitar que o solo fique descoberto são medidas fundamentais para reduzir a erosão causada pelo vento!`,
      // De frente e um pouco de cima, como as prévias do acervo.
      view: { rotationDeg: [0, 0, 0], yawDeg: -12, pitchDeg: 14, fitScale: 0.85 },
      // Parado até o vento ligar, no começo de "Sem a proteção das plantas, o vento atin…".
      animation: { sync: [[0, 0], [3.01, 0], [4.51, 1.5], [27.01, 24.0]] },
    },
  ],
};
