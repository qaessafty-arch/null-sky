import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RespectProfile, RespectLeaderboardEntry } from '../types/chess';
import { getLeaderboardEntries, HONOR_RANKS, getHonorRank } from '../utils/respectSystem';
import { Trophy, Sword, HeartHandshake, Shield, Sparkles, X, Award, ChevronRight, Flame, RefreshCw, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useGlassFloat } from '../hooks/useGlassFloat';

interface LeaderboardModalProps {
  profile: RespectProfile;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ profile, onClose }) => {
  const { syncWithCloudLeaderboard } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'ranks' | 'lore'>('leaderboard');
  const [leaderboardType, setLeaderboardType] = useState<'respect' | 'elo'>('respect');
  const [leaderboard, setLeaderboard] = useState<RespectLeaderboardEntry[]>(() => getLeaderboardEntries(profile, 'respect'));
  const [isLoadingCloud, setIsLoadingCloud] = useState(false);
  const rankInfo = getHonorRank(profile.respectPoints);
  const floatVariants = useGlassFloat(1.15);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={["visible", "float"]}
        variants={{
          visible: { scale: 1, opacity: 1, y: 0 },
          ...floatVariants
        }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="relative obsidian-panel rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-[#1F293D] max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#F59E0B]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-[var(--glass-border)] relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[var(--app-bg)] border border-[var(--secondary-accent)] flex items-center justify-center text-2xl shadow-2xl">
              <Trophy className="w-7 h-7 text-[var(--secondary-accent)]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[var(--text-main)] tracking-tight uppercase">
                {t('leaderboard.worldwideLeaderboard')}
              </h2>
              <p className="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mt-1 opacity-70">
                Global Honor Rankings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchCloudData(leaderboardType)}
              disabled={isLoadingCloud}
              className="w-10 h-10 rounded-xl bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] text-[var(--secondary-accent)] transition-all border border-[var(--glass-border)] active:scale-95 flex items-center justify-center disabled:opacity-50 cursor-pointer"
              title="Refresh Leaderboard"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingCloud ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)] text-[var(--text-muted)] transition-all border border-[var(--glass-border)] active:scale-95 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Player Honor Summary Card */}
        <div className="my-6 p-5 rounded-2xl bg-[var(--app-bg)] border border-[var(--glass-border)] shadow-inner relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--secondary-accent)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[var(--glass-bg)] border border-[var(--secondary-accent)]/30 flex items-center justify-center text-3xl shadow-xl">
                {profile.rankBadge || '♟️'}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--secondary-accent)] font-black">Your Standing</span>
                  <span className="w-1.5 h-1.5 bg-[#10B981] rounded-full animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-[var(--text-main)] uppercase tracking-tight">{profile.honorRank}</h3>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center px-4 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                <span className="text-[9px] text-[var(--text-muted)] uppercase block font-black mb-1">Respect</span>
                <span className="text-lg font-black text-[var(--secondary-accent)] flex items-center justify-center gap-1">
                  ✊ {profile.respectPoints}
                </span>
              </div>

              <div className="text-center px-4 py-2 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                <span className="text-[9px] text-[var(--text-muted)] uppercase block font-black mb-1">Rating</span>
                <span className="text-lg font-black text-[var(--text-main)]">
                  ⚔️ {profile.elo}
                </span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {rankInfo.nextRank && (
            <div className="mt-5 pt-5 border-t border-[var(--glass-border)]">
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                <span className="text-[var(--text-muted)]">Next Ascension: <strong className="text-[var(--text-main)]">{rankInfo.nextRank.title}</strong></span>
                <span className="text-[var(--secondary-accent)]">{isNaN(rankInfo.nextRank.pointsNeeded) ? 0 : rankInfo.nextRank.pointsNeeded} ✊ Remaining</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--app-bg)] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, Math.max(10, ((Number(profile.respectPoints || 0) % 100) / 100) * 100)) || 10}%` }}
                  className="h-full bg-[var(--secondary-accent)] rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between gap-2 mb-6 border-b border-[var(--glass-border)] pb-2">
          <div className="flex items-center gap-1">
            {['leaderboard', 'ranks', 'lore'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  activeTab === tab
                    ? 'bg-[var(--secondary-accent)] text-[var(--app-bg)] shadow-lg shadow-[var(--secondary-accent)]/20'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--glass-bg)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'leaderboard' && (
            <div className="flex items-center p-1 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
              <button
                onClick={() => setLeaderboardType('respect')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${
                  leaderboardType === 'respect'
                    ? 'bg-[var(--secondary-accent)] text-[var(--app-bg)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Respect
              </button>
              <button
                onClick={() => setLeaderboardType('elo')}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-tighter transition-all ${
                  leaderboardType === 'elo'
                    ? 'bg-[var(--secondary-accent)] text-[var(--app-bg)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
                }`}
              >
                Rating
              </button>
            </div>
          )}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'leaderboard' && (
              <motion.div
                key="leaderboard"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-3"
              >
                {leaderboard.map((entry, idx) => {
                  const isTop3 = Number(entry.rank) <= 3;
                  return (
                    <div
                      key={entry.id}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                        entry.isCurrentUser
                          ? 'bg-[var(--glass-bg)] border-[var(--secondary-accent)] shadow-xl'
                          : 'bg-[var(--app-bg)] border-[var(--glass-border)] hover:border-[var(--text-muted)]/30'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs ${
                          entry.rank === 1 ? 'bg-[var(--secondary-accent)] text-[var(--app-bg)]' :
                          entry.rank === 2 ? 'bg-slate-300 text-[var(--app-bg)]' :
                          entry.rank === 3 ? 'bg-amber-700 text-white' :
                          'bg-[var(--glass-bg)] text-[var(--text-muted)] border border-[var(--glass-border)]'
                        }`}>
                          {entry.rank}
                        </div>
                        <div className="relative">
                          <img
                            src={entry.avatar}
                            alt={entry.username}
                            className={`w-10 h-10 rounded-xl object-cover border ${
                              isTop3 ? 'border-[var(--secondary-accent)]' : 'border-[var(--glass-border)]'
                            }`}
                          />
                          {entry.isCurrentUser && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#10B981] border-2 border-[var(--app-bg)] rounded-full" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[13px] font-black text-[var(--text-main)] uppercase tracking-tight">{entry.username}</span>
                            <span className="text-xs">{entry.flag}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[9px] font-black uppercase text-[var(--text-muted)] tracking-widest">
                            <span className="text-[var(--secondary-accent)]">{entry.title}</span>
                            <span>•</span>
                            <span>{entry.elo} ELO</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-[var(--text-main)]">
                          {leaderboardType === 'elo' ? `⚔️ ${entry.elo}` : `✊ ${entry.respectPoints}`}
                        </div>
                        <div className="text-[9px] font-black uppercase text-[var(--text-muted)] tracking-tighter opacity-60">
                          Total {leaderboardType}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === 'ranks' && (
              <motion.div
                key="ranks"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-3"
              >
                {HONOR_RANKS.map(rank => {
                  const isUnlocked = Number(profile.respectPoints) >= rank.minRespect;
                  return (
                    <div
                      key={rank.title}
                      className={`p-4 rounded-2xl border transition-all ${
                        isUnlocked
                          ? 'bg-[var(--glass-bg)] border-[var(--secondary-accent)]/50 text-[var(--text-main)]'
                          : 'bg-[var(--app-bg)] border-[var(--glass-border)] opacity-40 grayscale text-[var(--text-muted)]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-3xl">{rank.badge}</div>
                          <div>
                            <h4 className="font-black text-[13px] uppercase tracking-widest mb-1">
                              {rank.title}
                            </h4>
                            <p className="text-[10px] font-black uppercase opacity-60 tracking-tighter">
                              {rank.description}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-[var(--secondary-accent)] block">
                            {rank.minRespect} ✊
                          </span>
                          <span className="text-[9px] font-black uppercase tracking-tighter text-[var(--text-muted)]">
                            Requirement
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {activeTab === 'lore' && (
              <motion.div
                key="lore"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="space-y-4"
              >
                <div className="p-5 rounded-2xl bg-[#0B0F19] border border-[#1F293D] space-y-6">
                  <section>
                    <div className="flex items-center gap-3 mb-3 text-[#10B981]">
                      <HeartHandshake className="w-5 h-5" />
                      <h4 className="text-[13px] font-black uppercase tracking-widest">Code of Mercy</h4>
                    </div>
                    <p className="text-[11px] font-black text-[#94A3B8] uppercase leading-relaxed tracking-widest opacity-80">
                      Achieving checkmate grants a choice. Mercy yields <span className="text-[#10B981]">+12 ELO</span> and <span className="text-[#F59E0B]">+20 Respect</span>. Grace defines a true Grandmaster.
                    </p>
                  </section>
                  
                  <section>
                    <div className="flex items-center gap-3 mb-3 text-[#EF4444]">
                      <Sword className="w-5 h-5" />
                      <h4 className="text-[13px] font-black uppercase tracking-widest">Tactical Strike</h4>
                    </div>
                    <p className="text-[11px] font-black text-[#94A3B8] uppercase leading-relaxed tracking-widest opacity-80">
                      Execution yields <span className="text-[#EF4444]">+8 ELO</span> and <span className="text-[#F59E0B]">+10 Respect</span>. Decisive and uncompromising presence on the board.
                    </p>
                  </section>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
