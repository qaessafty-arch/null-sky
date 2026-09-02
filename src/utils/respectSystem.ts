import { RespectProfile, RespectLeaderboardEntry } from '../types/chess';

const RESPECT_STORAGE_KEY = 'chesskys_respect_profile_v1';

export const HONOR_RANKS = [
  { minRespect: 0, title: 'Mountain Recruit', badge: '🌾', description: 'Fresh warrior learning the terrain of the board' },
  { minRespect: 25, title: 'Desert Scout', badge: '🗡️', description: 'Agile scout maneuvering through hostile lines' },
  { minRespect: 75, title: 'Zagros Vanguard', badge: '🛡️', description: 'Stalwart defender of the mountain passes' },
  { minRespect: 150, title: 'Peshmerga Guardian', badge: '🌿', description: 'Disciplined fighter with high battlefield chivalry' },
  { minRespect: 300, title: 'Eagle of Kurdistan', badge: '🦅', description: 'Strategic visionary soaring over tactical defenses' },
  { minRespect: 500, title: 'Lion of Kurdistan', badge: '🦁', description: 'Ferocious grandmaster feared in battle, revered in honor' },
  { minRespect: 1000, title: 'Supreme Peshmerga Grandmaster', badge: '☀️', description: 'Living legend bearing the 21-ray Kurdish Sun of glory' }
];

export function getHonorRank(respectPoints: number | string): { title: string; badge: string; nextRank?: { title: string; pointsNeeded: number } } {
  if (respectPoints === '∞') {
    return {
      title: 'Supreme Immortal Grandmaster',
      badge: '☀️',
      nextRank: undefined
    };
  }

  let numPoints = 0;
  if (typeof respectPoints === 'number') {
    numPoints = isNaN(respectPoints) ? 0 : respectPoints;
  } else {
    numPoints = parseInt(String(respectPoints)) || 0;
  }
  let current = HONOR_RANKS[0];
  let nextRank: { title: string; pointsNeeded: number } | undefined = undefined;

  for (let i = 0; i < HONOR_RANKS.length; i++) {
    if (numPoints >= HONOR_RANKS[i].minRespect) {
      current = HONOR_RANKS[i];
      if (i + 1 < HONOR_RANKS.length) {
        nextRank = {
          title: HONOR_RANKS[i + 1].title,
          pointsNeeded: HONOR_RANKS[i + 1].minRespect - numPoints
        };
      } else {
        nextRank = undefined;
      }
    }
  }

  return {
    title: current.title,
    badge: current.badge,
    nextRank
  };
}

export function getRespectProfile(): RespectProfile {
  if (typeof window === 'undefined') {
    return {
      elo: 1200,
      respectPoints: 100,
      executions: 8,
      merciesGranted: 4,
      gamesPlayed: 14,
      wins: 10,
      honorRank: 'Peshmerga Guardian',
      rankBadge: '🌿'
    };
  }

  try {
    const saved = localStorage.getItem(RESPECT_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const rank = getHonorRank(parsed.respectPoints || 0);
      return {
        ...parsed,
        honorRank: rank.title,
        rankBadge: rank.badge
      };
    }
  } catch (e) {
    console.error('Failed to load respect profile', e);
  }

  const initial: RespectProfile = {
    elo: 1200,
    respectPoints: 85,
    executions: 7,
    merciesGranted: 5,
    gamesPlayed: 12,
    wins: 9,
    honorRank: 'Zagros Vanguard',
    rankBadge: '🛡️'
  };
  saveRespectProfile(initial);
  return initial;
}

export function saveRespectProfile(profile: RespectProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RESPECT_STORAGE_KEY, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save respect profile', e);
  }
}

export function recordExecution(customProfile?: RespectProfile, eloGain = 8): RespectProfile {
  const current = customProfile || getRespectProfile();
  const isInfinite = current.isImmortal || current.respectPoints === '∞' || current.elo === '∞';

  const numRespect = typeof current.respectPoints === 'number' ? current.respectPoints : 100;
  const numElo = typeof current.elo === 'number' ? current.elo : 1200;
  const numExecutions = typeof current.executions === 'number' ? current.executions : 0;

  const updatedRespect = isInfinite ? '∞' : numRespect + 5;
  const updatedElo = isInfinite ? '∞' : numElo + eloGain;
  const rank = getHonorRank(updatedRespect);

  const updated: RespectProfile = {
    ...current,
    respectPoints: updatedRespect,
    elo: updatedElo,
    executions: isInfinite ? '∞' : numExecutions + 1,
    gamesPlayed: typeof current.gamesPlayed === 'number' ? current.gamesPlayed + 1 : 1,
    wins: typeof current.wins === 'number' ? current.wins + 1 : 1,
    honorRank: isInfinite ? 'IMMORTAL' : rank.title,
    rankBadge: isInfinite ? '☀️' : rank.badge
  };

  saveRespectProfile(updated);
  return updated;
}

