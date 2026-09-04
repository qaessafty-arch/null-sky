import React from 'react';
import { Timer, CheckCircle2, Trophy, Swords, Shield, Flame } from 'lucide-react';
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
  countryCode?: string;
  wins?: number;
  losses?: number;
  draws?: number;
  isVerified?: boolean;
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
  countryCode = 'US',
  wins = 18,
  losses = 6,
  draws = 4,
  isVerified = true
}) => {
  const renderTitleBadge = (title: string | undefined) => {
    if (!title || !['GM', 'IM', 'FM', 'NM'].includes(title)) return null;
    let bg = 'bg-slate-700/50 text-slate-300 border-slate-600/50';
    if (title === 'GM') bg = 'bg-red-500/20 text-red-300 border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]';
    else if (title === 'IM') bg = 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.3)]';
    else if (title === 'FM') bg = 'bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.3)]';
    else if (title === 'NM') bg = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.3)]';
    
    return (
      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm border ${bg} ml-1`}>
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

  // Circular SVG progress math (radius 16, perimeter ~ 100.5)
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={`flex flex-col rounded-2xl transition-all duration-300 border backdrop-blur-xl relative overflow-hidden ${
        isActive
          ? 'bg-white/10 border-[#F5C453]/60 shadow-[0_0_30px_-5px_rgba(245,196,83,0.3)] ring-1 ring-[#F5C453]/40'
          : 'bg-white/5 border-white/5 opacity-85'
      }`}
    >
      <div className="flex items-center justify-between px-3.5 py-2.5 sm:px-4 sm:py-3">
        {/* Player Identity */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-lg border transition-all duration-300 ${
                isActive
                  ? 'bg-black/50 border-[#F5C453] text-[#F5C453] scale-105'
                  : 'bg-black/30 border-white/10 text-white/60'
              }`}
            >
              {avatar && /^(https?:|data:|\/)/.test(avatar) ? (
                <img src={avatar} alt="" className="w-full h-full rounded-xl object-cover" />
              ) : (
                avatar || (isWhite ? '♔' : '♚')
              )}
            </div>

            {/* Pulsing online status ring with green dot */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 ring-2 ring-black" />
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-xs sm:text-sm font-black tracking-tight transition-colors duration-200 ${
                isActive ? 'text-[#F5C453]' : 'text-white/90'
              }`}>
                {playerName}
              </span>
              
              {/* Verified Checkmark */}
              {isVerified && (
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              )}

              {/* Title Badge */}
              {playerTitle && renderTitleBadge(playerTitle)}

              {/* Animated Country Flag Badge */}
              <motion.span 
                animate={{ y: [0, -1.5, 0] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="text-xs ml-0.5 cursor-default select-none"
                title={`Country: ${countryCode}`}
              >
                🏁
              </motion.span>
            </div>

            {/* ELO Rating with stats */}
            <div className="flex items-center gap-2 mt-0.5">
              <div className="flex items-center gap-1">
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">Elo</span>
                <span className="text-[10px] font-black font-mono text-[#F5C453]">
                  {isNaN(Number(elo)) ? 1200 : elo}
                </span>
              </div>

              <div className="w-[1px] h-2.5 bg-white/15" />

              {/* Small win/loss/draw stat counters */}
              <div className="flex items-center gap-1.5 text-[9px] font-mono text-white/50">
                <span className="text-emerald-400 font-bold" title="Wins">W:{wins}</span>
                <span>•</span>
                <span className="text-rose-400 font-bold" title="Losses">L:{losses}</span>
                <span>•</span>
                <span className="text-white/40" title="Draws">D:{draws}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Circular Progress + Countdown Clock Display */}
        <div className="flex items-center gap-2">
          {/* Circular Progress Ring */}
          {!isUnlimited && (
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <circle
                  cx="18"
                  cy="18"
                  r={radius}
                  className="text-white/10"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                />
                <circle
                  cx="18"
                  cy="18"
                  r={radius}
                  stroke={isCritical ? '#EF4444' : isLowTime ? '#F59E0B' : '#10B981'}
                  strokeWidth="3"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                  className="transition-all duration-300"
                />
              </svg>
              <Timer className={`w-3.5 h-3.5 absolute ${isCritical ? 'text-red-400 animate-spin' : isLowTime ? 'text-amber-400' : 'text-white/60'}`} />
            </div>
          )}

          {/* Time digits */}
          <div
            className={`flex items-center px-3.5 py-1.5 rounded-xl font-mono font-black text-sm sm:text-base border transition-all duration-300 ${
              isCritical
                ? 'bg-red-500/20 text-red-400 border-red-500 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.4)]'
                : isLowTime
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.25)]'
                : isActive
                ? 'bg-black/50 text-[#F5C453] border-[#F5C453]/40 shadow-inner'
                : 'bg-black/25 text-white/50 border-white/5 opacity-60'
            }`}
          >
            <span className="tracking-tight">{formattedTime}</span>
          </div>
        </div>
      </div>

      {/* Visual Bottom Progress Bar Indicator */}
      {isActive && !isUnlimited && totalTimeSeconds && (
        <div className="absolute bottom-0 left-0 w-full h-[2.5px] bg-white/5 overflow-hidden">
          <motion.div
            className={`h-full ${
              isCritical ? 'bg-red-500' : isLowTime ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
            initial={{ width: `${percentage}%` }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: "linear" }}
            style={{
              boxShadow: isCritical 
                ? '0 0 10px rgba(239, 68, 68, 0.8)' 
                : '0 0 10px rgba(245, 196, 83, 0.6)' 
            }}
          />
        </div>
      )}
    </div>
  );
};
