/**
 * Search: iterative deepening PVS with a transposition table, null-move pruning,
 * late move reductions, futility pruning, killer/history move ordering and a
 * quiescence search with delta pruning.
 */

import {
  KING,
  PAWN,
  Position,
  QUEEN,
  isCaptureMove,
  isPromotionMove,
  moveFrom,
  moveTo,
  moveCaptured,
  movePromotion,
  moveToUci,
  typeOf
} from './board';
import { SIMPLE_VALUE, evaluate, gamePhase } from './evaluate';

export const MATE_SCORE = 30000;
export const MATE_THRESHOLD = MATE_SCORE - 1000;
const INFINITY = 50000;
const MAX_PLY = 96;

/* ------------------------------------------------------------------ *
 * Transposition table
 * ------------------------------------------------------------------ */

const TT_BITS = 20; // 1M entries ≈ 16 MB
const TT_SIZE = 1 << TT_BITS;
const TT_MASK = TT_SIZE - 1;

const TT_EXACT = 0;
const TT_LOWER = 1;
const TT_UPPER = 2;

const ttKey = new Int32Array(TT_SIZE);
const ttMove = new Int32Array(TT_SIZE);
const ttScore = new Int32Array(TT_SIZE);
const ttMeta = new Int32Array(TT_SIZE); // depth << 2 | flag
let ttGeneration = 0;

export function clearTranspositionTable() {
  ttKey.fill(0);
  ttMove.fill(0);
  ttScore.fill(0);
  ttMeta.fill(0);
  ttGeneration = 0;
}

/* ------------------------------------------------------------------ *
 * Search state
 * ------------------------------------------------------------------ */

const moveBuffers: Int32Array[] = [];
const scoreBuffers: Int32Array[] = [];
for (let i = 0; i < MAX_PLY; i++) {
  moveBuffers.push(new Int32Array(256));
  scoreBuffers.push(new Int32Array(256));
}

const killers = new Int32Array(MAX_PLY * 2);
const historyTable = new Int32Array(16 * 128);
const pvTable = new Int32Array(MAX_PLY * MAX_PLY);
const pvLength = new Int32Array(MAX_PLY);

let nodes = 0;
let stopTime = Infinity;
let nodeLimit = Infinity;
let stopped = false;
let contempt = 0;

const shouldStop = () => {
  if (stopped) return true;
  if ((nodes & 2047) === 0) {
    if (Date.now() >= stopTime || nodes >= nodeLimit) stopped = true;
  }
  return stopped;
};

/* ------------------------------------------------------------------ *
 * Move ordering
 * ------------------------------------------------------------------ */

const MVV_LVA_BONUS = 1_000_000;
const PROMOTION_BONUS = 900_000;
const KILLER_ONE_BONUS = 800_000;
const KILLER_TWO_BONUS = 700_000;
const TT_MOVE_BONUS = 2_000_000;

function scoreMoves(
  pos: Position,
  moves: Int32Array,
  scores: Int32Array,
  count: number,
  ttBest: number,
  ply: number
) {
  const killerA = killers[ply * 2];
  const killerB = killers[ply * 2 + 1];

  for (let i = 0; i < count; i++) {
    const move = moves[i];
    if (move === ttBest) {
      scores[i] = TT_MOVE_BONUS;
      continue;
    }
    if (isCaptureMove(move)) {
      const victim = SIMPLE_VALUE[moveCaptured(move)];
      const attacker = SIMPLE_VALUE[typeOf(pos.board[moveFrom(move)])];
      scores[i] = MVV_LVA_BONUS + victim * 16 - attacker;
      continue;
    }
    if (isPromotionMove(move)) {
      scores[i] = PROMOTION_BONUS + SIMPLE_VALUE[movePromotion(move)];
      continue;
    }
    if (move === killerA) {
      scores[i] = KILLER_ONE_BONUS;
      continue;
    }
    if (move === killerB) {
      scores[i] = KILLER_TWO_BONUS;
      continue;
    }
    scores[i] = historyTable[pos.board[moveFrom(move)] * 128 + moveTo(move)];
  }
}

/** Selection sort step — cheaper than sorting the whole list when we get a cutoff early. */
function pickMove(moves: Int32Array, scores: Int32Array, count: number, index: number) {
  let best = index;
  for (let i = index + 1; i < count; i++) {
    if (scores[i] > scores[best]) best = i;
  }
  if (best !== index) {
    const m = moves[index];
    moves[index] = moves[best];
    moves[best] = m;
    const s = scores[index];
    scores[index] = scores[best];
    scores[best] = s;
  }
}

/**
 * Static exchange evaluation (approximate): is this capture likely to lose material?
 * Used to prune obviously losing captures in quiescence.
 */
