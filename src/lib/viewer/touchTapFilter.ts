/**
 * Filtro de toques rápidos sobre o canvas do viewer, para o olhar em primeira pessoa no
 * celular.
 *
 * Em telas de toque a visita usa o modo de jogo do viewer (`gamingControls`), em que o
 * olhar acompanha o dedo, como em jogos de tiro para celular. Nesse modo, porém, o viewer
 * trata um toque rápido (sem arrasto) como pulo. Este filtro faz com que o viewer só veja
 * os toques que realmente arrastam:
 *
 * - o `pointerdown` de um toque no canvas é retido;
 * - quando o dedo se afasta `SLOP_PX` do ponto inicial, o `pointerdown` retido é entregue ao
 *   canvas (com a posição original) e o arrasto segue normalmente, a partir desse ponto;
 * - se o dedo sai da tela antes disso, nada chega ao viewer: não há pulo.
 *
 * O primeiro movimento entregue mede pelo menos `SLOP_PX` (soma dos eixos), acima do limiar
 * de 15 px com que o viewer distingue toque de arrasto, então um arrasto entregue nunca é
 * classificado como toque. Mouse e caneta não são afetados.
 */

/** Deslocamento (|dx| + |dy|, em px de tela) que transforma um toque em arrasto. */
const SLOP_PX = 16;

type Pending = { down: PointerEvent; canvas: HTMLCanvasElement };

export function attachTouchTapFilter(container: HTMLElement) {
  const pending = new Map<number, Pending>();
  // Eventos criados por este filtro: passam direto.
  const forwarded = new WeakSet<Event>();

  const isCanvasTouch = (event: PointerEvent): event is PointerEvent & { target: HTMLCanvasElement } =>
    !forwarded.has(event) &&
    event.pointerType === "touch" &&
    event.target instanceof HTMLCanvasElement &&
    container.contains(event.target);

  const onDown = (event: PointerEvent) => {
    if (!isCanvasTouch(event)) return;
    event.stopPropagation();
    pending.set(event.pointerId, { down: event, canvas: event.target });
  };

  const onMove = (event: PointerEvent) => {
    const held = pending.get(event.pointerId);
    if (!held) return;
    const { down, canvas } = held;
    if (Math.abs(event.screenX - down.screenX) + Math.abs(event.screenY - down.screenY) < SLOP_PX) {
      event.stopPropagation();
      return;
    }
    // Virou arrasto: entrega o início do toque e deixa este movimento seguir até o canvas.
    pending.delete(event.pointerId);
    const start = new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: down.pointerId,
      pointerType: down.pointerType,
      isPrimary: down.isPrimary,
      clientX: down.clientX,
      clientY: down.clientY,
      screenX: down.screenX,
      screenY: down.screenY,
      width: down.width,
      height: down.height,
      pressure: down.pressure,
      button: down.button,
      buttons: down.buttons,
    });
    forwarded.add(start);
    canvas.dispatchEvent(start);
  };

  const onEnd = (event: PointerEvent) => {
    if (!pending.delete(event.pointerId)) return;
    // Toque sem arrasto: o viewer nunca soube dele.
    event.stopPropagation();
  };

  const listeners: [string, (event: PointerEvent) => void][] = [
    ["pointerdown", onDown],
    ["pointermove", onMove],
    ["pointerup", onEnd],
    ["pointercancel", onEnd],
  ];
  for (const [type, listener] of listeners) {
    container.addEventListener(type, listener as EventListener, {
      capture: true,
    });
  }

  return () => {
    for (const [type, listener] of listeners) {
      container.removeEventListener(type, listener as EventListener, {
        capture: true,
      });
    }
    pending.clear();
  };
}
