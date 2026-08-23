import React, { useState, useEffect, useRef } from 'react';
import { TimeControl, OnlineMatchPlayer } from '../types/chess';
import { TIME_CONTROLS } from '../utils/chessEngine';
import { joinWorldwideMatchmaking, MatchmakingMode } from '../services/onlineMatchService';
import { useAuth } from '../context/AuthContext';
import { 
  Globe, 
  Zap, 
  Clock, 
  Swords, 
  Shield, 
  X, 
  Users, 
  Sparkles, 
  Radio, 
  Bot,
  CheckCircle2,
  Trophy,
  UserCheck,
  Flame
} from 'lucide-react';

interface WorldwideMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMatchFound: (matchId: string) => void;
}

export const WorldwideMatchModal: React.FC<WorldwideMatchModalProps> = ({
  isOpen,
  onClose,
  onMatchFound
}) => {
  const { user, profile } = useAuth();
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>(TIME_CONTROLS[5]); // Default Rapid 10 min
  const [matchmakingMode, setMatchmakingMode] = useState<MatchmakingMode>('human_first');
  const [isSearching, setIsSearching] = useState(false);
  const [searchSeconds, setSearchSeconds] = useState(0);
  const [searchStatus, setSearchStatus] = useState('Initializing search...');
  const [matchedOpponent, setMatchedOpponent] = useState<{ player: OnlineMatchPlayer; isBot: boolean } | null>(null);

  const cancelRef = useRef<(() => void) | null>(null);
  const pairWithBotRef = useRef<(() => void) | null>(null);

  // Quick match formats presets
  const MATCHMAKING_PRESETS = [
    {
      id: 'bullet_1_0',
      title: '1 min Bullet',
      desc: 'Hyper-speed instinct clash',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      timeControl: TIME_CONTROLS[0], // 1 min
      badge: '⚡ Fast'
    },
    {
      id: 'blitz_3_0',
      title: '3 min Blitz',
      desc: 'High-adrenaline tactical war',
      icon: <Swords className="w-5 h-5 text-red-400" />,
      timeControl: TIME_CONTROLS[2], // 3 min
      badge: '🔥 Hot'
    },
    {
      id: 'blitz_5_0',
      title: '5 min Blitz',
      desc: 'Balanced tactical battle',
      icon: <Swords className="w-5 h-5 text-orange-400" />,
      timeControl: TIME_CONTROLS[4], // 5 min
      badge: '⚔️ Popular'
    },
    {
      id: 'rapid_10_0',
      title: '10 min Rapid',
      desc: 'Strategic mastery & depth',
      icon: <Shield className="w-5 h-5 text-emerald-400" />,
      timeControl: TIME_CONTROLS[5], // 10 min
      badge: '👑 Ranked'
    },
    {
      id: 'rapid_15_10',
      title: '15 min + 10s',
      desc: 'Classical Peshmerga duel',
      icon: <Clock className="w-5 h-5 text-sky-400" />,
      timeControl: TIME_CONTROLS[7], // 15|10
      badge: '🛡️ Grandmaster'
    }
  ];

  // Timer while searching
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchSeconds(s => s + 1);
      }, 1000);
    } else {
      setSearchSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  // Clean up on unmount or close
  useEffect(() => {
    return () => {
      if (cancelRef.current) {
        cancelRef.current();
        cancelRef.current = null;
      }
    };
  }, []);

  if (!isOpen) return null;

  const handleStartSearch = async (presetTimeControl?: TimeControl) => {
    const tc = presetTimeControl || selectedTimeControl;
    setSelectedTimeControl(tc);
    setIsSearching(true);
    setSearchStatus(
      matchmakingMode === 'instant_bot'
        ? 'Connecting to Worldwide Grandmaster AI...'
        : 'Searching worldwide queue for live human opponents...'
    );
    setMatchedOpponent(null);

    const myPlayer: OnlineMatchPlayer = {
      uid: profile?.uid || user?.uid || `guest_${Math.random().toString(36).substring(2, 8)}`,
      displayName: profile?.displayName || user?.displayName || 'Peshmerga Warrior',
      country: profile?.country || 'Kurdistan',
      flag: profile?.flag || '☀️',
      elo: profile?.elo || 1200,
      honorRank: profile?.honorRank || 'Peshmerga Tactician',
      rankBadge: profile?.rankBadge || '🌿',
      avatar: profile?.photoURL || user?.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60'
    };

    const { cancel, pairWithBotNow } = await joinWorldwideMatchmaking(
      myPlayer,
      tc,
      (matchId, opponent, isBot) => {
        setMatchedOpponent({ player: opponent, isBot });
        setSearchStatus(
          isBot
            ? `Paired with Worldwide Challenger ${opponent.displayName} (AI)!`
            : `Live Human Opponent Found: ${opponent.displayName}!`
        );
        setTimeout(() => {
          setIsSearching(false);
          onMatchFound(matchId);
          onClose();
        }, 1200);
      },
      statusText => {
        setSearchStatus(statusText);
      },
      matchmakingMode,
      20 // 20s search before bot fallback if in human_first mode
    );

    cancelRef.current = cancel;
    pairWithBotRef.current = pairWithBotNow;
  };

  const handleCancelSearch = () => {
    if (cancelRef.current) {
      cancelRef.current();
      cancelRef.current = null;
    }
    setIsSearching(false);
    setMatchedOpponent(null);
  };

  const handleForcePlayBot = () => {
    if (pairWithBotRef.current) {
      pairWithBotRef.current();
    }
  };

  const formatSearchTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 p-4">
      <div className="relative glass-panel rounded-3xl p-5 sm:p-7 max-w-xl w-full border border-[#F5C453]/40 shadow-2xl overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => {
            if (isSearching) handleCancelSearch();
            onClose();
          }}
          className="absolute top-4 right-4 text-[#DFD0B0]/60 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Title */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#52673A] via-[#8C2425] to-[#F5C453] p-0.5 shadow-lg shadow-[#F5C453]/20 flex items-center justify-center">
            <div className="w-full h-full bg-[#161c12] rounded-[14px] flex items-center justify-center text-emerald-400">
              <Globe className="w-5 h-5 text-[#F5C453] animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-heading font-black text-[#FDFCF7] tracking-tight">
                Worldwide Matchmaking
              </h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">
                ● Live Grid
              </span>
            </div>
            <p className="text-xs text-[#DFD0B0]/70">
              Battle real human players globally across Kurdistan, Europe, the Americas, and Asia
            </p>
          </div>
        </div>

        {/* SEARCHING RADAR SCREEN */}
        {isSearching ? (
          <div className="my-6 p-6 rounded-3xl bg-[#161c12]/90 border border-[#F5C453]/40 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-inner">
            {/* Animated Radar Pulse Rings */}
            <div className="relative w-32 h-32 my-3 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-[#F5C453]/20 animate-ping opacity-75" />
              <div className="absolute inset-3 rounded-full border-2 border-emerald-500/30 animate-pulse" />
              <div className="absolute inset-7 rounded-full bg-gradient-to-tr from-[#52673A]/40 to-[#8C2425]/40 border border-[#F5C453]/40 flex items-center justify-center">
                <Globe className="w-9 h-9 text-[#F5C453] animate-spin [animation-duration:8s]" />
              </div>
              <div className="absolute -top-1 right-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-bounce" />
              </div>
            </div>

            {/* Matched Opponent Preview or Searching status */}
            {matchedOpponent ? (
              <div className="animate-in zoom-in-95 duration-300 flex flex-col items-center gap-2 my-2">
                <div className="flex items-center gap-3 bg-emerald-950/60 border border-emerald-400/50 px-4 py-2 rounded-2xl shadow-lg">
                  <img
                    src={matchedOpponent.player.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60'}
                    alt={matchedOpponent.player.displayName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-emerald-400"
                  />
                  <div className="text-left">
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{matchedOpponent.player.displayName}</span>
                      <span>{matchedOpponent.player.flag}</span>
                      {matchedOpponent.isBot ? (
                        <span className="text-[10px] bg-amber-500/30 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/40">
                          AI BOT
                        </span>
                      ) : (
                        <span className="text-[10px] bg-emerald-500/30 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-500/40">
                          REAL HUMAN
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-emerald-300/80 font-mono">
                      {matchedOpponent.player.elo} Elo • {matchedOpponent.player.honorRank}
                    </div>
                  </div>
                </div>
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 mt-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Entering Arena...</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 my-2">
                <div className="text-base font-bold text-[#FDFCF7] tracking-wide max-w-sm">
                  {searchStatus}
                </div>
                <div className="flex items-center gap-3 text-xs text-[#DFD0B0]/80 font-mono bg-black/40 px-3.5 py-1.5 rounded-full border border-white/10">
                  <span className="flex items-center gap-1 text-[#F5C453]">
                    <Clock className="w-3.5 h-3.5" />
                    {formatSearchTime(searchSeconds)}
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">
                    {selectedTimeControl.name}
                  </span>
                  <span>•</span>
                  <span className="text-sky-300">
                    {matchmakingMode === 'human_strict' ? 'Human Only' : matchmakingMode === 'instant_bot' ? 'Bot Duel' : 'Human Priority'}
                  </span>
                </div>

                {/* Real-time human search info */}
                {matchmakingMode === 'human_first' && searchSeconds < 20 && (
                  <p className="text-[11px] text-[#DFD0B0]/60 max-w-xs mt-1">
                    Searching for online human players... If no human joins within {20 - searchSeconds}s, will pair with a Grandmaster Bot.
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons while searching */}
            <div className="mt-4 w-full flex items-center justify-center gap-3">
              <button
                onClick={handleCancelSearch}
                className="px-5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-red-200 text-xs font-black transition-all hover:scale-105 cursor-pointer shadow-md"
              >
                Cancel Search
              </button>

              {matchmakingMode !== 'instant_bot' && !matchedOpponent && (
                <button
                  onClick={handleForcePlayBot}
                  className="px-5 py-2 rounded-xl bg-[#52673A]/60 hover:bg-[#52673A] border border-[#F5C453]/40 text-[#F5C453] text-xs font-bold transition-all hover:scale-105 cursor-pointer shadow-md flex items-center gap-1.5"
                  title="Skip waiting and play a Grandmaster Bot immediately"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>Play Bot Now</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* MATCHMAKING PREFERENCE & FORMAT SELECTION */
          <div className="space-y-4 my-3">
            {/* Matchmaking Mode Switcher */}
            <div>
              <label className="text-xs font-bold text-[#DFD0B0]/80 uppercase tracking-wider block font-ui mb-1.5">
                1. Opponent Match Preference
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setMatchmakingMode('human_first')}
                  className={`p-2.5 rounded-2xl border transition-all text-center cursor-pointer ${
                    matchmakingMode === 'human_first'
                      ? 'bg-[#52673A]/60 border-[#F5C453] text-white shadow-md shadow-[#F5C453]/20 ring-1 ring-[#F5C453]/60'
                      : 'bg-[#1a2315]/50 border-white/10 text-[#DFD0B0]/70 hover:bg-[#1a2315]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 text-xs font-black mb-0.5">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Real Human First</span>
                  </div>
                  <div className="text-[10px] text-[#DFD0B0]/60 leading-tight">
                    Human queue (bot fallback after 20s)
                  </div>
                </button>

                <button
                  onClick={() => setMatchmakingMode('human_strict')}
                  className={`p-2.5 rounded-2xl border transition-all text-center cursor-pointer ${
                    matchmakingMode === 'human_strict'
                      ? 'bg-[#52673A]/60 border-[#F5C453] text-white shadow-md shadow-[#F5C453]/20 ring-1 ring-[#F5C453]/60'
                      : 'bg-[#1a2315]/50 border-white/10 text-[#DFD0B0]/70 hover:bg-[#1a2315]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 text-xs font-black mb-0.5">
                    <Users className="w-3.5 h-3.5 text-sky-400" />
                    <span>Humans Only</span>
                  </div>
                  <div className="text-[10px] text-[#DFD0B0]/60 leading-tight">
                    Strict real human matchmaking
                  </div>
                </button>

                <button
                  onClick={() => setMatchmakingMode('instant_bot')}
                  className={`p-2.5 rounded-2xl border transition-all text-center cursor-pointer ${
                    matchmakingMode === 'instant_bot'
                      ? 'bg-[#52673A]/60 border-[#F5C453] text-white shadow-md shadow-[#F5C453]/20 ring-1 ring-[#F5C453]/60'
                      : 'bg-[#1a2315]/50 border-white/10 text-[#DFD0B0]/70 hover:bg-[#1a2315]'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 text-xs font-black mb-0.5">
                    <Bot className="w-3.5 h-3.5 text-amber-400" />
                    <span>Grandmaster AI</span>
                  </div>
                  <div className="text-[10px] text-[#DFD0B0]/60 leading-tight">
                    Instant battle with worldwide bot
                  </div>
                </button>
              </div>
            </div>

            {/* Time Control Format */}
            <div>
              <label className="text-xs font-bold text-[#DFD0B0]/80 uppercase tracking-wider block font-ui mb-1.5">
                2. Choose Time Control Format
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {MATCHMAKING_PRESETS.map(preset => {
                  const isSelected = selectedTimeControl.id === preset.timeControl.id;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => setSelectedTimeControl(preset.timeControl)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left backdrop-blur-md cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#52673A]/60 to-[#8C2425]/60 border-[#F5C453] text-white shadow-lg shadow-[#F5C453]/20 ring-1 ring-[#F5C453]/50'
                          : 'bg-[#1a2315]/60 border-[#F5C453]/20 text-[#DFD0B0]/80 hover:bg-[#1a2315] hover:border-[#F5C453]/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-black/40 flex items-center justify-center border border-white/10">
                          {preset.icon}
                        </div>
                        <div>
                          <div className="text-xs font-black text-[#FDFCF7]">
                            {preset.title}
                          </div>
                          <div className="text-[10px] text-[#DFD0B0]/60">
                            {preset.desc}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-black/50 text-[#F5C453] border border-[#F5C453]/30 whitespace-nowrap">
                        {preset.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Global Quick Match Launch Button */}
            <div className="pt-2">
              <button
                onClick={() => handleStartSearch()}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#52673A] via-[#8C2425] to-[#F5C453] hover:brightness-110 text-white font-black font-ui text-sm transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-[#F5C453]/20 border border-[#F5C453]/50 flex items-center justify-center gap-2.5 cursor-pointer"
              >
                <Globe className="w-5 h-5 text-[#F5C453] animate-pulse" />
                <span>
                  {matchmakingMode === 'instant_bot'
                    ? `Play Grandmaster Bot (${selectedTimeControl.name})`
                    : `Find Real Human Match (${selectedTimeControl.name})`}
                </span>
              </button>
            </div>

            {/* Footer Stats & Info */}
            <div className="flex items-center justify-between text-[11px] text-[#DFD0B0]/60 px-1 pt-1">
              <span className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Worldwide matchmaking live queue active</span>
              </span>
              <span className="flex items-center gap-1 text-[#F5C453]">
                <Trophy className="w-3.5 h-3.5" />
                <span>+30 Respect on Victory</span>
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

