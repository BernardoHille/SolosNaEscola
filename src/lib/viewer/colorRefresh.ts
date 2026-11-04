/**
 * Frequência de atualização das cores dependentes do ângulo de visão (harmônicos esféricos).
 *
 * Cada splat do SOG guarda coeficientes de harmônicos esféricos (3 bandas): a cor muda com a
 * direção de onde é visto. O motor recalcula essas cores quando a câmera se desloca mais que
 * `tan(colorUpdateAngle) × max(1, distância até a cena)`; girar no lugar não dispara o
 * recálculo. O viewer usa 0,2° (e 1° no nível `performance`). Com a câmera dentro da sala a
 * distância é 0, o limite fica em ≈ 3,5 mm e, ao andar, as cores dos ≈ 3,0 milhões de splats
 * eram recalculadas em todo quadro — a principal causa da queda de FPS ao caminhar em
 * notebooks e celulares.
 *
 * Com 1° (o valor que o próprio viewer usa no nível `performance`) o recálculo ocorre em
 * poucos quadros durante a caminhada. Medido no painel de testes (WebGPU): quadros com
 * recálculo caíram de 100% para ≈ 5% e o tempo médio de GPU andando, de ≈ 8,0 ms para
 * ≈ 5,3 ms (o mesmo de só girar a câmera).
 *
 * O viewer reaplica o próprio valor ao revelar a cena e quando qualidade, modo de desempenho,
 * depuração ou XR mudam. Por isso o valor é reforçado a cada tick, antes da atualização do
 * motor; é só uma atribuição de campo.
 */
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";

export const COLOR_UPDATE_ANGLE_DEG = 1;

export function pinColorRefresh(viewer: ViewerHandle, angleDeg = COLOR_UPDATE_ANGLE_DEG) {
  const { app } = viewer;
  const apply = () => {
    const params = app.scene?.gsplat;
    if (params && params.colorUpdateAngle !== angleDeg) params.colorUpdateAngle = angleDeg;
  };
  apply();
  app.on("frameupdate", apply);
  return () => {
    app.off("frameupdate", apply);
  };
}
