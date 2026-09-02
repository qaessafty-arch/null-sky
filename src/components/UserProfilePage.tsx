import React, { useState, useMemo, useEffect } from 'react';
import { PanelContainer } from './PanelContainer';
import { Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getLocalGameLogs } from '../services/loggingService';
import { 
  Trophy, 
  Swords, 
  Flame, 
  Zap, 
  Clock, 
  Sun, 
  Puzzle, 
  UserPlus, 
  Check, 
  TrendingUp, 
  Award, 
  BarChart2, 
  PieChart, 
  Layers, 
  Crown, 
  Share2, 
  CheckCircle2, 
  Target,
  Users,
  History,
  Compass,
  Search,
  ChevronRight,
  Camera,
  Activity,
  ChevronDown,
  X,
  SlidersHorizontal,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { ChessAvatarModal } from './ChessAvatarModal';
import { RespectHonorBadge } from './RespectHonorBadge';

interface UserProfilePageProps {
  onChallenge?: () => void;
  onAnalyzeGame?: (pgn?: string, fen?: string) => void;
  onEditProfileModal?: () => void;
  onNavigateHome?: () => void;
  onOpenAbout?: () => void;
}

type TabType = 'overview' | 'matches' | 'analytics' | 'social';
type TimeRangeFilter = '1W' | '1M' | '1Y' | 'ALL';
type MatchFilter = 'all' | 'win' | 'loss' | 'draw';

interface RatingCategory {
  title: string;
  time: string;
  current: number;
  peak: number;
  games: number;
  winRate: number;
  icon: React.ReactNode;
  badgeBg: string;
}

interface MatchItem {
  id: string;
  opponentName: string;
  opponentAvatar: string;
  opponentRating: number;
  result: 'win' | 'loss' | 'draw';
  ratingChange: number;
  accuracy: number;
  timeControl: string;
  playerColor: 'w' | 'b';
  date: string;
  openingName: string;
  pgn?: string;
  fen?: string;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({
  onChallenge,
  onAnalyzeGame,
  onEditProfileModal
}) => {
  const { user, profile, isSkyAccount, isOwner } = useAuth();
  const [titleBadge, setTitleBadge] = useState<string | null>(null);

  useEffect(() => {
    if (user?.uid) {
      fetch(`/api/leaderboard/rank/${user.uid}?mode=blitz`)
        .then(r => r.json())
        .then(data => {
          if (data.userData?.title && ['GM', 'IM', 'FM', 'NM'].includes(data.userData.title)) {
            setTitleBadge(data.userData.title);
          }
        })
        .catch(e => console.error(e));
    }
  }, [user?.uid]);

  const renderTitleBadge = (title: string) => {
    if (!title) return null;
    let bg = 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    if (title === 'GM') bg = 'bg-red-500/20 text-red-300 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
    else if (title === 'IM') bg = 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
    else if (title === 'FM') bg = 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.3)]';
    else if (title === 'NM') bg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
    
    return (
      <span className={`text-[10px] font-black px-2 py-0.5 rounded-sm border ${bg} mr-2`}>
        {title}
      </span>
    );
  };

  // Tab State: 'overview' | 'matches' | 'analytics' | 'social'
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Mobile Drawer State
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Profile Customization & Social States
  const [onlineStatus, setOnlineStatus] = useState<'online' | 'in_game' | 'offline'>('online');
  const [friendStatus, setFriendStatus] = useState<'add' | 'sent' | 'friends'>('add');
  const [copiedLink, setCopiedLink] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  // Analytics & History Filters
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('1M');
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('all');
  const [searchOpponent, setSearchOpponent] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState<{ index: number; x: number; y: number; data: any } | null>(null);

  // Dynamic User Information
  
  if (profile && profile.isPublic === false && !isOwner) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center px-4">
        <Lock className="w-12 h-12 text-[#DFD0B0]/40 mb-4" />
        <h2 className="text-xl font-black text-white mb-2">Private Profile</h2>
        <p className="text-sm text-[#DFD0B0]/60 max-w-sm">This profile is private and cannot be viewed.</p>
      </div>
    );
  }
