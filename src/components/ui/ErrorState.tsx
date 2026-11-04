import type { LoadStatus } from "@/lib/viewer/loadStatus";

type ErrorStateProps = {
  status: LoadStatus;
  onRetry: () => void;
};

function describe(status: LoadStatus): { title: string; message: string; canRetry: boolean } {
  if (status.phase === "unsupported") {
    return {
      title: "Dispositivo incompatível",
      message:
        "Este navegador não oferece WebGL 2 nem WebGPU, necessários para exibir a exposição em 3D. Tente uma versão atual do Chrome, Edge, Firefox ou Safari, ou outro dispositivo.",
      canRetry: false,
    };
  }
  switch (status.errorKind) {
    case "collision":
      return {
        title: "Não foi possível preparar a visita",
        message:
          "A exposição foi carregada, mas os dados que permitem caminhar pelo ambiente não ficaram disponíveis. Tente novamente.",
        canRetry: true,
      };
    case "network":
      return {
        title: "Não foi possível baixar a exposição",
        message: "Verifique sua conexão com a internet e tente novamente.",
        canRetry: true,
      };
    case "http":
      return {
        title: "O modelo 3D não está disponível",
        message: "O servidor não conseguiu entregar o arquivo da exposição. Tente novamente em instantes.",
        canRetry: true,
      };
    default:
      return {
        title: "Não foi possível exibir a exposição",
        message:
          "Ocorreu uma falha ao preparar a cena 3D. Isso pode acontecer em dispositivos com pouca memória de vídeo. Tente novamente ou use outro dispositivo.",
        canRetry: true,
      };
  }
}

export default function ErrorState({ status, onRetry }: ErrorStateProps) {
  const { title, message, canRetry } = describe(status);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-stone-950 px-6" role="alert">
      <div className="w-full max-w-sm text-center">
        <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-amber-200/70">
          Solos na Escola
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-stone-50">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-400">{message}</p>
        {canRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-8 inline-flex items-center justify-center rounded-full bg-amber-300 px-6 py-2.5 text-sm font-semibold text-stone-950 transition-colors hover:bg-amber-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-200"
          >
            Tentar novamente
          </button>
        )}
        {status.errorDetail && (
          <p className="mt-6 break-words font-mono text-[11px] text-stone-600">{status.errorDetail}</p>
        )}
      </div>
    </div>
  );
}
