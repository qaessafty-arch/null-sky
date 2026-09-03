// FILE: server/matchmaking.ts
import { Server, Socket } from 'socket.io';
import Redis from 'ioredis-mock';
import { v4 as uuidv4 } from 'uuid';
// @ts-ignore
import glicko2 from 'glicko2';
import { Chess } from 'chess.js';

const redis = new Redis();

// Glicko-2 settings
const glickoSettings = {
  tau: 0.5,
  rating: 1500,
  rd: 200,
  vol: 0.06
};
const ranking = new glicko2.Glicko2(glickoSettings);

export interface QueuePlayer {
  socketId: string;
  uid: string;
  rating: number;
  rd: number;
  ping: number;
  pool: string;
  rated: boolean;
  recentColors: ('w' | 'b')[];
  joinedAt: number;
}

export interface MatchSession {
  matchId: string;
  gameCode: string;
  whiteUid: string;
  blackUid: string;
  whiteName?: string;
  blackName?: string;
  whiteRating?: number;
  blackRating?: number;
  whiteSocketId?: string;
  blackSocketId?: string;
  pool: string;
  rated: boolean;
  timeControl: {
    name: string;
    initialSeconds: number;
    incrementSeconds: number;
  };
  status: 'waiting' | 'starting' | 'active' | 'completed' | 'aborted' | 'resigned' | 'timeout' | 'checkmate' | 'stalemate' | 'draw' | 'expired' | 'cancelled';
  createdAt: number;
  lastMoveAt: number;
  lastTimerTick?: number;
  whiteSecondsRemaining: number;
  blackSecondsRemaining: number;
  movesCount: number;
  movesList: Array<{ from: string; to: string; san: string; piece?: string; captured?: string; timestamp: number }>;
  capturedByWhite: string[];
  capturedByBlack: string[];
  waitingTimer?: NodeJS.Timeout;
  abortTimer?: NodeJS.Timeout;
  gameInterval?: NodeJS.Timeout;
  reconnectTimeout?: NodeJS.Timeout;
  chess: Chess;
  blurCountWhite: number;
  blurCountBlack: number;
  drawOfferedBy?: string | null;
  takebackOfferedBy?: string | null;
}

// FIX 1: Exclude ambiguous characters: 0, O, I, L, 1
export const UNAMBIGUOUS_CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function generateGameCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += UNAMBIGUOUS_CODE_CHARS.charAt(Math.floor(Math.random() * UNAMBIGUOUS_CODE_CHARS.length));
  }
  return code;
}

export function validateGameCodeFormat(code: string): { valid: boolean; cleanCode: string; error?: string } {
  if (!code || typeof code !== 'string') {
    return { valid: false, cleanCode: '', error: 'Game code is required.' };
  }
  const clean = code.trim().toUpperCase();
  if (clean.length !== 6) {
    return { valid: false, cleanCode: clean, error: 'Game code must be exactly 6 characters.' };
  }
  if (/[0O1IL]/.test(clean)) {
    return { valid: false, cleanCode: clean, error: 'Code contains ambiguous characters (0, O, 1, I, L are excluded).' };
  }
  const regex = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;
  if (!regex.test(clean)) {
    return { valid: false, cleanCode: clean, error: 'Invalid game code format: alphanumeric characters only.' };
  }
  return { valid: true, cleanCode: clean };
}

// FIX 6: Accurate ELO calculation with dynamic K-factor & bounded delta
export function computeEloDelta(whiteElo: number, blackElo: number, result: 'white' | 'black' | 'draw', whiteGames = 30, blackGames = 30) {
  const getK = (games: number) => {
    if (games < 30) return 40;
    if (games < 50) return 30;
    return 20;
  };
  const kW = getK(whiteGames);
  const kB = getK(blackGames);

  const expectedW = 1 / (1 + Math.pow(10, (blackElo - whiteElo) / 400));
  const expectedB = 1 / (1 + Math.pow(10, (whiteElo - blackElo) / 400));

  let actualW = 0.5;
  let actualB = 0.5;
  if (result === 'white') {
    actualW = 1;
    actualB = 0;
  } else if (result === 'black') {
    actualW = 0;
    actualB = 1;
  }

  const rawW = Math.round(kW * (actualW - expectedW));
  const rawB = Math.round(kB * (actualB - expectedB));

  const maxDelta = 50;
  const deltaW = Math.max(-maxDelta, Math.min(maxDelta, rawW));
  const deltaB = Math.max(-maxDelta, Math.min(maxDelta, rawB));

  return {
    whiteDelta: deltaW,
    blackDelta: deltaB,
    newWhiteElo: Math.max(100, whiteElo + deltaW),
    newBlackElo: Math.max(100, blackElo + deltaB)
  };
}

export class MatchmakingEngine {
  private io: Server;
  private queue: Map<string, QueuePlayer> = new Map();
  private activeMatches: Map<string, MatchSession> = new Map();
  private codeToMatchId: Map<string, string> = new Map(); // gameCode (uppercase) -> matchId
  private userToMatch: Map<string, string> = new Map(); // uid -> matchId
  private dodgePenalties: Map<string, number> = new Map(); // uid -> unban timestamp
  private moveLocks: Map<string, Promise<any>> = new Map(); // FIX 3: Concurrency move serialization

