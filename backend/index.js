/**
 * PRODUCTION MULTIPLAYER CHESS PLATFORM BACKEND
 * Technology Stack: Node.js + Express + Socket.IO + Redis + PostgreSQL + chess.js
 */

import http from 'http';
import express from 'express';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Joi from 'joi';
import pg from 'pg';
import Redis from 'ioredis';
import { Chess } from 'chess.js';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';
import dotenv from 'dotenv';
import { registerUser, loginUser, logoutUser, socketAuthMiddleware } from './auth.js';
import apiRouter from './routes.js';
import { AntiCheatService } from './antiCheat.js';
import { SocialService } from './social.js';
import { TournamentEngine } from './tournament.js';
import { AnalysisQueueService } from './bullQueue.js';

dotenv.config();

// ==========================================
// 1. CONFIGURATION & LOGGER SETUP
// ==========================================
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_chess_key_2026';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_jwt_chess_key_2026';
const DATABASE_URL = process.env.DATABASE_URL || 'postgres://chess_user:chess_secure_pass_2026@localhost:5432/chess_db';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

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

// ==========================================
// 2. DATABASE & REDIS CLIENTS
// ==========================================
const { Pool } = pg;
const db = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

db.on('error', (err) => {
  logger.error('Unexpected database client error', { error: err.message });
});

let redis;
try {
  redis = new Redis(REDIS_URL, {
    retryStrategy: (times) => Math.min(times * 50, 2000),
    maxRetriesPerRequest: 3
  });
  redis.on('connect', () => logger.info('Connected to Redis server'));
  redis.on('error', (err) => logger.warn('Redis error (falling back to memory)', { error: err.message }));
} catch (e) {
  logger.warn('Failed to initialize Redis, using in-memory mock fallback');
}

// In-memory cache fallback if Redis is unreachable
const memoryStore = new Map();
const memoryExpiry = new Map();

const cacheGet = async (key) => {
  try {
    if (redis && redis.status === 'ready') return await redis.get(key);
  } catch {}
  if (memoryExpiry.has(key) && Date.now() > memoryExpiry.get(key)) {
    memoryStore.delete(key);
    memoryExpiry.delete(key);
    return null;
  }
  return memoryStore.get(key) || null;
};

const cacheSet = async (key, val, ttlSeconds = 300) => {
  try {
    if (redis && redis.status === 'ready') return await redis.set(key, val, 'EX', ttlSeconds);
  } catch {}
  memoryStore.set(key, val);
  memoryExpiry.set(key, Date.now() + ttlSeconds * 1000);
};

const cacheDel = async (key) => {
  try {
    if (redis && redis.status === 'ready') return await redis.del(key);
  } catch {}
  memoryStore.delete(key);
  memoryExpiry.delete(key);
};

// ==========================================
// 3. EXPRESS APP & MIDDLEWARE
// ==========================================
const app = express();
const server = http.createServer(app);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*',
  credentials: true
}));
app.use(express.json());

// Rate Limiting: 100 requests per minute per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' }
});
app.use('/api/', apiLimiter);

// Prometheus / Metrics Endpoint
let activeConnectionsCount = 0;
let totalMovesProcessed = 0;
app.get('/metrics', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(`
# HELP chess_active_connections Current active WebSocket connections
# TYPE chess_active_connections gauge
chess_active_connections ${activeConnectionsCount}

# HELP chess_moves_total Total chess moves processed
# TYPE chess_moves_total counter
chess_moves_total ${totalMovesProcessed}

# HELP chess_uptime_seconds Server uptime in seconds
# TYPE chess_uptime_seconds gauge
chess_uptime_seconds ${Math.floor(process.uptime())}
  `.trim());
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    activeSockets: activeConnectionsCount,
    timestamp: new Date().toISOString()
  });
});

// ==========================================
// 4. AUTHENTICATION & JWT UTILITIES
// ==========================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// 6-Character Game Code Generator (No ambiguous characters: 0/O, 1/I)
const CODE_CHARS = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export function generateGameCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length));
  }
  return code;
}

// Time control parser: e.g., '10+0' -> { initial: 600, increment: 0 }
export function parseTimeControl(tc) {
  if (!tc || typeof tc !== 'string') return { initialSeconds: 600, incrementSeconds: 0 };
  const parts = tc.split('+');
  const mins = parseInt(parts[0], 10) || 10;
  const inc = parseInt(parts[1], 10) || 0;
  return {
    initialSeconds: mins * 60,
    incrementSeconds: inc
  };
}

