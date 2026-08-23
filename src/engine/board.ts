/**
 * Chesskys PRO — 0x88 board representation, legal move generator and Zobrist hashing.
 *
 * chess.js is used everywhere in the UI (PGN, SAN, validation) but it only sustains
 * a few thousand nodes/second, which caps any search at ~depth 3. This module is a
 * dedicated, allocation-free core used by the search worker.
 *
 * Correctness is verified with perft in `src/engine/perft.test.ts`.
 */

/* ------------------------------------------------------------------ *
 * Constants
 * ------------------------------------------------------------------ */

export const EMPTY = 0;
export const PAWN = 1;
export const KNIGHT = 2;
export const BISHOP = 3;
export const ROOK = 4;
export const QUEEN = 5;
export const KING = 6;

export const WHITE = 0;
export const BLACK = 1;

/** piece = type | (color << 3) → white 1..6, black 9..14 */
export const pieceOf = (color: number, type: number) => type | (color << 3);
export const typeOf = (piece: number) => piece & 7;
export const colorOf = (piece: number) => (piece >> 3) & 1;

export const CASTLE_WK = 1;
export const CASTLE_WQ = 2;
export const CASTLE_BK = 4;
export const CASTLE_BQ = 8;

export const A1 = 0;
export const E1 = 4;
export const H1 = 7;
export const A8 = 112;
export const E8 = 116;
export const H8 = 119;

const KNIGHT_OFFSETS = [33, 31, 18, 14, -33, -31, -18, -14];
const BISHOP_OFFSETS = [17, 15, -17, -15];
const ROOK_OFFSETS = [16, 1, -16, -1];
const KING_OFFSETS = [17, 16, 15, 1, -17, -16, -15, -1];

/* Move flags */
export const FLAG_QUIET = 0;
export const FLAG_CAPTURE = 1;
export const FLAG_DOUBLE_PUSH = 2;
export const FLAG_EP = 4;
export const FLAG_CASTLE_K = 8;
export const FLAG_CASTLE_Q = 16;
export const FLAG_PROMOTION = 32;

/* ------------------------------------------------------------------ *
 * Move encoding — packed into a single int32 so move lists can live in
 * preallocated Int32Arrays (zero GC pressure inside the search).
 *
 *   bits  0..6   from square (0x88 index, 0..119)
 *   bits  7..13  to square
 *   bits 14..16  promotion piece type (0 = none)
 *   bits 17..19  captured piece type (0 = none)
 *   bits 20..26  flags
 * ------------------------------------------------------------------ */

export const encodeMove = (
  from: number,
  to: number,
  promotion: number,
  captured: number,
  flags: number
) => from | (to << 7) | (promotion << 14) | (captured << 17) | (flags << 20);

export const moveFrom = (m: number) => m & 0x7f;
export const moveTo = (m: number) => (m >> 7) & 0x7f;
export const movePromotion = (m: number) => (m >> 14) & 7;
export const moveCaptured = (m: number) => (m >> 17) & 7;
export const moveFlags = (m: number) => (m >> 20) & 0x7f;
export const isCaptureMove = (m: number) => ((m >> 20) & FLAG_CAPTURE) !== 0;
export const isPromotionMove = (m: number) => ((m >> 20) & FLAG_PROMOTION) !== 0;

export const FILES = 'abcdefgh';
export const RANKS = '12345678';

export const squareToAlgebraic = (sq: number) => FILES[sq & 15] + RANKS[sq >> 4];

export const algebraicToSquare = (san: string): number => {
  const file = FILES.indexOf(san[0]);
  const rank = RANKS.indexOf(san[1]);
  if (file < 0 || rank < 0) return -1;
  return rank * 16 + file;
};

const PROMO_CHARS: Record<number, string> = { [KNIGHT]: 'n', [BISHOP]: 'b', [ROOK]: 'r', [QUEEN]: 'q' };
const CHAR_PROMO: Record<string, number> = { n: KNIGHT, b: BISHOP, r: ROOK, q: QUEEN };

export const moveToUci = (m: number) => {
  const promo = movePromotion(m);
  return squareToAlgebraic(moveFrom(m)) + squareToAlgebraic(moveTo(m)) + (promo ? PROMO_CHARS[promo] : '');
};

