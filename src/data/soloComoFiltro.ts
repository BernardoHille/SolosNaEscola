/**
 * Módulo 25 · Solo como Filtro: os dois funis de garrafa PET (solo argiloso e arenoso) com a água contaminada com
 * azul de metileno. Não está no splat (o experimento é montado na hora): o volume fica ao lado da caixa do 24.
 *
 * Gerado por `processo/inspecao-web/modulos12a27_dados.py` (fora do repositório). Modelo: a versão web do GLB do
 * acervo (texturas em JPEG; `modulos12a27_glb_web.py`), com um clipe de 25,5 s.
 *
 * Sem narração gravada (a gravação termina no 24.2): o texto foi escrito a partir do roteiro, na voz das narrações,
 * e ainda não foi revisado pela equipe. A animação corre sozinha quando o modelo aparece (`animation.sync` em tempo
 * real, sem áudio) e recomeça depois de alguns segundos parada no resultado.
 */
import type { InspectionSet } from "./inspection";

export const SOLO_COMO_FILTRO: InspectionSet = {
  id: "solo-como-filtro",
  title: "Solo como Filtro",
  stepNoun: "Experimento",
  items: [
    {
      id: "modulo-25-solo-como-filtro",
      order: 1,
      title: "Experimento | Solo como filtro",
      shortTitle: "Solo como filtro",
      model: { url: "/models/inspection/solo-como-filtro/modulo_25_solo_como_filtro_web.glb", sizeBytes: 1_351_476 },
      thumbnail: "/models/inspection/thumbs/modulo-25-solo-como-filtro.webp",
      description: `Você acha que o solo pode reter poluentes?

Nestes dois funis feitos de garrafa PET há solos diferentes: um de textura argilosa e outro de textura arenosa. Embaixo de cada um, um galão recolhe o que atravessa o solo.

A garrafa contém água contaminada com azul de metileno, um corante.

Primeiro, a água contaminada é despejada no solo argiloso. Ela demora a atravessá-lo e, quando começa a pingar, sai bem mais clara: o solo argiloso retém boa parte do corante.

Depois, a mesma água é despejada no solo arenoso. Ela passa depressa e pinga ainda azulada: esse solo tem pouca capacidade de reter o poluente.

O solo funciona como um filtro natural, que ajuda a impedir que poluentes cheguem às águas subterrâneas. Mas essa capacidade não é infinita e não vale para todos os tipos de contaminantes.`,
      view: { rotationDeg: [0, 0, 0], yawDeg: -15, pitchDeg: 12 },
      animation: { sync: [[0, 0], [25.5, 25.5]] },
    },
  ],
};
