"use client";

import { useCallback, useState } from "react";

import ErrorState from "@/components/ui/ErrorState";
import LoadingOverlay from "@/components/ui/LoadingOverlay";
import ProjectBadge from "@/components/ui/ProjectBadge";
import GaussianViewer from "@/components/viewer/GaussianViewer";
import { EXPERIENCE_SETTINGS, MODEL } from "@/data/experience";
import { INITIAL_STATUS, type LoadStatus } from "@/lib/viewer/loadStatus";

/**
 * Tela principal: o visualizador ocupa toda a área visível (100dvh, que
 * acompanha a barra de endereço em celulares) com sobreposições mínimas.
 */
export default function Exhibition() {
  const [status, setStatus] = useState<LoadStatus>(INITIAL_STATUS);
  // Trocar a `key` remonta o viewer: a instância anterior é destruída e uma
  // nova é criada do zero.
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => {
    setStatus(INITIAL_STATUS);
    setAttempt((n) => n + 1);
  }, []);

  const failed = status.phase === "error" || status.phase === "unsupported";

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-black">
      {!failed && (
        <GaussianViewer
          key={attempt}
          contentUrl={MODEL.url}
          contentFilename={MODEL.filename}
          settings={EXPERIENCE_SETTINGS}
          onStatusChange={setStatus}
        />
      )}

      {status.phase === "ready" && <ProjectBadge />}
      {!failed && <LoadingOverlay status={status} totalBytes={MODEL.sizeBytes} />}
      {failed && <ErrorState status={status} onRetry={retry} />}
    </main>
  );
}
