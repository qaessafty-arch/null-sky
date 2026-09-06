import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  limit,
  updateDoc, 
  deleteDoc,
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../utils/firebase';
import { OnlineMatchSession, OnlineMatchPlayer, TimeControl } from '../types/chess';
import { Chess } from 'chess.js';

export interface MatchmakingTicket {
  id: string;
  player: OnlineMatchPlayer;
  timeControl: TimeControl;
  status: 'waiting' | 'matched' | 'cancelled';
  matchId?: string;
  createdAt: number;
}

// Worldwide pool of Grandmaster challengers for instant matchmaking pairing
export const WORLDWIDE_CHALLENGERS: OnlineMatchPlayer[] = [
  {
    uid: 'ww_aryakrd_88',
    displayName: 'Peshmerga Arya ☀️',
    country: 'Kurdistan',
    flag: '☀️',
    elo: 1845,
    honorRank: 'Peshmerga Strategist',
    rankBadge: '🦅',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'
  },
  {
    uid: 'ww_hikaru_usa',
    displayName: 'BlitzHawk_US 🇺🇸',
    country: 'United States',
    flag: '🇺🇸',
    elo: 2150,
    honorRank: 'Grandmaster Champion',
    rankBadge: '👑',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
  },
  {
    uid: 'ww_elena_esp',
    displayName: 'Elena_Tactics 🇪🇸',
    country: 'Spain',
    flag: '🇪🇸',
    elo: 1720,
    honorRank: 'Knight Commander',
    rankBadge: '⚔️',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80'
  },
  {
    uid: 'ww_magnus_nor',
    displayName: 'VikingEndgame 🇳🇴',
    country: 'Norway',
    flag: '🇳🇴',
    elo: 2320,
    honorRank: 'Sovereign Grandmaster',
    rankBadge: '👑',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'
  },
  {
    uid: 'ww_yuki_jpn',
    displayName: 'Yuki_Shogi 🇯🇵',
    country: 'Japan',
    flag: '🇯🇵',
    elo: 1910,
    honorRank: 'High Tactician',
    rankBadge: '🌿',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80'
  },
  {
    uid: 'ww_kurdish_lion',
    displayName: 'Zagros_Lion ☀️',
    country: 'Kurdistan',
    flag: '☀️',
    elo: 1680,
    honorRank: 'Mountain Guardian',
    rankBadge: '🛡️',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=80'
  },
  {
    uid: 'ww_gabriel_bra',
    displayName: 'SambaGambit 🇧🇷',
    country: 'Brazil',
    flag: '🇧🇷',
    elo: 1795,
    honorRank: 'Peshmerga Tactician',
    rankBadge: '🌿',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80'
  },
  {
    uid: 'ww_marcel_fra',
    displayName: 'Marcel_Paris 🇫🇷',
    country: 'France',
    flag: '🇫🇷',
    elo: 1980,
    honorRank: 'Royal Guard',
    rankBadge: '⚔️',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80'
  }
];

export type MatchmakingMode = 'human_first' | 'human_strict' | 'instant_bot';

