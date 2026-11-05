/**
 * Módulo 04 · Atração do Solo pelo Ímã: as duas bandejas da mesa ao lado dos horizontes (solo sem e
 * com magnetita, com placa e ímã).
 *
 * Gerado por `processo/inspecao-web/modulo04_dados.py` (fora do repositório) a partir do texto da
 * narração enviado pela equipe, da gravação (`cues` e sincronia pela transcrição com marcação de
 * palavras) e do GLB do acervo, copiado sem alteração.
 *
 * O GLB tem um clipe de 16 s (24 q/s): despejo do solo sem magnetita (0–7 s), do solo com magnetita
 * (7–14 s) e quadro final parado. A animação segue a narração (`animation.sync`): o primeiro despejo
 * começa com "Na primeira...", o segundo com "Mas observe o que acontece..."; depois o clipe corre
 * em velocidade normal até o último quadro e fica nele.
 */
import type { InspectionSet } from "./inspection";

const AUDIO = "/audio/inspection/atracao-do-solo-pelo-ima";

export const ATRACAO_DO_IMA: InspectionSet = {
  id: "atracao-do-solo-pelo-ima",
  title: "Atração do Solo pelo Ímã",
  stepNoun: "Experimento",
  items: [
    {
      id: "modulo-04-atracao-do-ima",
      order: 1,
      title: "Solo sem e com magnetita",
      shortTitle: "Atração do solo pelo ímã",
      model: { url: "/models/inspection/ima/modulo_04_atracao_ima.glb", sizeBytes: 6_219_056 },
      // Frente da cena (+Z): os potes à frente das bandejas, como na foto do acervo. Cena larga e
      // baixa: enquadramento inicial mais próximo (os potes erguidos continuam à vista).
      view: { rotationDeg: [0, 0, 0], yawDeg: -12, pitchDeg: 35, fitScale: 0.8 },
      thumbnail: "/models/inspection/thumbs/modulo-04-atracao-do-ima.webp",
      description: `Você já imaginou que o solo pode ser atraído por um ímã???

Parece estranho, não é?

Mas isso realmente pode acontecer!

Alguns solos possuem minerais com propriedades magnéticas, como a magnetita e a maghemita.

Vamos descobrir como isso funciona!

Primeiro, observe a magnetita. Esse mineral está presente em algumas rochas e pode ser atraído por um ímã.

Agora, vamos comparar duas amostras de solo!

Na primeira, temos um solo sem magnetita. Quando aproximamos o ímã, o material não é atraído.

Mas observe o que acontece com a segunda amostra!

Percebeu a diferença???

Parte do solo fica presa à placa de vidro!

Isso acontece porque existe um ímã atrás da placa, atraindo os minerais magnéticos presentes na amostra.

E sabe o que é mais interessante?

A magnetita é bastante resistente ao intemperismo. Por isso, pode continuar presente no solo mesmo depois que a rocha original passou por muitas transformações.

Assim, descobrimos que alguns solos podem apresentar propriedades magnéticas graças aos minerais que fazem parte de sua composição!`,
      narration: { audioUrl: `${AUDIO}/00-atracao-do-ima.m4a`, cues: [0, 3.68, 5.38, 7.68, 13.02, 15.0, 21.9, 24.7, 31.42, 34.52, 36.56, 39.28, 44.74, 46.46, 55.72] },
      animation: { sync: [[24.7, 0], [31.42, 7], [40.38, 15.958]] },
    },
  ],
};
