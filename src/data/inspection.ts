/**
 * Cadastro dos conjuntos educativos que podem ser inspecionados (modelos 3D individuais).
 *
 * Mantido separado do código de renderização para revisão pela equipe da exposição. Os
 * volumes que ligam cada conjunto a uma região do Gaussian Splatting ficam em
 * `interactions.json` (calibráveis com `?debugInteractions=1`).
 *
 * Modelos: produzidos no Blender (pasta "Inspecionar objetos", fora do repositório) e
 * publicados sem alteração em `public/models/inspection/`. Todos estão em metros, com Y
 * para cima e a frente do objeto voltada para +Z.
 */

export type InspectionMarker = {
  /** Nome do nó do GLB cuja caixa delimitadora recebe o rótulo. */
  node: string;
  /** Texto curto exibido sobre o nó. */
  label: string;
};

export type InspectionItem = {
  id: string;
  /** Ordem na sequência (1 = primeira etapa). */
  order: number;
  /** Título exibido na inspeção. */
  title: string;
  /** Título curto (indicador de interação e leitores de tela). */
  shortTitle: string;
  model: {
    /** Caminho público do GLB. */
    url: string;
    /** Tamanho em bytes (indicador de carregamento). */
    sizeBytes: number;
  };
  /**
   * Orientação inicial, em graus. `rotationDeg` corrige os eixos do arquivo, se preciso
   * (aplicada primeiro, em X, Y e Z). `yawDeg` (em torno de Y) e `pitchDeg` (inclina o
   * topo em direção ao visitante) definem a vista de três quartos inicial.
   */
  view: { rotationDeg: [number, number, number]; yawDeg: number; pitchDeg: number };
  /** Rótulos opcionais sobre partes do modelo (ex.: estágios da maquete). */
  markers?: InspectionMarker[];
  /**
   * Recipiente do objeto (nó do GLB, ex.: a caixa de madeira). Clicar no conteúdo esmaece o
   * recipiente e enquadra só o conteúdo (a rocha); clicar de novo o devolve.
   */
  container?: { node: string };
  /** Miniatura da faixa de navegação (imagem gerada a partir do próprio modelo). */
  thumbnail: string;
  /** Texto educativo. Ainda não exibido nesta versão (a pedido da equipe). */
  description?: string;
  /**
   * Narração. Ainda não usada nesta versão: quando houver, `audioUrl` (arquivo gravado) ou
   * `text` (voz sintetizada) poderão ser ligados à inspeção sem mudar o visualizador.
   */
  narration?: { audioUrl?: string; text?: string };
};

export type InspectionSet = {
  id: string;
  title: string;
  items: InspectionItem[];
};

export const FORMACAO_DO_SOLO: InspectionSet = {
  id: "formacao-do-solo",
  title: "Formação do Solo",
  items: [
    {
      id: "caixa-01",
      order: 1,
      title: "Caixa 1 | Rocha não alterada",
      shortTitle: "Rocha não alterada",
      model: { url: "/models/inspection/caixa_01_rocha_nao_alterada.glb", sizeBytes: 2_417_004 },
      container: { node: "Caixa_Madeira" },
      thumbnail: "/models/inspection/thumbs/caixa-01.webp",
      view: { rotationDeg: [0, 0, 0], yawDeg: -28, pitchDeg: 24 },
    },
    {
      id: "caixa-02",
      order: 2,
      title: "Caixa 2 | Rocha alterada",
      shortTitle: "Rocha alterada",
      model: { url: "/models/inspection/caixa_02_rocha_alterada.glb", sizeBytes: 2_598_556 },
      container: { node: "Caixa_Madeira_C02" },
      thumbnail: "/models/inspection/thumbs/caixa-02.webp",
      view: { rotationDeg: [0, 0, 0], yawDeg: -28, pitchDeg: 24 },
    },
    {
      id: "caixa-03",
      order: 3,
      title: "Caixa 3 | Solo formado",
      shortTitle: "Solo formado",
      model: { url: "/models/inspection/caixa_03_solo_formado.glb", sizeBytes: 3_179_780 },
      container: { node: "Caixa_Madeira_C03" },
      thumbnail: "/models/inspection/thumbs/caixa-03.webp",
      view: { rotationDeg: [0, 0, 0], yawDeg: -28, pitchDeg: 24 },
    },
    {
      id: "maquete-01",
      order: 4,
      title: "Maquete | Formação do solo",
      shortTitle: "Maquete da formação do solo",
      model: { url: "/models/inspection/maquete_01_formacao_do_solo.glb", sizeBytes: 3_494_768 },
      thumbnail: "/models/inspection/thumbs/maquete-01.webp",
      // A maquete foi feita para ser vista de frente (fundo liso): vista inicial quase frontal.
      view: { rotationDeg: [0, 0, 0], yawDeg: -12, pitchDeg: 6 },
      // Estágios da esquerda para a direita (roteiro 2026, p. 11; nós do GLB).
      markers: [
        { node: "Estagio_R", label: "R" },
        { node: "Estagio_A_R", label: "A + R" },
        { node: "Estagio_A_C_R", label: "A + C + R" },
        { node: "Estagio_A_B_C_R", label: "A + B + C + R" },
      ],
    },
  ],
};

export const INSPECTION_SETS: Record<string, InspectionSet> = {
  [FORMACAO_DO_SOLO.id]: FORMACAO_DO_SOLO,
};

/** Opacidade da camada escura sobre o museu durante a inspeção (ajustável após testes). */
export const INSPECTION_DIM_OPACITY = 0.7;