export function recordMercy(customProfile?: RespectProfile): RespectProfile {
  const current = customProfile || getRespectProfile();
  const isInfinite = current.isImmortal || current.respectPoints === '∞' || current.elo === '∞';

  const numRespect = typeof current.respectPoints === 'number' ? current.respectPoints : 100;
  const numElo = typeof current.elo === 'number' ? current.elo : 1200;
  const numMercies = typeof current.merciesGranted === 'number' ? current.merciesGranted : 0;

  // Spare Mercy awards DOUBLE respect (+10) and +12 chivalric ELO
  const updatedRespect = isInfinite ? '∞' : numRespect + 10;
  const updatedElo = isInfinite ? '∞' : numElo + 12;
  const rank = getHonorRank(updatedRespect);

  const updated: RespectProfile = {
    ...current,
    respectPoints: updatedRespect,
    elo: updatedElo,
    merciesGranted: isInfinite ? '∞' : numMercies + 1,
    honorRank: isInfinite ? 'IMMORTAL' : rank.title,
    rankBadge: isInfinite ? '☀️' : rank.badge
  };

  saveRespectProfile(updated);
  return updated;
}

export function recordVictory(customProfile?: RespectProfile): RespectProfile {
  return recordExecution(customProfile, 8);
}

// Global & Kurdish Honor & ELO Leaderboard Data
export function getLeaderboardEntries(
  currentUserProfile: RespectProfile,
  sortBy: 'respect' | 'elo' = 'respect'
): RespectLeaderboardEntry[] {
  // Immortal / Celestial Tier Legends (Both infinite Elo & Respect)
  const immortalPeshmerga: RespectLeaderboardEntry = {
    id: 'immortal-legend-1',
    rank: 1,
    username: 'The Immortal Peshmerga (Kurdish Legend)',
    title: 'SUPREME ETERNAL ☀️',
    country: 'Kurdistan (Eternal)',
    flag: '☀️',
    respectPoints: '∞',
    elo: '∞ (Immortal)',
    executions: '∞',
    mercies: '∞',
    avatar: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=100&auto=format&fit=crop&q=80',
    isImmortal: true,
    role: 'owner',
    badgeTag: '⚡ SUPREME'
  };

  const skyCelestialEntry: RespectLeaderboardEntry = {
    id: 'sky-celestial-profile',
    rank: 2,
    username: 'sky',
    title: 'CELESTIAL IMMORTAL 🦋',
    country: 'Kurdistan / Sky Realm',
    flag: '🦋',
    respectPoints: '∞',
    elo: '∞ (Celestial)',
    executions: '∞',
    mercies: '∞',
    avatar: 'https://images.unsplash.com/photo-1557925923-cd4648e211a0?w=150&auto=format&fit=crop&q=80',
    isImmortal: true,
    role: 'grandmaster',
    badgeTag: '🦋 CELESTIAL'
  };

  // World-Famous Chess Champions & Kurdish Grandmasters
  const famousAndKurdishMasters: Omit<RespectLeaderboardEntry, 'rank'>[] = [
    {
      id: 'gm-kasparov',
      username: 'Garry Kasparov',
      title: 'GM 🐐 (13th World Champion)',
      country: 'Croatia / Global',
      flag: '🐐',
      respectPoints: 3100,
      elo: 2851,
      executions: 210,
      mercies: 85,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
      badgeTag: '🐐 13th Champ',
      badgeNumber: 1
    },
    {
      id: 'gm-tal',
      username: 'Mikhail Tal',
      title: 'GM 🪄 (Magician from Riga)',
      country: 'Latvia',
      flag: '🪄',
      respectPoints: 3050,
      elo: 2790,
      executions: 195,
      mercies: 110,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80',
      badgeTag: '🪄 Magician',
      badgeNumber: 2
    },
    {
      id: 'gm-carlsen',
      username: 'Magnus Carlsen',
      title: 'GM 👑 (16th World Champion)',
      country: 'Norway',
      flag: '🇳🇴',
      respectPoints: 2950,
      elo: 2882,
      executions: 180,
      mercies: 75,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
      badgeTag: '👑 Peak 2882',
      badgeNumber: 3
    },
    {
      id: 'gm-anand',
      username: 'Viswanathan Anand',
      title: 'GM 🐅 (Tiger of Madras)',
      country: 'India',
      flag: '🇮🇳',
      respectPoints: 2800,
      elo: 2817,
      executions: 140,
      mercies: 90,
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=120&auto=format&fit=crop&q=80',
      badgeTag: '🐅 5x World Champ',
      badgeNumber: 4
    },
    {
      id: 'gm-fischer',
      username: 'Bobby Fischer',
      title: 'GM 🦅 (11th World Champion)',
      country: 'United States',
      flag: '🇺🇸',
      respectPoints: 2750,
      elo: 2785,
      executions: 165,
      mercies: 40,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
      badgeTag: '🦅 11th Champ',
      badgeNumber: 5
    },
    {
      id: 'gm-nakamura',
      username: 'Hikaru Nakamura',
      title: 'GM ⚡ (Speed Demon)',
      country: 'United States',
      flag: '🇺🇸',
      respectPoints: 2600,
      elo: 2875,
      executions: 155,
      mercies: 65,
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=120&auto=format&fit=crop&q=80',
      badgeTag: '⚡ Blitz King',
      badgeNumber: 6
    },
    {
      id: 'gm-gukesh',
      username: 'Gukesh D',
      title: 'GM ⭐ (Youngest Challenger)',
      country: 'India',
      flag: '🇮🇳',
      respectPoints: 2500,
      elo: 2794,
      executions: 125,
      mercies: 55,
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=120&auto=format&fit=crop&q=80',
      badgeTag: '⭐ Prodigy',
      badgeNumber: 7
    },
    {
      id: 'gm-yifan',
      username: 'Hou Yifan',
      title: 'GM 👑 (4x Women World Champ)',
      country: 'China',
      flag: '🇨🇳',
      respectPoints: 2400,
      elo: 2658,
      executions: 115,
      mercies: 70,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
      badgeTag: '👑 4x World Champ',
      badgeNumber: 8
    },
    {
      id: 'p-1',
      username: 'Soran Lion_GM',
      title: 'GM 🦁 (Kurdistan Champion)',
      country: 'Kurdistan',
      flag: '☀️',
      respectPoints: 1240,
      elo: 2480,
      executions: 94,
      mercies: 62,
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&auto=format&fit=crop&q=80',
      badgeTag: '🦁 Kurdish GM',
      badgeNumber: 9
    },
    {
      id: 'p-2',
      username: 'Zagros_Tactician',
      title: 'IM 🛡️',
      country: 'Kurdistan',
      flag: '☀️',
      respectPoints: 980,
      elo: 2350,
      executions: 78,
      mercies: 45,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60',
      badgeNumber: 10
    },
    {
      id: 'p-3',
      username: 'Avesta_Knight',
      title: 'FM ⚔️',
      country: 'Kurdistan',
      flag: '☀️',
      respectPoints: 850,
      elo: 2280,
      executions: 62,
      mercies: 38,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60',
      badgeNumber: 11
    },
    {
      id: 'p-4',
      username: 'Botan_Eagle',
      title: 'CM 🦅',
      country: 'Kurdistan',
      flag: '☀️',
      respectPoints: 720,
      elo: 2190,
      executions: 51,
      mercies: 30,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=60',
      badgeNumber: 12
    },
    {
      id: 'p-5',
      username: 'Duhok_Master',
      title: 'FM',
      country: 'Kurdistan',
      flag: '☀️',
      respectPoints: 610,
      elo: 2140,
      executions: 44,
      mercies: 28,
      avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=60',
      badgeNumber: 13
    },
    {
      id: 'p-6',
      username: 'Hewler_Strategist',
      country: 'Kurdistan',
      flag: '☀️',
      respectPoints: 490,
      elo: 1980,
      executions: 32,
      mercies: 22,
      avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=60',
      badgeNumber: 14
    },
    {
      id: 'p-7',
      username: 'Sulaymaniyah_Rook',
      country: 'Kurdistan',
      flag: '☀️',
      respectPoints: 340,
      elo: 1820,
      executions: 24,
      mercies: 16,
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&auto=format&fit=crop&q=60',
      badgeNumber: 15
    }
  ];

  const userEntry: Omit<RespectLeaderboardEntry, 'rank'> = {
    id: 'user-current',
    username: currentUserProfile.isOwner ? 'q.brz (Owner & Dev)' : 'You (Peshmerga)',
    country: 'Kurdistan',
    flag: currentUserProfile.isOwner ? '👑' : '☀️',
    respectPoints: currentUserProfile.respectPoints,
    elo: currentUserProfile.elo,
    executions: currentUserProfile.executions,
    mercies: currentUserProfile.merciesGranted,
    avatar: currentUserProfile.isOwner 
      ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
      : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60',
    isCurrentUser: true,
    role: currentUserProfile.role || (currentUserProfile.isOwner ? 'owner' : 'member'),
    badgeNumber: currentUserProfile.badgeNumber ?? (currentUserProfile.isOwner ? 0 : 16),
    badgeTag: currentUserProfile.isOwner ? '👑 FOUNDER #0' : undefined
  };

  const combined = [...famousAndKurdishMasters, userEntry];
  combined.sort((a, b) => {
    if (sortBy === 'elo') {
      const aElo = typeof a.elo === 'number' ? a.elo : parseInt(String(a.elo)) || 0;
      const bElo = typeof b.elo === 'number' ? b.elo : parseInt(String(b.elo)) || 0;
      return bElo - aElo;
    }
    const aPoints = typeof a.respectPoints === 'number' ? a.respectPoints : parseInt(String(a.respectPoints)) || 0;
    const bPoints = typeof b.respectPoints === 'number' ? b.respectPoints : parseInt(String(b.respectPoints)) || 0;
    return bPoints - aPoints;
  });

  const rankedMortals: RespectLeaderboardEntry[] = combined.map((entry, index) => ({
    ...entry,
    rank: index + 3 // Ranks 1 and 2 reserved for Immortal Peshmerga & Sky
  }));

  return [immortalPeshmerga, skyCelestialEntry, ...rankedMortals];
}
