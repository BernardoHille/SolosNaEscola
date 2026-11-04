"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";

import { MOVEMENT } from "@/data/visit";
import { attachKeyboardMovement } from "@/lib/viewer/keyboardMovement";
import { MoveInputMixer } from "@/lib/viewer/moveInput";
import { setMouseCapture } from "@/lib/viewer/viewerCommands";
import { lockToWalk } from "@/lib/viewer/walkLock";

/** Tempo máximo, após a cena estar pronta, para a colisão ser anexada. */
const COLLISION_TIMEOUT_MS = 45_000;

export type WalkVisit = {
  /** Walk Mode ativo: a visita pode começar. */
  walkActive: boolean;
  /** Tipo de entrada detectado pelo viewer (decide joystick e instruções). */
  inputMode: "desktop" | "touch";
  /** Envia o vetor do joystick virtual. */
  setJoystick: (x: number, z: number) => void;
  /** Volta à entrada sem sair do Walk Mode e sem recarregar a cena. */
  returnToEntrance: () => void;
  /** Mouse capturado: o cursor está oculto e o mouse gira a câmera (computador). */
  mouseCaptured: boolean;
  /** Devolve o cursor (ex.: ao abrir um painel). */
  releaseMouse: () => void;
};

export type WalkVisitOptions = {
  /** Se falso, andar com o teclado não captura o mouse (ex.: painel aberto). */
  captureAllowed: boolean;
  /**
   * Locomoção suspensa (ex.: inspeção de um objeto): teclado e joystick não movem o
   * visitante, o movimento em curso para e o cursor é devolvido. Posição e orientação
   * ficam como estão.
   */
  suspended?: boolean;
};

/**
 * Liga a visita em primeira pessoa a uma instância do viewer: trava no Walk Mode,
 * conecta teclado e joystick, e detecta falha no carregamento da colisão.
 */
export function useWalkVisit(
  viewer: ViewerHandle | null,
  container: HTMLElement | null,
  collisionUrl: string,
  onCollisionError: (detail: string) => void,
  { captureAllowed, suspended = false }: WalkVisitOptions = { captureAllowed: true },
): WalkVisit {
  const [walkActive, setWalkActive] = useState(false);
  // Tipo de entrada observado diretamente no estado do viewer.
  const inputMode = useSyncExternalStore(
    useCallback(
      (notify: () => void) => {
        const handle = viewer?.events.on("inputMode:changed", notify);
        return () => handle?.off();
      },
      [viewer],
    ),
    () => viewer?.state.inputMode ?? "desktop",
    () => "desktop" as const,
  );
  // Captura do mouse = modo de jogo do viewer ligado no computador.
  const mouseCaptured = useSyncExternalStore(
    useCallback(
      (notify: () => void) => {
        const handles = [
          viewer?.events.on("gamingControls:changed", notify),
          viewer?.events.on("inputMode:changed", notify),
        ];
        return () => handles.forEach((handle) => handle?.off());
      },
      [viewer],
    ),
    () => !!viewer && viewer.state.gamingControls && viewer.state.inputMode === "desktop",
    () => false,
  );
  const captureAllowedRef = useRef(captureAllowed);
  const suspendedRef = useRef(suspended);
  useEffect(() => {
    captureAllowedRef.current = captureAllowed;
    suspendedRef.current = suspended;
  });
  const mixerRef = useRef<MoveInputMixer | null>(null);
  const errorRef = useRef(onCollisionError);
  useEffect(() => {
    errorRef.current = onCollisionError;
  });

  useEffect(() => {
    if (!viewer || !container) return;
    const mixer = new MoveInputMixer(viewer);
    mixerRef.current = mixer;

    const disposeLock = lockToWalk(viewer, container, { onWalkActive: () => setWalkActive(true) });
    // Ao começar a andar pelo teclado, o mouse é capturado e passa a controlar a câmera
    // (estilo jogo em primeira pessoa). Esc devolve o cursor; a próxima tecla de
    // movimento captura de novo.
    const disposeKeyboard = attachKeyboardMovement(
      mixer,
      MOVEMENT,
      () => {
        if (captureAllowedRef.current && !suspendedRef.current) setMouseCapture(viewer, true);
      },
      () => suspendedRef.current,
    );

    // O viewer zera a entrada ao trocar de modo; a interface acompanha.
    const modeHandle = viewer.events.on("cameraMode:changed", () => mixer.clear());

    // Detecção de falha da colisão. O viewer registra a falha apenas no console e
    // continua sem colisão; aqui ela vira um erro visível, pois não há visita sem colisão.
    const abort = new AbortController();
    fetch(collisionUrl, { signal: abort.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`Colisão indisponível: HTTP ${response.status}`);
      })
      .catch((error: unknown) => {
        if (!abort.signal.aborted) errorRef.current(error instanceof Error ? error.message : String(error));
      });

    let timer: number | undefined;
    const armTimeout = () => {
      if (timer !== undefined || viewer.state.walkAllowed) return;
      timer = window.setTimeout(() => {
        if (viewer.state.walkAllowed) return;
        errorRef.current(
          viewer.state.hasCollision
            ? "A colisão foi carregada, mas o viewer não liberou o Walk Mode (walkAllowed = false)."
            : "A colisão não foi anexada ao viewer a tempo.",
        );
      }, COLLISION_TIMEOUT_MS);
    };
    const loadedHandle = viewer.events.on("loaded:changed", (loaded: boolean) => loaded && armTimeout());
    if (viewer.state.loaded) armTimeout();

    return () => {
      abort.abort();
      window.clearTimeout(timer);
      loadedHandle.off();
      modeHandle.off();
      disposeKeyboard();
      disposeLock();
      mixer.clear();
      mixerRef.current = null;
      setWalkActive(false);
    };
  }, [viewer, container, collisionUrl]);

  // Suspensão: para o movimento em curso e devolve o cursor (sem mexer na câmera).
  useEffect(() => {
    if (!suspended || !viewer) return;
    mixerRef.current?.clear();
    setMouseCapture(viewer, false);
  }, [suspended, viewer]);

  const releaseMouse = useCallback(() => {
    if (viewer) setMouseCapture(viewer, false);
  }, [viewer]);

  return {
    walkActive,
    inputMode,
    setJoystick: (x, z) => {
      if (!suspendedRef.current) mixerRef.current?.set("joystick", x, z);
    },
    returnToEntrance: () => {
      if (!viewer || viewer.state.cameraMode !== "walk") return;
      mixerRef.current?.clear();
      // No Walk Mode, `resetCamera()` restaura a pose registrada na entrada do modo —
      // que, como o visitante nunca sai do Walk Mode, é sempre a entrada da exposição.
      try {
        viewer.resetCamera();
      } catch {
        // Viewer destruído entre o clique e a chamada: nada a fazer.
      }
    },
    mouseCaptured,
    releaseMouse,
  };
}
