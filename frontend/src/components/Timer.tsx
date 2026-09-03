// FILE: frontend/src/components/Timer.tsx
import React from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  seconds: number;
  isActive: boolean;
  playerName: string;
  playerColor: 'white' | 'black';
  lowTimeThreshold?: number;
}

export const Timer: React.FC<TimerProps> = ({
  seconds,
  isActive,
  playerName,
  playerColor,
  lowTimeThreshold = 30
}) => {
  const isLowTime = seconds <= lowTimeThreshold;
  const mins = Math.floor(Math.max(0, seconds) / 60);
  const secs = Math.max(0, seconds) % 60;

  const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div
      className={`flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${
        isActive
          ? isLowTime
            ? 'bg-rose-950/40 border-rose-500/80 text-rose-400 animate-pulse shadow-rose-900/30'
            : 'bg-amber-950/30 border-amber-500/70 text-amber-300 shadow-lg'
          : 'bg-slate-900 border-slate-800 text-slate-400'
      }`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-3 h-3 rounded-full border ${
            playerColor === 'white'
              ? 'bg-white border-slate-300'
              : 'bg-slate-900 border-slate-600'
          }`}
        />
        <span className="text-xs font-semibold truncate max-w-[120px]">{playerName}</span>
      </div>

      <div className="flex items-center gap-1.5 font-mono text-lg font-bold tracking-wider">
        <Clock className={`w-4 h-4 ${isActive ? (isLowTime ? 'text-rose-400' : 'text-amber-400') : 'text-slate-500'}`} />
        <span>{formattedTime}</span>
      </div>
    </div>
  );
};
