/**
 * Online match service.
 *
 * Design notes (this replaces a version where each client wrote whatever FEN it
 * liked and both sides counted their own clocks locally):
 *
 *  1. **Every move goes through a Firestore transaction.** The transaction
 *     re-reads the match, replays the SAN move list, verifies the mover owns the
 *     side to move, verifies the move is legal in the *stored* position, and
 *     only then writes the new state. Two clients can never interleave a move.
 *
 *  2. **Clocks are timestamp based, not tick based.** The document stores
 *     `clock.whiteMs`, `clock.blackMs` and `clock.turnStartedAt`; remaining time
 *     is always derived. A tab that sleeps, lags or reloads cannot desync, and
 *     flag falls are settled by whoever notices first via `claimTimeout`.
 *
 *  3. **Client clocks are corrected against Firestore's server time.** Each
 *     write stamps `serverStamp: serverTimestamp()`; readers use it to maintain
 *     a rolling offset, so a player with a wrong system clock cannot gain time.
 *
 *  4. **Positions are verifiable.** `verifySession` replays the move list from
 *     `startFen`; if the resulting FEN does not match the stored one the game is
 *     flagged as tampered instead of silently accepted.
 *
 *  5. **Presence.** Both clients heartbeat; an opponent who disappears can be
 *     claimed against after a grace period instead of leaving a dead board.
 */

import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { Chess } from 'chess.js';
import { db } from '../utils/firebase';
import {
  OnlineMatchPlayer,
  OnlineMatchSession,
  OnlineMatchStatus,
  TimeControl
} from '../types/chess';
import {
  START_FEN,
  buildSession,
  colorOfPlayer,
  computeMoveUpdate,
  computeTimeoutUpdate,
  hasFlaggedAt,
  isParticipant,
  isUnlimited,
  opponentOf,
  remainingMsAt,
  verifySession
} from './matchRules';

export {
  START_FEN,
  colorOfPlayer,
  isParticipant,
  opponentOf,
  verifySession
} from './matchRules';

export const MATCHES_COLLECTION = 'online_matches';
export const QUEUE_COLLECTION = 'matchmaking_queue';

/** A ticket older than this is considered abandoned. */
const TICKET_TTL_MS = 120_000;
/** Opponent is shown as "connection lost" after this long without a heartbeat. */
export const DISCONNECT_GRACE_MS = 25_000;
/** After this long without a heartbeat the opponent can be claimed against. */
export const ABANDON_CLAIM_MS = 60_000;
export const HEARTBEAT_INTERVAL_MS = 8_000;

/* ------------------------------------------------------------------ *
 * Server time synchronisation
 * ------------------------------------------------------------------ */

let serverOffsetMs = 0;
let offsetSamples = 0;

const toMillis = (value: unknown): number | null => {
  if (!value) return null;
  if (value instanceof Timestamp) return value.toMillis();
  if (typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && 'seconds' in value) {
    const stamp = value as { seconds: number; nanoseconds?: number };
    return stamp.seconds * 1000 + Math.round((stamp.nanoseconds ?? 0) / 1e6);
  }
  return null;
};

/** Folds a resolved server timestamp into the rolling clock offset. */
const observeServerTime = (stamp: unknown) => {
  const serverMs = toMillis(stamp);
  if (serverMs === null) return;
  const sample = serverMs - Date.now();
  // Ignore absurd samples (>1h) — almost certainly a malformed document.
  if (Math.abs(sample) > 3_600_000) return;
  offsetSamples = Math.min(offsetSamples + 1, 20);
  serverOffsetMs += (sample - serverOffsetMs) / offsetSamples;
};

/** Current time in the server's frame of reference. */
export const serverNow = () => Date.now() + Math.round(serverOffsetMs);

export const getClockSkewMs = () => Math.round(serverOffsetMs);

/* ------------------------------------------------------------------ *
 * Worldwide challengers (engine personalities, clearly labelled as bots)
 * ------------------------------------------------------------------ */

