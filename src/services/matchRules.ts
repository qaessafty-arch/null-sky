/**
 * Pure match rules — no Firestore, no React, no clocks of its own.
 *
 * Everything that decides "is this move legal, whose clock is running, is the
 * game over" lives here so it can be unit tested (`matchRules.test.ts`) and so
 * the Firestore transaction stays a thin IO wrapper around it.
 *
 * `now` is always passed in (server-corrected epoch ms) rather than read from
 * the environment — that is what makes the clock logic testable and what stops
 * a client with a wrong system clock from inventing time.
 */

import { Chess } from 'chess.js';
import {
  OnlineMatchClock,
  OnlineMatchPlayer,
  OnlineMatchSession,
  OnlineMatchStatus,
  TimeControl
} from '../types/chess';

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export type MoveRejection =
  | 'match_finished'
  | 'not_a_player'
  | 'spectator'
  | 'not_your_move'
  | 'wrong_turn'
  | 'illegal_move'
  | 'corrupt_state'
  | 'flagged';

export interface MoveInput {
  from: string;
  to: string;
  promotion?: string;
}

export interface MoveOutcome {
  ok: boolean;
  code?: MoveRejection;
  reason?: string;
  /** Field-level patch to write to Firestore. */
  patch?: Record<string, unknown>;
  /** The resulting session (handy for simulations and tests). */
  next?: OnlineMatchSession;
  san?: string;
  status?: OnlineMatchStatus;
}

/* ------------------------------------------------------------------ *
 * Basic queries
 * ------------------------------------------------------------------ */

export const colorOfPlayer = (
  session: OnlineMatchSession | null,
  uid: string | undefined | null
): 'w' | 'b' | null => {
  if (!session || !uid) return null;
  if (session.whitePlayer?.uid === uid) return 'w';
  if (session.blackPlayer?.uid === uid) return 'b';
  return null;
};

export const isParticipant = (session: OnlineMatchSession | null, uid: string | undefined | null) =>
  colorOfPlayer(session, uid) !== null;

export const opponentOf = (session: OnlineMatchSession, color: 'w' | 'b'): OnlineMatchPlayer =>
  color === 'w' ? session.blackPlayer : session.whitePlayer;

export const isUnlimited = (session: Pick<OnlineMatchSession, 'timeControl'>) =>
  session.timeControl?.category === 'unlimited' || (session.timeControl?.initialSeconds ?? 0) <= 0;

export const isFinishedStatus = (status: OnlineMatchStatus) =>
  status !== 'waiting' && status !== 'in_progress';

/** Milliseconds left for `color` at time `now`. Never negative. */
export function remainingMsAt(
  session: OnlineMatchSession | null,
  color: 'w' | 'b',
  now: number
): number {
  if (!session?.clock) return 0;
  if (isUnlimited(session)) return Number.POSITIVE_INFINITY;
  const base = color === 'w' ? session.clock.whiteMs : session.clock.blackMs;
  const ticking = session.status === 'in_progress' && session.clock.running && session.turn === color;
  if (!ticking) return Math.max(0, base);
  return Math.max(0, base - (now - session.clock.turnStartedAt));
}

export const hasFlaggedAt = (session: OnlineMatchSession | null, now: number) =>
  !!session &&
  session.status === 'in_progress' &&
  !isUnlimited(session) &&
  !!session.clock?.running &&
  remainingMsAt(session, session.turn, now) <= 0;

/* ------------------------------------------------------------------ *
 * Integrity + terminal detection
 * ------------------------------------------------------------------ */

/**
 * Replays the SAN move list from `startFen` and checks it reproduces the stored
 * FEN. This is what makes a peer unable to inject a forged position: the
 * opponent's client recomputes the whole game and rejects anything that does
 * not add up.
 */
export function verifySession(session: Pick<OnlineMatchSession, 'startFen' | 'moves' | 'fen'>): {
  ok: boolean;
  chess: Chess;
  reason?: string;
} {
  const chess = new Chess();
  try {
    chess.load(session.startFen || START_FEN);
  } catch {
    return { ok: false, chess: new Chess(), reason: 'Invalid starting position.' };
  }

  for (const san of session.moves ?? []) {
    let applied = null;
    try {
      applied = chess.move(san);
    } catch {
      applied = null;
    }
    if (!applied) return { ok: false, chess, reason: `Illegal move in history: ${san}` };
  }

  if (session.fen && chess.fen() !== session.fen) {
    return { ok: false, chess, reason: 'Stored position does not match the move history.' };
  }
  return { ok: true, chess };
}

