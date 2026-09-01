/**
 * Compatibility facade over the new engine core (`src/engine`).
 *
 * The UI speaks chess.js (SAN, PGN, move objects); the engine speaks its own
 * fast 0x88 representation. Everything in this file translates between the two.
 *
 * Prefer `engine` (src/engine/client.ts) for anything that can be asynchronous —
 * it runs the search in a Web Worker and never blocks the board.
 */

import { Chess, Move, Square } from 'chess.js';
import {
  BotProfile,
  MoveClassification,
  PieceColor,
  PieceType,
  TimeControl
} from '../types/chess';
import { Position } from '../engine/board';
import { evaluate } from '../engine/evaluate';
import { BOT_DEFINITIONS, botDefinitionForElo, chooseBotMove, getBotDefinition } from '../engine/bots';
import { search } from '../engine/search';

export { BOT_DEFINITIONS, botDefinitionForElo, getBotDefinition };
export type { BotDefinition } from '../engine/bots';

/** The bot ladder, typed for existing UI components. */
export const BOT_PROFILES: BotProfile[] = BOT_DEFINITIONS;

export const TIME_CONTROLS: TimeControl[] = [
  { id: 'bullet-1', name: '1 min', initialSeconds: 60, incrementSeconds: 0, category: 'bullet' },
  { id: 'bullet-2-1', name: '2 | 1', initialSeconds: 120, incrementSeconds: 1, category: 'bullet' },
  { id: 'blitz-3', name: '3 min', initialSeconds: 180, incrementSeconds: 0, category: 'blitz' },
  { id: 'blitz-3-2', name: '3 | 2', initialSeconds: 180, incrementSeconds: 2, category: 'blitz' },
  { id: 'blitz-5', name: '5 min', initialSeconds: 300, incrementSeconds: 0, category: 'blitz' },
  { id: 'blitz-5-3', name: '5 | 3', initialSeconds: 300, incrementSeconds: 3, category: 'blitz' },
  { id: 'rapid-10', name: '10 min', initialSeconds: 600, incrementSeconds: 0, category: 'rapid' },
  { id: 'rapid-10-5', name: '10 | 5', initialSeconds: 600, incrementSeconds: 5, category: 'rapid' },
  { id: 'rapid-15-10', name: '15 | 10', initialSeconds: 900, incrementSeconds: 10, category: 'rapid' },
  { id: 'classical-30', name: '30 min', initialSeconds: 1800, incrementSeconds: 0, category: 'classical' },
  { id: 'classical-45-15', name: '45 | 15', initialSeconds: 2700, incrementSeconds: 15, category: 'classical' },
  { id: 'unlimited', name: 'Unlimited', initialSeconds: 0, incrementSeconds: 0, category: 'unlimited' }
];

/** Piece values in centipawns (UI + material counting). */
export const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

/* ------------------------------------------------------------------ *
 * Evaluation
 * ------------------------------------------------------------------ */

/** Static evaluation in pawns, positive = White is better. */
export function evaluateBoard(game: Chess): number {
  const pos = new Position(game.fen());
  return evaluate(pos, true) / 100;
}

/* ------------------------------------------------------------------ *
 * Search helpers (synchronous — prefer the worker client where possible)
 * ------------------------------------------------------------------ */

const applyUciToChessJs = (game: Chess, uci: string | null): Move | null => {
  if (!uci) return null;
  const probe = new Chess(game.fen());
  try {
    return probe.move({
      from: uci.slice(0, 2) as Square,
      to: uci.slice(2, 4) as Square,
      promotion: (uci[4] as PieceType | undefined) ?? 'q'
    });
  } catch {
    return null;
  }
};

export interface BestMoveResult {
  move: Move | null;
  score: number;
  depth: number;
  nodes: number;
  mateIn: number | null;
  pv: string[];
}

/**
 * Best move for the current position.
 *
 * `isWhite` is accepted for backwards compatibility but is no longer needed —
 * the engine always searches from the side to move and reports the score from
 * White's perspective.
 */
export function findBestMove(
  game: Chess,
  depth: number = 8,
  _isWhite?: boolean,
  timeMs: number = 800
): BestMoveResult {
  const pos = new Position(game.fen());
  const result = search(pos, { depth, timeMs });
  return {
    move: applyUciToChessJs(game, result.bestMoveUci),
    score: result.scoreWhite / 100,
    depth: result.depth,
    nodes: result.nodes,
    mateIn: result.mateIn,
    pv: result.pv
  };
}

