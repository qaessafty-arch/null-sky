// FILE: backend/gameEngine.js
/**
 * SERVER-SIDE CHESS ENGINE WRAPPER
 * Authoritative chess rules enforcement, clock timers, increment calculation,
 * repetition detection, PGN generation, state serialization, and concurrency move locks.
 */

import { Chess } from 'chess.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// FIX 3: Concurrency Move Locks map to serialize simultaneous moves per gameId
export const moveLocks = new Map();

/**
 * Execute a move with FIFO queue concurrency locking per gameId
 * Prevents race conditions when two players or requests attempt moves simultaneously
 * @param {string} gameId 
 * @param {Function} moveFn Async move execution function
 * @returns {Promise<any>}
 */
export async function withMoveLock(gameId, moveFn) {
  let lock = moveLocks.get(gameId);
  if (!lock) {
    lock = { locked: false, queue: [] };
    moveLocks.set(gameId, lock);
  }

  return new Promise((resolve, reject) => {
    const executeMove = async () => {
      lock.locked = true;
      try {
        const result = await moveFn();
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        lock.locked = false;
        if (lock.queue.length > 0) {
          const next = lock.queue.shift();
          next();
        } else {
          // Clean up lock entry if queue is empty to avoid memory leaks
          moveLocks.delete(gameId);
        }
      }
    };

    if (lock.locked) {
      lock.queue.push(executeMove);
    } else {
      executeMove();
    }
  });
}

export class ServerChessEngine {
  /**
   * @param {object} options
   */
  constructor({
    initialFen,
    timeControl = '10+0',
    whiteId = null,
    blackId = null,
    rated = true,
    variant = 'standard'
  } = {}) {
    this.chess = new Chess(initialFen || undefined);
    this.variant = variant;
    this.rated = rated;
    this.whiteId = whiteId;
    this.blackId = blackId;
    this.timeControl = timeControl;
    this.isGameOver = false;

    // Parse time controls (e.g. '10+0', '5+3', '3+2', '1+0')
    const [baseMinStr, incSecStr] = (timeControl || '10+0').split('+');
    const baseSeconds = (parseInt(baseMinStr, 10) || 10) * 60;
    this.incrementSeconds = parseInt(incSecStr, 10) || 0;

    this.whiteTime = baseSeconds;
    this.blackTime = baseSeconds;
    this.lastMoveTimestamp = Date.now();

    // Position history for 3-fold repetition detection
    this.fenHistory = [this.chess.fen()];
    this.moveTimes = [];
    this.moveHistory = [];
    this.positionCounts = new Map();
    this.recordPosition();
  }

  recordPosition() {
    // Normalized FEN key: piece placement + turn + castling + en passant square
    const key = this.chess.fen().split(' ').slice(0, 4).join(' ');
    this.positionCounts.set(key, (this.positionCounts.get(key) || 0) + 1);
  }

  isThreefoldRepetition() {
    const key = this.chess.fen().split(' ').slice(0, 4).join(' ');
    return (this.positionCounts.get(key) || 0) >= 3;
  }

  isFiftyMoveRule() {
    // Halfmove clock is 5th token in FEN string
    const tokens = this.chess.fen().split(' ');
    const halfMoves = parseInt(tokens[4], 10) || 0;
    return halfMoves >= 100;
  }

  /**
   * Update clocks based on elapsed time for active color
   * @param {'w'|'b'} turnColor
   */
  updateClock(turnColor) {
    const now = Date.now();
    const elapsedSec = Math.max(0, (now - this.lastMoveTimestamp) / 1000);
    this.lastMoveTimestamp = now;

    if (turnColor === 'w') {
      this.whiteTime = Math.max(0, this.whiteTime - elapsedSec);
    } else {
      this.blackTime = Math.max(0, this.blackTime - elapsedSec);
    }
  }