  constructor(io: Server) {
    this.io = io;
    
    // Process queue every 2 seconds
    setInterval(() => this.processQueue(), 2000);
    
    this.io.on('connection', (socket: Socket) => {
      console.log(`[Socket] Connection: ${socket.id}`);

      socket.on('ping', (cb) => {
        if (typeof cb === 'function') cb(Date.now());
      });

      socket.on('identify', (data) => {
        const { uid } = data;
        if (!uid) return;
        
        // FIX 5: Reconnection Logic with 30s grace period cancel
        const matchId = this.userToMatch.get(uid);
        if (matchId) {
          const match = this.activeMatches.get(matchId);
          if (match && (match.status === 'active' || match.status === 'starting' || match.status === 'waiting')) {
            console.log(`[Reconnection] User ${uid} rejoining match ${matchId}`);
            socket.join(matchId);
            if (match.gameCode) socket.join(match.gameCode);
            
            // Cancel pending abandonment timeout
            if (match.reconnectTimeout) {
              clearTimeout(match.reconnectTimeout);
              match.reconnectTimeout = undefined;
            }

            // Update socket ID for the player
            if (uid === match.whiteUid) match.whiteSocketId = socket.id;
            if (uid === match.blackUid) match.blackSocketId = socket.id;

            socket.to(matchId).emit('playerReconnected', { uid, socketId: socket.id });
            socket.to(matchId).emit('opponentReconnected');

            socket.emit('reconnect_success', {
              matchId,
              gameId: matchId,
              gameCode: match.gameCode,
              fen: match.chess.fen(),
              pgn: match.chess.pgn(),
              turn: match.chess.turn(),
              whiteSecondsRemaining: Math.round(match.whiteSecondsRemaining),
              blackSecondsRemaining: Math.round(match.blackSecondsRemaining),
              white: match.whiteUid,
              black: match.blackUid,
              status: match.status
            });
          }
        }
      });

      // Socket.IO event: 'createGame' -> returns gameCode
      socket.on('createGame', (data, cb) => {
        try {
          const { timeControl, side, playerInfo, customCode } = data || {};
          const uid = playerInfo?.uid || socket.id;
          const res = this.createCustomRoom({
            hostUid: uid,
            hostName: playerInfo?.displayName || playerInfo?.name || 'Player 1',
            hostRating: playerInfo?.elo || playerInfo?.rating || 1200,
            socketId: socket.id,
            timeControl,
            side,
            customCode
          });
          socket.join(res.gameId);
          if (res.gameCode) socket.join(res.gameCode);

          socket.emit('gameCreated', { gameCode: res.gameCode, gameId: res.gameId });
          socket.emit('waitingForOpponent', {
            gameCode: res.gameCode,
            gameId: res.gameId,
            message: `Waiting for opponent... Share code: ${res.gameCode}`,
            expiresInSeconds: 300
          });
          if (typeof cb === 'function') cb({ gameCode: res.gameCode, gameId: res.gameId });
        } catch (err: any) {
          if (typeof cb === 'function') cb({ error: err.message });
          else socket.emit('createError', { error: err.message });
        }
      });

      // Cancel waiting game anytime
      const handleCancelWaiting = (data: any, cb?: any) => {
        const { gameCode, matchId, gameId } = data || {};
        const target = gameCode || matchId || gameId;
        const match = this.getMatch(target);
        if (match && match.status === 'waiting') {
          if (match.waitingTimer) clearTimeout(match.waitingTimer);
          match.status = 'cancelled';
          this.io.to(match.matchId).emit('gameCancelled', {
            gameId: match.matchId,
            gameCode: match.gameCode,
            reason: 'Game was cancelled by the host.'
          });
          this.cleanupMatch(match.matchId);
          if (typeof cb === 'function') cb({ success: true });
        }
      };
      socket.on('cancelGame', handleCancelWaiting);
      socket.on('cancel_game', handleCancelWaiting);
      socket.on('cancelWaiting', handleCancelWaiting);

      // Socket.IO event: 'joinGame' (gameCode) -> returns player color & notifies room
      socket.on('joinGame', (data, cb) => {
        try {
          const { gameCode, matchId, playerInfo } = data || {};
          const code = (gameCode || matchId || '').toString();
          const uid = playerInfo?.uid || socket.id;

          const res = this.joinCustomRoom(code, {
            uid,
            name: playerInfo?.displayName || playerInfo?.name || 'Player 2',
            rating: playerInfo?.elo || playerInfo?.rating || 1200,
            socketId: socket.id
          });

          socket.join(res.match.matchId);
          if (res.match.gameCode) socket.join(res.match.gameCode);

          socket.emit('gameJoined', {
            color: res.playerColor,
            gameId: res.match.matchId,
            gameCode: res.match.gameCode
          });

          if (typeof cb === 'function') {
            cb({
              color: res.playerColor,
              gameId: res.match.matchId,
              gameCode: res.match.gameCode
            });
          }
        } catch (err: any) {
          if (typeof cb === 'function') cb({ error: err.message });
          else socket.emit('joinError', { error: err.message });
        }
      });

      // Socket.IO event: 'join_match' / 'join_room' / 'joinRoom'
      const handleJoinMatchRoom = (data: any, cb?: any) => {
        const { matchId, gameId, gameCode, uid, session } = data || {};
        const id = matchId || gameId || gameCode;
        if (!id) {
          if (typeof cb === 'function') cb({ error: 'Missing room ID or code' });
          return;
        }

        let match = this.getMatch(id);
        if (!match) {
          console.log(`[Socket] Bootstrapping match room for ${id}`);
          match = this.bootstrapMatch(id, { session, uid });
        }

        socket.join(match.matchId);
        if (match.gameCode) socket.join(match.gameCode);

        if (uid) {
          if (uid === match.whiteUid) match.whiteSocketId = socket.id;
          else if (uid === match.blackUid) match.blackSocketId = socket.id;
          else if (!match.whiteUid) {
            match.whiteUid = uid;
            match.whiteSocketId = socket.id;
          } else if (!match.blackUid) {
            match.blackUid = uid;
            match.blackSocketId = socket.id;
          }
          this.userToMatch.set(uid, match.matchId);
        }

        const roomState = {
          success: true,
          matchId: match.matchId,
          gameCode: match.gameCode,
          fen: match.chess.fen(),
          turn: match.chess.turn(),
          whiteSecondsRemaining: Math.round(match.whiteSecondsRemaining),
          blackSecondsRemaining: Math.round(match.blackSecondsRemaining),
          movesCount: match.movesCount,
          status: match.status
        };

        socket.emit('match_joined', roomState);
        socket.emit('roomJoined', roomState);
        if (typeof cb === 'function') cb(roomState);
      };

      socket.on('join_match', handleJoinMatchRoom);
      socket.on('join_room', handleJoinMatchRoom);
      socket.on('joinRoom', handleJoinMatchRoom);

      // FIX 3: Unified move handler with concurrency serialization per matchId
      const handleMakeMove = async (data: any, cb?: any) => {
        const { gameId, matchId, from, to, promotionPiece, promotion, uid, fen } = data || {};
        const id = gameId || matchId;
        if (!id) {
          const err = 'Match room not found.';
          socket.emit('move_rejected', { error: err });
          socket.emit('moveRejected', { error: err });
          if (typeof cb === 'function') cb({ error: err });
          return;
        }

        let match = this.getMatch(id);
        if (!match) {
          match = this.bootstrapMatch(id, data);
        }

        // Concurrency lock: queue move processing behind any in-flight move for this match
        const previousLock = this.moveLocks.get(match.matchId) || Promise.resolve();
        const currentOperation = previousLock.then(async () => {
          return this.processMove(socket, match!, { from, to, promotionPiece, promotion, uid, fen }, cb);
        }).catch((err) => {
          socket.emit('move_rejected', { error: err.message || 'Move execution error' });
          if (typeof cb === 'function') cb({ error: err.message });
        });

        this.moveLocks.set(match.matchId, currentOperation);
      };

      socket.on('makeMove', handleMakeMove);
      socket.on('make_move', handleMakeMove);

      // Resign
      const handleResign = (data: any) => {
        const { gameId, matchId, uid } = data || {};
        const match = this.getMatch(gameId || matchId);
        if (match && (match.status === 'active' || match.status === 'starting')) {
          const isWhite = (uid && uid === match.whiteUid) || socket.id === match.whiteSocketId;
          const winner = isWhite ? 'b' : 'w';
          this.handleGameOver(match, 'resignation', winner);
        }
      };
      socket.on('resign', handleResign);

      // Offer Draw
      const handleOfferDraw = (data: any) => {
        const { gameId, matchId, uid, playerName } = data || {};
        const match = this.getMatch(gameId || matchId);
        if (match && match.status === 'active') {
          match.drawOfferedBy = uid || socket.id;
          socket.to(match.matchId).emit('drawOffered', { playerName: playerName || 'Opponent', uid });
          socket.to(match.matchId).emit('draw_offered', { playerName: playerName || 'Opponent', uid });
        }
      };
      socket.on('offerDraw', handleOfferDraw);
      socket.on('offer_draw', handleOfferDraw);

      // Accept Draw
      const handleAcceptDraw = (data: any) => {
        const { gameId, matchId } = data || {};
        const match = this.getMatch(gameId || matchId);
        if (match && match.status === 'active') {
          this.io.to(match.matchId).emit('drawAccepted');
          this.io.to(match.matchId).emit('draw_accepted');
          this.handleGameOver(match, 'draw', 'draw');
        }
      };
      socket.on('acceptDraw', handleAcceptDraw);
      socket.on('accept_draw', handleAcceptDraw);

      // Decline Draw
      const handleDeclineDraw = (data: any) => {
        const { gameId, matchId } = data || {};
        const match = this.getMatch(gameId || matchId);
        if (match) {
          match.drawOfferedBy = null;
          socket.to(match.matchId).emit('drawDeclined');
          socket.to(match.matchId).emit('draw_declined');
        }
      };
      socket.on('declineDraw', handleDeclineDraw);
      socket.on('decline_draw', handleDeclineDraw);

      // Get Board State
      socket.on('getBoardState', (data, cb) => {
        const { gameId, matchId } = data || {};
        const match = this.getMatch(gameId || matchId);
        if (match) {
          const state = this.getGameState(match.matchId);
          if (typeof cb === 'function') cb(state);
          else socket.emit('boardState', state);
        } else {
          if (typeof cb === 'function') cb({ error: 'Game not found' });
        }
      });

      socket.on('join_queue', async (data) => {
        const { uid, rating, rd, ping, pool, rated, recentColors } = data;
        
        // Check penalty
        const unbanTime = this.dodgePenalties.get(uid);
        if (unbanTime && Date.now() < unbanTime) {
          return socket.emit('queue_error', { message: `You are in a queue timeout. Try again in ${Math.ceil((unbanTime - Date.now())/1000)} seconds.` });
        }

        // Store in queue
        this.queue.set(uid, {
          socketId: socket.id,
          uid,
          rating: rating || 1200,
          rd: rd || 200,
          ping: ping || 50,
          pool: pool || 'rapid',
          rated: !!rated,
          recentColors: recentColors || [],
          joinedAt: Date.now()
        });

        socket.emit('queue_joined', { pool, status: 'searching' });
      });

      socket.on('leave_queue', (data) => {
        if (data?.uid) this.queue.delete(data.uid);
      });

      socket.on('tab_blur', (data) => {
        const { matchId, uid } = data;
        const match = this.getMatch(matchId);
        if (!match || !match.rated) return;

        if (uid === match.whiteUid) {
          match.blurCountWhite++;
        } else if (uid === match.blackUid) {
          match.blurCountBlack++;
        }
      });

      socket.on('abort_match', (data) => {
        const { matchId, uid } = data;
        const match = this.getMatch(matchId);
        if (match) {
          this.handleAbort(match, uid);
        }
      });

      // Disconnect handling with 30-second abandonment grace period
      socket.on('disconnect', () => {
        // Remove from queue if waiting
        for (const [uid, player] of this.queue.entries()) {
          if (player.socketId === socket.id) {
            this.queue.delete(uid);
          }
        }

        // Check active matches for disconnected player
        for (const match of this.activeMatches.values()) {
          if (match.status !== 'active' && match.status !== 'starting') continue;

          const isWhite = match.whiteSocketId === socket.id;
          const isBlack = match.blackSocketId === socket.id;

          if (isWhite || isBlack) {
            const disconnectedUid = isWhite ? match.whiteUid : match.blackUid;
            const color = isWhite ? 'white' : 'black';

            socket.to(match.matchId).emit('opponentDisconnected', {
              color,
              gracePeriodSeconds: 30
            });
            socket.to(match.matchId).emit('playerDisconnected', {
              uid: disconnectedUid,
              color,
              gracePeriodSeconds: 30
            });

            // Set 30-second abandonment timer
            if (match.reconnectTimeout) clearTimeout(match.reconnectTimeout);
            match.reconnectTimeout = setTimeout(() => {
              if (match.status === 'active' || match.status === 'starting') {
                const winner = isWhite ? 'b' : 'w';
                this.io.to(match.matchId).emit('playerAbandoned', {
                  uid: disconnectedUid,
                  winner
                });
                this.handleGameOver(match, 'abandoned', winner);
              }
            }, 30000);
          }
        }
      });
    });
  }