/** Synchronous move for an opponent of a given rating (online challengers). */
export function getBotMoveForElo(game: Chess, elo: number): Move | null {
  const pos = new Position(game.fen());
  const result = chooseBotMove(pos, botDefinitionForElo(elo));
  return applyUciToChessJs(game, result.uci);
}

/** Synchronous bot move. The UI normally uses `engine.botMove()` instead. */
export function getBotMove(game: Chess, bot: BotProfile): Move | null {
  const pos = new Position(game.fen());
  const definition = getBotDefinition(bot.id);
  const result = chooseBotMove(pos, definition);
  return applyUciToChessJs(game, result.uci);
}

/* ------------------------------------------------------------------ *
 * Captured material
 * ------------------------------------------------------------------ */

export interface CapturedMaterialState {
  capturedByWhite: PieceType[];
  capturedByBlack: PieceType[];
  /** Positive = White is ahead, in pawns. */
  materialDifference: number;
}

/**
 * Captured pieces derived from the move history.
 *
 * The previous implementation diffed the board against the starting army, which
 * broke on promotions (a promoted queen looked like a captured enemy queen plus
 * a vanished pawn). Reading the history is exact.
 */
export function getCapturedMaterial(game: Chess): CapturedMaterialState {
  const capturedByWhite: PieceType[] = [];
  const capturedByBlack: PieceType[] = [];

  let history: Move[] = [];
  try {
    history = game.history({ verbose: true }) as Move[];
  } catch {
    history = [];
  }

  for (const move of history) {
    if (!move.captured) continue;
    const piece = move.captured as PieceType;
    if (move.color === 'w') capturedByWhite.push(piece);
    else capturedByBlack.push(piece);
  }

  const order: PieceType[] = ['q', 'r', 'b', 'n', 'p'];
  const byValue = (a: PieceType, b: PieceType) => order.indexOf(a) - order.indexOf(b);
  capturedByWhite.sort(byValue);
  capturedByBlack.sort(byValue);

  // Promotions change the material balance too, so count it from the board.
  let balance = 0;
  for (const row of game.board()) {
    for (const square of row) {
      if (!square || square.type === 'k') continue;
      const value = PIECE_VALUES[square.type as PieceType];
      balance += square.color === 'w' ? value : -value;
    }
  }

  return {
    capturedByWhite,
    capturedByBlack,
    materialDifference: Math.round(balance / 100)
  };
}

/* ------------------------------------------------------------------ *
 * Move classification
 * ------------------------------------------------------------------ */

export interface ClassificationContext {
  /** The move actually played matched the engine's best move. */
  wasBestMove?: boolean;
  /** The position is still in the opening book. */
  isBook?: boolean;
  isCapture?: boolean;
  isCheckmate?: boolean;
  /** The move gave away material but the evaluation held or improved. */
  isSacrifice?: boolean;
}

/**
 * Classifies a move from the evaluation swing it caused.
 *
 * Both evaluations are in pawns from White's perspective; `isWhite` is the side
 * that played the move. A drop is always measured against the mover.
 */
export function classifyMove(
  prevEval: number,
  newEval: number,
  isWhite: boolean,
  isCaptureOrContext?: boolean | ClassificationContext,
  isCheckmate?: boolean
): MoveClassification {
  const context: ClassificationContext =
    typeof isCaptureOrContext === 'object' && isCaptureOrContext !== null
      ? isCaptureOrContext
      : { isCapture: !!isCaptureOrContext, isCheckmate };

  if (context.isCheckmate) return 'brilliant';
  if (context.isBook) return 'book';

  // Loss (in pawns) from the mover's point of view. Positive = the position got worse.
  const loss = isWhite ? prevEval - newEval : newEval - prevEval;

  if (context.isSacrifice && loss <= 0.3) return 'brilliant';
  if (loss <= 0.05) return context.wasBestMove ? 'best' : 'good';
  if (loss <= 0.3) return 'good';
  if (loss <= 0.9) return 'inaccuracy';
  if (loss <= 2.0) return 'mistake';
  return 'blunder';
}

/* ------------------------------------------------------------------ *
 * Elo
 * ------------------------------------------------------------------ */

/**
 * Standard Elo update. `score` is 1 for a win, 0.5 for a draw, 0 for a loss.
 * K-factor follows FIDE-style tapering so new/low-rated players move faster.
 */
export function eloDelta(playerElo: number, opponentElo: number, score: number, gamesPlayed = 30): number {
  const k = gamesPlayed < 30 ? 40 : playerElo >= 2400 ? 10 : 20;
  const expected = 1 / (1 + Math.pow(10, (opponentElo - playerElo) / 400));
  return Math.round(k * (score - expected));
}

export const colorName = (color: PieceColor) => (color === 'w' ? 'White' : 'Black');
