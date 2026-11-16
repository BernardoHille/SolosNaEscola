/**
 * Módulo 26 · Impacto da Gota da Chuva no Solo: o pote com vegetação e o pote de solo descoberto sobre bandejas
 * limpas. Não está no splat: o volume fica ao lado da caixa do 24. As gotas que caem de cima ficam fora do
 * enquadramento inicial (`fitIgnore`).
 *
 * Gerado por `processo/inspecao-web/modulos12a27_dados.py` (fora do repositório). Modelo: a versão web do GLB do
 * acervo (texturas em JPEG; `modulos12a27_glb_web.py`), com um clipe de 15,85 s.
 *
 * Sem narração gravada (a gravação termina no 24.2): o texto foi escrito a partir do roteiro, na voz das narrações,
 * e ainda não foi revisado pela equipe. A animação corre sozinha quando o modelo aparece (`animation.sync` em tempo
 * real, sem áudio) e recomeça depois de alguns segundos parada no resultado.
 */
import type { InspectionSet } from "./inspection";

export const IMPACTO_DA_GOTA_DA_CHUVA: InspectionSet = {
  id: "impacto-da-gota-da-chuva",
  title: "Impacto da Gota da Chuva no Solo",
  stepNoun: "Experimento",
  items: [
    {
      id: "modulo-26-impacto-da-gota-da-chuva",
      order: 1,
      title: "Experimento | Impacto da gota da chuva",
      shortTitle: "Impacto da gota da chuva",
      model: { url: "/models/inspection/impacto-da-gota-da-chuva/modulo_26_impacto_da_gota_da_chuva_web.glb", sizeBytes: 1_503_636 },
      thumbnail: "/models/inspection/thumbs/modulo-26-impacto-da-gota-da-chuva.webp",
      description: `Você acha que uma simples gota de chuva pode prejudicar o solo?

Neste experimento há uma amostra de solo coberta por vegetação viva e outra totalmente descoberta, cada uma sobre uma bandeja limpa.

Quando a água pinga sobre o solo coberto, as folhas recebem o impacto das gotas e a bandeja fica quase limpa.

Sobre o solo descoberto, cada gota quebra a estrutura do solo e lança os grãos para todos os lados: a bandeja fica cheia de respingos.

O impacto da gota da chuva é a etapa inicial da erosão. Ele pode ser evitado quando o solo está protegido pelas plantas.

Já reparou como fica suja uma parede branca ao lado de um terreno de solo descoberto depois de uma chuva forte?`,
      view: { rotationDeg: [0, 0, 0], yawDeg: -15, pitchDeg: 22, fitIgnore: ["Gota_"] },
      animation: { sync: [[0, 0], [15.85, 15.85]] },
    },
  ],
};
