"use client";

/**
 * Ferramenta de calibração da entrada (somente desenvolvimento — ver
 * `src/app/dev/camera/page.tsx`).
 *
 * Usa o viewer com a interface oficial completa (Orbit, Fly, Walk, sobreposição de
 * colisão) para localizar a entrada, lê a pose da câmera pelo adaptador
 * `readCameraPose` e gera o objeto `ENTRANCE_SPAWN` para `src/data/visit.ts`.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ViewerFlags, ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";

import GaussianViewer from "@/components/viewer/GaussianViewer";
import { buildExperienceSettings, MODEL } from "@/data/experience";
import { ENTRANCE_SPAWN, type SpawnPose } from "@/data/visit";
import { type CameraReading, readCameraPose } from "@/lib/viewer/cameraPose";
import { INITIAL_STATUS, type LoadStatus } from "@/lib/viewer/loadStatus";
import { formatSpawnPose, readSpawnOverride, writeSpawnOverride } from "@/lib/viewer/spawnOverride";
import { enterWalkIfReady, toggleCollisionOverlay, toggleWalkOrFly } from "@/lib/viewer/viewerCommands";

const CALIBRATION_OPTIONS: ViewerFlags = { ui: true, noanim: true };

/** Altura do piso de referência (y) no espaço do viewer, medida no SOG escalado. */
const REFERENCE_FLOOR_Y = 0;

type ViewerStatus = {
  cameraMode: string;
  walkAllowed: boolean;
  hasCollisionOverlay: boolean;
  collisionOverlayEnabled: boolean;
};

const fmt = (n: number, d = 3) => n.toFixed(d);