const botAvatar = (seed: string) =>
  `https://api.dicebear.com/7.x/bottts-neutral/svg?seed=${encodeURIComponent(seed)}&backgroundColor=1b2416`;

export const WORLDWIDE_CHALLENGERS: OnlineMatchPlayer[] = [
  {
    uid: 'ww_aryakrd_88',
    displayName: 'Peshmerga Arya',
    country: 'Kurdistan',
    flag: '☀️',
    elo: 1900,
    honorRank: 'Peshmerga Strategist',
    rankBadge: '🦅',
    isBot: true,
    botId: 'bot-rook',
    avatar: botAvatar('arya')
  },
  {
    uid: 'ww_blitzhawk_us',
    displayName: 'BlitzHawk',
    country: 'United States',
    flag: '🇺🇸',
    elo: 2350,
    honorRank: 'Grandmaster Champion',
    rankBadge: '👑',
    isBot: true,
    botId: 'bot-queen',
    avatar: botAvatar('blitzhawk')
  },
  {
    uid: 'ww_elena_esp',
    displayName: 'Elena Tactics',
    country: 'Spain',
    flag: '🇪🇸',
    elo: 1450,
    honorRank: 'Knight Commander',
    rankBadge: '⚔️',
    isBot: true,
    botId: 'bot-bishop',
    avatar: botAvatar('elena')
  },
  {
    uid: 'ww_viking_nor',
    displayName: 'Viking Endgame',
    country: 'Norway',
    flag: '🇳🇴',
    elo: 2650,
    honorRank: 'Sovereign Grandmaster',
    rankBadge: '👑',
    isBot: true,
    botId: 'bot-titan',
    avatar: botAvatar('viking')
  },
  {
    uid: 'ww_yuki_jpn',
    displayName: 'Yuki Shogi',
    country: 'Japan',
    flag: '🇯🇵',
    elo: 1050,
    honorRank: 'High Tactician',
    rankBadge: '🌿',
    isBot: true,
    botId: 'bot-knight',
    avatar: botAvatar('yuki')
  },
  {
    uid: 'ww_zagros_lion',
    displayName: 'Zagros Lion',
    country: 'Kurdistan',
    flag: '☀️',
    elo: 700,
    honorRank: 'Mountain Guardian',
    rankBadge: '🛡️',
    isBot: true,
    botId: 'bot-scout',
    avatar: botAvatar('zagros')
  },
  {
    uid: 'ww_samba_bra',
    displayName: 'Samba Gambit',
    country: 'Brazil',
    flag: '🇧🇷',
    elo: 1450,
    honorRank: 'Peshmerga Tactician',
    rankBadge: '🌿',
    isBot: true,
    botId: 'bot-bishop',
    avatar: botAvatar('samba')
  },
  {
    uid: 'ww_marcel_fra',
    displayName: 'Marcel Paris',
    country: 'France',
    flag: '🇫🇷',
    elo: 1900,
    honorRank: 'Royal Guard',
    rankBadge: '⚔️',
    isBot: true,
    botId: 'bot-rook',
    avatar: botAvatar('marcel')
  }
];

/** Picks the bot whose rating is closest to the player's. */
export const pickChallengerFor = (elo: number): OnlineMatchPlayer => {
  const sorted = [...WORLDWIDE_CHALLENGERS].sort(
    (a, b) => Math.abs(a.elo - elo) - Math.abs(b.elo - elo)
  );
  const pool = sorted.slice(0, 3);
  return pool[Math.floor(Math.random() * pool.length)];
};

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

export class MatchError extends Error {
  constructor(message: string, readonly code: string = 'match/failed') {
    super(message);
    this.name = 'MatchError';
  }
}

