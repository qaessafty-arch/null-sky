export type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export type BoardThemeId = 'peshmerga' | 'ukh' | 'emerald' | 'wood' | 'ocean' | 'midnight' | 'marble' | 'custom';
export type PieceThemeId = 'peshmerga' | 'ukh' | 'crystal_neon' | 'fide_3d' | 'classic' | 'neo' | 'alpha' | 'vintage';

export type GameMode = 'ai' | 'pass_and_play' | 'puzzle' | 'analysis' | 'online_match';

export type UserRole = 'owner' | 'developer' | 'admin' | 'grandmaster' | 'moderator' | 'member';

export interface DailyPuzzleProgress {
  dateKey: string; // "YYYY-MM-DD"
  solved: boolean;
  streak: number;
  lastSolvedDate: string;
  totalDailySolved: number;
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
}

export interface OnlineMatchSession {
  id: string;
  hostId: string;
  guestId?: string;
  whitePlayer: OnlineMatchPlayer;
  blackPlayer: OnlineMatchPlayer;
  fen: string;
  pgn: string;
  turn: 'w' | 'b';
  status: 'waiting' | 'in_progress' | 'checkmate' | 'resigned' | 'draw' | 'timeout' | 'aborted';
  winner: 'w' | 'b' | 'draw' | null;
  reason?: string;
  timeControl: TimeControl;
  whiteSecondsRemaining: number;
  blackSecondsRemaining: number;
  lastMoveTimestamp?: number;
  lastMoveFrom?: string;
  lastMoveTo?: string;
  drawOfferFrom?: string | null;
  rematchOfferFrom?: string | null;
  createdAt: string;
  updatedAt?: string;
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
