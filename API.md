# FILE: API.md
# Multiplayer Chess Platform - Complete REST & WebSocket API Reference

## Table of Contents
1. [Authentication Endpoints](#authentication-endpoints)
2. [User & Profile Endpoints](#user--profile-endpoints)
3. [Game Endpoints & Code-Based Joining](#game-endpoints--code-based-joining)
4. [Tournaments Endpoints](#tournaments-endpoints)
5. [Social & Friends Endpoints](#social--friends-endpoints)
6. [WebSocket Events Specification](#websocket-events-specification)

---

## Authentication Endpoints

### POST `/api/auth/register`
Creates a new player account with initial 1200 ELO.
- **Request Body**:
  ```json
  {
    "username": "MagnusPlayer",
    "email": "player@chess.org",
    "password": "SecurePassword123!"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "userId": "uuid-v4",
    "username": "MagnusPlayer",
    "accessToken": "jwt.access.token",
    "refreshToken": "jwt.refresh.token"
  }
  ```

### POST `/api/auth/login`
Authenticates credentials and returns JWT tokens.
- **Request Body**:
  ```json
  {
    "email": "player@chess.org",
    "password": "SecurePassword123!"
  }
  ```
- **Response**: `200 OK`

### POST `/api/auth/refresh`
Exchanges a valid 7-day refresh token for a fresh 15-minute access token.

### POST `/api/auth/logout`
Revokes active sessions and blacklists tokens in Redis.

---

## Game Endpoints & Code-Based Joining

### POST `/api/games`
Creates a new game waiting room and returns a unique 6-character code.
- **Request Body**:
  ```json
  {
    "timeControl": "10+0",
    "rated": true,
    "variant": "standard",
    "colorPreference": "white",
    "visibility": "public"
  }
  ```
- **Response**: `201 Created`
  ```json
  {
    "gameId": "d3b07384-d113-4608-8e68-e6ef6d123456",
    "gameCode": "ABC123",
    "expiresAt": "2026-09-03T15:00:00.000Z",
    "visibility": "public"
  }
  ```

### POST `/api/games/join`
Joins a waiting game via 6-character code.
- **Request Body**:
  ```json
  {
    "gameCode": "ABC123"
  }
  ```
- **Response**: `200 OK`

### GET `/api/games/available`
Lists all public active waiting games.

### GET `/api/games/:id`
Retrieves full game metadata, FEN, moves, and player statistics.

### GET `/api/games/:id/pgn`
Downloads the official PGN notation file.

### GET `/api/games/:id/analysis`
Fetches Stockfish depth-18 evaluations, accuracy scores, and blunders.

---

## WebSocket Events Specification

### Client → Server
| Event | Payload | Description |
|---|---|---|
| `authenticate` | `{ token }` | Authenticates socket connection with JWT |
| `createGame` | `{ timeControl, rated, variant, colorPreference, visibility }` | Generates 6-char code and opens 5-minute waiting room |
| `joinGame` | `{ gameCode }` | Joins waiting room by code |
| `cancelGameCreation` | `{ gameId }` | Cancels waiting room and cleans up code |
| `quickMatch` | `{ timeControl, variant }` | Enters matchmaking pool |
| `makeMove` | `{ gameId, from, to, promotion }` | Submits candidate chess move |
| `resign` | `{ gameId }` | Forfeits match |
| `offerDraw` | `{ gameId }` | Proposes draw |
| `acceptDraw` | `{ gameId }` | Accepts draw |
| `requestTakeback` | `{ gameId }` | Requests takeback |
| `sendMessage` | `{ gameId, message }` | In-game chat message |
| `sendTyping` | `{ gameId, isTyping }` | Chat typing indicator |

### Server → Client
| Event | Payload | Description |
|---|---|---|
| `gameCreated` | `{ gameId, gameCode, visibility, expiresAt }` | Sent to Creator with code |
| `waitingForOpponent` | `{ gameCode, expiresAt }` | Triggers 5-minute countdown UI |
| `opponentJoined` | `{ opponent }` | Notifies Player 1 that opponent entered |
| `gameJoined` | `{ gameId, color, opponent, timeControl }` | Notifies Player 2 |
| `gameReady` | `{ gameId }` | Signals both players game is starting |
| `gameStarted` | `{ gameId, white, black, timeControl, initialFen }` | Starts clock & board |
| `moveMade` | `{ move, san, fen, turn, timeWhite, timeBlack }` | Broadcasts validated move |
| `timerUpdate` | `{ white, black, active }` | 1-second clock tick |
| `gameOver` | `{ winner, reason, pgn, ratingChanges }` | Concludes match |
| `gameExpired` | `{ gameId, reason }` | Emitted when 5-min waiting expires |
| `gameCancelled` | `{ gameId, reason }` | Emitted when creator cancels |