export const joinWorldwideMatchmaking = async (
  player: OnlineMatchPlayer,
  timeControl: TimeControl,
  onMatched: (matchId: string, opponent: OnlineMatchPlayer, isBot: boolean) => void,
  onStatusUpdate?: (statusText: string) => void,
  matchmakingMode: MatchmakingMode = 'human_first',
  fallbackTimeoutSeconds: number = 20
): Promise<{ ticketId: string; cancel: () => void; pairWithBotNow: () => void }> => {
  let isCancelled = false;
  let hasMatched = false;
  const ticketId = `ticket_${player.uid}_${Date.now()}`;
  const ticketDocRef = doc(db, 'matchmaking_queue', ticketId);

  let unsubMyTicket: (() => void) | null = null;
  let unsubQueue: (() => void) | null = null;
  let fallbackTimer: NodeJS.Timeout | null = null;

  const triggerBotFallback = async (reason = 'No active human found — pairing with worldwide grandmaster bot...') => {
    if (isCancelled || hasMatched) return;
    hasMatched = true;

    if (unsubMyTicket) unsubMyTicket();
    if (unsubQueue) unsubQueue();
    if (fallbackTimer) clearTimeout(fallbackTimer);

    onStatusUpdate?.(reason);

    // Pick a random worldwide challenger
    const randomChallenger = WORLDWIDE_CHALLENGERS[Math.floor(Math.random() * WORLDWIDE_CHALLENGERS.length)];
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const matchDocRef = doc(db, 'online_matches', matchId);

    const isHostWhite = Math.random() < 0.5;
    const whitePlayer = isHostWhite ? player : randomChallenger;
    const blackPlayer = isHostWhite ? randomChallenger : player;

    const initialSession: OnlineMatchSession = {
      id: matchId,
      hostId: player.uid,
      guestId: randomChallenger.uid,
      whitePlayer,
      blackPlayer,
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      pgn: '',
      turn: 'w',
      status: 'in_progress',
      winner: null,
      timeControl,
      whiteSecondsRemaining: timeControl.initialSeconds,
      blackSecondsRemaining: timeControl.initialSeconds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(matchDocRef, initialSession);
      await deleteDoc(ticketDocRef).catch(() => {});
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, 'online_matches');
      console.warn('Error creating bot session:', e);
    }

    onMatched(matchId, randomChallenger, true);
  };

  try {
    // If instant bot requested, execute immediately
    if (matchmakingMode === 'instant_bot') {
      onStatusUpdate?.('Initializing Grandmaster Bot duel...');
      setTimeout(() => {
        triggerBotFallback('Connecting to Grandmaster Bot...');
      }, 600);
      return {
        ticketId,
        cancel: () => {
          isCancelled = true;
        },
        pairWithBotNow: () => {}
      };
    }

    onStatusUpdate?.('Scanning worldwide live queue for real human players...');

    // Helper to pair with a found waiting human ticket
    const pairWithHumanTicket = async (otherTicketDoc: MatchmakingTicket, otherDocId: string) => {
      if (isCancelled || hasMatched) return;
      hasMatched = true;

      if (unsubMyTicket) unsubMyTicket();
      if (unsubQueue) unsubQueue();
      if (fallbackTimer) clearTimeout(fallbackTimer);

      onStatusUpdate?.(`Real human player matched: ${otherTicketDoc.player.displayName}! Initializing arena...`);

      const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const matchDocRef = doc(db, 'online_matches', matchId);

      const isHostWhite = Math.random() < 0.5;
      const whitePlayer = isHostWhite ? otherTicketDoc.player : player;
      const blackPlayer = isHostWhite ? player : otherTicketDoc.player;

      const initialSession: OnlineMatchSession = {
        id: matchId,
        hostId: otherTicketDoc.player.uid,
        guestId: player.uid,
        whitePlayer,
        blackPlayer,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        pgn: '',
        turn: 'w',
        status: 'in_progress',
        winner: null,
        timeControl,
        whiteSecondsRemaining: timeControl.initialSeconds,
        blackSecondsRemaining: timeControl.initialSeconds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 1. Create match session
      await setDoc(matchDocRef, initialSession);

      // 2. Notify the other player's ticket
      try {
        await updateDoc(doc(db, 'matchmaking_queue', otherDocId), {
          status: 'matched',
          matchId
        });
      } catch (err: any) {
        handleFirestoreError(err, OperationType.WRITE, 'matchmaking_queue');
        console.warn('Error pairing with opponent ticket:', err);
      }

      // 3. Clean up our own ticket
      try {
        await deleteDoc(ticketDocRef);
      } catch {}

      onMatched(matchId, otherTicketDoc.player, false);
    };

    // 1. Check existing waiting tickets from other humans
    const q = query(
      collection(db, 'matchmaking_queue'),
      where('status', '==', 'waiting'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    let candidateTicket: { data: MatchmakingTicket; id: string } | null = null;

    snapshot.forEach(docSnap => {
      const data = docSnap.data() as MatchmakingTicket;
      if (
        data?.player?.uid !== player?.uid &&
        data?.status === 'waiting' &&
        Date.now() - (data?.createdAt || 0) < 180000 // fresh within 3 mins
      ) {
        candidateTicket = { data, id: docSnap.id };
      }
    });

    if (candidateTicket && !isCancelled) {
      // Immediate live human found!
      await pairWithHumanTicket(candidateTicket.data, candidateTicket.id);
      return {
        ticketId,
        cancel: () => {
          isCancelled = true;
        },
        pairWithBotNow: () => {}
      };
    }

    // 2. No waiting human currently; register our ticket in Firestore
    const ticketData: MatchmakingTicket = {
      id: ticketId,
      player,
      timeControl,
      status: 'waiting',
      createdAt: Date.now()
    };

    await setDoc(ticketDocRef, ticketData);
    onStatusUpdate?.('Waiting for real human challengers to join worldwide queue...');

    // 3. Listen to our own ticket doc to see if someone pairs with us
    unsubMyTicket = onSnapshot(ticketDocRef, snap => {
      if (isCancelled || hasMatched) return;
      if (snap.exists()) {
        const data = snap.data() as MatchmakingTicket;
        if (data.status === 'matched' && data.matchId) {
          hasMatched = true;
          if (unsubMyTicket) unsubMyTicket();
          if (unsubQueue) unsubQueue();
          if (fallbackTimer) clearTimeout(fallbackTimer);

          onStatusUpdate?.('Match confirmed with real human! Entering arena...');
          onMatched(data.matchId, data.player, false);
        }
      }
    }, err => {
      console.warn('Matchmaking ticket stream:', err.message);
    });

    // 4. Also listen in real-time to the queue collection for incoming new players
    unsubQueue = onSnapshot(q, snap => {
      if (isCancelled || hasMatched) return;
      snap.docChanges().forEach(change => {
        if (change.type === 'added' || change.type === 'modified') {
          const docData = change.doc.data() as MatchmakingTicket;
          if (
            change.doc.id !== ticketId &&
            docData?.player?.uid !== player?.uid &&
            docData?.status === 'waiting' &&
            Date.now() - (docData?.createdAt || 0) < 180000
          ) {
            pairWithHumanTicket(docData, change.doc.id);
          }
        }
      });
    }, err => {
      console.warn('Matchmaking queue stream:', err.message);
    });

    // 5. If Human-First mode, start fallback timer
    if (matchmakingMode === 'human_first') {
      fallbackTimer = setTimeout(() => {
        if (!isCancelled && !hasMatched) {
          triggerBotFallback('No human joined in 20s. Pairing with Worldwide Grandmaster...');
        }
      }, fallbackTimeoutSeconds * 1000);
    }

    const cancel = async () => {
      isCancelled = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (unsubMyTicket) unsubMyTicket();
      if (unsubQueue) unsubQueue();
      try {
        await deleteDoc(ticketDocRef);
      } catch {}
    };

    const pairWithBotNow = () => {
      if (!isCancelled && !hasMatched) {
        triggerBotFallback('Connecting immediately with Grandmaster Bot...');
      }
    };

    return { ticketId, cancel, pairWithBotNow };
  } catch (e) {
    console.error('Error in worldwide matchmaking:', e);
    const randomChallenger = WORLDWIDE_CHALLENGERS[0];
    const matchId = `match_${Date.now()}_local`;
    onMatched(matchId, randomChallenger, true);
    return {
      ticketId,
      cancel: () => {
        isCancelled = true;
      },
      pairWithBotNow: () => {}
    };
  }
};

export const createOnlineMatchChallenge = async (
  hostPlayer: OnlineMatchPlayer,
  guestPlayer: OnlineMatchPlayer,
  timeControl: TimeControl,
  hostColorChoice: 'w' | 'b' | 'random' = 'random'
): Promise<string | null> => {
  try {
    const matchId = `match_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const matchDocRef = doc(db, 'online_matches', matchId);

    // Determine colors
    let isHostWhite = true;
    if (hostColorChoice === 'w') {
      isHostWhite = true;
    } else if (hostColorChoice === 'b') {
      isHostWhite = false;
    } else {
      isHostWhite = Math.random() < 0.5;
    }

    const whitePlayer = isHostWhite ? hostPlayer : guestPlayer;
    const blackPlayer = isHostWhite ? guestPlayer : hostPlayer;

    const initialSession: OnlineMatchSession = {
      id: matchId,
      hostId: hostPlayer.uid,
      guestId: guestPlayer.uid,
      whitePlayer,
      blackPlayer,
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      startFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
      pgn: '',
      moves: [],
      turn: 'w',
      status: 'waiting',
      winner: null,
      timeControl,
      whiteSecondsRemaining: timeControl.initialSeconds,
      blackSecondsRemaining: timeControl.initialSeconds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await setDoc(matchDocRef, initialSession);
    return matchId;
  } catch (e: any) {
    handleFirestoreError(e, OperationType.WRITE, 'online_matches');
    console.error('Error creating online match challenge:', e);
    return null;
  }
};

export const acceptOnlineMatchChallenge = async (matchId: string): Promise<boolean> => {
  try {
    const matchDocRef = doc(db, 'online_matches', matchId);
    await updateDoc(matchDocRef, {
      status: 'in_progress',
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (e: any) {
    handleFirestoreError(e, OperationType.WRITE, 'online_matches');
    console.error('Error accepting match challenge:', e);
    return false;
  }
};

export const sendOnlineMove = async (
  matchId: string,
  newFen: string,
  newPgn: string,
  nextTurn: 'w' | 'b',
  from: string,
  to: string,
  whiteSeconds: number,
  blackSeconds: number,
  status: 'in_progress' | 'checkmate' | 'draw' = 'in_progress',
  winner: 'w' | 'b' | 'draw' | null = null,
  reason?: string
): Promise<boolean> => {
  try {
    const matchDocRef = doc(db, 'online_matches', matchId);
    await updateDoc(matchDocRef, {
      fen: newFen,
      pgn: newPgn,
      turn: nextTurn,
      lastMoveFrom: from,
      lastMoveTo: to,
      lastMoveTimestamp: Date.now(),
      whiteSecondsRemaining: whiteSeconds,
      blackSecondsRemaining: blackSeconds,
      status,
      winner,
      reason: reason || null,
      drawOfferFrom: null, // Clear draw offers on move
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (e: any) {
    handleFirestoreError(e, OperationType.WRITE, 'online_matches');
    console.error('Error updating online match move:', e);
    return false;
  }
};

export const resignOnlineMatch = async (
  matchId: string,
  resigningColor: 'w' | 'b',
  resigningPlayerName: string
): Promise<boolean> => {
  try {
    const matchDocRef = doc(db, 'online_matches', matchId);
    const winner = resigningColor === 'w' ? 'b' : 'w';
    await updateDoc(matchDocRef, {
      status: 'resigned',
      winner,
      reason: `${resigningPlayerName} resigned the match.`,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (e) {
    console.error('Error resigning online match:', e);
    return false;
  }
};

export const offerDrawOnlineMatch = async (
  matchId: string,
  offeringPlayerId: string
): Promise<boolean> => {
  try {
    const matchDocRef = doc(db, 'online_matches', matchId);
    await updateDoc(matchDocRef, {
      drawOfferFrom: offeringPlayerId,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (e) {
    console.error('Error offering draw:', e);
    return false;
  }
};

export const acceptDrawOnlineMatch = async (matchId: string): Promise<boolean> => {
  try {
    const matchDocRef = doc(db, 'online_matches', matchId);
    await updateDoc(matchDocRef, {
      status: 'draw',
      winner: 'draw',
      reason: 'Game drawn by mutual agreement of both grandmasters.',
      drawOfferFrom: null,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (e) {
    console.error('Error accepting draw:', e);
    return false;
  }
};

export const finalizeOnlineMatch = async (matchId: string, winner: 'w' | 'b' | 'draw', reason: string) => {
  const matchRef = doc(db, 'online_matches', matchId);
  const snap = await getDoc(matchRef);
  if (!snap.exists()) return;
  const data = snap.data();

  await updateDoc(matchRef, {
    status: winner === 'draw' ? 'draw' : 'completed',
    winner,
    reason,
    updatedAt: new Date().toISOString()
  });

  // Automatically advance tournament bracket if this was a tournament match
  if (data.tournamentId && data.tournamentMatchId && winner !== 'draw') {
    const winnerUid = winner === 'w' ? data.whitePlayer.uid : data.blackPlayer.uid;
    const { advanceTournamentMatch } = await import('./tournamentService');
    await advanceTournamentMatch(data.tournamentId, data.tournamentMatchId, winnerUid);
  }
};

export const listenToOnlineMatchSession = (
  matchId: string,
  callback: (session: OnlineMatchSession | null) => void
) => {
  if (!matchId) return () => {};

  try {
    const docRef = doc(db, 'online_matches', matchId);
    const unsub = onSnapshot(docRef, snap => {
      if (snap.exists()) {
        callback(snap.data() as OnlineMatchSession);
      } else {
        callback(null);
      }
    }, err => {
      console.warn('Online match session listener error:', err);
    });

    return unsub;
  } catch (e) {
    console.error('Failed to listen to online match session:', e);
    return () => {};
  }
};

/**
 * Generates a memorable, unique 6-character game room code
 * (Uppercase alphanumeric, excluding ambiguous characters 0, O, 1, I)
 */
export const generateGameRoomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Creates an open multiplayer match room in Firestore with a 6-character code
 */
export const createOnlineMatch = async (
  hostPlayer: OnlineMatchPlayer,
  timeControl: TimeControl,
  side: 'w' | 'b' | 'random' = 'random',
  customCode?: string
): Promise<string> => {
  const cleanCode = (customCode?.trim().toUpperCase() || generateGameRoomCode());
  const matchId = cleanCode;
  const matchDocRef = doc(db, 'online_matches', matchId);

  // If match already exists and is in_progress, don't overwrite it
  try {
    const existingSnap = await getDoc(matchDocRef);
    if (existingSnap.exists()) {
      const existing = existingSnap.data() as OnlineMatchSession;
      if (existing.status === 'in_progress') {
        return matchId;
      }
    }
  } catch (e) {
    // ignore read error
  }

  const resolvedSide = side === 'random' ? (Math.random() < 0.5 ? 'w' : 'b') : side;
  const isHostWhite = resolvedSide === 'w';

  const initialSession: OnlineMatchSession = {
    id: matchId,
    code: matchId,
    hostId: hostPlayer.uid,
    whitePlayer: isHostWhite ? hostPlayer : null,
    blackPlayer: isHostWhite ? null : hostPlayer,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    startFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    pgn: '',
    moves: [],
    turn: 'w',
    status: 'waiting',
    winner: null,
    timeControl,
    whiteSecondsRemaining: timeControl.initialSeconds,
    blackSecondsRemaining: timeControl.initialSeconds,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  await setDoc(matchDocRef, initialSession);

  // Also register with server REST endpoint in background
  try {
    fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customCode: matchId,
        timeControl,
        side,
        playerInfo: hostPlayer
      })
    }).catch(() => {});
  } catch {}

  return matchId;
};

/**
 * Joins an existing multiplayer match room as the challenger/guest
 */
export const joinOnlineMatch = async (
  codeOrId: string,
  guestPlayer: OnlineMatchPlayer
): Promise<OnlineMatchSession> => {
  const cleanCode = codeOrId.trim().toUpperCase();
  let matchDocRef = doc(db, 'online_matches', cleanCode);
  let snap = await getDoc(matchDocRef);

  // If not found by direct ID, search by code field or lowercase ID
  if (!snap.exists()) {
    const q = query(
      collection(db, 'online_matches'),
      where('code', '==', cleanCode),
      limit(1)
    );
    const querySnap = await getDocs(q);
    if (!querySnap.empty) {
      matchDocRef = querySnap.docs[0].ref;
      snap = querySnap.docs[0];
    } else {
      // Fallback: search by id case-insensitively if legacy match_ id
      const legacyRef = doc(db, 'online_matches', codeOrId.trim());
      snap = await getDoc(legacyRef);
      if (snap.exists()) {
        matchDocRef = legacyRef;
      }
    }
  }

  // If still not found in online_matches, search the rooms collection (Private Rooms)
  if (!snap.exists()) {
    const roomDocRef = doc(db, 'rooms', cleanCode);
    const roomSnap = await getDoc(roomDocRef);
    if (roomSnap.exists()) {
      const roomData = roomSnap.data() as any;
      if (roomData.status !== 'waiting' && roomData.opponentId && roomData.opponentId !== guestPlayer.uid) {
        throw new Error('Match room is already full or in progress.');
      }

      const hostPlayer: OnlineMatchPlayer = {
        uid: roomData.creatorId,
        displayName: roomData.creatorName || 'Host',
        avatar: roomData.creatorPhotoURL || undefined,
        elo: Number(roomData.creatorElo) || 1200,
      };

      const preferredSide = roomData.settings?.color || roomData.creatorColor || 'random';
      const isHostWhite = preferredSide === 'white' ? true : preferredSide === 'black' ? false : Math.random() < 0.5;

      const tc: TimeControl = {
        id: roomData.settings?.timeControlId || 'rapid',
        name: roomData.settings?.timeControlName || 'Rapid 10+0',
        initialSeconds: Number(roomData.settings?.initialSeconds) || 600,
        incrementSeconds: Number(roomData.settings?.incrementSeconds) || 0,
        category: (Number(roomData.settings?.initialSeconds) || 600) < 180 ? 'bullet' : (Number(roomData.settings?.initialSeconds) || 600) < 600 ? 'blitz' : 'rapid',
      };

      const whitePlayer = isHostWhite ? hostPlayer : guestPlayer;
      const blackPlayer = isHostWhite ? guestPlayer : hostPlayer;

      const newSession: OnlineMatchSession = {
        id: cleanCode,
        code: cleanCode,
        hostId: roomData.creatorId,
        guestId: guestPlayer.uid,
        whitePlayer,
        blackPlayer,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        startFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        pgn: '',
        moves: [],
        turn: 'w',
        status: 'in_progress',
        winner: null,
        timeControl: tc,
        whiteSecondsRemaining: tc.initialSeconds,
        blackSecondsRemaining: tc.initialSeconds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Create the live match in online_matches
      await setDoc(matchDocRef, newSession);

      // Also update the private room to let the host know someone joined
      try {
        await updateDoc(roomDocRef, {
          opponentId: guestPlayer.uid,
          opponentName: guestPlayer.displayName || 'Challenger',
          opponentPhotoURL: guestPlayer.avatar || guestPlayer.photoURL || undefined,
          opponentElo: guestPlayer.elo || 1200,
          status: 'in_progress',
          gameId: cleanCode,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Could not update private room state:', err);
      }

      // Also notify server REST endpoint
      try {
        fetch(`/api/games/${encodeURIComponent(cleanCode)}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerInfo: guestPlayer })
        }).catch(() => {});
      } catch {}

      return newSession;
    }

    // Also check query on rooms where roomCode == cleanCode
    const roomQuery = query(
      collection(db, 'rooms'),
      where('roomCode', '==', cleanCode),
      limit(1)
    );
    const roomQuerySnap = await getDocs(roomQuery);
    if (!roomQuerySnap.empty) {
      const roomDoc = roomQuerySnap.docs[0];
      const roomData = roomDoc.data() as any;
      if (roomData.status !== 'waiting' && roomData.opponentId && roomData.opponentId !== guestPlayer.uid) {
        throw new Error('Match room is already full or in progress.');
      }

      const hostPlayer: OnlineMatchPlayer = {
        uid: roomData.creatorId,
        displayName: roomData.creatorName || 'Host',
        avatar: roomData.creatorPhotoURL || undefined,
        elo: Number(roomData.creatorElo) || 1200,
      };

      const preferredSide = roomData.settings?.color || roomData.creatorColor || 'random';
      const isHostWhite = preferredSide === 'white' ? true : preferredSide === 'black' ? false : Math.random() < 0.5;

      const tc: TimeControl = {
        id: roomData.settings?.timeControlId || 'rapid',
        name: roomData.settings?.timeControlName || 'Rapid 10+0',
        initialSeconds: Number(roomData.settings?.initialSeconds) || 600,
        incrementSeconds: Number(roomData.settings?.incrementSeconds) || 0,
        category: (Number(roomData.settings?.initialSeconds) || 600) < 180 ? 'bullet' : (Number(roomData.settings?.initialSeconds) || 600) < 600 ? 'blitz' : 'rapid',
      };

      const whitePlayer = isHostWhite ? hostPlayer : guestPlayer;
      const blackPlayer = isHostWhite ? guestPlayer : hostPlayer;

      const newSession: OnlineMatchSession = {
        id: cleanCode,
        code: cleanCode,
        hostId: roomData.creatorId,
        guestId: guestPlayer.uid,
        whitePlayer,
        blackPlayer,
        fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        startFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        pgn: '',
        moves: [],
        turn: 'w',
        status: 'in_progress',
        winner: null,
        timeControl: tc,
        whiteSecondsRemaining: tc.initialSeconds,
        blackSecondsRemaining: tc.initialSeconds,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(matchDocRef, newSession);

      try {
        await updateDoc(roomDoc.ref, {
          opponentId: guestPlayer.uid,
          opponentName: guestPlayer.displayName || 'Challenger',
          opponentPhotoURL: guestPlayer.avatar || guestPlayer.photoURL || undefined,
          opponentElo: guestPlayer.elo || 1200,
          status: 'in_progress',
          gameId: cleanCode,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Could not update private room state:', err);
      }

      return newSession;
    }

    // Check if room exists in server in-memory matchmaking API
    try {
      const serverRes = await fetch(`/api/games/${encodeURIComponent(cleanCode)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerInfo: guestPlayer })
      });
      if (serverRes.ok) {
        const data = await serverRes.json();
        if (data && data.success) {
          const tc: TimeControl = {
            id: 'rapid',
            name: 'Rapid 10+0',
            initialSeconds: 600,
            incrementSeconds: 0,
            category: 'rapid'
          };
          const serverSession: OnlineMatchSession = {
            id: data.gameId || cleanCode,
            code: data.gameCode || cleanCode,
            hostId: 'host_server',
            guestId: guestPlayer.uid,
            whitePlayer: data.playerColor === 'white' ? guestPlayer : { uid: 'host_server', displayName: 'Host', elo: 1200 },
            blackPlayer: data.playerColor === 'black' ? guestPlayer : { uid: 'host_server', displayName: 'Host', elo: 1200 },
            fen: data.game?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
            pgn: data.game?.pgn || '',
            moves: data.game?.moves || [],
            turn: 'w',
            status: 'in_progress',
            winner: null,
            timeControl: tc,
            whiteSecondsRemaining: tc.initialSeconds,
            blackSecondsRemaining: tc.initialSeconds,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'online_matches', cleanCode), serverSession).catch(() => {});
          return serverSession;
        }
      }
    } catch {
      // Ignore server fallback error and throw user-friendly error below
    }

    throw new Error(`Match room "${cleanCode}" not found. Please verify the code.`);
  }

  const session = snap.data() as OnlineMatchSession;
  if (session.status !== 'waiting' && session.guestId && session.guestId !== guestPlayer.uid) {
    throw new Error('Match room is already full or in progress.');
  }

  const whitePlayer = session.whitePlayer || guestPlayer;
  const blackPlayer = session.blackPlayer || guestPlayer;

  const updateData: Partial<OnlineMatchSession> = {
    guestId: guestPlayer.uid,
    whitePlayer,
    blackPlayer,
    status: 'in_progress',
    updatedAt: new Date().toISOString()
  };

  await updateDoc(matchDocRef, updateData);

  // If this match is also in rooms, update the room as well
  try {
    const rRef = doc(db, 'rooms', cleanCode);
    const rSnap = await getDoc(rRef);
    if (rSnap.exists()) {
      await updateDoc(rRef, {
        opponentId: guestPlayer.uid,
        opponentName: guestPlayer.displayName || 'Challenger',
        opponentPhotoURL: guestPlayer.avatar || guestPlayer.photoURL || undefined,
        opponentElo: guestPlayer.elo || 1200,
        status: 'in_progress',
        gameId: cleanCode,
        updatedAt: serverTimestamp(),
      });
    }
  } catch (err) {
    // Non-fatal
  }

  // Also notify server REST endpoint
  try {
    fetch(`/api/games/${encodeURIComponent(cleanCode)}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ playerInfo: guestPlayer })
    }).catch(() => {});
  } catch {}

  return { ...session, ...updateData } as OnlineMatchSession;
};

/**
 * Listens to active open challenges waiting for a player
 */
export const listenToPublicOpenMatches = (
  callback: (matches: OnlineMatchSession[]) => void
) => {
  try {
    const q = query(
      collection(db, 'online_matches'),
      where('status', '==', 'waiting'),
      limit(20)
    );

    const unsub = onSnapshot(q, snap => {
      const matches: OnlineMatchSession[] = [];
      snap.forEach(docSnap => {
        matches.push(docSnap.data() as OnlineMatchSession);
      });
      callback(matches);
    }, err => {
      console.warn('Open matches listener error:', err);
      callback([]);
    });

    return unsub;
  } catch (e) {
    console.error('Failed to listen to open matches:', e);
    return () => {};
  }
};

