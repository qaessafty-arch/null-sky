// FILE: backend/routes.js
/**
 * REST API ROUTES
 * Comprehensive endpoints for Auth, Users, Games, Tournaments, Social, and Leaderboards.
 */

import { Router } from 'express';
import Joi from 'joi';
import jwt from 'jsonwebtoken';
import { query } from './database.js';
import { UserModel, GameModel, TournamentModel } from './models.js';
import { authenticateToken, registerUser, loginUser, logoutUser } from './auth.js';

const router = Router();
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_jwt_chess_key_2026';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_chess_key_2026';

// Validation Schemas
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  displayName: Joi.string().max(50).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// ==========================================
// 1. AUTHENTICATION ENDPOINTS
// ==========================================

router.post('/auth/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const existingEmail = await UserModel.findByEmail(value.email);
    if (existingEmail) return res.status(409).json({ error: 'Email already in use' });

    const existingUser = await UserModel.findByUsername(value.username);
    if (existingUser) return res.status(409).json({ error: 'Username taken' });

    const userId = await registerUser(value.username, value.email, value.password, { query });
    const user = await UserModel.findById(userId);

    const accessToken = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_REFRESH_SECRET, { expiresIn: '7d' });

    delete user.password_hash;
    res.status(201).json({ accessToken, refreshToken, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const result = await loginUser(value.email, value.password, { query }, req.app.locals.redis);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: err.message || 'Invalid credentials' });
  }
});

router.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

    jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, decoded) => {
      if (err) return res.status(403).json({ error: 'Invalid refresh token' });

      // Verify Redis token store if available
      const redis = req.app.locals.redis;
      if (redis) {
        const stored = await redis.get(`refresh:${decoded.userId}`);
        if (stored && stored !== refreshToken) {
          return res.status(403).json({ error: 'Refresh token revoked' });
        }
      }

      const newAccessToken = jwt.sign({ userId: decoded.userId }, JWT_SECRET, { expiresIn: '15m' });
      res.json({ accessToken: newAccessToken });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/logout', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      await logoutUser(decoded.userId, req.app.locals.redis);
    } catch {}
  }
  res.json({ message: 'Logged out successfully' });
});

// ==========================================
// 2. USER PROFILE & STATS ENDPOINTS
// ==========================================

