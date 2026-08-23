/**
 * Tapered evaluation for the Chesskys PRO engine.
 *
 * Scores are in centipawns from the side-to-move's point of view (negamax
 * convention) and interpolate between a middlegame and an endgame score based
 * on remaining material ("game phase").
 */

import {
  BISHOP,
  BLACK,
  EMPTY,
  KING,
  KNIGHT,
  PAWN,
  Position,
  QUEEN,
  ROOK,
  WHITE,
  colorOf,
  pieceOf,
  typeOf
} from './board';

/* Material — middlegame / endgame */
export const MG_VALUE = [0, 82, 337, 365, 477, 1025, 0];
export const EG_VALUE = [0, 94, 281, 297, 512, 936, 0];

/** Simple centipawn values used for UI material counts and MVV-LVA. */
export const SIMPLE_VALUE = [0, 100, 320, 330, 500, 900, 20000];

const PHASE_WEIGHT = [0, 0, 1, 1, 2, 4, 0];
const TOTAL_PHASE = PHASE_WEIGHT[KNIGHT] * 4 + PHASE_WEIGHT[BISHOP] * 4 + PHASE_WEIGHT[ROOK] * 4 + PHASE_WEIGHT[QUEEN] * 2;

/* ------------------------------------------------------------------ *
 * Piece-square tables, written from White's perspective with rank 8 on
 * the first row (so they read like a board).
 * ------------------------------------------------------------------ */

const PAWN_MG = [
   0,   0,   0,   0,   0,   0,   0,   0,
  98, 134,  61,  95,  68, 126,  34, -11,
  -6,   7,  26,  31,  65,  56,  25, -20,
 -14,  13,   6,  21,  23,  12,  17, -23,
 -27,  -2,  -5,  12,  17,   6,  10, -25,
 -26,  -4,  -4, -10,   3,   3,  33, -12,
 -35,  -1, -20, -23, -15,  24,  38, -22,
   0,   0,   0,   0,   0,   0,   0,   0
];

const PAWN_EG = [
   0,   0,   0,   0,   0,   0,   0,   0,
 178, 173, 158, 134, 147, 132, 165, 187,
  94, 100,  85,  67,  56,  53,  82,  84,
  32,  24,  13,   5,  -2,   4,  17,  17,
  13,   9,  -3,  -7,  -7,  -8,   3,  -1,
   4,   7,  -6,   1,   0,  -5,  -1,  -8,
  13,   8,   8,  10,  13,   0,   2,  -7,
   0,   0,   0,   0,   0,   0,   0,   0
];

const KNIGHT_MG = [
-167, -89, -34, -49,  61, -97, -15,-107,
 -73, -41,  72,  36,  23,  62,   7, -17,
 -47,  60,  37,  65,  84, 129,  73,  44,
  -9,  17,  19,  53,  37,  69,  18,  22,
 -13,   4,  16,  13,  28,  19,  21,  -8,
 -23,  -9,  12,  10,  19,  17,  25, -16,
 -29, -53, -12,  -3,  -1,  18, -14, -19,
-105, -21, -58, -33, -17, -28, -19, -23
];

const KNIGHT_EG = [
 -58, -38, -13, -28, -31, -27, -63, -99,
 -25,  -8, -25,  -2,  -9, -25, -24, -52,
 -24, -20,  10,   9,  -1,  -9, -19, -41,
 -17,   3,  22,  22,  22,  11,   8, -18,
 -18,  -6,  16,  25,  16,  17,   4, -18,
 -23,  -3,  -1,  15,  10,  -3, -20, -22,
 -42, -20, -10,  -5,  -2, -20, -23, -44,
 -29, -51, -23, -15, -22, -18, -50, -64
];

