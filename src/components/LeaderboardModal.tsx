import React, { useState, useEffect } from 'react';
import { RespectProfile, RespectLeaderboardEntry } from '../types/chess';
import { getLeaderboardEntries, HONOR_RANKS, getHonorRank } from '../utils/respectSystem';
import { Trophy, Sword, HeartHandshake, Shield, Sparkles, X, Award, ChevronRight, Flame, RefreshCw, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LeaderboardModalProps {
  profile: RespectProfile;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ profile, onClose }) => {
  const { syncWithCloudLeaderboard } = useAuth();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'ranks' | 'lore'>('leaderboard');
  const [leaderboardType, setLeaderboardType] = useState<'respect' | 'elo'>('respect');
  const [leaderboard, setLeaderboard] = useState<RespectLeaderboardEntry[]>(() => getLeaderboardEntries(profile, 'respect'));
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const rankInfo = getHonorRank(profile.respectPoints);

  const fetchCloudData = async (type: 'respect' | 'elo') => {
    setIsLoadingCloud(true);
    try {
      const cloudData = await syncWithCloudLeaderboard(type);
      const defaultEntries = getLeaderboardEntries(profile, type);
      const immortalEntry = defaultEntries.find(e => e.isImmortal) || defaultEntries[0];
      
      let listToRank: RespectLeaderboardEntry[] = [];
      if (cloudData && cloudData.length > 0) {
        const nonImmortalCloud = cloudData.filter(e => e.id !== immortalEntry.id);
        listToRank = [immortalEntry, ...nonImmortalCloud];
      } else {
        listToRank = defaultEntries;
      }

      // Re-sort based on type
      const mortals = listToRank.filter(e => !e.isImmortal);
      mortals.sort((a, b) => {
        if (type === 'elo') {
          const aVal = typeof a.elo === 'number' ? a.elo : parseInt(String(a.elo)) || 0;
          const bVal = typeof b.elo === 'number' ? b.elo : parseInt(String(b.elo)) || 0;
          return bVal - aVal;
        }
        const aVal = typeof a.respectPoints === 'number' ? a.respectPoints : parseInt(String(a.respectPoints)) || 0;
        const bVal = typeof b.respectPoints === 'number' ? b.respectPoints : parseInt(String(b.respectPoints)) || 0;
        return bVal - aVal;
      });

      const reRanked = [
        immortalEntry,
        ...mortals.map((entry, idx) => ({
          ...entry,
          rank: idx + 2
        }))
      ];
      setLeaderboard(reRanked);
    } catch (err) {
      console.error('Failed to sync leaderboard:', err);
    } finally {
      setIsLoadingCloud(false);
    }
  };

  useEffect(() => {
    fetchCloudData(leaderboardType);
  }, [leaderboardType, profile]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 p-4">
      <div className="relative glass-panel rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-[#F5C453]/30 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#F5C453]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#52673A]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8C2425] via-[#52673A] to-[#F5C453] p-0.5 shadow-lg shadow-[#F5C453]/20">
              <div className="w-full h-full bg-[#161c12] rounded-[14px] flex items-center justify-center text-xl">
                <span>☀️</span>
              </div>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#FDFCF7] tracking-tight flex items-center gap-2">
                Leaderboards & Hall of Fame
              </h2>
              <p className="text-xs text-[#DFD0B0]/70 font-medium">
                Live rankings across all warriors in Kurdistan and the World
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchCloudData(leaderboardType)}
              disabled={isLoadingCloud}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#F5C453] transition-colors border border-white/10 disabled:opacity-50"
              title="Refresh Leaderboard"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingCloud ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-white/50 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Player Honor Summary Card */}
        <div className="my-4 p-4 rounded-2xl bg-gradient-to-r from-[#52673A]/30 via-[#435433]/20 to-[#8C2425]/20 border border-[#F5C453]/30 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#1f2919] border border-[#F5C453]/40 flex items-center justify-center text-2xl shadow-md">
                {profile.rankBadge || '🌿'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-[#F5C453] font-bold">Your Honor Title</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#F5C453]/20 text-[#F5C453] text-[10px] font-black border border-[#F5C453]/30">
                    Active
                  </span>
                </div>
                <h3 className="text-lg font-black text-white">{profile.honorRank}</h3>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-center px-3 py-1.5 rounded-xl bg-black/30 border border-white/10">
                <span className="text-[10px] text-[#DFD0B0]/70 uppercase block font-semibold">Respect</span>
                <span className="text-base font-black text-[#F5C453] flex items-center justify-center gap-1">
                  ✊ {profile.respectPoints}
                </span>
              </div>

              <div className="text-center px-3 py-1.5 rounded-xl bg-black/30 border border-white/10">
                <span className="text-[10px] text-[#DFD0B0]/70 uppercase block font-semibold">Rating</span>
                <span className="text-base font-black text-white">
                  ⚔️ {profile.elo}
                </span>
              </div>

              <div className="text-center px-3 py-1.5 rounded-xl bg-black/30 border border-white/10">
                <span className="text-[10px] text-[#DFD0B0]/70 uppercase block font-semibold">Mercies</span>
                <span className="text-base font-black text-emerald-400">
                  🕊️ {profile.merciesGranted}
                </span>
              </div>

              <div className="text-center px-3 py-1.5 rounded-xl bg-black/30 border border-white/10">
                <span className="text-[10px] text-[#DFD0B0]/70 uppercase block font-semibold">Executions</span>
                <span className="text-base font-black text-red-400">
                  ⚔️ {profile.executions}
                </span>
              </div>
            </div>
          </div>

          {/* Progress to Next Rank */}
          {rankInfo.nextRank && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center justify-between text-xs text-[#DFD0B0]/80 mb-1">
                <span>Next Rank: <strong className="text-[#F5C453]">{rankInfo.nextRank.title}</strong></span>
                <span>{rankInfo.nextRank.pointsNeeded} ✊ needed</span>
              </div>
              <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-[#52673A] via-[#F5C453] to-[#8C2425] rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(100, Math.max(10, ((profile.respectPoints % 100) / 100) * 100))}%`
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between gap-2 mb-3 border-b border-white/10 pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'leaderboard'
                  ? 'bg-[#52673A] text-white shadow-md border border-[#F5C453]/40'
                  : 'text-[#DFD0B0]/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-[#F5C453]" />
              <span>Leaderboards</span>
            </button>

            <button
              onClick={() => setActiveTab('ranks')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'ranks'
                  ? 'bg-[#52673A] text-white shadow-md border border-[#F5C453]/40'
                  : 'text-[#DFD0B0]/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-[#F5C453]" />
              <span>Honor Ranks</span>
            </button>

            <button
              onClick={() => setActiveTab('lore')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'lore'
                  ? 'bg-[#52673A] text-white shadow-md border border-[#F5C453]/40'
                  : 'text-[#DFD0B0]/70 hover:text-white hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#F5C453]" />
              <span>Rules & Lore</span>
            </button>
          </div>

          {/* Sub-toggle: Respect vs ELO (when on leaderboard tab) */}
          {activeTab === 'leaderboard' && (
            <div className="flex items-center p-0.5 rounded-xl bg-black/40 border border-white/10">
              <button
                onClick={() => setLeaderboardType('respect')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 ${
                  leaderboardType === 'respect'
                    ? 'bg-[#F5C453] text-[#161c12] shadow-sm'
                    : 'text-[#DFD0B0]/70 hover:text-white'
                }`}
              >
                <span>✊ Respect</span>
              </button>
              <button
                onClick={() => setLeaderboardType('elo')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 ${
                  leaderboardType === 'elo'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'text-[#DFD0B0]/70 hover:text-white'
                }`}
              >
                <span>⚔️ ELO Rating</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {activeTab === 'leaderboard' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-[#DFD0B0]/60 px-3 py-1 bg-white/[0.02] rounded-lg border border-white/5 font-semibold">
                <span>WARRIOR / TACTICIAN</span>
                <span>{leaderboardType === 'elo' ? 'RANKING BY RATING (ELO)' : 'RANKING BY HONOR (RESPECT)'}</span>
              </div>

              {leaderboard.map(entry => {
                const isOwnerAccount = entry.role === 'owner' || entry.badgeNumber === 0 || entry.id === 'developer_qayssafty_uid';
                const isAdminAccount = entry.role === 'admin' || (entry.badgeNumber !== undefined && entry.badgeNumber >= 1 && entry.badgeNumber <= 9);
                const isSky = entry.username === 'sky' || entry.id === 'sky-celestial-profile' || entry.id === 'sky_celestial_account_uid';

                return (
                  <div
                    key={entry.id}
                    className={`flex items-center justify-between p-3.5 rounded-2xl transition-all border ${
                      entry.isImmortal || isSky
                        ? 'bg-gradient-to-r from-sky-950/40 via-[#8C2425]/20 to-[#52673A]/25 border-sky-400/60 shadow-[0_0_24px_rgba(56,189,248,0.25)] ring-1 ring-sky-400/40 relative overflow-hidden'
                        : isOwnerAccount
                        ? 'bg-gradient-to-r from-amber-950/40 via-[#8C2425]/25 to-[#52673A]/25 border-[#F5C453] shadow-[0_0_20px_rgba(245,196,83,0.3)] ring-1 ring-[#F5C453]/50'
                        : entry.isCurrentUser
                        ? 'bg-gradient-to-r from-[#52673A]/40 to-[#8C2425]/30 border-[#F5C453] shadow-md ring-1 ring-[#F5C453]/30'
                        : 'bg-white/[0.03] border-white/5 hover:bg-white/[0.06]'
                    }`}
                  >
                    {(entry.isImmortal || isSky) && (
                      <div className="absolute -top-6 -right-6 w-24 h-24 bg-sky-400/15 rounded-full blur-xl pointer-events-none" />
                    )}

                    <div className="flex items-center gap-3">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                          isOwnerAccount
                            ? 'bg-gradient-to-tr from-amber-500 to-amber-700 text-black shadow-lg shadow-amber-500/30'
                            : isSky
                            ? 'bg-gradient-to-tr from-sky-400 to-blue-600 text-white shadow-lg shadow-sky-500/30'
                            : entry.isImmortal
                            ? 'bg-gradient-to-tr from-[#8C2425] to-[#F5C453] text-white shadow-lg shadow-[#F5C453]/30 text-sm'
                            : entry.rank === 1
                            ? 'bg-[#F5C453] text-[#161c12] shadow-sm'
                            : entry.rank === 2
                            ? 'bg-slate-300 text-slate-900'
                            : entry.rank === 3
                            ? 'bg-amber-700 text-white'
                            : 'bg-black/30 text-white/70 border border-white/10'
                        }`}
                      >
                        {isOwnerAccount ? '👑' : isSky ? '🦋' : entry.isImmortal ? '☀️' : entry.rank}
                      </span>

                      <div className="relative">
                        <img
                          src={entry.avatar}
                          alt={entry.username}
                          className={`w-9 h-9 rounded-full object-cover ${
                            isOwnerAccount
                              ? 'border-2 border-amber-400 shadow-[0_0_10px_rgba(245,196,83,0.5)]'
                              : isSky
                              ? 'border-2 border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.5)]'
                              : entry.isImmortal
                              ? 'border-2 border-[#F5C453] shadow-[0_0_10px_rgba(245,196,83,0.5)]'
                              : 'border border-[#F5C453]/30'
                          }`}
                        />
                        {isOwnerAccount ? (
                          <span className="absolute -bottom-1 -right-1 text-[11px]">👑</span>
                        ) : isSky ? (
                          <span className="absolute -bottom-1 -right-1 text-[11px]">🦋</span>
                        ) : entry.isImmortal ? (
                          <span className="absolute -bottom-1 -right-1 text-[11px]">☀️</span>
                        ) : null}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {entry.title && (
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-black rounded ${
                                isOwnerAccount
                                  ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40'
                                  : isSky
                                  ? 'bg-sky-500/30 text-sky-300 border border-sky-400/40'
                                  : entry.isImmortal
                                  ? 'bg-gradient-to-r from-[#8C2425] to-[#52673A] text-[#F5C453] border border-[#F5C453]/50'
                                  : 'bg-[#8C2425] text-white'
                              }`}
                            >
                              {entry.title}
                            </span>
                          )}

                          {/* Role & Badge Number Pill */}
                          {isOwnerAccount ? (
                            <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-amber-500/20 text-amber-300 border border-amber-400/50 font-mono">
                              👑 OWNER #0
                            </span>
                          ) : isAdminAccount ? (
                            <span className="px-1.5 py-0.5 text-[9px] font-black rounded bg-purple-500/20 text-purple-300 border border-purple-400/50 font-mono">
                              🛡️ ADMIN #{entry.badgeNumber ?? 1}
                            </span>
                          ) : entry.badgeNumber !== undefined ? (
                            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-white/10 text-white/70 border border-white/10 font-mono">
                              #{entry.badgeNumber}
                            </span>
                          ) : null}

                          <span className={`font-bold text-sm ${isOwnerAccount ? 'text-amber-300' : isSky ? 'text-sky-200' : entry.isImmortal ? 'text-[#F5C453]' : 'text-white'}`}>
                            {entry.username}
                          </span>
                          <span className="text-xs">{entry.flag}</span>
                        </div>

                        <span className="text-[11px] text-[#DFD0B0]/70 flex items-center gap-2">
                          <span className={leaderboardType === 'elo' ? 'font-black text-sky-400' : ''}>
                            ⚔️ {entry.elo} ELO
                          </span>
                          <span>•</span>
                          <span className="text-red-400">⚔️ {entry.executions} exe</span>
                          <span>•</span>
                          <span className="text-emerald-400">🕊️ {entry.mercies} mercy</span>
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {leaderboardType === 'elo' ? (
                        <div>
                          <span
                            className={`text-base font-black flex items-center justify-end gap-1 ${
                              isOwnerAccount 
                                ? 'text-amber-300 text-lg drop-shadow-[0_0_8px_rgba(245,196,83,0.5)]'
                                : isSky 
                                ? 'text-sky-300 text-lg drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                                : entry.isImmortal 
                                ? 'text-[#F5C453] text-lg drop-shadow-[0_0_8px_rgba(245,196,83,0.5)]' 
                                : 'text-sky-300'
                            }`}
                          >
                            ⚔️ {entry.elo}
                          </span>
                          <span className="text-[10px] text-[#DFD0B0]/60 font-medium">✊ {entry.respectPoints} Respect</span>
                        </div>
                      ) : (
                        <div>
                          <span
                            className={`text-base font-black flex items-center justify-end gap-1 ${
                              isOwnerAccount
                                ? 'text-amber-300 text-lg drop-shadow-[0_0_8px_rgba(245,196,83,0.5)]'
                                : isSky
                                ? 'text-sky-300 text-lg drop-shadow-[0_0_8px_rgba(56,189,248,0.5)]'
                                : entry.isImmortal 
                                ? 'text-[#F5C453] text-lg drop-shadow-[0_0_8px_rgba(245,196,83,0.5)]' 
                                : 'text-[#F5C453]'
                            }`}
                          >
                            ✊ {entry.respectPoints}
                          </span>
                          <span className="text-[10px] text-[#DFD0B0]/60 font-medium">Respect Points</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'ranks' && (
            <div className="space-y-2">
              {HONOR_RANKS.map(rank => {
                const isUnlocked = profile.respectPoints >= rank.minRespect;
                return (
                  <div
                    key={rank.title}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isUnlocked
                        ? 'bg-gradient-to-r from-[#52673A]/25 to-transparent border-[#F5C453]/40 text-white'
                        : 'bg-white/[0.02] border-white/5 opacity-50 text-white/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{rank.badge}</span>
                        <div>
                          <h4 className="font-bold text-sm text-[#FDFCF7] flex items-center gap-2">
                            {rank.title}
                            {isUnlocked && (
                              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full font-black border border-emerald-500/30">
                                Unlocked
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-[#DFD0B0]/70">{rank.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-[#F5C453] block">
                          {rank.minRespect} ✊
                        </span>
                        <span className="text-[10px] text-[#DFD0B0]/50">Required</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'lore' && (
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4 text-xs text-[#DFD0B0]/90 leading-relaxed">
              <div>
                <h4 className="font-bold text-[#F5C453] text-sm mb-1 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-emerald-400" />
                  The Code of Battlefield Mercy
                </h4>
                <p>
                  When you achieve checkmate, you are granted the supreme moral choice: Execute or Grant Mercy.
                  Mercy yields <strong>+12 ELO</strong> and <strong>+20 Respect</strong>, demonstrating the chivalric grace of a true Kurdish Grandmaster.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#F5C453] text-sm mb-1 flex items-center gap-1.5">
                  <Sword className="w-4 h-4 text-red-400" />
                  Tactical Execution
                </h4>
                <p>
                  Claiming the opponent's king yields <strong>+8 ELO</strong> and <strong>+10 Respect</strong>. Decisive, sharp, and uncompromising on the board.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-[#F5C453] text-sm mb-1 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-[#F5C453]" />
                  The 21-Ray Sun & UKH Academic Spirit
                </h4>
                <p>
                  Every rank earned on the Kurdish chessboard represents the eternal flame of the Zagros mountains, with 7 tiers culminating in the legendary Sun Supreme Vanguard and the UKH Chancellor Regalia.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
