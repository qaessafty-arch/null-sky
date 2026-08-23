/**
 * Shared request handler for the engine. Lives outside the worker file so the
 * same code can run in-thread as a fallback when Web Workers are unavailable.
 */

import { Position } from './board';
import { evaluate, type EvalBreakdown } from './evaluate';
import { chooseBotMove, getBotDefinition } from './bots';
import { clearTranspositionTable, search, searchRootMoves } from './search';
import type { EngineRequest, EngineResponse } from './protocol';

const buildPosition = (fen: string, moves?: string[]): Position => {
  const pos = new Position(fen);
  if (moves) {
    for (const uci of moves) {
      const move = pos.findMoveUci(uci);
      if (!move) break;
      pos.makeMove(move);
    }
  }
  return pos;
};

const emptyBreakdown = (): EvalBreakdown => ({
  total: 0,
  material: 0,
  positional: 0,
  pawns: 0,
  mobility: 0,
  kingSafety: 0,
  phase: 0
});

export function handleEngineRequest(request: EngineRequest): EngineResponse {
  try {
    switch (request.type) {
      case 'clearHash': {
        clearTranspositionTable();
        return {
          id: request.id,
          type: 'search',
          result: {
            bestMove: null,
            score: 0,
            scoreWhite: 0,
            mateIn: null,
            depth: 0,
            nodes: 0,
            timeMs: 0,
            nps: 0,
            pv: [],
            lines: []
          }
        };
      }

      case 'evaluate': {
        const pos = buildPosition(request.fen, request.moves);
        const breakdown = emptyBreakdown();
        const scoreWhite = evaluate(pos, true, breakdown);
        return {
          id: request.id,
          type: 'evaluate',
          result: {
            scorePawns: scoreWhite / 100,
            scoreWhite,
            material: breakdown.material,
            mobility: breakdown.mobility,
            kingSafety: breakdown.kingSafety,
            pawns: breakdown.pawns,
            phase: breakdown.phase
          }
        };
      }

      case 'search': {
        const pos = buildPosition(request.fen, request.moves);
        const result = search(pos, request.limits);
        return {
          id: request.id,
          type: 'search',
          result: {
            bestMove: result.bestMoveUci,
            score: result.score,
            scoreWhite: result.scoreWhite,
            mateIn: result.mateIn,
            depth: result.depth,
            nodes: result.nodes,
            timeMs: result.timeMs,
            nps: result.nps,
            pv: result.pv,
            lines: []
          }
        };
      }

      case 'analyze': {
        const pos = buildPosition(request.fen, request.moves);
        const lines = searchRootMoves(pos, request.limits).slice(0, Math.max(1, request.multiPv));
        const isWhiteToMove = pos.side === 0;
        const best = lines[0];
        return {
          id: request.id,
          type: 'search',
          result: {
            bestMove: best ? best.uci : null,
            score: best ? best.score : 0,
            scoreWhite: best ? (isWhiteToMove ? best.score : -best.score) : 0,
            mateIn: best ? best.mateIn : null,
            depth: request.limits.depth ?? 0,
            nodes: 0,
            timeMs: 0,
            nps: 0,
            pv: best ? [best.uci] : [],
            lines: lines.map(line => ({ uci: line.uci, score: line.score, mateIn: line.mateIn }))
          }
        };
      }

      case 'bot': {
        const pos = buildPosition(request.fen, request.moves);
        const bot = getBotDefinition(request.botId);
        const result = chooseBotMove(pos, bot);
        const isWhiteToMove = pos.side === 0;
        return {
          id: request.id,
          type: 'search',
          result: {
            bestMove: result.uci,
            score: result.score,
            scoreWhite: isWhiteToMove ? result.score : -result.score,
            mateIn: null,
            depth: result.depth,
            nodes: result.nodes,
            timeMs: result.timeMs,
            nps: result.timeMs > 0 ? Math.round(result.nodes / (result.timeMs / 1000)) : 0,
            pv: result.pv,
            lines: result.candidates.map(candidate => ({
              uci: candidate.uci,
              score: candidate.score,
              mateIn: null
            })),
            deliberateError: result.deliberateError
          }
        };
      }

      default: {
        return { id: (request as { id: number }).id, type: 'error', error: 'Unknown engine request' };
      }
    }
  } catch (error) {
    return {
      id: (request as { id: number }).id,
      type: 'error',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