  /**
   * Internal move execution called within per-match concurrency lock
   */
  private processMove(
    socket: Socket,
    match: MatchSession,
    data: { from: string; to: string; promotionPiece?: string; promotion?: string; uid?: string; fen?: string },
    cb?: any
  ) {
    const { from, to, promotionPiece, promotion, uid, fen } = data;

    // Ensure socket is in rooms
    socket.join(match.matchId);
    if (match.gameCode) socket.join(match.gameCode);

    if (uid) {
      if (uid === match.whiteUid) match.whiteSocketId = socket.id;
      else if (uid === match.blackUid) match.blackSocketId = socket.id;
      this.userToMatch.set(uid, match.matchId);
    }

    if (match.status === 'completed' || match.status === 'aborted' || match.status === 'expired') {
      const err = 'Game has already ended.';
      socket.emit('move_rejected', { error: err });
      if (typeof cb === 'function') cb({ error: err });
      return;
    }

    const activeTurn = match.chess.turn();
    const isWhite = (uid && uid === match.whiteUid) || socket.id === match.whiteSocketId;
    const isBlack = (uid && uid === match.blackUid) || socket.id === match.blackSocketId;
    const playerColor = isWhite ? 'w' : (isBlack ? 'b' : null);
    
    if (playerColor && playerColor !== activeTurn) {
      const piece = match.chess.get(from as any);
      if (piece && piece.color !== playerColor) {
        const err = 'Not your turn.';
        socket.emit('move_rejected', { error: err });
        socket.emit('moveRejected', { error: err });
        if (typeof cb === 'function') cb({ error: err });
        return;
      }
    }

    const promo = promotionPiece || promotion || 'q';
    let moveResult = match.chess.move({
      from: from as any,
      to: to as any,
      promotion: promo
    });

    if (!moveResult && fen) {
      try {
        const fallbackChess = new Chess(fen);
        moveResult = fallbackChess.move({
          from: from as any,
          to: to as any,
          promotion: promo
        });
        if (moveResult) {
          match.chess = fallbackChess;
        }
      } catch {}
    }

    if (!moveResult) {
      const err = 'Illegal move sequence detected.';
      socket.emit('move_rejected', { error: err });
      socket.emit('moveRejected', { error: err });
      if (typeof cb === 'function') cb({ error: err });
      return;
    }

    // Move accepted: calculate elapsed time accurately
    const now = Date.now();
    const elapsed = Math.max(0, (now - match.lastMoveAt) / 1000);
    
    // Track captured pieces
    if (moveResult.captured) {
      if (moveResult.color === 'w') {
        match.capturedByWhite.push(moveResult.captured);
      } else {
        match.capturedByBlack.push(moveResult.captured);
      }
    }

    match.movesList.push({
      from,
      to,
      san: moveResult.san,
      piece: moveResult.piece,
      captured: moveResult.captured,
      timestamp: now
    });

    // Update clocks with increment
    if (match.movesCount > 0) {
      const inc = match.timeControl?.incrementSeconds || 0;
      if (activeTurn === 'w') {
        match.whiteSecondsRemaining = Math.max(0, match.whiteSecondsRemaining - elapsed + inc);
      } else {
        match.blackSecondsRemaining = Math.max(0, match.blackSecondsRemaining - elapsed + inc);
      }
    }
    
    match.lastMoveAt = now;
    match.movesCount++;
    
    if (match.status === 'starting' || match.status === 'waiting') {
      if (match.abortTimer) clearTimeout(match.abortTimer);
      if (match.waitingTimer) clearTimeout(match.waitingTimer);
      match.status = 'active';
      this.startMatchTimers(match);
    }

    const legalMoves = match.chess.moves({ verbose: true }).map(m => ({ from: m.from, to: m.to, san: m.san }));

    const movePayload = {
      gameId: match.matchId,
      matchId: match.matchId,
      from,
      to,
      san: moveResult.san,
      fen: match.chess.fen(),
      pgn: match.chess.pgn(),
      turn: match.chess.turn(),
      captured: {
        white: match.capturedByWhite,
        black: match.capturedByBlack
      },
      lastMove: { from, to },
      check: match.chess.inCheck(),
      checkmate: match.chess.isCheckmate(),
      stalemate: match.chess.isStalemate(),
      legalMoves,
      whiteSecondsRemaining: Math.round(match.whiteSecondsRemaining),
      blackSecondsRemaining: Math.round(match.blackSecondsRemaining),
      moveIndex: match.movesCount
    };

    // Broadcast to match and code rooms
    this.io.to(match.matchId).emit('moveMade', movePayload);
    this.io.to(match.matchId).emit('move_made', movePayload);
    if (match.gameCode && match.gameCode !== match.matchId) {
      this.io.to(match.gameCode).emit('moveMade', movePayload);
      this.io.to(match.gameCode).emit('move_made', movePayload);
    }
    if (typeof cb === 'function') cb({ success: true, ...movePayload });

    // Check game termination conditions
    if (match.chess.isCheckmate()) {
      this.handleGameOver(match, 'checkmate', activeTurn);
    } else if (match.chess.isStalemate()) {
      this.handleGameOver(match, 'stalemate', 'draw');
    } else if (match.chess.isDraw()) {
      this.handleGameOver(match, 'draw', 'draw');
    }
  }

