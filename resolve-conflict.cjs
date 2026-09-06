const fs = require('fs');

const filePath = 'c:/Users/surface pro/OneDrive/Documents/GitHub/null-sky/server.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Remove merge conflict markers and combine both versions
// Find the conflict section
const startMarker = '<<<<<<< HEAD';
const midMarker = '=======';
const endMarker = '>>>>>>>';

const startIdx = content.indexOf(startMarker);
const midIdx = content.indexOf(midMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && midIdx !== -1 && endIdx !== -1) {
  // Extract the parts we want to keep
  // Before the conflict
  const before = content.slice(0, startIdx);
  
  // The resolved content - combine both versions
  // Keep the local changes (matchmaking.start(), closing brace) 
  // AND the remote game endpoints
  const resolvedPart = `  // Start the matchmaking engine
  matchmaking.start();
}

// 7. REST API ENDPOINTS FOR CHESS GAMES
// ==========================================

// POST /api/games → Create game with unique 6-character code
app.post('/api/games', (req, res) => {
  try {
    const { timeControl, side, playerInfo, customCode } = req.body || {};
    const game = matchmaking.createCustomRoom({
      hostUid: playerInfo?.uid || 'host_' + Date.now(),
      hostName: playerInfo?.displayName || playerInfo?.name || 'Player 1',
      hostRating: playerInfo?.elo || playerInfo?.rating || 1200,
      timeControl,
      side,
      customCode
    });
    res.status(201).json({
      gameId: game.gameId,
      gameCode: game.gameCode,
      status: 'waiting',
      timeControl: game.session.timeControl,
      fen: game.session.chess.fen(),
      pgn: game.session.chess.pgn()
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to create game' });
  }
});

// POST /api/games/:id/cancel → Cancel waiting game
app.post('/api/games/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    const match = matchmaking.getMatch(id);
    if (!match) return res.status(404).json({ error: 'Game not found' });
    if (match.status !== 'waiting') {
      return res.status(400).json({ error: 'Only waiting games can be cancelled' });
    }
    match.status = 'cancelled';
    if (match.waitingTimer) clearTimeout(match.waitingTimer);
    io.to(match.matchId).emit('gameCancelled', {
      gameId: match.matchId,
      gameCode: match.gameCode,
      reason: 'Host cancelled the game.'
    });
    res.json({ success: true, message: 'Game cancelled successfully' });
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'Failed to cancel game' });
  }
});

// POST /api/games/:id/join → Join game with 6-character code or ID
app.post('/api/games/:id/join', (req, res) => {
  try {
    const { id } = req.params;
    const { playerInfo } = req.body || {};
    const result = matchmaking.joinCustomRoom(id, {
      uid: playerInfo?.uid || 'guest_' + Date.now(),
      name: playerInfo?.displayName || playerInfo?.name || 'Player 2',
      rating: playerInfo?.elo || playerInfo?.rating || 1200
    });
    res.json({
      success: true,
      playerColor: result.playerColor,
      gameId: result.match.matchId,
      gameCode: result.match.gameCode,
      game: matchmaking.getGameState(result.match.matchId)
    });
  } catch (e: any) {
    res.status(400).json({ error: e.message || 'Failed to join game' });
  }
});

// GET /api/games/:id/state → Full game state
app.get('/api/games/:id/state', (req, res) => {
  const state = matchmaking.getGameState(req.params.id);
  if (!state) return res.status(404).json({ error: 'Game not found' });
  res.json(state);
});

// 7. AI RECAP ENDPOINT
// ----------------------------------------------------
app.post('/api/gemini/recap', async (req, res) => {
  try {
    const { pgn } = req.body;
    if (!pgn) {
      return res.status(400).json({ error: 'PGN required' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: `You are an enthusiastic manga/anime narrator. The following is a chess game PGN. Describe the dramatic flow of the game in 3-4 paragraphs, like a high-stakes manga battle. Highlight sacrifices, blunders, and the final checkmate (or draw).

PGN: ${pgn}` }]
        }
      ]
    });

    res.json({ recap: response.text });
  } catch (error) {
    console.error('Gemini recap error:', error);
    res.status(500).json({ error: 'Failed to generate recap' });
  }
});
`;

  // After the conflict
  const after = content.slice(endIdx + '>>>>>>>'.length);

  // Combine and write
  const newContent = before + resolvedPart + after;
  fs.writeFileSync(filePath, newContent);
  console.log('SUCCESS: Merge conflict resolved');
} else {
  console.log('Could not find conflict markers');
}