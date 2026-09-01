import { Puzzle, DailyPuzzleProgress } from '../types/chess';

export interface DailyPuzzleData extends Puzzle {
  dateKey: string;
  source: 'peshmerga_archive' | 'grandmaster_daily' | 'lichess';
  loreContext: string;
  tacticalTidbit: string;
  solutionExplanation?: string;
  sourceUrl?: string;
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
    tacticalTidbit: 'Trading queens when the opponent lacks development reduces counterplay instantly.',
    solutionExplanation: 'By playing Qd2, White defends against the queen check, forces a queen exchange, and brings the king to d2 safely without losing kingside development.'
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
    tacticalTidbit: 'Removing the defending pawn barrier triggers an unavoidable perpetual check or mate net.',
    solutionExplanation: 'Sacrificing the bishop on g6 shatters the f7-g6-h7 pawn triangle, enabling White’s rook and queen to infiltrate with unstoppable force.'
  },
  {
    id: 'daily-03',
    title: 'Peshmerga Knight Fork of Victory',
    difficulty: 'Easy',
    rating: 1150,
    playerColor: 'w',
    fen: 'r1bqkb1r/pppp1ppp/8/4n3/1bP5/2N2N2/PP2PPPP/R1BQKB1R w KQkq - 0 6',
    solutionMoves: ['Nxe5', 'Bxc3+', 'bxc3'],
    theme: 'Central Dominance & Simplification',
    description: 'Black leaves the central e5 knight undefended. Punish the overextension!',
    source: 'peshmerga_archive',
    loreContext: 'A Peshmerga warrior strikes with absolute timing when an adversary reveals a flank weakness.',
    tacticalTidbit: 'Always calculate trades where material is immediately won on the first ply.',
    solutionExplanation: 'Nxe5 wins the exposed black knight on e5 cleanly. Even if Black replies with Bxc3+, White plays bxc3 and remains up a full minor piece.'
  },
  {
    id: 'daily-04',
    title: 'Immortal Bishop Pair of Hewlêr',
    difficulty: 'Master',
    rating: 2250,
    playerColor: 'w',
    fen: 'r1b2rk1/pp3ppp/2n1p3/3p4/1b1P4/1PN1PN2/PB1Q1PPP/R3KB1R w KQ - 0 10',
    solutionMoves: ['a3', 'Bxc3', 'Bxc3'],
    theme: 'Bishop Pair Dominance',
    description: 'Trap Black’s active dark-squared bishop and unleash the double-bishop diagonals.',
    source: 'grandmaster_daily',
    loreContext: 'Hewlêr chess grandmasters excel at converting microscopic spatial edges into permanent wins.',
    tacticalTidbit: 'Gaining the bishop pair in semi-open positions yields long-term tactical superiority.',
    solutionExplanation: 'Playing a3 forces Black to surrender the bishop for knight on c3, giving White the uncontested bishop pair and opening the b-file.'
  },
  {
    id: 'daily-05',
    title: 'The Crimson Jamadani Deflection',
    difficulty: 'Medium',
    rating: 1600,
    playerColor: 'w',
    fen: 'r4rk1/1pp2ppp/p1np4/4p3/2B1P1b1/2NP1N2/PPP2PPP/R2Q1RK1 w - - 0 11',
    solutionMoves: ['h3', 'Bh5', 'g4', 'Bg6'],
    theme: 'Kingside Pawn Storm & Pin Breaking',
    description: 'Drive back Black’s pinning bishop and claim total command over the f-file.',
    source: 'peshmerga_archive',
    loreContext: 'The traditional red Jamadani scarf stands for valor, warmth, and unyielding tactical resolve.',
    tacticalTidbit: 'Expanding on the kingside with h3-g4 breaks annoying pins safely when the center is locked.',
    solutionExplanation: 'The pawn push h3 followed by g4 breaks the bishop pin on the knight, securing White freedom of piece maneuver.'
  },
  {
    id: 'daily-06',
    title: 'Lightning Rook on the 7th Rank',
    difficulty: 'Hard',
    rating: 1920,
    playerColor: 'w',
    fen: 'r5k1/5ppp/8/8/8/8/1R3PPP/6K1 w - - 0 1',
    solutionMoves: ['Ra2', 'Re8', 'Ra8'],
    theme: 'Back Rank Corridor & Decoy',
    description: 'Activate your heavy artillery to strangle the enemy monarch on the back ranks.',
    source: 'peshmerga_archive',
    loreContext: 'A Peshmerga guard holds high mountain passes against any back-rank encirclement.',
    tacticalTidbit: 'Rooks on the 7th and 8th ranks multiply in tactical power exponentially.',
    solutionExplanation: 'Ra2 controls the open file and prevents Black escape routes, setting up fatal back-rank mating patterns.'
  },
  {
    id: 'daily-07',
    title: 'Smothered Corridor at Mount Qandil',
    difficulty: 'Master',
    rating: 2300,
    playerColor: 'w',
    fen: '6k1/5ppp/8/8/8/8/5NPP/4R1K1 w - - 0 1',
    solutionMoves: ['Re8#'],
    theme: 'Direct Back Rank Checkmate',
    description: 'Deliver the finishing strike through the undefended back-rank corridor.',
    source: 'peshmerga_archive',
    loreContext: 'At Mount Qandil, the air is crisp, the focus is pure, and calculation is exact.',
    tacticalTidbit: 'Always scan for mating nets before considering defensive or quiet moves.',
    solutionExplanation: 'Re8# delivers a pristine back-rank checkmate because Black has not created luft (an escape square) for the king.'
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
    tacticalTidbit: 'The Bxh7+ sacrifice succeeds when your knight and queen can quickly occupy g5 and h5.',
    solutionExplanation: 'Bxh7+ followed by Ng5+ and Qh5 coordinates the queen and knight for an unstoppable mating net on h7.'
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
    tacticalTidbit: 'Forcing doubled isolated pawns creates permanent endgame targets.',
    solutionExplanation: 'Nxc6 damages Black’s pawn structure on the c-file while Bd3 smoothly develops White’s bishop.'
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
    tacticalTidbit: 'Pawn breaks in the center dictate who controls the tactical tempo of the match.',
    solutionExplanation: 'Pushing e4 challenges Black’s center immediately, allowing White to open lines and dominate central squares.'
  },
  {
    id: 'daily-11',
    title: 'Halabja Resilient Defense & Decoy',
    difficulty: 'Hard',
    rating: 1780,
    playerColor: 'w',
    fen: '3r2k1/p4ppp/1p6/2p5/4R3/1P6/P1P2PPP/6K1 w - - 0 1',
    solutionMoves: ['h3', 'Kf8', 'Re7'],
    theme: 'Luft Creation & Rook Infiltration',
    description: 'Create an escape square for the king and plant your rook on the 7th rank.',
    source: 'peshmerga_archive',
    loreContext: 'Halabja stands as a beacon of eternal resilience and unwavering courage.',
    tacticalTidbit: 'Creating luft before activating the rook avoids surprise back-rank counters.',
    solutionExplanation: 'h3 completely eliminates back rank mate threats, freeing the rook to invade e7.'
  },
  {
    id: 'daily-12',
    title: 'Kirkuk Flame Clearance Sacrifice',
    difficulty: 'Master',
    rating: 2180,
    playerColor: 'w',
    fen: 'r1b2rk1/pp3ppp/2n5/2qp4/8/2NB1N2/PPP2PPP/R2QR1K1 w - - 0 12',
    solutionMoves: ['Bxh7+', 'Kxh7', 'Ng5+', 'Kg8', 'Qh5'],
    theme: 'Clearance Sacrifice & Mating Net',
    description: 'Clear the h-file and launch an unyielding attack on the enemy monarch.',
    source: 'grandmaster_daily',
    loreContext: 'The eternal fires of Kirkuk reflect the inextinguishable passion of chess mastery.',
    tacticalTidbit: 'Clearance sacrifices sacrifice material to unlock critical offensive diagonal rays.',
    solutionExplanation: 'Bxh7+ strips the king of its protective pawn shelter and sets up an unavoidable mating attack.'
  },
  {
    id: 'daily-13',
    title: 'Garmian Desert Knight Maneuver',
    difficulty: 'Medium',
    rating: 1520,
    playerColor: 'w',
    fen: 'r1bqk2r/pp2bppp/2n1pn2/2pp4/3P4/2PBPN2/PP1N1PPP/R1BQK2R w KQkq - 0 7',
    solutionMoves: ['O-O', 'O-O', 'e4'],
    theme: 'King Safety & Central Expansion',
    description: 'Castle safely and strike in the center with the e4 break.',
    source: 'peshmerga_archive',
    loreContext: 'Across the wide plains of Garmian, patience and solid preparation win battles.',
    tacticalTidbit: 'Castling before opening the center ensures your king is not caught in crossfire.',
    solutionExplanation: 'Castling brings the king to safety and enables White to push e4 with maximum rook support.'
  },
  {
    id: 'daily-14',
    title: 'Amedi Cliffside Queen Trapping',
    difficulty: 'Hard',
    rating: 1950,
    playerColor: 'w',
    fen: 'r1b1k2r/pp3ppp/2n1pn2/q1bp4/2PP4/2N2N2/PP1BBPPP/R2QK2R w KQkq - 0 8',
    solutionMoves: ['Nxd5', 'Qd8', 'Nxf6+', 'Qxf6'],
    theme: 'Discovered Attack on the Queen',
    description: 'Unleash the dark-squared bishop’s discovery and crush Black’s queen.',
    source: 'peshmerga_archive',
    loreContext: 'Perched high on a natural cliff plateau, ancient Amedi taught commanders the art of vantage points.',
    tacticalTidbit: 'Discovered attacks with check win immense tempo and tactical initiative.',
    solutionExplanation: 'Nxd5 opens a discovery from the bishop on d2 against Black’s queen on a5 while simultaneously attacking the c5 bishop.'
  },
  {
    id: 'daily-15',
    title: 'Rwandz Canyon Deflection',
    difficulty: 'Easy',
    rating: 1100,
    playerColor: 'w',
    fen: 'r1bq1rk1/ppp2ppp/2n5/3np3/1b6/2NP1N2/PPPBBPPP/R2QK2R w KQ - 0 7',
    solutionMoves: ['Nxd5', 'Bxd2+', 'Qxd2', 'Qxd5'],
    theme: 'Material Equalization & Space',
    description: 'Exchange knights on d5 and simplify into an advantageous position.',
    source: 'peshmerga_archive',
    loreContext: 'The breathtaking gorges of Rwandz demand precise footing and clear paths.',
    tacticalTidbit: 'Tactical exchanges in the center eliminate attacking outposts for Black.',
    solutionExplanation: 'Nxd5 forces Black to exchange pieces on d2 and d5, leaving White with superior development.'
  },
  {
    id: 'daily-16',
    title: 'Lalish Temple Peaceful Fortress',
    difficulty: 'Medium',
    rating: 1650,
    playerColor: 'w',
    fen: '2r2rk1/pp1b1ppp/1q2pn2/3p4/1b1P4/1PN1PN2/P2BBPPP/2RQK2R w K - 0 11',
    solutionMoves: ['O-O', 'Bxc3', 'Bxc3'],
    theme: 'Fortress Consolidation',
    description: 'Castle safely and maintain the solid pawn chain on the queenside.',
    source: 'peshmerga_archive',
    loreContext: 'The serene sacred valley of Lalish embodies peace, spiritual purity, and unshakeable inner balance.',
    tacticalTidbit: 'Maintaining piece harmony repels all aggressive enemy invasions effortlessly.',
    solutionExplanation: 'Castling removes the king from any pin on the c-file and solidifies White’s structure.'
  },
  {
    id: 'daily-17',
    title: 'Khabur River Passed Pawn Push',
    difficulty: 'Hard',
    rating: 1880,
    playerColor: 'w',
    fen: '8/5pk1/4p1p1/P7/8/6PP/5PK1/8 w - - 0 1',
    solutionMoves: ['a6', 'Kf6', 'a7'],
    theme: 'Outside Passed Pawn Escort',
    description: 'Push your distant outside passed pawn to victory while the black king is stranded.',
    source: 'peshmerga_archive',
    loreContext: 'Flowing through ancient lands, the Khabur River moves relentlessly toward its destination.',
    tacticalTidbit: 'An outside passed pawn is often unstoppable when the enemy king is cut off on the other wing.',
    solutionExplanation: 'Pushing a6 followed by a7 guarantees queen promotion on a8.'
  },
  {
    id: 'daily-18',
    title: 'Dukan Lake Double Rook Battery',
    difficulty: 'Master',
    rating: 2200,
    playerColor: 'w',
    fen: '4r1k1/5ppp/8/8/8/8/1R3PPP/1R4K1 w - - 0 1',
    solutionMoves: ['Rb8', 'Kf8', 'Rxe8+', 'Kxe8'],
    theme: 'Alekhine’s Gun Battery & Back Rank',
    description: 'Double rooks on the b-file dominate the back rank and force an endgame win.',
    source: 'grandmaster_daily',
    loreContext: 'The deep blue waters of Lake Dukan mirror the calm calculations of master tacticians.',
    tacticalTidbit: 'Doubled rooks on an open file command complete infiltration power.',
    solutionExplanation: 'Rb8 pins Black’s defending rook and forces a winning simplified king and pawn endgame.'
  }
];

