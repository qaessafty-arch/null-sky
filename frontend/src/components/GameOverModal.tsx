// FILE: frontend/src/components/GameOverModal.tsx
import React from 'react';
import { Trophy, Swords, RotateCcw, BarChart2, Home, X } from 'lucide-react';

interface GameOverModalProps {
  isOpen: boolean;
  winner: 'white' | 'black' | 'draw' | null;
  reason: string;
  myColor: 'white' | 'black' | 'spectator';
  ratingChange?: number;
  onRematch?: () => void;
  onAnalysis?: () => void;
  onReturnToLobby: () => void;
  onClose: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isOpen,
  winner,
  reason,
  myColor,
  ratingChange = 15,
  onRematch,
  onAnalysis,
  onReturnToLobby,
  onClose
}) => {
  if (!isOpen) return null;

  const isDraw = winner === 'draw' || !winner;
  const isWinner = winner === myColor;

  let title = 'Game Over';
  let badgeColor = 'bg-slate-800 text-slate-300';
  let ratingText = '';

  if (isDraw) {
    title = 'Draw';
    badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    ratingText = '±0 ELO';
  } else if (isWinner) {
    title = 'Victory!';
    badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    ratingText = `+${ratingChange} ELO`;
  } else if (myColor !== 'spectator') {
    title = 'Defeat';
    badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    ratingText = `-${ratingChange} ELO`;
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 md:p-8 shadow-2xl max-w-sm w-full text-center relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 shadow-inner">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-2xl font-black tracking-tight text-white mb-1">{title}</h2>
        <p className="text-xs text-slate-400 capitalize mb-4">by {reason.replace(/_/g, ' ')}</p>

        {myColor !== 'spectator' && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-bold mb-6">
            <span className={badgeColor}>{ratingText}</span>
          </div>
        )}

        <div className="space-y-2.5">
          {onRematch && (
            <button
              onClick={onRematch}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Rematch
            </button>
          )}

          {onAnalysis && (
            <button
              onClick={onAnalysis}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold text-sm rounded-xl transition-all border border-slate-700 flex items-center justify-center gap-2"
            >
              <BarChart2 className="w-4 h-4 text-sky-400" />
              Analyze Match
            </button>
          )}

          <button
            onClick={onReturnToLobby}
            className="w-full py-3 px-4 bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-medium text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Return to Lobby
          </button>
        </div>
      </div>
    </div>
  );
};
