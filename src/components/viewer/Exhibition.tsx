"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import MiniMapDock from "@/components/visit/MiniMapDock";
import { useGuidance } from "@/components/visit/useGuidance";
import { useVisitorTracker } from "@/components/visit/useVisitorTracker";
import { useVisitRecord } from "@/components/visit/useVisitRecord";
import VisitNavigationPanel from "@/components/visit/VisitNavigationPanel";
import VisitPanel from "@/components/visit/VisitPanel";
import { useRenderQuality } from "@/components/viewer/useRenderQuality";
import { useWalkVisit } from "@/components/viewer/useWalkVisit";
import { AVAILABLE_IDS, AVAILABLE_MODULES, EXHIBITION_MODULES, GUIDED_ROUTE, moduleById } from "@/data/exhibitionModules";
import { buildExperienceSettings, EXPERIENCE_SETTINGS, MODEL } from "@/data/experience";
import { INTERACTION_VOLUMES, type InteractionVolume } from "@/data/interactions";
import { MOVEMENT } from "@/data/visit";
import type { InteractionManager } from "@/lib/interaction/interactionManager";
import { INITIAL_STATUS, type LoadStatus } from "@/lib/viewer/loadStatus";
import { IS_DEV, readSpawnOverride } from "@/lib/viewer/spawnOverride";
import { progressOf } from "@/lib/visit/visitProgress";

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
  // Painel "Mapa e visita" (e o módulo escolhido ao abri-lo pelo minimapa).
  const [mapOpen, setMapOpen] = useState(false);
  const [mapSelection, setMapSelection] = useState<string | null>(null);
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

  const panelOpen = helpOpen || qualityOpen || mapOpen;
  const walk = useWalkVisit(viewer, stage, MODEL.collisionUrl, onCollisionError, {
    captureAllowed: !panelOpen && !inspecting,
    // Com o painel do mapa aberto, o teclado não move o visitante (sem movimento involuntário).
    suspended: inspecting || mapOpen,
  });
  const quality = useRenderQuality(viewer, walk.inputMode);

  // Orientação: posição do visitante, registro da visita, destino (visita guiada ou módulo
  // escolhido no mapa) e percurso até ele.
  const tracker = useVisitorTracker(viewer);
  const visit = useVisitRecord();
  const { markExplored, setMode, setGuideStep, setMinimapOpen, resetProgress } = visit;
  const { explored: exploredIds, mode, guideStep, minimapOpen } = visit.record;
  const [orientTargetId, setOrientTargetId] = useState<string | null>(null);
  const guided = mode === "guided";
  const target = guided ? (GUIDED_ROUTE[guideStep] ?? null) : moduleById(orientTargetId);
  const guidance = useGuidance(tracker, target);
  const explored = useMemo(() => new Set(exploredIds), [exploredIds]);
  const progress = progressOf(exploredIds, AVAILABLE_IDS);

  // Um módulo conta como explorado quando a inspeção dele é aberta (tecla E, clique ou toque:
  // todas passam por aqui).
  const { open: openInspection } = inspection;
  const inspect = useCallback(
    (volume: InteractionVolume) => {
      markExplored(volume.setId);
      openInspection(volume.setId);
    },
    [markExplored, openInspection],
  );

  // Um painel de cada vez: abrir um fecha os outros.
  const openMap = useCallback((moduleId?: string) => {
    setMapSelection(moduleId ?? null);
    setHelpOpen(false);
    setQualityOpen(false);
    setMapOpen(true);
  }, []);
  const closeMap = useCallback(() => setMapOpen(false), []);
  const setQualityMenuOpen = useCallback((open: boolean) => {
    setQualityOpen(open);
    if (open) setMapOpen(false);
  }, []);
  const startGuided = useCallback(
    (step: number) => {
      setGuideStep(step);
      setMode("guided");
      setOrientTargetId(null);
      setMapOpen(false);
    },
    [setGuideStep, setMode],
  );
  const orientTo = useCallback((id: string) => {
    setOrientTargetId(id);
    setMapOpen(false);
  }, []);

  // Painel de ajuda, menu de qualidade ou mapa aberto: devolve o cursor para que o visitante
  // possa usá-lo.

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

  // Tecla M: abre e fecha o painel "Mapa e visita" (fora da inspeção e da ajuda).
  useEffect(() => {
    if (!visiting || inspecting || helpOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "KeyM" || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (mapOpen) closeMap();
      else openMap();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visiting, inspecting, helpOpen, mapOpen, openMap, closeMap]);

  const touch = walk.inputMode === "touch";
  // Minimapa compacto: aberto por padrão no computador, recolhido no celular.
  const minimapShown = minimapOpen ?? !touch;

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
          {/* Na inspeção, a interface da visita sai de cena (a inspeção tem a sua). */}
          {!inspecting && (
            <>
              <ProjectBadge>
                <FpsCounter viewer={viewer} />
              </ProjectBadge>
              <VisitControls
                onReturnToEntrance={walk.returnToEntrance}
                onMap={() => (mapOpen ? closeMap() : openMap())}
                mapOpen={mapOpen}
                onHelp={() => {
                  setMapOpen(false);
                  setHelpOpen(true);
                }}
                fullscreen={{ supported: fullscreenSupported, active: isFullscreen, toggle: toggleFullscreen }}
                quality={{
                  level: quality.level,
                  onChange: quality.setLevel,
                  open: qualityOpen,
                  onOpenChange: setQualityMenuOpen,
                }}
              />
              {!panelOpen && (
                <MiniMapDock
                  open={minimapShown}
                  onOpenChange={setMinimapOpen}
                  onExpand={openMap}
                  modules={AVAILABLE_MODULES}
                  explored={explored}
                  targetId={target?.id ?? null}
                  path={guidance.path}
                  tracker={tracker}
                  touch={touch}
                />
              )}
              {target && !panelOpen && (
                <VisitNavigationPanel
                  target={target}
                  explored={explored.has(target.id)}
                  guidance={guidance}
                  tracker={tracker}
                  inputMode={walk.inputMode}
                  guided={
                    guided
                      ? {
                          step: guideStep,
                          total: GUIDED_ROUTE.length,
                          onPrevious: () => setGuideStep(guideStep - 1),
                          onNext: () => setGuideStep(guideStep + 1),
                          onEnd: () => setMode("free"),
                        }
                      : null
                  }
                  onStop={() => setOrientTargetId(null)}
                />
              )}
              {mapOpen && (
                <VisitPanel
                  modules={EXHIBITION_MODULES}
                  route={GUIDED_ROUTE}
                  explored={explored}
                  progress={progress}
                  mode={mode}
                  guideStep={guideStep}
                  targetId={target?.id ?? null}
                  path={guidance.path}
                  tracker={tracker}
                  initialSelectedId={mapSelection}
                  onClose={closeMap}
                  onStartGuided={startGuided}
                  onEndGuided={() => setMode("free")}
                  onOrient={orientTo}
                  onStopOrientation={() => setOrientTargetId(null)}
                  onResetProgress={resetProgress}
                />
              )}
            </>
          )}
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
              onGoTo={inspection.goTo}
              onClose={inspection.close}
              menu={inspection.menu}
              eyebrow={inspection.eyebrow}
              onBack={inspection.back}
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
