"use client";

/**
 * GaussianViewer — integração React do SuperSplat Viewer oficial (PlayCanvas).
 *
 * - Executa somente no cliente: o módulo do viewer é importado dinamicamente
 *   dentro de `useEffect`, portanto nada do motor roda no SSR.
 * - Garante uma única instância do motor por componente: a criação é adiada
 *   para depois do ciclo montar/desmontar do React StrictMode e cada nova
 *   instância aguarda a destruição completa da anterior.
 * - Ao desmontar, cancela o download (AbortController) e chama
 *   `viewer.destroy()`, que libera aplicação, contexto gráfico e listeners.
 * - O redimensionamento (inclusive mudança de orientação) é tratado pelo
 *   ResizeObserver interno do viewer; este componente só precisa preencher um
 *   contêiner com dimensões explícitas.
 *
 * Documentação: https://developer.playcanvas.com/user-manual/supersplat/viewer/embedding/
 */
import "@playcanvas/supersplat-viewer/viewer.css";

import { useEffect, useRef } from "react";
import type { ViewerHandle } from "@playcanvas/supersplat-viewer/viewer";
import type { ExperienceSettings } from "@playcanvas/supersplat-viewer/settings";

import { detectGraphicsSupport, isGraphicsSupported } from "@/lib/viewer/capabilities";
import { type LoadStatus, ModelHttpError } from "@/lib/viewer/loadStatus";

export type GaussianViewerProps = {
  /** URL pública do arquivo de splats (ex.: `/models/museu_web.sog`). */
  contentUrl: string;
  /** Nome do arquivo, cuja extensão define o formato. */
  contentFilename: string;
  /** Experience Settings v2. */
  settings: ExperienceSettings;
  /** Recebe cada mudança de estado do carregamento. */
  onStatusChange?: (status: LoadStatus) => void;
  /** Recebe a instância do viewer quando criada, e `null` ao destruí-la. */
  onViewerChange?: (viewer: ViewerHandle | null) => void;
  className?: string;
};

/**
 * Encadeia criação e destruição de instâncias para que nunca existam dois
 * motores gráficos ao mesmo tempo (ex.: ao tentar carregar novamente).
 */
let previousTeardown: Promise<void> = Promise.resolve();

export default function GaussianViewer({
  contentUrl,
  contentFilename,
  settings,
  onStatusChange,
  onViewerChange,
  className,
}: GaussianViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Callbacks em refs: mudanças de identidade não devem recriar o motor.
  const statusRef = useRef(onStatusChange);
  const viewerRef = useRef(onViewerChange);
  useEffect(() => {
    statusRef.current = onStatusChange;
    viewerRef.current = onViewerChange;
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let disposed = false;
    let handle: ViewerHandle | null = null;
    let current: LoadStatus = { phase: "idle", progress: 0 };
    const download = new AbortController();

    const report = (next: Partial<LoadStatus>) => {
      if (disposed) return;
      // Erro e "pronto" são estados finais desta instância.
      if (current.phase === "error" || current.phase === "unsupported") return;
      current = { ...current, ...next };
      statusRef.current?.(current);
    };

    const fail = (error: unknown) => {
      if (disposed || current.phase === "ready") return;
      const detail = error instanceof Error ? error.message : String(error);
      const errorKind =
        error instanceof ModelHttpError ? "http" : error instanceof TypeError ? "network" : "engine";
      report({ phase: "error", errorKind, errorDetail: detail });
    };

    const start = async () => {
      await previousTeardown;
      if (disposed) return;

      if (!isGraphicsSupported(detectGraphicsSupport())) {
        report({ phase: "unsupported" });
        return;
      }

      report({ phase: "initializing", progress: 0 });

      const { createViewer } = await import("@playcanvas/supersplat-viewer/viewer");
      if (disposed) return;

      // O download é iniciado aqui (e não pelo motor) para poder ser cancelado
      // ao desmontar e para distinguir falhas de rede/HTTP de falhas do motor.
      // O motor consome este Response em streaming e emite o progresso real.
      const contents = fetch(contentUrl, { signal: download.signal }).then((response) => {
        if (!response.ok) throw new ModelHttpError(response.status, response.statusText);
        return response;
      });
      contents.catch(fail);

      const viewer = await createViewer({
        container,
        settings,
        contentUrl,
        contentFilename,
        contents,
      });

      if (disposed) {
        viewer.destroy();
        return;
      }
      handle = viewer;
      viewerRef.current?.(viewer);

      const onProgress = (progress: number) => {
        if (current.phase === "ready") return;
        report({ phase: progress >= 100 ? "processing" : "downloading", progress });
      };
      const onLoaded = (loaded: boolean) => {
        if (loaded) report({ phase: "ready", progress: 100 });
      };

      viewer.events.on("progress:changed", onProgress);
      viewer.events.on("loaded:changed", onLoaded);
      // Falhas de decodificação/carregamento do asset no motor.
      viewer.app.assets.on("error", (error: unknown) => fail(error));

      // Sincroniza com o estado atual (eventos podem ter ocorrido antes da inscrição).
      if (viewer.state.loaded) onLoaded(true);
      else onProgress(viewer.state.progress);
    };

    let run: Promise<void> = Promise.resolve();
    // Adia a criação: no StrictMode (desenvolvimento) o React monta, desmonta
    // e monta de novo de forma síncrona; assim a primeira montagem não chega a
    // criar um motor nem a iniciar um download.
    const timer = window.setTimeout(() => {
      run = start().catch(fail);
    }, 0);

    return () => {
      disposed = true;
      window.clearTimeout(timer);
      download.abort();
      const viewer = handle;
      handle = null;
      if (viewer) {
        viewer.destroy();
        viewerRef.current?.(null);
      }
      // A próxima instância só começa depois que esta terminar de ser criada e destruída.
      previousTeardown = run.catch(() => undefined);
    };
  }, [contentUrl, contentFilename, settings]);

  return (
    <div
      ref={containerRef}
      className={className}
      // Dimensões explícitas são obrigatórias: o viewer preenche o contêiner.
      style={{ width: "100%", height: "100%" }}
      aria-label="Exposição 3D navegável"
      role="application"
    />
  );
}