  private processQueue() {
    const pools = new Map<string, QueuePlayer[]>();
    for (const player of this.queue.values()) {
      const key = `${player.pool}_${player.rated}`;
      if (!pools.has(key)) pools.set(key, []);
      pools.get(key)!.push(player);
    }

    for (const [poolKey, players] of pools.entries()) {
      players.sort((a, b) => a.joinedAt - b.joinedAt);
      const matched = new Set<string>();

      for (let i = 0; i < players.length; i++) {
        const p1 = players[i];
        if (matched.has(p1.uid)) continue;

        const waitTime1 = (Date.now() - p1.joinedAt) / 1000;
        const boundary50 = 50 + Math.floor(waitTime1 / 5) * 100;
        const searchRadius1 = Math.min(300, boundary50);

        for (let j = i + 1; j < players.length; j++) {
          const p2 = players[j];
          if (matched.has(p2.uid)) continue;

          const waitTime2 = (Date.now() - p2.joinedAt) / 1000;
          const searchRadius2 = Math.min(300, 50 + Math.floor(waitTime2 / 5) * 100);

          const eloDiff = Math.abs(p1.rating - p2.rating);
          const pingDiff = Math.abs(p1.ping - p2.ping);

          if (eloDiff <= searchRadius1 && eloDiff <= searchRadius2 && pingDiff <= 150) {
            matched.add(p1.uid);
            matched.add(p2.uid);
            this.queue.delete(p1.uid);
            this.queue.delete(p2.uid);

            this.createMatch(p1, p2);
            break;
          }
        }
      }
    }
  }