const BISHOP_MG = [
 -29,   4, -82, -37, -25, -42,   7,  -8,
 -26,  16, -18, -13,  30,  59,  18, -47,
 -16,  37,  43,  40,  35,  50,  37,  -2,
  -4,   5,  19,  50,  37,  37,   7,  -2,
  -6,  13,  13,  26,  34,  12,  10,   4,
   0,  15,  15,  15,  14,  27,  18,  10,
   4,  15,  16,   0,   7,  21,  33,   1,
 -33,  -3, -14, -21, -13, -12, -39, -21
];

const BISHOP_EG = [
 -14, -21, -11,  -8,  -7,  -9, -17, -24,
  -8,  -4,   7, -12,  -3, -13,  -4, -14,
   2,  -8,   0,  -1,  -2,   6,   0,   4,
  -3,   9,  12,   9,  14,  10,   3,   2,
  -6,   3,  13,  19,   7,  10,  -3,  -9,
 -12,  -3,   8,  10,  13,   3,  -7, -15,
 -14, -18,  -7,  -1,   4,  -9, -15, -27,
 -23,  -9, -23,  -5,  -9, -16,  -5, -17
];

const ROOK_MG = [
  32,  42,  32,  51,  63,   9,  31,  43,
  27,  32,  58,  62,  80,  67,  26,  44,
  -5,  19,  26,  36,  17,  45,  61,  16,
 -24, -11,   7,  26,  24,  35,  -8, -20,
 -36, -26, -12,  -1,   9,  -7,   6, -23,
 -45, -25, -16, -17,   3,   0,  -5, -33,
 -44, -16, -20,  -9,  -1,  11,  -6, -71,
 -19, -13,   1,  17,  16,   7, -37, -26
];

const ROOK_EG = [
  13,  10,  18,  15,  12,  12,   8,   5,
  11,  13,  13,  11,  -3,   3,   8,   3,
   7,   7,   7,   5,   4,  -3,  -5,  -3,
   4,   3,  13,   1,   2,   1,  -1,   2,
   3,   5,   8,   4,  -5,  -6,  -8, -11,
  -4,   0,  -5,  -1,  -7, -12,  -8, -16,
  -6,  -6,   0,   2,  -9,  -9, -11,  -3,
  -9,   2,   3,  -1,  -5, -13,   4, -20
];

const QUEEN_MG = [
 -28,   0,  29,  12,  59,  44,  43,  45,
 -24, -39,  -5,   1, -16,  57,  28,  54,
 -13, -17,   7,   8,  29,  56,  47,  57,
 -27, -27, -16, -16,  -1,  17,  -2,   1,
  -9, -26,  -9, -10,  -2,  -4,   3,  -3,
 -14,   2, -11,  -2,  -5,   2,  14,   5,
 -35,  -8,  11,   2,   8,  15,  -3,   1,
  -1, -18,  -9,  10, -15, -25, -31, -50
];

const QUEEN_EG = [
  -9,  22,  22,  27,  27,  19,  10,  20,
 -17,  20,  32,  41,  58,  25,  30,   0,
 -20,   6,   9,  49,  47,  35,  19,   9,
   3,  22,  24,  45,  57,  40,  57,  36,
 -18,  28,  19,  47,  31,  34,  39,  23,
 -16, -27,  15,   6,   9,  17,  10,   5,
 -22, -23, -30, -16, -16, -23, -36, -32,
 -33, -28, -22, -43,  -5, -32, -20, -41
];

const KING_MG = [
 -65,  23,  16, -15, -56, -34,   2,  13,
  29,  -1, -20,  -7,  -8,  -4, -38, -29,
  -9,  24,   2, -16, -20,   6,  22, -22,
 -17, -20, -12, -27, -30, -25, -14, -36,
 -49,  -1, -27, -39, -46, -44, -33, -51,
 -14, -14, -22, -46, -44, -30, -15, -27,
   1,   7,  -8, -64, -43, -16,   9,   8,
 -15,  36,  12, -54,   8, -28,  24,  14
];

