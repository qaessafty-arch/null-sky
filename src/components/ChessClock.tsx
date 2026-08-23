import React from 'react';
import { Timer, Zap } from 'lucide-react';

interface ChessClockProps {
  timeSeconds: number;
  isActive: boolean;
  isWhite: boolean;
  playerName: string;
  playerTitle?: string;
  avatar?: string;
  elo?: number;
  isUnlimited?: boolean;
}

export const ChessClock: React.FC<ChessClockProps> = ({
  timeSeconds,
  isActive,
  isWhite,
  playerName,
  playerTitle,
  avatar,
  elo,
  isUnlimited = false
}) => {
  const minutes = Math.floor(timeSeconds / 60);
  const seconds = timeSeconds % 60;
  const isLowTime = !isUnlimited && timeSeconds <= 20;
  const isCritical = !isUnlimited && timeSeconds <= 10;

  const formattedTime = isUnlimited
    ? '∞'
    : `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div
      className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl transition-all duration-200 border backdrop-blur-md ${
        isActive
          ? 'bg-white/10 border-blue-400/50 shadow-[0_0_20px_rgba(96,165,250,0.2)]'
          : 'bg-white/[0.04] border-white/10'
      }`}
    >
      {/* Player Identity */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-lg shadow-sm backdrop-blur-md">
            {avatar || (isWhite ? '♔' : '♚')}
          </div>
          {isActive && (
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#0a0a0c] animate-ping" />
          )}
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            {playerTitle && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40">
                {playerTitle}
              </span>
            )}
            <span className="text-xs sm:text-sm font-semibold text-white/90 leading-none">
              {playerName}
            </span>
          </div>
          {elo !== undefined && (
            <span className="text-[11px] font-mono text-white/50">
              Rating: <strong className="text-white/80 font-bold">{elo}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Clock Display */}
      <div
        className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono font-bold text-sm sm:text-base border transition-all backdrop-blur-md ${
          isCritical
            ? 'bg-rose-950/80 text-rose-300 border-rose-500/80 animate-pulse shadow-[0_0_15px_rgba(225,29,72,0.4)]'
            : isLowTime
            ? 'bg-amber-950/70 text-amber-300 border-amber-500/70'
            : isActive
            ? 'bg-blue-950/40 text-blue-200 border-blue-400/40 shadow-inner shadow-blue-500/10'
            : 'bg-white/[0.03] text-white/50 border-white/10'
        }`}
      >
        <Timer className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-white/40'}`} />
        <span className="tracking-wider">{formattedTime}</span>
      </div>
    </div>
  );
};