function seeGain(pos: Position, move: number): number {
  const victim = SIMPLE_VALUE[moveCaptured(move)];
  const attackerType = typeOf(pos.board[moveFrom(move)]);
  const attacker = SIMPLE_VALUE[attackerType];
  const to = moveTo(move);
  // If the target square is defended and we capture with a more valuable piece, assume a loss.
  if (victim >= attacker) return victim - attacker;
  return pos.isAttacked(to, pos.side ^ 1) ? victim - attacker : victim;
}

/* ------------------------------------------------------------------ *
 * Quiescence search
 * ------------------------------------------------------------------ */

function quiescence(pos: Position, alpha: number, beta: number, ply: number): number {
  nodes++;
  if (shouldStop()) return 0;
  if (ply >= MAX_PLY - 1) return evaluate(pos);

  const standPat = evaluate(pos);
  if (standPat >= beta) return standPat;

  // Delta pruning: if even winning a queen cannot raise alpha, give up on this node.
  if (standPat + SIMPLE_VALUE[QUEEN] + 200 < alpha) return standPat;
  if (standPat > alpha) alpha = standPat;

  const moves = moveBuffers[ply];
  const scores = scoreBuffers[ply];
  const count = pos.generateMoves(moves, true);
  scoreMoves(pos, moves, scores, count, 0, ply);

  let best = standPat;

  for (let i = 0; i < count; i++) {
    pickMove(moves, scores, count, i);
    const move = moves[i];

    if (isCaptureMove(move) && !isPromotionMove(move)) {
      // Prune captures that lose material and cannot reach alpha
      if (seeGain(pos, move) < -50 && standPat + SIMPLE_VALUE[moveCaptured(move)] + 150 < alpha) continue;
    }

    if (!pos.makeMove(move)) continue;
    const score = -quiescence(pos, -beta, -alpha, ply + 1);
    pos.unmakeMove();

    if (stopped) return 0;
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break;
  }

  return best;
}

/* ------------------------------------------------------------------ *
 * Main search
 * ------------------------------------------------------------------ */

function isDrawPosition(pos: Position): boolean {
  return pos.halfmove >= 100 || pos.isRepetition() || pos.isInsufficientMaterial();
}

