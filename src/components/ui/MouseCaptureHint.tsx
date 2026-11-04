/**
 * Aviso discreto enquanto o mouse está capturado (cursor oculto, mouse gira a câmera):
 * indica como recuperar o cursor para usar os botões.
 */
export default function MouseCaptureHint() {
  return (
    <div
      role="status"
      className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1.5 text-xs text-stone-200 backdrop-blur-sm sm:top-4"
    >
      Mouse controla a câmera · <kbd className="font-sans font-semibold text-stone-50">Esc</kbd> libera o cursor
    </div>
  );
}
