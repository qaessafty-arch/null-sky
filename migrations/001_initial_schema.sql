-- FILE: migrations/001_initial_schema.sql
-- ==========================================================
-- PRODUCTION MULTIPLAYER CHESS PLATFORM - POSTGRESQL SCHEMA
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

-- 2. FRIENDSHIPS TABLE
CREATE TABLE IF NOT EXISTS friendships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'accepted' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

-- 3. FRIEND REQUESTS TABLE
CREATE TABLE IF NOT EXISTS friend_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_pending_request UNIQUE (from_user_id, to_user_id)
);

-- 4. GAMES TABLE
CREATE TABLE IF NOT EXISTS games (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_code VARCHAR(6) NOT NULL UNIQUE,
    white_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
    black_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
    winner VARCHAR(10) NULL CHECK (winner IN ('white', 'black', 'draw')),
    result VARCHAR(30) NULL CHECK (result IN (
        'checkmate', 'stalemate', 'resignation', 'timeout', 'draw_agreement',
        'insufficient_material', 'threefold_repetition', 'fifty_move_rule', 'abandoned'
    )),
    pgn TEXT DEFAULT '',
    fen_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    move_times JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_moves INTEGER NOT NULL DEFAULT 0,
    time_control VARCHAR(20) NOT NULL DEFAULT '10+0',
    start_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP WITH TIME ZONE NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN (
        'waiting', 'active', 'completed', 'aborted', 'paused', 'expired', 'cancelled'
    )),
    rated BOOLEAN NOT NULL DEFAULT TRUE,
    variant VARCHAR(20) NOT NULL DEFAULT 'standard' CHECK (variant IN ('standard', 'chess960')),
    tournament_id UUID NULL,
    eco_code VARCHAR(10) DEFAULT '',
    initial_fen TEXT DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    last_move_time TIMESTAMP WITH TIME ZONE NULL,
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. MOVES TABLE
CREATE TABLE IF NOT EXISTS moves (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    move_number INTEGER NOT NULL,
    fen_before TEXT NOT NULL,
    fen_after TEXT NOT NULL,
    san VARCHAR(10) NOT NULL,
    from_square VARCHAR(4) NOT NULL,
    to_square VARCHAR(4) NOT NULL,
    piece VARCHAR(2) NOT NULL,
    captured_piece VARCHAR(2) NULL,
    promotion_piece VARCHAR(2) NULL,
    is_check BOOLEAN NOT NULL DEFAULT FALSE,
    is_checkmate BOOLEAN NOT NULL DEFAULT FALSE,
    is_castle BOOLEAN NOT NULL DEFAULT FALSE,
    is_en_passant BOOLEAN NOT NULL DEFAULT FALSE,
    elapsed_time INTEGER NOT NULL DEFAULT 0,
    accuracy_score REAL NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. TOURNAMENTS TABLE
CREATE TABLE IF NOT EXISTS tournaments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(128) NOT NULL,
    type VARCHAR(20) NOT NULL DEFAULT 'swiss' CHECK (type IN ('swiss', 'round_robin', 'elimination', 'arena')),
    max_players INTEGER NOT NULL DEFAULT 16,
    current_round INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE NULL,
    time_control VARCHAR(20) NOT NULL DEFAULT '10+0',
    prize_pool NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    entry_fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    settings JSONB NOT NULL DEFAULT '{"rounds": 4, "tiebreak": "sonneborn_berger"}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. TOURNAMENT PARTICIPANTS
CREATE TABLE IF NOT EXISTS tournament_participants (
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    tiebreak_score NUMERIC(7, 2) NOT NULL DEFAULT 0.0,
    eliminated BOOLEAN NOT NULL DEFAULT FALSE,
    current_position INTEGER NOT NULL DEFAULT 1,
    games_played INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (tournament_id, user_id)
);

-- 8. TOURNAMENT PAIRINGS
CREATE TABLE IF NOT EXISTS tournament_pairings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
    round INTEGER NOT NULL,
    white_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
    black_player_id UUID REFERENCES users(id) ON DELETE SET NULL,
    game_id UUID REFERENCES games(id) ON DELETE SET NULL,
    result VARCHAR(10) NULL,
    is_bye BOOLEAN NOT NULL DEFAULT FALSE,
    board_number INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. CHAT MESSAGES
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message TEXT NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. GAME ANALYSIS
CREATE TABLE IF NOT EXISTS game_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    accuracy_white REAL NOT NULL DEFAULT 0.0,
    accuracy_black REAL NOT NULL DEFAULT 0.0,
    blunders INTEGER NOT NULL DEFAULT 0,
    mistakes INTEGER NOT NULL DEFAULT 0,
    inaccuracies INTEGER NOT NULL DEFAULT 0,
    best_moves INTEGER NOT NULL DEFAULT 0,
    analysis_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. PLAYER STATS HISTORY
CREATE TABLE IF NOT EXISTS player_stats_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    elo_rating INTEGER NOT NULL,
    games_played INTEGER NOT NULL DEFAULT 0,
    games_won INTEGER NOT NULL DEFAULT 0,
    games_lost INTEGER NOT NULL DEFAULT 0,
    games_drawn INTEGER NOT NULL DEFAULT 0,
    win_rate REAL NOT NULL DEFAULT 0.0,
    CONSTRAINT unique_user_daily_stat UNIQUE (user_id, date)
);

-- 12. ACHIEVEMENTS
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    achievement_type VARCHAR(64) NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    progress INTEGER NOT NULL DEFAULT 100,
    CONSTRAINT unique_user_achievement UNIQUE (user_id, achievement_type)
);

-- 13. ACTIVITY FEED
CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(64) NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. PLAYER NOTES
CREATE TABLE IF NOT EXISTS player_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_note UNIQUE (user_id, target_user_id)
);

-- 15. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(32) NOT NULL,
    message TEXT NOT NULL,
    data JSONB NOT NULL DEFAULT '{}'::jsonb,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. CHEAT FLAGS
CREATE TABLE IF NOT EXISTS cheat_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    game_id UUID REFERENCES games(id) ON DELETE SET NULL,
    player_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    flagged_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'confirmed', 'false_positive'))
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_users_elo ON users(elo_rating DESC);
CREATE INDEX IF NOT EXISTS idx_games_code ON games(game_code);
CREATE INDEX IF NOT EXISTS idx_games_status ON games(status);
CREATE INDEX IF NOT EXISTS idx_moves_game ON moves(game_id, move_number);
