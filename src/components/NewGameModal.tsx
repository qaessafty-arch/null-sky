import React, { useState } from 'react';
import { BotProfile, TimeControl, PieceColor, GameMode } from '../types/chess';
import { BOT_PROFILES, TIME_CONTROLS } from '../utils/chessEngine';
import { Bot, Users, Play, Clock, Sparkles, X, Globe, Zap } from 'lucide-react';

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
  initialMode?: GameMode;
}

export const NewGameModal: React.FC<NewGameModalProps> = ({
  isOpen,
  onClose,
  onStartGame,
  onOpenWorldwideMatch,
  initialMode = 'ai'
}) => {
  const [selectedMode, setSelectedMode] = useState<GameMode>(initialMode === 'online_match' ? 'ai' : initialMode);
  const [selectedBot, setSelectedBot] = useState<BotProfile>(BOT_PROFILES[2]); // Default Bishop 1400
  const [selectedColor, setSelectedColor] = useState<PieceColor | 'random'>('w');
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>(TIME_CONTROLS[5]); // Default Rapid 10 min

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200 p-4">
      <div className="relative glass-panel rounded-3xl p-5 sm:p-7 max-w-lg w-full border border-[#F5C453]/40 shadow-2xl overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#DFD0B0]/60 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl sm:text-2xl font-bold text-[#FDFCF7] font-heading mb-1 tracking-tight flex items-center gap-2">
          <span>Start New Match</span>
        </h2>
        <p className="text-xs text-[#DFD0B0]/70 mb-5">
          Choose match type, AI difficulty, time format, and side preference
        </p>

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
                  ? 'bg-gradient-to-r from-[#52673A]/60 to-[#8C2425]/60 border-[#F5C453] text-white shadow-lg shadow-[#F5C453]/15 ring-1 ring-[#F5C453]/50'
                  : 'bg-[#1a2315]/60 border-[#F5C453]/20 text-[#DFD0B0]/70 hover:bg-[#1a2315] hover:text-white'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-[#8C2425]/40 text-[#F5C453] flex items-center justify-center border border-[#F5C453]/40">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold font-ui text-white">Pass & Play</div>
                <div className="text-[11px] text-[#DFD0B0]/60">Local 2-Player table</div>
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
                        ? 'bg-gradient-to-r from-[#52673A]/50 to-[#8C2425]/50 border-[#F5C453] text-white shadow-md'
                        : 'bg-[#1a2315]/50 border-[#F5C453]/20 text-[#DFD0B0]/70 hover:bg-[#1a2315] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{bot.avatar}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-ui text-white">
                            {bot.name}
                          </span>
                          <span className={`text-[10px] font-mono font-bold px-2 py-0.2 rounded-full border ${bot.badgeColor}`}>
                            {bot.elo} Elo
                          </span>
                        </div>
                        <p className="text-[11px] text-[#DFD0B0]/60 line-clamp-1">
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
                  ? 'bg-white text-slate-950 border-[#F5C453] shadow-lg'
                  : 'bg-[#1a2315]/60 text-[#DFD0B0]/70 border-[#F5C453]/20 hover:bg-[#1a2315] hover:text-white'
              }`}
            >
              <span className="text-base">⚪</span>
              <span>White</span>
            </button>

            <button
              onClick={() => setSelectedColor('random')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border font-bold text-xs transition-all backdrop-blur-md cursor-pointer ${
                selectedColor === 'random'
                  ? 'bg-gradient-to-r from-[#52673A] to-[#8C2425] text-white border-[#F5C453] shadow-lg'
                  : 'bg-[#1a2315]/60 text-[#DFD0B0]/70 border-[#F5C453]/20 hover:bg-[#1a2315] hover:text-white'
              }`}
            >
              <span className="text-base">🎲</span>
              <span>Random</span>
            </button>

            <button
              onClick={() => setSelectedColor('b')}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border font-bold text-xs transition-all backdrop-blur-md cursor-pointer ${
                selectedColor === 'b'
                  ? 'bg-[#161c12] text-white border-[#F5C453] shadow-lg'
                  : 'bg-[#1a2315]/60 text-[#DFD0B0]/70 border-[#F5C453]/20 hover:bg-[#1a2315] hover:text-white'
              }`}
            >
              <span className="text-base">⚫</span>
              <span>Black</span>
            </button>
          </div>
        </div>

        {/* Time Controls */}
        <div className="mb-6">
          <label className="text-xs font-bold text-[#DFD0B0]/80 uppercase tracking-wider block mb-2 font-ui flex items-center justify-between">
            <span>Time Control</span>
            <Clock className="w-3.5 h-3.5 text-[#DFD0B0]/50" />
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TIME_CONTROLS.map(tc => {
              const isSelected = selectedTimeControl.id === tc.id;
              return (
                <button
                  key={tc.id}
                  onClick={() => setSelectedTimeControl(tc)}
                  className={`py-2 px-2 rounded-xl text-xs font-mono font-bold border transition-all text-center backdrop-blur-md cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#52673A] to-[#8C2425] text-white border-[#F5C453] shadow-md'
                      : 'bg-[#1a2315]/60 text-[#DFD0B0]/70 border-[#F5C453]/20 hover:bg-[#1a2315] hover:text-white'
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
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-[#52673A] via-[#8C2425] to-[#F5C453] text-white font-black text-sm hover:brightness-110 transition-all shadow-xl shadow-[#F5C453]/20 hover:scale-[1.01] active:scale-[0.99] border border-[#F5C453]/50 cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white text-white" />
          <span>Launch Match</span>
        </button>
      </div>
    </div>
  );
};