const displayName = profile?.displayName || user?.displayName || 'Grandmaster Qays';
  const username = profile?.username || 'peshmerga_gm';
  const countryFlag = profile?.flag || '☀️';
  const countryName = profile?.country || 'Kurdistan';
  const avatarUrl = profile?.photoURL || (isSkyAccount 
    ? 'https://images.unsplash.com/photo-1557925923-cd4648e211a0?w=200&auto=format&fit=crop&q=80' 
    : user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80');

  const baseElo = typeof profile?.elo === 'number' ? (isNaN(profile.elo) ? 2240 : profile.elo) : 2240;

  // Time Control Rating Metrics
  const ratingsData: Record<string, RatingCategory> = useMemo(() => {
    return {
      rapid: {
        title: 'Rapid (Primary)',
        time: '10-15 min',
        current: baseElo,
        peak: Math.max(baseElo, baseElo + 55),
        games: profile?.gamesPlayed || 0,
        winRate: 72,
        icon: <Clock className="w-5 h-5 text-emerald-400" />,
        badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
      },
      blitz: {
        title: 'Blitz',
        time: '3-5 min',
        current: Math.max(1600, Math.round(baseElo * 0.96)),
        peak: Math.max(Math.max(1600, Math.round(baseElo * 0.96)), Math.max(1700, Math.round(baseElo * 1.01))),
        games: profile?.gamesPlayed ? 389 : 0,
        winRate: 68,
        icon: <Flame className="w-5 h-5 text-orange-400" />,
        badgeBg: 'bg-orange-500/10 text-orange-300 border-orange-500/20'
      },
      bullet: {
        title: 'Bullet',
        time: '1-2 min',
        current: Math.max(1400, Math.round(baseElo * 0.88)),
        peak: Math.max(Math.max(1400, Math.round(baseElo * 0.88)), Math.max(1500, Math.round(baseElo * 0.92))),
        games: profile?.gamesPlayed ? 142 : 0,
        winRate: 64,
        icon: <Zap className="w-5 h-5 text-amber-400" />,
        badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/20'
      },
      daily: {
        title: 'Daily',
        time: '1-3 days',
        current: Math.max(1800, baseElo + 70),
        peak: Math.max(Math.max(1800, baseElo + 70), baseElo + 110),
        games: profile?.gamesPlayed ? 76 : 0,
        winRate: 79,
        icon: <Sun className="w-5 h-5 text-sky-400" />,
        badgeBg: 'bg-sky-500/10 text-sky-300 border-sky-500/20'
      },
      puzzles: {
        title: 'Puzzles',
        time: 'Tactics',
        current: Math.max(2100, baseElo + 240),
        peak: Math.max(Math.max(2100, baseElo + 240), baseElo + 270),
        games: profile?.gamesPlayed ? 840 : 0,
        winRate: 88,
        icon: <Puzzle className="w-5 h-5 text-purple-400" />,
        badgeBg: 'bg-purple-500/10 text-purple-300 border-purple-500/20'
      }
    };
  }, [baseElo, profile?.gamesPlayed]);

  // Generate Interactive Rating Chart Data
  const chartData = useMemo(() => {
    if (profile?.gamesPlayed === 0) return [];
    
    const pointsCount = timeRange === '1W' ? 7 : timeRange === '1M' ? 30 : timeRange === '1Y' ? 52 : 70;
    const now = new Date();
    const data = [];
    let currentRating = baseElo - (pointsCount * 2);

    for (let i = 0; i < pointsCount; i++) {
      const d = new Date();
      if (timeRange === '1W') d.setDate(now.getDate() - (pointsCount - 1 - i));
      else if (timeRange === '1M') d.setDate(now.getDate() - (pointsCount - 1 - i));
      else if (timeRange === '1Y') d.setDate(now.getDate() - (pointsCount - 1 - i) * 7);
      else d.setDate(now.getDate() - (pointsCount - 1 - i) * 15);

      const fluctuation = Math.floor(Math.sin(i * 0.4) * 18) + (i > pointsCount - 5 ? 8 : (i % 3 === 0 ? 6 : -3));
      currentRating += fluctuation;
      if (i === pointsCount - 1) currentRating = baseElo;

      data.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
        rating: Math.max(1200, currentRating),
        change: fluctuation >= 0 ? `+${fluctuation}` : `${fluctuation}`,
        opponent: i % 2 === 0 ? 'GM SoranTactics' : 'Citadel_Master'
      });
    }
    return data;
  }, [timeRange, baseElo]);

  // Chart SVG Coordinates Math
  const minRating = chartData.length > 0 ? Math.min(...chartData.map(d => isNaN(d.rating) ? 1200 : d.rating)) - 25 : 0;
  const maxRating = chartData.length > 0 ? Math.max(...chartData.map(d => isNaN(d.rating) ? 1200 : d.rating)) + 25 : 100;
  const chartWidth = 700;
  const chartHeight = 220;
  const paddingX = 35;
  const paddingY = 25;

  const points = chartData.map((d, i) => {
    const x = paddingX + (i / (chartData.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - ((d.rating - minRating) / (maxRating - minRating)) * (chartHeight - paddingY * 2);
    return { x, y, data: d };
  });

  const pathD = points.length > 0 ? points.reduce((acc, point, i, arr) => {
    if (i === 0) return `M ${point.x} ${point.y}`;
    const prev = arr[i - 1];
    const cpX1 = prev.x + (point.x - prev.x) / 2;
    const cpY1 = prev.y;
    const cpX2 = prev.x + (point.x - prev.x) / 2;
    const cpY2 = point.y;
    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${point.x} ${point.y}`;
  }, '') : '';

  const areaD = points.length > 0 ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z` : '';

  // Recent Match History List
  const allMatches: MatchItem[] = useMemo(() => {
    const rawLogs = getLocalGameLogs();
    const formattedFromLogs: MatchItem[] = rawLogs.slice(0, 10).map((l, idx) => ({
      id: l.id || `log-${idx}`,
      opponentName: l.opponentName || 'Peshmerga Tactician',
      opponentAvatar: l.opponentAvatar || '♚',
      opponentRating: l.opponentElo || 1850,
      result: l.result === 'win' || l.result === 'executed' ? 'win' : l.result === 'draw' ? 'draw' : 'loss',
      ratingChange: l.eloChange || (l.result === 'win' ? 12 : l.result === 'draw' ? 0 : -9),
      accuracy: l.accuracy || Math.round(75 + (Math.random() * 20)),
      timeControl: l.timeControlName || 'Rapid (10m)',
      playerColor: l.playerColor || 'w',
      date: l.date ? new Date(l.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Today',
      openingName: 'Sicilian Defense: Najdorf',
      pgn: l.pgn,
      fen: l.finalFen
    }));

    const fallbackMatches: MatchItem[] = [
      {
        id: 'm-1',
        opponentName: 'GM Alan Kurdistan',
        opponentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        opponentRating: 2280,
        result: 'win',
        ratingChange: 14,
        accuracy: 94.2,
        timeControl: 'Rapid (10m)',
        playerColor: 'w',
        date: 'Aug 29',
        openingName: "Queen's Gambit Accepted",
        fen: 'r1bqk2r/pp2bppp/2n1pn2/8/3P4/2N2N2/PP2BPPP/R1BQ1RK1 w kq - 0 10'
      },
      {
        id: 'm-2',
        opponentName: 'Citadel Sentinel 🛡️',
        opponentAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80',
        opponentRating: 2195,
        result: 'win',
        ratingChange: 10,
        accuracy: 89.6,
        timeControl: 'Blitz (3m)',
        playerColor: 'b',
        date: 'Aug 28',
        openingName: 'King’s Indian Defense',
        fen: 'rnbq1rk1/ppp1ppbp/3p1np1/8/2PPP3/2N2N2/PP2BPPP/R1BQK2R b KQ - 0 6'
      },
      {
        id: 'm-3',
        opponentName: 'Erbil Grandmaster',
        opponentAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80',
        opponentRating: 2310,
        result: 'loss',
        ratingChange: -11,
        accuracy: 78.4,
        timeControl: 'Rapid (15m)',
        playerColor: 'w',
        date: 'Aug 28',
        openingName: 'Ruy Lopez: Berlin Defense',
        fen: 'r1bqkb1r/pppp1ppp/2n5/4p3/1bB1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4'
      },
      {
        id: 'm-4',
        opponentName: 'Zagros Mountain Wolf',
        opponentAvatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100&auto=format&fit=crop&q=80',
        opponentRating: 2150,
        result: 'win',
        ratingChange: 9,
        accuracy: 92.1,
        timeControl: 'Bullet (1m)',
        playerColor: 'b',
        date: 'Aug 27',
        openingName: 'Sicilian: Dragon Variation',
        fen: 'r1bqk2r/pp2ppbp/2np1np1/8/3NP3/2N1BP2/PPP3PP/R2QKB1R w KQkq - 0 8'
      },
      {
        id: 'm-5',
        opponentName: 'Stockfish Neural Bot',
        opponentAvatar: '🤖',
        opponentRating: 2200,
        result: 'draw',
        ratingChange: 0,
        accuracy: 96.8,
        timeControl: 'Daily (24h)',
        playerColor: 'w',
        date: 'Aug 26',
        openingName: 'Catalan Opening: Closed',
        fen: 'r1bq1rk1/pp1nbppp/2p1pn2/8/2PP4/5NP1/PP2NPBP/R1BQ1RK1 b - - 0 9'
      },
      {
        id: 'm-6',
        opponentName: 'SoranTactics',
        opponentAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        opponentRating: 2090,
        result: 'win',
        ratingChange: 8,
        accuracy: 86.4,
        timeControl: 'Blitz (5m)',
        playerColor: 'w',
        date: 'Aug 25',
        openingName: 'French Defense: Winawer',
        fen: 'r1bqk1nr/pp3ppp/2n1p3/2bpP3/8/2PB1N2/PP3PPP/RNBQK2R b KQkq - 0 7'
      },
      {
        id: 'm-7',
        opponentName: 'Duhok Knight 🏰',
        opponentAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80',
        opponentRating: 2185,
        result: 'win',
        ratingChange: 11,
        accuracy: 91.0,
        timeControl: 'Rapid (10m)',
        playerColor: 'b',
        date: 'Aug 24',
        openingName: 'Caro-Kann: Classical',
        fen: 'r2qkbnr/pp1n1ppp/2p1p3/5b2/3PN3/5N2/PPP1BPPP/R1BQK2R w KQkq - 0 7'
      },
      {
        id: 'm-8',
        opponentName: 'Sulaymaniyah Master',
        opponentAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100&auto=format&fit=crop&q=80',
        opponentRating: 2260,
        result: 'loss',
        ratingChange: -12,
        accuracy: 74.5,
        timeControl: 'Blitz (3m)',
        playerColor: 'w',
        date: 'Aug 23',
        openingName: 'English Opening: Four Knights',
        fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2P5/2N2N2/PP1PPPPP/R1BQKB1R w KQkq - 0 4'
      },
      {
        id: 'm-9',
        opponentName: 'Vanguard Ranger ⚔️',
        opponentAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&auto=format&fit=crop&q=80',
        opponentRating: 2040,
        result: 'win',
        ratingChange: 7,
        accuracy: 88.2,
        timeControl: 'Bullet (2m)',
        playerColor: 'b',
        date: 'Aug 22',
        openingName: 'Modern Defense',
        fen: 'rnbqk1nr/ppp1ppbp/3p2p1/8/2PPP3/8/PP3PPP/RNBQKBNR w KQkq - 0 4'
      },
      {
        id: 'm-10',
        opponentName: 'Peshmerga Colonel',
        opponentAvatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=80',
        opponentRating: 2215,
        result: 'win',
        ratingChange: 13,
        accuracy: 95.3,
        timeControl: 'Rapid (10m)',
        playerColor: 'w',
        date: 'Aug 21',
        openingName: 'Nimzo-Indian Defense',
        fen: 'r1bqk2r/pppp1ppp/2n1pn2/8/1bPP4/2N1PN2/PP3PPP/R1BQKB1R b KQkq - 0 5'
      }
    ];

    return [...formattedFromLogs, ...fallbackMatches].slice(0, 10);
  }, []);

  // Filtered Matches
  const filteredMatches = useMemo(() => {
    return allMatches.filter(m => {
      if (matchFilter !== 'all' && m.result !== matchFilter) return false;
      if (searchOpponent.trim()) {
        const query = searchOpponent.toLowerCase();
        return m.opponentName.toLowerCase().includes(query) || m.openingName.toLowerCase().includes(query);
      }
      return true;
    });
  }, [allMatches, matchFilter, searchOpponent]);

  // Achievement Badges
  const achievementBadges = [
    {
      id: 'first_tourney',
      name: 'First Tournament Win',
      desc: 'Finished 1st place in the Erbil Citadel Open Arena',
      icon: '🏆',
      rarity: 'Legendary',
      color: 'from-amber-500/20 to-yellow-500/10 border-amber-400/40 text-amber-300'
    },
    {
      id: 'puzzles_100',
      name: '100 Puzzles Solved',
      desc: 'Solved over 100 tactical puzzles with precision',
      icon: '🧩',
      rarity: 'Epic',
      color: 'from-sky-500/20 to-blue-500/10 border-sky-400/40 text-sky-300'
    },
    {
      id: 'citadel_gm',
      name: 'Citadel Grandmaster',
      desc: 'Attained supreme 2200+ Elo rating across all modes',
      icon: '👑',
      rarity: 'Mythic',
      color: 'from-purple-500/20 to-pink-500/10 border-purple-400/40 text-purple-300'
    },
    {
      id: 'lightning_tac',
      name: 'Lightning Tactician',
      desc: 'Won 20 consecutive Bullet & Blitz matches under 3 minutes',
      icon: '⚡',
      rarity: 'Rare',
      color: 'from-amber-400/20 to-orange-500/10 border-amber-300/40 text-amber-200'
    },
    {
      id: 'peshmerga_sun',
      name: 'Peshmerga Sun of Glory',
      desc: 'Awarded to defenders demonstrating supreme honor & respect',
      icon: '☀️',
      rarity: 'National Legend',
      color: 'from-emerald-500/20 to-amber-500/10 border-[#F5C453]/50 text-[#F5C453]'
    },
    {
      id: 'streak_10',
      name: 'Undefeated 10-Streak',
      desc: 'Maintained an unbroken 10-game win streak in rated rapid play',
      icon: '🔥',
      rarity: 'Epic',
      color: 'from-rose-500/20 to-orange-500/10 border-rose-400/40 text-rose-300'
    },
    {
      id: 'endgame_wiz',
      name: 'Endgame Wizard',
      desc: 'Converted 50 pawn endgames with zero blunders',
      icon: '🛡️',
      rarity: 'Rare',
      color: 'from-indigo-500/20 to-cyan-500/10 border-indigo-400/40 text-indigo-300'
    },
    {
      id: 'accuracy_95',
      name: '95%+ Accuracy Master',
      desc: 'Played a 35+ move victory with engine accuracy above 95%',
      icon: '🎯',
      rarity: 'Legendary',
      color: 'from-emerald-500/20 to-teal-500/10 border-emerald-400/40 text-emerald-300'
    }
  ];

  // Friends list
  const friendsList = [
    { id: 'f-1', name: 'GM Alan Kurdistan', rating: 2280, status: 'online', flag: '☀️', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80' },
    { id: 'f-2', name: 'Citadel Sentinel', rating: 2195, status: 'in_game', flag: '🛡️', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80' },
    { id: 'f-3', name: 'SoranTactics', rating: 2090, status: 'offline', flag: '☀️', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80' },
    { id: 'f-4', name: 'Duhok Knight', rating: 2185, status: 'online', flag: '🏰', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&auto=format&fit=crop&q=80' }
  ];

  const handleShareProfile = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleAddFriendClick = () => {
    if (friendStatus === 'add') {
      setFriendStatus('sent');
      setTimeout(() => setFriendStatus('friends'), 1000);
    } else if (friendStatus === 'friends') {
      setFriendStatus('add');
    }
  };

  return (
    <PanelContainer className="min-h-[100dvh] pb-24 md:pb-12 text-slate-100 font-ui">
      
      {/* ========================================================================= */}
      {/* 1. HEADER SECTION (RESPONSIVE ARCHITECTURE)                                */}
      {/*    - Mobile (< 768px): Sleek 56px sticky bar                              */}
      {/*    - Desktop (>= 768px): Full rich header card                            */}
      {/* ========================================================================= */}

      {/* MOBILE COMPACT STICKY 56PX HEADER (< 768px) */}
      <div className="md:hidden sticky top-0 z-30 -mx-1 sm:-mx-3 px-3 h-14 bg-slate-900/95 backdrop-blur-xl border-b border-slate-800 flex items-center justify-between shadow-lg">
        {/* Left: Avatar, Name & Flag */}
        <div 
          onClick={() => setIsMobileDrawerOpen(true)}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer active:opacity-80 py-1"
        >
          <div className="relative shrink-0">
            <img
              src={avatarUrl}
              alt={displayName}
              className="w-9 h-9 rounded-xl object-cover border-2 border-[#F5C453] shadow-sm"
              referrerPolicy="no-referrer"
            />
            <span 
              className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-900 ${
                onlineStatus === 'online'
                  ? 'bg-emerald-400'
                  : onlineStatus === 'in_game'
                  ? 'bg-amber-400 animate-pulse'
                  : 'bg-slate-500'
              }`}
            />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-white truncate max-w-[125px]">
                {displayName}
              </span>
              <span className="text-sm shrink-0 select-none" title={countryName}>
                {countryFlag}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
              <span>@{username}</span>
            </div>
          </div>
        </div>

        {/* Right: Primary Rating Badge & Drawer Trigger Button */}
        <div className="flex items-center gap-2 shrink-0">
          <div 
            onClick={() => setActiveTab('analytics')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 cursor-pointer shadow-sm"
          >
            <Clock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-xs font-black font-mono tracking-tight">{isNaN(baseElo) ? 2240 : baseElo}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="min-w-[44px] min-h-[44px] p-2 rounded-xl bg-slate-800 hover:bg-slate-750 active:bg-slate-700 text-[#F5C453] border border-slate-700/80 flex items-center justify-center transition-all cursor-pointer"
            title="Open Profile Actions & Details"
            aria-label="Open Profile Details"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DESKTOP FULL HERO CARD (>= 768px) */}
      <div className="hidden md:block relative rounded-3xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 p-6 sm:p-7 shadow-xl overflow-hidden">
        {/* Kurdish Accent Bar */}
        <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-[#8C2425] via-[#52673A] to-[#F5C453]" />

        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-6 relative z-10">
          {/* Avatar & User Details */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            {/* Avatar */}
            <div className="relative group shrink-0">
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-[#F5C453] shadow-lg shadow-black/40"
                referrerPolicy="no-referrer"
              />
              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                className="absolute inset-0 rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity text-[#F5C453] cursor-pointer"
                title="Change Avatar"
              >
                <Camera className="w-5 h-5" />
                <span className="text-[11px] font-bold text-white mt-0.5">Edit</span>
              </button>

              {/* Status Indicator */}
              <div 
                className={`absolute -bottom-2 right-1/2 translate-x-1/2 sm:translate-x-0 sm:right-0 px-2 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1.5 shadow-md ${
                  onlineStatus === 'online'
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                    : onlineStatus === 'in_game'
                    ? 'bg-amber-950 text-amber-300 border-amber-500/40 animate-pulse'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                <span 
                  className={`w-2 h-2 rounded-full ${
                    onlineStatus === 'online'
                      ? 'bg-emerald-400'
                      : onlineStatus === 'in_game'
                      ? 'bg-amber-400'
                      : 'bg-slate-500'
                  }`} 
                />
                <span className="capitalize">{onlineStatus === 'in_game' ? 'In-Game' : onlineStatus}</span>
              </div>
            </div>

            {/* Typography Details */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black font-heading text-white tracking-tight flex items-center">
                  {titleBadge && renderTitleBadge(titleBadge)}
                  {displayName}
                </h1>
                <span className="text-xl select-none" title={countryName}>
                  {countryFlag}
                </span>
                {isOwner && (
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded bg-[#8C2425] text-white border border-[#F5C453]/40 tracking-wider">
                    👑 FOUNDER
                  </span>
                )}
                {isSkyAccount && (
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded bg-sky-600 text-white border border-sky-300 tracking-wider">
                    🦋 CELESTIAL
                  </span>
                )}
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-slate-400 font-medium flex-wrap">
                <span className="font-mono text-slate-300">@{username}</span>
                <span>•</span>
                <span className="text-slate-300">{countryName}</span>
                <span>•</span>
                <RespectHonorBadge
                  respectPoints={profile?.respectPoints ?? 100}
                  honorRank={profile?.honorRank}
                  rankBadge={profile?.rankBadge}
                  variant="header-rank"
                />
              </div>

              <p className="text-sm text-slate-400 italic max-w-md">
                "{profile?.customStatus || 'Defending the mountain passes with calculated grandmaster honor.'}"
              </p>
            </div>
          </div>

          {/* Action Buttons (Desktop) */}
          <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-center">
            <button
              type="button"
              onClick={onChallenge}
              className="min-h-[44px] py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-[#52673A] hover:from-emerald-500 hover:to-[#5f7843] text-white text-sm font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md border border-emerald-400/30 transition-all cursor-pointer active:scale-95"
            >
              <Swords className="w-4 h-4" />
              <span>Challenge</span>
            </button>

            <button
              type="button"
              onClick={handleAddFriendClick}
              className={`min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer active:scale-95 ${
                friendStatus === 'friends'
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                  : friendStatus === 'sent'
                  ? 'bg-amber-950/70 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800 hover:bg-slate-750 text-white border-slate-700'
              }`}
            >
              {friendStatus === 'friends' ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Friends</span>
                </>
              ) : friendStatus === 'sent' ? (
                <>
                  <Activity className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>Sent</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4 text-[#F5C453]" />
                  <span>Add Friend</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleShareProfile}
              className="min-h-[44px] min-w-[44px] p-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 transition-all cursor-pointer flex items-center justify-center active:scale-95"
              title="Share profile link"
            >
              {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
            </button>

            {onEditProfileModal && (
              <button
                type="button"
                onClick={onEditProfileModal}
                className="min-h-[44px] py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm font-bold border border-slate-700 transition-all cursor-pointer active:scale-95"
              >
                Settings
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SWIPEABLE TOP TABS (DESKTOP & MOBILE SCROLLABLE)                       */}
      {/* ========================================================================= */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 pt-1 overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          {[
            { id: 'overview', label: 'Overview', icon: <Compass className="w-4 h-4" /> },
            { id: 'matches', label: 'Match History', icon: <History className="w-4 h-4" />, count: allMatches.length },
            { id: 'analytics', label: 'Analytics', icon: <BarChart2 className="w-4 h-4" /> },
            { id: 'social', label: 'Social', icon: <Users className="w-4 h-4" />, count: friendsList.length }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`min-h-[44px] py-2.5 px-4 rounded-xl text-sm font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap border shrink-0 active:scale-95 ${
                  isActive
                    ? 'bg-slate-800 text-white border-slate-700 shadow-md ring-1 ring-[#F5C453]/20'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-bold ${
                    isActive ? 'bg-slate-950 text-[#F5C453]' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Respect Points Badge */}
        <div className="hidden md:block shrink-0">
          <RespectHonorBadge
            respectPoints={profile?.respectPoints ?? 100}
            honorRank={profile?.honorRank}
            rankBadge={profile?.rankBadge}
            variant="points-pill"
            interactive={true}
            onClick={() => setActiveTab('social')}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MAIN PANELS BODY AREA (SCROLLABLE & RESPONSIVE)                         */}
      {/* ========================================================================= */}
      <div className="w-full space-y-5 overflow-y-auto min-h-0 flex-1">
        
        {/* ----------------------------------------------------------------------- */}
        {/* TAB 1: OVERVIEW                                                         */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'overview' && (
          <div className="space-y-5">
            {/* Primary Elo Ratings Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {Object.entries(ratingsData).map(([key, item]) => (
                <div 
                  key={key}
                  className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700">
                        {item.icon}
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {item.time}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-300">{item.title}</div>
                    <div className="text-2xl sm:text-3xl font-black font-mono text-white tracking-tight my-1">
                      {item.games > 0 ? item.current : 'Unrated'}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Peak <strong className="text-slate-200">{item.games > 0 ? item.peak : '—'}</strong></span>
                    <span>{item.games} g</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 2-Column Responsive Layout for Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
              {/* Left Column (7 Cols): Quick Rating Trajectory & Win Rates */}
              <div className="lg:col-span-7 space-y-5">
                {/* Rating Progress Teaser */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                        Rating Progress (Rapid)
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('analytics')}
                      className="min-h-[44px] text-xs font-bold text-[#F5C453] hover:underline flex items-center gap-1 cursor-pointer py-1 px-2"
                    >
                      <span>Full Analytics</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mini Sparkline Curve */}
                  <div className="relative w-full h-32 pt-2">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                      <defs>
                        <linearGradient id="miniGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path d={areaD} fill="url(#miniGradient)" />
                      <path d={pathD} fill="none" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400 font-mono pt-2 border-t border-slate-800">
                    <span>Current: <strong className="text-white">{baseElo} Elo</strong></span>
                    <span>Trend: <strong className="text-emerald-400">+48 past 30 days</strong></span>
                  </div>
                </div>

                {/* Color Performance Card */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                      Piece Performance & Win Rates
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-sm font-bold">
                        <span className="text-white flex items-center gap-2">
                          <span className="text-base">♔</span> <span>As White</span>
                        </span>
                        <span className="text-emerald-400 font-mono">64% Wins</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden flex">
                        <div style={{ width: '64%' }} className="bg-emerald-500 h-full" />
                        <div style={{ width: '18%' }} className="bg-slate-500 h-full" />
                        <div style={{ width: '18%' }} className="bg-rose-500 h-full" />
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-sm font-bold">
                        <span className="text-slate-300 flex items-center gap-2">
                          <span className="text-base">♚</span> <span>As Black</span>
                        </span>
                        <span className="text-emerald-400 font-mono">56% Wins</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-slate-800 overflow-hidden flex">
                        <div style={{ width: '56%' }} className="bg-emerald-500 h-full" />
                        <div style={{ width: '22%' }} className="bg-slate-500 h-full" />
                        <div style={{ width: '22%' }} className="bg-rose-500 h-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column (5 Cols): Recent Matches Snapshot & Highlights */}
              <div className="lg:col-span-5 space-y-5">
                {/* Recent Matches Snapshot */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <History className="w-5 h-5 text-[#F5C453]" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                        Recent Matches
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('matches')}
                      className="min-h-[44px] text-xs font-bold text-[#F5C453] hover:underline flex items-center gap-1 cursor-pointer py-1 px-2"
                    >
                      <span>View All ({allMatches.length})</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {allMatches.slice(0, 3).map(m => (
                      <div 
                        key={m.id}
                        className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-sm"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase font-mono ${
                            m.result === 'win' ? 'bg-emerald-500/20 text-emerald-300' : m.result === 'loss' ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {m.result}
                          </span>
                          <div className="truncate">
                            <div className="font-bold text-white truncate text-sm">{m.opponentName}</div>
                            <div className="text-xs text-slate-400 font-mono">{m.timeControl} • {m.date}</div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className={`font-mono font-bold text-sm ${m.ratingChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {m.ratingChange >= 0 ? `+${m.ratingChange}` : m.ratingChange}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">{m.accuracy}% acc</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Achievements Showcase Teaser */}
                <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-400" />
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                        Top Honors
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-emerald-400 font-bold">8 / 8 Badges</span>
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {achievementBadges.slice(0, 4).map(b => (
                      <div
                        key={b.id}
                        onClick={() => setActiveTab('social')}
                        className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center flex flex-col items-center justify-center space-y-1 cursor-pointer hover:border-slate-700 active:scale-95 transition-all"
                        title={b.name}
                      >
                        <span className="text-2xl">{b.icon}</span>
                        <span className="text-[10px] font-bold text-slate-300 truncate w-full">{b.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 2: MATCH HISTORY                                                    */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            {/* Controls Bar: Filters & Search */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
              {/* Filter Pills with 44px Touch Targets */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto justify-center">
                {(['all', 'win', 'loss', 'draw'] as MatchFilter[]).map(filter => (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setMatchFilter(filter)}
                    className={`min-h-[44px] px-4 py-2 text-xs sm:text-sm font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                      matchFilter === filter
                        ? filter === 'win'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : filter === 'loss'
                          ? 'bg-rose-600 text-white shadow-sm'
                          : 'bg-slate-700 text-white shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Search opponent or opening..."
                  value={searchOpponent}
                  onChange={e => setSearchOpponent(e.target.value)}
                  className="w-full min-h-[44px] pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder:text-slate-500 focus:border-[#F5C453] outline-none"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Match History List */}
            <div className="space-y-2.5">
              {filteredMatches.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 text-sm">
                  No match records found matching filter criteria.
                </div>
              ) : (
                filteredMatches.map(match => {
                  const isWin = match.result === 'win';
                  const isLoss = match.result === 'loss';

                  return (
                    <div
                      key={match.id}
                      className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/80 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group shadow-sm"
                    >
                      {/* Left: Result Badge + Opponent */}
                      <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                        <div
                          className={`w-14 py-2 rounded-xl text-center font-black text-xs uppercase tracking-wider font-mono shrink-0 ${
                            isWin
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isLoss
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-slate-700/30 text-slate-300 border border-slate-600/30'
                          }`}
                        >
                          {match.result}
                        </div>

                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {match.opponentAvatar.startsWith('http') ? (
                            <img
                              src={match.opponentAvatar}
                              alt={match.opponentName}
                              className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-800 text-lg flex items-center justify-center border border-slate-700 shrink-0">
                              {match.opponentAvatar}
                            </div>
                          )}

                          <div className="truncate flex-1">
                            <div className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                              <span className="truncate">{match.opponentName}</span>
                              <span className="text-xs text-slate-400 font-mono">({match.opponentRating})</span>
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono">{match.timeControl}</span>
                              <span>•</span>
                              <span className="text-slate-300 truncate">{match.openingName}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Metrics & Action Buttons */}
                      <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto pt-2.5 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                        <div className="flex items-center gap-3.5 text-right">
                          {/* Rating Change */}
                          <div>
                            <div
                              className={`text-sm font-mono font-black ${
                                match.ratingChange > 0
                                  ? 'text-emerald-400'
                                  : match.ratingChange < 0
                                  ? 'text-rose-400'
                                  : 'text-slate-400'
                              }`}
                            >
                              {match.ratingChange > 0 ? `+${match.ratingChange}` : match.ratingChange}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Elo Δ</div>
                          </div>

                          {/* Accuracy */}
                          <div>
                            <div className="text-sm font-mono font-bold text-slate-200">
                              {match.accuracy}%
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase font-bold">Accuracy</div>
                          </div>
                        </div>

                        {/* Analyze Game Action Button (44px touch target) */}
                        <button
                          type="button"
                          onClick={() => onAnalyzeGame && onAnalyzeGame(match.pgn, match.fen)}
                          className="min-h-[44px] py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-[#F5C453] hover:text-white text-xs sm:text-sm font-bold border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 active:scale-95"
                          title="Analyze move by move in Engine"
                        >
                          <Compass className="w-4 h-4" />
                          <span>Analyze</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 3: ANALYTICS                                                        */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'analytics' && (
          <div className="space-y-5">
            {/* Interactive Rating Chart Card */}
            <div className="p-4 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                      Interactive Rating Trajectory
                    </h3>
                    <p className="text-xs text-slate-400">
                      Touch or hover data points to inspect past games and Elo shifts
                    </p>
                  </div>
                </div>

                {/* Time Range Filter Buttons (44px min touch target) */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto justify-center">
                  {(['1W', '1M', '1Y', 'ALL'] as TimeRangeFilter[]).map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setTimeRange(tab)}
                      className={`min-h-[44px] min-w-[44px] px-3.5 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                        timeRange === tab
                          ? 'bg-emerald-500 text-slate-950 font-black shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>

              {/* SVG Interactive Line Chart Container */}
              <div className="relative w-full overflow-hidden pt-2">
                {profile?.gamesPlayed === 0 ? (
                  <div className="w-full h-48 sm:h-64 flex items-center justify-center border-t border-slate-800">
                    <p className="text-slate-400 text-sm">Play your first game to see your rating graph.</p>
                  </div>
                ) : (
                  <>
                    <svg
                      viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                      className="w-full h-48 sm:h-64 overflow-visible select-none"
                    >
                  <defs>
                    <linearGradient id="ratingAreaGradientTab" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#047857" stopOpacity="0.0" />
                    </linearGradient>
                    <linearGradient id="ratingLineGradientTab" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#34D399" />
                      <stop offset="50%" stopColor="#F5C453" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = paddingY + ratio * (chartHeight - paddingY * 2);
                    const labelRating = Math.round(maxRating - ratio * (maxRating - minRating));
                    return (
                      <g key={idx}>
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={chartWidth - paddingX}
                          y2={y}
                          stroke="#334155"
                          strokeDasharray="4 4"
                          strokeOpacity="0.4"
                        />
                        <text
                          x={paddingX - 6}
                          y={y + 3}
                          fill="#64748B"
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="end"
                        >
                          {labelRating}
                        </text>
                      </g>
                    );
                  })}

                  <path d={areaD} fill="url(#ratingAreaGradientTab)" />
                  <path d={pathD} fill="none" stroke="url(#ratingLineGradientTab)" strokeWidth="3" strokeLinecap="round" />

                  {points.map((pt, i) => {
                    const isHovered = hoveredPoint?.index === i;
                    const isLast = i === points.length - 1;
                    return (
                      <circle
                        key={i}
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered || isLast ? 6 : 3.5}
                        fill={isHovered ? '#FFFFFF' : '#10B981'}
                        stroke="#0F172A"
                        strokeWidth="2"
                        className="cursor-pointer transition-all hover:scale-125"
                        onMouseEnter={() => setHoveredPoint({ index: i, x: pt.x, y: pt.y, data: pt.data })}
                        onMouseLeave={() => setHoveredPoint(null)}
                        onClick={() => setHoveredPoint({ index: i, x: pt.x, y: pt.y, data: pt.data })}
                      />
                    );
                  })}
                </svg>

                {hoveredPoint && (
                  <div
                    className="absolute pointer-events-none z-20 -translate-x-1/2 -translate-y-full px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/50 shadow-xl text-xs space-y-1"
                    style={{
                      left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                      top: `${(hoveredPoint.y / chartHeight) * 100}%`
                    }}
                  >
                    <div className="text-[10px] text-slate-400 font-mono">{hoveredPoint.data.fullDate}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono font-black">{hoveredPoint.data.rating} Elo</span>
                      <span className="text-emerald-400 font-bold">{hoveredPoint.data.change}</span>
                    </div>
                  </div>
                )}
                  </>
                )}
              </div>
            </div>

            {/* 2-Column Grid: Repertoire & Color Performance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {/* Opening Repertoire Win Rates */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-sky-400" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                    Opening Repertoire Mastery
                  </h3>
                </div>

                <div className="space-y-3 pt-1">
                  {[
                    { name: 'Sicilian Defense: Najdorf', winRate: 71 },
                    { name: "Queen's Gambit Accepted", winRate: 68 },
                    { name: 'King’s Indian Defense', winRate: 64 },
                    { name: 'Ruy Lopez: Berlin Defense', winRate: 59 }
                  ].map((op, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-bold text-white">{op.name}</span>
                        <span className="text-emerald-400 font-mono font-bold">{op.winRate}% win</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div style={{ width: `${op.winRate}%` }} className="bg-emerald-500 h-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tactical Accuracy & Precision */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-[#F5C453]" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                    Game Precision & Blunder Rate
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                    <div className="text-2xl font-black font-mono text-emerald-400">88.4%</div>
                    <div className="text-xs text-slate-400 uppercase font-bold mt-1">Average Accuracy</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                    <div className="text-2xl font-black font-mono text-white">0.42</div>
                    <div className="text-xs text-slate-400 uppercase font-bold mt-1">Blunders / Game</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                    <div className="text-2xl font-black font-mono text-sky-400">92.1%</div>
                    <div className="text-xs text-slate-400 uppercase font-bold mt-1">Opening Precision</div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center">
                    <div className="text-2xl font-black font-mono text-purple-400">84.6%</div>
                    <div className="text-xs text-slate-400 uppercase font-bold mt-1">Endgame Conversion</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 4: SOCIAL                                                           */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === 'social' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
            {/* Left Column (5 Cols): Friends List & Online Status */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-[#F5C453]" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                      Friends List ({friendsList.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddFriendClick}
                    className="min-h-[44px] text-xs font-bold text-[#F5C453] hover:underline cursor-pointer flex items-center px-2"
                  >
                    + Add New
                  </button>
                </div>

                <div className="space-y-2.5">
                  {friendsList.map(friend => (
                    <div
                      key={friend.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={friend.avatar}
                          alt={friend.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="truncate">
                          <div className="font-bold text-white flex items-center gap-1.5 truncate">
                            <span>{friend.name}</span>
                            <span>{friend.flag}</span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono">{friend.rating} Elo</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          friend.status === 'online' ? 'bg-emerald-400' : friend.status === 'in_game' ? 'bg-amber-400 animate-pulse' : 'bg-slate-600'
                        }`} />
                        <button
                          type="button"
                          onClick={onChallenge}
                          className="min-h-[44px] py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs sm:text-sm text-white font-bold border border-slate-700 cursor-pointer active:scale-95 transition-all"
                        >
                          Play
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Status Setter */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2.5 text-sm">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Set Broadcast Status
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOnlineStatus('online')}
                    className={`min-h-[44px] py-2 px-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                      onlineStatus === 'online' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    🟢 Online
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlineStatus('in_game')}
                    className={`min-h-[44px] py-2 px-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                      onlineStatus === 'in_game' ? 'bg-amber-950 text-amber-300 border-amber-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    ⚔️ In-Game
                  </button>
                  <button
                    type="button"
                    onClick={() => setOnlineStatus('offline')}
                    className={`min-h-[44px] py-2 px-2 rounded-xl text-xs sm:text-sm font-bold border transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                      onlineStatus === 'offline' ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    ⚪ Offline
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column (7 Cols): Full Achievement Badges Showcase */}
            <div className="lg:col-span-7 space-y-4">
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                      Achievement Badges (8/8)
                    </h3>
                  </div>
                  <span className="text-xs text-[#F5C453] font-bold">100% Unlocked</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  {achievementBadges.map(badge => (
                    <div
                      key={badge.id}
                      className={`p-3 rounded-xl bg-gradient-to-b ${badge.color} border flex flex-col items-center text-center space-y-1.5 hover:scale-[1.02] active:scale-95 transition-all shadow-sm min-h-[110px] justify-between`}
                    >
                      <span className="text-2xl select-none">{badge.icon}</span>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold leading-tight line-clamp-1 block">{badge.name}</span>
                        <span className="text-[10px] text-slate-400 line-clamp-2 leading-tight block">{badge.desc}</span>
                      </div>
                      <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-black/40 text-slate-300 border border-white/10 mt-auto">
                        {badge.rarity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. MOBILE FIXED BOTTOM NAVIGATION BAR (< 768px)                           */}
      {/* ========================================================================= */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800 px-3 py-2 flex items-center justify-around shadow-2xl safe-bottom">
        {[
          { id: 'overview', label: 'Overview', icon: <Compass className="w-5 h-5" /> },
          { id: 'matches', label: 'Games', icon: <History className="w-5 h-5" />, count: allMatches.length },
          { id: 'analytics', label: 'Stats', icon: <BarChart2 className="w-5 h-5" /> },
          { id: 'social', label: 'Social', icon: <Users className="w-5 h-5" />, count: friendsList.length }
        ].map(item => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id as TabType)}
              className={`min-h-[48px] min-w-[64px] flex flex-col items-center justify-center gap-1 rounded-xl transition-all cursor-pointer active:scale-95 ${
                isActive
                  ? 'text-[#F5C453] font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              <div className="relative">
                {item.icon}
                {item.count !== undefined && (
                  <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 rounded-full bg-[#F5C453] text-slate-950 text-[9px] font-black font-mono">
                    {item.count}
                  </span>
                )}
              </div>
              <span className="text-[11px] leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 5. MOBILE EXPANDABLE PROFILE DRAWER / BOTTOM SHEET (< 768px)              */}
      {/* ========================================================================= */}
      {isMobileDrawerOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div 
            className="w-full bg-slate-900 border-t border-slate-700 rounded-t-3xl p-5 shadow-2xl space-y-4 max-h-[88dvh] overflow-y-auto animate-in slide-in-from-bottom duration-250"
          >
            {/* Drawer Handle & Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="w-12 h-1.5 rounded-full bg-slate-700 mx-auto absolute left-1/2 -translate-x-1/2 top-3" />
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-200 mt-2">
                Warrior Profile
              </h2>
              <button
                type="button"
                onClick={() => setIsMobileDrawerOpen(false)}
                className="min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700 cursor-pointer active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Hero Inside Drawer */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#F5C453] shadow-md"
                  referrerPolicy="no-referrer"
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsAvatarModalOpen(true);
                    setIsMobileDrawerOpen(false);
                  }}
                  className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-[#F5C453]"
                  title="Edit Avatar"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-base font-black text-white">{displayName}</span>
                  <span className="text-base">{countryFlag}</span>
                </div>
                <div className="text-xs text-slate-400 font-mono">@{username} • {countryName}</div>
                <div className="text-xs text-[#F5C453] font-bold flex items-center gap-1">
                  <Crown className="w-3.5 h-3.5" />
                  <span>{profile?.honorRank || 'Peshmerga Grandmaster'}</span>
                </div>
              </div>
            </div>

            {/* Custom Bio Quote */}
            <p className="text-xs text-slate-400 italic bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              "{profile?.customStatus || 'Defending the mountain passes with calculated grandmaster honor.'}"
            </p>

            {/* Respect Points & Honor Score */}
            <RespectHonorBadge
              respectPoints={profile?.respectPoints ?? 100}
              honorRank={profile?.honorRank}
              rankBadge={profile?.rankBadge}
              variant="drawer-row"
            />

            {/* Broadcast Status Selector */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Broadcast Status
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setOnlineStatus('online')}
                  className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center ${
                    onlineStatus === 'online' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  🟢 Online
                </button>
                <button
                  type="button"
                  onClick={() => setOnlineStatus('in_game')}
                  className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center ${
                    onlineStatus === 'in_game' ? 'bg-amber-950 text-amber-300 border-amber-500/40' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  ⚔️ In-Game
                </button>
                <button
                  type="button"
                  onClick={() => setOnlineStatus('offline')}
                  className={`min-h-[44px] py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-center ${
                    onlineStatus === 'offline' ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  ⚪ Offline
                </button>
              </div>
            </div>

            {/* Quick Action Buttons Grid */}
            <div className="grid grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileDrawerOpen(false);
                  onChallenge && onChallenge();
                }}
                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-[#52673A] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md border border-emerald-400/30 active:scale-95"
              >
                <Swords className="w-4 h-4" />
                <span>Challenge</span>
              </button>

              <button
                type="button"
                onClick={handleAddFriendClick}
                className={`min-h-[44px] py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border active:scale-95 ${
                  friendStatus === 'friends'
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-white border-slate-700'
                }`}
              >
                <UserPlus className="w-4 h-4 text-[#F5C453]" />
                <span>{friendStatus === 'friends' ? 'Friends' : 'Add Friend'}</span>
              </button>

              <button
                type="button"
                onClick={handleShareProfile}
                className="min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 active:scale-95"
              >
                {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{copiedLink ? 'Link Copied!' : 'Share Profile'}</span>
              </button>

              {onEditProfileModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileDrawerOpen(false);
                    onEditProfileModal();
                  }}
                  className="min-h-[44px] py-2.5 px-3 rounded-xl bg-slate-800 text-slate-200 border border-slate-700 text-xs font-bold flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>Edit Profile</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. AVATAR / AI STUDIO SELECTION MODAL                                     */}
      {/* ========================================================================= */}
      {isAvatarModalOpen && (
        <ChessAvatarModal
          isOpen={isAvatarModalOpen}
          onClose={() => setIsAvatarModalOpen(false)}
        />
      )}
    </PanelContainer>
  );
};
