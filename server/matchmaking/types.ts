// Shared types for the matchmaking engine. Importable by server
// modules and by tests.

export interface QueuePlayer {
  socketId: string;
  uid: string;
  rating: number;
  rd: number;
  ping: number;
  pool: string;
  rated: boolean;
  recentColors: ('w' | 'b')[];
  joinedAt: number;
}

export type MatchStatus =
  | 'waiting'
  | 'starting'
  | 'active'
  | 'completed'
  | 'aborted'
  | 'resigned'
  | 'timeout'
  | 'checkmate'
  | 'stalemate'
  | 'draw'
  | 'expired'
  | 'cancelled';

export interface TimeControl {
  name: string;
  initialSeconds: number;
  incrementSeconds: number;
}

export interface MatchSession {
  matchId: string;
  gameCode: string;
  whiteUid: string;
  blackUid: string;
  whiteName?: string;
  blackName?: string;
  whiteRating?: number;
  blackRating?: number;
  whiteSocketId?: string;
  blackSocketId?: string;
  pool: string;
  rated: boolean;
  timeControl: TimeControl;
  status: MatchStatus;
  createdAt: number;
  lastMoveAt: number;
  lastTimerTick?: number;
  whiteSecondsRemaining: number;
  blackSecondsRemaining: number;
  movesCount: number;
  movesList: Array<{
    from: string;
    to: string;
    san: string;
    piece?: string;
    captured?: string;
    timestamp: number;
  }>;
  capturedByWhite: string[];
  capturedByBlack: string[];
  waitingTimer?: NodeJS.Timeout;
  abortTimer?: NodeJS.Timeout;
  gameInterval?: NodeJS.Timeout;
  reconnectTimeout?: NodeJS.Timeout;
  chess: import('chess.js').Chess;
  blurCountWhite: number;
  blurCountBlack: number;
  drawOfferedBy?: string | null;
  takebackOfferedBy?: string | null;
}
