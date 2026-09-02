import React from 'react';
import { Timer, Zap, Shield, Flame } from 'lucide-react';

import { motion } from 'motion/react';

interface ChessClockProps {
  timeSeconds: number;
  totalTimeSeconds?: number;
  isActive: boolean;
  isWhite: boolean;
  playerName: string;
  playerTitle?: string;
  avatar?: string;
  elo?: number;
  isUnlimited?: boolean;
  aotVariant?: 'scout' | 'titan';
}

export const ChessClock: React.FC<ChessClockProps> = ({
  timeSeconds,
  totalTimeSeconds,
  isActive,
  isWhite,
  playerName,
  playerTitle,
  avatar,
  elo,
  isUnlimited = false,
  aotVariant
}) => {
  const renderTitleBadge = (title: string | undefined) => {
    if (!title || !['GM', 'IM', 'FM', 'NM'].includes(title)) return null;
    let bg = 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    if (title === 'GM') bg = 'bg-red-500/20 text-red-300 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
    else if (title === 'IM') bg = 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
    else if (title === 'FM') bg = 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.3)]';
    else if (title === 'NM') bg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
    
    return (
      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm border ${bg} ml-2`}>
        {title}
      </span>
    );
  };

  const safeTime = isNaN(timeSeconds) ? 0 : Math.max(0, timeSeconds);
  const minutes = Math.floor(safeTime / 60);
  const seconds = Math.floor(safeTime % 60);
  const isLowTime = !isUnlimited && safeTime < 30;
  const isCritical = !isUnlimited && safeTime <= 10;

  const formattedTime = isUnlimited
    ? '∞'
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const percentage = totalTimeSeconds && totalTimeSeconds > 0 
    ? Math.min(100, Math.max(0, (safeTime / totalTimeSeconds) * 100))
    : 100;

  return (
    <div
      className={`flex flex-col rounded-2xl transition-all duration-500 border backdrop-blur-xl relative overflow-hidden ${
        isActive
          ? 'bg-white/10 border-[#FFD700]/40 shadow-[0_0_30px_-10px_rgba(255,215,0,0.4),inset_0_1px_0_0_rgba(255,255,255,0.1)]'
          : 'bg-white/5 border-white/5 opacity-80'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Player Identity */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg border transition-all duration-500 ${
                isActive
                  ? 'bg-black/40 border-[#FFD700] text-[#FFD700] scale-105'
                  : 'bg-black/20 border-white/10 text-white/40'
              }`}
            >
              {avatar && /^(https?:|data:|\/)/.test(avatar) ? (
                <img src={avatar} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                avatar || (isWhite ? '♔' : '♚')
              )}
            </div>
            {isActive && (
              <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-[#FFD700] rounded-full ring-2 ring-[#111827] shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {playerTitle && renderTitleBadge(playerTitle)}
              <span className={`text-xs sm:text-sm font-black tracking-tight transition-colors duration-300 ${
                isActive ? 'text-[#FFD700]' : 'text-white/60'
              }`}>
                {playerName}
              </span>
            </div>
            {elo !== undefined && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Elo</span>
                <span className="text-[11px] font-black text-[#FFD700]">{isNaN(Number(elo)) ? 1200 : elo}</span>
              </div>
            )}
          </div>
        </div>

        {/* Clock Display */}
        <div
          className={`flex items-center gap-3 px-4 py-2 rounded-xl font-black text-sm sm:text-lg border transition-all duration-300 ${
            isCritical
              ? 'bg-[#D32F2F]/20 text-[#D32F2F] border-[#D32F2F] animate-pulse shadow-[0_0_20px_rgba(211,47,47,0.3)]'
              : isLowTime
              ? 'bg-[#FFD700]/20 text-[#FFD700] border-[#FFD700] shadow-[0_0_15px_rgba(255,215,0,0.2)]'
              : isActive
              ? 'bg-black/40 text-[#FFD700] border-[#FFD700]/30 shadow-inner'
              : 'bg-black/20 text-white/40 border-transparent opacity-40'
          }`}
        >
          <Timer
            className={`w-4 h-4 ${
              isActive ? 'text-[#FFD700] animate-spin-slow' : 'text-white/40'
            }`}
            style={{ animationDuration: '4s' }}
          />
          <span className="tracking-tighter">{formattedTime}</span>
        </div>
      </div>

      {/* Visual Progress Indicator */}
      {isActive && !isUnlimited && totalTimeSeconds && (
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/5 overflow-hidden">
          <motion.div
            className={`h-full ${
              isCritical ? 'bg-[#D32F2F]' : isLowTime ? 'bg-[#FFD700]' : 'bg-[#FFD700]/60'
            }`}
            initial={{ width: `${percentage}%` }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "linear" }}
            style={{
              boxShadow: isCritical 
                ? '0 0 10px rgba(211, 47, 47, 0.8)' 
                : '0 0 10px rgba(255, 215, 0, 0.6)' 
            }}
          />
        </div>
      )}
    </div>
  );
};
