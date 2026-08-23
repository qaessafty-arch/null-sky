# Chesskys PRO

> free to take , just don't kill it

A Kurdish/Peshmerga-themed chess platform: engine bots, daily tactics puzzles,
analysis, friends and private chat, worldwide online matches, and the Respect
honour system.

React 19 + TypeScript + Vite + Tailwind 4, with Firebase Auth/Firestore for
accounts, social features and live matches.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build
npm run lint       # tsc --noEmit
npm test           # engine perft + tactics + multiplayer rules
```

---

## The chess engine

`src/engine/` is a self-contained engine. It does **not** use chess.js for
search — chess.js sustains roughly 6k nodes/second here, which caps a search at
about three plies. The engine core is a 0x88 board with packed 32-bit moves and
no allocation in the hot loop, and runs at **~350k nodes/second** in a browser
worker.

| File | Purpose |
| --- | --- |
| `board.ts` | 0x88 representation, legal move generation, make/unmake, Zobrist hashing |
| `evaluate.ts` | Tapered middlegame/endgame evaluation |
| `search.ts` | Iterative deepening PVS, transposition table, quiescence, pruning |
| `bots.ts` | Bot personalities and their error models |
| `engine.worker.ts` / `client.ts` | Worker + promise-based client (with in-thread fallback) |

**Search features:** iterative deepening with aspiration windows, principal
variation search, a 1M-entry transposition table, quiescence search with delta
pruning and MVV-LVA ordering, null-move pruning, late move reductions, futility
and reverse-futility pruning, check extensions, killer moves, a history
heuristic, mate-distance pruning, and repetition/fifty-move detection.

**Evaluation:** tapered material and piece-square tables, pawn structure
(doubled, isolated, passed by rank), mobility per piece type, bishop pair, rook
on open/semi-open files and the seventh rank, king pawn shield, and tempo.

### Verification

```bash
npm run test:engine
```

* `perft.test.ts` — six positions (startpos, Kiwipete, en-passant, promotion,
  castling edge cases) verified against the published node counts, ~16.5M nodes.
* `bench.ts` — tactical suite (mates, WAC positions) plus a speed benchmark.
  Typical result: 11/12 solved at 800 ms/position, depth 12 in 3 s from the
  initial position.

### Bot ladder

Every bot has a real search budget and a distinct error model
(`noiseCp` blurs its evaluation, `blunderChance` makes it deliberately overlook
something). Earlier versions clamped every bot to depth 3, so the "2300
Grandmaster" and the "1400 Tactician" played identically.

| Bot | Elo | Depth | Time | Error model |
| --- | --- | --- | --- | --- |
| Pawn Cadet | 400 | 1 | 60 ms | very noisy, blunders 40% of moves |
| Zagros Scout | 700 | 2 | 120 ms | noisy, blunders 22% |
| Knight Errant | 1050 | 3 | 250 ms | blunders 12% |
| Bishop Tactician | 1450 | 5 | 500 ms | blunders 5% |
| Rook Mastermind | 1900 | 7 | 900 ms | blunders 1.5% |
| Grandmaster DeepAI | 2350 | 11 | 1.6 s | near-perfect |
| Peshmerga Titan | 2650 | 16 | 3.2 s | full strength, no deliberate errors |

The search always runs in a Web Worker, so a Titan thinking for three seconds
never freezes the board, the clocks or the UI.

---

## Online multiplayer

`src/services/matchRules.ts` holds the rules as **pure functions**;
`src/services/onlineMatchService.ts` is the Firestore IO around them. That split
is what makes the multiplayer testable:

```bash
npm run test:multiplayer   # 50 assertions, no Firebase required
```

### How a move is made

1. The client calls `submitMove(matchId, uid, { from, to, promotion })`.
2. Inside a **Firestore transaction** the current match document is read and
   `computeMoveUpdate` decides everything:
   * is the game still running?
   * is the caller a player, and is it their colour's turn?
   * does replaying the stored SAN list reproduce the stored FEN?
     (if not the state was tampered with and the move is refused)
   * is the move legal **in the stored position** — not in whatever the caller
     claims the position is?
   * has the mover's flag already fallen?
3. Only then is a field-level patch written, including the new clock.

Because it is a transaction, two clients can never interleave writes, and a
client cannot push a position it invented.

### Clocks

The document stores `clock.whiteMs`, `clock.blackMs`, `clock.incrementMs` and
`clock.turnStartedAt`; remaining time is always *derived*, never ticked into the
database. Consequences:

* a laggy, sleeping or reloaded tab cannot desync,
* the increment is applied to the mover only,
* the clock does not start until both players have made a move (an unanswered
  challenge can never flag),
* a flag fall is settled by whichever client notices first via `claimTimeout`,
  and the transaction re-verifies it,
* timing out against a bare king is scored as a draw, not a loss.

Client clocks are corrected against Firestore's own `serverTimestamp()` with a
rolling offset, so a player with a wrong system clock cannot gain time.

### Matchmaking

Tickets in `matchmaking_queue` are claimed inside a transaction that writes both
tickets *and* the new match document together. Exactly one of two racing clients
wins the claim; the loser's transaction retries, sees `status: 'matched'` and
backs off. The claimant writes the opponent's profile into the ticket it claims,
so the waiting player is told who they are actually facing.

### Everything else

Presence heartbeats every 8 s, a "reconnecting" banner after 25 s and a claimable
win after 60 s; draw offer / accept / decline; abort within the first two moves;
resign with confirmation; rematch with swapped colours; spectator mode for anyone
with the link; invite links (`?match=<id>`); live move history with position
review; captured material; a worker-driven evaluation bar.

Engine opponents in online mode are labelled `ENGINE` in the UI and are driven by
the human player's own client through the same validated `submitMove` path.

---

## Security model

`firestore.rules` enforces:

* direct messages readable and writable only by the two participants,
* matches writable only by their two players,
* matches are append-only — the move list grows by at most one entry per update,
  players/time control/start position are immutable, and a finished game cannot
  be rewritten (only rematch links may be added),
* matchmaking tickets belong to their creator; another player may only set the
  pairing fields when claiming one,
* single user-profile reads are public, but enumerating all users requires an
  account.

**Known gaps** (documented rather than hidden):

* Guests play unauthenticated (`guest_` uids). Rules therefore still allow
  unauthenticated writes for guest-owned documents, subject to the same
  append-only invariants. Enabling Firebase Anonymous Auth would close this.
* Move *legality* is enforced by the transaction, not by security rules — rules
  cannot play chess. A modified client could still write a legal-looking but
  arbitrary position; the opponent's client detects it by replaying the move
  list (`verifySession`) and refuses to continue. Full authority needs a Cloud
  Function.
* Ratings are still applied client-side.

---

## Project layout

```
src/
  engine/         chess engine core + worker (perft- and tactics-tested)
  services/       Firestore IO; matchRules.ts holds the pure, tested match logic
  components/     UI
  context/        auth + profile
  utils/          chessEngine.ts (chess.js <-> engine bridge), audio, themes, puzzles
```
