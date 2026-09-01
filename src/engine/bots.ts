/**
 * Bot personalities.
 *
 * Previously every bot above ~1400 searched to the same clamped depth, so the
 * "2300 Grandmaster" played identically to the "1400 Tactician". Each profile
 * now has a real, distinct search budget plus a human-like error model:
 *
 *   - `searchDepth` / `moveTimeMs` / `nodeLimit` set the raw strength ceiling
 *   - `noiseCp` blurs the evaluation of candidate moves (imprecision)
 *   - `blunderChance` occasionally plays a knowingly inferior move (oversight)
 *   - `bookVarietyPlies` keeps the opening fresh instead of always repeating
 */

import { Position, moveToUci } from './board';
import { SearchLine, search, searchRootMoves } from './search';

export interface BotDefinition {
  id: string;
  name: string;
  title: string;
  elo: number;
  avatar: string;
  description: string;
  style: string;
  badgeColor: string;
  /** Legacy field kept for existing UI code; mirrors `searchDepth`. */
  depth: number;
  /** Legacy field kept for existing UI code; mirrors `blunderChance`. */
  randomness: number;

  searchDepth: number;
  moveTimeMs: number;
  nodeLimit: number;
  noiseCp: number;
  blunderChance: number;
  blunderMaxLossCp: number;
  bookVarietyPlies: number;
  contempt: number;
}

