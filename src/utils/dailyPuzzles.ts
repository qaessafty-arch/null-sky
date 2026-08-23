import { Puzzle, DailyPuzzleProgress } from '../types/chess';

export interface DailyPuzzleData extends Puzzle {
  dateKey: string;
  source: 'peshmerga_archive' | 'grandmaster_daily' | 'lichess';
  loreContext: string;
  tacticalTidbit: string;
}

// Curated Year-Round Master Daily Puzzles Archive
export const DAILY_PUZZLES_ARCHIVE: Omit<DailyPuzzleData, 'dateKey'>[] = [
  {
    id: 'daily-01',
    title: 'Zagros Mountain Ambush',
    difficulty: 'Medium',
    rating: 1450,
    playerColor: 'w',
    fen: 'r1b2rk1/pp1n1ppp/2p1p3/q7/2PPN3/3BP3/PP3PPP/R2QK2R w KQ - 0 12',
    solutionMoves: ['Qd2', 'Qxd2+', 'Kxd2'],
    theme: 'Positional Consolidation',
    description: 'Black aims for a tactical check on a5. Neutralize the threat and preserve mountain fortress dominance.',
    source: 'peshmerga_archive',
    loreContext: 'In the rugged Zagros mountain valleys, disciplined simplification breaks enemy momentum.',
    tacticalTidbit: 'Trading queens when the opponent lacks development reduces counterplay instantly.'
  },
  {
    id: 'daily-02',
    title: 'Erbil Citadel 21-Ray Sunburst',
    difficulty: 'Hard',
    rating: 1850,
    playerColor: 'w',
    fen: 'r2q1rk1/5p1p/p1n1p1p1/1p1p4/3P4/2PB1Q1P/PP3PP1/4RRK1 w - - 0 16',
    solutionMoves: ['Bxg6', 'hxg6', 'Rxe6', 'fxe6', 'Qxg6+'],
    theme: 'Greek Gift & Pawn Decimation',
    description: 'Tear open Black’s kingside shelter with a devastating sacrifice on the sixth rank.',
    source: 'peshmerga_archive',
    loreContext: 'The Citadel of Erbil has repelled invaders for 6,000 years through decisive proactive defense.',
    tacticalTidbit: 'Removing the defending pawn barrier triggers an unavoidable perpetual check or mate net.'
  },
  {
    id: 'daily-03',
    title: 'Peshmerga Knight Fork of Victory',
    difficulty: 'Easy',
    rating: 1150,
    playerColor: 'w',
    fen: 'r1bqkb1r/pppp1ppp/8/4n3/1bP5/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 6',
    solutionMoves: ['Nxe5', 'Bxc3+', 'bxc3'],
    theme: 'Central Dominance',
    description: 'Black leaves the central e5 knight undefended. Punish the overextension!',
    source: 'peshmerga_archive',
    loreContext: 'A Peshmerga warrior strikes with absolute timing when an adversary reveals a flank weakness.',
    tacticalTidbit: 'Always calculate trades where material is immediately won on the first ply.'
  },
  {
    id: 'daily-04',
    title: 'Immortal Queen Sacrifice in Hewlêr',
    difficulty: 'Master',
    rating: 2250,
    playerColor: 'w',
    fen: 'r1b2rk1/pp3ppp/2n1p3/3p4/1b1P4/1PN1PN2/PB1Q1PPP/R3KB1R w KQ - 0 10',
    solutionMoves: ['a3', 'Bxc3', 'Bxc3'],
    theme: 'Bishop Pair Dominance',
    description: 'Trap Black’s active dark-squared bishop and unleash the double-bishop diagonals.',
    source: 'grandmaster_daily',
    loreContext: 'Hewlêr chess grandmasters excel at converting microscopic spatial edges into permanent wins.',
    tacticalTidbit: 'Gaining the bishop pair in semi-open positions yields long-term tactical superiority.'
  },
  {
    id: 'daily-05',
    title: 'The Crimson Jamadani Deflection',
    difficulty: 'Medium',
    rating: 1600,
    playerColor: 'w',
    fen: 'r4rk1/1pp2ppp/p1np4/4p3/2B1P1b1/2NP1N2/PPP2PPP/R2Q1RK1 w - - 0 11',
    solutionMoves: ['h3', 'Bh5', 'g4', 'Bg6'],
    theme: 'Kingside Pawn Storm',
    description: 'Drive back Black’s pinning bishop and claim total command over the f-file.',
    source: 'peshmerga_archive',
    loreContext: 'The traditional red Jamadani scarf stands for valor, warmth, and unyielding tactical resolve.',
    tacticalTidbit: 'Expanding on the kingside with h3-g4 breaks annoying pins safely when the center is locked.'
  },
  {
    id: 'daily-06',
    title: 'Lightning Rook on the 7th Rank',
    difficulty: 'Hard',
    rating: 1920,
    playerColor: 'w',
    fen: 'r5k1/5ppp/8/8/8/8/1R3PPP/6K1 w - - 0 1',
    solutionMoves: ['Ra2', 'Re8', 'Ra8'],
    theme: 'Back Rank Corridor',
    description: 'Activate your heavy artillery to strangle the enemy monarch on the back ranks.',
    source: 'peshmerga_archive',
    loreContext: 'A Peshmerga guard holds high mountain passes against any back-rank encirclement.',
    tacticalTidbit: 'Rooks on the 7th and 8th ranks multiply in tactical power exponentially.'
  },
  {
    id: 'daily-07',
    title: 'Smothered Knight at Mount Qandil',
    difficulty: 'Master',
    rating: 2300,
    playerColor: 'w',
    fen: '6k1/5ppp/8/8/8/8/5NPP/4R1K1 w - - 0 1',
    solutionMoves: ['Re8#'],
    theme: 'Direct Back Rank Checkmate',
    description: 'Deliver the finishing strike through the undefended back-rank corridor.',
    source: 'peshmerga_archive',
    loreContext: 'At Mount Qandil, the air is crisp, the focus is pure, and calculation is exact.',
    tacticalTidbit: 'Always scan for mating nets before considering defensive or quiet moves.'
  },
  {
    id: 'daily-08',
    title: 'Founder’s 24K Masterpiece',
    difficulty: 'Hard',
    rating: 2050,
    playerColor: 'w',
    fen: 'r1bq1rk1/ppp2ppp/2n1pn2/3p4/2PP4/2N1PN2/PPB2PPP/R1BQK2R w KQ - 0 8',
    solutionMoves: ['Bxh7+', 'Kxh7', 'Ng5+', 'Kg8', 'Qh5'],
    theme: 'Classical Greek Gift Sacrifice',
    description: 'Sacrifice the light-squared bishop to destroy the enemy king’s pawn shield.',
    source: 'grandmaster_daily',
    loreContext: 'Dedicated to q.brz • Founder #0, celebrating timeless chess wisdom and strategic vision.',
    tacticalTidbit: 'The Bxh7+ sacrifice succeeds when your knight and queen can quickly occupy g5 and h5.'
  },
  {
    id: 'daily-09',
    title: 'Duhok Valley Pin & Skewer',
    difficulty: 'Easy',
    rating: 1250,
    playerColor: 'w',
    fen: 'r1bqk2r/pp1p1ppp/2n1pn2/8/1b1NP3/2N1B3/PPP2PPP/R2QKB1R w KQkq - 0 7',
    solutionMoves: ['Nxc6', 'bxc6', 'Bd3'],
    theme: 'Pawn Structure Disruption',
    description: 'Damage Black’s queenside structure and prepare kingside castling.',
    source: 'peshmerga_archive',
    loreContext: 'The lush valleys of Duhok remind grandmasters that harmony in piece coordination wins endgames.',
    tacticalTidbit: 'Forcing doubled isolated pawns creates permanent endgame targets.'
  },
  {
    id: 'daily-10',
    title: 'Sulaymaniyah Poetic Counter-Attack',
    difficulty: 'Medium',
    rating: 1500,
    playerColor: 'w',
    fen: 'r2q1rk1/pp1n1ppp/2pbpn2/8/3P4/2NBPN2/PP3PPP/R1BQ1RK1 w - - 0 10',
    solutionMoves: ['e4', 'e5', 'dxe5', 'Nxe5'],
    theme: 'Central Breakthrough',
    description: 'Seize the center with e4 and open vital lines for your bishops.',
    source: 'peshmerga_archive',
    loreContext: 'Sulaymaniyah, city of poets and thinkers, values tactical depth and harmonious beauty.',
    tacticalTidbit: 'Pawn breaks in the center dictate who controls the tactical tempo of the match.'
  }
];

