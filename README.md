# Production Multiplayer Chess Platform

A production-grade, highly scalable multiplayer chess platform engineered with Node.js, Express, Socket.IO, Redis, PostgreSQL, chess.js, React, TypeScript, and Tailwind CSS.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Browser)                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│  │   React UI  │  │  WebSocket  │  │  Chessboard │  │   Sound &   │       │
│  │  Components │  │   Client    │  │  Rendering  │  │  Animation  │       │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│         │               │               │               │                  │
└─────────┼───────────────┼───────────────┼───────────────┼──────────────────┘
          │               │               │               │
          ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LOAD BALANCER (Nginx)                                │
│                  Routes: /api → Backend, /ws → WebSocket                    │
└─────────────────────────────────────────────────────────────────────────────┘
          │                               │
          ▼                               ▼
┌─────────────────────┐     ┌──────────────────────────────────┐
│    BACKEND API      │     │      WEBSOCKET SERVER            │
│   (Express/Node)    │     │     (Socket.IO/Node)             │
│                     │     │                                  │
│  • Authentication   │     │  • Real-time game state          │
│  • User profiles    │     │  • Move validation               │
│  • Game persistence │     │  • Timer management              │
│  • Tournament API   │     │  • Event broadcasting            │
│  • ELO calculation  │     │  • Room management               │
│  • Analytics        │     │  • Anti-cheat detection          │
└─────────────────────┘     └──────────────────────────────────┘
          │                               │
          ▼                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         GAME ENGINE (Shared)                                │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  ChessGameEngine Class                                               │    │
│  │  • chess.js wrapper                                                 │    │
│  │  • Move execution & validation                                      │    │
│  │  • Position history (for 3-fold repetition)                         │    │
│  │  • Timer management                                                 │    │
│  │  • PGN generation                                                   │    │
│  │  • Game state serialization                                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  AntiCheatSystem Class                                              │    │
│  │  • Move time analysis                                              │    │
│  │  • Accuracy calculation                                            │    │
│  │  • Stockfish integration                                           │    │
│  │  • Flag generation                                                 │    │
│  │  • Auto-ban logic                                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
          │                               │
          ▼                               ▼
┌─────────────────────┐     ┌──────────────────────────────────┐
│    PostgreSQL       │     │           Redis                   │
│   (Persistence)     │     │      (Caching & State)            │
│                     │     │                                   │
│  • Users            │     │  • Active games (TTL: 5min)       │
│  • Games (archived) │     │  • Session store                  │
│  • Moves            │     │  • Rate limiting                  │
│  • Tournaments      │     │  • Anti-cheat flags               │
│  • Chat messages    │     │  • Matchmaking queue              │
│  • Analysis         │     │  • Pub/Sub for scaling            │
└─────────────────────┘     └──────────────────────────────────┘
```

- **Backend**: Node.js + Express + Socket.IO + chess.js engine + Joi validation + Winston logger.
- **Cache & Active Games**: Redis 7 for high-speed active game state, time synchronization, and anti-cheat tracking with automatic fallback.
- **Relational Storage**: PostgreSQL 15 for users, completed games, move-by-move telemetry, tournament brackets, and audit logs.
- **Frontend**: React 19 + TypeScript + Tailwind CSS + Lucide Icons + Canvas Confetti.
- **Shared Game Engine**: `ChessGameEngine` and `AntiCheatSystem` providing identical validation, timing, repetition detection, and flag generation on client and server.
- **Orchestration**: Docker Compose with Nginx reverse proxy routing `/api` to Express and `/ws` & `/socket.io` to WebSocket server.

---

## Quick Start (Docker Compose)

1. Clone the repository and navigate to the project root:
   ```bash
   cp .env.example .env
   ```

2. Start the complete containerized stack:
   ```bash
   docker-compose up -d --build
   ```

3. Access the platform:
   - Web Application: `http://localhost:3000`
   - REST API: `http://localhost:3000/api`
   - Prometheus Metrics: `http://localhost:3000/metrics`

---

## Database Migrations (`schema.sql`)

When launching with Docker Compose, `schema.sql` is automatically mounted into PostgreSQL's `/docker-entrypoint-initdb.d/` directory.

To apply manually:
```bash
psql -U chess_user -d chess_db -f schema.sql
```

### Tables Included
- `users`: ELO ratings, statistics, ban flags, and profile information.
- `games`: PGN, FEN history, time controls, players, and match outcomes.
- `moves`: SAN notation, FEN before/after, elapsed time, and move accuracy.
- `tournaments`: Swiss, round-robin, and elimination tournament management.
- `tournament_participants`: Scores and Sonneborn-Berger tiebreaks.
- `chat_messages`: In-game chat persistence.
- `game_analysis`: Blunders, mistakes, inaccuracies, and engine evaluations.
- `anti_cheat_flags`: Audit log for timing variance and superhuman play detection.

---

## Socket.IO Events

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `createGame` | `{ timeControl, rated, variant, colorPreference }` | Create a new match room |
| `joinGame` | `{ gameCode }` | Join using 6-character room code |
| `quickMatch` | `{ timeControl }` | Automated queue matchmaking |
| `makeMove` | `{ gameId, from, to, promotion }` | Submit a chess move |
| `resign` | `{ gameId }` | Forfeit the match |
| `offerDraw` | `{ gameId }` | Offer a draw to opponent |
| `acceptDraw` | `{ gameId }` | Accept incoming draw offer |
| `requestTakeback` | `{ gameId, moveIndex }` | Request to undo previous move |
| `pauseGame` | `{ gameId }` | Pause the match and clocks |
| `sendMessage` | `{ gameId, message }` | In-game chat message |
| `spectateGame` | `{ gameId }` | Join game room as spectator |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `gameStarted` | `{ gameId, white, black, timeControl, initialFen }` | Match commencement |
| `moveMade` | `{ move, san, fen, turn, lastMove, timeWhite, timeBlack, ... }` | Broadcasted move state |
| `timerUpdate` | `{ white, black, active }` | Synchronized 1-second clock ticks |
| `gameOver` | `{ result, reason, winner, pgn, ratingChanges }` | Match outcome & ELO adjustments |
| `drawOffered` | `{ offeredBy, playerId }` | Notify opponent of draw offer |
| `newMessage` | `{ username, userId, message, timestamp }` | Live chat message broadcast |

---

## Anti-Cheat System
The anti-cheat subsystem performs real-time telemetry analysis:
1. **Move Timing Variance**: Evaluates move duration variance. Players maintaining `< 50ms` variance with sub-`300ms` average times across 10+ moves trigger superhuman flags.
2. **Flag Escalation**: Flags are cached in Redis with a 24-hour expiry and logged to PostgreSQL.
3. **Automated Suspension**: Reaching 5 flags triggers an automated 7-day account suspension and alert broadcast to moderators.

---

## REST API Reference

- `POST /api/auth/register` — Register user account
- `POST /api/auth/login` — Authenticate and receive JWT access token
- `GET /api/users/me` — Retrieve current authenticated profile
- `GET /api/games/available` — List open public game rooms
- `GET /api/games/:id/pgn` — Download portable game notation (PGN)
- `GET /api/tournaments` — List active tournaments
- `GET /api/leaderboard` — Top 100 players by ELO rating
