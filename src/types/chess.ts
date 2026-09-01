export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export type BoardThemeId = 'obsidian' | 'one-piece' | 'aot' | 'wall-maria' | 'batman' | 'gotham-city' | 'classic' | 'peshmerga' | 'ukh' | 'emerald' | 'wood' | 'ocean' | 'midnight' | 'marble' | 'custom';
export type PieceThemeId = 'one-piece' | 'aot' | 'batman' | 'classic' | 'peshmerga' | 'ukh' | 'crystal_neon' | 'fide_3d' | 'neo' | 'alpha' | 'vintage';

export type GameMode = 'ai' | 'pass_and_play' | 'daily_puzzle' | 'puzzle' | 'analysis' | 'online_match' | 'multiplayer' | 'authoring' | 'logging' | 'database' | 'login' | 'profile_page';

export interface AuthoredPuzzle {
  id: string;
  title: string;
  description: string;
  theme: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Master';
  rating: number;
  fen: string;
  playerColor: PieceColor;
  solutionMoves: string[];
  hints?: string[];
  authorUid?: string;
  authorName: string;
  authorBadge?: string;
  createdAt: string;
  likesCount?: number;
  solvesCount?: number;
  isPublished?: boolean;
}

export interface MatchLogRecord {
  id: string;
  date: string;
  mode: GameMode;
  opponentName: string;
  opponentAvatar?: string;
  opponentElo?: number;
  playerColor: PieceColor;
  result: 'win' | 'loss' | 'draw' | 'executed' | 'mercied';
  reason: string;
  movesCount: number;
  timeControlName: string;
  pgn: string;
  finalFen: string;
  respectChange: number;
  eloChange: number;
  accuracy?: number;
}

export type UserRole = 'super_admin' | 'owner' | 'developer' | 'admin' | 'grandmaster' | 'moderator' | 'player' | 'member' | 'vip';

export interface UserPermissions {
  canCustomizeAboutUs?: boolean;
  canModerateChat?: boolean;
  canManageTournaments?: boolean;
  canGrantBadges?: boolean;
  canAccessDevTelemetry?: boolean;
}

export interface AboutUsConfig {
  appName: string;
  tagline: string;
  founderNote: string;
  visionParagraphs: string;
  socialLinks: {
    discord?: string;
    github?: string;
    twitter?: string;
    telegram?: string;
    youtube?: string;
  };
  credits: string;
  announcementBanner?: string;
  lastUpdated?: any;
}

export interface SystemConfig {
  maintenanceMode: boolean;
  aboutUs?: AboutUsConfig;
}

export interface DailyPuzzleProgress {
  dateKey: string; // "YYYY-MM-DD"
  solved: boolean;
  streak: number;
  lastSolvedDate: string;
  totalDailySolved: number;
  solvedDates?: string[];
}

export interface FriendUser {
  uid: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  elo: number;
  respectPoints: number;
  honorRank: string;
  rankBadge: string;
  role?: UserRole;
  badgeNumber?: number;
  isPublic?: boolean;
  isOnline?: boolean;
  lastSeen?: string;
}

