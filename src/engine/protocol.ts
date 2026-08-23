/** Message contract between the UI thread and the engine worker. */

export interface EngineLimits {
  depth?: number;
  timeMs?: number;
  nodes?: number;
  contempt?: number;
}

export interface EnginePositionInput {
  fen: string;
  /** Moves played from `fen`, in UCI, so the engine sees repetitions. */
  moves?: string[];
}

export type EngineRequest =
  | ({ id: number; type: 'search'; limits: EngineLimits } & EnginePositionInput)
  | ({ id: number; type: 'bot'; botId: string } & EnginePositionInput)
  | ({ id: number; type: 'analyze'; limits: EngineLimits; multiPv: number } & EnginePositionInput)
  | ({ id: number; type: 'evaluate' } & EnginePositionInput)
  | { id: number; type: 'clearHash' };

export interface EngineLineInfo {
  uci: string;
  score: number;
  mateIn: number | null;
}

export interface EngineSearchResponse {
  bestMove: string | null;
  /** Centipawns from the side-to-move's perspective. */
  score: number;
  /** Centipawns from White's perspective — what the eval bar shows. */
  scoreWhite: number;
  mateIn: number | null;
  depth: number;
  nodes: number;
  timeMs: number;
  nps: number;
  pv: string[];
  lines: EngineLineInfo[];
  deliberateError?: boolean;
}

export interface EngineEvaluateResponse {
  /** Static evaluation in pawns, from White's perspective. */
  scorePawns: number;
  scoreWhite: number;
  material: number;
  mobility: number;
  kingSafety: number;
  pawns: number;
  phase: number;
}

export type EngineResponse =
  | { id: number; type: 'search'; result: EngineSearchResponse }
  | { id: number; type: 'evaluate'; result: EngineEvaluateResponse }
  | { id: number; type: 'error'; error: string };
