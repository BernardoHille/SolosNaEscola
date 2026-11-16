/**
 * Módulo 27 · Compactação do Solo e Infiltração da Água: os vasos de solo solto e compactado, com o pratinho do
 * "lençol freático" e o regador. Não está no splat: o volume fica ao lado da caixa do 24.
 *
 * Gerado por `processo/inspecao-web/modulos12a27_dados.py` (fora do repositório). Modelo: a versão web do GLB do
 * acervo (texturas em JPEG; `modulos12a27_glb_web.py`), com um clipe de 24 s.
 *
 * Sem narração gravada (a gravação termina no 24.2): o texto foi escrito a partir do roteiro, na voz das narrações,
 * e ainda não foi revisado pela equipe. A animação corre sozinha quando o modelo aparece (`animation.sync` em tempo
 * real, sem áudio) e recomeça depois de alguns segundos parada no resultado.
 */
import type { InspectionSet } from "./inspection";

export const COMPACTACAO_E_INFILTRACAO: InspectionSet = {
  id: "compactacao-do-solo-e-infiltracao",
  title: "Compactação do Solo e Infiltração da Água",
  stepNoun: "Experimento",
  items: [
    {
      id: "modulo-27-compactacao-e-infiltracao",
      order: 1,
      title: "Experimento | Compactação e infiltração",
      shortTitle: "Compactação e infiltração",
      model: { url: "/models/inspection/compactacao-e-infiltracao/modulo_27_compactacao_e_infiltracao_web.glb", sizeBytes: 1_176_224 },
      thumbnail: "/models/inspection/thumbs/modulo-27-compactacao-e-infiltracao.webp",
      description: `Você acha que a água infiltra mais em um solo com mais ou com menos poros?

Em um dos vasos o solo está solto e poroso. No outro, ele foi compactado, como acontece quando veículos, animais ou pessoas passam muitas vezes sobre o solo.

No solo não compactado, a água infiltra rapidamente pelos poros e abastece as raízes e os organismos do solo. O excesso desce até o prato do vaso, que representa o lençol freático.

No solo compactado, há poucos poros: a água não consegue entrar e fica parada na superfície.

Em um terreno inclinado, essa água escorreria pela superfície e poderia causar erosão.`,
      view: { rotationDeg: [0, 0, 0], yawDeg: -15, pitchDeg: 25 },
      animation: { sync: [[0, 0], [24, 24]] },
    },
  ],
};
