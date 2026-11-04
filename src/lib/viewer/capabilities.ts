/**
 * Detecção de suporte gráfico no navegador.
 *
 * O SuperSplat Viewer usa WebGPU quando disponível e recorre automaticamente ao
 * WebGL 2. Se nenhum dos dois existir, a cena não pode ser renderizada e a
 * interface mostra uma mensagem de dispositivo incompatível.
 */
export type GraphicsSupport = {
  webgpu: boolean;
  webgl2: boolean;
};

export function detectGraphicsSupport(): GraphicsSupport {
  const webgpu = typeof navigator !== "undefined" && "gpu" in navigator;

  let webgl2 = false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    webgl2 = !!gl;
    // Libera o contexto de teste imediatamente: navegadores limitam a
    // quantidade de contextos WebGL ativos.
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  } catch {
    webgl2 = false;
  }

  return { webgpu, webgl2 };
}

export function isGraphicsSupported(support: GraphicsSupport): boolean {
  // WebGPU pode existir em `navigator` sem adaptador utilizável; o WebGL 2 é o
  // requisito mínimo confiável, pois é o fallback do motor.
  return support.webgl2 || support.webgpu;
}
