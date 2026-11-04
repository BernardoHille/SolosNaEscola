/**
 * Teclado da visita: WASD ou setas para caminhar, Shift para caminhar mais rápido.
 *
 * Substitui o teclado nativo do viewer (desligado por `state.inputEnabled = false`),
 * de modo que nenhuma tecla possa trocar de modo, enquadrar a cena, subir/descer ou
 * pular. A direção é entregue ao `MoveInputMixer` (→ `setMoveInput`).
 */
import type { MoveInputMixer } from "./moveInput";

const FORWARD = new Set(["KeyW", "ArrowUp"]);
const BACKWARD = new Set(["KeyS", "ArrowDown"]);
const LEFT = new Set(["KeyA", "ArrowLeft"]);
const RIGHT = new Set(["KeyD", "ArrowRight"]);
const MOVEMENT_KEYS = new Set([...FORWARD, ...BACKWARD, ...LEFT, ...RIGHT]);

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export function attachKeyboardMovement(
  mixer: MoveInputMixer,
  speeds: { walk: number; run: number },
  /** Chamado a cada nova tecla de movimento pressionada (dentro do gesto do usuário). */
  onMoveKey?: () => void,
  /** Enquanto retornar true (ex.: inspeção aberta), o teclado não move o visitante. */
  isSuspended: () => boolean = () => false,
) {
  const pressed = new Set<string>();
  let run = false;

  const update = () => {
    if (isSuspended()) {
      pressed.clear();
      run = false;
      mixer.set("keyboard", 0, 0);
      return;
    }
    const has = (keys: Set<string>) => [...keys].some((k) => pressed.has(k));
    let x = (has(RIGHT) ? 1 : 0) - (has(LEFT) ? 1 : 0);
    let z = (has(FORWARD) ? 1 : 0) - (has(BACKWARD) ? 1 : 0);
    const len = Math.hypot(x, z);
    if (len > 0) {
      const speed = run ? speeds.run : speeds.walk;
      x = (x / len) * speed;
      z = (z / len) * speed;
    }
    mixer.set("keyboard", x, z);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.ctrlKey || event.altKey || event.metaKey || isTyping(event.target)) return;
    if (isSuspended()) {
      update();
      return;
    }
    if (event.key === "Shift") {
      run = true;
      update();
      return;
    }
    if (!MOVEMENT_KEYS.has(event.code)) return;
    // Evita a rolagem da página pelas setas.
    event.preventDefault();
    if (event.repeat && pressed.has(event.code)) return;
    pressed.add(event.code);
    update();
    if (!event.repeat) onMoveKey?.();
  };

  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === "Shift") run = false;
    pressed.delete(event.code);
    update();
  };

  // Teclas soltas fora da janela nunca geram keyup: zera tudo ao perder o foco.
  const reset = () => {
    pressed.clear();
    run = false;
    mixer.set("keyboard", 0, 0);
  };
  const onVisibility = () => {
    if (document.visibilityState !== "visible") reset();
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", reset);
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
    window.removeEventListener("blur", reset);
    document.removeEventListener("visibilitychange", onVisibility);
    reset();
  };
}
