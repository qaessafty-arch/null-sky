const fs = require('fs');
let serverCode = fs.readFileSync('server.ts', 'utf8');

const importGemini = `import { GoogleGenAI } from '@google/genai';\n`;
if (!serverCode.includes('@google/genai')) {
  serverCode = importGemini + serverCode;
}

const geminiRecapEndpoint = `
app.post('/api/gemini/recap', async (req, res) => {
  try {
    const { pgn } = req.body;
    if (!pgn) {
      return res.status(400).json({ error: 'PGN required' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [{ text: \`You are an enthusiastic manga/anime narrator. The following is a chess game PGN. Describe the dramatic flow of the game in 3-4 paragraphs, like a high-stakes manga battle. Highlight sacrifices, blunders, and the final checkmate (or draw).\n\nPGN: \${pgn}\` }]
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

if (!serverCode.includes('/api/gemini/recap')) {
  const insertIndex = serverCode.indexOf("if (process.env.NODE_ENV !== 'production') {");
  if (insertIndex !== -1) {
    serverCode = serverCode.slice(0, insertIndex) + geminiRecapEndpoint + '\n' + serverCode.slice(insertIndex);
    fs.writeFileSync('server.ts', serverCode);
    console.log('Successfully updated server.ts with Gemini recap endpoint');
  }
}