export default function CameraCalibration() {
  const [override, setOverride] = useState<SpawnPose | null>(null);
  const [overrideLoaded, setOverrideLoaded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<LoadStatus>(INITIAL_STATUS);
  const [viewer, setViewer] = useState<ViewerHandle | null>(null);
  const [pose, setPose] = useState<CameraReading | null>(null);
  const [viewerStatus, setViewerStatus] = useState<ViewerStatus | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [autoWalk, setAutoWalk] = useState(false);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setOverride(readSpawnOverride());
      setOverrideLoaded(true);
    }, 0);
    return () => window.clearTimeout(id);
  }, []);

  const activeSpawn = override ?? ENTRANCE_SPAWN;
  const settings = useMemo(() => buildExperienceSettings(activeSpawn), [activeSpawn]);

  // Leitura contínua da pose (10 Hz) e do estado do viewer.
  useEffect(() => {
    if (!viewer) return;
    const id = window.setInterval(() => {
      setPose(readCameraPose(viewer));
      const s = viewer.state;
      setViewerStatus({
        cameraMode: s.cameraMode,
        walkAllowed: s.walkAllowed,
        hasCollisionOverlay: s.hasCollisionOverlay,
        collisionOverlayEnabled: s.collisionOverlayEnabled,
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [viewer]);

  // Após "Aplicar", entra no Walk Mode assim que a colisão estiver pronta.
  useEffect(() => {
    if (!viewer || !autoWalk) return;
    const tryWalk = () => enterWalkIfReady(viewer);
    const handles = [viewer.events.on("loaded:changed", tryWalk), viewer.events.on("walkAllowed:changed", tryWalk)];
    tryWalk();
    return () => handles.forEach((h) => h.off());
  }, [viewer, autoWalk]);

  const flash = (text: string) => {
    setMessage(text);
    window.setTimeout(() => setMessage(null), 2500);
  };

  const currentSpawn = useCallback((): SpawnPose | null => {
    if (!pose) return null;
    return { position: pose.position, yawDeg: pose.yawDeg, pitchDeg: pose.pitchDeg, fov: activeSpawn.fov };
  }, [pose, activeSpawn.fov]);

  const copy = async () => {
    const spawn = currentSpawn();
    if (!spawn) return;
    try {
      await navigator.clipboard.writeText(formatSpawnPose(spawn));
      flash("Configuração copiada. Cole em src/data/visit.ts.");
    } catch {
      flash("Não foi possível copiar; selecione o texto do painel.");
    }
  };

  const applyAsEntrance = () => {
    const spawn = currentSpawn();
    if (!spawn) return;
    writeSpawnOverride(spawn);
    setOverride(spawn);
    setAutoWalk(true);
    setAttempt((n) => n + 1);
    flash("Entrada de teste aplicada (somente neste navegador, em desenvolvimento).");
  };

  const restoreDefault = () => {
    writeSpawnOverride(null);
    setOverride(null);
    setAutoWalk(false);
    setAttempt((n) => n + 1);
    flash("Entrada restaurada para o valor de src/data/visit.ts.");
  };

  const toggleWalk = () => viewer && toggleWalkOrFly(viewer);
  const toggleCollision = () => viewer && toggleCollisionOverlay(viewer);

  const spawnText = currentSpawn();

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-black text-stone-100">
      {overrideLoaded && (
        <div className="absolute inset-0">
          <GaussianViewer
            key={attempt}
            contentUrl={MODEL.url}
            contentFilename={MODEL.filename}
            settings={settings}
            collisionUrl={MODEL.collisionUrl}
            sceneScale={MODEL.scale}
            options={CALIBRATION_OPTIONS}
            onStatusChange={setStatus}
            onViewerChange={setViewer}
          />
        </div>
      )}

      <aside className="absolute left-3 top-3 z-20 w-[min(22rem,calc(100vw-1.5rem))] rounded-xl bg-stone-950/85 p-4 text-xs shadow-2xl backdrop-blur-md">
        <p className="text-[10px] uppercase tracking-[0.2em] text-amber-300">Desenvolvimento</p>
        <h1 className="mt-0.5 text-sm font-semibold">Calibração da entrada</h1>

        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono">
          <dt className="text-stone-400">carga</dt>
          <dd>
            {status.phase}
            {status.phase === "downloading" ? ` ${status.progress}%` : ""}
          </dd>
          <dt className="text-stone-400">modo</dt>
          <dd>
            {viewerStatus?.cameraMode ?? "—"} · walkAllowed {String(viewerStatus?.walkAllowed ?? false)}
          </dd>
          <dt className="text-stone-400">x y z</dt>
          <dd>{pose ? pose.position.map((v) => fmt(v)).join("  ") : "—"}</dd>
          <dt className="text-stone-400">yaw / pitch</dt>
          <dd>{pose ? `${fmt(pose.yawDeg, 1)}° / ${fmt(pose.pitchDeg, 1)}°` : "—"}</dd>
          <dt className="text-stone-400">fov</dt>
          <dd>{pose ? `${fmt(pose.fov, 1)}°` : "—"}</dd>
          <dt className="text-stone-400">altura</dt>
          <dd>{pose ? `${fmt(pose.position[1] - REFERENCE_FLOOR_Y, 2)} m sobre o piso de referência (y = 0)` : "—"}</dd>
          <dt className="text-stone-400">entrada</dt>
          <dd>{override ? "teste (localStorage)" : "src/data/visit.ts"}</dd>
        </dl>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={copy} disabled={!pose} className="rounded-md bg-amber-300 px-2 py-1.5 font-semibold text-stone-950 disabled:opacity-40">
            Copiar configuração
          </button>
          <button type="button" onClick={applyAsEntrance} disabled={!pose} className="rounded-md bg-white/10 px-2 py-1.5 hover:bg-white/20 disabled:opacity-40">
            Aplicar como entrada
          </button>
          <button type="button" onClick={toggleWalk} disabled={!viewerStatus?.walkAllowed} className="rounded-md bg-white/10 px-2 py-1.5 hover:bg-white/20 disabled:opacity-40">
            {viewerStatus?.cameraMode === "walk" ? "Sair do Walk (Fly)" : "Testar Walk aqui"}
          </button>
          <button type="button" onClick={restoreDefault} className="rounded-md bg-white/10 px-2 py-1.5 hover:bg-white/20">
            Restaurar padrão
          </button>
          <button
            type="button"
            onClick={toggleCollision}
            disabled={!viewerStatus?.hasCollisionOverlay}
            className="col-span-2 rounded-md bg-white/10 px-2 py-1.5 hover:bg-white/20 disabled:opacity-40"
            title="Requer WebGPU"
          >
            {viewerStatus?.collisionOverlayEnabled ? "Ocultar colisão" : "Mostrar colisão (voxels)"}
          </button>
        </div>

        {spawnText && (
          <pre className="mt-3 select-all overflow-x-auto rounded-md bg-black/50 p-2 font-mono text-[10px] leading-relaxed text-stone-300">
            {formatSpawnPose(spawnText)}
          </pre>
        )}
        {message && <p className="mt-2 text-amber-200">{message}</p>}
        <p className="mt-2 leading-relaxed text-stone-500">
          Use Fly (tecla 2) para chegar ao tapete, aponte para o interior e clique em “Aplicar como entrada” para
          testar no Walk Mode. A pose de teste vale também para a página inicial em desenvolvimento.
        </p>
      </aside>
    </main>
  );
}
