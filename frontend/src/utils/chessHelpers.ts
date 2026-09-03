// FILE: frontend/src/utils/chessHelpers.ts
import { Chess } from 'chess.js';

export function isValidFen(fen: string): boolean {
  try {
    const chess = new Chess();
    chess.load(fen);
    return true;
  } catch {
    return false;
  }
}

export function parsePgn(pgn: string): { headers: Record<string, string>; moves: string[] } {
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    return {
      headers: chess.header(),
      moves: chess.history()
    };
  } catch {
    return { headers: {}, moves: [] };
  }
}

export function formatEcoCode(moves: string[]): string {
  // Simple opening mapping
  if (moves.length === 0) return 'A00';
  if (moves[0] === 'e4' && moves[1] === 'e5') return 'C20';
  if (moves[0] === 'e4' && moves[1] === 'c5') return 'B20';
  if (moves[0] === 'd4' && moves[1] === 'd5') return 'D00';
  if (moves[0] === 'd4' && moves[1] === 'Nf6') return 'A45';
  return 'A00';
}