  public getMatch(idOrCode?: string): MatchSession | undefined {
    if (!idOrCode) return undefined;
    const clean = idOrCode.trim();
    if (this.activeMatches.has(clean)) {
      return this.activeMatches.get(clean);
    }
    const cleanUpper = clean.toUpperCase();
    if (this.activeMatches.has(cleanUpper)) {
      return this.activeMatches.get(cleanUpper);
    }
    const mappedId = this.codeToMatchId.get(cleanUpper);
    if (mappedId && this.activeMatches.has(mappedId)) {
      return this.activeMatches.get(mappedId);
    }
    for (const match of this.activeMatches.values()) {
      if (match.gameCode && match.gameCode.toUpperCase() === cleanUpper) {
        return match;
      }
      if (match.matchId === clean || match.matchId.toUpperCase() === cleanUpper) {
        return match;
      }
    }
    return undefined;
  }

  public bootstrapMatch(id: string, data?: any): MatchSession {
    const sessionData = data?.session;
    const fen = data?.fen || sessionData?.fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    let chessInstance: Chess;
    try {
      chessInstance = new Chess(fen);
    } catch {
      chessInstance = new Chess();
    }

    const tc = sessionData?.timeControl || {
      name: 'Rapid 10 min',
      initialSeconds: 600,
      incrementSeconds: 0
    };

    const cleanId = id.trim();
    const code = sessionData?.code || (cleanId.length <= 8 ? cleanId.toUpperCase() : cleanId.slice(-6).toUpperCase());

    const whiteUid = sessionData?.whitePlayer?.uid || (data?.uid ? data.uid : '');
    const blackUid = sessionData?.blackPlayer?.uid || '';

    const newMatch: MatchSession = {
      matchId: cleanId,
      gameCode: code,
      whiteUid,
      blackUid,
      whiteName: sessionData?.whitePlayer?.displayName || 'White',
      blackName: sessionData?.blackPlayer?.displayName || 'Black',
      whiteRating: sessionData?.whitePlayer?.elo || 1200,
      blackRating: sessionData?.blackPlayer?.elo || 1200,
      pool: 'custom',
      rated: false,
      timeControl: tc,
      status: 'active',
      createdAt: Date.now(),
      lastMoveAt: Date.now(),
      whiteSecondsRemaining: sessionData?.whiteSecondsRemaining ?? tc.initialSeconds,
      blackSecondsRemaining: sessionData?.blackSecondsRemaining ?? tc.initialSeconds,
      movesCount: chessInstance.history().length,
      movesList: [],
      capturedByWhite: [],
      capturedByBlack: [],
      chess: chessInstance,
      blurCountWhite: 0,
      blurCountBlack: 0
    };

    this.activeMatches.set(cleanId, newMatch);
    this.activeMatches.set(code, newMatch);
    this.codeToMatchId.set(code, cleanId);

    if (whiteUid) this.userToMatch.set(whiteUid, cleanId);
    if (blackUid) this.userToMatch.set(blackUid, cleanId);

    return newMatch;
  }

