const fs = require('fs');
let code = fs.readFileSync('src/engine/bots.ts', 'utf8');

const newBots = `
  {
    id: 'bot-luffy',
    name: 'Luffy',
    title: 'Pirate King',
    elo: 2000,
    avatar: '🍖',
    description: 'Ultra-aggressive sacrificial style. Loves complex positions and wild attacks.',
    style: 'Berserker',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    depth: 6,
    randomness: 0.1,
    searchDepth: 6,
    moveTimeMs: 800,
    nodeLimit: 500_000,
    noiseCp: 50,
    blunderChance: 0.1,
    blunderMaxLossCp: 400,
    bookVarietyPlies: 6,
    contempt: -50
  },
  {
    id: 'bot-levi',
    name: 'Levi',
    title: 'Assassin',
    elo: 2200,
    avatar: '⚔️',
    description: 'Quiet positional assassin. Clinical and precise. Punishes every mistake ruthlessly.',
    style: 'Surgical Precision',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    depth: 8,
    randomness: 0.01,
    searchDepth: 8,
    moveTimeMs: 1200,
    nodeLimit: 1_200_000,
    noiseCp: 10,
    blunderChance: 0.01,
    blunderMaxLossCp: 100,
    bookVarietyPlies: 4,
    contempt: 10
  },
  {
    id: 'bot-batman',
    name: 'Batman',
    title: 'Dark Knight',
    elo: 1800,
    avatar: '🦇',
    description: 'Defensive fortress. Focuses on solid setups and unbreakable defense. Counter-attacks only when safe.',
    style: 'Fortress',
    badgeColor: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    depth: 5,
    randomness: 0.05,
    searchDepth: 5,
    moveTimeMs: 600,
    nodeLimit: 400_000,
    noiseCp: 30,
    blunderChance: 0.05,
    blunderMaxLossCp: 200,
    bookVarietyPlies: 8,
    contempt: 20
  },
  {
    id: 'bot-joker',
    name: 'Joker',
    title: 'Agent of Chaos',
    elo: 1500,
    avatar: '🤡',
    description: 'Chaotic unpredictable. Makes random sacrifices and bizarre moves just to confuse you.',
    style: 'Chaotic',
    badgeColor: 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30',
    depth: 3,
    randomness: 0.5,
    searchDepth: 3,
    moveTimeMs: 300,
    nodeLimit: 100_000,
    noiseCp: 300,
    blunderChance: 0.4,
    blunderMaxLossCp: 800,
    bookVarietyPlies: 10,
    contempt: -100
  },
`;

if (!code.includes('bot-luffy')) {
  const insertIndex = code.indexOf('export const BOT_DEFINITIONS: BotDefinition[] = [') + 'export const BOT_DEFINITIONS: BotDefinition[] = ['.length;
  code = code.slice(0, insertIndex) + newBots + code.slice(insertIndex);
  fs.writeFileSync('src/engine/bots.ts', code);
  console.log('Added bots');
}
