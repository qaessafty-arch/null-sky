import { Puzzle } from '../types/chess';

export const PUZZLES_COLLECTION: Puzzle[] = [
  {
    id: 'puz-1',
    title: "Scholar's Nemesis",
    difficulty: 'Easy',
    rating: 800,
    playerColor: 'w',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 4',
    solutionMoves: ['Qxf7#'],
    theme: 'Mate in 1',
    description: 'White has delivered the classic f7 focal assault. Finish the game in a single decisive blow!'
  },
  {
    id: 'puz-2',
    title: 'The Operatic Mate',
    difficulty: 'Easy',
    rating: 950,
    playerColor: 'w',
    fen: 'rn2kb1r/pp3ppp/4p3/3p4/3PnB2/2P5/Pq1N1PPP/R2QKBNR w KQkq - 0 9',
    solutionMoves: ['Nxe4', 'dxe4', 'Qc1'],
    theme: 'Tactical Simplification',
    description: 'Neutralize Black’s aggressive knight outpost and consolidate the central control.'
  },
  {
    id: 'puz-3',
    title: 'Back-Rank Lightning',
    difficulty: 'Easy',
    rating: 1100,
    playerColor: 'w',
    fen: '6k1/5ppp/8/8/8/8/1r3PPP/R5K1 w - - 0 1',
    solutionMoves: ['Ra8+', 'Rb8', 'Rxb8#'],
    theme: 'Back Rank Mate',
    description: 'Black neglected luft for their monarch. Execute the classic back-rank corridor mate.'
  },
  {
    id: 'puz-4',
    title: 'The Royal Fork',
    difficulty: 'Medium',
    rating: 1350,
    playerColor: 'w',
    fen: 'r1bqk2r/pppp1ppp/8/4n3/1bP5/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 6',
    solutionMoves: ['Nxe5', 'Bxc3+', 'bxc3'],
    theme: 'Fork & Material Gain',
    description: 'Capitalize on Black’s loose knight placement and seize the initiative.'
  },
  {
    id: 'puz-5',
    title: 'Smothered Geometry',
    difficulty: 'Medium',
    rating: 1550,
    playerColor: 'w',
    fen: '6k1/5ppp/8/8/8/8/5NPP/4R1K1 w - - 0 1',
    solutionMoves: ['Re8#'],
    theme: 'Precision Mate',
    description: 'Find the unstoppable checkmate in the corner corridor.'
  },
  {
    id: 'puz-6',
    title: 'Philidor’s Legacy',
    difficulty: 'Hard',
    rating: 1800,
    playerColor: 'w',
    fen: '5rk1/6pp/8/8/8/3Q4/6PP/4R1K1 w - - 0 1',
    solutionMoves: ['Qd5+', 'Kh8', 'Qe6'],
    theme: 'Positional Squeeze',
    description: 'Coordinate Queen and Rook to dominate the eighth rank.'
  },
  {
    id: 'puz-7',
    title: 'Queen Sacrifice for Immortality',
    difficulty: 'Hard',
    rating: 1950,
    playerColor: 'w',
    fen: 'r1b2rk1/ppp2ppp/8/8/1B1q4/8/PP3PPP/RN1Q1RK1 w - - 0 1',
    solutionMoves: ['Bxf8', 'Qxd1', 'Rxd1', 'Kxf8', 'Rd8#'],
    theme: 'Queen Deflection',
    description: 'Trade down forcefully into an inescapable back-rank pin.'
  },
  {
    id: 'puz-8',
    title: 'The Greek Gift Sacrifice',
    difficulty: 'Master',
    rating: 2200,
    playerColor: 'w',
    fen: 'r1bq1rk1/ppp2ppp/2n1pn2/3p4/2PP4/2N1PN2/PPB2PPP/R1BQK2R w KQ - 0 8',
    solutionMoves: ['Bxh7+', 'Kxh7', 'Ng5+', 'Kg8', 'Qh5'],
    theme: 'Classical Sacrifice',
    description: 'Launch the legendary Bxh7+ demolition against Black’s castled king.'
  }
];