  /**
   * FIX 1: Unique game code generation with 5-minute expiration timer
   */
  public createCustomRoom(params: {
    hostUid: string;
    hostName?: string;
    hostRating?: number;
    socketId?: string;
    timeControl?: { name: string; initialSeconds: number; incrementSeconds: number };
    side?: 'w' | 'b' | 'random';
    customCode?: string;
  }): { gameId: string; gameCode: string; session: MatchSession } {
    let gameCode = '';
    let isUnique = false;

    if (params.customCode) {
      const val = validateGameCodeFormat(params.customCode);
      if (!val.valid) throw new Error(val.error);
      if (this.codeToMatchId.has(val.cleanCode)) {
        throw new Error('This game code is already active. Please choose another code.');
      }
      gameCode = val.cleanCode;
    } else {
      for (let i = 0; i < 20; i++) {
        const candidate = generateGameCode();
        if (!this.codeToMatchId.has(candidate) && !this.activeMatches.has(candidate)) {
          gameCode = candidate;
          isUnique = true;
          break;
        }
      }
      if (!isUnique || !gameCode) {
        gameCode = generateGameCode();
      }
    }

    const matchId = uuidv4();

    const tc = params.timeControl || {
      name: 'Rapid 10 min',
      initialSeconds: 600,
      incrementSeconds: 0
    };

    let hostColor: 'w' | 'b';
    if (params.side === 'b') hostColor = 'b';
    else if (params.side === 'w') hostColor = 'w';
    else hostColor = Math.random() > 0.5 ? 'w' : 'b';

    const session: MatchSession = {
      matchId,
      gameCode,
      whiteUid: hostColor === 'w' ? params.hostUid : '',
      blackUid: hostColor === 'b' ? params.hostUid : '',
      whiteName: hostColor === 'w' ? (params.hostName || 'Player 1') : undefined,
      blackName: hostColor === 'b' ? (params.hostName || 'Player 1') : undefined,
      whiteRating: hostColor === 'w' ? (params.hostRating || 1200) : undefined,
      blackRating: hostColor === 'b' ? (params.hostRating || 1200) : undefined,
      whiteSocketId: hostColor === 'w' ? params.socketId : undefined,
      blackSocketId: hostColor === 'b' ? params.socketId : undefined,
      pool: 'custom',
      rated: false,
      timeControl: tc,
      status: 'waiting',
      createdAt: Date.now(),
      lastMoveAt: Date.now(),
      whiteSecondsRemaining: tc.initialSeconds,
      blackSecondsRemaining: tc.initialSeconds,
      movesCount: 0,
      movesList: [],
      capturedByWhite: [],
      capturedByBlack: [],
      chess: new Chess(),
      blurCountWhite: 0,
      blurCountBlack: 0
    };

    // 5-minute expiration timer (300,000ms)
    session.waitingTimer = setTimeout(() => {
      if (session.status === 'waiting') {
        session.status = 'expired';
        this.io.to(matchId).emit('gameExpired', {
          gameId: matchId,
          gameCode,
          reason: 'Opponent did not join within 5 minutes. The game code has expired.'
        });
        this.cleanupMatch(matchId);
      }
    }, 5 * 60 * 1000);

    this.activeMatches.set(matchId, session);
    this.activeMatches.set(gameCode, session);
    this.codeToMatchId.set(gameCode, matchId);
    this.userToMatch.set(params.hostUid, matchId);

    return { gameId: matchId, gameCode, session };
  }

  public joinCustomRoom(
    codeOrId: string,
    player: { uid: string; name?: string; rating?: number; socketId?: string }
  ): { success: boolean; playerColor: 'w' | 'b'; match: MatchSession } {
    if (!codeOrId) {
      throw new Error('Please enter a valid 6-character game code.');
    }

    const cleanInput = codeOrId.trim().toUpperCase();

    // If it's a 6-character code, validate format
    if (cleanInput.length === 6) {
      const val = validateGameCodeFormat(cleanInput);
      if (!val.valid) throw new Error(val.error);
    }

    const match = this.getMatch(cleanInput);
    if (!match) {
      throw new Error(`Match room "${cleanInput}" not found or code has expired.`);
    }

    if (match.status === 'expired') {
      throw new Error('This game code has expired (5 minute timeout exceeded).');
    }

    if (match.status !== 'waiting') {
      if (match.whiteUid === player.uid) {
        if (player.socketId) match.whiteSocketId = player.socketId;
        return { success: true, playerColor: 'w', match };
      }
      if (match.blackUid === player.uid) {
        if (player.socketId) match.blackSocketId = player.socketId;
        return { success: true, playerColor: 'b', match };
      }
      throw new Error('This room is already full or in progress.');
    }

    // Host cannot join their own game as opponent
    if (match.whiteUid === player.uid || match.blackUid === player.uid) {
      throw new Error('You are the host of this room. Waiting for an opponent to join.');
    }

    // Clear 5-minute waiting timer
    if (match.waitingTimer) {
      clearTimeout(match.waitingTimer);
      match.waitingTimer = undefined;
    }

    // Determine color
    let playerColor: 'w' | 'b';
    if (!match.whiteUid) {
      match.whiteUid = player.uid;
      match.whiteName = player.name || 'Player 2';
      match.whiteRating = player.rating || 1200;
      match.whiteSocketId = player.socketId;
      playerColor = 'w';
    } else {
      match.blackUid = player.uid;
      match.blackName = player.name || 'Player 2';
      match.blackRating = player.rating || 1200;
      match.blackSocketId = player.socketId;
      playerColor = 'b';
    }

    match.status = 'starting';
    match.lastMoveAt = Date.now();
    this.userToMatch.set(player.uid, match.matchId);

    // 45-second first move abort timer
    match.abortTimer = setTimeout(() => {
      this.handleAbort(match, 'system');
    }, 45000);

    const startPayload = {
      gameId: match.matchId,
      matchId: match.matchId,
      gameCode: match.gameCode,
      players: {
        white: { uid: match.whiteUid, name: match.whiteName, rating: match.whiteRating },
        black: { uid: match.blackUid, name: match.blackName, rating: match.blackRating }
      },
      timeControl: match.timeControl,
      fen: match.chess.fen(),
      pgn: match.chess.pgn()
    };

    this.io.to(match.matchId).emit('gameStarted', startPayload);
    this.io.to(match.matchId).emit('match_found', {
      matchId: match.matchId,
      white: { uid: match.whiteUid, rating: match.whiteRating },
      black: { uid: match.blackUid, rating: match.blackRating },
      pool: match.pool,
      rated: match.rated
    });

    return { success: true, playerColor, match };
  }