export const BOT_DEFINITIONS: BotDefinition[] = [
  {
    id: 'bot-luffy',
    name: 'Luffy',
    title: 'Pirate King',
    elo: 2000,
    avatar: '🍖',
    description: 'Ultra-aggressive sacrificial style. Loves complex positions and wild attacks.',
    style: 'Berserker',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    depth: 6,
    randomness: 0.1,
    searchDepth: 6,
    moveTimeMs: 800,
    nodeLimit: 500_000,
    noiseCp: 50,
    blunderChance: 0.1,
    blunderMaxLossCp: 400,
    bookVarietyPlies: 6,
    contempt: -50
  },
  {
    id: 'bot-levi',
    name: 'Levi',
    title: 'Assassin',
    elo: 2200,
    avatar: '⚔️',
    description: 'Quiet positional assassin. Clinical and precise. Punishes every mistake ruthlessly.',
    style: 'Surgical Precision',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    depth: 8,
    randomness: 0.01,
    searchDepth: 8,
    moveTimeMs: 1200,
    nodeLimit: 1_200_000,
    noiseCp: 10,
    blunderChance: 0.01,
    blunderMaxLossCp: 100,
    bookVarietyPlies: 4,
    contempt: 10
  },
  {
    id: 'bot-batman',
    name: 'Batman',
    title: 'Dark Knight',
    elo: 1800,
    avatar: '🦇',
    description: 'Defensive fortress. Focuses on solid setups and unbreakable defense. Counter-attacks only when safe.',
    style: 'Fortress',
    badgeColor: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    depth: 5,
    randomness: 0.05,
    searchDepth: 5,
    moveTimeMs: 600,
    nodeLimit: 400_000,
    noiseCp: 30,
    blunderChance: 0.05,
    blunderMaxLossCp: 200,
    bookVarietyPlies: 8,
    contempt: 20
  },
  {
    id: 'bot-joker',
    name: 'Joker',
    title: 'Agent of Chaos',
    elo: 1500,
    avatar: '🤡',
    description: 'Chaotic unpredictable. Makes random sacrifices and bizarre moves just to confuse you.',
    style: 'Chaotic',
    badgeColor: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
    depth: 3,
    randomness: 0.5,
    searchDepth: 3,
    moveTimeMs: 300,
    nodeLimit: 100_000,
    noiseCp: 300,
    blunderChance: 0.4,
    blunderMaxLossCp: 800,
    bookVarietyPlies: 10,
    contempt: -100
  },

  {
    id: 'bot-pawn',
    name: 'Pawn Cadet',
    title: 'Novice',
    elo: 400,
    avatar: '🐣',
    description: 'Enthusiastic beginner. Sees one move ahead, grabs whatever is in reach and hangs pieces often.',
    style: 'Casual & Relaxed',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    depth: 1,
    randomness: 0.4,
    searchDepth: 1,
    moveTimeMs: 60,
    nodeLimit: 3_000,
    noiseCp: 260,
    blunderChance: 0.4,
    blunderMaxLossCp: 900,
    bookVarietyPlies: 8,
    contempt: 0
  },
  {
    id: 'bot-scout',
    name: 'Zagros Scout',
    title: 'Beginner',
    elo: 700,
    avatar: '🪶',
    description: 'Learning the ropes. Defends simple threats and counts material, but misses two-move tactics.',
    style: 'Cautious Material Counter',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    depth: 2,
    randomness: 0.22,
    searchDepth: 2,
    moveTimeMs: 120,
    nodeLimit: 15_000,
    noiseCp: 150,
    blunderChance: 0.22,
    blunderMaxLossCp: 550,
    bookVarietyPlies: 8,
    contempt: 0
  },
  {
    id: 'bot-knight',
    name: 'Knight Errant',
    title: 'Apprentice',
    elo: 1050,
    avatar: '🛡️',
    description: 'Understands forks and basic development. Punishes hanging pieces but drifts in quiet positions.',
    style: 'Active Pieces',
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    depth: 3,
    randomness: 0.12,
    searchDepth: 3,
    moveTimeMs: 250,
    nodeLimit: 60_000,
    noiseCp: 90,
    blunderChance: 0.12,
    blunderMaxLossCp: 380,
    bookVarietyPlies: 6,
    contempt: 0
  },
  {
    id: 'bot-bishop',
    name: 'Bishop Tactician',
    title: 'Intermediate',
    elo: 1450,
    avatar: '⚔️',
    description: 'Sharp eye for pins, skewers and diagonal assaults. Calculates short forcing lines accurately.',
    style: 'Tactical & Aggressive',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    depth: 5,
    randomness: 0.05,
    searchDepth: 5,
    moveTimeMs: 500,
    nodeLimit: 300_000,
    noiseCp: 45,
    blunderChance: 0.05,
    blunderMaxLossCp: 260,
    bookVarietyPlies: 6,
    contempt: 5
  },
  {
    id: 'bot-rook',
    name: 'Rook Mastermind',
    title: 'Master',
    elo: 1900,
    avatar: '🏰',
    description: 'Deep strategic planning, open-file control and king-safety calculation. Rarely gives anything away.',
    style: 'Positional Precision',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    depth: 7,
    randomness: 0.015,
    searchDepth: 7,
    moveTimeMs: 900,
    nodeLimit: 900_000,
    noiseCp: 20,
    blunderChance: 0.015,
    blunderMaxLossCp: 150,
    bookVarietyPlies: 4,
    contempt: 10
  },
  {
    id: 'bot-queen',
    name: 'Grandmaster DeepAI',
    title: 'Grandmaster',
    elo: 2350,
    avatar: '👑',
    description: 'Full-strength search with quiescence, null-move pruning and a transposition table. Merciless.',
    style: 'Universal Champion',
    badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    depth: 10,
    randomness: 0,
    searchDepth: 11,
    moveTimeMs: 1600,
    nodeLimit: 3_000_000,
    noiseCp: 6,
    blunderChance: 0,
    blunderMaxLossCp: 0,
    bookVarietyPlies: 3,
    contempt: 15
  },
  {
    id: 'bot-titan',
    name: 'Peshmerga Titan',
    title: 'Immortal',
    elo: 2650,
    avatar: '🦅',
    description: 'Maximum strength. Long thinking time, no deliberate mistakes, plays for the win in every position.',
    style: 'Relentless Calculation',
    badgeColor: 'bg-[#F5C453]/20 text-[#F5C453] border-[#F5C453]/40',
    depth: 14,
    randomness: 0,
    searchDepth: 16,
    moveTimeMs: 3200,
    nodeLimit: 8_000_000,
    noiseCp: 0,
    blunderChance: 0,
    blunderMaxLossCp: 0,
    bookVarietyPlies: 2,
    contempt: 25
  }
];

export const getBotDefinition = (id: string): BotDefinition =>
  BOT_DEFINITIONS.find(bot => bot.id === id) ?? BOT_DEFINITIONS[3];

/** Box–Muller gaussian noise. */
const gaussian = (sigma: number) => {
  if (sigma <= 0) return 0;
  const u = Math.max(1e-9, Math.random());
  const v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v) * sigma;
};

export interface BotMoveResult {
  uci: string | null;
  score: number;
  depth: number;
  nodes: number;
  timeMs: number;
  /** True when the personality deliberately chose a weaker move. */
  deliberateError: boolean;
  pv: string[];
  candidates: { uci: string; score: number }[];
}

/**
 * Picks a move for a bot personality. Strong bots run the full search; weaker
 * ones score every root move so the error model has honest alternatives to
 * choose from.
 */
