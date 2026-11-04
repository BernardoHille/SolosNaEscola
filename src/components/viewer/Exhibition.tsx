"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ViewerFlags, ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";

import InspectionOverlay from "@/components/inspection/InspectionOverlay";
import { useInspection } from "@/components/inspection/useInspection";
import InteractionCalibrator from "@/components/interaction/InteractionCalibrator";
import InteractionLayer from "@/components/interaction/InteractionLayer";
import ErrorState from "@/components/ui/ErrorState";
import FpsCounter from "@/components/ui/FpsCounter";
import HelpPanel from "@/components/ui/HelpPanel";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import MouseCaptureHint from "@/components/ui/MouseCaptureHint";
import ProjectBadge from "@/components/ui/ProjectBadge";
import TouchJoystick from "@/components/ui/TouchJoystick";
import VisitControls from "@/components/ui/VisitControls";
import GaussianViewer from "@/components/viewer/GaussianViewer";
import { useRenderQuality } from "@/components/viewer/useRenderQuality";
import { useWalkVisit } from "@/components/viewer/useWalkVisit";
import { buildExperienceSettings, EXPERIENCE_SETTINGS, MODEL } from "@/data/experience";
import { INTERACTION_VOLUMES, type InteractionVolume } from "@/data/interactions";
import { MOVEMENT } from "@/data/visit";
import type { InteractionManager } from "@/lib/interaction/interactionManager";
import { INITIAL_STATUS, type LoadStatus } from "@/lib/viewer/loadStatus";
import { IS_DEV, readSpawnOverride } from "@/lib/viewer/spawnOverride";

/**
 * Opções do viewer para a visita pública:
 * - `ui: false`: sem os controles de Orbit/Fly/Frame do viewer; a interface é própria.
 * - `noanim: true`: sem a animação automática de câmera ao abrir.
 */
const VIEWER_OPTIONS: ViewerFlags = { ui: false, noanim: true };

const HELP_SEEN_KEY = "solos:help-seen";

/** Calibração dos volumes de interação: `?debugInteractions=1` na URL. */
const readDebugInteractions = () => {
  try {
    return new URLSearchParams(window.location.search).get("debugInteractions") === "1";
  } catch {
    return false;
  }
};