  public getGameState(idOrCode: string) {
    const match = this.getMatch(idOrCode);
    if (!match) return null;
    return {
      gameId: match.matchId,
      gameCode: match.gameCode,
      fen: match.chess.fen(),
      pgn: match.chess.pgn(),
      turn: match.chess.turn(),
      status: match.status,
      timeControl: match.timeControl,
      whitePlayer: {
        uid: match.whiteUid,
        displayName: match.whiteName || 'White',
        rating: match.whiteRating || 1200
      },
      blackPlayer: {
        uid: match.blackUid,
        displayName: match.blackName || 'Black',
        rating: match.blackRating || 1200
      },
      whiteSecondsRemaining: Math.round(match.whiteSecondsRemaining),
      blackSecondsRemaining: Math.round(match.blackSecondsRemaining),
      moves: match.movesList,
      captured: {
        white: match.capturedByWhite,
        black: match.capturedByBlack
      },
      check: match.chess.inCheck(),
      checkmate: match.chess.isCheckmate(),
      stalemate: match.chess.isStalemate(),
      isDraw: match.chess.isDraw()
    };
  }

  public getGamePgn(idOrCode: string): string | null {
    const match = this.getMatch(idOrCode);
    return match ? match.chess.pgn() : null;
  }

  public getGameFen(idOrCode: string): string | null {
    const match = this.getMatch(idOrCode);
    return match ? match.chess.fen() : null;
  }

  public getGameMoves(idOrCode: string) {
    const match = this.getMatch(idOrCode);
    return match ? match.movesList : null;
  }

  private createMatch(p1: QueuePlayer, p2: QueuePlayer) {
    let p1WhiteScore = p1.recentColors.filter(c => c === 'w').length;
    let p2WhiteScore = p2.recentColors.filter(c => c === 'w').length;

    let whitePlayer: QueuePlayer;
    let blackPlayer: QueuePlayer;

    if (p1WhiteScore < p2WhiteScore) {
      whitePlayer = p1; blackPlayer = p2;
    } else if (p2WhiteScore < p1WhiteScore) {
      whitePlayer = p2; blackPlayer = p1;
    } else {
      const p1LastWhite = p1.recentColors.lastIndexOf('w');
      const p2LastWhite = p2.recentColors.lastIndexOf('w');
      if (p1LastWhite < p2LastWhite) {
        whitePlayer = p1; blackPlayer = p2;
      } else {
        whitePlayer = Math.random() > 0.5 ? p1 : p2;
        blackPlayer = whitePlayer === p1 ? p2 : p1;
      }
    }

    const matchId = uuidv4();
    const gameCode = generateGameCode();
    const initialSeconds = whitePlayer.pool === 'blitz' ? 180 : (whitePlayer.pool === 'bullet' ? 60 : 600);

    const session: MatchSession = {
      matchId,
      gameCode,
      whiteUid: whitePlayer.uid,
      blackUid: blackPlayer.uid,
      whiteName: 'Player White',
      blackName: 'Player Black',
      whiteRating: whitePlayer.rating,
      blackRating: blackPlayer.rating,
      whiteSocketId: whitePlayer.socketId,
      blackSocketId: blackPlayer.socketId,
      pool: whitePlayer.pool,
      rated: whitePlayer.rated,
      timeControl: {
        name: whitePlayer.pool,
        initialSeconds,
        incrementSeconds: 0
      },
      status: 'starting',
      createdAt: Date.now(),
      lastMoveAt: Date.now(),
      whiteSecondsRemaining: initialSeconds,
      blackSecondsRemaining: initialSeconds,
      movesCount: 0,
      movesList: [],
      capturedByWhite: [],
      capturedByBlack: [],
      chess: new Chess(),
      blurCountWhite: 0,
      blurCountBlack: 0
    };

    this.userToMatch.set(whitePlayer.uid, matchId);
    this.userToMatch.set(blackPlayer.uid, matchId);
    this.codeToMatchId.set(gameCode, matchId);

    session.abortTimer = setTimeout(() => {
      this.handleAbort(session, 'system');
    }, 30000);

    this.activeMatches.set(matchId, session);

    const sWhite = this.io.sockets.sockets.get(whitePlayer.socketId);
    const sBlack = this.io.sockets.sockets.get(blackPlayer.socketId);
    if (sWhite) sWhite.join(matchId);
    if (sBlack) sBlack.join(matchId);

    const payload = {
      matchId,
      gameId: matchId,
      gameCode,
      white: { uid: whitePlayer.uid, rating: whitePlayer.rating },
      black: { uid: blackPlayer.uid, rating: blackPlayer.rating },
      pool: session.pool,
      rated: session.rated
    };
    this.io.to(matchId).emit('match_found', payload);
    this.io.to(matchId).emit('gameStarted', {
      ...payload,
      players: {
        white: { uid: whitePlayer.uid, rating: whitePlayer.rating },
        black: { uid: blackPlayer.uid, rating: blackPlayer.rating }
      },
      timeControl: session.timeControl,
      fen: session.chess.fen(),
      pgn: session.chess.pgn()
    });
  }

