import React, { useEffect } from 'react';
import { GameResult } from '../types/chess';
import { Trophy, RefreshCw, Compass, Award, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GameOverModalProps {
  result: GameResult;
  onRematch: () => void;
  onNewGame: () => void;
  onAnalyze: () => void;
  onClose: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  result,
  onRematch,
  onNewGame,
  onAnalyze,
  onClose
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xl animate-in fade-in duration-200 p-4">
      <div className="relative glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center border-white/15">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Victory Icon */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-purple-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300 shadow-[0_0_25px_rgba(96,165,250,0.3)] backdrop-blur-md">
          {isDraw ? <Award className="w-8 h-8" /> : <Trophy className="w-8 h-8" />}
        </div>

        <h2 className="text-2xl font-bold text-white font-heading mb-1 tracking-tight">
          {title}
        </h2>
        <p className="text-sm font-medium text-blue-300/90 mb-6">
          {result.reason}
        </p>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            onClick={onRematch}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white font-bold hover:opacity-95 transition-all shadow-lg shadow-blue-500/25 hover:scale-[1.02] active:scale-[0.98] border border-white/20"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Rematch</span>
          </button>

          <button
            onClick={onNewGame}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-white/[0.06] text-white/90 font-semibold hover:bg-white/[0.12] hover:text-white border border-white/10 transition-all backdrop-blur-md"
          >
            <span>Change Opponent / Time</span>
          </button>

          <button
            onClick={onAnalyze}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-purple-500/15 text-purple-200 font-semibold hover:bg-purple-500/25 border border-purple-500/30 transition-all backdrop-blur-md"
          >
            <Compass className="w-4 h-4 text-purple-400" />
            <span>Open Game in Analysis Board</span>
          </button>
        </div>
      </div>
    </div>
  );
};
