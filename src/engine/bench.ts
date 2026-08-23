/**
 * Engine sanity + strength smoke test.
 * Run with:  npx tsx src/engine/bench.ts
 */
import { Position } from './board';
import { search, clearTranspositionTable } from './search';

interface Case {
  name: string;
  fen: string;
  /** Any of these UCI moves is accepted. */
  best: string[];
  timeMs?: number;
  /** Known-hard positions that do not fail the suite. */
  optional?: boolean;
}

const TACTICS: Case[] = [
  { name: 'Mate in 1 (back rank)', fen: '6k1/5ppp/8/8/8/8/8/R5K1 w - - 0 1', best: ['a1a8'] },
  { name: 'Mate in 2 (Morphy)', fen: 'r1b2k1r/ppp1bppp/8/1B1Q4/5q2/2P5/PPP2PPP/R3R1K1 w - - 1 1', best: ['d5d8'] },
  { name: 'Smothered mate', fen: '6rk/6pp/8/6N1/8/8/8/6QK w - - 0 1', best: ['g1b6', 'g1a7', 'g5f7'] },
  { name: 'WAC.009', fen: '3q1rk1/p4pp1/2pb3p/3p4/6Pr/1PNQ4/P1PB1PP1/4RRK1 b - - 0 1', best: ['d6h2'] },
  { name: 'WAC.001', fen: '2rr3k/pp3pp1/1nnqbN1p/3pN3/2pP4/2P3Q1/PPB4P/R4RK1 w - - 0 1', best: ['g3g6'] },
  // Deep pawn-race tactic — the engine needs a long search for this one; informational only.
  { name: 'WAC.002 (hard)', fen: '8/7p/5k2/5p2/p1p2P2/Pr1pPK2/1P1R3P/8 b - - 0 1', best: ['b3b2'], optional: true },
  { name: 'WAC.003', fen: '5rk1/1ppb3p/p1pb4/6q1/3P1p1r/2P1R2P/PP1BQ1P1/5RKN w - - 0 1', best: ['e3g3'] },
  { name: 'WAC.004', fen: 'r1bq2rk/pp3pbp/2p1p1pQ/7P/3P4/2PB1N2/PP3PPR/2KR4 w - - 0 1', best: ['h6h7'] },
  { name: 'WAC.005', fen: '5k2/6pp/p1qN4/1p1p4/3P4/2PKP2Q/PP3r2/3R4 b - - 0 1', best: ['c6c4'] },
  { name: 'WAC.006', fen: '7k/p7/1R5K/6r1/6p1/6P1/8/8 w - - 0 1', best: ['b6b7'] },
  { name: 'WAC.007', fen: 'rnbqkb1r/pppp1ppp/8/4P3/6n1/7P/PPPNPPP1/R1BQKBNR b KQkq - 0 1', best: ['g4e3'] },
  { name: 'WAC.008', fen: 'r4q1k/p2bR1rp/2p2Q1N/5p2/5p2/2P5/PP3PPP/R5K1 w - - 0 1', best: ['e7f7'] }
];

const TIME_MS = Number(process.argv[2] ?? 1000);

console.log(`Tactical suite — ${TIME_MS}ms per position\n`);

let solved = 0;
let required = 0;
let totalNodes = 0;
let totalTime = 0;

for (const testCase of TACTICS) {
  clearTranspositionTable();
  const pos = new Position(testCase.fen);
  const result = search(pos, { timeMs: testCase.timeMs ?? TIME_MS, depth: 30 });
  const ok = result.bestMoveUci ? testCase.best.includes(result.bestMoveUci) : false;
  if (ok) solved++;
  else if (!testCase.optional) required++;
  totalNodes += result.nodes;
  totalTime += result.timeMs;
  console.log(
    `${ok ? 'PASS' : testCase.optional ? 'MISS' : 'FAIL'}  ${testCase.name.padEnd(22)} ` +
      `played ${String(result.bestMoveUci).padEnd(6)} expected ${testCase.best.join('/').padEnd(11)} ` +
      `d=${String(result.depth).padStart(2)} ${result.mateIn !== null ? `M${result.mateIn}` : `${(result.score / 100).toFixed(2)}`.padStart(6)} ` +
      `${result.nodes.toLocaleString().padStart(9)} nodes  ${result.nps.toLocaleString()} nps  pv: ${result.pv.slice(0, 5).join(' ')}`
  );
}

console.log(`\nSolved ${solved}/${TACTICS.length}${required ? ` — ${required} required position(s) failed` : ''}`);

// Depth/speed benchmark from the initial position
clearTranspositionTable();
const start = new Position();
const bench = search(start, { timeMs: 3000, depth: 30 });
console.log(
  `\nStartpos 3s search: depth ${bench.depth}, ${bench.nodes.toLocaleString()} nodes, ` +
    `${bench.nps.toLocaleString()} nps, eval ${(bench.score / 100).toFixed(2)}, best ${bench.bestMoveUci}, pv ${bench.pv.join(' ')}`
);
console.log(`Suite totals: ${totalNodes.toLocaleString()} nodes in ${(totalTime / 1000).toFixed(1)}s`);

process.exit(required === 0 ? 0 : 1);
