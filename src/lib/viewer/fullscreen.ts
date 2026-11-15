/**
 * Tela cheia com a API Fullscreen e, onde ela só existe com prefixo (Safari mais antigo, iPad), com
 * `webkitRequestFullscreen`. No iPhone não há tela cheia para elementos da página: os pedidos
 * simplesmente não acontecem e a visita segue na janela (a alternativa é adicionar o site à Tela
 * de Início, que abre sem a barra do navegador; ver `app/manifest.ts`).
 */
type FullscreenDocument = Document & {
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
};
type FullscreenElement = HTMLElement & { webkitRequestFullscreen?: () => void };

/** Eventos de entrada e saída da tela cheia (padrão e prefixado). */
export const FULLSCREEN_EVENTS = ["fullscreenchange", "webkitfullscreenchange"] as const;

export function fullscreenSupported(): boolean {
  const doc = document as FullscreenDocument;
  return !!(doc.fullscreenEnabled || doc.webkitFullscreenEnabled);
}

export function fullscreenElement(): Element | null {
  const doc = document as FullscreenDocument;
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

/**
 * Pede tela cheia para `element`. Deve ser chamado direto no clique ou toque do visitante (o
 * navegador recusa fora de um gesto), sem nenhuma espera antes. Falhas e recusas são silenciosas.
 */
export function requestFullscreen(element: HTMLElement | null) {
  if (!element || fullscreenElement() || !fullscreenSupported()) return;
  const el = element as FullscreenElement;
  try {
    if (el.requestFullscreen) void el.requestFullscreen({ navigationUI: "hide" }).catch(() => undefined);
    else el.webkitRequestFullscreen?.();
  } catch {
    // Sem suporte ou recusado: a visita continua na janela.
  }
}

export function exitFullscreen() {
  const doc = document as FullscreenDocument;
  if (!fullscreenElement()) return;
  try {
    if (doc.exitFullscreen) void doc.exitFullscreen().catch(() => undefined);
    else doc.webkitExitFullscreen?.();
  } catch {
    // Já fora da tela cheia.
  }
}
