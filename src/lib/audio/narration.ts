/**
 * Áudio das narrações: um único elemento `<audio>` para toda a visita e a preferência de som do
 * visitante (ligado/desligado e volume), lembrada neste navegador.
 *
 * - O elemento é o mesmo em todas as inspeções (`InspectionDescription` troca só o `src`). Assim,
 *   o toque em "Iniciar visita" o libera de uma vez (`unlockNarrationAudio`), como pedem as regras
 *   de reprodução automática dos navegadores, em especial no iPhone.
 * - "Som desligado" silencia a narração sem pará-la: as legendas e as animações, que seguem o
 *   tempo da narração, continuam funcionando.
 * - O volume é aplicado ao elemento. No iPhone e no iPad o volume de um `<audio>` só muda pelos
 *   botões do aparelho (`canControlVolume` detecta isso e a interface esconde o controle).
 */
export type NarrationSettings = { enabled: boolean; volume: number };

export const NARRATION_STORAGE_KEY = "solos:narracao";
export const DEFAULT_NARRATION: NarrationSettings = { enabled: true, volume: 1 };

/** Lê a preferência salva; valores inválidos voltam ao padrão. */
export function parseNarrationSettings(raw: string | null): NarrationSettings {
  if (!raw) return DEFAULT_NARRATION;
  try {
    const data = JSON.parse(raw) as Partial<NarrationSettings> | null;
    const enabled = typeof data?.enabled === "boolean" ? data.enabled : DEFAULT_NARRATION.enabled;
    const volume =
      typeof data?.volume === "number" && Number.isFinite(data.volume)
        ? Math.max(0, Math.min(1, data.volume))
        : DEFAULT_NARRATION.volume;
    return { enabled, volume };
  } catch {
    return DEFAULT_NARRATION;
  }
}

let settings: NarrationSettings | null = null;
const listeners = new Set<() => void>();
let audio: HTMLAudioElement | null = null;

const load = (): NarrationSettings => {
  if (settings) return settings;
  try {
    settings = parseNarrationSettings(window.localStorage.getItem(NARRATION_STORAGE_KEY));
  } catch {
    settings = DEFAULT_NARRATION;
  }
  return settings;
};

const apply = () => {
  if (!audio) return;
  const s = load();
  audio.muted = !s.enabled;
  audio.volume = s.volume;
};

/** Preferência atual (no servidor, o padrão). */
export function getNarrationSettings(): NarrationSettings {
  return typeof window === "undefined" ? DEFAULT_NARRATION : load();
}

export function setNarrationSettings(patch: Partial<NarrationSettings>) {
  settings = parseNarrationSettings(JSON.stringify({ ...load(), ...patch }));
  try {
    window.localStorage.setItem(NARRATION_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Sem armazenamento: a escolha vale só nesta visita.
  }
  apply();
  listeners.forEach((fn) => fn());
}

/** Volta ao padrão (som ligado, volume máximo) e apaga a preferência salva. */
export function resetNarrationSettings() {
  settings = DEFAULT_NARRATION;
  try {
    window.localStorage.removeItem(NARRATION_STORAGE_KEY);
  } catch {
    // Sem armazenamento: nada a apagar.
  }
  apply();
  listeners.forEach((fn) => fn());
}

export function subscribeNarrationSettings(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** O elemento de áudio das narrações (criado na primeira chamada, já com a preferência aplicada). */
export function getNarrationAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.preload = "metadata";
    apply();
  }
  return audio;
}

/** WAV de 0,1 s em silêncio, usado só para liberar o elemento dentro do gesto do visitante. */
function silentWav() {
  const samples = 800;
  const bytes = new Uint8Array(44 + samples);
  const view = new DataView(bytes.buffer);
  const text = (at: number, s: string) => [...s].forEach((c, i) => (bytes[at + i] = c.charCodeAt(0)));
  text(0, "RIFF");
  view.setUint32(4, 36 + samples, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, 8000, true);
  view.setUint32(28, 8000, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  text(36, "data");
  view.setUint32(40, samples, true);
  bytes.fill(128, 44); // silêncio em PCM de 8 bits
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return `data:audio/wav;base64,${btoa(binary)}`;
}

/**
 * Libera o áudio das narrações: toca um trecho de silêncio no elemento compartilhado. Deve ser
 * chamado direto no clique ou toque do visitante. Não faz nada se uma narração já estiver carregada.
 */
export function unlockNarrationAudio() {
  const el = getNarrationAudio();
  if (el.getAttribute("src")) return;
  el.src = silentWav();
  el.play()
    .catch(() => undefined)
    .finally(() => {
      if (!el.src.startsWith("data:")) return;
      el.pause();
      el.removeAttribute("src");
      el.load();
    });
}

let volumeControl: boolean | null = null;

/** O navegador deixa mudar o volume do áudio pela página? (No iPhone e no iPad, não.) */
export function canControlVolume(): boolean {
  if (volumeControl !== null) return volumeControl;
  try {
    const probe = new Audio();
    probe.volume = 0.5;
    volumeControl = probe.volume === 0.5;
  } catch {
    volumeControl = false;
  }
  return volumeControl;
}
