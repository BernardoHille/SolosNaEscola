/**
 * Módulo 19 · Maquete da Voçoroca: a maquete no fim da fileira do meio, com a pastagem cortada pela voçoroca, as
 * casas no alto e o rio embaixo. Como a maquete 14: um modelo só, e a narração percorre as regiões dele, com o
 * rótulo de cada uma aceso enquanto é narrada.
 *
 * Gerado por `processo/inspecao-web/modulo19_dados.py` (fora do repositório) a partir da gravação enviada em
 * 2026-11-15 (vídeo com as narrações dos módulos que faltavam) e do roteiro (p. 60). Não houve texto escrito: as
 * frases são as da transcrição, conferidas trecho a trecho. A narração é um arquivo só, sem os títulos lidos nem a
 * fonte ("baseado na página 60 do manual") (`narracao_modulo19.py`).
 *
 * Modelo: o GLB do acervo com nós de marcação (um ponto invisível por região), para os rótulos
 * (`modulo19_glb_web.py`). A água é artificial no acervo: na maquete real o rio é plástico azul amassado.
 */
import type { InspectionSet } from "./inspection";

const AUDIO = "/audio/inspection/maquete-da-vocoroca";

export const MAQUETE_DA_VOCOROCA: InspectionSet = {
  id: "maquete-da-vocoroca",
  title: "Maquete da Voçoroca",
  stepNoun: "Maquete",
  items: [
    {
      id: "maquete-19",
      order: 1,
      title: "Maquete | Voçoroca",
      shortTitle: "Maquete da voçoroca",
      model: { url: "/models/inspection/vocoroca/maquete_19_vocoroca_web.glb", sizeBytes: 7_082_276 },
      thumbnail: "/models/inspection/thumbs/maquete-19.webp",
      narration: { audioUrl: `${AUDIO}/maquete-19.m4a`, cues: [0, 2.75, 6.97, 9.89, 14.07, 19.97, 24.45, 30.49, 61.35, 91.09, 114.37] },
      description: `Observe esta grande abertura no terreno.

Ela representa uma voçoroca, uma forma avançada de erosão do solo.

Mas uma voçoroca não aparece de repente.

O processo começa com a remoção de pequenas partículas pela água da chuva.

Com o passar do tempo, a erosão pode abrir sulcos que aumentam de tamanho e profundidade.

Quando esse processo se intensifica, podem surgir enormes erosões como esta.

Vamos explorar a maquete e descobrir os impactos que uma voçoroca pode causar na paisagem.`,
      closing: `Perceba como um problema que começa no solo pode afetar toda a paisagem ao redor.`,
      // De frente (o rio) e bem de cima, para ver a vala no campo, as casas no fundo e o rio.
      view: { rotationDeg: [0, 0, 0], yawDeg: -16, pitchDeg: 30 },
      // Regiões na ordem da narração, depois a vala (só rótulo, sem narração própria).
      markers: [
        {
          node: "Marcador_Pastagem_M19",
          label: "Pastagem",
          description: "Repare na área de pastagem ao redor da voçoroca. Quando a erosão avança, ela remove grandes quantidades de solo e pode atingir vários horizontes. Isso reduz a área disponível para o crescimento das plantas e pode prejudicar as atividades agrícolas. Em casos mais graves, a recuperação do terreno se torna difícil e bastante cara. A cobertura vegetal ajuda a proteger a superfície e diminuir o avanço da erosão. Por isso, conservar o solo é muito mais fácil do que tentar recuperá-lo depois de uma degradação tão intensa.",
        },
        {
          node: "Marcador_Area_Urbana_M19",
          label: "Área urbana",
          description: "Agora, observe como a erosão se aproxima da área urbana. O que aconteceria se essa abertura continuasse aumentando? Além de destruir áreas de vegetação, uma voçoroca pode ameaçar estradas, construções e outras estruturas próximas. Isso acontece porque a remoção contínua do solo modifica a estabilidade do terreno. Em situações mais graves, o avanço da erosão pode colocar pessoas e moradias em risco. Essa é uma das razões pelas quais o planejamento da ocupação do solo é tão importante.",
        },
        {
          node: "Marcador_Rio_M19",
          label: "Rio",
          description: "Observe a região do rio. Parte do solo removido pela erosão pode ser carregada pela água até os cursos d'água. Quando esses sedimentos se acumulam no fundo dos rios, ocorre o assoreamento. Isso pode diminuir a profundidade do rio, prejudicar a qualidade da água e afetar os organismos aquáticos. Além disso, o assoreamento pode contribuir para aumentar o risco de inundações.",
        },
        { node: "Marcador_Vocoroca_M19", label: "Voçoroca" },
      ],
    },
  ],
};