const readHelpSeen = () => {
  try {
    return window.localStorage.getItem(HELP_SEEN_KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * Tela principal: visita em primeira pessoa. O visualizador ocupa toda a área
 * visível (100dvh) com sobreposições mínimas.
 */
export default function Exhibition() {
  const [status, setStatus] = useState<LoadStatus>(INITIAL_STATUS);
  // Trocar a `key` remonta o viewer: a instância anterior é destruída e uma nova é
  // criada do zero.
  const [attempt, setAttempt] = useState(0);
  const [viewer, setViewer] = useState<ViewerHandle | null>(null);
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [qualityOpen, setQualityOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  // Em desenvolvimento, uma entrada de teste salva pela calibração substitui a
  // configurada. Em produção `readSpawnOverride()` sempre retorna null.
  const [settings] = useState(() => {
    const override = typeof window === "undefined" ? null : readSpawnOverride();
    return override ? buildExperienceSettings(override) : EXPERIENCE_SETTINGS;
  });

  const onCollisionError = useCallback((detail: string) => {
    setStatus((current) =>
      current.phase === "error" ? current : { ...current, phase: "error", errorKind: "collision", errorDetail: detail },
    );
  }, []);

  // Inspeção de objetos (conjunto aberto e etapa) e volumes de interação no splat.
  const inspection = useInspection();
  const inspecting = !!inspection.set;
  const [volumes, setVolumes] = useState<InteractionVolume[]>(INTERACTION_VOLUMES);
  const [debugInteractions] = useState(() => typeof window !== "undefined" && readDebugInteractions());
  const [debugSelected, setDebugSelected] = useState<string | null>(INTERACTION_VOLUMES[0]?.id ?? null);
  const [interactionManager, setInteractionManager] = useState<InteractionManager | null>(null);

  const panelOpen = helpOpen || qualityOpen;
  const walk = useWalkVisit(viewer, stage, MODEL.collisionUrl, onCollisionError, {
    captureAllowed: !panelOpen && !inspecting,
    suspended: inspecting,
  });
  const quality = useRenderQuality(viewer, walk.inputMode);

  // Painel de ajuda ou menu de qualidade aberto: devolve o cursor para que o visitante
  // possa usá-lo.
  const { open: openInspection } = inspection;
  const inspect = useCallback((volume: InteractionVolume) => openInspection(volume.setId), [openInspection]);

  const { releaseMouse } = walk;
  useEffect(() => {
    if (panelOpen) releaseMouse();
  }, [panelOpen, releaseMouse]);

  // Desenvolvimento: expõe o handle no console para inspeção e testes manuais.
  useEffect(() => {
    if (!IS_DEV) return;
    const w = window as unknown as Record<string, unknown>;
    w.__SOLOS_VIEWER__ = viewer;
    return () => {
      delete w.__SOLOS_VIEWER__;
    };
  }, [viewer]);

  const retry = useCallback(() => {
    setStatus(INITIAL_STATUS);
    setAttempt((n) => n + 1);
  }, []);

  // Instruções na primeira visita (lembradas apenas neste navegador).
  const walkActive = walk.walkActive;
  useEffect(() => {
    if (!walkActive || readHelpSeen()) return;
    const id = window.setTimeout(() => setHelpOpen(true), 400);
    return () => window.clearTimeout(id);
  }, [walkActive]);

  const closeHelp = useCallback(() => {
    setHelpOpen(false);
    try {
      window.localStorage.setItem(HELP_SEEN_KEY, "1");
    } catch {
      // Sem armazenamento: as instruções podem reaparecer na próxima visita.
    }
  }, []);

  // Tela cheia do conjunto (viewer + controles), não só do canvas.
  const [fullscreenSupported, setFullscreenSupported] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const sync = () => {
      setFullscreenSupported(!!document.fullscreenEnabled);
      setIsFullscreen(document.fullscreenElement === mainRef.current);
    };
    const id = window.setTimeout(sync, 0);
    document.addEventListener("fullscreenchange", sync);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("fullscreenchange", sync);
    };
  }, []);
  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void mainRef.current?.requestFullscreen().catch(() => undefined);
  }, []);

  const failed = status.phase === "error" || status.phase === "unsupported";
  const visiting = status.phase === "ready" && walk.walkActive && !failed;

  return (
    <main ref={mainRef} className="relative h-dvh w-full overflow-hidden bg-black">
      {!failed && (
        <div ref={setStage} className="absolute inset-0">
          <GaussianViewer
            key={attempt}
            contentUrl={MODEL.url}
            contentFilename={MODEL.filename}
            settings={settings}
            collisionUrl={MODEL.collisionUrl}
            sceneScale={MODEL.scale}
            options={VIEWER_OPTIONS}
            onStatusChange={setStatus}
            onViewerChange={setViewer}
          />
        </div>
      )}

      {visiting && (
        <>
          <ProjectBadge>
            <FpsCounter viewer={viewer} />
          </ProjectBadge>
          <VisitControls
            onReturnToEntrance={walk.returnToEntrance}
            onHelp={() => setHelpOpen(true)}
            fullscreen={{ supported: fullscreenSupported, active: isFullscreen, toggle: toggleFullscreen }}
            quality={{
              level: quality.level,
              onChange: quality.setLevel,
              open: qualityOpen,
              onOpenChange: setQualityOpen,
            }}
          />
          {stage && viewer && (
            <InteractionLayer
              viewer={viewer}
              container={stage}
              volumes={volumes}
              enabled={!panelOpen && !inspecting}
              inputMode={walk.inputMode}
              mouseCaptured={walk.mouseCaptured}
              debug={debugInteractions ? { selectedId: debugSelected } : null}
              onInspect={inspect}
              onManager={setInteractionManager}
            />
          )}
          {debugInteractions && !inspecting && (
            <InteractionCalibrator
              volumes={volumes}
              onChange={setVolumes}
              selectedId={debugSelected}
              onSelect={setDebugSelected}
              manager={interactionManager}
            />
          )}
          {walk.inputMode === "touch" && !inspecting && (
            <div className="pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-10">
              <TouchJoystick onMove={walk.setJoystick} maxSpeed={MOVEMENT.run} />
            </div>
          )}
          {walk.mouseCaptured && <MouseCaptureHint />}
          {helpOpen && <HelpPanel inputMode={walk.inputMode} onClose={closeHelp} />}
          {inspection.set && (
            <InspectionOverlay
              set={inspection.set}
              index={inspection.index}
              inputMode={walk.inputMode}
              onNext={inspection.next}
              onPrevious={inspection.previous}
              onClose={inspection.close}
            />
          )}
        </>
      )}

      {!failed && (
        <LoadingOverlay status={status} totalBytes={MODEL.sizeBytes} waitingForWalk={!walk.walkActive} />
      )}
      {failed && <ErrorState status={status} onRetry={retry} />}
    </main>
  );
}
