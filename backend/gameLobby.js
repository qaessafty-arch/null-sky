// FILE: backend/gameLobby.js
/**
 * GAME LOBBY & CODE-BASED MATCHMAKING SERVICE
 * Handles 6-character game code generation, 5-minute expiration timers,
 * Redis caching, cancellation, and two-player synchronization.
 */

import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import Joi from 'joi';
import { GameModel, UserModel } from './models.js';
import { query } from './database.js';
import redis from './redis.js';

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

// Exclude ambiguous characters: 0, O, I, L, 1
export const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/**
 * FIX 1: Generate a truly unique 6-character game code
 * Excludes ambiguous characters (0, O, I, L, 1).
 * Checks both PostgreSQL and Redis, and uses an atomic reservation lock.
 * @returns {Promise<string>} Unique 6-character game code
 */
export async function generateGameCode() {
  let code = '';
  let attempts = 0;
  let exists = true;

  while (exists && attempts < 15) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }

    try {
      // 1. Check Redis cache
      const redisExists = await redis.get(`game_code:${code}`);
      if (redisExists) {
        attempts++;
        continue;
      }

      // 2. Check Redis reservation lock (atomic NX to prevent race conditions)
      const lockKey = `game_code_lock:${code}`;
      const reserved = await redis.set(lockKey, '1', 'EX', 15);
      if (!reserved) {
        attempts++;
        continue;
      }

      // 3. Check PostgreSQL database
      const dbExists = await query('SELECT id FROM games WHERE game_code = $1', [code]);
      if (dbExists.rows.length > 0) {
        await redis.del(lockKey);
        attempts++;
        continue;
      }

      exists = false;
    } catch (err) {
      logger.warn('Code uniqueness check fallback', { error: err.message });
      exists = false;
    }
  }

  if (attempts >= 15 || !code) {
    throw new Error('Failed to generate a unique game code. Please try again.');
  }

  return code;
}

/**
 * Validates a game code input string format before performing queries.
 * @param {string} code 
 * @returns {string} Cleaned uppercase 6-character code
 */
export function validateGameCodeInput(code) {
  if (!code || typeof code !== 'string') {
    throw new Error('Game code is required.');
  }

  const clean = code.trim().toUpperCase();
  if (clean.length !== 6) {
    throw new Error('Game code must be exactly 6 characters.');
  }

  const codeRegex = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;
  if (!codeRegex.test(clean)) {
    throw new Error('Invalid game code format. Code contains ambiguous or illegal characters.');
  }

  return clean;
}

/**
 * FIX 2: Synchronize and recover game state between Redis and PostgreSQL
 * @param {string} gameId
 * @returns {Promise<object>}
 */
export async function syncGameState(gameId) {
  try {
    // 1. Try fetching from Redis first
    let game = await redis.getJson(`game:${gameId}`);

    if (!game) {
      // 2. Fallback to PostgreSQL
      const dbRes = await query('SELECT * FROM games WHERE id = $1', [gameId]);
      if (dbRes.rows.length > 0) {
        const raw = dbRes.rows[0];
        game = {
          gameId: raw.id,
          gameCode: raw.game_code,
          whitePlayerId: raw.white_player_id,
          blackPlayerId: raw.black_player_id,
          timeControl: raw.time_control,
          rated: raw.rated,
          variant: raw.variant,
          status: raw.status,
          pgn: raw.pgn,
          winner: raw.winner,
          result: raw.result,
          initialFen: raw.initial_fen,
          fenHistory: raw.fen_history,
          moveTimes: raw.move_times,
          totalMoves: raw.total_moves,
          expiresAt: raw.expires_at
        };

        // Restore to Redis with 2-hour TTL for active games
        const ttl = game.status === 'active' ? 7200 : 300;
        await redis.setJson(`game:${gameId}`, game, ttl);
        logger.info(`Game state for ${gameId} synchronized from PostgreSQL to Redis`);
      } else {
        throw new Error('Game not found');
      }
    }

    return game;
  } catch (error) {
    logger.error(`Failed to sync game ${gameId}:`, { error: error.message });
    throw error;
  }
}

export class GameLobbyService {
  /**
   * @param {import('socket.io').Server} io
   */
  constructor(io) {
    this.io = io;
    // Map of gameId -> timeout handle
    this.expirationTimers = new Map();
  }

