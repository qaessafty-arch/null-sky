-- ==========================================================
-- PRODUCTION MULTIPLAYER CHESS PLATFORM - POSTGRESQL SCHEMA
-- Complete relational architecture with indexing and seed data
-- ==========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(32) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(64) DEFAULT '',
    bio TEXT DEFAULT '',
    country_code VARCHAR(3) DEFAULT 'US',
    avatar_url TEXT DEFAULT '',
    cover_image_url TEXT DEFAULT '',
    elo_rating INTEGER NOT NULL DEFAULT 1200,
    peak_rating INTEGER NOT NULL DEFAULT 1200,
    rapid_rating INTEGER NOT NULL DEFAULT 1200,
    blitz_rating INTEGER NOT NULL DEFAULT 1200,
    bullet_rating INTEGER NOT NULL DEFAULT 1200,
    games_played INTEGER NOT NULL DEFAULT 0,
    games_won INTEGER NOT NULL DEFAULT 0,
    games_drawn INTEGER NOT NULL DEFAULT 0,
    games_lost INTEGER NOT NULL DEFAULT 0,
    win_streak INTEGER NOT NULL DEFAULT 0,
    best_win_streak INTEGER NOT NULL DEFAULT 0,
    friends_count INTEGER NOT NULL DEFAULT 0,
    followers_count INTEGER NOT NULL DEFAULT 0,
    is_online BOOLEAN NOT NULL DEFAULT FALSE,
    current_game_id UUID NULL,
    settings JSONB NOT NULL DEFAULT '{"theme":"classic","pieceStyle":"neo","soundEnabled":true,"showLegalMoves":true,"autoQueen":false,"boardOrientation":"white","language":"en"}'::jsonb,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_banned BOOLEAN NOT NULL DEFAULT FALSE,
    ban_reason TEXT NULL,
    ban_expires TIMESTAMP WITH TIME ZONE NULL,
    join_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_elo_rating ON users (elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_users_rapid_rating ON users (rapid_rating DESC);
CREATE INDEX IF NOT EXISTS idx_users_blitz_rating ON users (blitz_rating DESC);
CREATE INDEX IF NOT EXISTS idx_users_bullet_rating ON users (bullet_rating DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_is_online ON users (is_online);

-- 2. FRIENDSHIPS TABLE
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON friendships (user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON friendships (friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships (status);

-- 3. FRIEND REQUESTS TABLE
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'declined'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_pending_request UNIQUE (from_user_id, to_user_id)
);

CREATE INDEX IF NOT EXISTS idx_friend_req_from ON friend_requests (from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_req_to ON friend_requests (to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_req_status ON friend_requests (status);

-- 4. TOURNAMENTS TABLE
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    type VARCHAR(30) NOT NULL DEFAULT 'swiss', -- 'swiss', 'round_robin', 'elimination', 'arena'
    max_players INTEGER NOT NULL DEFAULT 16,
    current_round INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'active', 'completed', 'cancelled'
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE NULL,
    time_control VARCHAR(16) DEFAULT '5+3',
    prize_pool NUMERIC(10,2) DEFAULT 0.00,
    entry_fee NUMERIC(10,2) DEFAULT 0.00,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    settings JSONB NOT NULL DEFAULT '{"rounds":5,"tiebreak":"sonneborn_berger","allowLateJoin":false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments (status);
CREATE INDEX IF NOT EXISTS idx_tournaments_created_at ON tournaments (created_at DESC);

-- 5. TOURNAMENT PARTICIPANTS
CREATE TABLE IF NOT EXISTS tournament_participants (
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score NUMERIC(6,1) NOT NULL DEFAULT 0.0,
    tiebreak_score NUMERIC(8,2) NOT NULL DEFAULT 0.0,
    eliminated BOOLEAN NOT NULL DEFAULT FALSE,
    current_position INTEGER DEFAULT 1,
    games_played INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (tournament_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tourn_part_score ON tournament_participants (tournament_id, score DESC, tiebreak_score DESC);

-- 6. GAMES TABLE
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_code VARCHAR(6) NOT NULL UNIQUE,
    white_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
    black_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
    winner VARCHAR(10) NULL, -- 'white', 'black', 'draw'
    result VARCHAR(40) NULL, -- 'checkmate', 'stalemate', 'resignation', 'timeout', 'draw_agreement', 'insufficient_material', 'threefold_repetition', 'fifty_move_rule', 'abandoned'
    pgn TEXT DEFAULT '',
    fen_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    move_times JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_moves INTEGER DEFAULT 0,
    time_control VARCHAR(16) NOT NULL DEFAULT '10+0',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting', -- 'waiting', 'active', 'completed', 'aborted', 'paused'
    rated BOOLEAN NOT NULL DEFAULT TRUE,
    variant VARCHAR(20) NOT NULL DEFAULT 'standard', -- 'standard', 'chess960'
    tournament_id UUID REFERENCES tournaments(id) ON DELETE SET NULL,
    eco_code VARCHAR(10) DEFAULT '',
    initial_fen TEXT NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    last_move_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_games_status ON games (status);
CREATE INDEX IF NOT EXISTS idx_games_white_player ON games (white_player_id);
CREATE INDEX IF NOT EXISTS idx_games_black_player ON games (black_player_id);
CREATE INDEX IF NOT EXISTS idx_games_game_code ON games (game_code);
CREATE INDEX IF NOT EXISTS idx_games_created_at ON games (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_games_tournament ON games (tournament_id);

-- 7. TOURNAMENT PAIRINGS
CREATE TABLE IF NOT EXISTS tournament_pairings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    white_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
    black_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
    game_id UUID REFERENCES games(id) ON DELETE SET NULL,
    result VARCHAR(20) NULL, -- '1-0', '0-1', '1/2-1/2', 'bye'
    is_bye BOOLEAN NOT NULL DEFAULT FALSE,
    board_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pairings_tournament ON tournament_pairings (tournament_id, round);

-- 8. MOVES TABLE
CREATE TABLE IF NOT EXISTS moves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    move_number INTEGER NOT NULL,
    fen_before TEXT NOT NULL,
    fen_after TEXT NOT NULL,
    san VARCHAR(16) NOT NULL,
    from_square VARCHAR(4) NOT NULL,
    to_square VARCHAR(4) NOT NULL,
    piece VARCHAR(2) NOT NULL,
    captured_piece VARCHAR(2) NULL,
    promotion_piece VARCHAR(2) NULL,
    is_check BOOLEAN NOT NULL DEFAULT FALSE,
    is_checkmate BOOLEAN NOT NULL DEFAULT FALSE,
    is_castle BOOLEAN NOT NULL DEFAULT FALSE,
    is_en_passant BOOLEAN NOT NULL DEFAULT FALSE,
    elapsed_time INTEGER NOT NULL DEFAULT 0, -- in milliseconds
    accuracy_score NUMERIC(5,2) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_moves_game_id ON moves (game_id, move_number ASC);

-- 9. CHAT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_game_id ON chat_messages (game_id, sent_at ASC);

-- 10. GAME ANALYSIS TABLE
CREATE TABLE IF NOT EXISTS game_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    accuracy_white NUMERIC(5,2) DEFAULT 0.00,
    accuracy_black NUMERIC(5,2) DEFAULT 0.00,
    blunders INTEGER DEFAULT 0,
    mistakes INTEGER DEFAULT 0,
    inaccuracies INTEGER DEFAULT 0,
    best_moves INTEGER DEFAULT 0,
    analysis_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_game_analysis_game_id ON game_analysis (game_id);

-- 11. PLAYER STATS HISTORY
CREATE TABLE IF NOT EXISTS player_stats_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    elo_rating INTEGER NOT NULL DEFAULT 1200,
    games_played INTEGER NOT NULL DEFAULT 0,
    games_won INTEGER NOT NULL DEFAULT 0,
    games_lost INTEGER NOT NULL DEFAULT 0,
    games_drawn INTEGER NOT NULL DEFAULT 0,
    win_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT unique_user_daily_stat UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_stats_history_user_date ON player_stats_history (user_id, date DESC);

-- 12. ACHIEVEMENTS TABLE
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(64) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    progress INTEGER DEFAULT 100,
    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_type)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements (user_id);

-- 13. ACTIVITY FEED TABLE
CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(32) NOT NULL, -- 'game_won', 'game_lost', 'achievement', 'friend_added', 'rank_up'
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_activity_user_created ON activity_feed (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON activity_feed (created_at DESC);

-- 14. PLAYER NOTES TABLE
CREATE TABLE IF NOT EXISTS player_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_player_note UNIQUE (user_id, target_user_id)
);

-- 15. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL, -- 'friend_request', 'challenge', 'game_invite', 'achievement', 'warning'
    message TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications (user_id, read, created_at DESC);

-- 16. CHEAT FLAGS TABLE
CREATE TABLE IF NOT EXISTS cheat_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    flagged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'pending_review' -- 'pending_review', 'confirmed', 'false_positive'
);

CREATE INDEX IF NOT EXISTS idx_cheat_flags_player ON cheat_flags (player_id, flagged_at DESC);
CREATE INDEX IF NOT EXISTS idx_cheat_flags_status ON cheat_flags (status);

-- ==========================================================
-- SEED DATA (Default Grandmasters, Admins & Demo Tournaments)
-- ==========================================================

-- Password hash for 'ChessPass123!': $2a$12$K8u1L7Z.vK1N1lD4N3h6c.nI4J0wYm3N2l9h2v1m5x7p0q9r8s6t
INSERT INTO users (id, username, email, password_hash, display_name, bio, country_code, elo_rating, peak_rating, rapid_rating, blitz_rating, bullet_rating, games_played, games_won, games_drawn, games_lost, win_streak, best_win_streak, is_verified)
VALUES
('a0000000-0000-0000-0000-000000000001', 'magnus_c', 'magnus@chess.example', '$2a$12$K8u1L7Z.vK1N1lD4N3h6c.nI4J0wYm3N2l9h2v1m5x7p0q9r8s6t', 'Magnus C.', 'World Champion. Passionate about rapid attacks and endgames.', 'NO', 2850, 2882, 2870, 2880, 2895, 340, 280, 50, 10, 14, 25, TRUE),
('a0000000-0000-0000-0000-000000000002', 'hikaru_n', 'hikaru@chess.example', '$2a$12$K8u1L7Z.vK1N1lD4N3h6c.nI4J0wYm3N2l9h2v1m5x7p0q9r8s6t', 'Hikaru N.', 'Speed chess master. I stream and play blitz.', 'US', 2835, 2875, 2840, 2885, 2910, 520, 410, 80, 30, 9, 21, TRUE),
('a0000000-0000-0000-0000-000000000003', 'peshmerga_gm', 'gm@chesskys.example', '$2a$12$K8u1L7Z.vK1N1lD4N3h6c.nI4J0wYm3N2l9h2v1m5x7p0q9r8s6t', 'Peshmerga GM', 'Defending the tactical fortress of Kurdistan.', 'IQ', 2450, 2520, 2460, 2480, 2410, 195, 140, 35, 20, 6, 15, TRUE),
('a0000000-0000-0000-0000-000000000004', 'tactician_pro', 'tactics@chess.example', '$2a$12$K8u1L7Z.vK1N1lD4N3h6c.nI4J0wYm3N2l9h2v1m5x7p0q9r8s6t', 'Tactician Pro', 'Puzzle solver and opening specialist.', 'DE', 1850, 1920, 1870, 1840, 1800, 110, 65, 15, 30, 3, 8, FALSE),
('a0000000-0000-0000-0000-000000000005', 'demo_user', 'player@chess.example', '$2a$12$K8u1L7Z.vK1N1lD4N3h6c.nI4J0wYm3N2l9h2v1m5x7p0q9r8s6t', 'Grandmaster Demo', 'Ready to challenge players worldwide.', 'FR', 1200, 1200, 1200, 1200, 1200, 0, 0, 0, 0, 0, 0, FALSE)
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Tournament
INSERT INTO tournaments (id, name, type, max_players, current_round, status, time_control, prize_pool, created_by)
VALUES
('t0000000-0000-0000-0000-000000000001', 'Summer Blitz Championship', 'swiss', 32, 1, 'active', '5+3', 500.00, 'a0000000-0000-0000-0000-000000000001'),
('t0000000-0000-0000-0000-000000000002', 'Grand Arena 2026', 'arena', 64, 0, 'pending', '3+0', 1000.00, 'a0000000-0000-0000-0000-000000000002')
ON CONFLICT (id) DO NOTHING;
