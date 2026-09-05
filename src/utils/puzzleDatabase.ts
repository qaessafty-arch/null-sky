import { Puzzle } from '../types/chess';

export type TacticalTheme = 'Mate in 1' | 'Mate in 2' | 'Fork' | 'Pin' | 'Skewer' | 'Discovered Attack' | 'Deflection' | 'Sacrifice' | 'Endgame' | 'Mixed';
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Grandmaster';

export interface ExtendedPuzzle extends Puzzle {
  category: TacticalTheme;
  level: DifficultyLevel;
}

export const EXTENDED_PUZZLES: ExtendedPuzzle[] = [
  // Mate in 1
  { id: 't-1', title: 'Back Rank Basics', difficulty: 'Easy', level: 'Beginner', rating: 800, playerColor: 'w', fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1', solutionMoves: ['Ra8#'], theme: 'Mate in 1', category: 'Mate in 1', description: 'Classic back-rank mate.' },
  { id: 't-2', title: 'Kiss of Death', difficulty: 'Easy', level: 'Beginner', rating: 900, playerColor: 'w', fen: '4k3/8/4K3/8/8/8/8/5Q2 w - - 0 1', solutionMoves: ['Qf7#'], theme: 'Mate in 1', category: 'Mate in 1', description: 'Queen and King mate.' },
  { id: 't-3', title: 'Smothered Mate', difficulty: 'Easy', level: 'Beginner', rating: 1100, playerColor: 'w', fen: '6rk/6pp/8/8/8/8/8/5N1K w - - 0 1', solutionMoves: ['Nf7#'], theme: 'Mate in 1', category: 'Mate in 1', description: 'Knight jumps in for the kill.' },

  // Mate in 2
  { id: 't-4', title: 'Grecian Gift', difficulty: 'Medium', level: 'Intermediate', rating: 1400, playerColor: 'w', fen: 'r1bq1rk1/ppp2ppp/2n1pn2/3p4/2PP4/2N1PN2/PPB2PPP/R1BQK2R w KQ - 0 8', solutionMoves: ['Bxh7+', 'Kxh7', 'Ng5+', 'Kg8', 'Qh5'], theme: 'Mate in 2', category: 'Mate in 2', description: 'Standard Bxh7 sacrifice sequence.' },
  { id: 't-5', title: 'Rook Roller', difficulty: 'Medium', level: 'Intermediate', rating: 1300, playerColor: 'w', fen: '8/6k1/8/8/8/8/1R5P/R5K1 w - - 0 1', solutionMoves: ['Rb7+', 'Kf6', 'Ra6#'], theme: 'Mate in 2', category: 'Mate in 2', description: 'Ladder mate with two rooks.' },

  // Forks
  { id: 't-6', title: 'Knight Fork', difficulty: 'Easy', level: 'Beginner', rating: 1200, playerColor: 'w', fen: '3k4/8/8/8/8/8/3N4/3q1r2 w - - 0 1', solutionMoves: ['Ne4+'], theme: 'Fork', category: 'Fork', description: 'Fork the King and Queen.' },
  { id: 't-7', title: 'Royal Fork', difficulty: 'Medium', level: 'Intermediate', rating: 1500, playerColor: 'w', fen: 'r1bqk2r/pppp1ppp/8/4n3/1bP5/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 6', solutionMoves: ['Nxe5'], theme: 'Fork', category: 'Fork', description: 'Win a piece and attack the center.' },

  // Pins
  { id: 't-8', title: 'Absolute Pin', difficulty: 'Medium', level: 'Intermediate', rating: 1350, playerColor: 'w', fen: '4k3/8/8/8/8/8/4R3/4q3 w - - 0 1', solutionMoves: ['Re1'], theme: 'Pin', category: 'Pin', description: 'Pin the Queen to the King.' },
  
  // Skewers
  { id: 't-9', title: 'Queen Skewer', difficulty: 'Medium', level: 'Intermediate', rating: 1450, playerColor: 'w', fen: '8/8/8/4k3/8/8/4Q3/8 w - - 0 1', solutionMoves: ['Qe5+'], theme: 'Skewer', category: 'Skewer', description: 'Skewer the King to win material behind it.' },

  // Discoveries
  { id: 't-10', title: 'Discovered Attack', difficulty: 'Hard', level: 'Advanced', rating: 1800, playerColor: 'w', fen: '3qk3/8/8/8/8/3B4/8/3R4 w - - 0 1', solutionMoves: ['Bxh7+'], theme: 'Discovered Attack', category: 'Discovered Attack', description: 'Move the Bishop to unleash the Rook on the Queen.' },
  
  // Endgames
  { id: 't-11', title: 'Pawn Promotion', difficulty: 'Hard', level: 'Advanced', rating: 1900, playerColor: 'w', fen: '8/6P1/8/8/8/8/6k1/8 w - - 0 1', solutionMoves: ['g8=Q+'], theme: 'Endgame', category: 'Endgame', description: 'Promote the pawn with check.' }
];

export const getPuzzlesByCategory = (category: TacticalTheme | 'All'): ExtendedPuzzle[] => {
  if (category === 'All' || category === 'Mixed') return EXTENDED_PUZZLES;
  return EXTENDED_PUZZLES.filter(p => p.category === category);
};

export const getRandomPuzzle = (category: TacticalTheme | 'All', difficulty?: DifficultyLevel): ExtendedPuzzle => {
  let pool = getPuzzlesByCategory(category);
  if (difficulty) {
    pool = pool.filter(p => p.level === difficulty);
  }
  if (pool.length === 0) pool = EXTENDED_PUZZLES; // fallback
  return pool[Math.floor(Math.random() * pool.length)];
};
