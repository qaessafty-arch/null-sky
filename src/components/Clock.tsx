import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock } from 'lucide-react';

interface SyncedClockProps {
  timeSeconds: number;
  totalTimeSeconds: number;
  isActive: boolean;
  label: string;
  isOpponent?: boolean;
  increment?: number;
}

export const SyncedClock: React.FC<SyncedClockProps> = ({
  timeSeconds,
  totalTimeSeconds,
  isActive,
  label,
  isOpponent = false,
  increment = 0
}) => {
  const isWarning = timeSeconds < 10;
  const isCritical = timeSeconds < 5;
  
  const formatTime = (seconds: number) => {
    const validSeconds = isNaN(seconds) ? 0 : Math.max(0, seconds);
    const mins = Math.floor(validSeconds / 60);
    const secs = Math.floor(validSeconds % 60);
    const ms = Math.floor((validSeconds % 1) * 10);
    
    if (validSeconds < 10) return `${secs}.${ms}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressWidth = useMemo(() => {
    if (isNaN(timeSeconds) || isNaN(totalTimeSeconds) || totalTimeSeconds <= 0) return 0;
    return (timeSeconds / totalTimeSeconds) * 100;
  }, [timeSeconds, totalTimeSeconds]);

  return (
    <div className={`relative overflow-hidden p-4 glass-frost transition-all duration-300 ${
      isActive 
        ? 'ring-2 ring-[#FFD700]/50 shadow-[0_0_20px_rgba(255,215,0,0.2)] bg-[#FFD700]/5' 
        : 'opacity-70'
    } ${isWarning && isActive ? 'animate-pulse' : ''}`}>
      
      {/* Status Bar */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
          {label}
        </span>
        {increment > 0 && (
          <span className="text-[10px] font-bold text-[#FFD700]">+ {increment}s</span>
        )}
      </div>

      <div className="flex items-end justify-between gap-4">
        <div className={`text-3xl font-mono font-black tracking-tight ${
          isWarning ? 'text-red-500' : 'text-white'
        }`}>
          {formatTime(timeSeconds)}
        </div>
        <Clock size={20} className={isActive ? 'text-[#FFD700] animate-spin-slow' : 'text-white/20'} />
      </div>

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 h-1 bg-white/5 w-full">
        <motion.div
          className={`h-full ${isWarning ? 'bg-red-500' : 'bg-[#FFD700]'}`}
          initial={false}
          animate={{ width: `${progressWidth}%` }}
          transition={{ duration: 1, ease: 'linear' }}
        />
      </div>

      {/* Warning Overlay */}
      <AnimatePresence>
        {isCritical && isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-red-500/10 pointer-events-none"
          />
        )}
      </AnimatePresence>
    </div>
  );
};
