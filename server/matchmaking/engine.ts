// Matchmaking engine — owns transport (Socket.IO) and mutable state
// (queue, activeMatches, indexes). Pure logic lives in matchState.ts.

import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { Chess } from 'chess.js';
import {
  MatchSession,
  MatchStatus,
  QueuePlayer,
  TimeControl,
} from './types.js';
import {
  generateGameCode,
  validateGameCodeFormat,
} from './gameCode.js';
import {
  handleGameOver,
  handleAbort,
  startMatchTimers,
  stopMatchTimers,
  newChessFromFen,
  buildInitialTimeControl,
} from './matchState.js';

/** Set of statuses that are still "live" for disconnect / reconnect
 *  handling. */
const LIVE_STATUSES: MatchStatus[] = ['active', 'starting', 'waiting'];

export class MatchmakingEngine {
  private io: Server;
  private queue = new Map<string, QueuePlayer>();
  private activeMatches = new Map<string, MatchSession>();
  private codeToMatchId = new Map<string, string>();
  private userToMatch = new Map<string, string>();
  private dodgePenalties = new Map<string, number>();
  private moveLocks = new Map<string, Promise<void>>();

  constructor(io: Server) {
    this.io = io;

    // Process the queue every 2 seconds.
    setInterval(() => this.processQueue(), 2000);

    // Middleware to extract and validate auth token from handshake
    this.io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      const uid = socket.handshake.auth?.uid;

      if (!token && !uid) {
        return next(new Error('Authentication error: Missing credentials.'));
      }

      // Attach credentials to socket.data for secure lifecycle use
      socket.data = { ...socket.data, token, uid };
      
      next();
    });

    this.io.on('connection', (socket) => this.onConnect(socket));
  }

  // ---- Socket.IO wiring ----

  private onConnect(socket: Socket): void {
    console.log(`[Socket] Connection: ${socket.id}`);

    const authUid = socket.data.uid || socket.handshake.auth?.uid;
    if (authUid) {
      this.handleIdentify(socket, authUid);
    }

    socket.on('ping', (cb) => {
      if (typeof cb === 'function') cb(Date.now());
    });

    socket.on('createGame', (data, cb) =>
      this.handleCreateGame(socket, data, cb),
    );
    socket.on('cancelGame', (data, cb) =>
      this.handleCancelWaiting(socket, data, cb),
    );
    socket.on('cancel_game', (data, cb) =>
      this.handleCancelWaiting(socket, data, cb),
    );
    socket.on('cancelWaiting', (data, cb) =>
      this.handleCancelWaiting(socket, data, cb),
    );

    socket.on('joinGame', (data, cb) =>
      this.handleJoinGame(socket, data, cb),
    );

    socket.on('join_match', (data, cb) =>
      this.handleJoinMatchRoom(socket, data, cb),
    );
    socket.on('join_room', (data, cb) =>
      this.handleJoinMatchRoom(socket, data, cb),
    );
    socket.on('joinRoom', (data, cb) =>
      this.handleJoinMatchRoom(socket, data, cb),
    );

    socket.on('makeMove', (data, cb) => this.handleMakeMove(socket, data, cb));
    socket.on('make_move', (data, cb) => this.handleMakeMove(socket, data, cb));

    socket.on('resign', (data) => this.handleResign(socket, data));
    socket.on('offerDraw', (data) => this.handleOfferDraw(socket, data));
    socket.on('offer_draw', (data) => this.handleOfferDraw(socket, data));
    socket.on('acceptDraw', (data) => this.handleAcceptDraw(socket, data));
    socket.on('accept_draw', (data) => this.handleAcceptDraw(socket, data));
    socket.on('declineDraw', (data) => this.handleDeclineDraw(socket, data));
    socket.on('decline_draw', (data) => this.handleDeclineDraw(socket, data));

    socket.on('getBoardState', (data, cb) =>
      this.handleGetBoardState(socket, data, cb),
    );

    socket.on('join_queue', (data) => this.handleJoinQueue(socket, data));
    socket.on('leave_queue', (data) => this.handleLeaveQueue(socket, data));
    socket.on('tab_blur', (data) => this.handleTabBlur(socket, data));
    socket.on('abort_match', (data) => this.handleAbortMatch(socket, data));

    socket.on('disconnect', () => this.handleDisconnect(socket));
  }

  // ---- Identify / reconnect ----

  private handleIdentify(socket: Socket, uid: string): void {
    const matchId = this.userToMatch.get(uid);
    if (!matchId) return;

    const match = this.activeMatches.get(matchId);
    if (
      !match ||
      !LIVE_STATUSES.includes(match.status)
    )
      return;

    console.log(`[Reconnection] User ${uid} rejoining match ${matchId}`);
    socket.join(matchId);
    if (match.gameCode) socket.join(match.gameCode);

    if (match.reconnectTimeout) {
      clearTimeout(match.reconnectTimeout);
      match.reconnectTimeout = undefined;
    }

    if (uid === match.whiteUid) match.whiteSocketId = socket.id;
    if (uid === match.blackUid) match.blackSocketId = socket.id;

    socket.to(matchId).emit('playerReconnected', {
      uid,
      socketId: socket.id,
    });
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
      status: match.status,
    });
  }

  // ---- Create / join / cancel ----

  private handleCreateGame(
    socket: Socket,
    data: any,
    cb?: (res: any) => void,
  ): void {
    try {
      const {
        timeControl,
        side,
        playerInfo,
        customCode,
      } = data ?? {};
      const uid = playerInfo?.uid ?? socket.id;
      const res = this.createCustomRoom({
        hostUid: uid,
        hostName:
          playerInfo?.displayName ??
          playerInfo?.name ??
          'Player 1',
        hostRating:
          playerInfo?.elo ?? playerInfo?.rating ?? 1200,
        socketId: socket.id,
        timeControl,
        side,
        customCode,
      });

      socket.join(res.gameId);
      if (res.gameCode) socket.join(res.gameCode);

      socket.emit('gameCreated', {
        gameCode: res.gameCode,
        gameId: res.gameId,
      });
      socket.emit('waitingForOpponent', {
        gameCode: res.gameCode,
        gameId: res.gameId,
        message: `Waiting for opponent... Share code: ${res.gameCode}`,
        expiresInSeconds: 300,
      });

      if (typeof cb === 'function')
        cb({ gameCode: res.gameCode, gameId: res.gameId });
    } catch (err: any) {
      if (typeof cb === 'function') cb({ error: err.message });
      else socket.emit('createError', { error: err.message });
    }
  }

  private handleCancelWaiting(
    socket: Socket,
    data: any,
    cb?: any,
  ): void {
    const { gameCode, matchId, gameId } = data ?? {};
    const target = gameCode ?? matchId ?? gameId;
    const match = this.getMatch(target);
    if (!match || match.status !== 'waiting') return;

    if (match.waitingTimer) {
      clearTimeout(match.waitingTimer);
      match.waitingTimer = undefined;
    }
    match.status = 'cancelled';
    this.io.to(match.matchId).emit('gameCancelled', {
      gameId: match.matchId,
      gameCode: match.gameCode,
      reason: 'Game was cancelled by the host.',
    });
    this.cleanupMatch(match.matchId);
    if (typeof cb === 'function') cb({ success: true });
  }

  private handleJoinGame(
    socket: Socket,
    data: any,
    cb?: (res: any) => void,
  ): void {
    try {
      const { gameCode, matchId, playerInfo } = data ?? {};
      const code = (gameCode ?? matchId ?? '').toString();
      const uid = playerInfo?.uid ?? socket.id;

      const res = this.joinCustomRoom(code, {
        uid,
        name:
          playerInfo?.displayName ??
          playerInfo?.name ??
          'Player 2',
        rating:
          playerInfo?.elo ?? playerInfo?.rating ?? 1200,
        socketId: socket.id,
      });

      socket.join(res.match.matchId);
      if (res.match.gameCode) socket.join(res.match.gameCode);

      socket.emit('gameJoined', {
        color: res.playerColor,
        gameId: res.match.matchId,
        gameCode: res.match.gameCode,
      });

      if (typeof cb === 'function')
        cb({
          color: res.playerColor,
          gameId: res.match.matchId,
          gameCode: res.match.gameCode,
        });
    } catch (err: any) {
      if (typeof cb === 'function') cb({ error: err.message });
      else socket.emit('joinError', { error: err.message });
    }
  }

  private handleJoinMatchRoom(
    socket: Socket,
    data: any,
    cb?: any,
  ): void {
    const { matchId, gameId, gameCode, uid, session } = data ?? {};
    const id = matchId ?? gameId ?? gameCode;
    if (!id) {
      if (typeof cb === 'function')
        cb({ error: 'Missing room ID or code' });
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
      if (uid === match.whiteUid) {
        match.whiteSocketId = socket.id;
      } else if (uid === match.blackUid) {
        match.blackSocketId = socket.id;
      } else if (!match.whiteUid) {
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
      status: match.status,
      whitePlayer: { uid: match.whiteUid, name: match.whiteName, rating: match.whiteRating },
      blackPlayer: { uid: match.blackUid, name: match.blackName, rating: match.blackRating },
    };

    socket.emit('match_joined', roomState);
    socket.emit('roomJoined', roomState);
    if (typeof cb === 'function') cb(roomState);
  }

  // ---- Move handling ----

  private handleMakeMove(
    socket: Socket,
    data: any,
    cb?: any,
  ): void {
    const {
      gameId,
      matchId,
      from,
      to,
      promotionPiece,
      promotion,
      uid,
      fen,
    } = data ?? {};
    const id = gameId ?? matchId;
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

    // Concurrency lock: queue behind any in-flight move for this match.
    const previousLock =
      this.moveLocks.get(match.matchId) ?? Promise.resolve();
    const currentOperation = previousLock
      .then(() =>
        this.processMove(
          socket,
          match,
          { from, to, promotionPiece, promotion, uid, fen },
          cb,
        ),
      )
      .catch((err) => {
        socket.emit('move_rejected', {
          error: err.message ?? 'Move execution error',
        });
        if (typeof cb === 'function')
          cb({ error: err.message });
      });

    this.moveLocks.set(match.matchId, currentOperation);
  }

  // ---- Resign / draw ----

  private handleResign(socket: Socket, data: any): void {
    const { gameId, matchId, uid } = data ?? {};
    const match = this.getMatch(gameId ?? matchId);
    if (!match) return;
    if (match.status !== 'active' && match.status !== 'starting')
      return;

    const isWhite =
      (uid && uid === match.whiteUid) ||
      socket.id === match.whiteSocketId;
    const winner = isWhite ? 'b' : 'w';
    this.finishGameOver(match, 'resignation', winner);
  }

  private handleOfferDraw(socket: Socket, data: any): void {
    const { gameId, matchId, uid, playerName } = data ?? {};
    const match = this.getMatch(gameId ?? matchId);
    if (!match || match.status !== 'active') return;

    match.drawOfferedBy = uid ?? socket.id;
    socket.to(match.matchId).emit('drawOffered', {
      playerName: playerName ?? 'Opponent',
      uid,
    });
    socket.to(match.matchId).emit('draw_offered', {
      playerName: playerName ?? 'Opponent',
      uid,
    });
  }

  private handleAcceptDraw(socket: Socket, data: any): void {
    const { gameId, matchId } = data ?? {};
    const match = this.getMatch(gameId ?? matchId);
    if (!match || match.status !== 'active') return;

    this.io.to(match.matchId).emit('drawAccepted');
    this.io.to(match.matchId).emit('draw_accepted');
    this.finishGameOver(match, 'draw', 'draw');
  }

  private handleDeclineDraw(socket: Socket, data: any): void {
    const { gameId, matchId } = data ?? {};
    const match = this.getMatch(gameId ?? matchId);
    if (!match) return;

    match.drawOfferedBy = null;
    socket.to(match.matchId).emit('drawDeclined');
    socket.to(match.matchId).emit('draw_declined');
  }

  // ---- Board state query ----

  private handleGetBoardState(
    socket: Socket,
    data: any,
    cb?: (res: any) => void,
  ): void {
    const { gameId, matchId } = data ?? {};
    const match = this.getMatch(gameId ?? matchId);
    if (match) {
      const state = this.getGameState(match.matchId);
      if (typeof cb === 'function') cb(state);
      else socket.emit('boardState', state);
    } else {
      if (typeof cb === 'function')
        cb({ error: 'Game not found' });
    }
  }

  // ---- Queue ----

  private handleJoinQueue(socket: Socket, data: any): void {
    const { uid, rating, rd, ping, pool, rated, recentColors } = data;

    const unbanTime = this.dodgePenalties.get(uid);
    if (unbanTime && Date.now() < unbanTime) {
      socket.emit('queue_error', {
        message: `You are in a queue timeout. Try again in ${Math.ceil(
          (unbanTime - Date.now()) / 1000,
        )} seconds.`,
      });
      return;
    }

    this.queue.set(uid, {
      socketId: socket.id,
      uid,
      rating: rating ?? 1200,
      rd: rd ?? 200,
      ping: ping ?? 50,
      pool: pool ?? 'rapid',
      rated: !!rated,
      recentColors: recentColors ?? [],
      joinedAt: Date.now(),
    });

    socket.emit('queue_joined', { pool, status: 'searching' });
  }

  private handleLeaveQueue(socket: Socket, data: any): void {
    if (data?.uid) this.queue.delete(data.uid);
  }

  private handleTabBlur(socket: Socket, data: any): void {
    const { matchId, uid } = data;
    const match = this.getMatch(matchId);
    if (!match || !match.rated) return;

    if (uid === match.whiteUid) {
      match.blurCountWhite++;
    } else if (uid === match.blackUid) {
      match.blurCountBlack++;
    }
  }

  private handleAbortMatch(socket: Socket, data: any): void {
    const { matchId, uid } = data;
    const match = this.getMatch(matchId);
    if (match) this.doAbort(match, uid);
  }

  // ---- Disconnect ----

  private handleDisconnect(socket: Socket): void {
    // Remove from queue if waiting.
    for (const [uid, player] of this.queue.entries()) {
      if (player.socketId === socket.id) {
        this.queue.delete(uid);
      }
    }

    // Check active matches for disconnected player.
    for (const match of this.activeMatches.values()) {
      if (!LIVE_STATUSES.includes(match.status)) continue;

      const isWhite = match.whiteSocketId === socket.id;
      const isBlack = match.blackSocketId === socket.id;
      if (!isWhite && !isBlack) continue;

      const disconnectedUid = isWhite ? match.whiteUid : match.blackUid;
      const color = isWhite ? 'white' : 'black';

      socket.to(match.matchId).emit('opponentDisconnected', {
        color,
        gracePeriodSeconds: 30,
      });
      socket.to(match.matchId).emit('playerDisconnected', {
        uid: disconnectedUid,
        color,
        gracePeriodSeconds: 30,
      });

      if (match.reconnectTimeout)
        clearTimeout(match.reconnectTimeout);
      match.reconnectTimeout = setTimeout(() => {
        if (LIVE_STATUSES.includes(match.status)) {
          if (match.movesCount === 0) {
            this.doAbort(match, 'system');
          } else {
            const winner = isWhite ? 'b' : 'w';
            this.io.to(match.matchId).emit('playerAbandoned', {
              uid: disconnectedUid,
              winner,
            });
            this.finishGameOver(match, 'abandoned', winner);
          }
        }
      }, 30000);
    }
  }

  // ---- Internal move execution ----

  private async processMove(
    socket: Socket,
    match: MatchSession,
    data: {
      from: string;
      to: string;
      promotionPiece?: string;
      promotion?: string;
      uid?: string;
      fen?: string;
    },
    cb?: any,
  ): Promise<void> {
    const { from, to, promotionPiece, promotion, uid, fen } = data;

    socket.join(match.matchId);
    if (match.gameCode) socket.join(match.gameCode);

    if (uid) {
      if (uid === match.whiteUid) match.whiteSocketId = socket.id;
      else if (uid === match.blackUid) match.blackSocketId = socket.id;
      this.userToMatch.set(uid, match.matchId);
    }

    if (
      match.status === 'completed' ||
      match.status === 'aborted' ||
      match.status === 'expired'
    ) {
      const err = 'Game has already ended.';
      socket.emit('move_rejected', { error: err });
      if (typeof cb === 'function') cb({ error: err });
      return;
    }

    const activeTurn = match.chess.turn();
    const isWhite =
      (uid && uid === match.whiteUid) ||
      socket.id === match.whiteSocketId;
    const isBlack =
      (uid && uid === match.blackUid) ||
      socket.id === match.blackSocketId;
    const playerColor = isWhite
      ? 'w'
      : isBlack
        ? 'b'
        : null;

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

    const promo = promotionPiece ?? promotion ?? 'q';
    let moveResult = match.chess.move({
      from: from as any,
      to: to as any,
      promotion: promo,
    });

    if (!moveResult && fen) {
      try {
        const fallbackChess = new Chess(fen);
        moveResult = fallbackChess.move({
          from: from as any,
          to: to as any,
          promotion: promo,
        });
        if (moveResult) match.chess = fallbackChess;
      } catch {}
    }

    if (!moveResult) {
      const err = 'Illegal move sequence detected.';
      socket.emit('move_rejected', { error: err });
      socket.emit('moveRejected', { error: err });
      if (typeof cb === 'function') cb({ error: err });
      return;
    }

    const now = Date.now();
    const elapsed = Math.max(0, (now - match.lastMoveAt) / 1000);

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
      timestamp: now,
    });

    // Update clocks with increment (only after the first move).
    if (match.movesCount > 0) {
      const inc = match.timeControl?.incrementSeconds ?? 0;
      if (activeTurn === 'w') {
        match.whiteSecondsRemaining = Math.max(
          0,
          match.whiteSecondsRemaining - elapsed + inc,
        );
      } else {
        match.blackSecondsRemaining = Math.max(
          0,
          match.blackSecondsRemaining - elapsed + inc,
        );
      }
    }

    match.lastMoveAt = now;
    match.movesCount++;

    if (match.status === 'starting' || match.status === 'waiting') {
      if (match.abortTimer) clearTimeout(match.abortTimer);
      if (match.waitingTimer) clearTimeout(match.waitingTimer);
      match.status = 'active';
      startMatchTimers(
        match,
        (payload) =>
          this.io.to(match.matchId).emit('timerUpdate', payload),
        (payload) =>
          this.io.to(match.matchId).emit('clock_sync', payload),
      );
    }

    const legalMoves = match.chess
      .moves({ verbose: true })
      .map((m) => ({ from: m.from, to: m.to, san: m.san }));

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
        black: match.capturedByBlack,
      },
      lastMove: { from, to },
      check: match.chess.inCheck(),
      checkmate: match.chess.isCheckmate(),
      stalemate: match.chess.isStalemate(),
      legalMoves,
      whiteSecondsRemaining: Math.round(match.whiteSecondsRemaining),
      blackSecondsRemaining: Math.round(match.blackSecondsRemaining),
      moveIndex: match.movesCount,
    };

    this.io.to(match.matchId).emit('moveMade', movePayload);
    this.io.to(match.matchId).emit('move_made', movePayload);
    if (
      match.gameCode &&
      match.gameCode !== match.matchId
    ) {
      this.io.to(match.gameCode).emit('moveMade', movePayload);
      this.io.to(match.gameCode).emit('move_made', movePayload);
    }
    if (typeof cb === 'function')
      cb({ success: true, ...movePayload });

    // Check termination conditions.
    if (match.chess.isCheckmate()) {
      this.finishGameOver(match, 'checkmate', activeTurn);
    } else if (match.chess.isStalemate()) {
      this.finishGameOver(match, 'stalemate', 'draw');
    } else if (match.chess.isDraw()) {
      this.finishGameOver(match, 'draw', 'draw');
    }
  }

  private finishGameOver(
    match: MatchSession,
    reason: string,
    winner: 'w' | 'b' | 'draw' | null,
  ): void {
    const payload = handleGameOver(match, reason, winner);

    this.io.to(match.matchId).emit('gameOver', payload);
    this.io.to(match.matchId).emit('game_over', payload);

    // Defer cleanup so clients have a moment to receive the payload.
    setTimeout(() => this.cleanupMatch(match.matchId), 15000);
  }

  private doAbort(match: MatchSession, triggeredByUid: string): void {
    const { reason, winner } = handleAbort(
      match,
      triggeredByUid,
      (uid, unbanMs) => this.dodgePenalties.set(uid, Date.now() + unbanMs),
    );

    const abortPayload = {
      reason,
      winner,
    };
    this.io.to(match.matchId).emit('match_aborted', abortPayload);
    this.io.to(match.matchId).emit('gameOver', {
      result: 'aborted',
      winner: null,
      ...abortPayload,
    });

    this.cleanupMatch(match.matchId);
  }

  // ---- Queue matching ----

  private processQueue(): void {
    const pools = new Map<string, QueuePlayer[]>();
    for (const player of this.queue.values()) {
      const key = `${player.pool}_${player.rated}`;
      if (!pools.has(key)) pools.set(key, []);
      pools.get(key)!.push(player);
    }

    for (const [, players] of pools.entries()) {
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
          const searchRadius2 = Math.min(
            300,
            50 + Math.floor(waitTime2 / 5) * 100,
          );

          const eloDiff = Math.abs(p1.rating - p2.rating);
          const pingDiff = Math.abs(p1.ping - p2.ping);

          if (
            eloDiff <= searchRadius1 &&
            eloDiff <= searchRadius2 &&
            pingDiff <= 150
          ) {
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

  // ---- Match CRUD (public) ----

  public getMatch(idOrCode?: string): MatchSession | undefined {
    if (!idOrCode) return undefined;
    const clean = idOrCode.trim();
    if (this.activeMatches.has(clean))
      return this.activeMatches.get(clean);

    const cleanUpper = clean.toUpperCase();
    if (this.activeMatches.has(cleanUpper))
      return this.activeMatches.get(cleanUpper);

    const mappedId = this.codeToMatchId.get(cleanUpper);
    if (mappedId && this.activeMatches.has(mappedId))
      return this.activeMatches.get(mappedId);

    for (const match of this.activeMatches.values()) {
      if (
        match.gameCode &&
        match.gameCode.toUpperCase() === cleanUpper
      )
        return match;
      if (
        match.matchId === clean ||
        match.matchId.toUpperCase() === cleanUpper
      )
        return match;
    }
    return undefined;
  }

  public bootstrapMatch(
    id: string,
    data?: any,
  ): MatchSession {
    const sessionData = data?.session;
    const fen =
      data?.fen ??
      sessionData?.fen ??
      'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    const chessInstance = newChessFromFen(fen);

    const tc =
      sessionData?.timeControl ??
      { name: 'Rapid 10 min', initialSeconds: 600, incrementSeconds: 0 };

    const cleanId = id.trim();
    const code =
      sessionData?.code ??
      (cleanId.length <= 8
        ? cleanId.toUpperCase()
        : cleanId.slice(-6).toUpperCase());

    const whiteUid =
      sessionData?.whitePlayer?.uid ?? (data?.uid ?? '');
    const blackUid = sessionData?.blackPlayer?.uid ?? '';

    const newMatch: MatchSession = {
      matchId: cleanId,
      gameCode: code,
      whiteUid,
      blackUid,
      whiteName:
        sessionData?.whitePlayer?.displayName ?? 'White',
      blackName:
        sessionData?.blackPlayer?.displayName ?? 'Black',
      whiteRating:
        sessionData?.whitePlayer?.elo ?? 1200,
      blackRating:
        sessionData?.blackPlayer?.elo ?? 1200,
      pool: 'custom',
      rated: false,
      timeControl: tc,
      status: 'active',
      createdAt: Date.now(),
      lastMoveAt: Date.now(),
      whiteSecondsRemaining:
        sessionData?.whiteSecondsRemaining ?? tc.initialSeconds,
      blackSecondsRemaining:
        sessionData?.blackSecondsRemaining ?? tc.initialSeconds,
      movesCount: chessInstance.history().length,
      movesList: [],
      capturedByWhite: [],
      capturedByBlack: [],
      chess: chessInstance,
      blurCountWhite: 0,
      blurCountBlack: 0,
    };

    this.activeMatches.set(cleanId, newMatch);
    this.activeMatches.set(code, newMatch);
    this.codeToMatchId.set(code, cleanId);

    if (whiteUid) this.userToMatch.set(whiteUid, cleanId);
    if (blackUid) this.userToMatch.set(blackUid, cleanId);

    return newMatch;
  }

  public createCustomRoom(params: {
    hostUid: string;
    hostName?: string;
    hostRating?: number;
    socketId?: string;
    timeControl?: TimeControl;
    side?: 'w' | 'b' | 'random';
    customCode?: string;
  }): { gameId: string; gameCode: string; session: MatchSession } {
    let gameCode = '';
    let isUnique = false;

    if (params.customCode) {
      const val = validateGameCodeFormat(params.customCode);
      if (!val.valid) throw new Error(val.error);
      if (this.codeToMatchId.has(val.cleanCode))
        throw new Error(
          'This game code is already active. Please choose another code.',
        );
      gameCode = val.cleanCode;
    } else {
      for (let i = 0; i < 20; i++) {
        const candidate = generateGameCode();
        if (
          !this.codeToMatchId.has(candidate) &&
          !this.activeMatches.has(candidate)
        ) {
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
    const tc = buildInitialTimeControl(
      params.timeControl?.name ?? 'Rapid 10 min',
      false,
      params.timeControl,
    );

    let hostColor: 'w' | 'b';
    if (params.side === 'b') hostColor = 'b';
    else if (params.side === 'w') hostColor = 'w';
    else hostColor = Math.random() > 0.5 ? 'w' : 'b';

    const session: MatchSession = {
      matchId,
      gameCode,
      whiteUid: hostColor === 'w' ? params.hostUid : '',
      blackUid: hostColor === 'b' ? params.hostUid : '',
      whiteName:
        hostColor === 'w'
          ? params.hostName ?? 'Player 1'
          : undefined,
      blackName:
        hostColor === 'b'
          ? params.hostName ?? 'Player 1'
          : undefined,
      whiteRating:
        hostColor === 'w'
          ? params.hostRating ?? 1200
          : undefined,
      blackRating:
        hostColor === 'b'
          ? params.hostRating ?? 1200
          : undefined,
      whiteSocketId:
        hostColor === 'w' ? params.socketId : undefined,
      blackSocketId:
        hostColor === 'b' ? params.socketId : undefined,
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
      blurCountBlack: 0,
    };

    // 5-minute expiration timer.
    session.waitingTimer = setTimeout(() => {
      if (session.status === 'waiting') {
        session.status = 'expired';
        this.io.to(matchId).emit('gameExpired', {
          gameId: matchId,
          gameCode,
          reason:
            'Opponent did not join within 5 minutes. The game code has expired.',
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
    player: {
      uid: string;
      name?: string;
      rating?: number;
      socketId?: string;
    },
  ): { success: boolean; playerColor: 'w' | 'b'; match: MatchSession } {
    if (!codeOrId)
      throw new Error('Please enter a valid 6-character game code.');

    const cleanInput = codeOrId.trim().toUpperCase();

    if (cleanInput.length === 6) {
      const val = validateGameCodeFormat(cleanInput);
      if (!val.valid) throw new Error(val.error);
    }

    const match = this.getMatch(cleanInput);
    if (!match)
      throw new Error(
        `Match room "${cleanInput}" not found or code has expired.`,
      );

    if (match.status === 'expired')
      throw new Error(
        'This game code has expired (5 minute timeout exceeded).',
      );

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

    if (
      match.whiteUid === player.uid ||
      match.blackUid === player.uid
    )
      throw new Error(
        'You are the host of this room. Waiting for an opponent to join.',
      );

    if (match.waitingTimer) {
      clearTimeout(match.waitingTimer);
      match.waitingTimer = undefined;
    }

    let playerColor: 'w' | 'b';
    if (!match.whiteUid) {
      match.whiteUid = player.uid;
      match.whiteName = player.name ?? 'Player 2';
      match.whiteRating = player.rating ?? 1200;
      match.whiteSocketId = player.socketId;
      playerColor = 'w';
    } else {
      match.blackUid = player.uid;
      match.blackName = player.name ?? 'Player 2';
      match.blackRating = player.rating ?? 1200;
      match.blackSocketId = player.socketId;
      playerColor = 'b';
    }

    match.status = 'starting';
    match.lastMoveAt = Date.now();
    this.userToMatch.set(player.uid, match.matchId);

    match.abortTimer = setTimeout(() => {
      this.doAbort(match, 'system');
    }, 45000);

    const startPayload = {
      gameId: match.matchId,
      matchId: match.matchId,
      gameCode: match.gameCode,
      players: {
        white: {
          uid: match.whiteUid,
          name: match.whiteName,
          rating: match.whiteRating,
        },
        black: {
          uid: match.blackUid,
          name: match.blackName,
          rating: match.blackRating,
        },
      },
      timeControl: match.timeControl,
      fen: match.chess.fen(),
      pgn: match.chess.pgn(),
    };

    this.io.to(match.matchId).emit('gameStarted', startPayload);
    this.io.to(match.matchId).emit('match_found', {
      matchId: match.matchId,
      white: { uid: match.whiteUid, rating: match.whiteRating },
      black: { uid: match.blackUid, rating: match.blackRating },
      pool: match.pool,
      rated: match.rated,
    });

    return { success: true, playerColor, match };
  }

  public getGameState(idOrCode: string): {
    gameId: string;
    gameCode: string;
    fen: string;
    pgn: string;
    turn: 'w' | 'b';
    status: MatchStatus;
    timeControl: TimeControl;
    whitePlayer: { uid: string; displayName: string; rating: number };
    blackPlayer: { uid: string; displayName: string; rating: number };
    whiteSecondsRemaining: number;
    blackSecondsRemaining: number;
    moves: Array<{ from: string; to: string; san: string; piece?: string; captured?: string; timestamp: number }>;
    captured: { white: string[]; black: string[] };
    check: boolean;
    checkmate: boolean;
    stalemate: boolean;
    isDraw: boolean;
  } | null {
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
        displayName: match.whiteName ?? 'White',
        rating: match.whiteRating ?? 1200,
      },
      blackPlayer: {
        uid: match.blackUid,
        displayName: match.blackName ?? 'Black',
        rating: match.blackRating ?? 1200,
      },
      whiteSecondsRemaining: Math.round(match.whiteSecondsRemaining),
      blackSecondsRemaining: Math.round(match.blackSecondsRemaining),
      moves: match.movesList,
      captured: {
        white: match.capturedByWhite,
        black: match.capturedByBlack,
      },
      check: match.chess.inCheck(),
      checkmate: match.chess.isCheckmate(),
      stalemate: match.chess.isStalemate(),
      isDraw: match.chess.isDraw(),
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

  public getGameMoves(idOrCode: string): Array<{ from: string; to: string; san: string; piece?: string; captured?: string; timestamp: number }> | null {
    const match = this.getMatch(idOrCode);
    return match ? match.movesList : null;
  }

  // ---- Queue match creation (private) ----

  private createMatch(p1: QueuePlayer, p2: QueuePlayer): void {
    let p1WhiteScore = p1.recentColors.filter((c) => c === 'w').length;
    let p2WhiteScore = p2.recentColors.filter((c) => c === 'w').length;

    let whitePlayer: QueuePlayer;
    let blackPlayer: QueuePlayer;

    if (p1WhiteScore < p2WhiteScore) {
      whitePlayer = p1;
      blackPlayer = p2;
    } else if (p2WhiteScore < p1WhiteScore) {
      whitePlayer = p2;
      blackPlayer = p1;
    } else {
      const p1LastWhite = p1.recentColors.lastIndexOf('w');
      const p2LastWhite = p2.recentColors.lastIndexOf('w');
      if (p1LastWhite < p2LastWhite) {
        whitePlayer = p1;
        blackPlayer = p2;
      } else {
        whitePlayer =
          Math.random() > 0.5 ? p1 : p2;
        blackPlayer = whitePlayer === p1 ? p2 : p1;
      }
    }

    const matchId = uuidv4();
    const gameCode = generateGameCode();
    const initialSeconds =
      whitePlayer.pool === 'blitz'
        ? 180
        : whitePlayer.pool === 'bullet'
          ? 60
          : 600;

    const initialTc = buildInitialTimeControl(
      whitePlayer.pool,
      whitePlayer.rated,
    );

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
      timeControl: initialTc,
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
      blurCountBlack: 0,
    };

    this.userToMatch.set(whitePlayer.uid, matchId);
    this.userToMatch.set(blackPlayer.uid, matchId);
    this.codeToMatchId.set(gameCode, matchId);

    session.abortTimer = setTimeout(() => {
      this.doAbort(session, 'system');
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
      rated: session.rated,
    };
    this.io.to(matchId).emit('match_found', payload);
    this.io.to(matchId).emit('gameStarted', {
      ...payload,
      players: {
        white: { uid: whitePlayer.uid, rating: whitePlayer.rating },
        black: { uid: blackPlayer.uid, rating: blackPlayer.rating },
      },
      timeControl: session.timeControl,
      fen: session.chess.fen(),
      pgn: session.chess.pgn(),
    });
  }

  // ---- Cleanup ----

  private cleanupMatch(matchId: string): void {
    const match = this.activeMatches.get(matchId);
    if (!match) return;

    stopMatchTimers(match);

    if (match.whiteUid) this.userToMatch.delete(match.whiteUid);
    if (match.blackUid) this.userToMatch.delete(match.blackUid);
    if (match.gameCode) {
      this.codeToMatchId.delete(match.gameCode);
      this.activeMatches.delete(match.gameCode);
    }
    this.activeMatches.delete(matchId);
    this.moveLocks.delete(matchId);
  }
}
