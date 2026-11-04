"use client";

import { useEffect, useState } from "react";

import { INTERACTION_VOLUMES, type InteractionVolume, serializeVolumes, type Vec3 } from "@/data/interactions";
import { add, scale } from "@/lib/interaction/geometry";
import type { InteractionManager } from "@/lib/interaction/interactionManager";

type InteractionCalibratorProps = {
  volumes: InteractionVolume[];
  onChange: (volumes: InteractionVolume[]) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  manager: InteractionManager | null;
};

type Field = "position" | "rotationDeg" | "size";

const FIELDS: { key: Field; label: string; step: number; axes: string[] }[] = [
  { key: "position", label: "Posição (m)", step: 0.01, axes: ["X", "Y", "Z"] },
  { key: "rotationDeg", label: "Rotação (°)", step: 1, axes: ["X", "Y", "Z"] },
  { key: "size", label: "Tamanho (m)", step: 0.01, axes: ["L", "A", "P"] },
];

const input =
  "w-full rounded bg-white/10 px-1.5 py-1 font-mono text-[11px] text-stone-100 outline-none focus:ring-1 focus:ring-sky-300";

/**
 * Calibração dos volumes de interação (`?debugInteractions=1`): mostra os volumes no splat
 * (desenhados pela camada de interação), permite ajustar posição, rotação, tamanho e
 * distância, e copia o JSON final para `src/data/interactions.json`. As alterações valem só
 * nesta aba até serem coladas no arquivo.
 */
export default function InteractionCalibrator({
  volumes,
  onChange,
  selectedId,
  onSelect,
  manager,
}: InteractionCalibratorProps) {
  const selected = volumes.find((v) => v.id === selectedId) ?? null;
  const [camera, setCamera] = useState<{ position: Vec3; forward: Vec3 } | null>(null);
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!manager) return;
    const id = window.setInterval(() => setCamera(manager.readCamera()), 250);
    return () => window.clearInterval(id);
  }, [manager]);

  const update = (patch: Partial<InteractionVolume>) => {
    if (!selected) return;
    onChange(volumes.map((v) => (v.id === selected.id ? { ...v, ...patch } : v)));
  };
  const setAxis = (field: Field, axis: number, value: number) => {
    if (!selected || !Number.isFinite(value)) return;
    const next = [...selected[field]] as Vec3;
    next[axis] = value;
    update({ [field]: next });
  };
  // Move todos os volumes juntos (alinhar o conjunto inteiro de uma vez).
  const shiftAll = (axis: number, delta: number) =>
    onChange(
      volumes.map((v) => {
        const p = [...v.position] as Vec3;
        p[axis] = Math.round((p[axis] + delta) * 1000) / 1000;
        return { ...v, position: p };
      }),
    );
  const bringToAim = () => {
    if (!camera) return;
    const p = add(camera.position, scale(camera.forward, 1.2));
    update({ position: p.map((n) => Math.round(n * 1000) / 1000) as Vec3 });
  };
  const json = serializeVolumes(volumes);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <aside
      className="absolute left-3 top-24 z-30 w-64 max-h-[calc(100dvh-8rem)] overflow-y-auto rounded-xl bg-stone-950/90 p-3 text-[11px] text-stone-200 shadow-2xl backdrop-blur-md"
      aria-label="Calibração dos volumes de interação"
    >
      <header className="flex items-center justify-between gap-2">
        <p className="font-semibold uppercase tracking-[0.15em] text-sky-300">Calibração</p>
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="rounded px-1.5 py-0.5 text-stone-400 hover:bg-white/10"
        >
          {collapsed ? "Abrir" : "Recolher"}
        </button>
      </header>

      {!collapsed && (
        <>
          <p className="mt-1 font-mono text-stone-400">
            Câmera: {camera ? camera.position.map((n) => n.toFixed(2)).join(", ") : "—"}
          </p>

          <div className="mt-2 grid grid-cols-2 gap-1">
            {volumes.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelect(v.id)}
                className={`truncate rounded px-1.5 py-1 text-left font-mono ${
                  v.id === selectedId ? "bg-sky-400/25 text-sky-100" : "bg-white/5 hover:bg-white/10"
                }`}
              >
                {v.id}
              </button>
            ))}
          </div>

          {selected && (
            <div className="mt-3 space-y-2">
              {FIELDS.map(({ key, label, step, axes }) => (
                <fieldset key={key}>
                  <legend className="mb-0.5 text-stone-400">{label}</legend>
                  <div className="grid grid-cols-3 gap-1">
                    {axes.map((axis, i) => (
                      <label key={axis} className="flex items-center gap-1">
                        <span className="w-2 text-stone-500">{axis}</span>
                        <input
                          type="number"
                          step={step}
                          value={selected[key][i]}
                          onChange={(e) => setAxis(key, i, e.target.valueAsNumber)}
                          className={input}
                        />
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <label className="flex items-center gap-2">
                <span className="text-stone-400">Distância máx. (m)</span>
                <input
                  type="number"
                  step={0.1}
                  min={0.2}
                  value={selected.maxDistance}
                  onChange={(e) => Number.isFinite(e.target.valueAsNumber) && update({ maxDistance: e.target.valueAsNumber })}
                  className={`${input} w-16`}
                />
              </label>
              <button
                type="button"
                onClick={bringToAim}
                className="w-full rounded bg-white/10 px-2 py-1 hover:bg-white/20"
              >
                Trazer para a mira (1,2 m à frente)
              </button>
            </div>
          )}

          <fieldset className="mt-3">
            <legend className="mb-0.5 text-stone-400">Mover todos (5 cm)</legend>
            <div className="grid grid-cols-3 gap-1">
              {["X", "Y", "Z"].map((axis, i) => (
                <div key={axis} className="flex gap-0.5">
                  <button type="button" onClick={() => shiftAll(i, -0.05)} className="flex-1 rounded bg-white/10 hover:bg-white/20">
                    {axis}−
                  </button>
                  <button type="button" onClick={() => shiftAll(i, 0.05)} className="flex-1 rounded bg-white/10 hover:bg-white/20">
                    {axis}+
                  </button>
                </div>
              ))}
            </div>
          </fieldset>

          <div className="mt-3 flex gap-1">
            <button type="button" onClick={copy} className="flex-1 rounded bg-sky-400/25 px-2 py-1 font-medium text-sky-100 hover:bg-sky-400/35">
              {copied ? "Copiado!" : "Copiar JSON"}
            </button>
            <button
              type="button"
              onClick={() => onChange(INTERACTION_VOLUMES)}
              className="rounded bg-white/10 px-2 py-1 hover:bg-white/20"
            >
              Restaurar
            </button>
          </div>
          <textarea
            readOnly
            value={json}
            className="mt-2 h-24 w-full resize-y rounded bg-black/50 p-1.5 font-mono text-[10px] text-stone-300"
            aria-label="JSON dos volumes (colar em src/data/interactions.json)"
          />
          <p className="mt-1 text-stone-500">Cole em src/data/interactions.json.</p>
        </>
      )}
    </aside>
  );
}
