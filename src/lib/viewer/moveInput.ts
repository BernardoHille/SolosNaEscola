/**
 * Combina as fontes de movimento da interface (teclado e joystick virtual) e as
 * entrega ao viewer por `setMoveInput(x, z)`, a API oficial para deslocamento em
 * primeira pessoa: x = lateral (direita +), z = frente (+).
 *
 * Cada fonte informa seu próprio vetor; soltar uma fonte não cancela a outra.
 */
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";

export type MoveSource = "keyboard" | "joystick";

export class MoveInputMixer {
  private readonly sources = new Map<MoveSource, [number, number]>();

  constructor(private readonly viewer: ViewerHandle) {}

  set(source: MoveSource, x: number, z: number) {
    if (x === 0 && z === 0) this.sources.delete(source);
    else this.sources.set(source, [x, z]);
    this.flush();
  }

  clear() {
    this.sources.clear();
    this.flush();
  }

  private flush() {
    let x = 0;
    let z = 0;
    for (const [sx, sz] of this.sources.values()) {
      x += sx;
      z += sz;
    }
    x = Math.max(-1, Math.min(1, x));
    z = Math.max(-1, Math.min(1, z));
    // Só há movimento no Walk Mode com a cena carregada (a API lança erro antes disso).
    // O valor é sempre reenviado: o viewer zera a entrada por conta própria ao perder
    // o foco, ao ocultar a aba ou ao trocar de modo.
    if (!this.viewer.state.loaded || this.viewer.state.cameraMode !== "walk") return;
    try {
      this.viewer.setMoveInput(x, z);
    } catch {
      // Viewer já destruído (desmontagem): não há movimento a aplicar nem a soltar.
    }
  }
}
