import type { LoadStatus } from "@/lib/viewer/loadStatus";

type LoadingOverlayProps = {
  status: LoadStatus;
  /** Tamanho do modelo em bytes, para exibir o volume já baixado. */
  totalBytes: number;
  /**
   * Cena pronta, mas o Walk Mode ainda não foi ativado (colisão carregando). A tela
   * continua cobrindo o viewer: não há navegação livre enquanto isso.
   */
  waitingForWalk?: boolean;
};

const megabytes = (bytes: number) =>
  (bytes / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function phaseLabel(status: LoadStatus, waitingForWalk: boolean): string {
  if (status.phase === "ready" && waitingForWalk) return "Preparando a área de visita…";
  switch (status.phase) {
    case "idle":
    case "initializing":
      return "Preparando o visualizador…";
    case "downloading":
      return "Baixando a exposição";
    case "processing":
      return "Download concluído · preparando a cena…";
    default:
      return "";
  }
}

/**
 * Tela de carregamento. O percentual exibido é o progresso real do download
 * informado pelo motor; não há valores simulados.
 */
export default function LoadingOverlay({ status, totalBytes, waitingForWalk = false }: LoadingOverlayProps) {
  const visible = status.phase !== "ready" || waitingForWalk;
  const showBar = status.phase === "downloading" || status.phase === "processing";
  const progress = Math.max(0, Math.min(100, status.progress));

  return (
    <div
      className={`absolute inset-0 z-20 flex items-center justify-center bg-stone-950 px-6 transition-opacity duration-700 ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!visible}
    >
      <div className="w-full max-w-sm text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-amber-200/70">
          Exposição educativa · UFPR
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-50 sm:text-4xl">
          Solos na Escola
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-400">
          Experiência digital interativa de uma exposição educativa sobre solos, desenvolvida a
          partir de reconstrução tridimensional.
        </p>

        <div className="mt-10" role="status" aria-live="polite">
          <div
            className="h-1 w-full overflow-hidden rounded-full bg-stone-800"
            role="progressbar"
            aria-label="Progresso do download do modelo 3D"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={showBar ? progress : undefined}
          >
            {showBar ? (
              <div
                className="h-full rounded-full bg-amber-300 transition-[width] duration-200 ease-out"
                style={{ width: `${progress}%` }}
              />
            ) : (
              <div className="h-full w-1/3 animate-[indeterminate_1.4s_ease-in-out_infinite] rounded-full bg-amber-300/60" />
            )}
          </div>
          <div className="mt-3 flex items-baseline justify-between gap-4 text-xs text-stone-400">
            <span>{phaseLabel(status, waitingForWalk)}</span>
            {showBar && (
              <span className="tabular-nums text-stone-300">
                {status.phase === "downloading"
                  ? `${progress}% · ${megabytes((totalBytes * progress) / 100)} de ${megabytes(totalBytes)} MB`
                  : "100%"}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
