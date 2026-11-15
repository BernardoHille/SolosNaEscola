"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ViewerFlags, ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";

import InspectionOverlay from "@/components/inspection/InspectionOverlay";
import { useInspection } from "@/components/inspection/useInspection";
import InteractionCalibrator from "@/components/interaction/InteractionCalibrator";
import InteractionLayer from "@/components/interaction/InteractionLayer";
import AboutPanel from "@/components/settings/AboutPanel";
import SettingsPanel from "@/components/settings/SettingsPanel";
import StartScreen from "@/components/start/StartScreen";
import FpsCounter from "@/components/ui/FpsCounter";
import HelpPanel from "@/components/ui/HelpPanel";
import MouseCaptureHint from "@/components/ui/MouseCaptureHint";
import SettingsButton from "@/components/ui/SettingsButton";
import TouchJoystick from "@/components/ui/TouchJoystick";
import GaussianViewer from "@/components/viewer/GaussianViewer";
import MiniMapDock from "@/components/visit/MiniMapDock";
import { useVisitOrientation } from "@/components/visit/useVisitOrientation";
import VisitNavigationPanel from "@/components/visit/VisitNavigationPanel";
import VisitPanel from "@/components/visit/VisitPanel";
import { useFullscreen } from "@/components/viewer/useFullscreen";
import { useKeyToggle } from "@/components/viewer/useKeyToggle";
import { useRenderQuality } from "@/components/viewer/useRenderQuality";
import { useWalkVisit } from "@/components/viewer/useWalkVisit";
import { AVAILABLE_MODULES, EXHIBITION_MODULES, GUIDED_ROUTE } from "@/data/exhibitionModules";
import { buildExperienceSettings, EXPERIENCE_SETTINGS, MODEL } from "@/data/experience";
import { INTERACTION_VOLUMES, type InteractionVolume } from "@/data/interactions";
import { MOVEMENT } from "@/data/visit";
import { unlockNarrationAudio } from "@/lib/audio/narration";
import type { InteractionManager } from "@/lib/interaction/interactionManager";
import { describeFailure, loadingStep } from "@/lib/viewer/loadMessages";
import { INITIAL_STATUS, type LoadStatus } from "@/lib/viewer/loadStatus";
import { IS_DEV, readSpawnOverride } from "@/lib/viewer/spawnOverride";

/**
 * Opções do viewer para a visita pública:
 * - `ui: false`: sem os controles de Orbit/Fly/Frame do viewer; a interface é própria.
 * - `noanim: true`: sem a animação automática de câmera ao abrir.
 */
const VIEWER_OPTIONS: ViewerFlags = { ui: false, noanim: true };

const HELP_SEEN_KEY = "solos:help-seen";

/** Painéis temporários: um de cada vez. */
type Panel = "settings" | "help" | "about" | "map";

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
 * Tela principal. O viewer ocupa toda a área visível (100dvh) e é criado uma vez só, ao abrir o
 * site: a tela inicial aparece na frente enquanto ele baixa e prepara a exposição. "Iniciar visita"
 * e "Voltar ao menu inicial" só trocam o estado da interface (`started`); a mesma instância do
 * viewer, a colisão, a qualidade e o progresso continuam.
 */