/* ------------------------------------------------------------------ *
 * Zobrist hashing (two 32-bit halves — JS bitwise ops are 32-bit)
 * ------------------------------------------------------------------ */

let rngState = 0x1a2b3c4d;
const nextRandom = () => {
  // xorshift32 — deterministic so hashes are stable across sessions/threads
  rngState ^= rngState << 13;
  rngState ^= rngState >>> 17;
  rngState ^= rngState << 5;
  return rngState | 0;
};

const ZOBRIST_PIECE_LO = new Int32Array(16 * 128);
const ZOBRIST_PIECE_HI = new Int32Array(16 * 128);
const ZOBRIST_CASTLE_LO = new Int32Array(16);
const ZOBRIST_CASTLE_HI = new Int32Array(16);
const ZOBRIST_EP_LO = new Int32Array(128);
const ZOBRIST_EP_HI = new Int32Array(128);
let ZOBRIST_SIDE_LO = 0;
let ZOBRIST_SIDE_HI = 0;

(() => {
  for (let i = 0; i < ZOBRIST_PIECE_LO.length; i++) {
    ZOBRIST_PIECE_LO[i] = nextRandom();
    ZOBRIST_PIECE_HI[i] = nextRandom();
  }
  for (let i = 0; i < 16; i++) {
    ZOBRIST_CASTLE_LO[i] = nextRandom();
    ZOBRIST_CASTLE_HI[i] = nextRandom();
  }
  for (let i = 0; i < 128; i++) {
    ZOBRIST_EP_LO[i] = nextRandom();
    ZOBRIST_EP_HI[i] = nextRandom();
  }
  ZOBRIST_SIDE_LO = nextRandom();
  ZOBRIST_SIDE_HI = nextRandom();
})();

/* ------------------------------------------------------------------ *
 * Position
 * ------------------------------------------------------------------ */

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const MAX_PLY = 128;

interface UndoRecord {
  move: number;
  castling: number;
  ep: number;
  halfmove: number;
  hashLo: number;
  hashHi: number;
}

export class Position {
  board = new Uint8Array(128);
  side = WHITE;
  castling = 0;
  ep = -1;
  halfmove = 0;
  fullmove = 1;
  kingSquare = new Int32Array(2);
  hashLo = 0;
  hashHi = 0;

  /** hashes of every position reached, for repetition detection */
  history: UndoRecord[] = [];
  repetitionLo: number[] = [];
  repetitionHi: number[] = [];

  constructor(fen: string = START_FEN) {
    this.loadFen(fen);
  }

  clone(): Position {
    const p = new Position(this.fen());
    p.repetitionLo = this.repetitionLo.slice();
    p.repetitionHi = this.repetitionHi.slice();
    return p;
  }

  loadFen(fen: string) {
    this.board.fill(EMPTY);
    this.castling = 0;
    this.ep = -1;
    this.halfmove = 0;
    this.fullmove = 1;
    this.history.length = 0;
    this.repetitionLo.length = 0;
    this.repetitionHi.length = 0;

    const parts = fen.trim().split(/\s+/);
    const [placement, side = 'w', castling = '-', epField = '-', half = '0', full = '1'] = parts;

    let rank = 7;
    let file = 0;
    for (const ch of placement) {
      if (ch === '/') {
        rank--;
        file = 0;
      } else if (ch >= '1' && ch <= '8') {
        file += ch.charCodeAt(0) - 48;
      } else {
        const lower = ch.toLowerCase();
        const type =
          lower === 'p' ? PAWN
          : lower === 'n' ? KNIGHT
          : lower === 'b' ? BISHOP
          : lower === 'r' ? ROOK
          : lower === 'q' ? QUEEN
          : KING;
        const color = ch === lower ? BLACK : WHITE;
        const sq = rank * 16 + file;
        this.board[sq] = pieceOf(color, type);
        if (type === KING) this.kingSquare[color] = sq;
        file++;
      }
    }

    this.side = side === 'w' ? WHITE : BLACK;
    if (castling.includes('K')) this.castling |= CASTLE_WK;
    if (castling.includes('Q')) this.castling |= CASTLE_WQ;
    if (castling.includes('k')) this.castling |= CASTLE_BK;
    if (castling.includes('q')) this.castling |= CASTLE_BQ;
    this.ep = epField !== '-' ? algebraicToSquare(epField) : -1;
    this.halfmove = parseInt(half, 10) || 0;
    this.fullmove = parseInt(full, 10) || 1;

    this.computeHash();
    this.repetitionLo.push(this.hashLo);
    this.repetitionHi.push(this.hashHi);
  }

