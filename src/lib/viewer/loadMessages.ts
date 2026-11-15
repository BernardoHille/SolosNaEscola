/**
 * Textos da tela inicial sobre o preparo da exposição e as falhas. Separados dos componentes para
 * serem testados (`tests/startScreen.test.mjs`).
 *
 * O botão "Iniciar visita" só fica livre com a cena pronta (primeiro quadro completo) e o Walk Mode
 * ativo (colisão anexada): o fim do download não basta.
 */
import type { LoadStatus } from "./loadStatus";

export type LoadingStep = {
  /** Frase principal ("Baixando reconstrução 3D…"). */
  label: string;
  /** Complemento discreto (percentual e megabytes, ou o que está sendo feito). */
  detail: string | null;
  /** Progresso real do download (0–100), ou null quando não há número a mostrar. */
  progress: number | null;
  /** Visita pronta para começar. */
  ready: boolean;
};

const megabytes = (bytes: number) =>
  (bytes / 1_000_000).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/**
 * Etapa atual do preparo. `walkActive` vem do Walk Mode (colisão pronta); `totalBytes` é o tamanho
 * do SOG, para mostrar quanto já foi baixado. O percentual é o do motor, nunca simulado.
 */
export function loadingStep(status: LoadStatus, walkActive: boolean, totalBytes: number): LoadingStep {
  const progress = Math.max(0, Math.min(100, Math.round(status.progress)));
  switch (status.phase) {
    case "downloading":
      return {
        label: "Baixando reconstrução 3D…",
        detail: `${progress}% · ${megabytes((totalBytes * progress) / 100)} de ${megabytes(totalBytes)} MB`,
        progress,
        ready: false,
      };
    case "processing":
      return { label: "Processando ambiente…", detail: "Download concluído", progress: 100, ready: false };
    case "ready":
      return walkActive
        ? { label: "Pronto para visitar.", detail: null, progress: 100, ready: true }
        : {
            label: "Preparando navegação…",
            detail: "Carregando o espaço para caminhar",
            progress: 100,
            ready: false,
          };
    default:
      // idle, initializing (e os estados de falha, que a tela mostra de outro jeito).
      return {
        label: "Preparando experiência…",
        detail: "Verificando o navegador e iniciando o visualizador 3D",
        progress: null,
        ready: false,
      };
  }
}

export type LoadFailure = { title: string; message: string; canRetry: boolean };

/** Mensagem compreensível para cada tipo de falha (download, servidor, motor, colisão, navegador). */
export function describeFailure(status: LoadStatus): LoadFailure {
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