export const getTodayDateKey = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getFormattedDate = (dateKey: string): string => {
  try {
    const [y, m, d] = dateKey.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date);
  } catch {
    return dateKey;
  }
};

export const getFormattedTodayDate = (): string => {
  return getFormattedDate(getTodayDateKey());
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

// Fetch live puzzle online with graceful fallback to built-in archive
export const fetchLiveDailyPuzzle = async (dateKey: string = getTodayDateKey()): Promise<DailyPuzzleData> => {
  const fallback = getDailyPuzzleForDate(dateKey);

  // If today's date, attempt to query lichess daily puzzle
  if (dateKey === getTodayDateKey()) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch('https://lichess.org/api/puzzle/daily', {
        signal: controller.signal,
        headers: { Accept: 'application/json' }
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.puzzle && data.game) {
          // Parse Lichess data
          const fen = data.game.tree?.fen || data.game.fen || fallback.fen;
          const rating = data.puzzle.rating || fallback.rating;
          const themes = Array.isArray(data.puzzle.themes) ? data.puzzle.themes.slice(0, 2).join(' & ') : 'Master Tactics';
          const pgnMoves = data.puzzle.solution || [];

          return {
            ...fallback,
            source: 'lichess',
            rating,
            theme: themes || fallback.theme,
            sourceUrl: `https://lichess.org/training/${data.puzzle.id}`,
            description: `Live Grandmaster puzzle from world arena (${rating} Elo). Find the most accurate move.`
          };
        }
      }
    } catch {
      // Fallback seamlessly to curated archive
    }
  }

  return fallback;
};

