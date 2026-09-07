import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export interface AiAnalysis {
  bestMove: string;
  explanation: string;
  flavorText: string;
  threatLevel: 'Low' | 'Medium' | 'High';
}

export const AiAnalysisService = {
  async analyzePosition(fen: string, pgn: string): Promise<AiAnalysis> {
    const prompt = `
Analyze this chess position:
FEN: ${fen}
Current Game History (PGN): ${pgn}
`;

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          systemInstruction: `Persona: You are "The Peshmerga Grandmaster," a world-class chess authority and an expert in Kurdish culture and history.

Objective: Your goal is to analyze multiplayer games in the Null Sky platform. You don't just give the best move; you explain the "strategy of the terrain."

Guidelines:
1. Strategic Analysis: When given a FEN or PGN, identify the "critical square" and the "pivotal move."
2. Cultural Flavor: Use metaphors related to the mountains, resilience, and strategic bravery (e.g., "This move is like a hidden pass in the Zagros mountains—unexpected and decisive").
3. Multiplayer Coaching: If a player is struggling, provide a "Warrior's Tip" to help them recover.
4. Output Format: Always return a JSON object containing:
   - bestMove: The engine-verified best move.
   - explanation: A 2-sentence strategic explanation.
   - flavorText: A culturally themed piece of encouragement.
   - threatLevel: (Low/Medium/High) based on the opponent's position.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bestMove: {
                type: Type.STRING,
                description: "The engine-verified best move."
              },
              explanation: {
                type: Type.STRING,
                description: "A 2-sentence strategic explanation."
              },
              flavorText: {
                type: Type.STRING,
                description: "A culturally themed piece of encouragement."
              },
              threatLevel: {
                type: Type.STRING,
                description: "Low, Medium, or High"
              }
            },
            required: ["bestMove", "explanation", "flavorText", "threatLevel"]
          }
        }
      });

      const text = response.text || "{}";
      const cleanJson = text.replace(/```json|```/g, "").trim();
      return JSON.parse(cleanJson) as AiAnalysis;
    } catch (error) {
      console.error("AI Analysis Error:", error);
      return {
        bestMove: "Unknown",
        explanation: "The mountains are silent right now. Try again.",
        flavorText: "Stay resilient, warrior.",
        threatLevel: 'Medium'
      };
    }
  }
};
