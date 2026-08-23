import { Chess, Square, Move } from 'chess.js';
import { BotProfile, TimeControl, PieceType, PieceColor, MoveClassification } from '../types/chess';

export const BOT_PROFILES: BotProfile[] = [
  {
    id: 'bot-pawn',
    name: 'Pawn Cadet',
    title: 'Novice',
    elo: 400,
    avatar: '🐣',
    description: 'Enthusiastic beginner. Plays quickly with basic captures, occasionally misses tactics.',
    depth: 1,
    randomness: 0.45,
    style: 'Casual & Relaxed',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  },
  {
    id: 'bot-knight',
    name: 'Knight Errant',
    title: 'Apprentice',
    elo: 900,
    avatar: '🛡️',
    description: 'Understands basic forks and development. Solid defender against direct attacks.',
    depth: 2,
    randomness: 0.25,
    style: 'Active Pieces',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
  },
  {
    id: 'bot-bishop',
    name: 'Bishop Tactician',
    title: 'Intermediate',
    elo: 1400,
    avatar: '⚔️',
    description: 'Sharp eye for pins, skewers, and diagonal assaults. Controls central outposts.',
    depth: 3,
    randomness: 0.1,
    style: 'Tactical & Aggressive',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  },
  {
    id: 'bot-rook',
    name: 'Rook Mastermind',
    title: 'Master',
    elo: 1850,
    avatar: '🏰',
    description: 'Deep strategic planning, open file control, king safety calculations.',
    depth: 4,
    randomness: 0.02,
    style: 'Positional Precision',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
  },
  {
    id: 'bot-queen',
    name: 'Grandmaster DeepAI',
    title: 'Grandmaster',
    elo: 2300,
    avatar: '👑',
    description: 'Ruthless positional and tactical calculation with alpha-beta pruning & endgame mastery.',
    depth: 5,
    randomness: 0.0,
    style: 'Universal Champion',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
  }
];

export const TIME_CONTROLS: TimeControl[] = [
  { id: 'bullet-1', name: '1 min', initialSeconds: 60, incrementSeconds: 0, category: 'bullet' },
  { id: 'bullet-2-1', name: '2 | 1', initialSeconds: 120, incrementSeconds: 1, category: 'bullet' },
  { id: 'blitz-3', name: '3 min', initialSeconds: 180, incrementSeconds: 0, category: 'blitz' },
  { id: 'blitz-5', name: '5 min', initialSeconds: 300, incrementSeconds: 0, category: 'blitz' },
  { id: 'blitz-5-3', name: '5 | 3', initialSeconds: 300, incrementSeconds: 3, category: 'blitz' },
  { id: 'rapid-10', name: '10 min', initialSeconds: 600, incrementSeconds: 0, category: 'rapid' },
  { id: 'rapid-15-10', name: '15 | 10', initialSeconds: 900, incrementSeconds: 10, category: 'rapid' },
  { id: 'classical-30', name: '30 min', initialSeconds: 1800, incrementSeconds: 0, category: 'classical' },
  { id: 'unlimited', name: 'Unlimited', initialSeconds: 0, incrementSeconds: 0, category: 'unlimited' }
];

// Piece values in centipawns
const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// Piece Square Tables (White's perspective; Black's is inverted)
const PAWN_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0
];

const KNIGHT_TABLE = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50
];

const BISHOP_TABLE = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20
];

const ROOK_TABLE = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
 -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0
];

const QUEEN_TABLE = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
   -5,  0,  5,  5,  5,  5,  0, -5,
    0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20
];

const KING_TABLE_MID = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
   20, 20,  0,  0,  0,  0, 20, 20,
   20, 30, 10,  0,  0, 10, 30, 20
];

function getSquareIndex(square: Square): number {
  const file = square.charCodeAt(0) - 'a'.charCodeAt(0);
  const rank = 8 - parseInt(square[1], 10);
  return rank * 8 + file;
}