export function terminalState(
  chess: Chess
): { status: OnlineMatchStatus; winner: 'w' | 'b' | 'draw'; reason: string } | null {
  if (chess.isCheckmate()) {
    const winner = chess.turn() === 'w' ? 'b' : 'w';
    return {
      status: 'checkmate',
      winner,
      reason: `Checkmate — ${winner === 'w' ? 'White' : 'Black'} wins.`
    };
  }
  if (chess.isStalemate()) return { status: 'draw', winner: 'draw', reason: 'Draw by stalemate.' };
  if (chess.isInsufficientMaterial())
    return { status: 'draw', winner: 'draw', reason: 'Draw by insufficient material.' };
  if (chess.isThreefoldRepetition())
    return { status: 'draw', winner: 'draw', reason: 'Draw by threefold repetition.' };
  if (chess.isDrawByFiftyMoves?.())
    return { status: 'draw', winner: 'draw', reason: 'Draw by the fifty-move rule.' };
  if (chess.isDraw()) return { status: 'draw', winner: 'draw', reason: 'Draw.' };
  return null;
}

/** Can `color` still mate with the material left on the board? */
export function hasMatingMaterial(chess: Chess, color: 'w' | 'b'): boolean {
  let minors = 0;
  for (const row of chess.board()) {
    for (const square of row) {
      if (!square || square.color !== color) continue;
      if (square.type === 'p' || square.type === 'r' || square.type === 'q') return true;
      if (square.type === 'n' || square.type === 'b') minors++;
    }
  }
  return minors >= 2;
}

/* ------------------------------------------------------------------ *
 * Session construction
 * ------------------------------------------------------------------ */

export function buildClock(timeControl: TimeControl, now: number): OnlineMatchClock {
  return {
    whiteMs: timeControl.initialSeconds * 1000,
    blackMs: timeControl.initialSeconds * 1000,
    incrementMs: timeControl.incrementSeconds * 1000,
    turnStartedAt: now,
    running: false
  };
}

export interface BuildSessionOptions {
  id: string;
  host: OnlineMatchPlayer;
  guest: OnlineMatchPlayer;
  timeControl: TimeControl;
  hostIsWhite: boolean;
  status?: 'waiting' | 'in_progress';
  vsBot?: boolean;
  rated?: boolean;
  now: number;
}

export function buildSession(options: BuildSessionOptions): OnlineMatchSession {
  const { id, host, guest, timeControl, hostIsWhite, now } = options;
  return {
    id,
    hostId: host.uid,
    guestId: guest.uid,
    whitePlayer: hostIsWhite ? host : guest,
    blackPlayer: hostIsWhite ? guest : host,
    fen: START_FEN,
    startFen: START_FEN,
    pgn: '',
    moves: [],
    ucis: [],
    moveCount: 0,
    turn: 'w',
    status: options.status ?? 'in_progress',
    winner: null,
    timeControl,
    clock: buildClock(timeControl, now),
    vsBot: !!options.vsBot,
    isRated: options.rated ?? true,
    drawOfferFrom: null,
    drawDeclinedAt: null,
    rematchOfferFrom: null,
    rematchMatchId: null,
    lastMoveBy: null,
    lastMoveSan: null,
    whiteSeenAt: now,
    blackSeenAt: now,
    endedAt: null,
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
    whiteSecondsRemaining: timeControl.initialSeconds,
    blackSecondsRemaining: timeControl.initialSeconds
  };
}

/* ------------------------------------------------------------------ *
 * The move rule
 * ------------------------------------------------------------------ */

const applyPatch = (session: OnlineMatchSession, patch: Record<string, unknown>): OnlineMatchSession => {
  const next = { ...session } as Record<string, unknown>;
  for (const [key, value] of Object.entries(patch)) {
    if (key.includes('.')) {
      const [head, tail] = key.split('.');
      next[head] = { ...(next[head] as Record<string, unknown>), [tail]: value };
    } else {
      next[key] = value;
    }
  }
  return next as unknown as OnlineMatchSession;
};

export interface ComputeMoveOptions {
  /** The signed-in player issuing the write. */
  actingUid: string;
  /** The player whose turn it is (differs from actingUid only for bot opponents). */
  moverUid?: string;
  move: MoveInput;
  now: number;
}

/**
 * Decides whether a move may be played and returns the exact patch to write.
 *
 * All checks are made against the *stored* session, never against anything the
 * caller supplies, so a client cannot push a position of its own invention.
 */
