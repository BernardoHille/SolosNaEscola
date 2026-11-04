/**
 * Escala uniforme da cena em runtime.
 *
 * O viewer cria a entidade do splat (nome "gsplat") quando o asset termina de carregar
 * e a insere em `app.root`. Este adaptador escuta o evento público `childinsert` do
 * PlayCanvas e aplica a escala de forma síncrona, durante a inserção — ou seja, antes
 * de o viewer calcular a caixa envolvente da cena, as câmeras e as colisões.
 *
 * Apenas a escala é alterada: a rotação padrão aplicada pelo viewer (180° em Z) e a
 * posição permanecem como estão. O arquivo SOG não é modificado.
 */
import type { AppBase, GraphNode } from "playcanvas";

const SPLAT_ENTITY_NAME = "gsplat";

export function applySceneScale(app: AppBase, scale: number): () => void {
  if (scale === 1) return () => undefined;

  const scaleNode = (node: GraphNode) => {
    if (node.name === SPLAT_ENTITY_NAME) node.setLocalScale(scale, scale, scale);
  };

  // Caso improvável: a entidade já existir. A escala é aplicada mesmo assim, mas o
  // viewer pode ter calculado a caixa da cena antes; por isso o aviso.
  const existing = app.root.findByName(SPLAT_ENTITY_NAME);
  if (existing) {
    console.warn("applySceneScale: a entidade do splat já existia; a caixa da cena pode estar desatualizada.");
    scaleNode(existing);
  }

  app.root.on("childinsert", scaleNode);
  return () => {
    app.root?.off("childinsert", scaleNode);
  };
}
