// Pure match-state logic. Operates on MatchSession values without
// touching Socket.IO. Testable in isolation.

import { Chess } from 'chess.js';
import {
  MatchSession,
  MatchStatus,
  TimeControl,
} from './types.js';
import { computeEloDelta, EloResult } from './elo.js';

/** Terminal statuses that stop the game. */
const TERMINAL_STATUSES = new Set([
  'completed',
  'aborted',
  'resigned',
  'timeout',
  'checkmate',
  'stalemate',
  'draw',
  'expired',
  'cancelled',
]);

export function isTerminal(status: MatchStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

/** Start the drift-free timer interval for an active match.
 *
 *  The caller is responsible for storing the returned timer and
 *  clearing it when the match ends. `match.lastTimerTick` is seeded
 *  so the first tick does not double-count.
 */
export function startMatchTimers(
  match: MatchSession,
  emitTimerUpdate: (
    payload: {
      whiteTime: number;
      blackTime: number;
      white?: number;
      black?: number;
    },
  ) => void,
  emitClockSync: (payload: { white: number; black: number }) => void,
): NodeJS.Timeout {
  if (match.gameInterval) clearInterval(match.gameInterval);

  match.lastTimerTick = Date.now();

  const interval = setInterval(() => {
    if (!isTerminal(match.status)) {
      // still live — the interval itself is cleaned up on game over
    }
    // Always compute and emit so reconnecting clients get current time.
    const now = Date.now();
    const elapsed = Math.max(
      0,
      (now - (match.lastTimerTick ?? now)) / 1000,
    );
    match.lastTimerTick = now;

    const turn = match.chess.turn();
    if (turn === 'w') {
      match.whiteSecondsRemaining = Math.max(
        0,
        match.whiteSecondsRemaining - elapsed,
      );
    } else {
      match.blackSecondsRemaining = Math.max(
        0,
        match.blackSecondsRemaining - elapsed,
      );
    }

    // Timeout check
    if (
      match.whiteSecondsRemaining <= 0 ||
      match.blackSecondsRemaining <= 0
    ) {
      const loser = match.whiteSecondsRemaining <= 0 ? 'w' : 'b';
      match.status = 'timeout';
      match.chess = match.chess; // no state change; outcome determined by time
      // Emit final timer update then stop
      emitTimerUpdate({
        whiteTime: Math.round(match.whiteSecondsRemaining),
        blackTime: Math.round(match.blackSecondsRemaining),
      });
      emitClockSync({
        white: Math.round(match.whiteSecondsRemaining),
        black: Math.round(match.blackSecondsRemaining),
      });
      clearInterval(interval);
      match.gameInterval = undefined;
      return;
    }

    emitTimerUpdate({
      whiteTime: Math.round(match.whiteSecondsRemaining),
      blackTime: Math.round(match.blackSecondsRemaining),
      white: Math.round(match.whiteSecondsRemaining),
      black: Math.round(match.blackSecondsRemaining),
    });

    // Periodic sync pulse (every-other-second alignment).
    if (Math.floor(Date.now() / 1000) % 2 === 0) {
      emitClockSync({
        white: Math.round(match.whiteSecondsRemaining),
        black: Math.round(match.blackSecondsRemaining),
      });
    }
  }, 500);

  match.gameInterval = interval;
  return interval;
}

/** Stop all timers associated with a match. Safe to call multiple times. */
export function stopMatchTimers(match: MatchSession): void {
  if (match.gameInterval) {
    clearInterval(match.gameInterval);
    match.gameInterval = undefined;
  }
  if (match.abortTimer) {
    clearTimeout(match.abortTimer);
    match.abortTimer = undefined;
  }
  if (match.waitingTimer) {
    clearTimeout(match.waitingTimer);
    match.waitingTimer = undefined;
  }
  if (match.reconnectTimeout) {
    clearTimeout(match.reconnectTimeout);
    match.reconnectTimeout = undefined;
  }
}

/** Handle game-over state: set status, stop timers, compute rating
 *  changes if rated.
 *
 *  Returns the payload emitted to clients.
 */
export function handleGameOver(
  match: MatchSession,
  reason: string,
  winner: 'w' | 'b' | 'draw' | null,
): {
  result: string;
  winner: 'w' | 'b' | 'draw' | null;
  reason: string;
  fen: string;
  pgn: string;
  ratingChanges: ReturnType<typeof computeEloDelta> | null;
} {
  if (match.status === 'completed') {
    return {
      result: 'draw',
      winner: 'draw',
      reason,
      fen: match.chess.fen(),
      pgn: match.chess.pgn(),
      ratingChanges: null,
    };
  }

  match.status = 'completed';
  stopMatchTimers(match);

  const result =
    winner === 'draw'
      ? 'draw'
      : winner === 'w'
        ? 'whiteWins'
        : winner === 'b'
          ? 'blackWins'
          : 'draw';

  const ratingChanges =
    match.rated &&
    match.whiteRating != null &&
    match.blackRating != null
      ? computeEloDelta(
          match.whiteRating,
          match.blackRating,
          winner === 'w' ? 'white' : winner === 'b' ? 'black' : 'draw',
        )
      : null;

  return {
    result,
    winner,
    reason,
    fen: match.chess.fen(),
    pgn: match.chess.pgn(),
    ratingChanges,
  };
}

/** Handle abort (voluntary or system-triggered).
 *
 *  Returns the abort payload.
 */
export function handleAbort(
  match: MatchSession,
  triggeredByUid: string,
  onPenalize: (uid: string, unbanMs: number) => void,
): { reason: string; winner: 'w' | 'b' | null } {
  if (
    match.status !== 'starting' &&
    match.status !== 'active' &&
    match.status !== 'waiting'
  ) {
    return { reason: 'Match already ended.', winner: null };
  }

  match.status = 'aborted';
  stopMatchTimers(match);

  if (triggeredByUid === match.whiteUid || triggeredByUid === 'system') {
    const targetUid =
      triggeredByUid === 'system' ? match.whiteUid : triggeredByUid;
    if (targetUid) {
      onPenalize(targetUid, 5 * 60 * 1000);
    }
  }

  const reason =
    triggeredByUid === 'system'
      ? 'White failed to make the first move in time.'
      : 'Opponent aborted the match.';

  return { reason, winner: null };
}

/** Build the initial clock for a session. */
export function buildInitialTimeControl(
  pool: string,
  rated: boolean,
  provided?: TimeControl,
): TimeControl {
  if (provided) return provided;
  const initialSeconds =
    pool === 'blitz'
      ? 180
      : pool === 'bullet'
        ? 60
        : 600;
  return {
    name: pool || 'Rapid 10 min',
    initialSeconds,
    incrementSeconds: 0,
  };
}

/** Initialise a fresh Chess instance, falling back to the start position
 *  if the supplied FEN is invalid. */
export function newChessFromFen(
  fen?: string,
): Chess {
  try {
    const chess = new Chess(fen ?? undefined);
    // Verify it loaded without error by checking turn.
    chess.turn();
    return chess;
  } catch {
    return new Chess();
  }
}
