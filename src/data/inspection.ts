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

/**
 * Narração gravada de um texto do painel (mesmas palavras de `overview` ou `description`).
 * `cues` = início (s) de cada bloco do texto na ordem em que aparece (parágrafos de
 * `description`, estágios de `markers`, parágrafos de `closing`): o bloco falado fica destacado.
 */
export type InspectionNarration = {
  audioUrl: string;
  cues?: number[];
};

type InspectionItemBase = {
  id: string;
  /** Ordem na sequência (1 = primeira etapa). */
  order: number;
  /** Título exibido na inspeção. */
  title: string;
  /** Título curto (indicador de interação e leitores de tela). */
  shortTitle: string;
  /** Rótulos opcionais sobre partes do modelo (ex.: estágios da maquete). */
  markers?: InspectionMarker[];
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
  /** Narração do texto da etapa (controle na barra do painel de descrição). */
  narration?: InspectionNarration;
};

/** Item com modelo 3D, a forma usual. */
export type InspectionModelItem = InspectionItemBase & {
  model: {
    /** Caminho público do GLB. */
    url: string;
    /** Tamanho em bytes (indicador de carregamento). */
    sizeBytes: number;
  };
  /**
   * Orientação inicial, em graus. `rotationDeg` corrige os eixos do arquivo, se preciso
   * (aplicada primeiro, em X, Y e Z). `yawDeg` (em torno de Y) e `pitchDeg` (inclina o
   * topo em direção ao visitante) definem a vista de três quartos inicial. `fitScale` (< 1)
   * aproxima o enquadramento inicial, que cabe a esfera envolvente e sobra em cenas largas e baixas.
   * `fitIgnore`: prefixos de nome de nó cujas malhas não entram no enquadramento (ex.: a chuva do
   * módulo 18, que cai de bem acima do aquário).
   */
  view: {
    rotationDeg: [number, number, number];
    yawDeg: number;
    pitchDeg: number;
    fitScale?: number;
    fitIgnore?: string[];
  };
  /**
   * Recipiente do objeto (nó do GLB, ex.: a caixa de madeira). Clicar no recipiente ou no
   * conteúdo esmaece o recipiente e enquadra só o conteúdo (a rocha); clicar na rocha o devolve.
   *
   * Regra: usar sempre que o conteúdo é uma peça sólida que pode ser tirada da caixa (rochas,
   * fragmentos). Não usar com material solto (terra, solo, areia): sem a caixa ele não se
   * sustenta, então o item fica sem esse recurso.
   */
  container?: { node: string } | { nodes: string[] };
  /**
   * Animação do GLB (primeiro clipe) conduzida pela narração do item: pares
   * [segundos da narração, segundos do clipe], interpolados. Antes do primeiro par fica no quadro
   * do primeiro; depois do último, parada no último. Pausar a narração pausa a animação; com a
   * narração já ouvida (sem tocar de novo), mostra o último quadro.
   *
   * `openOnClick`: item de dois estados (caixa fechada e aberta, clipe = abrir a tampa). O primeiro par
   * de `sync` marca o fim da narração da caixa fechada; ali a tampa abre sozinha. Antes disso, clicar
   * no modelo (ou no botão "Abrir a tampa") leva a narração até esse ponto. Numa nova visita, a caixa
   * volta fechada, mesmo com a narração já ouvida.
   */
  animation?: { sync: [number, number][]; openOnClick?: boolean };
  microscope?: never;
};

/** Item em 2D: uma imagem vista na telinha do microscópio digital, no lugar do modelo 3D. */
export type InspectionMicroscopeItem = InspectionItemBase & {
  microscope: {
    /** Caminho público da imagem. */
    image: string;
    /** Dimensões da imagem em pixels (a tela do aparelho tem a mesma proporção). */
    width: number;
    height: number;
  };
  model?: never;
  view?: never;
  container?: never;
  animation?: never;
};

export type InspectionItem = InspectionModelItem | InspectionMicroscopeItem;

export type InspectionSet = {
  id: string;
  title: string;
  /** Nome de cada item na interface ("Etapa 1", "Rocha 1"…; padrão: "Etapa"). */
  stepNoun?: string;
  /**
   * Introdução do conjunto (aba "Introdução" do painel de descrição, mostrada primeiro ao abrir).
   * Mesmo formato de `InspectionItem.description`.
   */
  overview?: string;
  /** Narração da introdução. */
  overviewNarration?: InspectionNarration;
  items: InspectionItem[];
};

// Textos: equipe da exposição (roteiro de 2026), divididos entre a introdução do conjunto e as
// quatro etapas, sem alteração. Narração: gravação da equipe ("Narracoess/etapa1.aac", 120 s),
// cortada nos silêncios entre as mesmas seções sem recodificar; os `cues` vêm da transcrição
// com marcação de palavras (ver README, "Narração").
const AUDIO = "/audio/inspection/formacao-do-solo";
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
  overviewNarration: {
    audioUrl: `${AUDIO}/00-introducao.m4a`,
    cues: [0, 1.94, 4.14, 11.34, 13.78, 14.86, 17.46],
  },
  items: [
    {
      id: "caixa-01",
      order: 1,
      title: "Caixa 1 | Rocha não alterada",
      shortTitle: "Rocha não alterada",
      model: { url: "/models/inspection/caixa_01_rocha_nao_alterada.glb", sizeBytes: 2_417_004 },
      container: { node: "Caixa_Madeira" },
      thumbnail: "/models/inspection/thumbs/caixa-01.webp",
      narration: { audioUrl: `${AUDIO}/01-caixa-01.m4a`, cues: [0, 4.21, 12.05] },
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
      narration: { audioUrl: `${AUDIO}/02-caixa-02.m4a`, cues: [0, 3.23, 4.63, 8.29] },
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
      narration: { audioUrl: `${AUDIO}/03-caixa-03.m4a`, cues: [0, 3.02, 5.36, 15.7, 17.86] },
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
      narration: { audioUrl: `${AUDIO}/04-maquete-01.m4a`, cues: [0, 2.06, 5.48, 9.22, 11.86, 18.92, 24.4, 29.46, 36.2, 42.28, 43.94, 47.46] },
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

/** Grupo de um acervo (ex.: rochas ígneas): menu próprio, com texto e narração. */
export type InspectionGroup = {
  id: string;
  title: string;
  /** Texto do grupo (mostrado e narrado no menu do grupo; dispensável com um grupo só). */
  overview?: string;
  overviewNarration?: InspectionNarration;
  items: InspectionItem[];
};

/**
 * Acervo com menu (ex.: Material de Origem): abre num menu com os grupos e o texto geral; um grupo
 * abre o menu das suas peças; uma peça abre a inspeção 3D, com as outras peças do grupo na faixa
 * de navegação. Com **um grupo só** (ex.: Horizontes do Solo), o acervo abre direto no menu das
 * peças, com o texto e a narração do acervo.
 */
export type InspectionCatalog = {
  id: string;
  title: string;
  /** Texto geral. Sem ele (ex.: Ar no Solo), o menu abre só com os cartões, sem painel nem narração. */
  overview?: string;
  overviewNarration?: InspectionNarration;
  /** Nome de cada peça ("Rocha", "Amostra"). */
  stepNoun: string;
  /** Linha acima do título no menu das peças de um acervo de grupo único ("Escolha uma amostra"). */
  menuEyebrow?: string;
  groups: InspectionGroup[];
};

/** Opacidade da camada escura sobre o museu durante a inspeção (ajustável após testes). */
export const INSPECTION_DIM_OPACITY = 0.7;
