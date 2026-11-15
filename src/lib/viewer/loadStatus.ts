/**
 * Estados de carregamento da exposição, na ordem em que ocorrem.
 *
 * - `idle`: componente montado, aguardando o início no cliente.
 * - `initializing`: carregando o módulo do viewer e criando o dispositivo gráfico.
 * - `downloading`: SOG único: baixando o arquivo; `progress` vem do evento real do motor
 *   (bytes recebidos / Content-Length). Streamed SOG: baixando os blocos do nível mais leve que
 *   revelam a cena; `progress` é a fração desses arquivos já concluída (contagem do viewer), não
 *   bytes nem a cena inteira.
 * - `processing`: download concluído; texturas sendo decodificadas e enviadas
 *   à GPU até o primeiro quadro completo.
 * - `ready`: primeiro quadro completo renderizado (`state.loaded` do viewer).
 * - `error`: falha no download, na decodificação ou na criação do motor.
 * - `unsupported`: navegador sem WebGL 2/WebGPU.
 */
export type LoadPhase =
  | "idle"
  | "initializing"
  | "downloading"
  | "processing"
  | "ready"
  | "error"
  | "unsupported";

export type LoadErrorKind = "network" | "http" | "engine" | "collision" | "chunk";

export type LoadStatus = {
  phase: LoadPhase;
  /** Progresso do download, 0–100. */
  progress: number;
  errorKind?: LoadErrorKind;
  /** Mensagem técnica, exibida de forma discreta para diagnóstico. */
  errorDetail?: string;
  /** Cena em Streamed SOG (níveis de detalhe carregados aos poucos). */
  streamed?: boolean;
  /** Blocos que falharam em todas as tentativas do motor. */
  chunkFailures?: number;
};

/** O motor tenta cada bloco 1 + 2 vezes (`GSplatAssetLoader.maxRetries` = 2, PlayCanvas 2.23). */
export const CHUNK_ATTEMPTS = 3;

export { isStreamedContent } from "./splatSourceParam";

export const INITIAL_STATUS: LoadStatus = { phase: "idle", progress: 0 };

export class ModelHttpError extends Error {
  constructor(
    readonly status: number,
    statusText: string,
  ) {
    super(`HTTP ${status}${statusText ? ` ${statusText}` : ""}`);
    this.name = "ModelHttpError";
  }
}