function negamax(
  pos: Position,
  depth: number,
  alpha: number,
  beta: number,
  ply: number,
  canNull: boolean
): number {
  pvLength[ply] = ply;

  if (ply > 0 && isDrawPosition(pos)) return contempt;
  if (ply >= MAX_PLY - 1) return evaluate(pos);

  const inCheck = pos.inCheck();
  if (inCheck) depth++; // check extension

  if (depth <= 0) return quiescence(pos, alpha, beta, ply);

  nodes++;
  if (shouldStop()) return 0;

  const isPv = beta - alpha > 1;

  // Mate distance pruning
  if (ply > 0) {
    alpha = Math.max(alpha, -MATE_SCORE + ply);
    beta = Math.min(beta, MATE_SCORE - ply - 1);
    if (alpha >= beta) return alpha;
  }

  // Transposition table probe
  const index = (pos.hashLo & TT_MASK) >>> 0;
  let ttBest = 0;
  if (ttKey[index] === pos.hashHi && ttKey[index] !== 0) {
    ttBest = ttMove[index];
    const meta = ttMeta[index];
    const entryDepth = meta >> 2;
    const flag = meta & 3;
    if (!isPv && entryDepth >= depth) {
      let score = ttScore[index];
      if (score > MATE_THRESHOLD) score -= ply;
      else if (score < -MATE_THRESHOLD) score += ply;
      if (flag === TT_EXACT) return score;
      if (flag === TT_LOWER && score >= beta) return score;
      if (flag === TT_UPPER && score <= alpha) return score;
    }
  }

  const staticEval = inCheck ? -INFINITY : evaluate(pos);

  // Reverse futility pruning
  if (!isPv && !inCheck && depth <= 6 && staticEval - 85 * depth >= beta && Math.abs(beta) < MATE_THRESHOLD) {
    return staticEval;
  }

  // Null-move pruning — skip in likely-zugzwang endings
  if (!isPv && !inCheck && canNull && depth >= 3 && staticEval >= beta && gamePhase(pos) > 0.2) {
    const reduction = 2 + Math.floor(depth / 4);
    const saved = pos.makeNullMove();
    const score = -negamax(pos, depth - 1 - reduction, -beta, -beta + 1, ply + 1, false);
    pos.unmakeNullMove(saved);
    if (stopped) return 0;
    if (score >= beta && Math.abs(score) < MATE_THRESHOLD) return beta;
  }

  const moves = moveBuffers[ply];
  const scores = scoreBuffers[ply];
  const count = pos.generateMoves(moves);
  scoreMoves(pos, moves, scores, count, ttBest, ply);

  const futilityMargin = 120 + 140 * depth;
  const canFutilityPrune = !isPv && !inCheck && depth <= 4 && Math.abs(alpha) < MATE_THRESHOLD;

  let bestScore = -INFINITY;
  let bestMove = 0;
  let legalCount = 0;
  const originalAlpha = alpha;

  for (let i = 0; i < count; i++) {
    pickMove(moves, scores, count, i);
    const move = moves[i];
    const quiet = !isCaptureMove(move) && !isPromotionMove(move);

    if (canFutilityPrune && legalCount > 0 && quiet && staticEval + futilityMargin <= alpha) continue;

    if (!pos.makeMove(move)) continue;
    legalCount++;

    let score: number;
    const givesCheck = pos.inCheck();

    if (legalCount === 1) {
      score = -negamax(pos, depth - 1, -beta, -alpha, ply + 1, true);
    } else {
      // Late move reductions
      let reduction = 0;
      if (depth >= 3 && quiet && !givesCheck && legalCount > 3) {
        reduction = 1 + Math.floor(Math.log(depth) * Math.log(legalCount) / 2.1);
        if (isPv) reduction = Math.max(0, reduction - 1);
        reduction = Math.min(reduction, depth - 2);
      }

      score = -negamax(pos, depth - 1 - reduction, -alpha - 1, -alpha, ply + 1, true);
      if (score > alpha && reduction > 0) {
        score = -negamax(pos, depth - 1, -alpha - 1, -alpha, ply + 1, true);
      }
      if (score > alpha && score < beta) {
        score = -negamax(pos, depth - 1, -beta, -alpha, ply + 1, true);
      }
    }

    pos.unmakeMove();
    if (stopped) return 0;

    if (score > bestScore) {
      bestScore = score;
      bestMove = move;

      if (score > alpha) {
        alpha = score;

        // Update the triangular PV table
        pvTable[ply * MAX_PLY + ply] = move;
        const childLength = pvLength[ply + 1];
        for (let j = ply + 1; j < childLength; j++) {
          pvTable[ply * MAX_PLY + j] = pvTable[(ply + 1) * MAX_PLY + j];
        }
        pvLength[ply] = childLength;

        if (alpha >= beta) {
          if (quiet) {
            const killerIndex = ply * 2;
            if (killers[killerIndex] !== move) {
              killers[killerIndex + 1] = killers[killerIndex];
              killers[killerIndex] = move;
            }
            const historyIndex = pos.board[moveFrom(move)] * 128 + moveTo(move);
            historyTable[historyIndex] += depth * depth;
            if (historyTable[historyIndex] > 500_000) {
              for (let h = 0; h < historyTable.length; h++) historyTable[h] >>= 1;
            }
          }
          break;
        }
      }
    }
  }

  if (legalCount === 0) {
    return inCheck ? -MATE_SCORE + ply : contempt;
  }

  // Store in the transposition table
  let storedScore = bestScore;
  if (storedScore > MATE_THRESHOLD) storedScore += ply;
  else if (storedScore < -MATE_THRESHOLD) storedScore -= ply;

  const flag = bestScore <= originalAlpha ? TT_UPPER : bestScore >= beta ? TT_LOWER : TT_EXACT;
  const existingDepth = ttMeta[index] >> 2;
  if (ttKey[index] !== pos.hashHi || depth >= existingDepth) {
    ttKey[index] = pos.hashHi;
    ttMove[index] = bestMove;
    ttScore[index] = storedScore;
    ttMeta[index] = (depth << 2) | flag;
  }

  return bestScore;
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

export interface SearchLimits {
  depth?: number;
  timeMs?: number;
  nodes?: number;
  /** Positive values make the engine avoid draws. Centipawns. */
  contempt?: number;
}

export interface SearchLine {
  move: number;
  uci: string;
  score: number;
  mateIn: number | null;
}

export interface SearchResult {
  bestMove: number;
  bestMoveUci: string | null;
  /** Centipawns from the side-to-move's perspective. */
  score: number;
  /** Centipawns from White's perspective (what the UI eval bar wants). */
  scoreWhite: number;
  mateIn: number | null;
  depth: number;
  seldepth: number;
  nodes: number;
  timeMs: number;
  nps: number;
  pv: string[];
  /** Root moves sorted best-first (only filled when `multiPv` was requested). */
  lines: SearchLine[];
}

const mateDistance = (score: number): number | null => {
  if (Math.abs(score) < MATE_THRESHOLD) return null;
  const plies = MATE_SCORE - Math.abs(score);
  const moves = Math.ceil(plies / 2);
  return score > 0 ? moves : -moves;
};

function resetSearchState(limits: SearchLimits) {
  nodes = 0;
  stopped = false;
  contempt = limits.contempt ?? 0;
  stopTime = limits.timeMs ? Date.now() + limits.timeMs : Infinity;
  nodeLimit = limits.nodes ?? Infinity;
  killers.fill(0);
  pvLength.fill(0);
  for (let i = 0; i < historyTable.length; i++) historyTable[i] >>= 2;
}

function collectPv(pos: Position): string[] {
  const line: string[] = [];
  const length = pvLength[0];
  for (let i = 0; i < length && i < MAX_PLY; i++) {
    const move = pvTable[i];
    if (!move) break;
    line.push(moveToUci(move));
  }
  return line;
}

/** Full-strength search of the current position. */
export function search(pos: Position, limits: SearchLimits = {}): SearchResult {
  const started = Date.now();
  resetSearchState(limits);

  const maxDepth = Math.min(limits.depth ?? 64, MAX_PLY - 2);
  const rootMoves = pos.legalMoves();

  if (rootMoves.length === 0) {
    const score = pos.inCheck() ? -MATE_SCORE : 0;
    return {
      bestMove: 0,
      bestMoveUci: null,
      score,
      scoreWhite: pos.side === 0 ? score : -score,
      mateIn: mateDistance(score),
      depth: 0,
      seldepth: 0,
      nodes: 0,
      timeMs: 0,
      nps: 0,
      pv: [],
      lines: []
    };
  }

  let bestMove = rootMoves[0];
  let bestScore = 0;
  let completedDepth = 0;
  let pv: string[] = [moveToUci(bestMove)];
  let alpha = -INFINITY;
  let beta = INFINITY;
  let lastIterationMs = 0;

  for (let depth = 1; depth <= maxDepth; depth++) {
    const iterationStart = Date.now();
    let score = negamax(pos, depth, alpha, beta, 0, true);

    // Aspiration window: re-search on a fail high/low with a widened window
    if (!stopped && (score <= alpha || score >= beta)) {
      alpha = -INFINITY;
      beta = INFINITY;
      score = negamax(pos, depth, alpha, beta, 0, true);
    }

    if (stopped && completedDepth > 0) break;

    const rootMove = pvTable[0];
    if (rootMove) {
      bestMove = rootMove;
      bestScore = score;
      pv = collectPv(pos);
    }
    completedDepth = depth;
    lastIterationMs = Date.now() - iterationStart;

    if (Math.abs(score) > MATE_THRESHOLD) break; // forced mate found
    if (Date.now() >= stopTime) break;
    // Don't start an iteration we almost certainly cannot finish
    // (each extra ply typically costs ~2.2x the previous one).
    if (limits.timeMs) {
      const elapsed = Date.now() - started;
      if (elapsed + lastIterationMs * 2.2 > limits.timeMs) break;
    }

    alpha = score - 45;
    beta = score + 45;
  }

  const elapsed = Math.max(1, Date.now() - started);

  return {
    bestMove,
    bestMoveUci: moveToUci(bestMove),
    score: bestScore,
    scoreWhite: pos.side === 0 ? bestScore : -bestScore,
    mateIn: mateDistance(bestScore),
    depth: completedDepth,
    seldepth: completedDepth,
    nodes,
    timeMs: elapsed,
    nps: Math.round(nodes / (elapsed / 1000)),
    pv,
    lines: []
  };
}

/**
 * Scores every root move independently. Used by the bot personalities to pick a
 * deliberately imperfect move, and by the analysis panel to show alternatives.
 */
export function searchRootMoves(pos: Position, limits: SearchLimits = {}): SearchLine[] {
  const started = Date.now();
  const depth = Math.max(1, Math.min(limits.depth ?? 4, 12));
  const budget = limits.timeMs ?? 1500;
  const rootMoves = pos.legalMoves();
  const lines: SearchLine[] = [];

  resetSearchState({ ...limits, timeMs: budget });

  for (const move of rootMoves) {
    if (!pos.makeMove(move)) continue;
    const remaining = budget - (Date.now() - started);
    stopTime = Date.now() + Math.max(20, remaining);
    stopped = false;
    const score = -negamax(pos, depth - 1, -INFINITY, INFINITY, 1, true);
    pos.unmakeMove();
    lines.push({ move, uci: moveToUci(move), score, mateIn: mateDistance(score) });
    if (Date.now() - started > budget) break;
  }

  lines.sort((a, b) => b.score - a.score);
  return lines;
}

/** Convenience: evaluate a position statically, from White's perspective. */
export function staticEvaluation(pos: Position): number {
  return evaluate(pos, true);
}

export { evaluate };
