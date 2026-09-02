import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BotProfile, TimeControl, PieceColor, GameMode } from '../types/chess';
import { BOT_PROFILES, TIME_CONTROLS } from '../utils/chessEngine';
import { Bot, Users, Play, Clock, Sparkles, X, Globe, Zap, Sun, Flame } from 'lucide-react';
import { getTodayDateKey, getDailyPuzzleForDate, loadDailyProgress } from '../utils/dailyPuzzles';
import { useGlassFloat } from '../hooks/useGlassFloat';

interface NewGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartGame: (config: {
    mode: GameMode;
    bot: BotProfile;
    playerColor: PieceColor | 'random';
    timeControl: TimeControl;
  }) => void;
  onOpenWorldwideMatch?: () => void;
  onOpenDailyPuzzle?: () => void;
  initialMode?: GameMode;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
  onOpenWorldwideMatch,
  onOpenDailyPuzzle,
  initialMode = 'ai'
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(initialMode === 'online_match' ? 'ai' : initialMode);
  const [selectedBot, setSelectedBot] = useState<BotProfile>(BOT_PROFILES[2]); // Default Bishop 1400
  const [selectedColor, setSelectedColor] = useState<PieceColor | 'random'>('w');
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>(TIME_CONTROLS[5]); // Default Rapid 10 min

  const todayKey = getTodayDateKey();
  const todayPuzzle = getDailyPuzzleForDate(todayKey);
  const dailyProgress = loadDailyProgress(todayKey);
  const floatVariants = useGlassFloat(1.2);

  if (!isOpen) return null;

  const handleStart = () => {
    onStartGame({
      mode: selectedMode,
      bot: selectedBot,
      playerColor: selectedColor,
      timeControl: selectedTimeControl
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={["visible", "float"]}
            variants={{
              visible: { opacity: 1, scale: 1, y: 0 },
              ...floatVariants
            }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26, mass: 0.8 }}
            className="relative glass-panel rounded-3xl p-5 sm:p-7 max-w-lg w-full shadow-[0_40px_80px_-20px_rgba(0,0,0,0.9)] overflow-y-auto max-h-[90vh] no-scrollbar"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-[#94A3B8] hover:text-white p-2 glass-button w-10 h-10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-xl sm:text-2xl font-black text-white mb-1 tracking-tight flex items-center gap-2">
              <span>Start New Match</span>
            </h2>
            <p className="text-xs text-[#94A3B8] mb-5 uppercase tracking-widest font-black opacity-60">
              Battle Configuration Suite
            </p>

            {/* Daily Tactical Challenge Banner */}
            {onOpenDailyPuzzle && (
              <div className="mb-6 p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 shadow-inner group cursor-pointer hover:bg-white/[0.06] transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F59E0B]/10 text-[#F59E0B] flex items-center justify-center border border-[#F59E0B]/30 group-hover:shadow-[0_0_15px_rgba(245,158,11,0.2)] transition-all">
                    <Sun className="w-5 h-5 animate-spin-slow" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-tighter">
                      <span>Daily Challenge</span>
                      <span className="glass-pill">24h</span>
                    </div>
                    <div className="text-[11px] text-[#94A3B8] truncate max-w-[180px] sm:max-w-none mt-1 font-mono">
                      {todayPuzzle.title}
                    </div>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    onOpenDailyPuzzle();
                  }}
                  className="py-2 px-4 rounded-xl bg-[#F59E0B] hover:brightness-110 text-black font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 shadow-xl flex items-center gap-2 cursor-pointer"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>{dailyProgress.solved ? 'Replay' : 'Execute'}</span>
                </button>
              </div>
            )}

        {/* Worldwide Quick Match Banner */}
        {onOpenWorldwideMatch && (
          <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-[#1a2315] to-[#8C2425]/40 border border-emerald-500/40 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/40">
                <Globe className="w-5 h-5 text-[#F5C453] animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>Worldwide Quick Match</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500/30 text-emerald-300 rounded-md">Live</span>
                </div>
                <div className="text-[11px] text-[#DFD0B0]/70">Pair instantly with players across the globe</div>
              </div>
            </div>
            <button
              onClick={() => {
                onClose();
                onOpenWorldwideMatch();
              }}
              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all hover:scale-105 shadow-md flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Zap className="w-3.5 h-3.5 text-[#F5C453]" />
              <span>Queue Now</span>
            </button>
          </div>
        )}

        {/* Mode Selector */}
        <div className="mb-5">
          <label className="text-xs font-bold text-[#DFD0B0]/80 uppercase tracking-wider block mb-2 font-ui">
            Game Mode
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setSelectedMode('ai')}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left backdrop-blur-md cursor-pointer ${
                selectedMode === 'ai'
                  ? 'bg-gradient-to-r from-[#52673A]/60 to-[#8C2425]/60 border-[#F5C453] text-white shadow-lg shadow-[#F5C453]/15 ring-1 ring-[#F5C453]/50'
                  : 'bg-[#1a2315]/60 border-[#F5C453]/20 text-[#DFD0B0]/70 hover:bg-[#1a2315] hover:text-white'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#52673A]/40 text-[#F5C453] flex items-center justify-center border border-[#F5C453]/40">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold font-ui text-white">Play vs AI</div>
                <div className="text-[11px] text-[#DFD0B0]/60">Bots from 400 to 2300+ Elo</div>
              </div>
            </button>

            <button
              onClick={() => setSelectedMode('pass_and_play')}
              className={`flex items-center gap-3 p-3 rounded-2xl border transition-all text-left backdrop-blur-md cursor-pointer ${
                selectedMode === 'pass_and_play'
                  ? 'bg-[#111827] border-[#F59E0B] text-white shadow-lg shadow-[#F59E0B]/10 ring-1 ring-[#F59E0B]/50'
                  : 'bg-[#0B0F19] border-[#1F293D] text-[#94A3B8] hover:bg-[#111827] hover:text-white'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#0B0F19] text-[#F59E0B] flex items-center justify-center border border-[#1F293D]">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Pass & Play</div>
                <div className="text-[11px] text-[#94A3B8]">Local 2-Player table</div>
              </div>
            </button>
          </div>
        </div>

        {/* AI Bot Selection (If AI Mode) */}
        {selectedMode === 'ai' && (
          <div className="mb-5">
            <label className="text-xs font-bold text-[#DFD0B0]/80 uppercase tracking-wider block mb-2 font-ui">
              Select AI Opponent
            </label>
            <div className="space-y-2">
              {BOT_PROFILES.map(bot => {
                const isSelected = selectedBot.id === bot.id;
                return (
                  <button
                    key={bot.id}
                    onClick={() => setSelectedBot(bot)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left backdrop-blur-md cursor-pointer ${
                      isSelected
                        ? 'bg-[#111827] border-[#F59E0B] text-white shadow-md'
                        : 'bg-[#0B0F19] border-[#1F293D] text-[#94A3B8] hover:bg-[#111827] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{bot.avatar}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {bot.name}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded-full border ${bot.badgeColor}`}>
                            {bot.elo} Elo
                          </span>
                        </div>
                        <p className="text-[11px] text-[#94A3B8] line-clamp-1">
                          {bot.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Side Preference */}
        <div className="mb-5">
          <label className="text-xs font-bold text-[#DFD0B0]/80 uppercase tracking-wider block mb-2 font-ui">
            Play As
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setSelectedColor('w')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border font-bold text-xs transition-all backdrop-blur-md cursor-pointer ${
                selectedColor === 'w'
                  ? 'bg-white text-[#0B0F19] border-white shadow-lg'
                  : 'bg-[#0B0F19] text-[#94A3B8] border-[#1F293D] hover:bg-[#111827] hover:text-white'
              }`}
            >
              <span className="text-base">⚪</span>
              <span>White</span>
            </button>

            <button
              onClick={() => setSelectedColor('random')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border font-bold text-xs transition-all backdrop-blur-md cursor-pointer ${
                selectedColor === 'random'
                  ? 'bg-[#111827] text-[#F59E0B] border-[#F59E0B] shadow-lg'
                  : 'bg-[#0B0F19] text-[#94A3B8] border-[#1F293D] hover:bg-[#111827] hover:text-white'
              }`}
            >
              <span className="text-base">🎲</span>
              <span>Random</span>
            </button>

            <button
              onClick={() => setSelectedColor('b')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border font-bold text-xs transition-all backdrop-blur-md cursor-pointer ${
                selectedColor === 'b'
                  ? 'bg-[#111827] text-white border-white/50 shadow-lg'
                  : 'bg-[#0B0F19] text-[#94A3B8] border-[#1F293D] hover:bg-[#111827] hover:text-white'
              }`}
            >
              <span className="text-base">⚫</span>
              <span>Black</span>
            </button>
          </div>
        </div>

        {/* Time Controls */}
        <div className="mb-6">
          <label className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider block mb-2 flex items-center justify-between">
            <span>Time Control</span>
            <Clock className="w-3.5 h-3.5 text-[#94A3B8]/50" />
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TIME_CONTROLS.map(tc => {
              const isSelected = selectedTimeControl.id === tc.id;
              return (
                <button
                  key={tc.id}
                  onClick={() => setSelectedTimeControl(tc)}
                  className={`py-2 px-2 rounded-xl text-[11px] font-mono font-bold border transition-all text-center backdrop-blur-md cursor-pointer ${
                    isSelected
                      ? 'bg-[#F59E0B] text-black border-[#F59E0B] shadow-md'
                      : 'bg-[#0B0F19] text-[#94A3B8] border-[#1F293D] hover:bg-[#111827] hover:text-white'
                  }`}
                >
                  {tc.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Start Button */}
        <button
          id="btn-confirm-start-game"
          onClick={handleStart}
          className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-[#F59E0B] text-black font-black text-sm hover:brightness-110 transition-all shadow-xl shadow-[#F59E0B]/20 active:scale-95 cursor-pointer uppercase tracking-widest"
        >
          <Play className="w-4 h-4 fill-black" />
          <span>Launch Match</span>
        </button>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
};
