// FILE: backend/models.js
/**
 * DATA ACCESS MODELS
 * Object models encapsulating PostgreSQL tables with validation and formatting.
 */

import { query, withTransaction } from './database.js';

export const UserModel = {
  async findById(id) {
    const res = await query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async findByEmail(email) {
    const res = await query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    return res.rows[0] || null;
  },

  async findByUsername(username) {
    const res = await query('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
    return res.rows[0] || null;
  },

  async create({ username, email, passwordHash, displayName, countryCode }) {
    const res = await query(
      `INSERT INTO users (username, email, password_hash, display_name, country_code)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, display_name, elo_rating, created_at`,
      [username, email, passwordHash, displayName || username, countryCode || 'US']
    );
    return res.rows[0];
  },

  async updateStats(userId, { won, drawn, lost, ratingDelta, newRating, timeControlCategory }) {
    const ratingColumn = timeControlCategory === 'bullet' ? 'bullet_rating' 
      : timeControlCategory === 'blitz' ? 'blitz_rating' 
      : timeControlCategory === 'rapid' ? 'rapid_rating' 
      : 'elo_rating';

    const winInc = won ? 1 : 0;
    const drawInc = drawn ? 1 : 0;
    const lossInc = lost ? 1 : 0;

    await query(
      `UPDATE users
       SET games_played = games_played + 1,
           games_won = games_won + $1,
           games_drawn = games_drawn + $2,
           games_lost = games_lost + $3,
           elo_rating = GREATEST(100, elo_rating + $4),
           ${ratingColumn} = GREATEST(100, ${ratingColumn} + $4),
           peak_rating = GREATEST(peak_rating, elo_rating + $4),
           win_streak = CASE WHEN $1 = 1 THEN win_streak + 1 ELSE 0 END,
           best_win_streak = CASE WHEN $1 = 1 THEN GREATEST(best_win_streak, win_streak + 1) ELSE best_win_streak END,
           last_active = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [winInc, drawInc, lossInc, ratingDelta, userId]
    );
  },

  async updateStatus(userId, isOnline, currentGameId = null) {
    await query(
      `UPDATE users SET is_online = $1, current_game_id = $2, last_active = CURRENT_TIMESTAMP WHERE id = $3`,
      [isOnline, currentGameId, userId]
    );
  },

  async getLeaderboard(limit = 100, offset = 0, timeControl = 'blitz') {
    const ratingCol = timeControl === 'rapid' ? 'rapid_rating' : timeControl === 'bullet' ? 'bullet_rating' : 'elo_rating';
    const res = await query(
      `SELECT id, username, display_name, country_code, avatar_url, ${ratingCol} as elo, games_played, games_won, games_lost, games_drawn, win_streak, is_online
       FROM users
       WHERE is_banned = FALSE
       ORDER BY ${ratingCol} DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return res.rows;
  }
};

export const GameModel = {
  async create({ gameCode, whitePlayerId, blackPlayerId, timeControl, rated, variant, initialFen }) {
    const res = await query(
      `INSERT INTO games (game_code, white_player_id, black_player_id, time_control, rated, variant, initial_fen, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'waiting')
       RETURNING *`,
      [gameCode, whitePlayerId, blackPlayerId, timeControl || '10+0', rated ?? true, variant || 'standard', initialFen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1']
    );
    return res.rows[0];
  },

  async findByCode(gameCode) {
    const res = await query('SELECT * FROM games WHERE game_code = $1', [gameCode]);
    return res.rows[0] || null;
  },

  async findById(gameId) {
    const res = await query('SELECT * FROM games WHERE id = $1', [gameId]);
    return res.rows[0] || null;
  },

  async updateState(gameId, { pgn, fenHistory, moveTimes, totalMoves, status, winner, result, endTime }) {
    await query(
      `UPDATE games
       SET pgn = $1,
           fen_history = $2,
           move_times = $3,
           total_moves = $4,
           status = COALESCE($5, status),
           winner = $6,
           result = $7,
           end_time = $8,
           last_move_time = CURRENT_TIMESTAMP
       WHERE id = $9`,
      [pgn, JSON.stringify(fenHistory), JSON.stringify(moveTimes), totalMoves, status, winner, result, endTime, gameId]
    );
  },

  async getUserGameHistory(userId, limit = 10, offset = 0) {
    const res = await query(
      `SELECT g.*, 
              w.username as white_username, w.display_name as white_display, w.elo_rating as white_elo,
              b.username as black_username, b.display_name as black_display, b.elo_rating as black_elo
       FROM games g
       LEFT JOIN users w ON g.white_player_id = w.id
       LEFT JOIN users b ON g.black_player_id = b.id
       WHERE g.white_player_id = $1 OR g.black_player_id = $1
       ORDER BY g.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );
    return res.rows;
  }
};

export const MoveModel = {
  async recordMove({ gameId, moveNumber, fenBefore, fenAfter, san, fromSquare, toSquare, piece, capturedPiece, promotionPiece, isCheck, isCheckmate, isCastle, isEnPassant, elapsedTime, accuracyScore }) {
    const res = await query(
      `INSERT INTO moves (game_id, move_number, fen_before, fen_after, san, from_square, to_square, piece, captured_piece, promotion_piece, is_check, is_checkmate, is_castle, is_en_passant, elapsed_time, accuracy_score)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [gameId, moveNumber, fenBefore, fenAfter, san, fromSquare, toSquare, piece, capturedPiece, promotionPiece, isCheck, isCheckmate, isCastle, isEnPassant, elapsedTime, accuracyScore]
    );
    return res.rows[0];
  },

  async getMovesByGameId(gameId) {
    const res = await query('SELECT * FROM moves WHERE game_id = $1 ORDER BY move_number ASC', [gameId]);
    return res.rows;
  }
};

export const TournamentModel = {
  async create({ name, type, maxPlayers, timeControl, prizePool, entryFee, createdBy }) {
    const res = await query(
      `INSERT INTO tournaments (name, type, max_players, time_control, prize_pool, entry_fee, created_by, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [name, type || 'swiss', maxPlayers || 16, timeControl || '5+3', prizePool || 0, entryFee || 0, createdBy]
    );
    return res.rows[0];
  },

  async listActive() {
    const res = await query('SELECT * FROM tournaments ORDER BY created_at DESC LIMIT 50');
    return res.rows;
  },

  async getParticipants(tournamentId) {
    const res = await query(
      `SELECT tp.*, u.username, u.display_name, u.elo_rating, u.avatar_url
       FROM tournament_participants tp
       JOIN users u ON tp.user_id = u.id
       WHERE tp.tournament_id = $1
       ORDER BY tp.score DESC, tp.tiebreak_score DESC`,
      [tournamentId]
    );
    return res.rows;
  },

  async addParticipant(tournamentId, userId) {
    await query(
      `INSERT INTO tournament_participants (tournament_id, user_id, score, tiebreak_score)
       VALUES ($1, $2, 0.0, 0.0)
       ON CONFLICT (tournament_id, user_id) DO NOTHING`,
      [tournamentId, userId]
    );
  }
};
