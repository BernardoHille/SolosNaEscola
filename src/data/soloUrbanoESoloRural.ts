/**
 * Módulo 15 · Solo Urbano e Solo Rural: as duas maquetes em caixa na mesa ao lado da maquete 14. O visitante
 * escolhe a maquete no menu; cada uma começa fechada, como no roteiro, e abre a tampa da frente no fim da
 * narração da caixa fechada, ou antes, quando o visitante clica na caixa (`animation.openOnClick`).
 *
 * Gerado por `processo/inspecao-web/modulo15_dados.py` (fora do repositório) a partir da gravação da equipe
 * (`urbanorural.aac`, sem os títulos lidos) e do roteiro (p. 49–50). Não houve texto enviado: as frases são as da
 * transcrição, com pontuação revista. Acervo de grupo único, sem texto geral.
 *
 * Modelos: os GLBs do acervo, sem alteração, cada um com o clipe `abrir_tampa` (2,2 s). A escala (50 cm de
 * largura) é estimada no acervo e confere com as caixas no splat.
 */
import type { InspectionCatalog, InspectionItem } from "./inspection";

const AUDIO = "/audio/inspection/solo-urbano-e-rural";
const MODELS = "/models/inspection/urbano-rural";
const THUMBS = "/models/inspection/thumbs";

/** De frente e um pouco de cima: o campo (ou a cidade) por cima e, com a tampa aberta, o perfil do solo. */
const VIEW: InspectionItem["view"] = { rotationDeg: [0, 0, 0], yawDeg: -22, pitchDeg: 16 };

const ITENS: InspectionItem[] = [
  {
    id: "maquete-15-01-solo-rural",
    order: 1,
    title: "Solo rural",
    shortTitle: "Maquete do solo rural",
    model: { url: `${MODELS}/maquete_15_01_solo_rural.glb`, sizeBytes: 9_320_964 },
    view: VIEW,
    thumbnail: `${THUMBS}/maquete-15-01-solo-rural.webp`,
    // 7 parágrafos com a caixa fechada; a tampa abre aos 27,31 s (o clique na caixa leva até
    // ali), e os 8 seguintes são narrados com ela aberta.
    description: `Vamos começar observando esta paisagem rural.

Aqui encontramos um ambiente com vegetação e uma grande parte do solo exposta.

Isso permite que as plantas cresçam e que a água da chuva consiga infiltrar com mais facilidade.

Mas você já parou para pensar: o que será que existe debaixo dessa paisagem?

Será que o solo é igual desde a superfície até as partes mais profundas?

Vamos descobrir!

Abra a parte frontal da maquete e observe o que está escondido debaixo da terra.

Olhe só o que encontramos debaixo da paisagem rural!

Agora conseguimos observar as diferentes camadas do solo, chamadas de horizontes.

Na parte superior, temos o horizonte A, onde geralmente encontramos mais matéria orgânica.

Abaixo dele, aparecem os horizontes B e C, com características diferentes.

E, mais profundamente, encontramos a camada R, que representa a rocha.

Perceba como essas camadas estão organizadas.

Em ambientes rurais e naturais, quando o solo é pouco alterado, esses horizontes podem permanecer bem definidos.

Isso permite que o solo desempenhe funções importantes, como armazenar água, permitir a circulação de ar e sustentar o crescimento das plantas.`,
    narration: { audioUrl: `${AUDIO}/maquete-15-01-solo-rural.m4a`, cues: [0, 2.71, 7.03, 12.39, 17.23, 20.95, 22.67, 28.97, 32.36, 36.92, 42.3, 46.88, 51.82, 54.44, 61.26] },
    animation: { sync: [[27.31, 0], [29.51, 2.2]], openOnClick: true },
  },
  {
    id: "maquete-15-02-solo-urbano",
    order: 2,
    title: "Solo urbano",
    shortTitle: "Maquete do solo urbano",
    model: { url: `${MODELS}/maquete_15_02_solo_urbano.glb`, sizeBytes: 3_937_336 },
    view: VIEW,
    thumbnail: `${THUMBS}/maquete-15-02-solo-urbano.webp`,
    // 10 parágrafos com a caixa fechada; a tampa abre aos 37,29 s (o clique na caixa leva até
    // ali), e os 12 seguintes são narrados com ela aberta.
    description: `Agora, vamos observar uma paisagem bem diferente.

Aqui temos um ambiente urbano, com ruas, calçadas e construções.

Mas eu tenho uma pergunta para você.

Será que existe solo debaixo de uma cidade?

É claro que sim!

Mesmo quando não conseguimos enxergá-lo, o solo continua presente debaixo dos nossos pés.

A diferença é que, nas cidades, grande parte dele está coberta por asfalto e construções.

Isso dificulta a infiltração da água da chuva e reduz o espaço disponível para o crescimento das plantas.

Mas o que será que encontramos debaixo de tudo isso?

Abra a maquete e vamos descobrir!

Surpresa! Existe muito mais coisa debaixo de uma cidade do que imaginamos.

Observe esta maquete.

Aqui encontramos tubulações de água, redes de esgoto e sistemas de drenagem da chuva.

Também podemos encontrar restos de construções e outros materiais misturados ao solo.

E percebeu uma diferença em relação à maquete rural?

As camadas naturais do solo já não aparecem tão bem definidas.

Isso acontece porque as obras e construções frequentemente misturam e modificam esses horizontes.

Mas sabe o que é interessante?

Mesmo alterado, o solo urbano continua desempenhando funções importantes, como sustentar construções e plantas, permitir alguma infiltração de água e reter certos poluentes.

E quando chove muito, o que acontece com toda aquela água que não consegue entrar no solo?

Ela pode se acumular nas ruas, aumentando o risco de alagamentos e inundações.

Por isso, preservar áreas verdes e espaços onde a água possa infiltrar é fundamental para melhorar a qualidade ambiental das nossas cidades.`,
    narration: { audioUrl: `${AUDIO}/maquete-15-02-solo-urbano.m4a`, cues: [0, 2.47, 8.13, 10.41, 13.01, 15.15, 20.03, 25.67, 31.53, 35.09, 38.95, 43.34, 44.92, 49.92, 54.7, 57.64, 61.26, 66.52, 68.8, 80.84, 86.24, 90.42] },
    animation: { sync: [[37.29, 0], [39.49, 2.2]], openOnClick: true },
  },
];

export const SOLO_URBANO_E_SOLO_RURAL: InspectionCatalog = {
  id: "solo-urbano-e-solo-rural",
  title: "Solo Urbano e Solo Rural",
  stepNoun: "Maquete",
  menuEyebrow: "Escolha uma maquete",
  groups: [{ id: "maquetes", title: "Solo Urbano e Solo Rural", items: ITENS }],
};