export function computeMoveUpdate(
  session: OnlineMatchSession,
  options: ComputeMoveOptions
): MoveOutcome {
  const { actingUid, move, now } = options;
  const moverUid = options.moverUid ?? actingUid;

  if (isFinishedStatus(session.status)) {
    return { ok: false, code: 'match_finished', reason: 'The match is already finished.' };
  }

  const moverColor = colorOfPlayer(session, moverUid);
  const actingColor = colorOfPlayer(session, actingUid);

  if (!moverColor) return { ok: false, code: 'not_a_player', reason: 'You are not a player in this match.' };
  if (!actingColor) return { ok: false, code: 'spectator', reason: 'Spectators cannot move.' };
  if (moverUid !== actingUid && !session.vsBot) {
    return { ok: false, code: 'not_your_move', reason: 'You cannot move for another player.' };
  }
  if (session.turn !== moverColor) {
    return { ok: false, code: 'wrong_turn', reason: 'It is not your turn.' };
  }

  const verification = verifySession(session);
  if (!verification.ok) {
    return { ok: false, code: 'corrupt_state', reason: verification.reason };
  }
  const chess = verification.chess;

  const clock: OnlineMatchClock = {
    whiteMs: session.clock?.whiteMs ?? session.timeControl.initialSeconds * 1000,
    blackMs: session.clock?.blackMs ?? session.timeControl.initialSeconds * 1000,
    incrementMs: session.clock?.incrementMs ?? session.timeControl.incrementSeconds * 1000,
    turnStartedAt: session.clock?.turnStartedAt ?? now,
    running: session.clock?.running ?? false
  };

  const unlimited = isUnlimited(session);

  // 1. Charge the mover for the time they just used.
  if (!unlimited && clock.running) {
    const elapsed = Math.max(0, now - clock.turnStartedAt);
    if (moverColor === 'w') clock.whiteMs -= elapsed;
    else clock.blackMs -= elapsed;

    const left = moverColor === 'w' ? clock.whiteMs : clock.blackMs;
    if (left <= 0) {
      const winner = moverColor === 'w' ? 'b' : 'w';
      const winnerCanMate = hasMatingMaterial(chess, winner);
      const patch: Record<string, unknown> = {
        status: winnerCanMate ? 'timeout' : 'draw',
        winner: winnerCanMate ? winner : 'draw',
        reason: winnerCanMate
          ? `${moverColor === 'w' ? 'White' : 'Black'} ran out of time.`
          : 'Time out with insufficient mating material — draw.',
        'clock.whiteMs': Math.max(0, clock.whiteMs),
        'clock.blackMs': Math.max(0, clock.blackMs),
        endedAt: now,
        updatedAt: new Date(now).toISOString()
      };
      return {
        ok: false,
        code: 'flagged',
        reason: 'Your flag fell.',
        patch,
        next: applyPatch(session, patch),
        status: patch.status as OnlineMatchStatus
      };
    }
  }

  // 2. Legality is judged by the stored position.
  let applied;
  try {
    applied = chess.move({
      from: move.from,
      to: move.to,
      promotion: (move.promotion as 'q' | 'r' | 'b' | 'n' | undefined) ?? 'q'
    });
  } catch {
    applied = null;
  }
  if (!applied) return { ok: false, code: 'illegal_move', reason: 'Illegal move.' };

  // 3. Increment, hand over the clock.
  if (!unlimited) {
    if (moverColor === 'w') clock.whiteMs += clock.incrementMs;
    else clock.blackMs += clock.incrementMs;
  }
  clock.turnStartedAt = now;
  // Clocks start once both players have made a move.
  clock.running = clock.running || (session.moveCount ?? 0) >= 1;

  const moves = [...(session.moves ?? []), applied.san];
  const ucis = [...(session.ucis ?? []), `${applied.from}${applied.to}${applied.promotion ?? ''}`];
  const terminal = terminalState(chess);

  const patch: Record<string, unknown> = {
    fen: chess.fen(),
    pgn: chess.pgn(),
    moves,
    ucis,
    moveCount: moves.length,
    turn: chess.turn(),
    status: terminal ? terminal.status : 'in_progress',
    winner: terminal ? terminal.winner : null,
    reason: terminal ? terminal.reason : null,
    lastMoveBy: moverUid,
    lastMoveSan: applied.san,
    lastMoveFrom: applied.from,
    lastMoveTo: applied.to,
    lastMoveTimestamp: now,
    clock,
    endedAt: terminal ? now : null,
    drawOfferFrom: null,
    updatedAt: new Date(now).toISOString(),
    whiteSecondsRemaining: Math.round(clock.whiteMs / 1000),
    blackSecondsRemaining: Math.round(clock.blackMs / 1000)
  };

  return {
    ok: true,
    san: applied.san,
    status: terminal ? terminal.status : 'in_progress',
    patch,
    next: applyPatch(session, patch)
  };
}

/** Patch that settles a flag fall, or null when nobody has actually flagged. */
export function computeTimeoutUpdate(
  session: OnlineMatchSession,
  now: number
): Record<string, unknown> | null {
  if (session.status !== 'in_progress') return null;
  if (isUnlimited(session) || !session.clock?.running) return null;
  if (remainingMsAt(session, session.turn, now) > 0) return null;

  const flagged = session.turn;
  const winner = flagged === 'w' ? 'b' : 'w';
  const { chess } = verifySession(session);
  const winnerCanMate = hasMatingMaterial(chess, winner);

  return {
    status: winnerCanMate ? 'timeout' : 'draw',
    winner: winnerCanMate ? winner : 'draw',
    reason: winnerCanMate
      ? `${flagged === 'w' ? 'White' : 'Black'} ran out of time.`
      : 'Time out with insufficient mating material — draw.',
    [`clock.${flagged === 'w' ? 'whiteMs' : 'blackMs'}`]: 0,
    endedAt: now,
    updatedAt: new Date(now).toISOString()
  };
}

export const applySessionPatch = applyPatch;
