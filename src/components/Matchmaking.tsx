import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from './GlassUI';
import { GlassButton } from './GlassButton';
import { Search, X, Users, Bot, Trophy, Zap } from 'lucide-react';

interface MatchmakingOverlayProps {
  isSearching: boolean;
  queueTime: number;
  onCancel: () => void;
  statusText?: string;
  opponentFound?: {
    name: string;
    elo: number;
    isBot: boolean;
  };
}

export const MatchmakingOverlay: React.FC<MatchmakingOverlayProps> = ({
  isSearching,
  queueTime,
  onCancel,
  statusText = "Searching for opponent...",
  opponentFound
}) => {
  return (
    <AnimatePresence>
      {isSearching && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
        >
          <GlassCard intensity="high" className="w-full max-w-md relative matchmaking-scanner overflow-hidden p-8">
            <div className="flex flex-col items-center text-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-[#FFD700]/30 flex items-center justify-center animate-pulse">
                  <Search className="text-[#FFD700]" size={32} />
                </div>
                <div className="absolute inset-0 border-2 border-[#FFD700] rounded-full animate-ping opacity-20" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
                  {opponentFound ? "Opponent Found!" : "In Queue"}
                </h2>
                <p className="text-white/50 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                  <span>{statusText}</span>
                  {!opponentFound && (
                    <span className="flex gap-0.5">
                      <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-1 bg-white/50 rounded-full animate-bounce" />
                    </span>
                  )}
                </p>
              </div>

              {opponentFound ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-full p-4 glass-frost border-[#FFD700]/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                      {opponentFound.isBot ? <Bot className="text-[#FFD700]" /> : <Users className="text-white" />}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-black text-white">{opponentFound.name}</div>
                      <div className="text-[10px] text-[#FFD700] font-bold">ELO {opponentFound.elo}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-black text-green-400">
                    <Zap size={12} className="animate-pulse" />
                    READY
                  </div>
                </motion.div>
              ) : (
                <div className="text-4xl font-mono font-black text-white tracking-tight">
                  {Math.floor((isNaN(queueTime) ? 0 : queueTime) / 60)}:{(Math.floor(isNaN(queueTime) ? 0 : queueTime) % 60).toString().padStart(2, '0')}
                </div>
              )}

              <GlassButton 
                variant="red" 
                onClick={onCancel}
                className="w-full"
                disabled={!!opponentFound}
              >
                <X size={16} />
                Cancel Search
              </GlassButton>

              <div className="flex items-center gap-4 text-[10px] font-bold text-white/30 uppercase tracking-widest">
                <div className="flex items-center gap-1">
                  <Users size={12} />
                  <span>142 Active Players</span>
                </div>
                <div className="flex items-center gap-1">
                  <Trophy size={12} />
                  <span>Ranked Match</span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
