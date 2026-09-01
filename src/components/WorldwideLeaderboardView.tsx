import React, { useState, useEffect } from 'react';
import { PanelContainer } from './PanelContainer';
import { Trophy, Search, Zap, ChevronLeft, ChevronRight, Flame, Snowflake, Medal, Shield, Globe, Users, Clock, Hash, Percent, History, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface LeaderboardUser {
  uid: string;
  displayName: string;
  username: string;
  photoURL: string;
  avatar: string;
  country: string;
  flag: string;
  elo: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
  streak: number;
  streakType: 'win' | 'loss';
  rank: number;
  title: string;
  honorRank?: string;
  isCurrentUser?: boolean;
}

interface HistogramData {
  range: string;
  count: number;
  start: number;
}

export const WorldwideLeaderboardView: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeMode, setActiveMode] = useState<'bullet' | 'blitz' | 'rapid' | 'puzzle' | 'daily'>('blitz');
  const [scope, setScope] = useState<'global' | 'country' | 'friends'>('global');
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('all');
  
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [players, setPlayers] = useState<LeaderboardUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [histogramData, setHistogramData] = useState<HistogramData[]>([]);
  
  const [myRankData, setMyRankData] = useState<LeaderboardUser | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page on filter change
  useEffect(() => {
    setPage(1);
  }, [activeMode, scope, period]);

  // Fetch Leaderboard
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        let url = `/api/leaderboard?mode=${activeMode}&scope=${scope}&period=${period}&page=${page}&limit=50&search=${debouncedSearch}`;
        if (scope === 'country' && profile?.country) {
          url += `&country=${profile.country}`;
        }
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (data.data) {
          const formattedPlayers = data.data.map((p: any) => ({
            ...p,
            isCurrentUser: p.uid === user?.uid
          }));
          setPlayers(formattedPlayers);
          setTotalPages(data.totalPages || 1);
        }
      } catch (e) {
        console.error('Failed to fetch leaderboard', e);
      }
      setIsLoading(false);
    };
    
    fetchLeaderboard();
  }, [activeMode, scope, period, page, debouncedSearch, user?.uid, profile?.country]);
  
  // Fetch Histogram & My Rank
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const histRes = await fetch(`/api/leaderboard/distribution?mode=${activeMode}`);
        const histData = await histRes.json();
        setHistogramData(histData);
        
        if (user?.uid) {
          const rankRes = await fetch(`/api/leaderboard/rank/${user.uid}?mode=${activeMode}`);
          if (rankRes.ok) {
            const rankData = await rankRes.json();
            if (rankData.userData) {
              setMyRankData({
                ...rankData.userData,
                isCurrentUser: true
              });
            }
          }
        }
      } catch (e) {
        console.error('Failed to fetch metadata', e);
      }
    };
    
    fetchMeta();
  }, [activeMode, user?.uid]);

  const top3 = players.slice(0, 3);
  
  // Helper to render title badge
  const renderTitleBadge = (title: string) => {
    if (!title) return null;
    let bg = 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    if (title === 'GM') bg = 'bg-red-500/20 text-red-300 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
    else if (title === 'IM') bg = 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
    else if (title === 'FM') bg = 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.3)]';
    else if (title === 'NM') bg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
    
    return (
      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm border ${bg}`}>
        {title}
      </span>
    );
  };

  const getRankMedal = (rank: number) => {
    if (rank === 1) return <Medal className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.6)]" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600 drop-shadow-[0_0_8px_rgba(217,119,6,0.6)]" />;
    return <span className="text-white/40 font-mono text-sm">{rank}</span>;
  };

  // Reorder Top 3 for visual podium (2, 1, 3)
  const podiumPlayers = [top3[1], top3[0], top3[2]].filter(Boolean);

  return (
    <PanelContainer className="min-h-[100dvh] pb-24 md:pb-12 text-slate-100 font-ui overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 glass-panel p-5 rounded-3xl border border-[#F5C453]/30 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#F5C453]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex items-center gap-4 z-10">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#8C2425] via-[#52673A] to-[#F5C453] p-0.5 shadow-lg flex-shrink-0">
            <div className="w-full h-full bg-black/60 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-[#F5C453]" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight">Worldwide Leaderboard</h1>
            <p className="text-sm text-[#DFD0B0]/70">Compete for glory. Climb the ranks.</p>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative w-full md:w-64 z-10">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search player..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-black/50 border border-white/10 text-sm text-white focus:outline-none focus:border-[#F5C453]/50 transition-colors placeholder:text-white/30"
          />
        </div>
      </div>

      {/* Filters Ribbon */}
      <div className="flex flex-col lg:flex-row items-center gap-4">
        {/* Modes */}
        <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-black/40 border border-white/5 w-full lg:w-auto overflow-x-auto hide-scrollbar">
          {[
            { id: 'bullet', label: 'Bullet', icon: <Zap className="w-3.5 h-3.5" /> },
            { id: 'blitz', label: 'Blitz', icon: <Flame className="w-3.5 h-3.5" /> },
            { id: 'rapid', label: 'Rapid', icon: <Clock className="w-3.5 h-3.5" /> },
            { id: 'puzzle', label: 'Puzzles', icon: <Shield className="w-3.5 h-3.5" /> },
            { id: 'daily', label: 'Daily', icon: <History className="w-3.5 h-3.5" /> },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setActiveMode(m.id as any)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeMode === m.id
                  ? 'bg-gradient-to-r from-[#8C2425] to-[#52673A] text-white shadow-md border border-[#F5C453]/30'
                  : 'text-white/60 hover:text-white hover:bg-white/5 border border-transparent'
              }`}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 ml-auto w-full lg:w-auto">
          {/* Scope Filters */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/5">
            {[
              { id: 'global', icon: <Globe className="w-4 h-4" /> },
              { id: 'country', icon: <span className="text-sm">🏳️</span> },
              { id: 'friends', icon: <Users className="w-4 h-4" /> }
            ].map(s => (
              <button
                key={s.id}
                onClick={() => setScope(s.id as any)}
                className={`p-2 rounded-lg transition-all ${
                  scope === s.id ? 'bg-white/10 text-[#F5C453]' : 'text-white/40 hover:text-white/80'
                }`}
              >
                {s.icon}
              </button>
            ))}
          </div>

          {/* Period Filters */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-black/40 border border-white/5">
            {['week', 'month', 'all'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p as any)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg capitalize transition-all ${
                  period === p ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Podium & Table */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          
          {/* Top 3 Podium Hero */}
          {page === 1 && !search && podiumPlayers.length > 0 && (
            <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-[#F5C453]/20 flex items-end justify-center gap-4 sm:gap-8 h-[240px]">
              {podiumPlayers.map((p, i) => {
                const isFirst = p.rank === 1;
                const isSecond = p.rank === 2;
                const isThird = p.rank === 3;
                const height = isFirst ? 'h-32' : isSecond ? 'h-24' : 'h-20';
                const color = isFirst ? 'from-yellow-600/40 to-yellow-900/40 border-yellow-500/50' 
                            : isSecond ? 'from-slate-500/40 to-slate-800/40 border-slate-400/50'
                            : 'from-amber-700/40 to-amber-900/40 border-amber-600/50';

                return (
                  <div key={p.uid} className="flex flex-col items-center gap-3">
                    <div className="flex flex-col items-center gap-1.5">
                      {renderTitleBadge(p.title)}
                      <div className={`relative rounded-full p-1 border-2 ${isFirst ? 'border-yellow-400' : isSecond ? 'border-slate-300' : 'border-amber-600'}`}>
                        {p.photoURL || p.avatar ? (
                          <img src={p.photoURL || p.avatar} className={`${isFirst ? 'w-14 h-14' : 'w-12 h-12'} rounded-full object-cover`} />
                        ) : (
                          <div className={`${isFirst ? 'w-14 h-14' : 'w-12 h-12'} rounded-full bg-black/50 flex items-center justify-center font-bold`}>
                            {p.displayName.charAt(0)}
                          </div>
                        )}
                        <div className="absolute -bottom-2 -right-2 bg-black rounded-full border border-white/20 p-0.5">
                          {p.flag}
                        </div>
                      </div>
                      <span className="text-xs font-bold text-white truncate max-w-[80px]">{p.displayName}</span>
                    </div>
                    
                    <div className={`w-20 sm:w-24 ${height} rounded-t-xl bg-gradient-to-b ${color} border-t-2 flex flex-col items-center justify-start pt-3 shadow-[0_0_20px_rgba(0,0,0,0.5)]`}>
                      <span className="text-2xl font-black text-white/90">{p.rank}</span>
                      <span className="text-xs font-mono font-bold text-white/70">{p.elo}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Leaderboard Table Container */}
          <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden flex flex-col relative">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-black/40 border-b border-white/10">
                    <th className="p-4 text-xs font-bold text-white/50 w-16 text-center">Rank</th>
                    <th className="p-4 text-xs font-bold text-white/50">Player</th>
                    <th className="p-4 text-xs font-bold text-white/50 text-right">Rating</th>
                    <th className="p-4 text-xs font-bold text-white/50 text-right">W/L/D</th>
                    <th className="p-4 text-xs font-bold text-white/50 text-right">Win %</th>
                    <th className="p-4 text-xs font-bold text-white/50 text-right">Streak</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-white/40">Loading ranking data...</td>
                    </tr>
                  ) : players.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-white/40">No players found in this category.</td>
                    </tr>
                  ) : (
                    players.map((p) => (
                      <tr 
                        key={p.uid} 
                        className={`transition-colors hover:bg-white/[0.02] ${p.isCurrentUser ? 'bg-[#52673A]/20' : ''}`}
                      >
                        <td className="p-4 text-center">
                          <div className="flex justify-center">{getRankMedal(p.rank)}</div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              {p.photoURL || p.avatar ? (
                                <img src={p.photoURL || p.avatar} className="w-8 h-8 rounded-full object-cover border border-white/10" />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold border border-white/10">
                                  {p.displayName.charAt(0)}
                                </div>
                              )}
                              <span className="absolute -bottom-1 -right-1 text-[10px] bg-black rounded-full leading-none">{p.flag}</span>
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5">
                                {renderTitleBadge(p.title)}
                                <span className={`text-sm font-bold ${p.isCurrentUser ? 'text-[#F5C453]' : 'text-white'}`}>
                                  {p.displayName}
                                </span>
                              </div>
                              {p.username && <span className="text-[10px] font-mono text-white/40">@{p.username}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <span className={`text-sm font-black font-mono ${p.isCurrentUser ? 'text-[#F5C453]' : 'text-white/90'}`}>
                            {p.elo}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <span className="text-xs font-mono text-white/60">
                            <span className="text-emerald-400">{p.wins}</span>/
                            <span className="text-rose-400">{p.losses}</span>/
                            <span className="text-slate-400">{p.draws}</span>
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-xs font-bold text-white/80">{p.winRate}%</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          {p.streak > 0 ? (
                            <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black ${
                              p.streakType === 'win' 
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}>
                              {p.streakType === 'win' ? <Flame className="w-3 h-3" /> : <Snowflake className="w-3 h-3" />}
                              <span>{p.streak}{p.streakType === 'win' ? 'W' : 'L'}</span>
                            </div>
                          ) : (
                            <span className="text-white/20">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Sticky "Your Rank" Row */}
            {myRankData && !isLoading && (
              <div className="border-t border-[#F5C453]/40 bg-gradient-to-r from-[#161c12] to-[#1a2315] p-0">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <tbody>
                    <tr>
                      <td className="p-4 text-center w-16">
                        <div className="flex justify-center text-[#F5C453] font-bold text-xs whitespace-nowrap">
                          {myRankData.rank ? `#${myRankData.rank}` : 'Unranked — Play a rated game to appear'}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-[#52673A]/40 flex items-center justify-center text-xs font-bold border border-[#F5C453]/40">
                              You
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                              {renderTitleBadge(myRankData.title)}
                              <span className="text-sm font-bold text-[#F5C453]">
                                {myRankData.displayName}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-sm font-black font-mono text-[#F5C453]">
                          {myRankData.elo}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-xs font-mono text-white/60">
                          {myRankData.wins}/{myRankData.losses}/{myRankData.draws}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-xs font-bold text-[#F5C453]">{myRankData.winRate}%</span>
                      </td>
                      <td className="p-4 text-right">
                        <span className="text-xs font-bold text-white/60">-</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="p-4 border-t border-white/10 bg-black/40 flex items-center justify-between">
              <span className="text-xs text-white/40 font-mono">
                Page {page} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors disabled:opacity-30 border border-white/10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors disabled:opacity-30 border border-white/10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Rating Distribution */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          <div className="glass-panel p-5 rounded-3xl border border-white/10 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-6">
              <BarChart2 className="w-4 h-4 text-blue-400" />
              <span>Rating Distribution</span>
            </h3>
            
            <div className="h-[300px] w-full">
              {histogramData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={histogramData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                    <XAxis 
                      dataKey="range" 
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <YAxis 
                      tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff', fontSize: '12px', fontWeight: 'bold' }}
                      labelStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px', marginBottom: '4px' }}
                    />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {histogramData.map((entry, index) => {
                        // Highlight user's bracket
                        let isUserBracket = false;
                        if (myRankData) {
                          const userElo = myRankData.elo;
                          const bracketStart = Math.floor(userElo / 200) * 200;
                          isUserBracket = entry.start === bracketStart;
                        }
                        
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={isUserBracket ? '#F5C453' : 'rgba(82, 103, 58, 0.6)'} 
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/30 text-xs">
                  Not enough data for distribution
                </div>
              )}
            </div>
            
            <div className="mt-4 p-4 rounded-xl bg-black/30 border border-white/5 flex flex-col gap-2">
              <div className="text-xs text-white/50">Current Median Rating</div>
              <div className="text-xl font-black text-white font-mono">
                {histogramData.length > 0 
                  ? (parseInt(histogramData[Math.floor(histogramData.length / 2)]?.range?.split('-')[0]) + 100 || 1200) 
                  : 1200}
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </PanelContainer>
  );
};
