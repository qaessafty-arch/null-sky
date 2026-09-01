import React from 'react';
import { Timer, Zap, Shield, Flame } from 'lucide-react';

interface ChessClockProps {
  timeSeconds: number;
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

  // Custom AoT styling
  const isScout = aotVariant === 'scout';
  const isTitan = aotVariant === 'titan';

  let cardClasses = 'bg-white/[0.04] border-white/10';
  if (isScout) {
    cardClasses = isActive
      ? 'bg-[#5d6f54]/25 border-emerald-400/60 shadow-[0_0_25px_rgba(34,197,94,0.35)]'
      : 'bg-[#5d6f54]/10 border-emerald-500/20';
  } else if (isTitan) {
    cardClasses = isActive
      ? 'bg-red-950/40 border-red-500/60 shadow-[0_0_25px_rgba(239,68,68,0.35)]'
      : 'bg-red-950/20 border-red-500/20';
  } else if (isActive) {
    cardClasses = 'bg-white/10 border-blue-400/50 shadow-[0_0_20px_rgba(96,165,250,0.2)]';
  }

  return (
    <div
      className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 border backdrop-blur-xl ${
        isActive
          ? 'bg-gradient-to-r from-[#162034] via-[#111827] to-[#0C1220] border-[#F59E0B]/45 shadow-[0_0_35px_-10px_rgba(245,158,11,0.55),inset_0_1px_0_0_rgba(255,255,255,0.08)]'
          : 'bg-gradient-to-r from-[#0D1421]/80 to-[#0A0F1B]/70 border-[#1F293D] opacity-75'
      }`}
    >
      {/* Player Identity */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg border transition-all duration-500 ${
              isActive
                ? 'bg-[#0B0F19] border-[#F59E0B] text-[#F59E0B] scale-105'
                : 'bg-[#0B0F19] border-[#1F293D] text-[#94A3B8]'
            }`}
          >
            {avatar && /^(https?:|data:|\/)/.test(avatar) ? (
              <img src={avatar} alt="" className="w-full h-full rounded-xl object-cover" />
            ) : (
              avatar || (isWhite ? '♔' : '♚')
            )}
          </div>
          {isActive && (
            <span className="absolute -bottom-1 -right-1 status-dot status-dot-online ring-2 ring-[#111827]" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            {playerTitle && renderTitleBadge(playerTitle)}
            <span className={`text-xs sm:text-sm font-black tracking-tight transition-colors duration-300 ${
              isActive ? 'text-white' : 'text-[#94A3B8]'
            }`}>
              {playerName}
            </span>
          </div>
          {elo !== undefined && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] font-mono text-[#94A3B8] opacity-60 uppercase tracking-widest">Rating</span>
              <span className="text-[11px] font-mono font-black text-[#F59E0B]">{elo}</span>
            </div>
          )}
        </div>
      </div>

      {/* Clock Display */}
      <div
        className={`flex items-center gap-3 px-4 py-2 rounded-xl font-mono font-black text-sm sm:text-lg border transition-all duration-300 ${
          isCritical
            ? 'bg-[#EF4444]/20 text-[#EF4444] border-[#EF4444] animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.3)]'
            : isLowTime
            ? 'bg-[#F59E0B]/20 text-[#F59E0B] border-[#F59E0B] shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            : isActive
            ? 'bg-[#0B0F19] text-white border-[#F59E0B]/30 shadow-inner'
            : 'bg-[#0B0F19]/40 text-[#94A3B8] border-transparent opacity-40'
        }`}
      >
        <Timer
          className={`w-4 h-4 ${
            isActive ? 'text-[#F59E0B] animate-spin-slow' : 'text-[#94A3B8]'
          }`}
          style={{ animationDuration: '4s' }}
        />
        <span className="tracking-tighter">{formattedTime}</span>
      </div>
    </div>
  );
};