export default function Exhibition() {
  const [status, setStatus] = useState<LoadStatus>(INITIAL_STATUS);
  // Trocar a `key` remonta o viewer: a instância anterior é destruída e uma nova é criada do zero
  // (só em "Tentar novamente", depois de uma falha).
  const [attempt, setAttempt] = useState(0);
  const [viewer, setViewer] = useState<ViewerHandle | null>(null);
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  // Visita iniciada (tela inicial fechada).
  const [started, setStarted] = useState(false);
  const [panel, setPanel] = useState<Panel | null>(null);
  // Módulo escolhido ao abrir o painel do mapa pelo minimapa.
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

  const failed = status.phase === "error" || status.phase === "unsupported";
  const exploring = started && !failed;
  const panelOpen = panel !== null;
  // Tela inicial, painel ou inspeção: a locomoção fica suspensa (posição e olhar ficam como estão)
  // e o mouse não é capturado.
  const walk = useWalkVisit(viewer, stage, MODEL.collisionUrl, onCollisionError, {
    captureAllowed: exploring && !panelOpen && !inspecting,
    suspended: !exploring || panelOpen || inspecting,
  });
  const quality = useRenderQuality(viewer, walk.inputMode);
  const fullscreen = useFullscreen(mainRef);
  const ready = status.phase === "ready" && walk.walkActive && !failed;
  const visiting = ready && started;
  const step = loadingStep(status, walk.walkActive, MODEL.sizeBytes);

  const orientation = useVisitOrientation(viewer);
  const { markExplored, startGuided: beginGuided, orientTo: setOrientTarget } = orientation;

  // Contador de FPS: oculto; a tecla P mostra e esconde durante a visita (não divulgada).
  const fpsVisible = useKeyToggle("KeyP", visiting);

  // Um módulo conta como explorado quando a inspeção dele é aberta (tecla E, clique ou toque:
  // todas passam por aqui).
  const { open: openInspection, close: closeInspection } = inspection;
  const inspect = useCallback(
    (volume: InteractionVolume) => {
      markExplored(volume.setId);
      openInspection(volume.setId);
    },
    [markExplored, openInspection],
  );

  const closePanel = useCallback(() => setPanel(null), []);
  const openMap = useCallback((moduleId?: string) => {
    setMapSelection(moduleId ?? null);
    setPanel("map");
  }, []);
  const startGuided = useCallback(
    (step: number) => {
      beginGuided(step);
      setPanel(null);
    },
    [beginGuided],
  );
  const orientTo = useCallback(
    (id: string) => {
      setOrientTarget(id);
      setPanel(null);
    },
    [setOrientTarget],
  );

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
    setStarted(false);
    setAttempt((n) => n + 1);
  }, []);

  /**
   * "Iniciar visita". Tudo o que depende do gesto do visitante acontece aqui, sem esperas: primeiro
   * o áudio das narrações é liberado, depois a tela cheia é pedida (ela consome a ativação do
   * gesto). Se a tela cheia for recusada ou não existir, a visita começa na janela.
   */
  const { enter: enterFullscreen } = fullscreen;
  const start = useCallback(() => {
    if (!ready) return;
    unlockNarrationAudio();
    enterFullscreen();
    setPanel(null);
    setStarted(true);
  }, [ready, enterFullscreen]);

  /** Volta à tela inicial sem recarregar nada: viewer, colisão, qualidade e progresso continuam. */
  const backToMenu = useCallback(() => {
    closeInspection();
    setPanel(null);
    setStarted(false);
  }, [closeInspection]);

  // Instruções na primeira visita (lembradas apenas neste navegador).
  useEffect(() => {
    if (!visiting || readHelpSeen()) return;
    const id = window.setTimeout(() => setPanel((current) => current ?? "help"), 400);
    return () => window.clearTimeout(id);
  }, [visiting]);

  const closeHelp = useCallback(() => {
    setPanel(null);
    try {
      window.localStorage.setItem(HELP_SEEN_KEY, "1");
    } catch {
      // Sem armazenamento: as instruções podem reaparecer na próxima visita.
    }
  }, []);

  // Tecla M: abre e fecha o painel "Mapa e visita" (fora da inspeção e dos outros painéis).
  useEffect(() => {
    if (!visiting || inspecting || (panel && panel !== "map")) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "KeyM" || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName))) return;
      if (panel === "map") setPanel(null);
      else openMap();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visiting, inspecting, panel, openMap]);

  const touch = walk.inputMode === "touch";
  // Minimapa compacto: aberto por padrão no computador, recolhido no celular.
  const minimapShown = orientation.minimapOpen ?? !touch;
  const { target, guidance, guided, guideStep, explored } = orientation;

  return (
    <main ref={mainRef} className="relative h-dvh w-full overflow-hidden bg-stone-950">
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

      {ready && (
        <>
          {/* Interface mínima da visita; na inspeção ela sai de cena (a inspeção tem a sua). */}
          {visiting && !inspecting && (
            <>
              {fpsVisible && <FpsCounter viewer={viewer} />}
              <SettingsButton open={panel === "settings"} onClick={() => setPanel(panel === "settings" ? null : "settings")} />
              {!panelOpen && (
                <MiniMapDock
                  open={minimapShown}
                  onOpenChange={orientation.setMinimapOpen}
                  onExpand={openMap}
                  modules={AVAILABLE_MODULES}
                  explored={explored}
                  targetId={target?.id ?? null}
                  path={guidance.path}
                  tracker={orientation.tracker}
                  touch={touch}
                />
              )}
              {target && !panelOpen && (
                <VisitNavigationPanel
                  target={target}
                  explored={explored.has(target.id)}
                  guidance={guidance}
                  tracker={orientation.tracker}
                  inputMode={walk.inputMode}
                  guided={
                    guided
                      ? {
                          step: guideStep,
                          total: GUIDED_ROUTE.length,
                          onPrevious: () => orientation.setGuideStep(guideStep - 1),
                          onNext: () => orientation.setGuideStep(guideStep + 1),
                          onEnd: orientation.endGuided,
                        }
                      : null
                  }
                  onStop={orientation.stopOrientation}
                />
              )}
            </>
          )}
          {/* Montada com a cena pronta, mas só ativa durante a visita: na tela inicial nenhum
              objeto pode ser mirado ou aberto. */}
          {stage && viewer && (
            <InteractionLayer
              viewer={viewer}
              container={stage}
              volumes={volumes}
              enabled={visiting && !panelOpen && !inspecting}
              inputMode={walk.inputMode}
              mouseCaptured={walk.mouseCaptured}
              debug={debugInteractions ? { selectedId: debugSelected } : null}
              onInspect={inspect}
              onManager={setInteractionManager}
            />
          )}
          {debugInteractions && visiting && !inspecting && (
            <InteractionCalibrator
              volumes={volumes}
              onChange={setVolumes}
              selectedId={debugSelected}
              onSelect={setDebugSelected}
              manager={interactionManager}
            />
          )}
          {visiting && touch && !inspecting && (
            <div className="pointer-events-none absolute bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-10">
              <TouchJoystick onMove={walk.setJoystick} maxSpeed={MOVEMENT.run} />
            </div>
          )}
          {visiting && walk.mouseCaptured && <MouseCaptureHint />}
          {visiting && inspection.set && (
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

      <StartScreen
        visible={!started || failed}
        step={step}
        failure={failed ? describeFailure(status) : null}
        failureDetail={status.errorDetail}
        sceneVisible={ready}
        onStart={start}
        onRetry={retry}
        onOpenSettings={() => setPanel("settings")}
        onOpenHelp={() => setPanel("help")}
        onOpenAbout={() => setPanel("about")}
      />

      {panel === "settings" && (
        <SettingsPanel
          context={visiting ? "visit" : "start"}
          inputMode={walk.inputMode}
          quality={{ level: quality.level, onChange: quality.setLevel }}
          fullscreen={fullscreen}
          onClose={closePanel}
          onOpenAbout={() => setPanel("about")}
          onOpenMap={() => openMap()}
          onOpenHelp={() => setPanel("help")}
          onReturnToEntrance={() => {
            walk.returnToEntrance();
            setPanel(null);
          }}
          onBackToMenu={backToMenu}
        />
      )}
      {panel === "help" && <HelpPanel inputMode={walk.inputMode} onClose={closeHelp} />}
      {panel === "about" && <AboutPanel onClose={closePanel} />}
      {panel === "map" && visiting && (
        <VisitPanel
          modules={EXHIBITION_MODULES}
          route={GUIDED_ROUTE}
          explored={explored}
          progress={orientation.progress}
          mode={orientation.mode}
          guideStep={guideStep}
          targetId={target?.id ?? null}
          path={guidance.path}
          tracker={orientation.tracker}
          initialSelectedId={mapSelection}
          onClose={closePanel}
          onStartGuided={startGuided}
          onEndGuided={orientation.endGuided}
          onOrient={orientTo}
          onStopOrientation={orientation.stopOrientation}
          onResetProgress={orientation.resetProgress}
        />
      )}
    </main>
  );
}
