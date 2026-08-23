/**
 * Perft verification for the 0x88 engine core.
 * Run with:  npx tsx src/engine/perft.test.ts
 */
import { Position } from './board';

const buffers: Int32Array[] = [];
const bufferAt = (depth: number) => (buffers[depth] ||= new Int32Array(256));

function perft(pos: Position, depth: number): number {
  if (depth === 0) return 1;
  const buffer = bufferAt(depth);
  const count = pos.generateMoves(buffer);
  let nodes = 0;
  for (let i = 0; i < count; i++) {
    if (pos.makeMove(buffer[i])) {
      nodes += depth === 1 ? 1 : perft(pos, depth - 1);
      pos.unmakeMove();
    }
  }
  return nodes;
}

const CASES: { name: string; fen: string; expected: number[] }[] = [
  {
    name: 'startpos',
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    expected: [20, 400, 8902, 197281, 4865609]
  },
  {
    name: 'kiwipete',
    fen: 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1',
    expected: [48, 2039, 97862, 4085603]
  },
  {
    name: 'position 3 (endgame/ep)',
    fen: '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1',
    expected: [14, 191, 2812, 43238, 674624]
  },
  {
    name: 'position 4 (promotions)',
    fen: 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1',
    expected: [6, 264, 9467, 422333]
  },
  {
    name: 'position 5',
    fen: 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8',
    expected: [44, 1486, 62379, 2103487]
  },
  {
    name: 'position 6',
    fen: 'r4rk1/1pp1qppp/p1np1n2/2b1p1B1/2B1P1b1/P1NP1N2/1PP1QPPP/R4RK1 w - - 0 10',
    expected: [46, 2079, 89890, 3894594]
  }
];

let failures = 0;
let totalNodes = 0;
const started = Date.now();

for (const testCase of CASES) {
  for (let depth = 1; depth <= testCase.expected.length; depth++) {
    const pos = new Position(testCase.fen);
    const t0 = Date.now();
    const nodes = perft(pos, depth);
    const ms = Date.now() - t0;
    totalNodes += nodes;
    const expected = testCase.expected[depth - 1];
    const ok = nodes === expected;
    if (!ok) failures++;
    const nps = ms > 0 ? Math.round(nodes / (ms / 1000)) : nodes;
    console.log(
      `${ok ? 'PASS' : 'FAIL'}  ${testCase.name.padEnd(24)} depth ${depth}  ${String(nodes).padStart(9)}` +
        `${ok ? '' : ` (expected ${expected})`}  ${String(ms).padStart(6)}ms  ${nps.toLocaleString()} nps`
    );
    // Position must be perfectly restored after the traversal
    if (pos.fen() !== new Position(testCase.fen).fen()) {
      console.log(`FAIL  ${testCase.name}: position not restored after perft`);
      failures++;
    }
  }
}

const seconds = (Date.now() - started) / 1000;
console.log(
  `\n${failures === 0 ? 'ALL PERFT TESTS PASSED' : `${failures} PERFT FAILURES`} — ` +
    `${totalNodes.toLocaleString()} nodes in ${seconds.toFixed(1)}s ` +
    `(${Math.round(totalNodes / seconds).toLocaleString()} nps)`
);

process.exit(failures === 0 ? 0 : 1);
