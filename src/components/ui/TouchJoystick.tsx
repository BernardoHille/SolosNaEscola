"use client";

import { useEffect, useRef, useState } from "react";

type TouchJoystickProps = {
  /** Recebe o vetor normalizado: x = lateral (direita +), z = frente (+). */
  onMove: (x: number, z: number) => void;
  /** Velocidade máxima, como fração de `setMoveInput`. */
  maxSpeed: number;
};

const RADIUS = 44;
const DEAD_ZONE = 0.12;

/**
 * Joystick virtual para telas sensíveis ao toque.
 *
 * Usa captura de ponteiro e solta o movimento em pointerup, pointercancel,
 * lostpointercapture, perda de foco da janela, aba oculta e desmontagem — nenhum
 * toque interrompido deixa o visitante andando sozinho.
 */
export default function TouchJoystick({ onMove, maxSpeed }: TouchJoystickProps) {
  const baseRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef<number | null>(null);
  const [knob, setKnob] = useState<[number, number]>([0, 0]);
  const onMoveRef = useRef(onMove);
  useEffect(() => {
    onMoveRef.current = onMove;
  });

  useEffect(() => {
    const release = () => {
      pointerRef.current = null;
      setKnob([0, 0]);
      onMoveRef.current(0, 0);
    };
    const onVisibility = () => document.visibilityState !== "visible" && release();
    window.addEventListener("blur", release);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", release);
      document.removeEventListener("visibilitychange", onVisibility);
      onMoveRef.current(0, 0);
    };
  }, []);

  const update = (clientX: number, clientY: number) => {
    const rect = baseRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = (clientX - (rect.left + rect.width / 2)) / RADIUS;
    const dy = (clientY - (rect.top + rect.height / 2)) / RADIUS;
    const len = Math.hypot(dx, dy);
    const magnitude = Math.min(1, len);
    const ux = len > 0 ? dx / len : 0;
    const uy = len > 0 ? dy / len : 0;
    setKnob([ux * magnitude * RADIUS, uy * magnitude * RADIUS]);
    if (magnitude < DEAD_ZONE) {
      onMoveRef.current(0, 0);
      return;
    }
    // Resposta suave: pequenos deslocamentos do polegar andam devagar.
    const speed = ((magnitude - DEAD_ZONE) / (1 - DEAD_ZONE)) ** 1.5 * maxSpeed;
    // Para cima na tela = frente (+z).
    onMoveRef.current(ux * speed, -uy * speed);
  };

  const end = (event: React.PointerEvent) => {
    if (pointerRef.current !== event.pointerId) return;
    pointerRef.current = null;
    setKnob([0, 0]);
    onMoveRef.current(0, 0);
  };

  return (
    <div
      ref={baseRef}
      role="group"
      aria-label="Controle de movimento: arraste para andar"
      className="pointer-events-auto relative size-28 touch-none select-none rounded-full border border-white/20 bg-black/30 backdrop-blur-sm"
      onPointerDown={(event) => {
        if (pointerRef.current !== null) return;
        pointerRef.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        update(event.clientX, event.clientY);
      }}
      onPointerMove={(event) => {
        if (pointerRef.current === event.pointerId) update(event.clientX, event.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
      onLostPointerCapture={end}
      onContextMenu={(event) => event.preventDefault()}
    >
      <div
        className="absolute left-1/2 top-1/2 size-12 rounded-full bg-white/70 shadow-lg"
        style={{ transform: `translate(calc(-50% + ${knob[0]}px), calc(-50% + ${knob[1]}px))` }}
      />
    </div>
  );
}