export function evaluateBoard(game: Chess): number {
  if (game.isCheckmate()) {
    return game.turn() === 'w' ? -99999 : 99999;
  }
  if (game.isDraw() || game.isStalemate() || game.isThreefoldRepetition() || game.isInsufficientMaterial()) {
    return 0;
  }

  let whiteScore = 0;
  let blackScore = 0;
  const board = game.board();

  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (!piece) continue;

      const pieceVal = PIECE_VALUES[piece.type as PieceType];
      const sqIndexWhite = r * 8 + f;
      const sqIndexBlack = (7 - r) * 8 + f;

      let posBonus = 0;
      switch (piece.type) {
        case 'p':
          posBonus = piece.color === 'w' ? PAWN_TABLE[sqIndexWhite] : PAWN_TABLE[sqIndexBlack];
          break;
        case 'n':
          posBonus = piece.color === 'w' ? KNIGHT_TABLE[sqIndexWhite] : KNIGHT_TABLE[sqIndexBlack];
          break;
        case 'b':
          posBonus = piece.color === 'w' ? BISHOP_TABLE[sqIndexWhite] : BISHOP_TABLE[sqIndexBlack];
          break;
        case 'r':
          posBonus = piece.color === 'w' ? ROOK_TABLE[sqIndexWhite] : ROOK_TABLE[sqIndexBlack];
          break;
        case 'q':
          posBonus = piece.color === 'w' ? QUEEN_TABLE[sqIndexWhite] : QUEEN_TABLE[sqIndexBlack];
          break;
        case 'k':
          posBonus = piece.color === 'w' ? KING_TABLE_MID[sqIndexWhite] : KING_TABLE_MID[sqIndexBlack];
          break;
      }

      if (piece.color === 'w') {
        whiteScore += pieceVal + posBonus;
      } else {
        blackScore += pieceVal + posBonus;
      }
    }
  }

  return (whiteScore - blackScore) / 100;
}

// Alpha-Beta search for best move
export function findBestMove(
  game: Chess,
  depth: number,
  isWhite: boolean,
  alpha: number = -Infinity,
  beta: number = Infinity
): { move: Move | null; score: number } {
  if (depth <= 0 || game.isGameOver()) {
    return { move: null, score: evaluateBoard(game) };
  }

  const legalMoves = game.moves({ verbose: true });
  if (legalMoves.length === 0) {
    return { move: null, score: evaluateBoard(game) };
  }

  // Move ordering: sort captures and checks first to optimize alpha-beta cutoff
  legalMoves.sort((a, b) => {
    const aVal = a.captured ? PIECE_VALUES[a.captured as PieceType] : 0;
    const bVal = b.captured ? PIECE_VALUES[b.captured as PieceType] : 0;
    const aCheck = a.san.includes('+') ? 50 : 0;
    const bCheck = b.san.includes('+') ? 50 : 0;
    return (bVal + bCheck) - (aVal + aCheck);
  });

  // Limit moves searched at deeper plies for performance
  const movesToSearch = depth > 2 ? legalMoves.slice(0, 16) : legalMoves;
  let bestMove: Move | null = legalMoves[0];

  if (isWhite) {
    let maxEval = -Infinity;
    for (const move of movesToSearch) {
      try {
        game.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
        const evalResult = findBestMove(game, depth - 1, false, alpha, beta);
        game.undo();

        if (evalResult.score > maxEval) {
          maxEval = evalResult.score;
          bestMove = move;
        }
        alpha = Math.max(alpha, evalResult.score);
        if (beta <= alpha) break;
      } catch {
        // Safe fallback if move parsing fails
      }
    }
    return { move: bestMove, score: maxEval === -Infinity ? evaluateBoard(game) : maxEval };
  } else {
    let minEval = Infinity;
    for (const move of movesToSearch) {
      try {
        game.move({ from: move.from, to: move.to, promotion: move.promotion || 'q' });
        const evalResult = findBestMove(game, depth - 1, true, alpha, beta);
        game.undo();

        if (evalResult.score < minEval) {
          minEval = evalResult.score;
          bestMove = move;
        }
        beta = Math.min(beta, evalResult.score);
        if (beta <= alpha) break;
      } catch {
        // Safe fallback if move parsing fails
      }
    }
    return { move: bestMove, score: minEval === Infinity ? evaluateBoard(game) : minEval };
  }
}

