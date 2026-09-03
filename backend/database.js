// FILE: backend/database.js
/**
 * DATABASE MANAGEMENT MODULE
 * PostgreSQL connection pooling, parameterized queries, transaction helpers,
 * and resilient in-memory fallback store when running standalone or in test containers.
 */

import pg from 'pg';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()]
});

const isProduction = process.env.NODE_ENV === 'production';

// Connection configuration
const poolConfig = {
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/chessdb',
  max: 20, // Max concurrent connections in pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: isProduction && !process.env.DATABASE_NO_SSL ? { rejectUnauthorized: false } : false
};

export const pool = new pg.Pool(poolConfig);

let isConnected = false;

// Fallback in-memory database store if PostgreSQL is unreachable in preview environments
export const memoryDb = {
  users: new Map(),
  friendships: new Map(),
  friend_requests: new Map(),
  games: new Map(),
  moves: new Map(),
  tournaments: new Map(),
  tournament_participants: new Map(),
  tournament_pairings: new Map(),
  chat_messages: new Map(),
  game_analysis: new Map(),
  player_stats_history: new Map(),
  achievements: new Map(),
  activity_feed: new Map(),
  player_notes: new Map(),
  notifications: new Map(),
  cheat_flags: new Map()
};

// Test initial connection
pool.connect()
  .then(client => {
    isConnected = true;
    logger.info('Connected to PostgreSQL successfully');
    client.release();
  })
  .catch(err => {
    isConnected = false;
    logger.warn(`PostgreSQL direct connection unavailable (${err.message}). Activating memory fallback layer.`);
  });

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client', err);
});

/**
 * Execute parameterized query with automatic fallback to memory store
 */
export async function query(text, params = []) {
  const start = Date.now();
  if (isConnected) {
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      logger.debug('Executed query', { text: text.slice(0, 80), duration, rows: res.rowCount });
      return res;
    } catch (error) {
      logger.error('Database query error:', { text, error: error.message });
      throw error;
    }
  }

  // Resilient memory mock adapter for preview environments
  return executeMemoryQuery(text, params);
}

/**
 * Transaction helper executing callback within BEGIN ... COMMIT / ROLLBACK
 */
export async function withTransaction(callback) {
  if (!isConnected) {
    return await callback({ query });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Simple in-memory SQL mock parser for common statements when PostgreSQL is offline
 */
function executeMemoryQuery(text, params = []) {
  const sql = text.trim().toUpperCase();

  if (sql.startsWith('SELECT * FROM USERS WHERE EMAIL =') || sql.startsWith('SELECT * FROM USERS WHERE USERNAME =')) {
    const val = params[0];
    for (const u of memoryDb.users.values()) {
      if (u.email === val || u.username === val) {
        return { rows: [{ ...u }], rowCount: 1 };
      }
    }
    return { rows: [], rowCount: 0 };
  }

  if (sql.startsWith('SELECT * FROM USERS WHERE ID =')) {
    const u = memoryDb.users.get(params[0]);
    return { rows: u ? [{ ...u }] : [], rowCount: u ? 1 : 0 };
  }

  if (sql.startsWith('INSERT INTO USERS')) {
    const id = params[0] || `u_${Date.now()}_${Math.floor(Math.random()*1000)}`;
    const user = {
      id,
      username: params[1] || `user_${Date.now()}`,
      email: params[2] || '',
      password_hash: params[3] || '',
      elo_rating: 1200,
      rapid_rating: 1200,
      blitz_rating: 1200,
      bullet_rating: 1200,
      games_played: 0,
      games_won: 0,
      games_drawn: 0,
      games_lost: 0,
      win_streak: 0,
      is_online: true,
      created_at: new Date()
    };
    memoryDb.users.set(id, user);
    return { rows: [{ id, ...user }], rowCount: 1 };
  }

  if (sql.startsWith('SELECT * FROM GAMES WHERE GAME_CODE =')) {
    const code = params[0];
    for (const g of memoryDb.games.values()) {
      if (g.game_code === code) return { rows: [{ ...g }], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  return { rows: [], rowCount: 0 };
}