  /**
   * Player 1 creates a game with unique 6-character code
   * @param {object} params
   */
  async createGame({ creatorId, creatorUsername, timeControl = '10+0', rated = true, variant = 'standard', colorPreference = 'white', visibility = 'public' }) {
    // Input validation with Joi
    const schema = Joi.object({
      creatorId: Joi.string().required(),
      creatorUsername: Joi.string().max(32).required(),
      timeControl: Joi.string().pattern(/^\d{1,2}\+\d{1,2}$/).default('10+0'),
      rated: Joi.boolean().default(true),
      variant: Joi.string().valid('standard', 'chess960').default('standard'),
      colorPreference: Joi.string().valid('white', 'black', 'random').default('white'),
      visibility: Joi.string().valid('public', 'private').default('public')
    });

    const { error, value } = schema.validate({ creatorId, creatorUsername, timeControl, rated, variant, colorPreference, visibility });
    if (error) {
      throw new Error(`Invalid game creation parameters: ${error.details[0].message}`);
    }

    // Edge Case: Check if user is banned
    const creatorUser = await UserModel.findById(value.creatorId);
    if (creatorUser && creatorUser.is_banned) {
      throw new Error('Account suspended: You cannot create games while banned.');
    }

    // Edge Case: Check if user already has an active ongoing game
    if (creatorUser && creatorUser.current_game_id) {
      const activeGameCheck = await query('SELECT status FROM games WHERE id = $1', [creatorUser.current_game_id]);
      if (activeGameCheck.rows.length > 0 && activeGameCheck.rows[0].status === 'active') {
        throw new Error('You are already in an active game. Please finish or resign your current match first.');
      }
    }

    const gameCode = await generateGameCode();

    let whiteId = null;
    let blackId = null;
    if (value.colorPreference === 'white') {
      whiteId = value.creatorId;
    } else if (value.colorPreference === 'black') {
      blackId = value.creatorId;
    } else {
      if (Math.random() > 0.5) whiteId = value.creatorId;
      else blackId = value.creatorId;
    }

    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // 1. Store in PostgreSQL
    const game = await GameModel.create({
      gameCode,
      whitePlayerId: whiteId,
      blackPlayerId: blackId,
      timeControl: value.timeControl,
      rated: value.rated,
      variant: value.variant,
      status: 'waiting',
      expiresAt
    });

    const gameData = {
      gameId: game.id,
      gameCode,
      creatorId: value.creatorId,
      creatorUsername: value.creatorUsername,
      whitePlayerId: whiteId,
      blackPlayerId: blackId,
      timeControl: value.timeControl,
      rated: value.rated,
      variant: value.variant,
      status: 'waiting',
      colorPreference: value.colorPreference,
      visibility: value.visibility,
      expiresAt,
      createdAt: new Date().toISOString()
    };

    // 2. Store in Redis with TTL 5 minutes (300 seconds)
    await redis.setJson(`game_code:${gameCode}`, gameData, 300);
    await redis.setJson(`waiting_game:${game.id}`, gameData, 300);
    await redis.setJson(`game:${game.id}`, gameData, 300);

    // Release reservation lock now that primary keys are set
    await redis.del(`game_code_lock:${gameCode}`);

    // Update creator's current_game_id
    await query('UPDATE users SET current_game_id = $1 WHERE id = $2', [game.id, value.creatorId]);

    // 3. Start 5-minute expiration timer
    const timer = setTimeout(async () => {
      await this.expireGame(game.id, gameCode);
    }, 5 * 60 * 1000);

    this.expirationTimers.set(game.id, timer);
    logger.info(`Game waiting room created with code ${gameCode}`, { gameId: game.id, creatorId: value.creatorId });

    return {
      gameId: game.id,
      gameCode,
      visibility: value.visibility,
      expiresAt,
      color: whiteId === value.creatorId ? 'white' : (blackId === value.creatorId ? 'black' : 'random')
    };
  }