// Get AI move based on bot profile
export function getBotMove(game: Chess, bot: BotProfile): Move | null {
  const legalMoves = game.moves({ verbose: true });
  if (legalMoves.length === 0) return null;

  // Add occasional blunders/randomness for lower rated bots
  if (Math.random() < bot.randomness) {
    // Prefer captures if available for casual bot
    const captures = legalMoves.filter(m => !!m.captured);
    if (captures.length > 0 && Math.random() < 0.6) {
      return captures[Math.floor(Math.random() * captures.length)];
    }
    return legalMoves[Math.floor(Math.random() * legalMoves.length)];
  }

  const isWhite = game.turn() === 'w';
  // Clamp depth to 3 plies with move ordering for fast (~30ms) responses
  const effectiveDepth = Math.min(3, Math.max(1, bot.depth));
  const engineGame = new Chess(game.fen());
  const result = findBestMove(engineGame, effectiveDepth, isWhite);
  return result.move || legalMoves[0];
}

// Calculate captured pieces & material difference
export interface CapturedMaterialState {
  capturedByWhite: PieceType[];
  capturedByBlack: PieceType[];
  materialDifference: number; // Positive = White ahead, Negative = Black ahead
}

export function getCapturedMaterial(game: Chess): CapturedMaterialState {
  const startingCounts: Record<PieceColor, Record<PieceType, number>> = {
    w: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 },
    b: { p: 8, n: 2, b: 2, r: 2, q: 1, k: 1 }
  };

  const currentCounts: Record<PieceColor, Record<PieceType, number>> = {
    w: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 },
    b: { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
  };

  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let f = 0; f < 8; f++) {
      const piece = board[r][f];
      if (piece) {
        currentCounts[piece.color as PieceColor][piece.type as PieceType]++;
      }
    }
  }

  const capturedByWhite: PieceType[] = [];
  const capturedByBlack: PieceType[] = [];

  const pieceOrder: PieceType[] = ['q', 'r', 'b', 'n', 'p'];

  let whitePoints = 0;
  let blackPoints = 0;

  for (const p of pieceOrder) {
    const blackLost = startingCounts.b[p] - currentCounts.b[p];
    for (let i = 0; i < blackLost; i++) {
      capturedByWhite.push(p);
      whitePoints += PIECE_VALUES[p];
    }

    const whiteLost = startingCounts.w[p] - currentCounts.w[p];
    for (let i = 0; i < whiteLost; i++) {
      capturedByBlack.push(p);
      blackPoints += PIECE_VALUES[p];
    }
  }

  const materialDiffCentipawns = whitePoints - blackPoints;
  const materialDiffPawns = Math.round(materialDiffCentipawns / 100);

  return {
    capturedByWhite,
    capturedByBlack,
    materialDifference: materialDiffPawns
  };
}

// Classify move quality
export function classifyMove(
  prevEval: number,
  newEval: number,
  isWhite: boolean,
  isCapture: boolean,
  isCheckmate: boolean
): MoveClassification {
  if (isCheckmate) return 'brilliant';

  const evalDelta = isWhite ? newEval - prevEval : prevEval - newEval;

  if (evalDelta >= 2.5 && isCapture) return 'brilliant';
  if (evalDelta >= -0.2) return 'best';
  if (evalDelta >= -0.7) return 'good';
  if (evalDelta >= -1.8) return 'inaccuracy';
  if (evalDelta >= -3.5) return 'mistake';
  return 'blunder';
}
