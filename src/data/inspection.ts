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
  /** Explicação do trecho marcado; aparece na lista da descrição do item. */
  description?: string;
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
   * Recipiente do objeto (nó do GLB, ex.: a caixa de madeira). Clicar no recipiente ou no
   * conteúdo esmaece o recipiente e enquadra só o conteúdo (a rocha); clicar na rocha o devolve.
   *
   * Regra: usar sempre que o conteúdo é uma peça sólida que pode ser tirada da caixa (rochas,
   * fragmentos). Não usar com material solto (terra, solo, areia): sem a caixa ele não se
   * sustenta, então o item fica sem esse recurso.
   */
  container?: { node: string };
  /** Miniatura da faixa de navegação (imagem gerada a partir do próprio modelo). */
  thumbnail: string;
  /**
   * Texto educativo do item, exibido no painel de descrição. Parágrafos separados por uma
   * linha em branco; frases curtas terminadas em "?", "!" ou "..." aparecem em destaque (falas).
   * Se houver `markers` com `description`, a lista dos estágios vem logo depois deste texto.
   */
  description?: string;
  /** Texto exibido depois da lista dos estágios (`markers`), no mesmo formato de `description`. */
  closing?: string;
  /**
   * Narração. Ainda não usada nesta versão: quando houver, `audioUrl` (arquivo gravado) ou
   * `text` (voz sintetizada) poderão ser ligados à inspeção sem mudar o visualizador.
   */
  narration?: { audioUrl?: string; text?: string };
};

export type InspectionSet = {
  id: string;
  title: string;
  /**
   * Introdução do conjunto (aba "Introdução" do painel de descrição, mostrada primeiro ao abrir).
   * Mesmo formato de `InspectionItem.description`.
   */
  overview?: string;
  items: InspectionItem[];
};

// Textos: equipe da exposição (roteiro de 2026), divididos entre a introdução do conjunto e as
// quatro etapas, sem alteração.
export const FORMACAO_DO_SOLO: InspectionSet = {
  id: "formacao-do-solo",
  title: "Formação do Solo",
  overview: `Você já parou para pensar...

Como será que o solo é formado???

Tudo começa com a transformação das rochas. Ao longo do tempo, a água, as mudanças de temperatura e os seres vivos modificam essas rochas.

Esse processo é chamado de intemperismo.

Mas espera aí...

Como uma rocha pode se transformar em solo???

Vamos descobrir!`,
  items: [
    {
      id: "caixa-01",
      order: 1,
      title: "Caixa 1 | Rocha não alterada",
      shortTitle: "Rocha não alterada",
      model: { url: "/models/inspection/caixa_01_rocha_nao_alterada.glb", sizeBytes: 2_417_004 },
      container: { node: "Caixa_Madeira" },
      thumbnail: "/models/inspection/thumbs/caixa-01.webp",
      description: `Começamos pela primeira caixa: a rocha não alterada.

Observe sua superfície e seu formato. Esta é a rocha original, que ainda não passou por transformações significativas.

Ela representa o ponto de partida para a formação do solo.`,
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
      description: `Agora, vamos para a segunda caixa: a rocha alterada.

Percebeu a diferença?

A rocha já apresenta sinais de desgaste e fragmentação.

Isso acontece devido ao intemperismo, que transforma o material gradualmente, ao longo do tempo.`,
      view: { rotationDeg: [0, 0, 0], yawDeg: -28, pitchDeg: 24 },
    },
    {
      id: "caixa-03",
      order: 3,
      title: "Caixa 3 | Solo formado",
      shortTitle: "Solo formado",
      model: { url: "/models/inspection/caixa_03_solo_formado.glb", sizeBytes: 3_179_780 },
      // Solo solto: não sai da caixa (sem `container`).
      thumbnail: "/models/inspection/thumbs/caixa-03.webp",
      description: `Vamos agora para a terceira caixa: o solo formado.

Observe como o material mudou!

A rocha original deu lugar a um material muito mais transformado, com partículas menores, presença de matéria orgânica e uma estrutura mais desenvolvida.

E sabe o que é mais interessante?

Essa transformação pode levar milhares de anos!`,
      view: { rotationDeg: [0, 0, 0], yawDeg: -28, pitchDeg: 24 },
    },
    {
      id: "maquete-01",
      order: 4,
      title: "Maquete | Formação do solo",
      shortTitle: "Maquete da formação do solo",
      model: { url: "/models/inspection/maquete_01_formacao_do_solo.glb", sizeBytes: 3_494_768 },
      thumbnail: "/models/inspection/thumbs/maquete-01.webp",
      description: `Mas agora surge outra pergunta...

Como será que aparecem as diferentes camadas do solo???

Para entender isso, vamos observar a maquete da formação do solo.

Da esquerda para a direita, acompanhamos quatro etapas.`,
      closing: `Cada horizonte apresenta características próprias, como cor, textura e composição.

Interessante, não é?

Assim, percebemos que o solo não surge de uma só vez.

Ele é resultado de um longo processo de transformação da natureza!`,
      // A maquete foi feita para ser vista de frente (fundo liso): vista inicial quase frontal.
      view: { rotationDeg: [0, 0, 0], yawDeg: -12, pitchDeg: 6 },
      // Estágios da esquerda para a direita (roteiro 2026, p. 11; nós do GLB).
      markers: [
        {
          node: "Estagio_R",
          label: "R",
          description: "Primeiro, temos a rocha mãe, representada pela letra R. É o material de origem, ainda não transformado.",
        },
        {
          node: "Estagio_A_R",
          label: "A + R",
          description: "Em seguida, surge o horizonte A sobre a rocha, indicando o início da formação do solo.",
        },
        {
          node: "Estagio_A_C_R",
          label: "A + C + R",
          description: "Na terceira etapa, aparece também o horizonte C, mostrando um solo em desenvolvimento.",
        },
        {
          node: "Estagio_A_B_C_R",
          label: "A + B + C + R",
          description: "Por fim, encontramos os horizontes A, B e C sobre a rocha mãe, formando um solo mais desenvolvido, com camadas bem definidas.",
        },
      ],
    },
  ],
};

export const INSPECTION_SETS: Record<string, InspectionSet> = {
  [FORMACAO_DO_SOLO.id]: FORMACAO_DO_SOLO,
};

/** Opacidade da camada escura sobre o museu durante a inspeção (ajustável após testes). */
export const INSPECTION_DIM_OPACITY = 0.7;