router.get('/users/:id', async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    delete user.password_hash;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users/:id/stats', async (req, res) => {
  try {
    const user = await UserModel.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      elo: user.elo_rating,
      rapid: user.rapid_rating,
      blitz: user.blitz_rating,
      bullet: user.bullet_rating,
      gamesPlayed: user.games_played,
      won: user.games_won,
      lost: user.games_lost,
      drawn: user.games_drawn,
      winRate: user.games_played > 0 ? Math.round((user.games_won / user.games_played) * 100) : 0,
      winStreak: user.win_streak,
      bestStreak: user.best_win_streak
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users/:id/stats-history', async (req, res) => {
  try {
    const result = await query(
      'SELECT date, elo_rating, games_played, win_rate FROM player_stats_history WHERE user_id = $1 ORDER BY date ASC LIMIT 30',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/users/:id/games', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '10', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const games = await GameModel.getUserGameHistory(req.params.id, limit, offset);
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.userId !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
    const { displayName, bio, countryCode, avatarUrl } = req.body;
    const result = await query(
      `UPDATE users
       SET display_name = COALESCE($1, display_name),
           bio = COALESCE($2, bio),
           country_code = COALESCE($3, country_code),
           avatar_url = COALESCE($4, avatar_url)
       WHERE id = $5
       RETURNING id, username, display_name, bio, country_code, avatar_url`,
      [displayName, bio, countryCode, avatarUrl, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/users/:id/settings', authenticateToken, async (req, res) => {
  try {
    if (req.user.userId !== req.params.id) return res.status(403).json({ error: 'Forbidden' });
    const { settings } = req.body;
    await query('UPDATE users SET settings = $1 WHERE id = $2', [JSON.stringify(settings), req.params.id]);
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 3. GAMES ENDPOINTS
// ==========================================

router.get('/games/available', async (req, res) => {
  try {
    const result = await query(
      `SELECT g.*, u.username as host_username, u.elo_rating as host_elo
       FROM games g
       LEFT JOIN users u ON g.white_player_id = u.id
       WHERE g.status = 'waiting'
       ORDER BY g.created_at DESC
       LIMIT 20`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/games/:id', async (req, res) => {
  try {
    const game = await GameModel.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(game);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/games/:id/pgn', async (req, res) => {
  try {
    const game = await GameModel.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.type('text/plain').send(game.pgn || '');
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/games/:id/fen', async (req, res) => {
  try {
    const game = await GameModel.findById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    const fens = game.fen_history || [];
    res.json({ fen: fens[fens.length - 1] || game.initial_fen });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/games/:id/analysis', async (req, res) => {
  try {
    const result = await query('SELECT * FROM game_analysis WHERE game_id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Analysis not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. TOURNAMENTS ENDPOINTS
// ==========================================

router.get('/tournaments', async (req, res) => {
  try {
    const list = await TournamentModel.listActive();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tournaments', authenticateToken, async (req, res) => {
  try {
    const { name, type, maxPlayers, timeControl, prizePool } = req.body;
    const tourn = await TournamentModel.create({
      name,
      type,
      maxPlayers,
      timeControl,
      prizePool,
      createdBy: req.user.userId
    });
    res.status(201).json(tourn);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tournaments/:id', async (req, res) => {
  try {
    const resTourn = await query('SELECT * FROM tournaments WHERE id = $1', [req.params.id]);
    const tourn = resTourn.rows[0];
    if (!tourn) return res.status(404).json({ error: 'Tournament not found' });

    const participants = await TournamentModel.getParticipants(req.params.id);
    const pairingsRes = await query('SELECT * FROM tournament_pairings WHERE tournament_id = $1 ORDER BY round ASC, board_number ASC', [req.params.id]);

    res.json({ ...tourn, participants, pairings: pairingsRes.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tournaments/:id/join', authenticateToken, async (req, res) => {
  try {
    await TournamentModel.addParticipant(req.params.id, req.user.userId);
    res.json({ success: true, message: 'Joined tournament' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. LEADERBOARD ENDPOINTS
// ==========================================

router.get('/leaderboard', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const timeControl = req.query.timeControl || 'blitz';
    const players = await UserModel.getLeaderboard(limit, offset, timeControl);
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/leaderboard/:timeControl', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '100', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const players = await UserModel.getLeaderboard(limit, offset, req.params.timeControl);
    res.json(players);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. SOCIAL & NOTIFICATIONS ENDPOINTS
// ==========================================

router.get('/friends', authenticateToken, async (req, res) => {
  try {
    const social = req.app.locals.socialService;
    const friends = await social.getFriendsList(req.user.userId);
    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/friends/requests', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      `SELECT fr.*, u.username, u.display_name, u.avatar_url, u.elo_rating
       FROM friend_requests fr
       JOIN users u ON fr.from_user_id = u.id
       WHERE fr.to_user_id = $1 AND fr.status = 'pending'`,
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/friends/requests', authenticateToken, async (req, res) => {
  try {
    const { userId, message } = req.body;
    const social = req.app.locals.socialService;
    const reqData = await social.sendFriendRequest(req.user.userId, userId, message);
    res.status(201).json(reqData);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/friends/requests/:id', authenticateToken, async (req, res) => {
  try {
    const { action } = req.body; // 'accept' or 'decline'
    const social = req.app.locals.socialService;
    if (action === 'accept') {
      await social.acceptFriendRequest(req.params.id, req.user.userId);
    } else {
      await social.declineFriendRequest(req.params.id, req.user.userId);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/friends/:id', authenticateToken, async (req, res) => {
  try {
    const social = req.app.locals.socialService;
    await social.removeFriend(req.user.userId, req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/notifications', authenticateToken, async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/notifications/:id', authenticateToken, async (req, res) => {
  try {
    await query('UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/notifications/:id', authenticateToken, async (req, res) => {
  try {
    await query('DELETE FROM notifications WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/activities', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit || '20', 10);
    const offset = parseInt(req.query.offset || '0', 10);
    const social = req.app.locals.socialService;
    const activities = await social.getActivityFeed(limit, offset);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
