/**
 * Módulo 14 · Maquete do Solo na Paisagem: a caixa com a encosta em corte e o rio, na mesa ao lado das maquetes
 * do solo rural e urbano. Como a maquete 01: um modelo só, e a narração percorre as regiões dele, com o rótulo
 * de cada uma aceso enquanto é narrada.
 *
 * Gerado por `processo/inspecao-web/modulo14_dados.py` (fora do repositório) a partir do texto e da gravação da
 * equipe. A narração é um arquivo só, sem os títulos lidos (`narracao_modulo14.py`).
 *
 * Modelo: o GLB do acervo com nós de marcação (um ponto invisível por região e por horizonte), para os rótulos
 * (`modulo14_glb_web.py`). A água é artificial no acervo: na maquete real o rio é um bloco em plástico azul.
 */
import type { InspectionSet } from "./inspection";

const AUDIO = "/audio/inspection/solo-na-paisagem";

export const SOLO_NA_PAISAGEM: InspectionSet = {
  id: "solo-na-paisagem",
  title: "Maquete do Solo na Paisagem",
  stepNoun: "Maquete",
  items: [
    {
      id: "maquete-14",
      order: 1,
      title: "Maquete | Solo na paisagem",
      shortTitle: "Maquete do solo na paisagem",
      model: { url: "/models/inspection/paisagem/maquete_14_solo_na_paisagem_web.glb", sizeBytes: 5_809_412 },
      thumbnail: "/models/inspection/thumbs/maquete-14.webp",
      narration: { audioUrl: `${AUDIO}/maquete-14.m4a`, cues: [0, 3.97, 6.41, 12.11, 19.07, 21.57, 27.02, 50.02, 76.89, 106.26, 130.06, 158.64, 163.4, 167.54, 171.12, 176.76, 181.74, 183.04] },
      description: `Você acha que o solo é igual em todos os lugares de uma paisagem???

À primeira vista, pode até parecer que sim.

Mas, quando observamos com mais atenção, percebemos que os solos mudam bastante de um lugar para outro.

Isso acontece por causa da posição no relevo, da ação da água, da erosão e também do tempo de formação do solo.

Agora, vamos observar esta maquete por partes.

Assim, fica mais fácil entender como a paisagem influencia a formação dos solos.`,
      closing: `Assim, esta maquete nos ajuda a entender que solo, relevo e água estão diretamente ligados.

Em áreas planas, a infiltração favorece solos mais profundos.

Em áreas inclinadas, a erosão dificulta esse desenvolvimento.

E nas partes baixas, o acúmulo de água e materiais cria solos com características próprias.

Ou seja, para entender o solo, também precisamos observar a paisagem onde ele se forma.

Interessante, não é?

A paisagem muda o solo, e o solo também ajuda a contar a história da paisagem.`,
      // De frente e um pouco de cima, para ver o alto do morro, a encosta, o rio e a face do perfil.
      view: { rotationDeg: [0, 0, 0], yawDeg: -14, pitchDeg: 14 },
      // Regiões na ordem da narração, depois os horizontes na face do perfil (só rótulo, sem narração própria).
      markers: [
        {
          node: "Marcador_Area_Plana_M14",
          label: "Área plana",
          description: "Vamos começar pela parte mais alta e mais plana da paisagem. Observe esta região. Em áreas planas, a água infiltra com maior facilidade no solo. E por que isso é importante??? Porque essa infiltração favorece a transformação da rocha e o desenvolvimento do solo ao longo do tempo. Por isso, nessas áreas, é mais comum encontrarmos solos mais profundos e mais desenvolvidos.",
        },
        {
          node: "Marcador_Encosta_M14",
          label: "Encosta",
          description: "Agora, observe as áreas inclinadas da maquete. Aqui, a situação já é diferente. Parte da água infiltra no solo, mas outra parte escorre pela superfície. E esse escoamento superficial pode carregar partículas do solo de um lugar para outro. Esse processo é uma forma natural de erosão. Por causa disso, o desenvolvimento do solo nessas áreas fica mais difícil. Em geral, os solos das encostas costumam ser mais rasos ou pouco profundos.",
        },
        {
          node: "Marcador_Parte_Baixa_M14",
          label: "Parte baixa",
          description: "Agora, vamos observar a parte mais baixa da paisagem. É nessa região que a água e os sedimentos transportados tendem a se acumular. Além disso, o lençol freático costuma ficar mais próximo da superfície. Com o excesso de água, o solo pode apresentar características bem diferentes. Muitas vezes, ele fica mais escuro por causa do acúmulo de matéria orgânica. Em outros casos, pode apresentar coloração acinzentada, associada ao excesso de água e à falta de oxigênio.",
        },
        {
          node: "Marcador_Transporte_M14",
          label: "Transporte",
          description: "Agora, pense no caminho que a água faz ao longo da paisagem. Quando chove, a água pode transportar materiais das áreas mais altas e inclinadas para as partes mais baixas. Isso significa que a água não participa apenas da formação do solo. Ela também ajuda a transformar a própria paisagem. Interessante, não é??? A paisagem está em constante mudança, e a água tem um papel muito importante nesse processo.",
        },
        {
          node: "Marcador_Horizontes_M14",
          label: "Horizontes",
          description: "Agora, vamos observar os horizontes do solo nesta maquete. Você consegue perceber que eles não aparecem da mesma forma em toda a paisagem??? Em algumas áreas, os horizontes estão mais espessos e bem desenvolvidos. Em outras, eles são mais delgados ou até menos visíveis. Aqui, podemos identificar o horizonte A, o horizonte B, o horizonte C e a camada R, que representa a rocha. Essas diferenças mostram que o solo não se desenvolve da mesma maneira em todos os pontos do relevo.",
        },
        { node: "Marcador_Horizonte_A_M14", label: "A" },
        { node: "Marcador_Horizonte_B_M14", label: "B" },
        { node: "Marcador_Horizonte_C_M14", label: "C" },
        { node: "Marcador_Camada_R_M14", label: "R" },
      ],
    },
  ],
};