  /**
   * Execute and validate a player's move server-side
   * @param {object} params
   */
  makeMove({ from, to, promotion = 'q', playerId = null }) {
    if (this.isGameOver) {
      throw new Error('Game is already over. No further moves permitted.');
    }

    const activeTurn = this.chess.turn(); // 'w' or 'b'

    // Verify player identity matches active color
    if (playerId) {
      if (activeTurn === 'w' && this.whiteId && playerId !== this.whiteId) {
        throw new Error('Not your turn: Active turn is White');
      }
      if (activeTurn === 'b' && this.blackId && playerId !== this.blackId) {
        throw new Error('Not your turn: Active turn is Black');
      }
    }

    // Deduct elapsed time from active player
    this.updateClock(activeTurn);

    // Check for timeout
    if ((activeTurn === 'w' && this.whiteTime <= 0) || (activeTurn === 'b' && this.blackTime <= 0)) {
      this.isGameOver = true;
      return {
        success: false,
        timeout: true,
        winner: activeTurn === 'w' ? 'black' : 'white',
        reason: 'timeout'
      };
    }

    // Validate square notation format
    const squareRegex = /^[a-h][1-8]$/;
    if (!squareRegex.test(from) || !squareRegex.test(to)) {
      throw new Error(`Invalid square notation: from="${from}", to="${to}"`);
    }

    const fenBefore = this.chess.fen();
    const moveNumber = Math.floor(this.moveHistory.length / 2) + 1;

    // Execute move on authoritative chess.js instance
    let moveResult;
    try {
      moveResult = this.chess.move({
        from,
        to,
        promotion: (promotion || 'q').toLowerCase()
      });
    } catch (e) {
      throw new Error(`Illegal move: ${from}->${to} (${e.message})`);
    }

    if (!moveResult) {
      throw new Error(`Illegal move: ${from}->${to}`);
    }

    // Add increment to the player who just moved
    if (activeTurn === 'w') {
      this.whiteTime += this.incrementSeconds;
    } else {
      this.blackTime += this.incrementSeconds;
    }

    const fenAfter = this.chess.fen();
    this.fenHistory.push(fenAfter);
    this.recordPosition();

    const elapsedForMoveMs = Math.round(Date.now() - this.lastMoveTimestamp);
    this.moveTimes.push(elapsedForMoveMs);

    const isThreefold = this.isThreefoldRepetition();
    const isFifty = this.isFiftyMoveRule();
    const isCheck = this.chess.inCheck();
    const isCheckmate = this.chess.isCheckmate();
    const isStalemate = this.chess.isStalemate();
    const isInsufficient = this.chess.isInsufficientMaterial();
    const isDraw = isStalemate || isThreefold || isFifty || isInsufficient;

    let gameOver = isCheckmate || isDraw;
    let winner = null;
    let reason = null;

    if (isCheckmate) {
      winner = activeTurn === 'w' ? 'white' : 'black';
      reason = 'checkmate';
      this.isGameOver = true;
    } else if (isStalemate) {
      winner = 'draw';
      reason = 'stalemate';
      this.isGameOver = true;
    } else if (isThreefold) {
      winner = 'draw';
      reason = 'threefold_repetition';
      this.isGameOver = true;
    } else if (isFifty) {
      winner = 'draw';
      reason = 'fifty_move_rule';
      this.isGameOver = true;
    } else if (isInsufficient) {
      winner = 'draw';
      reason = 'insufficient_material';
      this.isGameOver = true;
    }

    const moveRecord = {
      moveNumber,
      fenBefore,
      fenAfter,
      san: moveResult.san,
      from: moveResult.from,
      to: moveResult.to,
      piece: moveResult.piece,
      captured: moveResult.captured || null,
      promotion: moveResult.promotion || null,
      isCheck,
      isCheckmate,
      isCastle: moveResult.flags.includes('k') || moveResult.flags.includes('q'),
      isEnPassant: moveResult.flags.includes('e'),
      elapsedMs: elapsedForMoveMs
    };

    this.moveHistory.push(moveRecord);

    return {
      success: true,
      move: moveResult,
      san: moveResult.san,
      fen: fenAfter,
      turn: this.chess.turn(),
      captured: moveResult.captured || null,
      promotion: moveResult.promotion || null,
      lastMove: { from, to },
      legalMoves: this.chess.moves({ verbose: true }),
      timeWhite: Math.round(this.whiteTime),
      timeBlack: Math.round(this.blackTime),
      moveNumber,
      isCheck,
      isCheckmate,
      isStalemate,
      isDraw,
      isThreefold,
      isFifty,
      isInsufficient,
      gameOver,
      winner,
      reason,
      pgn: this.chess.pgn()
    };
  }

  undo() {
    if (this.isGameOver) return false;
    const move = this.chess.undo();
    if (move) {
      this.fenHistory.pop();
      this.moveHistory.pop();
      if (this.moveTimes.length > 0) this.moveTimes.pop();
      return true;
    }
    return false;
  }

  getState() {
    return {
      fen: this.chess.fen(),
      turn: this.chess.turn(),
      isCheck: this.chess.inCheck(),
      isCheckmate: this.chess.isCheckmate(),
      isDraw: this.chess.isDraw() || this.isThreefoldRepetition() || this.isFiftyMoveRule(),
      timeWhite: Math.round(this.whiteTime),
      timeBlack: Math.round(this.blackTime),
      pgn: this.chess.pgn(),
      totalMoves: this.moveHistory.length,
      history: this.moveHistory,
      isGameOver: this.isGameOver
    };
  }
}