const KING_EG = [
 -74, -35, -18, -18, -11,  15,   4, -17,
 -12,  17,  14,  17,  17,  38,  23,  11,
  10,  17,  23,  15,  20,  45,  44,  13,
  -8,  22,  24,  27,  26,  33,  26,   3,
 -18,  -4,  21,  24,  27,  23,   9, -11,
 -19,  -3,  11,  21,  23,  16,   7,  -9,
 -27, -11,   4,  13,  14,   4,  -5, -17,
 -53, -34, -21, -11, -28, -14, -24, -43
];

const MG_TABLES = [null, PAWN_MG, KNIGHT_MG, BISHOP_MG, ROOK_MG, QUEEN_MG, KING_MG];
const EG_TABLES = [null, PAWN_EG, KNIGHT_EG, BISHOP_EG, ROOK_EG, QUEEN_EG, KING_EG];

/** Flattened [piece][square0x88] lookup tables, pre-mirrored per colour. */
const MG_PST = [new Int32Array(16 * 128), new Int32Array(16 * 128)];
const EG_PST = [new Int32Array(16 * 128), new Int32Array(16 * 128)];

for (let type = PAWN; type <= KING; type++) {
  const mg = MG_TABLES[type]!;
  const eg = EG_TABLES[type]!;
  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) continue;
    const rank = sq >> 4;
    const file = sq & 15;
    const whiteIndex = (7 - rank) * 8 + file;
    const blackIndex = rank * 8 + file;
    MG_PST[WHITE][type * 128 + sq] = mg[whiteIndex];
    EG_PST[WHITE][type * 128 + sq] = eg[whiteIndex];
    MG_PST[BLACK][type * 128 + sq] = mg[blackIndex];
    EG_PST[BLACK][type * 128 + sq] = eg[blackIndex];
  }
}

/* Positional bonuses */
const BISHOP_PAIR_MG = 28;
const BISHOP_PAIR_EG = 48;
const DOUBLED_PAWN_MG = -11;
const DOUBLED_PAWN_EG = -24;
const ISOLATED_PAWN_MG = -14;
const ISOLATED_PAWN_EG = -18;
const PASSED_PAWN_MG = [0, 4, 8, 18, 34, 62, 100, 0];
const PASSED_PAWN_EG = [0, 10, 18, 36, 62, 108, 160, 0];
const ROOK_OPEN_FILE = 26;
const ROOK_SEMI_OPEN_FILE = 12;
const ROOK_ON_SEVENTH = 22;
const KING_SHIELD_BONUS = 12;
const KING_OPEN_FILE_PENALTY = -22;
const TEMPO = 12;

const KNIGHT_MOBILITY = 4;
const BISHOP_MOBILITY = 5;
const ROOK_MOBILITY = 3;
const QUEEN_MOBILITY = 2;

const KNIGHT_OFFSETS = [33, 31, 18, 14, -33, -31, -18, -14];
const BISHOP_OFFSETS = [17, 15, -17, -15];
const ROOK_OFFSETS = [16, 1, -16, -1];
const ALL_OFFSETS = [17, 16, 15, 1, -17, -16, -15, -1];

export interface EvalBreakdown {
  total: number;
  material: number;
  positional: number;
  pawns: number;
  mobility: number;
  kingSafety: number;
  phase: number;
}

const fileCountsWhite = new Int32Array(8);
const fileCountsBlack = new Int32Array(8);
const mostAdvancedWhite = new Int32Array(8);
const mostAdvancedBlack = new Int32Array(8);

/**
 * Full evaluation. Returns centipawns from White's perspective when
 * `whitePov` is true, otherwise from the side to move's perspective.
 */