export const getTodayDateKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getFormattedTodayDate = (): string => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date());
};

// Generates deterministic daily puzzle based on date string
export const getDailyPuzzleForDate = (dateKey: string = getTodayDateKey()): DailyPuzzleData => {
  let hash = 0;
  for (let i = 0; i < dateKey.length; i++) {
    hash = (hash << 5) - hash + dateKey.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % DAILY_PUZZLES_ARCHIVE.length;
  const base = DAILY_PUZZLES_ARCHIVE[index];

  return {
    ...base,
    id: `daily-${dateKey}-${base.id}`,
    dateKey
  };
};

const DAILY_STORAGE_KEY = 'chesskys_daily_puzzle_progress';

export const loadDailyProgress = (dateKey: string = getTodayDateKey()): DailyPuzzleProgress => {
  try {
    const raw = localStorage.getItem(DAILY_STORAGE_KEY);
    if (raw) {
      const data: DailyPuzzleProgress = JSON.parse(raw);
      if (data.dateKey === dateKey) {
        return data;
      }
      // Check streak continuity
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      
      const streak = data.lastSolvedDate === yesterdayKey ? data.streak : 0;
      return {
        dateKey,
        solved: false,
        streak,
        lastSolvedDate: data.lastSolvedDate || '',
        totalDailySolved: data.totalDailySolved || 0
      };
    }
  } catch (e) {
    console.error('Failed to read daily progress:', e);
  }

  return {
    dateKey,
    solved: false,
    streak: 0,
    lastSolvedDate: '',
    totalDailySolved: 0
  };
};

export const saveDailyProgress = (dateKey: string, solved: boolean): DailyPuzzleProgress => {
  try {
    const prev = loadDailyProgress(dateKey);
    const updated: DailyPuzzleProgress = {
      dateKey,
      solved,
      streak: solved ? (prev.lastSolvedDate === dateKey ? prev.streak : prev.streak + 1) : prev.streak,
      lastSolvedDate: solved ? dateKey : prev.lastSolvedDate,
      totalDailySolved: solved && !prev.solved ? prev.totalDailySolved + 1 : prev.totalDailySolved
    };

    localStorage.setItem(DAILY_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save daily progress:', e);
    return {
      dateKey,
      solved,
      streak: 1,
      lastSolvedDate: dateKey,
      totalDailySolved: 1
    };
  }
};

export const generateDailyShareText = (puzzle: DailyPuzzleData, streak: number): string => {
  return `⚔️ Chesskys Peshmerga Edition • Daily Chess Tactics ☀️
📅 ${puzzle.dateKey} — "${puzzle.title}"
🎯 Solved Cleanly! (${puzzle.difficulty} • ${puzzle.rating} Elo)
🔥 Daily Tactical Streak: ${streak} Days
♟️ Play: https://chesskys.pro`;
};
