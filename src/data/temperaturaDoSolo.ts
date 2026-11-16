/**
 * Módulo 24 · Temperatura do Solo: a caixa com a lâmpada sobre os dois potes (um com palhada, outro descoberto), na
 * mesa da parede esquerda.
 *
 * A gravação acaba no meio do 24.2: a narração cobre o 24.1 e as três primeiras frases do 24.2
 * (`narracao_modulos12a24.py`). O resto da descrição foi escrito a partir do roteiro (pp. 72–73), sem áudio, e ainda
 * não foi revisado pela equipe. A animação segue a narração (`animation.sync`): a caixa sobe na frase das duas
 * amostras e o primeiro termômetro entra na amostra com cobertura no 24.2; depois do fim da narração o relógio segue
 * em tempo real e o segundo termômetro mede o solo descoberto. As leituras (26,8 e 34,1 °C) são ilustrativas.
 *
 * Gerado por `processo/inspecao-web/modulos12a27_dados.py` (fora do repositório). Modelo: a versão web do GLB do
 * acervo (texturas em JPEG; `modulos12a27_glb_web.py`), com um clipe de 16 s.
 */
import type { InspectionSet } from "./inspection";

const AUDIO = "/audio/inspection/temperatura-do-solo";

export const TEMPERATURA_DO_SOLO: InspectionSet = {
  id: "temperatura-do-solo",
  title: "Temperatura do Solo",
  stepNoun: "Experimento",
  items: [
    {
      id: "modulo-24-temperatura-do-solo",
      order: 1,
      title: "Experimento | Temperatura do solo",
      shortTitle: "Temperatura do solo",
      model: { url: "/models/inspection/temperatura-do-solo/modulo_24_temperatura_do_solo_web.glb", sizeBytes: 1_905_352 },
      thumbnail: "/models/inspection/thumbs/modulo-24-temperatura-do-solo.webp",
      narration: { audioUrl: `${AUDIO}/modulo-24-temperatura-do-solo.m4a`, cues: [0, 4.92, 7.68, 12.7, 19.84, 23.68, 27.56, 31.32, 35.44] },
      description: `Em um dia de sol forte, você prefere caminhar sobre um gramado ou sobre um terreno de terra descoberto?

Provavelmente, o gramado parece mais agradável.

Isso acontece porque a cobertura vegetal ajuda a controlar a temperatura do solo.

Neste experimento temos duas amostras, uma coberta por resíduos vegetais e outra completamente descoberta.

As duas recebem calor de uma lâmpada que simula a radiação solar.

Mas será que elas vão atingir a mesma temperatura? Vamos comparar.

Observe esta amostra de solo coberta por folhas e restos vegetais.

Essa camada funciona como uma proteção contra a radiação solar direta.

Ela reduz a quantidade de energia que chega à superfície do solo, diminuindo seu aquecimento.

Agora veja a amostra sem cobertura: a mesma lâmpada aquece diretamente a superfície do solo.

Os termômetros de espeto medem a temperatura dentro de cada amostra, começando pela que tem cobertura vegetal.

O solo descoberto absorve mais energia e fica mais quente. As leituras desta animação são apenas ilustrativas.

Temperaturas mais baixas ajudam a reduzir a perda de água por evaporação e favorecem as plantas e os organismos do solo.

Por isso, manter o solo coberto é uma importante prática de conservação.`,
      view: { rotationDeg: [0, 0, 0], yawDeg: -20, pitchDeg: 22 },
      animation: { sync: [[0, 0], [12.7, 1.5], [17.2, 6.0], [27.56, 6.0], [28.06, 6.5], [31.26, 9.7], [41.13, 9.7], [41.43, 10.0], [44.63, 13.2], [47.43, 16]] },
    },
  ],
};