  fen(): string {
    let placement = '';
    for (let rank = 7; rank >= 0; rank--) {
      let empty = 0;
      for (let file = 0; file < 8; file++) {
        const piece = this.board[rank * 16 + file];
        if (piece === EMPTY) {
          empty++;
        } else {
          if (empty) {
            placement += empty;
            empty = 0;
          }
          const letter = ' pnbrqk'[typeOf(piece)];
          placement += colorOf(piece) === WHITE ? letter.toUpperCase() : letter;
        }
      }
      if (empty) placement += empty;
      if (rank > 0) placement += '/';
    }

    let castling = '';
    if (this.castling & CASTLE_WK) castling += 'K';
    if (this.castling & CASTLE_WQ) castling += 'Q';
    if (this.castling & CASTLE_BK) castling += 'k';
    if (this.castling & CASTLE_BQ) castling += 'q';
    if (!castling) castling = '-';

    return [
      placement,
      this.side === WHITE ? 'w' : 'b',
      castling,
      this.ep >= 0 ? squareToAlgebraic(this.ep) : '-',
      this.halfmove,
      this.fullmove
    ].join(' ');
  }

  computeHash() {
    let lo = 0;
    let hi = 0;
    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) continue;
      const piece = this.board[sq];
      if (piece !== EMPTY) {
        const idx = piece * 128 + sq;
        lo ^= ZOBRIST_PIECE_LO[idx];
        hi ^= ZOBRIST_PIECE_HI[idx];
      }
    }
    lo ^= ZOBRIST_CASTLE_LO[this.castling];
    hi ^= ZOBRIST_CASTLE_HI[this.castling];
    if (this.ep >= 0) {
      lo ^= ZOBRIST_EP_LO[this.ep];
      hi ^= ZOBRIST_EP_HI[this.ep];
    }
    if (this.side === BLACK) {
      lo ^= ZOBRIST_SIDE_LO;
      hi ^= ZOBRIST_SIDE_HI;
    }
    this.hashLo = lo;
    this.hashHi = hi;
  }

  private togglePiece(piece: number, sq: number) {
    const idx = piece * 128 + sq;
    this.hashLo ^= ZOBRIST_PIECE_LO[idx];
    this.hashHi ^= ZOBRIST_PIECE_HI[idx];
  }

  /* ---------------------------------------------------------------- *
   * Attack detection
   * ---------------------------------------------------------------- */

  /** Is `sq` attacked by any piece of `bySide`? */
  isAttacked(sq: number, bySide: number): boolean {
    const board = this.board;

    // Pawns
    const pawn = pieceOf(bySide, PAWN);
    if (bySide === WHITE) {
      const a = sq - 17;
      const b = sq - 15;
      if (!(a & 0x88) && board[a] === pawn) return true;
      if (!(b & 0x88) && board[b] === pawn) return true;
    } else {
      const a = sq + 17;
      const b = sq + 15;
      if (!(a & 0x88) && board[a] === pawn) return true;
      if (!(b & 0x88) && board[b] === pawn) return true;
    }

    // Knights
    const knight = pieceOf(bySide, KNIGHT);
    for (let i = 0; i < 8; i++) {
      const t = sq + KNIGHT_OFFSETS[i];
      if (!(t & 0x88) && board[t] === knight) return true;
    }

    // King
    const king = pieceOf(bySide, KING);
    for (let i = 0; i < 8; i++) {
      const t = sq + KING_OFFSETS[i];
      if (!(t & 0x88) && board[t] === king) return true;
    }

    // Bishops / queens (diagonals)
    const bishop = pieceOf(bySide, BISHOP);
    const queen = pieceOf(bySide, QUEEN);
    for (let i = 0; i < 4; i++) {
      const dir = BISHOP_OFFSETS[i];
      let t = sq + dir;
      while (!(t & 0x88)) {
        const piece = board[t];
        if (piece !== EMPTY) {
          if (piece === bishop || piece === queen) return true;
          break;
        }
        t += dir;
      }
    }

    // Rooks / queens (orthogonals)
    const rook = pieceOf(bySide, ROOK);
    for (let i = 0; i < 4; i++) {
      const dir = ROOK_OFFSETS[i];
      let t = sq + dir;
      while (!(t & 0x88)) {
        const piece = board[t];
        if (piece !== EMPTY) {
          if (piece === rook || piece === queen) return true;
          break;
        }
        t += dir;
      }
    }

    return false;
  }

  inCheck(side: number = this.side): boolean {
    return this.isAttacked(this.kingSquare[side], side ^ 1);
  }

  /* ---------------------------------------------------------------- *
   * Move generation (pseudo-legal; legality filtered in makeMove)
   * ---------------------------------------------------------------- */

  generateMoves(out: Int32Array, capturesOnly = false): number {
    const board = this.board;
    const us = this.side;
    const them = us ^ 1;
    let n = 0;

    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) {
        sq += 7;
        continue;
      }
      const piece = board[sq];
      if (piece === EMPTY || colorOf(piece) !== us) continue;
      const type = typeOf(piece);

      if (type === PAWN) {
        const forward = us === WHITE ? 16 : -16;
        const startRank = us === WHITE ? 1 : 6;
        const promoRank = us === WHITE ? 7 : 0;

        // Quiet pushes
        if (!capturesOnly) {
          const one = sq + forward;
          if (!(one & 0x88) && board[one] === EMPTY) {
            if (one >> 4 === promoRank) {
              n = this.pushPromotions(out, n, sq, one, 0);
            } else {
              out[n++] = encodeMove(sq, one, 0, 0, FLAG_QUIET);
              if (sq >> 4 === startRank) {
                const two = sq + forward * 2;
                if (board[two] === EMPTY) out[n++] = encodeMove(sq, two, 0, 0, FLAG_DOUBLE_PUSH);
              }
            }
          }
        } else {
          // In quiescence we still want promotions (they change material)
          const one = sq + forward;
          if (!(one & 0x88) && board[one] === EMPTY && one >> 4 === promoRank) {
            n = this.pushPromotions(out, n, sq, one, 0);
          }
        }

        // Captures
        for (const diag of [forward - 1, forward + 1]) {
          const t = sq + diag;
          if (t & 0x88) continue;
          const target = board[t];
          if (target !== EMPTY && colorOf(target) === them) {
            if (t >> 4 === promoRank) {
              n = this.pushPromotions(out, n, sq, t, typeOf(target));
            } else {
              out[n++] = encodeMove(sq, t, 0, typeOf(target), FLAG_CAPTURE);
            }
          } else if (target === EMPTY && t === this.ep) {
            out[n++] = encodeMove(sq, t, 0, PAWN, FLAG_CAPTURE | FLAG_EP);
          }
        }
        continue;
      }

      if (type === KNIGHT || type === KING) {
        const offsets = type === KNIGHT ? KNIGHT_OFFSETS : KING_OFFSETS;
        for (let i = 0; i < 8; i++) {
          const t = sq + offsets[i];
          if (t & 0x88) continue;
          const target = board[t];
          if (target === EMPTY) {
            if (!capturesOnly) out[n++] = encodeMove(sq, t, 0, 0, FLAG_QUIET);
          } else if (colorOf(target) === them) {
            out[n++] = encodeMove(sq, t, 0, typeOf(target), FLAG_CAPTURE);
          }
        }
        continue;
      }

      // Sliders
      const offsets =
        type === BISHOP ? BISHOP_OFFSETS : type === ROOK ? ROOK_OFFSETS : KING_OFFSETS;
      const count = type === QUEEN ? 8 : 4;
      for (let i = 0; i < count; i++) {
        const dir = offsets[i];
        let t = sq + dir;
        while (!(t & 0x88)) {
          const target = board[t];
          if (target === EMPTY) {
            if (!capturesOnly) out[n++] = encodeMove(sq, t, 0, 0, FLAG_QUIET);
          } else {
            if (colorOf(target) === them) out[n++] = encodeMove(sq, t, 0, typeOf(target), FLAG_CAPTURE);
            break;
          }
          t += dir;
        }
      }
    }

    // Castling
    if (!capturesOnly) {
      if (us === WHITE) {
        if (
          this.castling & CASTLE_WK &&
          board[5] === EMPTY &&
          board[6] === EMPTY &&
          board[7] === pieceOf(WHITE, ROOK) &&
          !this.isAttacked(4, BLACK) &&
          !this.isAttacked(5, BLACK) &&
          !this.isAttacked(6, BLACK)
        ) {
          out[n++] = encodeMove(4, 6, 0, 0, FLAG_CASTLE_K);
        }
        if (
          this.castling & CASTLE_WQ &&
          board[3] === EMPTY &&
          board[2] === EMPTY &&
          board[1] === EMPTY &&
          board[0] === pieceOf(WHITE, ROOK) &&
          !this.isAttacked(4, BLACK) &&
          !this.isAttacked(3, BLACK) &&
          !this.isAttacked(2, BLACK)
        ) {
          out[n++] = encodeMove(4, 2, 0, 0, FLAG_CASTLE_Q);
        }
      } else {
        if (
          this.castling & CASTLE_BK &&
          board[117] === EMPTY &&
          board[118] === EMPTY &&
          board[119] === pieceOf(BLACK, ROOK) &&
          !this.isAttacked(116, WHITE) &&
          !this.isAttacked(117, WHITE) &&
          !this.isAttacked(118, WHITE)
        ) {
          out[n++] = encodeMove(116, 118, 0, 0, FLAG_CASTLE_K);
        }
        if (
          this.castling & CASTLE_BQ &&
          board[115] === EMPTY &&
          board[114] === EMPTY &&
          board[113] === EMPTY &&
          board[112] === pieceOf(BLACK, ROOK) &&
          !this.isAttacked(116, WHITE) &&
          !this.isAttacked(115, WHITE) &&
          !this.isAttacked(114, WHITE)
        ) {
          out[n++] = encodeMove(116, 114, 0, 0, FLAG_CASTLE_Q);
        }
      }
    }

    return n;
  }

  private pushPromotions(out: Int32Array, n: number, from: number, to: number, captured: number) {
    const flags = FLAG_PROMOTION | (captured ? FLAG_CAPTURE : 0);
    out[n++] = encodeMove(from, to, QUEEN, captured, flags);
    out[n++] = encodeMove(from, to, ROOK, captured, flags);
    out[n++] = encodeMove(from, to, BISHOP, captured, flags);
    out[n++] = encodeMove(from, to, KNIGHT, captured, flags);
    return n;
  }

  /* ---------------------------------------------------------------- *
   * Make / unmake
   * ---------------------------------------------------------------- */

  /** Applies a pseudo-legal move. Returns false (and reverts) if it leaves the king in check. */
  makeMove(move: number): boolean {
    const from = moveFrom(move);
    const to = moveTo(move);
    const flags = moveFlags(move);
    const promo = movePromotion(move);
    const us = this.side;
    const them = us ^ 1;
    const board = this.board;
    const piece = board[from];
    const type = typeOf(piece);

    this.history.push({
      move,
      castling: this.castling,
      ep: this.ep,
      halfmove: this.halfmove,
      hashLo: this.hashLo,
      hashHi: this.hashHi
    });

    // Clear old ep from hash
    if (this.ep >= 0) {
      this.hashLo ^= ZOBRIST_EP_LO[this.ep];
      this.hashHi ^= ZOBRIST_EP_HI[this.ep];
    }
    this.hashLo ^= ZOBRIST_CASTLE_LO[this.castling];
    this.hashHi ^= ZOBRIST_CASTLE_HI[this.castling];

    // Captures
    if (flags & FLAG_EP) {
      const capSq = us === WHITE ? to - 16 : to + 16;
      this.togglePiece(board[capSq], capSq);
      board[capSq] = EMPTY;
    } else if (flags & FLAG_CAPTURE) {
      this.togglePiece(board[to], to);
    }

    // Move the piece
    this.togglePiece(piece, from);
    board[from] = EMPTY;
    const placed = promo ? pieceOf(us, promo) : piece;
    board[to] = placed;
    this.togglePiece(placed, to);

    if (type === KING) this.kingSquare[us] = to;

    // Rook shuffle for castling
    if (flags & FLAG_CASTLE_K) {
      const rookFrom = us === WHITE ? H1 : H8;
      const rookTo = us === WHITE ? 5 : 117;
      const rook = board[rookFrom];
      this.togglePiece(rook, rookFrom);
      board[rookFrom] = EMPTY;
      board[rookTo] = rook;
      this.togglePiece(rook, rookTo);
    } else if (flags & FLAG_CASTLE_Q) {
      const rookFrom = us === WHITE ? A1 : A8;
      const rookTo = us === WHITE ? 3 : 115;
      const rook = board[rookFrom];
      this.togglePiece(rook, rookFrom);
      board[rookFrom] = EMPTY;
      board[rookTo] = rook;
      this.togglePiece(rook, rookTo);
    }

    // Castling rights
    if (type === KING) {
      this.castling &= us === WHITE ? ~(CASTLE_WK | CASTLE_WQ) : ~(CASTLE_BK | CASTLE_BQ);
    }
    if (from === H1 || to === H1) this.castling &= ~CASTLE_WK;
    if (from === A1 || to === A1) this.castling &= ~CASTLE_WQ;
    if (from === H8 || to === H8) this.castling &= ~CASTLE_BK;
    if (from === A8 || to === A8) this.castling &= ~CASTLE_BQ;

    this.hashLo ^= ZOBRIST_CASTLE_LO[this.castling];
    this.hashHi ^= ZOBRIST_CASTLE_HI[this.castling];

    // En passant square
    this.ep = flags & FLAG_DOUBLE_PUSH ? (us === WHITE ? from + 16 : from - 16) : -1;
    if (this.ep >= 0) {
      this.hashLo ^= ZOBRIST_EP_LO[this.ep];
      this.hashHi ^= ZOBRIST_EP_HI[this.ep];
    }

    // Clocks
    this.halfmove = type === PAWN || flags & FLAG_CAPTURE ? 0 : this.halfmove + 1;
    if (us === BLACK) this.fullmove++;

    this.side = them;
    this.hashLo ^= ZOBRIST_SIDE_LO;
    this.hashHi ^= ZOBRIST_SIDE_HI;

    // Legality
    if (this.isAttacked(this.kingSquare[us], them)) {
      this.unmakeMove();
      return false;
    }

    this.repetitionLo.push(this.hashLo);
    this.repetitionHi.push(this.hashHi);
    return true;
  }

  unmakeMove() {
    const record = this.history.pop();
    if (!record) return;

    // Only pop the repetition entry if the move was actually kept (see makeMove)
    if (
      this.repetitionLo.length > 1 &&
      this.repetitionLo[this.repetitionLo.length - 1] === this.hashLo &&
      this.repetitionHi[this.repetitionHi.length - 1] === this.hashHi
    ) {
      this.repetitionLo.pop();
      this.repetitionHi.pop();
    }

    const move = record.move;
    const from = moveFrom(move);
    const to = moveTo(move);
    const flags = moveFlags(move);
    const promo = movePromotion(move);
    const board = this.board;
    const us = this.side ^ 1;
    const them = this.side;

    const placed = board[to];
    const original = promo ? pieceOf(us, PAWN) : placed;
    board[from] = original;
    board[to] = EMPTY;

    if (typeOf(original) === KING) this.kingSquare[us] = from;

    if (flags & FLAG_EP) {
      const capSq = us === WHITE ? to - 16 : to + 16;
      board[capSq] = pieceOf(them, PAWN);
    } else if (flags & FLAG_CAPTURE) {
      board[to] = pieceOf(them, moveCaptured(move));
    }

    if (flags & FLAG_CASTLE_K) {
      const rookFrom = us === WHITE ? H1 : H8;
      const rookTo = us === WHITE ? 5 : 117;
      board[rookFrom] = board[rookTo];
      board[rookTo] = EMPTY;
    } else if (flags & FLAG_CASTLE_Q) {
      const rookFrom = us === WHITE ? A1 : A8;
      const rookTo = us === WHITE ? 3 : 115;
      board[rookFrom] = board[rookTo];
      board[rookTo] = EMPTY;
    }

    this.castling = record.castling;
    this.ep = record.ep;
    this.halfmove = record.halfmove;
    this.hashLo = record.hashLo;
    this.hashHi = record.hashHi;
    this.side = us;
    if (us === BLACK) this.fullmove--;
  }

  /** Null move (pass the turn) — used for null-move pruning. */
  makeNullMove(): { ep: number; hashLo: number; hashHi: number } {
    const saved = { ep: this.ep, hashLo: this.hashLo, hashHi: this.hashHi };
    if (this.ep >= 0) {
      this.hashLo ^= ZOBRIST_EP_LO[this.ep];
      this.hashHi ^= ZOBRIST_EP_HI[this.ep];
    }
    this.ep = -1;
    this.side ^= 1;
    this.hashLo ^= ZOBRIST_SIDE_LO;
    this.hashHi ^= ZOBRIST_SIDE_HI;
    return saved;
  }

  unmakeNullMove(saved: { ep: number; hashLo: number; hashHi: number }) {
    this.side ^= 1;
    this.ep = saved.ep;
    this.hashLo = saved.hashLo;
    this.hashHi = saved.hashHi;
  }

  /** Legal move list (materialised — used at the root and by helpers, not in hot loops). */
  legalMoves(): number[] {
    const buffer = new Int32Array(256);
    const count = this.generateMoves(buffer);
    const legal: number[] = [];
    for (let i = 0; i < count; i++) {
      if (this.makeMove(buffer[i])) {
        legal.push(buffer[i]);
        this.unmakeMove();
      }
    }
    return legal;
  }

  hasLegalMoves(): boolean {
    const buffer = new Int32Array(256);
    const count = this.generateMoves(buffer);
    for (let i = 0; i < count; i++) {
      if (this.makeMove(buffer[i])) {
        this.unmakeMove();
        return true;
      }
    }
    return false;
  }

  isRepetition(): boolean {
    let count = 0;
    const len = this.repetitionLo.length;
    const lo = this.hashLo;
    const hi = this.hashHi;
    // Only positions since the last irreversible move can repeat
    const limit = Math.max(0, len - 1 - this.halfmove);
    for (let i = len - 2; i >= limit; i -= 2) {
      if (this.repetitionLo[i] === lo && this.repetitionHi[i] === hi) {
        count++;
        if (count >= 1) return true;
      }
    }
    return false;
  }

  isInsufficientMaterial(): boolean {
    let bishopsWhite = 0;
    let bishopsBlack = 0;
    let knights = 0;
    let others = 0;
    let bishopSquareColors = new Set<number>();

    for (let sq = 0; sq < 128; sq++) {
      if (sq & 0x88) {
        sq += 7;
        continue;
      }
      const piece = this.board[sq];
      if (piece === EMPTY) continue;
      const type = typeOf(piece);
      if (type === KING) continue;
      if (type === BISHOP) {
        if (colorOf(piece) === WHITE) bishopsWhite++;
        else bishopsBlack++;
        bishopSquareColors.add(((sq >> 4) + (sq & 15)) & 1);
      } else if (type === KNIGHT) {
        knights++;
      } else {
        others++;
      }
    }

    if (others > 0) return false;
    const bishops = bishopsWhite + bishopsBlack;
    if (bishops === 0 && knights <= 1) return true;
    if (knights === 0 && bishops > 0 && bishopSquareColors.size === 1) return true;
    return false;
  }

  /** Finds the legal move matching a from/to(/promotion) pair, or 0. */
  findMove(from: number, to: number, promotion?: number): number {
    for (const move of this.legalMoves()) {
      if (moveFrom(move) !== from || moveTo(move) !== to) continue;
      const promo = movePromotion(move);
      if (promo) {
        if (promotion && promo !== promotion) continue;
        if (!promotion && promo !== QUEEN) continue;
      }
      return move;
    }
    return 0;
  }

  findMoveUci(uci: string): number {
    const from = algebraicToSquare(uci.slice(0, 2));
    const to = algebraicToSquare(uci.slice(2, 4));
    const promo = uci.length > 4 ? CHAR_PROMO[uci[4]] : undefined;
    return this.findMove(from, to, promo);
  }
}

export const parsePromotionChar = (c?: string) => (c ? CHAR_PROMO[c.toLowerCase()] || 0 : 0);
export const promotionChar = (t: number) => PROMO_CHARS[t] || '';