// Time remaining calculation until the next 24h reset
export const getTimeUntilNextDailyPuzzle = (): {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
} => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diffMs = tomorrow.getTime() - now.getTime();
  const totalSecs = Math.max(0, Math.floor(diffMs / 1000));

  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const seconds = totalSecs % 60;

  const formatted = `${String(hours).padStart(2, '0')}h ${String(minutes).padStart(2, '0')}m ${String(seconds).padStart(2, '0')}s`;

  return { hours, minutes, seconds, formatted };
};

const DAILY_STORAGE_KEY = 'chesskys_daily_puzzle_progress';

export const loadDailyProgress = (dateKey: string = getTodayDateKey()): DailyPuzzleProgress => {
  try {
    const raw = localStorage.getItem(DAILY_STORAGE_KEY);
    if (raw) {
      const data: DailyPuzzleProgress = JSON.parse(raw);
      const isToday = data.dateKey === dateKey;
      const solvedDates = data.solvedDates || (data.solved && data.dateKey ? [data.dateKey] : []);
      const isDateSolved = solvedDates.includes(dateKey) || (isToday && data.solved);

      // Check streak continuity
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      
      const streak = data.lastSolvedDate === yesterdayKey || data.lastSolvedDate === dateKey ? data.streak : 0;

      return {
        dateKey,
        solved: isDateSolved,
        streak,
        lastSolvedDate: data.lastSolvedDate || '',
        totalDailySolved: data.totalDailySolved || solvedDates.length,
        solvedDates
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
    totalDailySolved: 0,
    solvedDates: []
  };
};

export const saveDailyProgress = (dateKey: string, solved: boolean): DailyPuzzleProgress => {
  try {
    const prev = loadDailyProgress(dateKey);
    const solvedDates = new Set(prev.solvedDates || []);
    if (solved) {
      solvedDates.add(dateKey);
    }

    const isConsecutive = prev.lastSolvedDate === dateKey || (() => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
      return prev.lastSolvedDate === yesterdayKey;
    })();

    const updated: DailyPuzzleProgress = {
      dateKey,
      solved,
      streak: solved ? (prev.lastSolvedDate === dateKey ? prev.streak : isConsecutive ? prev.streak + 1 : 1) : prev.streak,
      lastSolvedDate: solved ? dateKey : prev.lastSolvedDate,
      totalDailySolved: solvedDates.size,
      solvedDates: Array.from(solvedDates)
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
      totalDailySolved: 1,
      solvedDates: [dateKey]
    };
  }
};

// Generate list of days in current month for the Daily Archive Calendar
export const getMonthlyCalendarDays = (year: number = new Date().getFullYear(), month: number = new Date().getMonth()): {
  dateKey: string;
  dayNumber: number;
  dayName: string;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}[] => {
  const days = [];
  const todayKey = getTodayDateKey();
  const numDays = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= numDays; d++) {
    const dayStr = String(d).padStart(2, '0');
    const monthStr = String(month + 1).padStart(2, '0');
    const dateKey = `${year}-${monthStr}-${dayStr}`;
    const dateObj = new Date(year, month, d);
    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(dateObj);

    const isToday = dateKey === todayKey;
    const isPast = dateKey < todayKey;
    const isFuture = dateKey > todayKey;

    days.push({
      dateKey,
      dayNumber: d,
      dayName,
      isToday,
      isPast,
      isFuture
    });
  }

  return days;
};

export const generateDailyShareText = (puzzle: DailyPuzzleData, streak: number): string => {
  return `⚔️ Chesskys Peshmerga Edition • Daily Chess Tactics ☀️
📅 ${puzzle.dateKey} — "${puzzle.title}"
🎯 Solved Cleanly! (${puzzle.difficulty} • ${puzzle.rating} Elo)
🔥 Daily Tactical Streak: ${streak} Days
♟️ Play Daily Challenge: https://chesskys.pro`;
};
