"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";

import Dialog from "@/components/ui/Dialog";
import {
  EntranceIcon,
  FullscreenIcon,
  HelpIcon,
  HomeIcon,
  InfoIcon,
  MapIcon,
  SpeakerIcon,
  SpeakerOffIcon,
} from "@/components/ui/icons";
import { RENDER_QUALITIES, type RenderQualityId } from "@/data/quality";
import {
  canControlVolume,
  getNarrationSettings,
  setNarrationSettings,
  subscribeNarrationSettings,
} from "@/lib/audio/narration";

type SettingsPanelProps = {
  /** "start": antes da visita (só exibição, áudio e informações); "visit": durante a visita. */
  context: "start" | "visit";
  inputMode: "desktop" | "touch";
  quality: { level: RenderQualityId; onChange: (id: RenderQualityId) => void };
  fullscreen: { supported: boolean; active: boolean; toggle: () => void };
  onClose: () => void;
  onOpenAbout: () => void;
  /** Só durante a visita. */
  onOpenMap?: () => void;
  onOpenHelp?: () => void;
  onReturnToEntrance?: () => void;
  onBackToMenu?: () => void;
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mt-5 first:mt-2">
    <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-clay/85">{title}</h3>
    {children}
  </section>
);

const rowClass =
  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm text-stone-100 transition-colors hover:bg-white/8 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-highlight";

function ActionRow({ icon, label, hint, onClick }: { icon: ReactNode; label: string; hint?: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={rowClass}>
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-stone-200">{icon}</span>
      <span className="min-w-0 flex-1 font-medium">{label}</span>
      {hint}
    </button>
  );
}

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight ${
        checked ? "bg-highlight" : "bg-white/20"
      }`}
    >
      <span
        className={`inline-block size-5 rounded-full shadow transition-transform motion-reduce:transition-none ${
          checked ? "translate-x-[22px] bg-stone-950" : "translate-x-0.5 bg-stone-100"
        }`}
      />
    </button>
  );
}

/**
 * Configurações: um painel só para o que antes ocupava quatro botões (mapa, ajuda, qualidade e tela
 * cheia), mais a volta à entrada, a volta ao menu inicial, o som das narrações e "Sobre".
 * Na tela inicial mostra apenas exibição, áudio e informações.
 */
export default function SettingsPanel({
  context,
  inputMode,
  quality,
  fullscreen,
  onClose,
  onOpenAbout,
  onOpenMap,
  onOpenHelp,
  onReturnToEntrance,
  onBackToMenu,
}: SettingsPanelProps) {
  const visit = context === "visit";
  const narration = useSyncExternalStore(subscribeNarrationSettings, getNarrationSettings, getNarrationSettings);
  // O painel só existe no cliente (abre por um clique), então a detecção pode rodar aqui.
  const [volumeAdjustable] = useState(() => canControlVolume());

  return (
    <Dialog titleId="settings-title" title="Configurações" onClose={onClose} closeLabel="Fechar configurações" brand>
      {visit && (
        <Section title="Visita">
          <div className="-mx-2 space-y-0.5">
            {onOpenMap && (
              <ActionRow
                icon={<MapIcon className="size-4" />}
                label="Mapa e visita"
                hint={
                  inputMode === "desktop" ? (
                    <kbd className="rounded-md border border-white/15 px-1.5 text-[11px] text-stone-400">M</kbd>
                  ) : undefined
                }
                onClick={onOpenMap}
              />
            )}
            {onOpenHelp && <ActionRow icon={<HelpIcon className="size-4" />} label="Como navegar" onClick={onOpenHelp} />}
            {onReturnToEntrance && (
              <ActionRow icon={<EntranceIcon className="size-4" />} label="Voltar à entrada" onClick={onReturnToEntrance} />
            )}
            {onBackToMenu && <ActionRow icon={<HomeIcon className="size-4" />} label="Voltar ao menu inicial" onClick={onBackToMenu} />}
          </div>
        </Section>
      )}

      <Section title="Exibição">
        <p id="quality-label" className="text-sm font-medium text-stone-100">
          Qualidade gráfica
        </p>
        <div role="radiogroup" aria-labelledby="quality-label" className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {RENDER_QUALITIES.map((q) => {
            const selected = q.id === quality.level;
            return (
              <button
                key={q.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => quality.onChange(q.id)}
                className={`rounded-xl px-2 py-2 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight ${
                  selected ? "bg-highlight text-stone-950" : "bg-white/8 text-stone-200 hover:bg-white/14"
                }`}
              >
                {q.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs leading-relaxed text-stone-400">
          Níveis mais baixos reduzem a resolução da imagem e podem deixar a visita mais fluida em aparelhos mais simples.
        </p>

        <div className="mt-4 flex items-center gap-3">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-stone-200">
            <FullscreenIcon active={fullscreen.active} className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-stone-100">Tela cheia</p>
            <p className="text-xs leading-snug text-stone-400">
              {!fullscreen.supported
                ? "Este navegador não permite tela cheia. No iPhone, adicione o site à Tela de Início para usar a tela inteira."
                : visit
                  ? "Esc também sai da tela cheia."
                  : "Ao iniciar, a visita tenta abrir em tela cheia."}
            </p>
          </div>
          {visit && fullscreen.supported && <Switch checked={fullscreen.active} onChange={fullscreen.toggle} label="Tela cheia" />}
        </div>
      </Section>

      <Section title="Áudio">
        <div className="flex items-center gap-3">
          <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-stone-200">
            {narration.enabled ? <SpeakerIcon className="size-4" /> : <SpeakerOffIcon className="size-4" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-stone-100">Narrações</p>
            <p className="text-xs leading-snug text-stone-400">
              {narration.enabled ? "Ativadas" : "Desativadas: as legendas e as animações continuam."}
            </p>
          </div>
          <Switch checked={narration.enabled} onChange={(enabled) => setNarrationSettings({ enabled })} label="Narrações" />
        </div>
        {volumeAdjustable && (
          <label className={`mt-3 flex items-center gap-3 ${narration.enabled ? "" : "opacity-50"}`}>
            <span className="w-8 shrink-0 text-center text-xs text-stone-400">Vol.</span>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={Math.round(narration.volume * 100)}
              disabled={!narration.enabled}
              onChange={(e) => setNarrationSettings({ volume: Number(e.target.value) / 100 })}
              aria-label="Volume das narrações"
              className="h-1.5 flex-1 cursor-pointer accent-[#ffd54a] disabled:cursor-default"
            />
            <span className="w-9 text-right text-xs tabular-nums text-stone-300">{Math.round(narration.volume * 100)}%</span>
          </label>
        )}
      </Section>

      <Section title="Informações">
        <div className="-mx-2">
          <ActionRow icon={<InfoIcon className="size-4" />} label="Sobre a exposição" onClick={onOpenAbout} />
        </div>
      </Section>
    </Dialog>
  );
}
