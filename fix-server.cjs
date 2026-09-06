const fs = require('fs');
const filePath = 'c:/Users/surface pro/OneDrive/Documents/GitHub/null-sky/server.ts';
let content = fs.readFileSync(filePath, 'utf8');

const oldApi = `app.get('/api/leaderboard', async (req, res) => {
  try {
    const mode = (req.query.mode as string) || 'blitz';
    const scope = (req.query.scope as string) || 'global';
    const period = (req.query.period as string) || 'all';
    const page = parseInt((req.query.page as string) || '1', 10);
    const limit = parseInt((req.query.limit as string) || '50', 10);
    const search = ((req.query.search as string) || '').toLowerCase().replace('@', '');
    const country = req.query.country;
    
    let leaderboard = await getCachedLeaderboard(mode);
    
    if (search) {
      leaderboard = leaderboard.filter(u => 
        (u.username && u.username.toLowerCase().includes(search)) || 
        (u.displayName && u.displayName.toLowerCase().includes(search))
      );
    }
    
    if (scope === 'country' && country) {
      leaderboard = leaderboard.filter(u => u.country === country);
    }
    
    const startIndex = (page - 1) * limit;
    const paginated = leaderboard.slice(startIndex, startIndex + limit);
    
    res.json({
      data: paginated,
      total: leaderboard.length,
      page,
      totalPages: Math.ceil(leaderboard.length / limit)
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});`;

const newApi = `app.get('/api/leaderboard', async (req, res) => {
  try {
    const mode = (req.query.mode as string) || 'blitz';
    const period = (req.query.period as string) || 'all';
    const scope = (req.query.scope as string) || 'global';
    const userId = (req.query.uid as string) || '';
    const validModes = ['blitz', 'bullet', 'rapid', 'puzzle', 'daily'];
    if (!validModes.includes(mode)) {
      return res.status(400).json({ error: 'Invalid mode' });
    }
    const validPeriods = ['all', 'week', 'month'];
    if (!validPeriods.includes(period)) {
      return res.status(400).json({ error: 'Invalid period' });
    }
    const validScopes = ['global', 'country', 'friends'];
    if (!validScopes.includes(scope)) {
      return res.status(400).json({ error: 'Invalid scope' });
    }
    if (scope === 'friends' && !userId) {
      return res.status(400).json({ error: 'User ID required for friends scope' });
    }
    const country = (req.query.country as string) || undefined;
    let leaderboard = await getCachedLeaderboard(mode, period, scope === 'friends' ? userId : undefined);
    
    if (scope === 'country' && country) {
      leaderboard = leaderboard.filter(u => u.country.toLowerCase() === country.toLowerCase());
    }
    
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = 50;
    const start = (page - 1) * limit;
    const paginated = leaderboard.slice(start, start + limit);
    
    if (userId) {
      paginated.forEach(u => {
        u.isCurrentUser = u.uid === userId;
      });
    }
    
    let medianElo = 1200;
    if (leaderboard.length > 0) {
      const sorted = [...leaderboard].sort((a, b) => a.elo - b.elo);
      const middle = Math.floor(sorted.length / 2);
      medianElo = sorted.length % 2 === 0 ? (sorted[middle - 1].elo + sorted[middle].elo) / 2 : sorted[middle].elo;
    }
    
    res.json({
      leaderboard: paginated,
      pagination: {
        page,
        limit,
        total: leaderboard.length,
        totalPages: Math.ceil(leaderboard.length / limit)
      },
      metadata: {
        mode,
        period,
        scope,
        medianElo: Math.round(medianElo),
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (e) {
    console.error('Leaderboard error:', e);
    res.status(500).json({ error: e.message });
  }
});`;

if (oldApi in content) {
  content = content.replace(oldApi, newApi);
  fs.writeFileSync(filePath, content);
  console.log('SUCCESS: server.ts updated');
} else {
  console.log('ERROR: Old API text not found in file');
}