  /**
   * Player 2 joins game using 6-character code
   * @param {object} params
   */
  async joinGame({ gameCode, joinerId, joinerUsername }) {
    const formattedCode = validateGameCodeInput(gameCode);

    // Concurrency Lock: Prevent two users joining the same code simultaneously
    const joinLockKey = `join_lock:${formattedCode}`;
    const acquiredLock = await redis.set(joinLockKey, '1', 'EX', 5);
    if (!acquiredLock) {
      throw new Error('Another player is currently joining this game room. Please try again.');
    }

    try {
      // Check if joiner is banned
      const joinerUser = await UserModel.findById(joinerId);
      if (joinerUser && joinerUser.is_banned) {
        throw new Error('Account suspended: You cannot join games while banned.');
      }

      // Check if joiner already in active game
      if (joinerUser && joinerUser.current_game_id) {
        const activeCheck = await query('SELECT status FROM games WHERE id = $1', [joinerUser.current_game_id]);
        if (activeCheck.rows.length > 0 && activeCheck.rows[0].status === 'active') {
          throw new Error('You are already in an active game. Please complete your current match first.');
        }
      }

      // 1. Fetch from Redis or Database
      let gameData = await redis.getJson(`game_code:${formattedCode}`);
      if (!gameData) {
        const dbGame = await GameModel.findByCode(formattedCode);
        if (dbGame) {
          gameData = {
            gameId: dbGame.id,
            gameCode: dbGame.game_code,
            creatorId: dbGame.white_player_id || dbGame.black_player_id,
            whitePlayerId: dbGame.white_player_id,
            blackPlayerId: dbGame.black_player_id,
            timeControl: dbGame.time_control,
            rated: dbGame.rated,
            variant: dbGame.variant,
            status: dbGame.status,
            expiresAt: dbGame.expires_at
          };
        }
      }

      if (!gameData) {
        throw new Error('Game not found. Please verify the 6-character code.');
      }

      // Edge Case: Host cannot join their own game as opponent
      if (gameData.creatorId === joinerId || gameData.whitePlayerId === joinerId || gameData.blackPlayerId === joinerId) {
        throw new Error('You are the host of this room. Waiting for an opponent to join.');
      }

      if (gameData.status === 'expired') {
        throw new Error('This game code has expired (5 minute timeout exceeded).');
      }

      if (gameData.status !== 'waiting') {
        throw new Error('Game is already active or has ended.');
      }

      // Check expiration timestamp
      if (gameData.expiresAt && new Date(gameData.expiresAt).getTime() < Date.now()) {
        await this.expireGame(gameData.gameId, formattedCode);
        throw new Error('This game code has expired.');
      }

      // 2. Assign Color for Player 2
      let joinerColor = 'black';
      if (!gameData.whitePlayerId) {
        gameData.whitePlayerId = joinerId;
        joinerColor = 'white';
      } else if (!gameData.blackPlayerId) {
        gameData.blackPlayerId = joinerId;
        joinerColor = 'black';
      }

      // 3. Clear expiration timer
      if (this.expirationTimers.has(gameData.gameId)) {
        clearTimeout(this.expirationTimers.get(gameData.gameId));
        this.expirationTimers.delete(gameData.gameId);
      }

      // 4. Update status to active
      gameData.status = 'active';
      await GameModel.updateState(gameData.gameId, {
        status: 'active',
        whitePlayerId: gameData.whitePlayerId,
        blackPlayerId: gameData.blackPlayerId
      });

      // Update joiner's current_game_id
      await query('UPDATE users SET current_game_id = $1 WHERE id = $2', [gameData.gameId, joinerId]);

      // Update Redis with extended TTL (2 hours for active play)
      await redis.setJson(`game:${gameData.gameId}`, gameData, 7200);
      await redis.setJson(`game_code:${formattedCode}`, gameData, 7200);
      await redis.del(`waiting_game:${gameData.gameId}`);

      logger.info(`Player ${joinerUsername} (${joinerId}) joined game ${gameData.gameId} via code ${formattedCode}`);

      return {
        gameId: gameData.gameId,
        gameCode: formattedCode,
        color: joinerColor,
        timeControl: gameData.timeControl,
        variant: gameData.variant || 'standard',
        rated: gameData.rated ?? true,
        whitePlayerId: gameData.whitePlayerId,
        blackPlayerId: gameData.blackPlayerId,
        opponent: {
          id: joinerColor === 'white' ? gameData.blackPlayerId : gameData.whitePlayerId,
          username: gameData.creatorUsername || 'Opponent'
        }
      };
    } finally {
      await redis.del(joinLockKey);
    }
  }

  /**
   * Cancel waiting game
   */
  async cancelGame(gameId, requestingUserId) {
    if (this.expirationTimers.has(gameId)) {
      clearTimeout(this.expirationTimers.get(gameId));
      this.expirationTimers.delete(gameId);
    }

    const waiting = await redis.getJson(`waiting_game:${gameId}`) || await redis.getJson(`game:${gameId}`);
    const code = waiting?.gameCode;
    if (code) {
      await redis.del(`game_code:${code}`);
      await redis.del(`game_code_lock:${code}`);
    }
    await redis.del(`waiting_game:${gameId}`);
    await redis.del(`game:${gameId}`);

    await GameModel.updateState(gameId, { status: 'cancelled' });
    if (requestingUserId) {
      await query('UPDATE users SET current_game_id = NULL WHERE id = $1', [requestingUserId]);
    }

    if (this.io) {
      this.io.to(`game:${gameId}`).emit('gameCancelled', {
        gameId,
        reason: 'Game was cancelled by the host.'
      });
    }

    logger.info(`Game waiting room ${gameId} cancelled by user ${requestingUserId}`);
    return { success: true };
  }

  /**
   * Automatic 5-minute expiration
   */
  async expireGame(gameId, gameCode) {
    this.expirationTimers.delete(gameId);

    await redis.del(`game_code:${gameCode}`);
    await redis.del(`game_code_lock:${gameCode}`);
    await redis.del(`waiting_game:${gameId}`);
    await redis.del(`game:${gameId}`);

    await GameModel.updateState(gameId, { status: 'expired' });
    await query('UPDATE users SET current_game_id = NULL WHERE current_game_id = $1', [gameId]);

    if (this.io) {
      this.io.to(`game:${gameId}`).emit('gameExpired', {
        gameId,
        reason: 'Opponent did not join within 5 minutes. The game code has expired.'
      });
    }

    logger.info(`Game waiting room ${gameId} expired after 5 minutes`);
  }
}
