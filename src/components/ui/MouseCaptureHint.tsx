"use client";

import { useEffect, useState } from "react";

/** Tempo que o aviso fica visível a cada captura do mouse. */
const VISIBLE_MS = 2000;

/**
 * Aviso discreto quando o mouse é capturado (cursor oculto, mouse gira a câmera): indica como
 * recuperar o cursor para usar os botões. Aparece a cada nova captura e some sozinho depois de
 * 2 segundos (o componente é montado quando a captura começa).
 */
export default function MouseCaptureHint() {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setVisible(false), VISIBLE_MS);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <div
      role="status"
      className={`pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1.5 text-xs text-stone-200 backdrop-blur-sm transition-opacity duration-500 sm:top-4 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      Mouse controla a câmera · <kbd className="font-sans font-semibold text-stone-50">Esc</kbd> libera o cursor
    </div>
  );
}
