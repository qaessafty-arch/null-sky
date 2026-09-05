import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameResult } from '../types/chess';
import { Trophy, RefreshCw, Compass, Award, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { AiMangaRecap } from './AiMangaRecap';

interface GameOverModalProps {
  result: GameResult;
  onRematch: () => void;
  onNewGame: () => void;
  onAnalyze: () => void;
  onPracticePuzzles?: () => void;
  onClose: () => void;
  pgn?: string;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  result,
  onRematch,
  onNewGame,
  onAnalyze,
  onPracticePuzzles,
  onClose,
  pgn
}) => {
  const isWhiteWin = result.winner === 'w';
  const isBlackWin = result.winner === 'b';
  const isDraw = result.winner === 'draw';

  useEffect(() => {
    if (result.winner && result.winner !== 'draw') {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#F59E0B', '#10B981', '#3B82F6', '#EC4899', '#8B5CF6']
        });
      } catch {
        // Confetti optional
      }
    }
  }, [result.winner]);

  const title = isDraw
    ? 'Game Drawn'
    : isWhiteWin
    ? 'White Victorious!'
    : 'Black Victorious!';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="relative obsidian-panel rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center border-[#1F293D]"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#94A3B8] hover:text-white p-1.5 rounded-xl hover:bg-[#1F293D] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Victory Icon */}
        <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-[#0B0F19] border flex items-center justify-center shadow-2xl transition-all ${
          isWhiteWin || isBlackWin 
            ? 'border-[#F59E0B] text-[#F59E0B] shadow-[#F59E0B]/20' 
            : 'border-[#1F293D] text-[#94A3B8]'
        }`}>
          {isDraw ? <Award className="w-10 h-10" /> : <Trophy className="w-10 h-10" />}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white mb-2 tracking-tight uppercase">
          {title}
        </h2>
        <p className="text-xs font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-8 opacity-80">
          {result.reason}
        </p>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onRematch}
            className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-2xl bg-[#F59E0B] text-[#0B0F19] font-black text-sm transition-all shadow-xl shadow-[#F59E0B]/20 active:scale-95 cursor-pointer uppercase tracking-widest"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Rematch</span>
          </button>

          <button
            onClick={onNewGame}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#111827] text-white font-black text-[11px] hover:bg-[#1F293D] border border-[#1F293D] transition-all uppercase tracking-widest active:scale-95 cursor-pointer"
          >
            <span>Change Opponent</span>
          </button>

          {onPracticePuzzles && (
            <button
              onClick={onPracticePuzzles}
              className="w-full flex-1 min-w-[120px] glass-button border-white/5 hover:bg-emerald-500/20 hover:border-emerald-500/50 hover:text-emerald-300 interactive-btn shadow-lg group py-3 rounded-xl transition-all"
            >
              <Award className="w-4 h-4 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] uppercase font-black tracking-widest block text-center">Practice Puzzles</span>
            </button>
          )}
          <button
            onClick={onAnalyze}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#0B0F19] text-[#94A3B8] font-black text-[11px] hover:text-[#F59E0B] hover:border-[#F59E0B]/30 border border-[#1F293D] transition-all uppercase tracking-widest active:scale-95 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Game Analysis Board</span>
          </button>
        </div>

        {pgn && (
          <div className="mt-8 pt-8 border-t border-[#1F293D]">
            <AiMangaRecap pgn={pgn} />
          </div>
        )}
      </motion.div>
    </div>
  );
};
