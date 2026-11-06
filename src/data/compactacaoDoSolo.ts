/**
 * Módulo 09 · Compactação do Solo: a mesa das duas caixas de solo em frente aos painéis do campo. O visitante
 * escolhe entre o solo não compactado e o compactado, com o cavalo ao lado, como a narração pede.
 *
 * Gerado por `processo/inspecao-web/modulo09_dados.py` (fora do repositório) a partir do roteiro e
 * da gravação da equipe. Acervo de grupo único, sem texto geral: abre direto no menu dos itens, sem
 * narração nem painel de descrição.
 *
 * Modelos: o item 1 é o GLB do acervo sem alteração; o item 2 sai do conjunto do acervo, sem a outra caixa
 * (`modulo09_glb_web.py`). As alturas do solo e a posição da haste são didáticas.
 */
import type { InspectionCatalog, InspectionItem } from "./inspection";

const AUDIO = "/audio/inspection/compactacao-do-solo";
const MODELS = "/models/inspection/compactacao";
const THUMBS = "/models/inspection/thumbs";

/** De frente e de cima, para ver a altura do solo nas paredes da caixa e a haste. */
const VIEW: InspectionItem["view"] = { rotationDeg: [0, 0, 0], yawDeg: 25, pitchDeg: 28 };

const ITENS: InspectionItem[] = [
  {
    id: "caixa-09-01-nao-compactado",
    order: 1,
    title: "Solo não compactado",
    shortTitle: "Não compactado",
    model: { url: `${MODELS}/caixa_09_01_nao_compactado.glb`, sizeBytes: 6_536_692 },
    view: VIEW,
    thumbnail: `${THUMBS}/caixa-09-01-nao-compactado.webp`,
    description: `Você já parou para pensar no que acontece com o solo quando pisamos sobre ele?

Vamos começar observando esta caixa com solo não compactado!

Aqui, o solo está mais solto, com espaços vazios entre suas partículas, chamados de poros.

Esses espaços permitem a circulação de água e ar, essenciais para a vida das plantas.

E sabe o que é interessante?

Se tentássemos introduzir uma haste neste solo, ela entraria com facilidade!

Isso acontece porque as partículas não estão tão pressionadas umas contra as outras.

Agora, observe a outra caixa e compare!

Será que o solo continua com as mesmas características depois de sofrer pressão???`,
    narration: { audioUrl: `${AUDIO}/caixa-09-01-nao-compactado.m4a`, cues: [0, 4.52, 8.36, 14.28, 19.6, 20.98, 24.94, 29.7, 33.14] },
  },
  {
    id: "caixa-09-02-compactado",
    order: 2,
    title: "Solo compactado",
    shortTitle: "Compactado",
    model: { url: `${MODELS}/caixa_09_02_compactado_com_cavalo.glb`, sizeBytes: 5_776_284 },
    view: VIEW,
    thumbnail: `${THUMBS}/caixa-09-02-compactado.webp`,
    description: `Agora, observe esta caixa com solo compactado!

E repare no cavalo ao lado dela!

Você sabia que o simples pisoteio de animais pode modificar a estrutura do solo???

Isso mesmo!

Quando um cavalo passa repetidamente sobre o mesmo terreno, o peso de seu corpo pode pressionar as partículas do solo, diminuindo os espaços vazios entre elas.

Esse processo é chamado de compactação!

Observe que, mesmo com a mesma quantidade de material, o solo compactado ocupa menos espaço.

E isso traz consequências!

Com menos poros, a circulação de água e ar fica mais difícil.

O solo também se torna mais resistente à penetração, dificultando o crescimento das raízes.

E não são apenas os animais que causam esse problema!

Máquinas agrícolas e até o trânsito frequente de pessoas podem compactar o solo.

Por isso, preservar sua estrutura é fundamental para manter as condições necessárias ao desenvolvimento das plantas!`,
    narration: { audioUrl: `${AUDIO}/caixa-09-02-compactado.m4a`, cues: [0, 2.68, 5.36, 10.12, 11.42, 20.36, 23.28, 29.08, 30.74, 34.48, 39.86, 42.96, 48.4] },
  },
];

export const COMPACTACAO_DO_SOLO: InspectionCatalog = {
  id: "compactacao-do-solo",
  title: "Compactação do Solo",
  stepNoun: "Item",
  menuEyebrow: "Escolha um item",
  groups: [{ id: "compactacao", title: "Compactação do Solo", items: ITENS }],
};
