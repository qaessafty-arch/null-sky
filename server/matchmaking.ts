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

interface QueuePlayer {
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

interface MatchSession {
  matchId: string;
  whiteUid: string;
  blackUid: string;
  pool: string;
  rated: boolean;
  status: 'starting' | 'active' | 'completed' | 'aborted';
  createdAt: number;
  timerStartedAt: number | null;
  movesCount: number;
  abortTimer?: NodeJS.Timeout;
  chess: Chess;
  blurCountWhite: number;
  blurCountBlack: number;
}

export class MatchmakingEngine {
  private io: Server;
  private queue: Map<string, QueuePlayer> = new Map();
  private activeMatches: Map<string, MatchSession> = new Map();
  private dodgePenalties: Map<string, number> = new Map(); // uid -> unban timestamp

  constructor(io: Server) {
    this.io = io;
    
    // Process queue every 2 seconds
    setInterval(() => this.processQueue(), 2000);
    
    this.io.on('connection', (socket: Socket) => {
      socket.on('ping', (cb) => {
        if (typeof cb === 'function') cb(Date.now());
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
          pool,
          rated,
          recentColors: recentColors || [],
          joinedAt: Date.now()
        });

        socket.emit('queue_joined', { pool, status: 'searching' });
      });

      socket.on('leave_queue', (data) => {
        if (data?.uid) this.queue.delete(data.uid);
      });

      socket.on('make_move', (data) => {
        const { matchId, uid, from, to, promotion } = data;
        const match = this.activeMatches.get(matchId);
        if (!match) return;

        // Authoritative Server Move Validation
        try {
          const activeTurn = match.chess.turn();
          const playerColor = uid === match.whiteUid ? 'w' : (uid === match.blackUid ? 'b' : null);
          
          if (playerColor !== activeTurn) {
             socket.emit('move_rejected', { error: 'Not your turn or invalid player.' });
             return;
          }

          const moveResult = match.chess.move({
             from,
             to,
             promotion: promotion || 'q'
          });

          if (!moveResult) {
             socket.emit('move_rejected', { error: 'Illegal move.' });
             return;
          }

          // Cancel the abort timer if this is the first move (White's move)
          if (match.movesCount === 0 && match.whiteUid === uid) {
            if (match.abortTimer) clearTimeout(match.abortTimer);
            match.status = 'active';
          }
          match.movesCount++;
          
          // Broadcast to room
          socket.to(matchId).emit('move_made', {
             ...data,
             fen: match.chess.fen(),
             san: moveResult.san
          });

          // Check for game end
          if (match.chess.isGameOver()) {
             match.status = 'completed';
             this.io.to(matchId).emit('game_over', {
                reason: match.chess.isCheckmate() ? 'checkmate' : 'draw',
                winner: match.chess.isCheckmate() ? playerColor : null
             });
             this.activeMatches.delete(matchId);
          }

        } catch (e) {
          socket.emit('move_rejected', { error: 'Invalid move payload.' });
        }
      });

      socket.on('tab_blur', (data) => {
         const { matchId, uid } = data;
         const match = this.activeMatches.get(matchId);
         if (!match || !match.rated) return;

         if (uid === match.whiteUid) {
            match.blurCountWhite++;
            console.log(`[Anti-Cheat] Player ${uid} (White) tab blur detected. Count: ${match.blurCountWhite}`);
         } else if (uid === match.blackUid) {
            match.blurCountBlack++;
            console.log(`[Anti-Cheat] Player ${uid} (Black) tab blur detected. Count: ${match.blurCountBlack}`);
         }
      });

      socket.on('abort_match', (data) => {
        const { matchId, uid } = data;
        const match = this.activeMatches.get(matchId);
        if (match) {
          this.handleAbort(match, uid);
        }
      });

      socket.on('disconnect', () => {
        // Find if player was in queue and remove
        for (const [uid, player] of this.queue.entries()) {
          if (player.socketId === socket.id) {
            this.queue.delete(uid);
          }
        }
        // Handle disconnect in active games
      });
    });
  }

  private processQueue() {
    const pools = new Map<string, QueuePlayer[]>();
    for (const player of this.queue.values()) {
      const key = `${player.pool}_${player.rated}`;
      if (!pools.has(key)) pools.set(key, []);
      pools.get(key)!.push(player);
    }

    for (const [poolKey, players] of pools.entries()) {
      // Sort by waiting time descending
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
            // MATCH FOUND
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

  private createMatch(p1: QueuePlayer, p2: QueuePlayer) {
    // 1. Color allocation
    let p1WhiteScore = p1.recentColors.filter(c => c === 'w').length;
    let p2WhiteScore = p2.recentColors.filter(c => c === 'w').length;

    let whitePlayer: QueuePlayer;
    let blackPlayer: QueuePlayer;

    if (p1WhiteScore < p2WhiteScore) {
      whitePlayer = p1; blackPlayer = p2;
    } else if (p2WhiteScore < p1WhiteScore) {
      whitePlayer = p2; blackPlayer = p1;
    } else {
      // Tie breaker based on least recent white
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
    const session: MatchSession = {
      matchId,
      whiteUid: whitePlayer.uid,
      blackUid: blackPlayer.uid,
      pool: whitePlayer.pool,
      rated: whitePlayer.rated,
      status: 'starting',
      createdAt: Date.now(),
      timerStartedAt: Date.now(),
      movesCount: 0,
      chess: new Chess(),
      blurCountWhite: 0,
      blurCountBlack: 0
    };

    // 2. 30-Second First Move Abort Timer
    session.abortTimer = setTimeout(() => {
      this.handleAbort(session, 'system');
    }, 30000);

    this.activeMatches.set(matchId, session);

    // Join socket rooms
    const sWhite = this.io.sockets.sockets.get(whitePlayer.socketId);
    const sBlack = this.io.sockets.sockets.get(blackPlayer.socketId);
    if (sWhite) sWhite.join(matchId);
    if (sBlack) sBlack.join(matchId);

    // Notify clients
    this.io.to(matchId).emit('match_found', {
      matchId,
      white: { uid: whitePlayer.uid, rating: whitePlayer.rating },
      black: { uid: blackPlayer.uid, rating: blackPlayer.rating },
      pool: session.pool,
      rated: session.rated
    });
  }

  private handleAbort(session: MatchSession, triggeredByUid: string) {
    if (session.status !== 'starting') return;
    session.status = 'aborted';
    if (session.abortTimer) clearTimeout(session.abortTimer);

    // If a player specifically aborted/dodged, add penalty
    if (triggeredByUid === session.whiteUid || triggeredByUid === 'system') {
      const pUid = triggeredByUid === 'system' ? session.whiteUid : triggeredByUid;
      this.dodgePenalties.set(pUid, Date.now() + 5 * 60 * 1000); // 5 minute ban
    }

    this.io.to(session.matchId).emit('match_aborted', {
      reason: triggeredByUid === 'system' ? 'White failed to make the first move in 30 seconds.' : 'Opponent aborted the match.'
    });

    this.activeMatches.delete(session.matchId);
  }
}
