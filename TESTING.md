# How to test Chesskys PRO

## 1. Automated checks (no browser, no Firebase)

```bash
npm install
npm run lint             # tsc --noEmit — must be silent
npm test                 # engine + multiplayer suites
```

Individually:

```bash
npm run test:engine      # perft (correctness) + tactical suite (strength)
npm run test:multiplayer # 50 assertions on the match rules
npm run bench            # 3s/position tactical + speed benchmark
```

What you should see:

* `ALL PERFT TESTS PASSED — 16,564,718 nodes` (move generator is provably
  correct: startpos, Kiwipete, en-passant, promotion and castling positions all
  match the published node counts)
* `Solved 11/12` on the tactical suite and `depth 12` from the initial position
  in a 3-second search
* `50 passed, 0 failed` on the multiplayer rules

The multiplayer suite is where the online fixes are proven — it covers illegal
moves, moving out of turn, non-participants, playing for your opponent, forged
positions, flag falls, increments, underpromotion, threefold repetition, and a
full two-client game simulation.

---

## 2. Engine and bots (single browser)

```bash
npm run dev              # http://localhost:3000
```

| What to try | What should happen |
| --- | --- |
| New Game → **Pawn Cadet** (400) | Hangs pieces, plays fast, you should beat it easily |
| New Game → **Peshmerga Titan** (2650) | Thinks up to ~3 s and punishes everything |
| While the Titan is thinking, drag pieces / open menus / watch the clock | Nothing freezes — the search is in a Web Worker |
| Play the *same* bot twice from the start | Different openings (each bot varies its first moves) |
| Hint button | "Engine (depth N): play Nf3 — evaluation +0.32" |
| Analysis mode | Evaluation, depth and top move update per position; mates show as `#3` |
| Promote a pawn, then check the captured-piece tray | Material is correct — promotions used to be miscounted as captures |

Sanity check that the ladder is real: put two bots against each other from the
console-free route by playing Pawn Cadet's moves yourself, or just run

```bash
npx tsx -e "import {Chess} from 'chess.js';import {handleEngineRequest} from './src/engine/handler';
const g=new Chess();for(let i=0;i<40&&!g.isGameOver();i++){const r:any=handleEngineRequest({id:i,type:'bot',fen:g.fen(),botId:i%2?'bot-titan':'bot-pawn'} as any);const u=r.result.bestMove;g.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});}
console.log(g.pgn());console.log(g.isCheckmate()?'mate':'no mate')"
```

The Titan should mate the Cadet in well under 40 plies.

---

## 3. Online multiplayer (two clients)

The important thing: **two separate browser storage contexts**. A normal window
and an incognito window works; two browser profiles works; two devices works.
Two tabs in the same window share the same account and will not pair.

### A. Human vs human

1. Window A: open the app → Profile → sign in with Google, or "Continue as
   guest".
2. Window B: same, with a *different* account/guest.
3. Both: **Worldwide Match** → pick the same time control → choose
   **Humans only** (so you do not get paired with an engine while testing) →
   Find live opponent.
4. They should pair within a second or two, with **each side showing the other
   player's name** — that was broken before (the waiting player saw themselves).

Then verify:

| Test | Expected |
| --- | --- |
| Try to move when it is not your turn | Board is locked; nothing is written |
| Move on your turn | Appears in the other window immediately, with sound |
| Watch both clocks | They tick for the side to move only, and agree in both windows |
| Make a move with an increment time control (3\|2) | Only the mover gets +2 s |
| Let your own clock run to 0 | Game ends as a timeout, *in both windows*, and the winner is correct |
| Reload one window mid-game | Position, clocks and history restore exactly — no desync |
| Close one window entirely | Other side shows "reconnecting" after ~25 s, and a **Claim victory** button after ~60 s |
| Offer a draw | Other side gets Accept / Decline; decline puts you back to playing |
| Resign | Confirmation first, then the result modal with the Elo change |
| Promote a pawn | You get the piece picker — knight/rook/bishop underpromotion all work |
| Click a move in the history | Board jumps to that position with a "Back to live" button |
| Copy the **Invite link** and open it in a third window | You watch the game live as a **spectator** and cannot move |
| Finish a game and hit **Rematch** | Both sides move into a new game with colours swapped |

### B. Human vs engine

Worldwide Match → **Play engine challenger** (or wait 20 s in "Humans first").
The opponent card is labelled `ENGINE`. It should reply to every move within a
second or two — the old build's bot never moved at all, because its think timer
was cancelled by each clock tick.

### C. Challenge a friend

Friends → chat → send a match challenge → accept it from the other account. The
challenge sits as `waiting` until the invited player opens it, and the clocks
only start once both players have moved.

### D. Anti-tamper (optional, the interesting one)

With a game in progress, open DevTools in one window and write a forged position
straight into Firestore:

```js
// in the console of one player's window
const { doc, updateDoc, getFirestore } = await import('firebase/firestore');
await updateDoc(doc(getFirestore(), 'online_matches', '<matchId>'), {
  fen: '8/8/8/8/8/8/8/QQQQQQKk w - - 0 1'
});
```

The *other* window replays the SAN move list, sees it does not produce that FEN,
shows a red **"Match state rejected"** banner and refuses to accept any further
moves. Previously a forged position was simply rendered and played on.

---

## 4. Security rules

`firestore.rules` in this repo is **not** applied to your Firebase project until
you deploy it:

```bash
npx firebase deploy --only firestore:rules --project gen-lang-client-0398037098
```

Test them in the Firebase console → Firestore → Rules → **Rules Playground**:

| Simulated request | Expected |
| --- | --- |
| Unauthenticated `get` on `/direct_messages/alice_bob/messages/x` | **Deny** (was allowed before) |
| Authenticated as `carol`, `update` on a match between alice and bob | **Deny** |
| Authenticated as `alice`, `update` on her own match adding one move | **Allow** |
| Same, but replacing the whole `moves` array | **Deny** (append-only) |
| Any `update` on a match whose status is `checkmate` | **Deny** unless it only touches rematch/presence fields |
| Unauthenticated `list` on `/users` | **Deny** (single `get` still allowed) |

Note the deliberate exception documented in the README: guests play
unauthenticated with `guest_…` ids, so unauthenticated writes are still allowed
for guest-owned documents under the same append-only invariants. Turning on
Firebase Anonymous Auth would let you delete that exception.