// Standard ELO Calculation (K = 32)
export function calculateNewRatings(whiteRating, blackRating, scoreWhite) {
  const K = 32;
  const expectedWhite = 1 / (1 + Math.pow(10, (blackRating - whiteRating) / 400));
  const expectedBlack = 1 - expectedWhite;
  const scoreBlack = 1 - scoreWhite;

  const newWhite = Math.round(whiteRating + K * (scoreWhite - expectedWhite));
  const newBlack = Math.round(blackRating + K * (scoreBlack - expectedBlack));

  return {
    newWhiteRating: Math.max(100, newWhite),
    newBlackRating: Math.max(100, newBlack),
    whiteDelta: newWhite - whiteRating,
    blackDelta: newBlack - blackRating
  };
}

// ==========================================
// 5. REST API ROUTES
// ==========================================

// Register
app.post('/api/auth/register', async (req, res) => {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    countryCode: Joi.string().max(3).default('US')
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const passwordHash = await bcrypt.hash(value.password, 12);
    const result = await db.query(
      `INSERT INTO users (username, email, password_hash, country_code)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, elo_rating, country_code, created_at`,
      [value.username, value.email, passwordHash, value.countryCode]
    );

    const user = result.rows[0];
    const accessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    logger.error('Registration error', { error: err.message });
    res.status(500).json({ error: 'Failed to create user account' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const schema = Joi.object({
    emailOrUsername: Joi.string().required(),
    password: Joi.string().required()
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.details[0].message });

  try {
    const result = await db.query(
      `SELECT * FROM users WHERE email = $1 OR username = $1`,
      [value.emailOrUsername]
    );

    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(value.password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.is_banned && user.banned_until && new Date() < new Date(user.banned_until)) {
      return res.status(403).json({ error: `Account suspended until ${user.banned_until}` });
    }

    const accessToken = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    // Store refresh token in Redis (7 days TTL: 604800s)
    await cacheSet(`refresh:${user.id}`, refreshToken, 604800);

    await db.query('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    delete user.password_hash;
    res.json({ user, accessToken, refreshToken });
  } catch (err) {
    logger.error('Login error', { error: err.message });
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Logout - Invalidate refresh token in Redis
app.post('/api/auth/logout', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded?.id || decoded?.userId) {
          await cacheDel(`refresh:${decoded.id || decoded.userId}`);
        }
      } catch {}
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.json({ message: 'Logged out successfully' });
  }
});

// Current User Profile
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, username, email, elo_rating, games_played, games_won, games_drawn, country_code, avatar_url, created_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Get User Profile
app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, username, elo_rating, games_played, games_won, games_drawn, country_code, avatar_url, created_at
       FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Update User Profile
app.put('/api/users/:id', authenticateToken, async (req, res) => {
  if (req.user.id !== req.params.id) {
    return res.status(403).json({ error: 'Unauthorized to modify this profile' });
  }

  const { countryCode, avatarUrl } = req.body;
  try {
    const result = await db.query(
      `UPDATE users
       SET country_code = COALESCE($1, country_code),
           avatar_url = COALESCE($2, avatar_url),
           last_active = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, username, elo_rating, country_code, avatar_url`,
      [countryCode, avatarUrl, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Leaderboard: Top players by ELO
app.get('/api/leaderboard', async (req, res) => {
  try {
    const cached = await cacheGet('leaderboard:top100');
    if (cached) return res.json(JSON.parse(cached));

    const result = await db.query(
      `SELECT id, username, elo_rating, games_played, games_won, games_drawn, country_code, avatar_url
       FROM users
       WHERE is_banned = FALSE
       ORDER BY elo_rating DESC
       LIMIT 100`
    );
    await cacheSet('leaderboard:top100', JSON.stringify(result.rows), 60);
    res.json(result.rows);
  } catch (err) {
    logger.error('Leaderboard error', { error: err.message });
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// List Available Public Games
app.get('/api/games/available', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT g.id, g.game_code, g.time_control, g.rated, g.variant, g.created_at,
              u.username AS white_username, u.elo_rating AS white_rating
       FROM games g
       LEFT JOIN users u ON g.white_player_id = u.id
       WHERE g.status = 'waiting'
       ORDER BY g.created_at DESC
       LIMIT 20`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch available games' });
  }
});

// Get Game Details
app.get('/api/games/:id', async (req, res) => {
  try {
    // Check Redis active game cache first
    const cached = await cacheGet(`game:${req.params.id}`);
    if (cached) return res.json(JSON.parse(cached));

    const result = await db.query(`SELECT * FROM games WHERE id = $1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Game not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve game' });
  }
});

// Get Game PGN
app.get('/api/games/:id/pgn', async (req, res) => {
  try {
    const result = await db.query(`SELECT pgn, game_code FROM games WHERE id = $1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Game not found' });
    res.setHeader('Content-Type', 'application/x-chess-pgn');
    res.setHeader('Content-Disposition', `attachment; filename="game_${result.rows[0].game_code}.pgn"`);
    res.send(result.rows[0].pgn || '');
  } catch (err) {
    res.status(500).json({ error: 'Failed to download PGN' });
  }
});

// Get Game Current FEN
app.get('/api/games/:id/fen', async (req, res) => {
  try {
    const cached = await cacheGet(`game:${req.params.id}`);
    if (cached) {
      const g = JSON.parse(cached);
      return res.json({ fen: g.fen });
    }
    const result = await db.query(`SELECT fen_history FROM games WHERE id = $1`, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Game not found' });
    const history = result.rows[0].fen_history;
    const currentFen = Array.isArray(history) && history.length > 0
      ? history[history.length - 1]
      : 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
    res.json({ fen: currentFen });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve FEN' });
  }
});

// Create Game via REST API
app.post('/api/games', authenticateToken, async (req, res) => {
  const { timeControl = '10+0', rated = true, variant = 'standard', colorPreference = 'white' } = req.body;
  const gameCode = generateGameCode();
  const whiteId = colorPreference === 'black' ? null : req.user.id;
  const blackId = colorPreference === 'black' ? req.user.id : null;

  try {
    const result = await db.query(
      `INSERT INTO games (game_code, white_player_id, black_player_id, time_control, rated, variant, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'waiting')
       RETURNING *`,
      [gameCode, whiteId, blackId, timeControl, rated, variant]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create game' });
  }
});

// Join Game via REST API
app.post('/api/games/:id/join', authenticateToken, async (req, res) => {
  try {
    const gameRes = await db.query(`SELECT * FROM games WHERE id = $1 AND status = 'waiting'`, [req.params.id]);
    const game = gameRes.rows[0];
    if (!game) return res.status(404).json({ error: 'Game not open for joining' });

    let updateQuery;
    let params;
    if (!game.white_player_id && game.black_player_id !== req.user.id) {
      updateQuery = `UPDATE games SET white_player_id = $1, status = 'active', start_time = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`;
      params = [req.user.id, game.id];
    } else if (!game.black_player_id && game.white_player_id !== req.user.id) {
      updateQuery = `UPDATE games SET black_player_id = $1, status = 'active', start_time = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`;
      params = [req.user.id, game.id];
    } else {
      return res.status(400).json({ error: 'Cannot join own game or game is already full' });
    }

    const updated = await db.query(updateQuery, params);
    res.json(updated.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to join game' });
  }
});

// Tournament Endpoints
app.get('/api/tournaments', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, u.username AS creator_name, COUNT(p.user_id) as participant_count
       FROM tournaments t
       LEFT JOIN users u ON t.created_by = u.id
       LEFT JOIN tournament_participants p ON t.id = p.tournament_id
       GROUP BY t.id, u.username
       ORDER BY t.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve tournaments' });
  }
});

app.post('/api/tournaments', authenticateToken, async (req, res) => {
  const { name, type = 'swiss', maxPlayers = 16, timeControl = '5+3', prizePool = 0 } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO tournaments (name, type, max_players, time_control, prize_pool, created_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING *`,
      [name, type, maxPlayers, timeControl, prizePool, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create tournament' });
  }
});

app.post('/api/tournaments/:id/join', authenticateToken, async (req, res) => {
  try {
    await db.query(
      `INSERT INTO tournament_participants (tournament_id, user_id, score, tiebreak_score)
       VALUES ($1, $2, 0.0, 0.0)
       ON CONFLICT DO NOTHING`,
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Joined tournament successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to register for tournament' });
  }
});

app.get('/api/tournaments/:id', async (req, res) => {
  try {
    const tourneyRes = await db.query(`SELECT * FROM tournaments WHERE id = $1`, [req.params.id]);
    if (!tourneyRes.rows[0]) return res.status(404).json({ error: 'Tournament not found' });

    const participants = await db.query(
      `SELECT p.*, u.username, u.elo_rating, u.country_code
       FROM tournament_participants p
       JOIN users u ON p.user_id = u.id
       WHERE p.tournament_id = $1
       ORDER BY p.score DESC, p.tiebreak_score DESC`,
      [req.params.id]
    );

    res.json({
      tournament: tourneyRes.rows[0],
      participants: participants.rows
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tournament' });
  }
});

// ==========================================
// 6. REAL-TIME ENGINE & SOCKET.IO EVENTS
// ==========================================
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingInterval: 10000,
  pingTimeout: 5000
});

// Modular Services Integration
const antiCheatService = new AntiCheatService(redis, io);
const socialService = new SocialService(io);
const tournamentEngine = new TournamentEngine(io);
const analysisQueue = new AnalysisQueueService(redis, antiCheatService);

app.locals.redis = redis;
app.locals.antiCheatService = antiCheatService;
app.locals.socialService = socialService;
app.locals.tournamentEngine = tournamentEngine;
app.locals.analysisQueue = analysisQueue;

// Mount extended REST API routes
app.use(apiRouter);

// BACKEND: Socket.IO middleware - authenticate on connection
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    // Allow guest / preview connections
    return next();
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    socket.userId = decoded.userId || decoded.id;
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Active game runtime objects kept in memory + synchronized with Redis
class GameSession {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.gameCode = data.gameCode || generateGameCode();
    this.white = data.white || null; // { id, username, rating, socketId }
    this.black = data.black || null;
    this.spectators = new Set();
    this.timeControl = data.timeControl || '10+0';
    this.rated = data.rated !== false;
    this.variant = data.variant || 'standard';
    this.status = data.status || 'waiting'; // 'waiting', 'active', 'completed', 'paused'
    
    const tc = parseTimeControl(this.timeControl);
    this.timeWhite = data.timeWhite ?? tc.initialSeconds;
    this.timeBlack = data.timeBlack ?? tc.initialSeconds;
    this.increment = tc.incrementSeconds;

    this.chess = new Chess(data.initialFen || undefined);
    this.initialFen = this.chess.fen();
    this.moveTimes = [];
    this.fenHistory = [this.initialFen];
    this.movesList = [];
    this.pendingDraw = null; // color 'w' or 'b'
    this.pendingTakeback = null;
    this.lastMoveTimestamp = Date.now();
    this.timerInterval = null;
  }

  startTimer(onTimeout) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.lastMoveTimestamp = Date.now();

    this.timerInterval = setInterval(() => {
      if (this.status !== 'active') return;

      const turn = this.chess.turn(); // 'w' or 'b'
      if (turn === 'w') {
        this.timeWhite = Math.max(0, this.timeWhite - 1);
        if (this.timeWhite <= 0) {
          clearInterval(this.timerInterval);
          onTimeout('w');
        }
      } else {
        this.timeBlack = Math.max(0, this.timeBlack - 1);
        if (this.timeBlack <= 0) {
          clearInterval(this.timerInterval);
          onTimeout('b');
        }
      }

      // Broadcast timer updates every second
      io.to(this.id).emit('timerUpdate', {
        white: this.timeWhite,
        black: this.timeBlack,
        active: turn === 'w' ? 'white' : 'black'
      });
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  serialize() {
    return {
      id: this.id,
      gameCode: this.gameCode,
      white: this.white,
      black: this.black,
      timeControl: this.timeControl,
      timeWhite: this.timeWhite,
      timeBlack: this.timeBlack,
      status: this.status,
      fen: this.chess.fen(),
      turn: this.chess.turn(),
      pgn: this.chess.pgn(),
      moveCount: this.movesList.length
    };
  }
}

// Runtime active sessions map
const activeGames = new Map();
const gameCodeIndex = new Map();
const quickMatchQueue = new Map(); // timeControl -> array of waiting players

// Anti-Cheat Engine: Evaluates timing variance & suspicious speed
const antiCheatTracker = new Map(); // userId -> { moveTimes: [], flags: 0 }

function evaluateAntiCheat(userId, moveDurationMs, gameId) {
  if (!antiCheatTracker.has(userId)) {
    antiCheatTracker.set(userId, { moveTimes: [], flags: 0 });
  }

  const tracker = antiCheatTracker.get(userId);
  tracker.moveTimes.push(moveDurationMs);

  if (tracker.moveTimes.length >= 10) {
    const recent = tracker.moveTimes.slice(-10);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const variance = Math.sqrt(recent.map(x => Math.pow(x - avg, 2)).reduce((a, b) => a + b, 0) / recent.length);

    // Rule 1: Move time variance < 50ms with average < 300ms
    // Rule 2: Consistently fast moves (<200ms average with low variance)
    if ((avg < 300 && variance < 50) || (avg < 200 && variance < 80)) {
      tracker.flags += 1;
      logger.warn(`[Anti-Cheat] Suspicious play flagged for user ${userId}`, { avg, variance, flags: tracker.flags });

      // Save flag to database
      db.query(
        `INSERT INTO anti_cheat_flags (user_id, game_id, flag_type, metric_value, threshold_value, flag_count)
         VALUES ($1, $2, 'SUPERHUMAN_TIME_VARIANCE', $3, 50, $4)`,
        [userId, gameId, variance, tracker.flags]
      ).catch(() => {});

      // Notify moderators via WebSocket
      io.to('moderators').emit('antiCheatAlert', {
        userId,
        gameId,
        flag: 'SUPERHUMAN_TIMING_VARIANCE',
        avgTime: Math.round(avg),
        variance: Math.round(variance),
        totalFlags: tracker.flags
      });

      // Auto-ban after 5 flags (7 days)
      if (tracker.flags >= 5) {
        const bannedUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        db.query(`UPDATE users SET is_banned = TRUE, banned_until = $1 WHERE id = $2`, [bannedUntil, userId]).catch(() => {});
        logger.error(`[Anti-Cheat] User ${userId} auto-banned for 7 days.`);
      }
    }
  }
}

// Socket Connection Lifecycle
io.on('connection', (socket) => {
  activeConnectionsCount++;
  let currentUserId = null;
  let currentGameId = null;

  // Authentication & handshake
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      currentUserId = decoded.id;
      socket.join(`user:${currentUserId}`);
    } catch {}
  }

  // 1. 'createGame'
  socket.on('createGame', async ({ timeControl = '10+0', rated = true, variant = 'standard', colorPreference = 'white', visibility = 'public' }, callback) => {
    try {
      const gameId = uuidv4();
      const code = generateGameCode();
      const session = new GameSession({
        id: gameId,
        gameCode: code,
        timeControl,
        rated,
        variant
      });

      const playerInfo = {
        id: currentUserId || socket.id,
        username: socket.handshake.auth?.username || 'Player 1',
        rating: 1200,
        socketId: socket.id
      };

      if (colorPreference === 'black') {
        session.black = playerInfo;
      } else if (colorPreference === 'white') {
        session.white = playerInfo;
      } else {
        Math.random() > 0.5 ? (session.white = playerInfo) : (session.black = playerInfo);
      }

      activeGames.set(gameId, session);
      gameCodeIndex.set(code, gameId);
      socket.join(gameId);
      currentGameId = gameId;

      await cacheSet(`game:${gameId}`, JSON.stringify(session.serialize()), 3600);

      const response = { gameId, gameCode: code, visibility };
      socket.emit('gameCreated', response);
      if (typeof callback === 'function') callback(response);
    } catch (err) {
      socket.emit('error', { code: 'CREATE_GAME_FAILED', message: err.message });
    }
  });

  // 2. 'joinGame'
  socket.on('joinGame', async ({ gameCode }, callback) => {
    try {
      const cleanCode = (gameCode || '').trim().toUpperCase();
      const gameId = gameCodeIndex.get(cleanCode);
      if (!gameId || !activeGames.has(gameId)) {
        return socket.emit('error', { code: 'GAME_NOT_FOUND', message: 'No game found with code ' + cleanCode });
      }

      const session = activeGames.get(gameId);
      if (session.status !== 'waiting') {
        return socket.emit('error', { code: 'GAME_ALREADY_STARTED', message: 'This game has already commenced' });
      }

      const playerInfo = {
        id: currentUserId || socket.id,
        username: socket.handshake.auth?.username || 'Player 2',
        rating: 1200,
        socketId: socket.id
      };

      let assignedColor = 'b';
      if (!session.white) {
        session.white = playerInfo;
        assignedColor = 'w';
      } else if (!session.black) {
        session.black = playerInfo;
        assignedColor = 'b';
      }

      session.status = 'active';
      socket.join(gameId);
      currentGameId = gameId;

      // Notify player who joined
      socket.emit('gameJoined', {
        gameId,
        color: assignedColor === 'w' ? 'white' : 'black',
        opponent: assignedColor === 'w' ? session.black : session.white,
        timeControl: session.timeControl,
        variant: session.variant,
        initialFen: session.initialFen,
        rated: session.rated
      });

      // Notify entire room game started
      io.to(gameId).emit('gameStarted', {
        gameId,
        white: session.white,
        black: session.black,
        timeControl: session.timeControl,
        initialFen: session.initialFen,
        variant: session.variant
      });

      // Start clock
      session.startTimer(async (timeoutColor) => {
        handleGameOver(session, {
          result: timeoutColor === 'w' ? '0-1' : '1-0',
          reason: 'timeout',
          winner: timeoutColor === 'w' ? 'black' : 'white'
        });
      });

      if (typeof callback === 'function') callback({ success: true, gameId });
    } catch (err) {
      socket.emit('error', { code: 'JOIN_GAME_FAILED', message: err.message });
    }
  });

  // 3. 'quickMatch'
  socket.on('quickMatch', ({ timeControl = '10+0' }) => {
    if (!quickMatchQueue.has(timeControl)) {
      quickMatchQueue.set(timeControl, []);
    }
    const queue = quickMatchQueue.get(timeControl);
    const playerInfo = {
      id: currentUserId || socket.id,
      username: socket.handshake.auth?.username || 'Guest',
      rating: 1200,
      socket
    };

    if (queue.length > 0) {
      const opponent = queue.shift();
      const gameId = uuidv4();
      const code = generateGameCode();
      const session = new GameSession({ id: gameId, gameCode: code, timeControl, rated: true });

      session.white = opponent;
      session.black = playerInfo;
      session.status = 'active';

      activeGames.set(gameId, session);
      gameCodeIndex.set(code, gameId);

      opponent.socket.join(gameId);
      socket.join(gameId);

      io.to(gameId).emit('gameStarted', {
        gameId,
        white: { id: session.white.id, username: session.white.username, rating: session.white.rating },
        black: { id: session.black.id, username: session.black.username, rating: session.black.rating },
        timeControl,
        initialFen: session.initialFen,
        variant: 'standard'
      });

      session.startTimer((timeoutColor) => {
        handleGameOver(session, {
          result: timeoutColor === 'w' ? '0-1' : '1-0',
          reason: 'timeout',
          winner: timeoutColor === 'w' ? 'black' : 'white'
        });
      });
    } else {
      queue.push(playerInfo);
      socket.emit('matchmakingQueued', { timeControl });
    }
  });

  // 4. 'cancelMatchmaking'
  socket.on('cancelMatchmaking', () => {
    for (const [tc, queue] of quickMatchQueue.entries()) {
      const idx = queue.findIndex(p => p.socket.id === socket.id);
      if (idx !== -1) {
        queue.splice(idx, 1);
        socket.emit('matchmakingCancelled');
        break;
      }
    }
  });

  // 5. 'makeMove'
  socket.on('makeMove', async ({ gameId, from, to, promotion = 'q' }, callback) => {
    const session = activeGames.get(gameId);
    if (!session || session.status !== 'active') {
      const err = { code: 'INVALID_GAME', message: 'Game is not active' };
      socket.emit('error', err);
      if (typeof callback === 'function') callback(err);
      return;
    }

    const currentTurn = session.chess.turn(); // 'w' or 'b'
    const isWhite = (session.white?.socketId === socket.id) || (session.white?.id === currentUserId);
    const isBlack = (session.black?.socketId === socket.id) || (session.black?.id === currentUserId);

    if ((currentTurn === 'w' && !isWhite) || (currentTurn === 'b' && !isBlack)) {
      const err = { code: 'NOT_YOUR_TURN', message: 'It is not your turn' };
      socket.emit('error', err);
      if (typeof callback === 'function') callback(err);
      return;
    }

    // Time elapsed for move
    const now = Date.now();
    const elapsedMs = now - session.lastMoveTimestamp;
    session.lastMoveTimestamp = now;

    // Run Anti-cheat analysis
    const movingPlayerId = currentTurn === 'w' ? session.white?.id : session.black?.id;
    if (movingPlayerId) {
      evaluateAntiCheat(movingPlayerId, elapsedMs, session.id);
    }

    const fenBefore = session.chess.fen();
    let moveResult;
    try {
      moveResult = session.chess.move({ from, to, promotion });
    } catch {
      moveResult = null;
    }

    if (!moveResult) {
      const err = { code: 'ILLEGAL_MOVE', message: `Illegal move: ${from} -> ${to}` };
      socket.emit('error', err);
      if (typeof callback === 'function') callback(err);
      return;
    }

    totalMovesProcessed++;
    const fenAfter = session.chess.fen();
    session.fenHistory.push(fenAfter);
    session.moveTimes.push(elapsedMs);

    // Apply time increment
    if (currentTurn === 'w') session.timeWhite += session.increment;
    else session.timeBlack += session.increment;

    const movePayload = {
      move: { from, to, promotion },
      san: moveResult.san,
      fen: fenAfter,
      turn: session.chess.turn(),
      captured: moveResult.captured || null,
      promotion: moveResult.promotion || null,
      lastMove: { from, to },
      legalMoves: session.chess.moves({ verbose: true }),
      timeWhite: session.timeWhite,
      timeBlack: session.timeBlack,
      moveNumber: session.fenHistory.length - 1,
      isCheck: session.chess.isCheck(),
      isCheckmate: session.chess.isCheckmate(),
      isStalemate: session.chess.isStalemate(),
      isDraw: session.chess.isDraw(),
      pgn: session.chess.pgn()
    };

    session.movesList.push({
      fenBefore,
      fenAfter,
      san: moveResult.san,
      from,
      to,
      piece: moveResult.piece,
      captured: moveResult.captured,
      elapsed: elapsedMs
    });

    // Broadcast move to all participants and spectators
    io.to(gameId).emit('moveMade', movePayload);
    if (typeof callback === 'function') callback({ success: true, ...movePayload });

    // Check game termination conditions
    if (session.chess.isGameOver()) {
      let result = '½-½';
      let reason = 'draw';
      let winner = 'draw';

      if (session.chess.isCheckmate()) {
        result = currentTurn === 'w' ? '1-0' : '0-1';
        reason = 'checkmate';
        winner = currentTurn === 'w' ? 'white' : 'black';
      } else if (session.chess.isStalemate()) {
        reason = 'stalemate';
      } else if (session.chess.isThreefoldRepetition()) {
        reason = 'threefold_repetition';
      } else if (session.chess.isInsufficientMaterial()) {
        reason = 'insufficient_material';
      }

      await handleGameOver(session, { result, reason, winner });
    }
  });

  // 6. 'resign'
  socket.on('resign', async ({ gameId }) => {
    const session = activeGames.get(gameId);
    if (!session || session.status !== 'active') return;

    const isWhite = (session.white?.socketId === socket.id) || (session.white?.id === currentUserId);
    const winner = isWhite ? 'black' : 'white';
    const result = isWhite ? '0-1' : '1-0';

    await handleGameOver(session, { result, reason: 'resignation', winner });
  });

  // 7. Draw Offer & Response
  socket.on('offerDraw', ({ gameId }) => {
    const session = activeGames.get(gameId);
    if (!session || session.status !== 'active') return;
    const isWhite = (session.white?.socketId === socket.id) || (session.white?.id === currentUserId);
    session.pendingDraw = isWhite ? 'w' : 'b';

    socket.to(gameId).emit('drawOffered', {
      offeredBy: isWhite ? 'white' : 'black',
      playerId: currentUserId || socket.id
    });
  });

  socket.on('acceptDraw', async ({ gameId }) => {
    const session = activeGames.get(gameId);
    if (!session || session.status !== 'active' || !session.pendingDraw) return;
    await handleGameOver(session, { result: '½-½', reason: 'draw_agreement', winner: 'draw' });
    io.to(gameId).emit('drawAccepted');
  });

  socket.on('declineDraw', ({ gameId }) => {
    const session = activeGames.get(gameId);
    if (session) {
      session.pendingDraw = null;
      io.to(gameId).emit('drawDeclined');
    }
  });

  // 8. Takeback Request & Handling
  socket.on('requestTakeback', ({ gameId, moveIndex }) => {
    const session = activeGames.get(gameId);
    if (!session || session.status !== 'active') return;
    const isWhite = (session.white?.socketId === socket.id) || (session.white?.id === currentUserId);
    session.pendingTakeback = isWhite ? 'w' : 'b';

    socket.to(gameId).emit('takebackRequested', {
      requestedBy: isWhite ? 'white' : 'black',
      moveIndex,
      lastMove: session.movesList[session.movesList.length - 1]
    });
  });

  socket.on('acceptTakeback', ({ gameId }) => {
    const session = activeGames.get(gameId);
    if (!session || session.status !== 'active' || !session.pendingTakeback) return;

    // Undo last move
    session.chess.undo();
    session.fenHistory.pop();
    session.movesList.pop();
    session.pendingTakeback = null;

    const last = session.movesList[session.movesList.length - 1];
    io.to(gameId).emit('takebackAccepted', {
      fen: session.chess.fen(),
      turn: session.chess.turn(),
      lastMove: last ? { from: last.from, to: last.to } : null
    });
  });

  socket.on('declineTakeback', ({ gameId }) => {
    const session = activeGames.get(gameId);
    if (session) {
      session.pendingTakeback = null;
      io.to(gameId).emit('takebackDeclined');
    }
  });

  // 9. Pause & Resume Game
  socket.on('pauseGame', ({ gameId }) => {
    const session = activeGames.get(gameId);
    if (!session || session.status !== 'active') return;
    session.status = 'paused';
    session.stopTimer();
    io.to(gameId).emit('gamePaused', { pausedBy: currentUserId || socket.id, pauseTime: Date.now() });
  });

  socket.on('resumeGame', ({ gameId }) => {
    const session = activeGames.get(gameId);
    if (!session || session.status !== 'paused') return;
    session.status = 'active';
    session.startTimer((timeoutColor) => {
      handleGameOver(session, {
        result: timeoutColor === 'w' ? '0-1' : '1-0',
        reason: 'timeout',
        winner: timeoutColor === 'w' ? 'black' : 'white'
      });
    });
    io.to(gameId).emit('gameResumed');
  });

  // 10. Claim Draw (50-move rule, threefold repetition)
  socket.on('claimDraw', async ({ gameId, reason }) => {
    const session = activeGames.get(gameId);
    if (!session || session.status !== 'active') return;

    let valid = false;
    if (reason === 'threefold_repetition' && session.chess.isThreefoldRepetition()) valid = true;
    if (reason === 'fifty_move_rule' && session.chess.isDraw()) valid = true;

    if (valid) {
      await handleGameOver(session, { result: '½-½', reason, winner: 'draw' });
    } else {
      socket.emit('error', { code: 'INVALID_DRAW_CLAIM', message: 'Draw conditions not currently met' });
    }
  });

  // 11. In-game Chat Messaging
  socket.on('sendMessage', async ({ gameId, message }) => {
    if (!message || !message.trim()) return;
    const cleanMsg = message.trim().slice(0, 500);

    const payload = {
      username: socket.handshake.auth?.username || 'Player',
      userId: currentUserId || socket.id,
      message: cleanMsg,
      timestamp: Date.now()
    };

    io.to(gameId).emit('newMessage', payload);

    // Persist to PostgreSQL if UUID game
    db.query(
      `INSERT INTO chat_messages (game_id, user_id, message)
       VALUES ($1, $2, $3)`,
      [gameId, currentUserId, cleanMsg]
    ).catch(() => {});
  });

  // 12. Spectator Mode
  socket.on('spectateGame', ({ gameId }) => {
    const session = activeGames.get(gameId);
    if (session) {
      session.spectators.add(socket.id);
      socket.join(gameId);
      socket.emit('gameStarted', {
        gameId,
        white: session.white,
        black: session.black,
        timeControl: session.timeControl,
        initialFen: session.initialFen,
        variant: session.variant
      });
      io.to(gameId).emit('spectatorCount', { count: session.spectators.size });
      socket.to(gameId).emit('spectatorJoined', { username: socket.handshake.auth?.username || 'Spectator' });
    }
  });

  socket.on('stopSpectating', ({ gameId }) => {
    const session = activeGames.get(gameId);
    if (session) {
      session.spectators.delete(socket.id);
      socket.leave(gameId);
      io.to(gameId).emit('spectatorCount', { count: session.spectators.size });
    }
  });

  // 13. Heartbeat & Reconnection
  socket.on('heartbeat', ({ gameId, timestamp }) => {
    socket.emit('heartbeatAck', { timestamp, serverTime: Date.now() });
  });

  socket.on('reconnectGame', ({ gameId }) => {
    const session = activeGames.get(gameId);
    if (session) {
      socket.join(gameId);
      socket.emit('gameJoined', {
        gameId,
        color: (session.white?.id === currentUserId) ? 'white' : 'black',
        opponent: (session.white?.id === currentUserId) ? session.black : session.white,
        timeControl: session.timeControl,
        variant: session.variant,
        initialFen: session.initialFen,
        rated: session.rated
      });
      socket.to(gameId).emit('playerReconnected', { playerId: currentUserId, playerName: socket.handshake.auth?.username });
    }
  });

  // Disconnect handler
  socket.on('disconnect', () => {
    activeConnectionsCount = Math.max(0, activeConnectionsCount - 1);
    if (currentGameId) {
      socket.to(currentGameId).emit('playerDisconnected', {
        playerId: currentUserId || socket.id,
        playerName: socket.handshake.auth?.username || 'Player'
      });
    }
  });
});

// Game Over Finalizer
async function handleGameOver(session, { result, reason, winner }) {
  session.status = 'completed';
  session.stopTimer();

  let ratingChanges = null;
  if (session.rated && session.white?.id && session.black?.id) {
    const scoreWhite = winner === 'white' ? 1 : (winner === 'black' ? 0 : 0.5);
    const whiteRating = session.white.rating || 1200;
    const blackRating = session.black.rating || 1200;

    ratingChanges = calculateNewRatings(whiteRating, blackRating, scoreWhite);

    // Update player ratings in database
    await db.query(
      `UPDATE users SET elo_rating = $1, games_played = games_played + 1,
       games_won = games_won + $2, games_drawn = games_drawn + $3 WHERE id = $4`,
      [ratingChanges.newWhiteRating, winner === 'white' ? 1 : 0, winner === 'draw' ? 1 : 0, session.white.id]
    ).catch(() => {});

    await db.query(
      `UPDATE users SET elo_rating = $1, games_played = games_played + 1,
       games_won = games_won + $2, games_drawn = games_drawn + $3 WHERE id = $4`,
      [ratingChanges.newBlackRating, winner === 'black' ? 1 : 0, winner === 'draw' ? 1 : 0, session.black.id]
    ).catch(() => {});
  }

  // Save game to PostgreSQL
  db.query(
    `INSERT INTO games (id, game_code, white_player_id, black_player_id, winner, result, pgn, fen_history, total_moves, time_control, status, end_time)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'completed', CURRENT_TIMESTAMP)
     ON CONFLICT (id) DO UPDATE
     SET winner = $5, result = $6, pgn = $7, fen_history = $8, total_moves = $9, status = 'completed', end_time = CURRENT_TIMESTAMP`,
    [
      session.id,
      session.gameCode,
      session.white?.id || null,
      session.black?.id || null,
      winner,
      reason,
      session.chess.pgn(),
      JSON.stringify(session.fenHistory),
      session.movesList.length,
      session.timeControl
    ]
  ).catch(() => {});

  const gameOverPayload = {
    result,
    reason,
    winner,
    pgn: session.chess.pgn(),
    finalFen: session.chess.fen(),
    ratingChanges,
    gameStats: {
      totalMoves: session.movesList.length,
      durationMs: Date.now() - session.lastMoveTimestamp
    }
  };

  io.to(session.id).emit('gameOver', gameOverPayload);
  await cacheDel(`game:${session.id}`);
}

// ==========================================
// 7. BOOTSTRAP SERVER
// ==========================================
server.listen(PORT, '0.0.0.0', () => {
  logger.info(`Multiplayer Chess Backend listening on http://0.0.0.0:${PORT}`);
});

export { app, server, io };
