/**
 * Estados de carregamento da exposição, na ordem em que ocorrem.
 *
 * - `idle`: componente montado, aguardando o início no cliente.
 * - `initializing`: carregando o módulo do viewer e criando o dispositivo gráfico.
 * - `downloading`: baixando o SOG; `progress` vem do evento real do motor
 *   (bytes recebidos / Content-Length).
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

export type LoadErrorKind = "network" | "http" | "engine" | "collision";

export type LoadStatus = {
  phase: LoadPhase;
  /** Progresso do download, 0–100. */
  progress: number;
  errorKind?: LoadErrorKind;
  /** Mensagem técnica, exibida de forma discreta para diagnóstico. */
  errorDetail?: string;
};

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
