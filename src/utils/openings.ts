import { OpeningInfo } from '../types/chess';

interface OpeningEntry {
  moves: string[]; // sequence of SAN moves
  eco: string;
  name: string;
  variation?: string;
}

export const OPENINGS_DATABASE: OpeningEntry[] = [
  // Ruy Lopez
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'], eco: 'C60', name: 'Ruy Lopez', variation: 'Spanish Opening' },
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'a6'], eco: 'C68', name: 'Ruy Lopez', variation: 'Morphy Defense' },
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5', 'Nf6'], eco: 'C65', name: 'Ruy Lopez', variation: 'Berlin Defense' },
  
  // Italian Game
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4'], eco: 'C50', name: 'Italian Game', variation: 'Giuoco Piano' },
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Bc5'], eco: 'C53', name: 'Italian Game', variation: 'Classical Variation' },
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'Bc4', 'Nf6'], eco: 'C55', name: 'Two Knights Defense' },
  
  // Sicilian Defense
  { moves: ['e4', 'c5'], eco: 'B20', name: 'Sicilian Defense' },
  { moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'a6'], eco: 'B90', name: 'Sicilian Defense', variation: 'Najdorf Variation' },
  { moves: ['e4', 'c5', 'Nf3', 'd6', 'd4', 'cxd4', 'Nxd4', 'Nf6', 'Nc3', 'g6'], eco: 'B70', name: 'Sicilian Defense', variation: 'Dragon Variation' },
  { moves: ['e4', 'c5', 'Nf3', 'e6'], eco: 'B40', name: 'Sicilian Defense', variation: 'French Variation' },
  { moves: ['e4', 'c5', 'Nc3'], eco: 'B23', name: 'Sicilian Defense', variation: 'Closed' },
  { moves: ['e4', 'c5', 'c3'], eco: 'B22', name: 'Sicilian Defense', variation: 'Alapin Variation' },

  // French Defense
  { moves: ['e4', 'e6'], eco: 'C00', name: 'French Defense' },
  { moves: ['e4', 'e6', 'd4', 'd5', 'e5'], eco: 'C02', name: 'French Defense', variation: 'Advance Variation' },
  { moves: ['e4', 'e6', 'd4', 'd5', 'Nc3'], eco: 'C10', name: 'French Defense', variation: 'Paulsen Variation' },
  { moves: ['e4', 'e6', 'd4', 'd5', 'Nd2'], eco: 'C03', name: 'French Defense', variation: 'Tarrasch Variation' },

  // Caro-Kann Defense
  { moves: ['e4', 'c6'], eco: 'B10', name: 'Caro-Kann Defense' },
  { moves: ['e4', 'c6', 'd4', 'd5', 'e5'], eco: 'B12', name: 'Caro-Kann Defense', variation: 'Advance Variation' },
  { moves: ['e4', 'c6', 'd4', 'd5', 'Nc3', 'dxe4', 'Nxe4'], eco: 'B15', name: 'Caro-Kann Defense', variation: 'Main Line' },

  // Scandinavian Defense
  { moves: ['e4', 'd5'], eco: 'B01', name: 'Scandinavian Defense' },
  { moves: ['e4', 'd5', 'exd5', 'Qxd5'], eco: 'B01', name: 'Scandinavian Defense', variation: 'Mieses-Kotroc' },

  // Queen's Gambit
  { moves: ['d4', 'd5', 'c4'], eco: 'D06', name: "Queen's Gambit" },
  { moves: ['d4', 'd5', 'c4', 'e6'], eco: 'D30', name: "Queen's Gambit Declined" },
  { moves: ['d4', 'd5', 'c4', 'dxc4'], eco: 'D20', name: "Queen's Gambit Accepted" },
  { moves: ['d4', 'd5', 'c4', 'c6'], eco: 'D10', name: 'Slav Defense' },

  // London System
  { moves: ['d4', 'd5', 'Bf4'], eco: 'D00', name: 'London System' },
  { moves: ['d4', 'Nf6', 'Bf4'], eco: 'A48', name: 'London System' },
  { moves: ['d4', 'd5', 'Nf3', 'Nf6', 'Bf4'], eco: 'D02', name: 'London System', variation: 'Classical' },

  // King's Indian & Grunfeld
  { moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'Bg7'], eco: 'E60', name: "King's Indian Defense" },
  { moves: ['d4', 'Nf6', 'c4', 'g6', 'Nc3', 'd5'], eco: 'D80', name: 'Grünfeld Defense' },
  { moves: ['d4', 'Nf6', 'c4', 'e6', 'Nc3', 'Bb4'], eco: 'E20', name: 'Nimzo-Indian Defense' },

  // English Opening
  { moves: ['c4'], eco: 'A10', name: 'English Opening' },
  { moves: ['c4', 'e5'], eco: 'A20', name: 'English Opening', variation: "King's English" },
  { moves: ['c4', 'c5'], eco: 'A30', name: 'English Opening', variation: 'Symmetrical' },

  // King's Gambit & Vienna
  { moves: ['e4', 'e5', 'f4'], eco: 'C30', name: "King's Gambit" },
  { moves: ['e4', 'e5', 'Nc3'], eco: 'C25', name: 'Vienna Game' },
  { moves: ['e4', 'e5', 'Nf3', 'd6'], eco: 'C41', name: 'Philidor Defense' },
  { moves: ['e4', 'e5', 'Nf3', 'Nf6'], eco: 'C42', name: "Petrov's Defense" },
  { moves: ['e4', 'e5', 'd4', 'exd4', 'Qxd4'], eco: 'C21', name: 'Center Game' },
  { moves: ['e4', 'e5', 'Nf3', 'Nc6', 'd4'], eco: 'C45', name: 'Scotch Game' },
];

export function detectOpening(sanMoves: string[]): OpeningInfo | null {
  if (!sanMoves || sanMoves.length === 0) return null;

  let bestMatch: OpeningEntry | null = null;
  let maxMatchedMoves = 0;

  for (const entry of OPENINGS_DATABASE) {
    if (entry.moves.length <= sanMoves.length) {
      let isMatch = true;
      for (let i = 0; i < entry.moves.length; i++) {
        if (sanMoves[i] !== entry.moves[i]) {
          isMatch = false;
          break;
        }
      }
      if (isMatch && entry.moves.length > maxMatchedMoves) {
        bestMatch = entry;
        maxMatchedMoves = entry.moves.length;
      }
    }
  }

  if (bestMatch) {
    return {
      eco: bestMatch.eco,
      name: bestMatch.name,
      variation: bestMatch.variation
    };
  }

  // Generic fallback if starting e4 or d4
  if (sanMoves[0] === 'e4') return { eco: 'B00', name: "King's Pawn Opening" };
  if (sanMoves[0] === 'd4') return { eco: 'A40', name: "Queen's Pawn Opening" };
  if (sanMoves[0] === 'c4') return { eco: 'A10', name: 'English Opening' };
  if (sanMoves[0] === 'Nf3') return { eco: 'A04', name: 'Réti Opening' };

  return null;
}
