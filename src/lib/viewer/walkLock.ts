/**
 * Mantém o visitante exclusivamente no Walk Mode oficial do SuperSplat Viewer.
 *
 * Por que não basta esconder botões: os atalhos de teclado (1/2/3, F, R, G, Esc, Espaço)
 * e o pointer lock pertencem ao núcleo de entrada do viewer e continuam ativos mesmo
 * com `ui: false`. A abordagem adotada usa apenas recursos documentados:
 *
 * 1. `ui: false` — sem botões de Orbit/Fly/Frame/AR/VR (configurado na criação).
 * 2. `state.inputEnabled = false` — desliga o teclado e o gamepad do viewer (atalhos,
 *    WASD/QE, Espaço = pulo). O teclado passa a ser tratado pela aplicação e entregue
 *    via `setMoveInput`, que só desloca no plano horizontal.
 * 3. `state.gamingControls = false` — olhar arrastando o mouse/dedo; sem pointer lock
 *    forçado e sem "toque = pulo" do modo de jogo em telas sensíveis ao toque.
 * 4. Bloqueio, no contêiner (fase de captura do DOM), da roda do mouse e dos botões
 *    direito/do meio: no Walk Mode a roda empurra o corpo e o arrasto com botão
 *    direito gera "pan" com componente vertical, que o WalkController interpreta como
 *    pulo.
 * 5. Guarda de modo: se `cameraMode` sair de "walk" por qualquer caminho, volta para
 *    "walk" (sem loop: só reage a valores diferentes de "walk").
 *
 * Cliques/toques no piso continuam ativos: no Walk Mode eles caminham até o ponto
 * escolhido pelo sistema de colisão, sem trocar de modo.
 */
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";

export type WalkLockOptions = {
  /** Chamado quando o Walk Mode é ativado pela primeira vez. */
  onWalkActive?: () => void;
};

export function lockToWalk(viewer: ViewerHandle, container: HTMLElement, options: WalkLockOptions = {}) {
  const { state, events } = viewer;
  let disposed = false;
  let walkActive = false;

  state.inputEnabled = false;
  state.gamingControls = false;

  const enterWalk = () => {
    if (disposed) return;
    // Pré-condições do fluxo oficial: cena pronta (primeiro quadro) e colisão anexada.
    if (!state.loaded || !state.walkAllowed) return;
    if (state.cameraMode !== "walk") state.cameraMode = "walk";
    if (state.cameraMode === "walk" && !walkActive) {
      walkActive = true;
      options.onWalkActive?.();
    }
  };

  const onCameraMode = (mode: string) => {
    if (!walkActive || mode === "walk") return;
    console.warn(`lockToWalk: cameraMode mudou para "${mode}"; retornando ao Walk Mode.`);
    queueMicrotask(enterWalk);
  };
  const onGamingControls = (value: boolean) => {
    if (value) queueMicrotask(() => !disposed && (state.gamingControls = false));
  };
  const onInputEnabled = (value: boolean) => {
    if (value) queueMicrotask(() => !disposed && (state.inputEnabled = false));
  };

  const handles = [
    events.on("loaded:changed", enterWalk),
    events.on("walkAllowed:changed", enterWalk),
    events.on("cameraMode:changed", onCameraMode),
    events.on("gamingControls:changed", onGamingControls),
    events.on("inputEnabled:changed", onInputEnabled),
  ];

  const block = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
  };
  const blockNonPrimary = (event: MouseEvent) => {
    if (event.button !== 0) block(event);
  };
  const domListeners: [string, EventListener][] = [
    ["wheel", block as EventListener],
    ["contextmenu", block as EventListener],
    ["pointerdown", blockNonPrimary as EventListener],
    ["mousedown", blockNonPrimary as EventListener],
    ["auxclick", blockNonPrimary as EventListener],
  ];
  for (const [type, listener] of domListeners) {
    container.addEventListener(type, listener, { capture: true, passive: false });
  }

  enterWalk();

  return () => {
    disposed = true;
    for (const handle of handles) handle.off();
    for (const [type, listener] of domListeners) {
      container.removeEventListener(type, listener, { capture: true });
    }
  };
}