export function evaluate(pos: Position, whitePov = false, breakdown?: EvalBreakdown): number {
  const board = pos.board;

  let mgScore = 0;
  let egScore = 0;
  let phase = 0;

  let materialMg = 0;
  let positionalMg = 0;
  let mobilityScore = 0;
  let pawnScore = 0;
  let kingSafety = 0;

  fileCountsWhite.fill(0);
  fileCountsBlack.fill(0);
  mostAdvancedWhite.fill(-1);
  mostAdvancedBlack.fill(8);

  let bishopsWhite = 0;
  let bishopsBlack = 0;

  // Pass 1 — material, PST, pawn file bookkeeping
  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) {
      sq += 7;
      continue;
    }
    const piece = board[sq];
    if (piece === EMPTY) continue;

    const type = typeOf(piece);
    const color = colorOf(piece);
    const sign = color === WHITE ? 1 : -1;
    const file = sq & 15;
    const rank = sq >> 4;

    phase += PHASE_WEIGHT[type];

    const mg = MG_VALUE[type] + MG_PST[color][type * 128 + sq];
    const eg = EG_VALUE[type] + EG_PST[color][type * 128 + sq];
    mgScore += sign * mg;
    egScore += sign * eg;
    materialMg += sign * MG_VALUE[type];
    positionalMg += sign * MG_PST[color][type * 128 + sq];

    if (type === PAWN) {
      if (color === WHITE) {
        fileCountsWhite[file]++;
        if (rank > mostAdvancedWhite[file]) mostAdvancedWhite[file] = rank;
      } else {
        fileCountsBlack[file]++;
        if (rank < mostAdvancedBlack[file]) mostAdvancedBlack[file] = rank;
      }
    } else if (type === BISHOP) {
      if (color === WHITE) bishopsWhite++;
      else bishopsBlack++;
    }
  }

  if (bishopsWhite >= 2) {
    mgScore += BISHOP_PAIR_MG;
    egScore += BISHOP_PAIR_EG;
  }
  if (bishopsBlack >= 2) {
    mgScore -= BISHOP_PAIR_MG;
    egScore -= BISHOP_PAIR_EG;
  }

  // Pass 2 — pawn structure, mobility, rook placement, king safety
  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) {
      sq += 7;
      continue;
    }
    const piece = board[sq];
    if (piece === EMPTY) continue;

    const type = typeOf(piece);
    const color = colorOf(piece);
    const sign = color === WHITE ? 1 : -1;
    const file = sq & 15;
    const rank = sq >> 4;
    const ownPawns = color === WHITE ? fileCountsWhite : fileCountsBlack;
    const foePawns = color === WHITE ? fileCountsBlack : fileCountsWhite;

    switch (type) {
      case PAWN: {
        let mg = 0;
        let eg = 0;

        if (ownPawns[file] > 1) {
          mg += DOUBLED_PAWN_MG;
          eg += DOUBLED_PAWN_EG;
        }

        const leftEmpty = file === 0 || ownPawns[file - 1] === 0;
        const rightEmpty = file === 7 || ownPawns[file + 1] === 0;
        if (leftEmpty && rightEmpty) {
          mg += ISOLATED_PAWN_MG;
          eg += ISOLATED_PAWN_EG;
        }

        // Passed pawn: no enemy pawn ahead on this or adjacent files
        let passed = true;
        for (let f = Math.max(0, file - 1); f <= Math.min(7, file + 1); f++) {
          if (foePawns[f] === 0) continue;
          if (color === WHITE) {
            if (mostAdvancedBlack[f] > rank) {
              passed = false;
              break;
            }
          } else if (mostAdvancedWhite[f] < rank) {
            passed = false;
            break;
          }
        }
        if (passed) {
          const relativeRank = color === WHITE ? rank : 7 - rank;
          mg += PASSED_PAWN_MG[relativeRank];
          eg += PASSED_PAWN_EG[relativeRank];
        }

        mgScore += sign * mg;
        egScore += sign * eg;
        pawnScore += sign * mg;
        break;
      }

      case KNIGHT: {
        let moves = 0;
        for (let i = 0; i < 8; i++) {
          const t = sq + KNIGHT_OFFSETS[i];
          if (t & 0x88) continue;
          const target = board[t];
          if (target === EMPTY || colorOf(target) !== color) moves++;
        }
        const bonus = (moves - 4) * KNIGHT_MOBILITY;
        mgScore += sign * bonus;
        egScore += sign * bonus;
        mobilityScore += sign * bonus;
        break;
      }

      case BISHOP:
      case ROOK:
      case QUEEN: {
        const offsets = type === BISHOP ? BISHOP_OFFSETS : type === ROOK ? ROOK_OFFSETS : ALL_OFFSETS;
        const dirs = type === QUEEN ? 8 : 4;
        let moves = 0;
        for (let i = 0; i < dirs; i++) {
          const dir = offsets[i];
          let t = sq + dir;
          while (!(t & 0x88)) {
            const target = board[t];
            if (target === EMPTY) {
              moves++;
              t += dir;
              continue;
            }
            if (colorOf(target) !== color) moves++;
            break;
          }
        }
        const weight = type === BISHOP ? BISHOP_MOBILITY : type === ROOK ? ROOK_MOBILITY : QUEEN_MOBILITY;
        const base = type === BISHOP ? 6 : type === ROOK ? 7 : 14;
        const bonus = (moves - base) * weight;
        mgScore += sign * bonus;
        egScore += sign * bonus;
        mobilityScore += sign * bonus;

        if (type === ROOK) {
          let rookBonus = 0;
          if (ownPawns[file] === 0) {
            rookBonus += foePawns[file] === 0 ? ROOK_OPEN_FILE : ROOK_SEMI_OPEN_FILE;
          }
          const seventh = color === WHITE ? 6 : 1;
          if (rank === seventh) rookBonus += ROOK_ON_SEVENTH;
          mgScore += sign * rookBonus;
          egScore += sign * Math.round(rookBonus / 2);
        }
        break;
      }

      case KING: {
        // Pawn shield in front of the king (middlegame only)
        let shield = 0;
        const forward = color === WHITE ? 16 : -16;
        for (let df = -1; df <= 1; df++) {
          const f = file + df;
          if (f < 0 || f > 7) continue;
          const one = sq + forward + df;
          const two = sq + forward * 2 + df;
          if (!(one & 0x88) && board[one] === pieceOf(color, PAWN)) shield += KING_SHIELD_BONUS;
          else if (!(two & 0x88) && board[two] === pieceOf(color, PAWN)) shield += Math.round(KING_SHIELD_BONUS / 2);
          else if (ownPawns[f] === 0) shield += KING_OPEN_FILE_PENALTY;
        }
        mgScore += sign * shield;
        kingSafety += sign * shield;
        break;
      }
    }
  }

  const clampedPhase = Math.min(phase, TOTAL_PHASE);
  const mgWeight = clampedPhase / TOTAL_PHASE;
  const egWeight = 1 - mgWeight;
  let score = Math.round(mgScore * mgWeight + egScore * egWeight);

  // Tempo
  score += pos.side === WHITE ? TEMPO : -TEMPO;

  if (breakdown) {
    breakdown.total = score;
    breakdown.material = materialMg;
    breakdown.positional = positionalMg;
    breakdown.pawns = pawnScore;
    breakdown.mobility = mobilityScore;
    breakdown.kingSafety = kingSafety;
    breakdown.phase = Math.round(mgWeight * 100);
  }

  if (whitePov) return score;
  return pos.side === WHITE ? score : -score;
}

/** Material balance in centipawns from White's perspective (used for UI). */
export function materialBalance(pos: Position): number {
  let score = 0;
  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) {
      sq += 7;
      continue;
    }
    const piece = pos.board[sq];
    if (piece === EMPTY) continue;
    const value = SIMPLE_VALUE[typeOf(piece)];
    if (typeOf(piece) === KING) continue;
    score += colorOf(piece) === WHITE ? value : -value;
  }
  return score;
}

export const gamePhase = (pos: Position): number => {
  let phase = 0;
  for (let sq = 0; sq < 128; sq++) {
    if (sq & 0x88) {
      sq += 7;
      continue;
    }
    const piece = pos.board[sq];
    if (piece !== EMPTY) phase += PHASE_WEIGHT[typeOf(piece)];
  }
  return Math.min(1, phase / TOTAL_PHASE);
};
