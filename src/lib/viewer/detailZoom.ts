/**
 * Zoom de detalhes da visita (computador): enquanto o botão direito do mouse fica pressionado,
 * o campo de visão fecha; ao soltar, volta. É o "mirar" dos jogos em primeira pessoa.
 *
 * A API pública do viewer não expõe o FOV e o WalkController o mantém fixo: a cada quadro, no
 * evento `update`, o viewer regrava `camera.fov`. Por isso o zoom é aplicado no mesmo evento,
 * logo depois dele (os ouvintes rodam na ordem de registro), sobre o valor recém-gravado. Sem
 * zoom, nada é escrito. O viewer percebe a mudança da projeção e redesenha sozinho, e já
 * multiplica a velocidade do olhar por `fov / 120`: a mira fica mais fina durante o zoom.
 *
 * Com o cursor livre, o botão direito também captura o mouse, para que dê para olhar em volta
 * durante o zoom; ao soltar, o cursor volta. O viewer não recebe o botão direito (`walkLock`).
 */
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";
import type { CameraComponent } from "playcanvas";

import { DETAIL_ZOOM } from "@/data/visit";

import { setMouseCapture } from "./viewerCommands";

/** Bit do botão direito em `PointerEvent.buttons`. */
const RIGHT_BUTTON = 2;

export type DetailZoom = {
  /** Encerra o zoom, mesmo com o botão ainda pressionado (ex.: ao abrir um painel). */
  stop: () => void;
  /** Mantém o mouse capturado ao soltar o botão (o visitante começou a andar). */
  keepCapture: () => void;
  dispose: () => void;
};

export function attachDetailZoom(
  viewer: ViewerHandle,
  container: HTMLElement,
  /** Se falso, o botão direito não faz nada (ex.: painel aberto ou inspeção). */
  isAllowed: () => boolean,
): DetailZoom {
  const { app, state } = viewer;
  let zoom = 1;
  let held = false;
  let instant = false;
  let releaseCaptureOnStop = false;
  let camera: CameraComponent | undefined;

  const onUpdate = (dt: number) => {
    const target = held ? DETAIL_ZOOM.factor : 1;
    if (zoom === target && zoom === 1) return;
    zoom = instant ? target : zoom + (target - zoom) * (1 - Math.exp(-dt / DETAIL_ZOOM.smoothingSeconds));
    if (Math.abs(target - zoom) < 0.002) zoom = target;
    // De volta a 1: o FOV que o viewer acabou de gravar já é o normal.
    if (zoom === 1) return;
    camera ??= app.root.findComponents("camera")[0] as CameraComponent | undefined;
    if (!camera) return;
    // Divide a tangente, e não o ângulo, para que `factor` seja a ampliação real da imagem.
    const halfFov = (camera.fov * Math.PI) / 360;
    camera.fov = (Math.atan(Math.tan(halfFov) / zoom) * 360) / Math.PI;
  };

  const start = () => {
    held = true;
    instant = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (!state.gamingControls) {
      setMouseCapture(viewer, true);
      releaseCaptureOnStop = true;
    }
  };

  const stop = () => {
    if (!held) return;
    held = false;
    if (releaseCaptureOnStop) setMouseCapture(viewer, false);
    releaseCaptureOnStop = false;
  };

  // Compara `buttons` em vez de `button`: com outro botão já pressionado, apertar ou soltar o
  // direito só gera `pointermove`. A mesma checagem encerra o zoom se o botão foi solto fora
  // da janela.
  const onPointer = (event: PointerEvent) => {
    if (event.pointerType !== "mouse") return;
    const pressed = (event.buttons & RIGHT_BUTTON) !== 0;
    if (!pressed) {
      stop();
    } else if (
      !held &&
      isAllowed() &&
      state.cameraMode === "walk" &&
      event.target instanceof HTMLCanvasElement &&
      container.contains(event.target)
    ) {
      start();
    }
  };

  app.on("update", onUpdate);
  const capture = { capture: true } as const;
  const pointerEvents = ["pointerdown", "pointermove", "pointerup"] as const;
  for (const type of pointerEvents) window.addEventListener(type, onPointer, capture);
  window.addEventListener("blur", stop);

  return {
    stop,
    keepCapture: () => {
      releaseCaptureOnStop = false;
    },
    dispose: () => {
      app.off("update", onUpdate);
      for (const type of pointerEvents) window.removeEventListener(type, onPointer, capture);
      window.removeEventListener("blur", stop);
    },
  };
}