const newMatchId = () => `match_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/** Milliseconds left for `color`, derived from the stored clock and server time. */
export const remainingMs = (session: OnlineMatchSession | null, color: 'w' | 'b') =>
  remainingMsAt(session, color, serverNow());

/** True when the side to move has run out of time. */
export const hasFlagged = (session: OnlineMatchSession | null) => hasFlaggedAt(session, serverNow());

export const isOpponentOffline = (session: OnlineMatchSession | null, myColor: 'w' | 'b' | null) => {
  if (!session || !myColor || session.status !== 'in_progress') return false;
  if (session.vsBot) return false;
  const seenAt = myColor === 'w' ? session.blackSeenAt : session.whiteSeenAt;
  if (!seenAt) return false;
  return serverNow() - seenAt > DISCONNECT_GRACE_MS;
};

export const canClaimAbandon = (session: OnlineMatchSession | null, myColor: 'w' | 'b' | null) => {
  if (!session || !myColor || session.status !== 'in_progress' || session.vsBot) return false;
  const seenAt = myColor === 'w' ? session.blackSeenAt : session.whiteSeenAt;
  if (!seenAt) return false;
  return serverNow() - seenAt > ABANDON_CLAIM_MS;
};

/* ------------------------------------------------------------------ *
 * Match creation
 * ------------------------------------------------------------------ */

export interface CreateMatchOptions {
  hostColorChoice?: 'w' | 'b' | 'random';
  status?: 'waiting' | 'in_progress';
  vsBot?: boolean;
  rated?: boolean;
  matchId?: string;
}

export async function createMatchSession(
  host: OnlineMatchPlayer,
  guest: OnlineMatchPlayer,
  timeControl: TimeControl,
  options: CreateMatchOptions = {}
): Promise<string> {
  const matchId = options.matchId ?? newMatchId();
  const hostIsWhite =
    options.hostColorChoice === 'w'
      ? true
      : options.hostColorChoice === 'b'
        ? false
        : Math.random() < 0.5;

  const session = buildSession({
    id: matchId,
    host,
    guest,
    timeControl,
    hostIsWhite,
    status: options.status,
    vsBot: options.vsBot,
    rated: options.rated,
    now: serverNow()
  });

  await setDoc(doc(db, MATCHES_COLLECTION, matchId), {
    ...session,
    serverStamp: serverTimestamp()
  });
  return matchId;
}

/** Backwards-compatible wrapper used by the friend chat challenge flow. */
export const createOnlineMatchChallenge = async (
  hostPlayer: OnlineMatchPlayer,
  guestPlayer: OnlineMatchPlayer,
  timeControl: TimeControl,
  hostColorChoice: 'w' | 'b' | 'random' = 'random'
): Promise<string | null> => {
  try {
    return await createMatchSession(hostPlayer, guestPlayer, timeControl, {
      hostColorChoice,
      status: 'waiting'
    });
  } catch (error) {
    console.error('Failed to create match challenge:', error);
    return null;
  }
};

export const acceptOnlineMatchChallenge = async (matchId: string): Promise<boolean> => {
  try {
    await runTransaction(db, async transaction => {
      const ref = doc(db, MATCHES_COLLECTION, matchId);
      const snap = await transaction.get(ref);
      if (!snap.exists()) throw new MatchError('Match not found', 'match/not-found');
      const session = snap.data() as OnlineMatchSession;
      if (session.status !== 'waiting') return;
      transaction.update(ref, {
        status: 'in_progress',
        'clock.turnStartedAt': serverNow(),
        updatedAt: new Date().toISOString(),
        serverStamp: serverTimestamp()
      });
    });
    return true;
  } catch (error) {
    console.error('Failed to accept challenge:', error);
    return false;
  }
};

/* ------------------------------------------------------------------ *
 * Moves — transactional and fully validated
 * ------------------------------------------------------------------ */

export interface SubmitMoveInput {
  from: string;
  to: string;
  promotion?: string;
}

export interface SubmitMoveResult {
  ok: boolean;
  reason?: string;
  san?: string;
  status?: OnlineMatchStatus;
}

/**
 * Applies a move to the match.
 *
 * `actingUid` is the signed-in player making the request; `moverUid` is the
 * player whose turn it is (they differ only when a client is driving its bot
 * opponent). The transaction rejects anything that is not legal in the position
 * currently stored in Firestore.
 */
export async function submitMove(
  matchId: string,
  actingUid: string,
  move: SubmitMoveInput,
  moverUid: string = actingUid
): Promise<SubmitMoveResult> {
  try {
    return await runTransaction(db, async transaction => {
      const ref = doc(db, MATCHES_COLLECTION, matchId);
      const snap = await transaction.get(ref);
      if (!snap.exists()) throw new MatchError('Match not found', 'match/not-found');

      const session = snap.data() as OnlineMatchSession;
      observeServerTime(session.serverStamp);

      const outcome = computeMoveUpdate(session, {
        actingUid,
        moverUid,
        move,
        now: serverNow()
      });

      // A flag fall still produces a patch (the game ends), everything else
      // that is rejected writes nothing at all.
      if (outcome.patch) {
        transaction.update(ref, { ...outcome.patch, serverStamp: serverTimestamp() });
      }

      return {
        ok: outcome.ok,
        reason: outcome.reason,
        san: outcome.san,
        status: outcome.status
      };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Move failed';
    console.error('submitMove failed:', error);
    return { ok: false, reason: message };
  }
}

/** Settles a flag fall. Safe to call from either client — the transaction re-checks. */
export async function claimTimeout(matchId: string, claimantUid: string): Promise<boolean> {
  try {
    return await runTransaction(db, async transaction => {
      const ref = doc(db, MATCHES_COLLECTION, matchId);
      const snap = await transaction.get(ref);
      if (!snap.exists()) return false;
      const session = snap.data() as OnlineMatchSession;
      observeServerTime(session.serverStamp);

      if (!isParticipant(session, claimantUid) && !session.vsBot) return false;

      const patch = computeTimeoutUpdate(session, serverNow());
      if (!patch) return false;

      transaction.update(ref, { ...patch, serverStamp: serverTimestamp() });
      return true;
    });
  } catch (error) {
    console.error('claimTimeout failed:', error);
    return false;
  }
}

/** Wins the game when the opponent has been gone longer than the grace period. */
export async function claimAbandonment(matchId: string, claimantUid: string): Promise<boolean> {
  try {
    return await runTransaction(db, async transaction => {
      const ref = doc(db, MATCHES_COLLECTION, matchId);
      const snap = await transaction.get(ref);
      if (!snap.exists()) return false;
      const session = snap.data() as OnlineMatchSession;
      observeServerTime(session.serverStamp);

      if (session.status !== 'in_progress' || session.vsBot) return false;
      const myColor = colorOfPlayer(session, claimantUid);
      if (!myColor) return false;

      const opponentSeenAt = myColor === 'w' ? session.blackSeenAt : session.whiteSeenAt;
      if (!opponentSeenAt || serverNow() - opponentSeenAt <= ABANDON_CLAIM_MS) return false;

      transaction.update(ref, {
        status: 'abandoned',
        winner: myColor,
        reason: `${opponentOf(session, myColor).displayName} left the match.`,
        endedAt: serverNow(),
        updatedAt: new Date().toISOString(),
        serverStamp: serverTimestamp()
      });
      return true;
    });
  } catch (error) {
    console.error('claimAbandonment failed:', error);
    return false;
  }
}

export async function resignMatch(matchId: string, uid: string): Promise<boolean> {
  try {
    return await runTransaction(db, async transaction => {
      const ref = doc(db, MATCHES_COLLECTION, matchId);
      const snap = await transaction.get(ref);
      if (!snap.exists()) return false;
      const session = snap.data() as OnlineMatchSession;
      if (session.status !== 'in_progress' && session.status !== 'waiting') return false;
      const myColor = colorOfPlayer(session, uid);
      if (!myColor) return false;

      const winner = myColor === 'w' ? 'b' : 'w';
      const me = myColor === 'w' ? session.whitePlayer : session.blackPlayer;
      transaction.update(ref, {
        status: 'resigned',
        winner,
        reason: `${me.displayName} resigned.`,
        endedAt: serverNow(),
        updatedAt: new Date().toISOString(),
        serverStamp: serverTimestamp()
      });
      return true;
    });
  } catch (error) {
    console.error('resignMatch failed:', error);
    return false;
  }
}

/** Aborts a match nobody has really started (fewer than two moves played). */
export async function abortMatch(matchId: string, uid: string): Promise<boolean> {
  try {
    return await runTransaction(db, async transaction => {
      const ref = doc(db, MATCHES_COLLECTION, matchId);
      const snap = await transaction.get(ref);
      if (!snap.exists()) return false;
      const session = snap.data() as OnlineMatchSession;
      if (!isParticipant(session, uid)) return false;
      if ((session.moveCount ?? 0) >= 2) return false;
      if (session.status !== 'in_progress' && session.status !== 'waiting') return false;

      transaction.update(ref, {
        status: 'aborted',
        winner: null,
        reason: 'Match aborted before it began. No rating change.',
        endedAt: serverNow(),
        updatedAt: new Date().toISOString(),
        serverStamp: serverTimestamp()
      });
      return true;
    });
  } catch (error) {
    console.error('abortMatch failed:', error);
    return false;
  }
}

export async function offerDraw(matchId: string, uid: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, MATCHES_COLLECTION, matchId), {
      drawOfferFrom: uid,
      drawDeclinedAt: null,
      updatedAt: new Date().toISOString(),
      serverStamp: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('offerDraw failed:', error);
    return false;
  }
}

export async function respondToDrawOffer(
  matchId: string,
  uid: string,
  accept: boolean
): Promise<boolean> {
  try {
    return await runTransaction(db, async transaction => {
      const ref = doc(db, MATCHES_COLLECTION, matchId);
      const snap = await transaction.get(ref);
      if (!snap.exists()) return false;
      const session = snap.data() as OnlineMatchSession;
      if (!isParticipant(session, uid)) return false;
      if (!session.drawOfferFrom || session.drawOfferFrom === uid) return false;
      if (session.status !== 'in_progress') return false;

      if (!accept) {
        transaction.update(ref, {
          drawOfferFrom: null,
          drawDeclinedAt: serverNow(),
          updatedAt: new Date().toISOString(),
          serverStamp: serverTimestamp()
        });
        return true;
      }

      transaction.update(ref, {
        status: 'draw',
        winner: 'draw',
        reason: 'Draw agreed.',
        drawOfferFrom: null,
        endedAt: serverNow(),
        updatedAt: new Date().toISOString(),
        serverStamp: serverTimestamp()
      });
      return true;
    });
  } catch (error) {
    console.error('respondToDrawOffer failed:', error);
    return false;
  }
}

/* ------------------------------------------------------------------ *
 * Rematch
 * ------------------------------------------------------------------ */

export async function offerRematch(matchId: string, uid: string): Promise<boolean> {
  try {
    await updateDoc(doc(db, MATCHES_COLLECTION, matchId), {
      rematchOfferFrom: uid,
      updatedAt: new Date().toISOString(),
      serverStamp: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('offerRematch failed:', error);
    return false;
  }
}

/** Accepts a rematch: creates the new match with the colours swapped. */
export async function acceptRematch(matchId: string, uid: string): Promise<string | null> {
  try {
    const ref = doc(db, MATCHES_COLLECTION, matchId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    const session = snap.data() as OnlineMatchSession;
    if (!isParticipant(session, uid) && !session.vsBot) return null;
    if (session.rematchMatchId) return session.rematchMatchId;

    const newId = await createMatchSession(
      // Previous black becomes the new host (white) — colours alternate.
      session.blackPlayer,
      session.whitePlayer,
      session.timeControl,
      { hostColorChoice: 'w', vsBot: session.vsBot, rated: session.isRated }
    );

    await updateDoc(ref, {
      rematchMatchId: newId,
      rematchOfferFrom: null,
      updatedAt: new Date().toISOString(),
      serverStamp: serverTimestamp()
    });
    return newId;
  } catch (error) {
    console.error('acceptRematch failed:', error);
    return null;
  }
}

/* ------------------------------------------------------------------ *
 * Presence + subscription
 * ------------------------------------------------------------------ */

export async function heartbeat(matchId: string, uid: string, color: 'w' | 'b'): Promise<void> {
  try {
    await updateDoc(doc(db, MATCHES_COLLECTION, matchId), {
      [color === 'w' ? 'whiteSeenAt' : 'blackSeenAt']: serverNow(),
      serverStamp: serverTimestamp()
    });
  } catch {
    // Heartbeats are best-effort; a failure just shows the player as idle.
  }
}

export interface MatchSubscription {
  session: OnlineMatchSession | null;
  /** False when the stored position does not match the move history. */
  integrityOk: boolean;
  integrityReason?: string;
}

export function listenToMatch(
  matchId: string,
  callback: (update: MatchSubscription) => void,
  onError?: (error: Error) => void
): () => void {
  if (!matchId) return () => {};

  const ref = doc(db, MATCHES_COLLECTION, matchId);
  return onSnapshot(
    ref,
    snapshot => {
      if (!snapshot.exists()) {
        callback({ session: null, integrityOk: true });
        return;
      }
      const session = snapshot.data() as OnlineMatchSession;
      observeServerTime(session.serverStamp);

      // Older documents predate the move list; treat them as trusted.
      if (!session.moves) {
        callback({ session, integrityOk: true });
        return;
      }
      const verification = verifySession(session);
      callback({
        session,
        integrityOk: verification.ok,
        integrityReason: verification.reason
      });
    },
    error => {
      console.warn('Match subscription error:', error);
      onError?.(error);
    }
  );
}

/** Backwards-compatible subscription used by older callers. */
export const listenToOnlineMatchSession = (
  matchId: string,
  callback: (session: OnlineMatchSession | null) => void
) => listenToMatch(matchId, update => callback(update.session));

/* ------------------------------------------------------------------ *
 * Matchmaking
 * ------------------------------------------------------------------ */

export type MatchmakingMode = 'human_first' | 'human_strict' | 'instant_bot';

export interface MatchmakingTicket {
  id: string;
  player: OnlineMatchPlayer;
  timeControl: TimeControl;
  status: 'waiting' | 'matched' | 'cancelled';
  matchId?: string;
  /** Filled in by whoever claims the ticket, so the waiting side knows who it faces. */
  opponent?: OnlineMatchPlayer;
  color?: 'w' | 'b';
  createdAt: number;
  seenAt: number;
}

export interface MatchmakingHandle {
  ticketId: string;
  cancel: () => Promise<void>;
  pairWithBotNow: () => void;
}

/**
 * Worldwide matchmaking.
 *
 * The previous implementation could pair two players twice (both sides created
 * a match for the same pair), and told the waiting player that their opponent
 * was *themselves* — it read `player` off its own ticket. Claiming now happens
 * inside a transaction that writes both tickets and the match document
 * together, so exactly one of the two racing clients wins.
 */
export async function joinWorldwideMatchmaking(
  player: OnlineMatchPlayer,
  timeControl: TimeControl,
  onMatched: (matchId: string, opponent: OnlineMatchPlayer, isBot: boolean) => void,
  onStatusUpdate?: (statusText: string) => void,
  matchmakingMode: MatchmakingMode = 'human_first',
  fallbackTimeoutSeconds = 20
): Promise<MatchmakingHandle> {
  const ticketId = `ticket_${player.uid}_${Date.now().toString(36)}`;
  const ticketRef = doc(db, QUEUE_COLLECTION, ticketId);

  let cancelled = false;
  let matched = false;
  let unsubTicket: (() => void) | null = null;
  let unsubQueue: (() => void) | null = null;
  let fallbackTimer: ReturnType<typeof setTimeout> | null = null;
  let sweepTimer: ReturnType<typeof setInterval> | null = null;

  const teardown = () => {
    unsubTicket?.();
    unsubQueue?.();
    unsubTicket = null;
    unsubQueue = null;
    if (fallbackTimer) clearTimeout(fallbackTimer);
    if (sweepTimer) clearInterval(sweepTimer);
    fallbackTimer = null;
    sweepTimer = null;
  };

  const finish = (matchId: string, opponent: OnlineMatchPlayer, isBot: boolean) => {
    if (matched || cancelled) return;
    matched = true;
    teardown();
    deleteDoc(ticketRef).catch(() => {});
    onMatched(matchId, opponent, isBot);
  };

  const pairWithBot = async (reason: string) => {
    if (matched || cancelled) return;
    onStatusUpdate?.(reason);
    const challenger = pickChallengerFor(player.elo || 1200);
    try {
      const matchId = await createMatchSession(player, challenger, timeControl, {
        hostColorChoice: 'random',
        vsBot: true,
        rated: true
      });
      finish(matchId, challenger, true);
    } catch (error) {
      console.error('Failed to create bot match:', error);
      onStatusUpdate?.('Could not reach the match server. Please try again.');
    }
  };

  if (matchmakingMode === 'instant_bot') {
    onStatusUpdate?.('Preparing your engine challenger…');
    setTimeout(() => void pairWithBot('Connecting to your challenger…'), 500);
    return {
      ticketId,
      cancel: async () => {
        cancelled = true;
        teardown();
      },
      pairWithBotNow: () => {}
    };
  }

  /** Attempts to claim a specific waiting ticket. Returns true when we got it. */
  const tryClaim = async (candidateId: string): Promise<boolean> => {
    if (matched || cancelled) return false;
    const matchId = newMatchId();

    try {
      const result = await runTransaction(db, async transaction => {
        const candidateRef = doc(db, QUEUE_COLLECTION, candidateId);
        const myRef = doc(db, QUEUE_COLLECTION, ticketId);
        const [candidateSnap, mySnap] = await Promise.all([
          transaction.get(candidateRef),
          transaction.get(myRef)
        ]);

        if (!candidateSnap.exists()) return null;
        const candidate = candidateSnap.data() as MatchmakingTicket;
        if (candidate.status !== 'waiting') return null;
        if (candidate.player.uid === player.uid) return null;
        if (Date.now() - candidate.createdAt > TICKET_TTL_MS) return null;

        // Somebody already claimed us — let the ticket listener handle it.
        if (mySnap.exists() && (mySnap.data() as MatchmakingTicket).status !== 'waiting') return null;

        const iAmWhite = Math.random() < 0.5;
        const session = buildSession({
          id: matchId,
          host: iAmWhite ? player : candidate.player,
          guest: iAmWhite ? candidate.player : player,
          timeControl,
          hostIsWhite: true,
          status: 'in_progress',
          vsBot: false,
          rated: true,
          now: serverNow()
        });

        transaction.set(doc(db, MATCHES_COLLECTION, matchId), {
          ...session,
          serverStamp: serverTimestamp()
        });

        // Tell the other player who they are facing (the old code told them
        // their own name because it echoed their own ticket back).
        transaction.update(candidateRef, {
          status: 'matched',
          matchId,
          opponent: player,
          color: iAmWhite ? 'b' : 'w'
        });

        if (mySnap.exists()) {
          transaction.update(myRef, {
            status: 'matched',
            matchId,
            opponent: candidate.player,
            color: iAmWhite ? 'w' : 'b'
          });
        }

        return { matchId, opponent: candidate.player };
      });

      if (result) {
        onStatusUpdate?.(`Matched with ${result.opponent.displayName}. Entering the arena…`);
        finish(result.matchId, result.opponent, false);
        return true;
      }

      return false;
    } catch (error) {
      // A contended transaction just means the other client won the race.
      console.debug('Matchmaking claim lost:', error);
      return false;
    }
  };

  const scanQueue = async () => {
    if (matched || cancelled) return;
    try {
      const waiting = await getDocs(
        query(
          collection(db, QUEUE_COLLECTION),
          where('status', '==', 'waiting'),
          where('timeControl.id', '==', timeControl.id),
          limit(10)
        )
      );

      const candidates = waiting.docs
        .map(docSnap => ({ id: docSnap.id, data: docSnap.data() as MatchmakingTicket }))
        .filter(
          entry =>
            entry.id !== ticketId &&
            entry.data.player?.uid !== player.uid &&
            Date.now() - (entry.data.createdAt ?? 0) < TICKET_TTL_MS
        )
        // Oldest first: nobody waits forever.
        .sort((a, b) => (a.data.createdAt ?? 0) - (b.data.createdAt ?? 0));

      for (const candidate of candidates) {
        if (await tryClaim(candidate.id)) return;
      }
    } catch (error) {
      console.warn('Queue scan failed:', error);
    }
  };

  onStatusUpdate?.('Searching the worldwide queue for a live opponent…');

  const ticket: MatchmakingTicket = {
    id: ticketId,
    player,
    timeControl,
    status: 'waiting',
    createdAt: Date.now(),
    seenAt: Date.now()
  };
  await setDoc(ticketRef, ticket);

  // 1. Somebody may claim our ticket.
  unsubTicket = onSnapshot(ticketRef, snapshot => {
    if (matched || cancelled || !snapshot.exists()) return;
    const data = snapshot.data() as MatchmakingTicket;
    if (data.status === 'matched' && data.matchId && data.opponent) {
      onStatusUpdate?.(`Matched with ${data.opponent.displayName}. Entering the arena…`);
      finish(data.matchId, data.opponent, false);
    }
  });

  // 2. Or we claim somebody else's.
  await scanQueue();
  if (matched || cancelled) {
    return { ticketId, cancel: async () => { cancelled = true; teardown(); }, pairWithBotNow: () => {} };
  }

  unsubQueue = onSnapshot(
    query(
      collection(db, QUEUE_COLLECTION),
      where('status', '==', 'waiting'),
      where('timeControl.id', '==', timeControl.id),
      limit(10)
    ),
    snapshot => {
      if (matched || cancelled) return;
      for (const change of snapshot.docChanges()) {
        if (change.type === 'removed') continue;
        const data = change.doc.data() as MatchmakingTicket;
        if (change.doc.id === ticketId) continue;
        if (data.player?.uid === player.uid) continue;
        if (data.status !== 'waiting') continue;
        if (Date.now() - (data.createdAt ?? 0) > TICKET_TTL_MS) continue;
        void tryClaim(change.doc.id);
        break;
      }
    }
  );

  // Keep our ticket fresh so other clients do not skip it as stale.
  sweepTimer = setInterval(() => {
    if (matched || cancelled) return;
    updateDoc(ticketRef, { seenAt: Date.now() }).catch(() => {});
  }, 15_000);

  if (matchmakingMode === 'human_first') {
    fallbackTimer = setTimeout(() => {
      void pairWithBot('No human joined in time — pairing you with an engine challenger…');
    }, Math.max(3, fallbackTimeoutSeconds) * 1000);
  }

  return {
    ticketId,
    cancel: async () => {
      cancelled = true;
      teardown();
      try {
        await deleteDoc(ticketRef);
      } catch {
        // ignore
      }
    },
    pairWithBotNow: () => {
      void pairWithBot('Connecting to an engine challenger…');
    }
  };
}

/* ------------------------------------------------------------------ *
 * Deprecated shims (kept so nothing breaks if another screen still calls them)
 * ------------------------------------------------------------------ */

export const resignOnlineMatch = async (matchId: string, _color: 'w' | 'b', uid: string) =>
  resignMatch(matchId, uid);
export const offerDrawOnlineMatch = (matchId: string, uid: string) => offerDraw(matchId, uid);
export const acceptDrawOnlineMatch = (matchId: string, uid: string) =>
  respondToDrawOffer(matchId, uid, true);