export function chooseBotMove(pos: Position, bot: BotDefinition): BotMoveResult {
  const started = Date.now();
  const legal = pos.legalMoves();
  if (legal.length === 0) {
    return { uci: null, score: 0, depth: 0, nodes: 0, timeMs: 0, deliberateError: false, pv: [], candidates: [] };
  }
  if (legal.length === 1) {
    return {
      uci: moveToUci(legal[0]),
      score: 0,
      depth: 1,
      nodes: 1,
      timeMs: Date.now() - started,
      deliberateError: false,
      pv: [moveToUci(legal[0])],
      candidates: []
    };
  }

  const ply = pos.history.length + (pos.fullmove - 1) * 2;
  const wantsVariety = ply < bot.bookVarietyPlies;
  const needsCandidates = bot.noiseCp > 0 || bot.blunderChance > 0 || wantsVariety;

  // Strong, precise bots: single full-strength search.
  if (!needsCandidates) {
    const result = search(pos, {
      depth: bot.searchDepth,
      timeMs: bot.moveTimeMs,
      nodes: bot.nodeLimit,
      contempt: bot.contempt
    });
    return {
      uci: result.bestMoveUci,
      score: result.score,
      depth: result.depth,
      nodes: result.nodes,
      timeMs: Date.now() - started,
      deliberateError: false,
      pv: result.pv,
      candidates: []
    };
  }

  // Candidate-based selection.
  let lines: SearchLine[];
  if (bot.searchDepth >= 6) {
    // Deep bots: one strong search, then a cheap shallow pass for alternatives.
    const main = search(pos, {
      depth: bot.searchDepth,
      timeMs: bot.moveTimeMs,
      nodes: bot.nodeLimit,
      contempt: bot.contempt
    });
    const shallow = searchRootMoves(pos, {
      depth: Math.min(4, bot.searchDepth - 2),
      timeMs: Math.max(120, Math.round(bot.moveTimeMs * 0.3)),
      contempt: bot.contempt
    });
    lines = shallow.map(line =>
      line.uci === main.bestMoveUci ? { ...line, score: Math.max(line.score, main.score) } : line
    );
    if (main.bestMoveUci && !lines.some(line => line.uci === main.bestMoveUci)) {
      lines.unshift({ move: main.bestMove, uci: main.bestMoveUci, score: main.score, mateIn: main.mateIn });
    }
  } else {
    lines = searchRootMoves(pos, {
      depth: bot.searchDepth,
      timeMs: bot.moveTimeMs,
      nodes: bot.nodeLimit,
      contempt: bot.contempt
    });
  }

  if (lines.length === 0) {
    return {
      uci: moveToUci(legal[0]),
      score: 0,
      depth: bot.searchDepth,
      nodes: 0,
      timeMs: Date.now() - started,
      deliberateError: false,
      pv: [],
      candidates: []
    };
  }

  lines.sort((a, b) => b.score - a.score);
  const bestScore = lines[0].score;
  let deliberateError = false;

  // Deliberate oversight: choose uniformly among moves that lose a bounded amount.
  if (Math.random() < bot.blunderChance) {
    const pool = lines.filter(line => bestScore - line.score <= bot.blunderMaxLossCp);
    if (pool.length > 1) {
      const pick = pool[1 + Math.floor(Math.random() * (pool.length - 1))];
      deliberateError = pick.uci !== lines[0].uci;
      return {
        uci: pick.uci,
        score: pick.score,
        depth: bot.searchDepth,
        nodes: 0,
        timeMs: Date.now() - started,
        deliberateError,
        pv: [pick.uci],
        candidates: lines.slice(0, 5).map(line => ({ uci: line.uci, score: line.score }))
      };
    }
  }

  // Opening variety: pick among near-equal first moves.
  if (wantsVariety) {
    const pool = lines.filter(line => bestScore - line.score <= 35).slice(0, 4);
    if (pool.length > 1) {
      const pick = pool[Math.floor(Math.random() * pool.length)];
      return {
        uci: pick.uci,
        score: pick.score,
        depth: bot.searchDepth,
        nodes: 0,
        timeMs: Date.now() - started,
        deliberateError: false,
        pv: [pick.uci],
        candidates: lines.slice(0, 5).map(line => ({ uci: line.uci, score: line.score }))
      };
    }
  }

  // Imprecision: blur each candidate's score and take the perceived best.
  let chosen = lines[0];
  let bestPerceived = -Infinity;
  for (const line of lines) {
    const perceived = line.score + gaussian(bot.noiseCp);
    if (perceived > bestPerceived) {
      bestPerceived = perceived;
      chosen = line;
    }
  }
  deliberateError = chosen.uci !== lines[0].uci;

  return {
    uci: chosen.uci,
    score: chosen.score,
    depth: bot.searchDepth,
    nodes: 0,
    timeMs: Date.now() - started,
    deliberateError,
    pv: [chosen.uci],
    candidates: lines.slice(0, 5).map(line => ({ uci: line.uci, score: line.score }))
  };
}
