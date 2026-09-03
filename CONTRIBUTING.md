# FILE: CONTRIBUTING.md
# Contributing to the Multiplayer Chess Platform

Thank you for contributing to the Chess Platform! Please follow these standards when submitting code.

## Development Setup

1. **Clone and install dependencies**:
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

2. **Run Dev Environment**:
   ```bash
   npm run dev
   ```

3. **Verify Code Quality**:
   ```bash
   npm run lint
   npm run test
   ```

## Architecture Principles
1. **Server-Authoritative Game State**: Never trust moves or timestamps sent from the client. All legal moves must be validated using `chess.js` inside the backend `ServerChessEngine`.
2. **Deterministic Time Controls**: Clock timers are decremented server-side at 1-second intervals and broadcast via `timerUpdate`.
3. **Anti-Cheat Pipeline**: Fast robotic moves (<200ms variance <50ms) and Stockfish engine correlations are flagged and audited.