export interface FriendRequestItem {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUsername?: string;
  fromUserAvatar?: string;
  fromUserElo: number;
  fromUserHonorRank: string;
  toUserId: string;
  toUsername?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface DirectMessageItem {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  senderBadge?: string;
  text: string;
  challengeData?: {
    matchId: string;
    timeControlName: string;
    timeControlSeconds: number;
    challengerColor: 'w' | 'b' | 'random';
    status: 'pending' | 'accepted' | 'declined' | 'expired';
  };
  createdAt: string;
}

export interface OnlineMatchPlayer {
  uid: string;
  displayName: string;
  username?: string;
  photoURL?: string;
  avatar?: string;
  elo: number;
  respectPoints?: number;
  honorRank?: string;
  rankBadge?: string;
  country?: string;
  flag?: string;
  isBot?: boolean;
  botId?: string;
}

export type OnlineMatchStatus = 'waiting' | 'in_progress' | 'checkmate' | 'resigned' | 'draw' | 'timeout' | 'aborted';

export interface OnlineMatchClock {
  whiteMs: number;
  blackMs: number;
  incrementMs: number;
  turnStartedAt: number;
  running: boolean;
}

export interface OnlineMatchSession {
  id: string;
  hostId: string;
  guestId?: string;
  whitePlayer: OnlineMatchPlayer;
  blackPlayer: OnlineMatchPlayer;
  fen: string;
  startFen?: string;
  pgn: string;
  moves?: string[];
  ucis?: string[];
  moveCount?: number;
  turn: 'w' | 'b';
  status: OnlineMatchStatus;
  winner: 'w' | 'b' | 'draw' | null;
  reason?: string;
  timeControl: TimeControl;
  clock?: OnlineMatchClock;
  vsBot?: boolean;
  isRated?: boolean;
  drawDeclinedAt?: number | null;
  rematchMatchId?: string | null;
  lastMoveBy?: string | null;
  lastMoveSan?: string | null;
  whiteSeenAt?: number;
  blackSeenAt?: number;
  endedAt?: number | null;
  whiteSecondsRemaining: number;
  blackSecondsRemaining: number;
  lastMoveTimestamp?: number;
  lastMoveFrom?: string;
  lastMoveTo?: string;
  drawOfferFrom?: string | null;
  rematchOfferFrom?: string | null;
  createdAt: string;
  updatedAt?: string;
  tournamentId?: string;
  tournamentMatchId?: string;
}

export interface RespectProfile {
  elo: number | string;
  respectPoints: number | string;
  executions: number | string;
  merciesGranted: number | string;
  gamesPlayed: number;
  wins: number;
  honorRank: string;
  rankBadge: string;
  role?: UserRole;
  badgeNumber?: number;
  isPublic?: boolean;
  customBadge?: string;
  isOwner?: boolean;
  isAdmin?: boolean;
  isImmortal?: boolean;
}

export interface RespectLeaderboardEntry {
  id: string;
  rank: number | string;
  username: string;
  title?: string;
  country: string;
  flag: string;
  respectPoints: number | string;
  elo: number | string;
  executions: number | string;
  mercies: number | string;
  avatar: string;
  isCurrentUser?: boolean;
  isImmortal?: boolean;
  role?: UserRole;
  badgeNumber?: number;
  isPublic?: boolean;
  badgeTag?: string;
}

export interface UserFeedback {
  id: string;
  userId?: string;
  userEmail?: string;
  userName: string;
  userBadge?: string;
  category: 'feature' | 'bug' | 'chess_engine' | 'theme_lore' | 'general';
  rating: number;
  title: string;
  message: string;
  status: 'pending' | 'reviewed' | 'resolved';
  developerNote?: string;
  createdAt?: any;
}

export interface TournamentPlayer {
  uid: string;
  displayName: string;
  elo: number;
  avatar?: string;
  rankBadge?: string;
}

export interface TournamentMatchNode {
  id: string;
  round: number;
  player1: TournamentPlayer | null;
  player2: TournamentPlayer | null;
  winnerId: string | null;
  matchSessionId: string | null;
  nextMatchId: string | null;
  status: 'pending' | 'ready' | 'in_progress' | 'completed';
}

export interface Tournament {
  id: string;
  name: string;
  creatorId: string;
  creatorName: string;
  status: 'registration' | 'in_progress' | 'completed';
  maxPlayers: number;
  players: TournamentPlayer[];
  timeControl: TimeControl;
  matches: TournamentMatchNode[];
  winnerId?: string;
  createdAt: string;
}

export interface TimeControl {
  id: string;
  name: string;
  initialSeconds: number;
  incrementSeconds: number;
  category: 'bullet' | 'blitz' | 'rapid' | 'classical' | 'unlimited';
}

export interface BotProfile {
  id: string;
  name: string;
  title: string;
  elo: number;
  avatar: string;
  description: string;
  depth: number;
  randomness: number;
  style: string;
  badgeColor: string;
}

export type MoveClassification = 'brilliant' | 'best' | 'good' | 'inaccuracy' | 'mistake' | 'blunder' | 'book';

export interface MoveLog {
  san: string;
  from: string;
  to: string;
  piece: PieceType;
  color: PieceColor;
  captured?: PieceType;
  promotion?: PieceType;
  fen: string;
  evaluation?: number;
  classification?: MoveClassification;
  timeSpent?: number;
}

export interface Puzzle {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Master';
  rating: number;
  fen: string;
  solutionMoves: string[]; // e.g. ["Qxf7#"] or ["Nf6+", "Kh8", "Qxh7#"]
  theme: string;
  description: string;
  playerColor: PieceColor;
}

export interface GameResult {
  winner: 'w' | 'b' | 'draw' | null;
  reason: string;
}

export interface AppSettings {
  sound: boolean;
  volume: number;
  showLegalMoves: boolean;
  autoQueen: boolean;
  flipBoard: boolean;
  boardTheme: BoardThemeId;
  uiThemeId?: string;
  pieceTheme: PieceThemeId;
  whitePieceTheme?: PieceThemeId;
  blackPieceTheme?: PieceThemeId;
  crossoverEnabled?: boolean;
  showCoordinates: boolean;
  highlightLastMove: boolean;
  showEvalBar: boolean;
  showMoveArrows: boolean;
}

export interface OpeningInfo {
  eco: string;
  name: string;
  variation?: string;
}

export type NotificationType = 'challenge' | 'friend_request' | 'achievement' | 'system';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
  actionData?: {
    matchId?: string;
    challengerId?: string;
    challengerName?: string;
    challengerAvatar?: string;
    timeControlName?: string;
    timeControlSeconds?: number;
    status?: 'pending' | 'accepted' | 'declined' | 'expired';
    expiresAt?: number;
  };
}