  /**
   * FIX 4: Drift-free timer with high-precision timestamp deltas
   */
  private startMatchTimers(match: MatchSession) {
    if (match.gameInterval) clearInterval(match.gameInterval);

    match.lastTimerTick = Date.now();

    match.gameInterval = setInterval(() => {
      if (match.status !== 'active') return;

      const now = Date.now();
      const elapsed = Math.max(0, (now - (match.lastTimerTick || now)) / 1000);
      match.lastTimerTick = now;

      const turn = match.chess.turn();
      if (turn === 'w') {
        match.whiteSecondsRemaining = Math.max(0, match.whiteSecondsRemaining - elapsed);
      } else {
        match.blackSecondsRemaining = Math.max(0, match.blackSecondsRemaining - elapsed);
      }

      // Check for timeout
      if (match.whiteSecondsRemaining <= 0 || match.blackSecondsRemaining <= 0) {
        this.handleGameOver(match, 'timeout', match.whiteSecondsRemaining <= 0 ? 'b' : 'w');
      }

      // Emit timer updates
      this.io.to(match.matchId).emit('timerUpdate', {
        whiteTime: Math.round(match.whiteSecondsRemaining),
        blackTime: Math.round(match.blackSecondsRemaining),
        white: Math.round(match.whiteSecondsRemaining),
        black: Math.round(match.blackSecondsRemaining)
      });

      if (Math.floor(Date.now() / 1000) % 2 === 0) {
        this.io.to(match.matchId).emit('clock_sync', {
          white: Math.round(match.whiteSecondsRemaining),
          black: Math.round(match.blackSecondsRemaining)
        });
      }
    }, 500);
  }

  private handleGameOver(match: MatchSession, reason: string, winner: 'w' | 'b' | 'draw' | null) {
    if (match.status === 'completed') return;
    match.status = 'completed';
    
    if (match.gameInterval) clearInterval(match.gameInterval);
    if (match.abortTimer) clearTimeout(match.abortTimer);
    if (match.waitingTimer) clearTimeout(match.waitingTimer);
    if (match.reconnectTimeout) clearTimeout(match.reconnectTimeout);

    const result = winner === 'draw'
      ? 'draw'
      : (winner === 'w' ? 'whiteWins' : (winner === 'b' ? 'blackWins' : 'draw'));

    // Rating changes calculation
    const ratingChanges = match.rated && match.whiteRating && match.blackRating
      ? computeEloDelta(
          match.whiteRating,
          match.blackRating,
          winner === 'w' ? 'white' : (winner === 'b' ? 'black' : 'draw')
        )
      : null;

    const overPayload = {
      result,
      winner,
      reason,
      fen: match.chess.fen(),
      pgn: match.chess.pgn(),
      ratingChanges
    };

    this.io.to(match.matchId).emit('gameOver', overPayload);
    this.io.to(match.matchId).emit('game_over', overPayload);

    // FIX 7: Cleanup mappings
    setTimeout(() => {
      this.cleanupMatch(match.matchId);
    }, 15000);
  }

  private handleAbort(session: MatchSession, triggeredByUid: string) {
    if (session.status !== 'starting' && session.status !== 'active' && session.status !== 'waiting') return;
    session.status = 'aborted';
    if (session.abortTimer) clearTimeout(session.abortTimer);
    if (session.gameInterval) clearInterval(session.gameInterval);
    if (session.waitingTimer) clearTimeout(session.waitingTimer);
    if (session.reconnectTimeout) clearTimeout(session.reconnectTimeout);

    if (triggeredByUid === session.whiteUid || triggeredByUid === 'system') {
      const pUid = triggeredByUid === 'system' ? session.whiteUid : triggeredByUid;
      if (pUid) {
        this.dodgePenalties.set(pUid, Date.now() + 5 * 60 * 1000);
      }
    }

    const abortPayload = {
      reason: triggeredByUid === 'system' ? 'White failed to make the first move in time.' : 'Opponent aborted the match.'
    };
    this.io.to(session.matchId).emit('match_aborted', abortPayload);
    this.io.to(session.matchId).emit('gameOver', { result: 'aborted', winner: null, ...abortPayload });

    this.cleanupMatch(session.matchId);
  }

  private cleanupMatch(matchId: string) {
    const match = this.activeMatches.get(matchId);
    if (match) {
      if (match.gameInterval) clearInterval(match.gameInterval);
      if (match.abortTimer) clearTimeout(match.abortTimer);
      if (match.waitingTimer) clearTimeout(match.waitingTimer);
      if (match.reconnectTimeout) clearTimeout(match.reconnectTimeout);

      if (match.whiteUid) this.userToMatch.delete(match.whiteUid);
      if (match.blackUid) this.userToMatch.delete(match.blackUid);
      if (match.gameCode) {
        this.codeToMatchId.delete(match.gameCode);
        this.activeMatches.delete(match.gameCode);
      }
      this.activeMatches.delete(match.matchId);
      this.moveLocks.delete(match.matchId);
    }
  }
}
