/**
 * Multiplayer rule tests.
 * Run with:  npx tsx src/services/matchRules.test.ts
 *
 * These cover the bugs the online mode used to have: illegal/forged positions
 * being accepted, moves played out of turn, clocks that never flagged, the
 * increment being applied to the wrong side, and promotions being silently
 * turned into queens.
 */

import { OnlineMatchPlayer, OnlineMatchSession, TimeControl } from '../types/chess';
import {
  buildSession,
  computeMoveUpdate,
  computeTimeoutUpdate,
  hasFlaggedAt,
  remainingMsAt,
  verifySession
} from './matchRules';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name}${detail !== undefined ? ` → ${JSON.stringify(detail)}` : ''}`);
  }
}

const equal = (name: string, actual: unknown, expected: unknown) =>
  check(name, JSON.stringify(actual) === JSON.stringify(expected), { actual, expected });

/* ------------------------------------------------------------------ */

const ALICE: OnlineMatchPlayer = { uid: 'alice', displayName: 'Alice', elo: 1500 };
const BOB: OnlineMatchPlayer = { uid: 'bob', displayName: 'Bob', elo: 1500 };
const ENGINE: OnlineMatchPlayer = {
  uid: 'ww_bot',
  displayName: 'Engine',
  elo: 1900,
  isBot: true,
  botId: 'bot-rook'
};

const BLITZ: TimeControl = {
  id: 'blitz-3-2',
  name: '3 | 2',
  initialSeconds: 180,
  incrementSeconds: 2,
  category: 'blitz'
};

const UNLIMITED: TimeControl = {
  id: 'unlimited',
  name: 'Unlimited',
  initialSeconds: 0,
  incrementSeconds: 0,
  category: 'unlimited'
};

const T0 = 1_700_000_000_000;

const newGame = (timeControl = BLITZ, options: Partial<Parameters<typeof buildSession>[0]> = {}) =>
  buildSession({
    id: 'match_test',
    host: ALICE,
    guest: BOB,
    timeControl,
    hostIsWhite: true,
    now: T0,
    ...options
  });

/** Plays a list of moves as the correct players, returning the final session. */
function playAll(
  session: OnlineMatchSession,
  moves: { from: string; to: string; promotion?: string }[],
  startTime = T0,
  stepMs = 1000
): OnlineMatchSession {
  let current = session;
  let now = startTime;
  for (const move of moves) {
    now += stepMs;
    const mover = current.turn === 'w' ? current.whitePlayer.uid : current.blackPlayer.uid;
    const outcome = computeMoveUpdate(current, { actingUid: mover, move, now });
    if (!outcome.ok || !outcome.next) {
      throw new Error(`Unexpected rejection at ${move.from}${move.to}: ${outcome.reason}`);
    }
    current = outcome.next;
  }
  return current;
}

/* ------------------------------------------------------------------ *
 * 1. Basic legality
 * ------------------------------------------------------------------ */

{
  const session = newGame();
  const outcome = computeMoveUpdate(session, {
    actingUid: 'alice',
    move: { from: 'e2', to: 'e4' },
    now: T0 + 1000
  });
  check('legal opening move accepted', outcome.ok);
  equal('SAN recorded', outcome.san, 'e4');
  equal('move list appended', outcome.next?.moves, ['e4']);
  equal('turn handed over', outcome.next?.turn, 'b');
  equal('move count', outcome.next?.moveCount, 1);
}

{
  const session = newGame();
  const outcome = computeMoveUpdate(session, {
    actingUid: 'alice',
    move: { from: 'e2', to: 'e5' },
    now: T0 + 1000
  });
  check('illegal move rejected', !outcome.ok && outcome.code === 'illegal_move', outcome);
  check('illegal move writes nothing', outcome.patch === undefined);
}

{
  const session = newGame();
  const outcome = computeMoveUpdate(session, {
    actingUid: 'bob',
    move: { from: 'e7', to: 'e5' },
    now: T0 + 1000
  });
  check('moving out of turn rejected', !outcome.ok && outcome.code === 'wrong_turn', outcome);
}

{
  const session = newGame();
  const outcome = computeMoveUpdate(session, {
    actingUid: 'mallory',
    move: { from: 'e2', to: 'e4' },
    now: T0 + 1000
  });
  check('non-participant rejected', !outcome.ok && outcome.code === 'not_a_player', outcome);
}

{
  // Alice tries to move Bob's pieces for him.
  const session = playAll(newGame(), [{ from: 'e2', to: 'e4' }]);
  const outcome = computeMoveUpdate(session, {
    actingUid: 'alice',
    moverUid: 'bob',
    move: { from: 'e7', to: 'e5' },
    now: T0 + 5000
  });
  check('playing for the opponent rejected', !outcome.ok && outcome.code === 'not_your_move', outcome);
}

{
  // ...but driving your own engine opponent is allowed.
  const botGame = buildSession({
    id: 'm',
    host: ALICE,
    guest: ENGINE,
    timeControl: BLITZ,
    hostIsWhite: true,
    vsBot: true,
    now: T0
  });
  const afterWhite = playAll(botGame, [{ from: 'e2', to: 'e4' }]);
  const outcome = computeMoveUpdate(afterWhite, {
    actingUid: 'alice',
    moverUid: 'ww_bot',
    move: { from: 'e7', to: 'e5' },
    now: T0 + 5000
  });
  check('engine opponent move accepted', outcome.ok, outcome);
}

/* ------------------------------------------------------------------ *
 * 2. Terminal states
 * ------------------------------------------------------------------ */

{
  // Fool's mate
  const session = playAll(newGame(UNLIMITED), [
    { from: 'f2', to: 'f3' },
    { from: 'e7', to: 'e5' },
    { from: 'g2', to: 'g4' },
    { from: 'd8', to: 'h4' }
  ]);
  equal("fool's mate detected", session.status, 'checkmate');
  equal('winner is black', session.winner, 'b');
  equal('final move list', session.moves, ['f3', 'e5', 'g4', 'Qh4#']);

  const afterMate = computeMoveUpdate(session, {
    actingUid: 'alice',
    move: { from: 'e1', to: 'f2' },
    now: T0 + 60_000
  });
  check('no moves after mate', !afterMate.ok && afterMate.code === 'match_finished');
}

{
  // Stalemate: black king on a8, white queen c7, white king somewhere safe.
  const session = buildSession({
    id: 'm',
    host: ALICE,
    guest: BOB,
    timeControl: UNLIMITED,
    hostIsWhite: true,
    now: T0
  });
  session.startFen = 'k7/7Q/8/8/8/8/8/K7 w - - 0 1';
  session.fen = session.startFen;
  const outcome = computeMoveUpdate(session, {
    actingUid: 'alice',
    move: { from: 'h7', to: 'c7' },
    now: T0 + 1000
  });
  equal('stalemate detected', outcome.next?.status, 'draw');
  equal('stalemate reason', outcome.next?.reason, 'Draw by stalemate.');
}

{
  // Underpromotion must survive the round trip (the old code forced a queen).
  const session = buildSession({
    id: 'm',
    host: ALICE,
    guest: BOB,
    timeControl: UNLIMITED,
    hostIsWhite: true,
    now: T0
  });
  session.startFen = '8/P6k/8/8/8/8/8/K7 w - - 0 1';
  session.fen = session.startFen;
  const outcome = computeMoveUpdate(session, {
    actingUid: 'alice',
    move: { from: 'a7', to: 'a8', promotion: 'n' },
    now: T0 + 1000
  });
  equal('underpromotion recorded', outcome.san, 'a8=N');
  equal('promotion in uci list', outcome.next?.ucis, ['a7a8n']);
}

/* ------------------------------------------------------------------ *
 * 3. Tamper detection
 * ------------------------------------------------------------------ */

{
  const session = playAll(newGame(UNLIMITED), [
    { from: 'e2', to: 'e4' },
    { from: 'e7', to: 'e5' }
  ]);

  // A cheating client rewrites the FEN to give itself an extra queen.
  const forged: OnlineMatchSession = {
    ...session,
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPPQPPP/RNBQKBNR w KQkq - 0 3'
  };

  const verification = verifySession(forged);
  check('forged position detected', !verification.ok, verification.reason);

  const outcome = computeMoveUpdate(forged, {
    actingUid: 'alice',
    move: { from: 'g1', to: 'f3' },
    now: T0 + 9000
  });
  check('moves on a forged position rejected', !outcome.ok && outcome.code === 'corrupt_state', outcome);
}

{
  const session = playAll(newGame(UNLIMITED), [{ from: 'e2', to: 'e4' }]);
  const forged: OnlineMatchSession = { ...session, moves: ['e4', 'Qh5'] };
  const verification = verifySession(forged);
  check('injected impossible move detected', !verification.ok, verification.reason);
}

/* ------------------------------------------------------------------ *
 * 4. Clocks
 * ------------------------------------------------------------------ */

{
  const session = newGame();
  equal('clock idle before both sides move', session.clock.running, false);
  equal('white starts with 180s', remainingMsAt(session, 'w', T0), 180_000);

  // White's first move: the clock is not running yet, so nothing is charged.
  const first = computeMoveUpdate(session, {
    actingUid: 'alice',
    move: { from: 'e2', to: 'e4' },
    now: T0 + 30_000
  });
  equal('no time charged on move 1', first.next?.clock.whiteMs, 180_000 + 2000);
  equal('clock still idle after one move', first.next?.clock.running, false);

  // Black replies after 10s — that starts the clock.
  const second = computeMoveUpdate(first.next!, {
    actingUid: 'bob',
    move: { from: 'e7', to: 'e5' },
    now: T0 + 40_000
  });
  equal('clock running after both moved', second.next?.clock.running, true);
  equal('black keeps full time plus increment', second.next?.clock.blackMs, 180_000 + 2000);

  // White thinks for 5s.
  const third = computeMoveUpdate(second.next!, {
    actingUid: 'alice',
    move: { from: 'g1', to: 'f3' },
    now: T0 + 45_000
  });
  equal('white charged 5s and given 2s increment', third.next?.clock.whiteMs, 182_000 - 5_000 + 2_000);
  equal('black untouched by white move', third.next?.clock.blackMs, 182_000);

  // Derived remaining time counts down for the side to move only.
  const live = third.next!;
  equal('black clock counts down live', remainingMsAt(live, 'b', T0 + 48_000), 182_000 - 3_000);
  equal('white clock frozen while waiting', remainingMsAt(live, 'w', T0 + 48_000), 179_000);
}

{
  // Unlimited games never flag.
  const session = playAll(newGame(UNLIMITED), [
    { from: 'e2', to: 'e4' },
    { from: 'e7', to: 'e5' }
  ]);
  check('unlimited clock never flags', !hasFlaggedAt(session, T0 + 10 ** 9));
  equal('unlimited timeout claim is a no-op', computeTimeoutUpdate(session, T0 + 10 ** 9), null);
}

{
  // A flag fall is detected and settled.
  const session = playAll(newGame(), [
    { from: 'e2', to: 'e4' },
    { from: 'e7', to: 'e5' }
  ]);
  const flagTime = session.clock.turnStartedAt + 200_000; // white has 3 minutes
  check('flag detected after the clock runs out', hasFlaggedAt(session, flagTime));
  const patch = computeTimeoutUpdate(session, flagTime);
  equal('timeout status', patch?.status, 'timeout');
  equal('timeout winner', patch?.winner, 'b');
  equal('no premature timeout', computeTimeoutUpdate(session, session.clock.turnStartedAt + 1_000), null);
}

{
  // Moving after your own flag has fallen ends the game instead of being accepted.
  const session = playAll(newGame(), [
    { from: 'e2', to: 'e4' },
    { from: 'e7', to: 'e5' }
  ]);
  const outcome = computeMoveUpdate(session, {
    actingUid: 'alice',
    move: { from: 'g1', to: 'f3' },
    now: session.clock.turnStartedAt + 200_000
  });
  check('move after flag rejected', !outcome.ok && outcome.code === 'flagged', outcome);
  equal('flag settles the match', outcome.next?.status, 'timeout');
  equal('flag winner', outcome.next?.winner, 'b');
}

{
  // Timeout against a bare king is a draw, not a win.
  const session = buildSession({
    id: 'm',
    host: ALICE,
    guest: BOB,
    timeControl: { ...BLITZ, initialSeconds: 10, incrementSeconds: 0 },
    hostIsWhite: true,
    now: T0
  });
  session.startFen = '7k/8/8/8/8/8/8/6QK b - - 0 1';
  session.fen = session.startFen;
  session.turn = 'b';
  session.clock = { ...session.clock, running: true, turnStartedAt: T0 };

  // Black flags, but White has queen + king → White wins.
  const win = computeTimeoutUpdate(session, T0 + 20_000);
  equal('timeout with mating material is a win', win?.status, 'timeout');

  const bare: OnlineMatchSession = {
    ...session,
    startFen: '7k/8/8/8/8/8/8/7K b - - 0 1',
    fen: '7k/8/8/8/8/8/8/7K b - - 0 1'
  };
  const draw = computeTimeoutUpdate(bare, T0 + 20_000);
  equal('timeout without mating material is a draw', draw?.status, 'draw');
}

/* ------------------------------------------------------------------ *
 * 5. Threefold repetition
 * ------------------------------------------------------------------ */

{
  const session = playAll(newGame(UNLIMITED), [
    { from: 'g1', to: 'f3' },
    { from: 'g8', to: 'f6' },
    { from: 'f3', to: 'g1' },
    { from: 'f6', to: 'g8' },
    { from: 'g1', to: 'f3' },
    { from: 'g8', to: 'f6' },
    { from: 'f3', to: 'g1' },
    { from: 'f6', to: 'g8' }
  ]);
  equal('threefold repetition is a draw', session.status, 'draw');
}

/* ------------------------------------------------------------------ *
 * 6. Full-game simulation with alternating clients
 * ------------------------------------------------------------------ */

{
  // Scholar's mate, played as two independent "clients" that only ever see the
  // stored session — the way the real transaction works.
  let session = newGame(BLITZ);
  const script: { uid: string; from: string; to: string }[] = [
    { uid: 'alice', from: 'e2', to: 'e4' },
    { uid: 'bob', from: 'e7', to: 'e5' },
    { uid: 'alice', from: 'f1', to: 'c4' },
    { uid: 'bob', from: 'b8', to: 'c6' },
    { uid: 'alice', from: 'd1', to: 'h5' },
    { uid: 'bob', from: 'g8', to: 'f6' },
    { uid: 'alice', from: 'h5', to: 'f7' }
  ];

  let now = T0;
  let rejected = 0;
  for (const step of script) {
    now += 2_000;
    // Both clients try to move every turn; only the right one should succeed.
    for (const uid of ['alice', 'bob']) {
      const outcome = computeMoveUpdate(session, {
        actingUid: uid,
        move: { from: step.from, to: step.to },
        now
      });
      if (uid === step.uid) {
        if (!outcome.ok) throw new Error(`Expected ${uid} to move: ${outcome.reason}`);
        session = outcome.next!;
      } else if (!outcome.ok) {
        rejected++;
      }
    }
  }

  equal("scholar's mate result", session.status, 'checkmate');
  equal('white wins', session.winner, 'w');
  equal('every wrong-turn attempt rejected', rejected, script.length);
  equal('move list length', session.moves.length, 7);
  check('final position verifies', verifySession(session).ok);
  check(
    'both clocks still positive',
    remainingMsAt(session, 'w', now) > 0 && remainingMsAt(session, 'b', now) > 0
  );
}

/* ------------------------------------------------------------------ */

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
