/**
 * Orçamento de gaussianas e parâmetros de LOD do Streamed SOG.
 *
 * O SuperSplat Viewer 1.42 calcula o próprio orçamento a partir do "Quality" nativo (escada de 1–8 M
 * no celular e 2–16 M no computador) e o reaplica ao revelar a cena e a cada mudança de qualidade,
 * modo de desempenho ou XR (`applyPerfSettings`). Para que a escolha da visita (modo manual ou o
 * automático) seja a que vale, o valor é reforçado a cada tick, antes da atualização do motor, como
 * já é feito com `colorUpdateAngle` (`colorRefresh.ts`). São atribuições de campo; o motor só
 * recalcula quando o valor muda de fato.
 *
 * O orçamento só age em cenas com LOD (`lod-meta.json`). No SOG de arquivo único é ignorado.
 *
 * Parâmetros (API do PlayCanvas 2.23.3):
 * - `app.scene.gsplat.splatBudget` / `splatBudgetMode`: modo `target` (padrão do motor) — o
 *   detalhe sobe, a partir dos blocos mais próximos da câmera, até gastar o orçamento. O custo fica
 *   previsível (o que o controlador automático precisa) e o que está perto do visitante recebe o
 *   detalhe primeiro.
 * - `lodUnderfillLimit`: enquanto o nível ideal de um bloco não chega, usa até N níveis mais
 *   grossos já baixados, em vez de esperar. Evita buracos ao caminhar e girar.
 * - `gsplat.lodMultiplier` (componente): no modo `target`, só a razão entre as distâncias de
 *   transição importa. 3 é o padrão do motor; mantido.
 */
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";

export const LOD_POLICY = {
  splatBudgetMode: "target",
  lodUnderfillLimit: 2,
} as const;

type GsplatParams = {
  splatBudget: number;
  splatBudgetMode: string;
  lodUnderfillLimit: number;
};

/**
 * Mantém o orçamento escolhido pela visita. Devolve `set` (troca o valor sem recriar nada) e
 * `dispose`.
 */
export function pinSplatBudget(viewer: ViewerHandle, initialBudget: number) {
  const { app } = viewer;
  let budget = initialBudget;
  const apply = () => {
    const params = app.scene?.gsplat as unknown as GsplatParams | undefined;
    if (!params) return;
    if (params.splatBudget !== budget) params.splatBudget = budget;
    if (params.splatBudgetMode !== LOD_POLICY.splatBudgetMode) params.splatBudgetMode = LOD_POLICY.splatBudgetMode;
    if (params.lodUnderfillLimit !== LOD_POLICY.lodUnderfillLimit) params.lodUnderfillLimit = LOD_POLICY.lodUnderfillLimit;
  };
  apply();
  app.on("frameupdate", apply);
  return {
    set(next: number) {
      if (next === budget) return;
      budget = next;
      apply();
      // Renderização sob demanda: com a câmera parada, um quadro novo aplica o orçamento e o
      // streaming continua sozinho (o motor pede quadros com `frame:request`).
      app.renderNextFrame = true;
    },
    dispose() {
      app.off("frameupdate", apply);
    },
  };
}
