import React from 'react';
import { Shield, Sparkles, Sword, HeartHandshake, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface CheckmateJudgmentModalProps {
  onExecute: () => void;
  onMercy: () => void;
  onClose: () => void;
  winnerName?: string;
  opponentName?: string;
}

export const CheckmateJudgmentModal: React.FC<CheckmateJudgmentModalProps> = ({
  onExecute,
  onMercy,
  onClose,
  winnerName = 'Commander',
  opponentName = 'Opponent'
}) => {
  const triggerConfetti = (colors: string[]) => {
    try {
      confetti({
        particleCount: 70,
        spread: 80,
        origin: { y: 0.6 },
        colors
      });
    } catch {
      // Confetti fallback
    }
  };

  const handleExecuteClick = () => {
    triggerConfetti(['#8C2425', '#F5C453', '#DFD0B0', '#435433']);
    onExecute();
  };

  const handleMercyClick = () => {
    triggerConfetti(['#F5C453', '#10B981', '#38BDF8', '#DFD0B0']);
    onMercy();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl animate-in fade-in duration-200 p-4">
      <div className="relative glass-panel rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#F5C453]/30 text-center overflow-hidden">
        {/* Ambient Kurdish Sun Halo */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#F5C453]/15 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 21-Ray Kurdish Sun Emblem */}
        <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#8C2425] via-[#52673A] to-[#F5C453] animate-spin opacity-40 blur-sm duration-[10000ms]" />
          <div className="relative w-16 h-16 rounded-2xl bg-[#1a2315] border-2 border-[#F5C453] flex items-center justify-center shadow-[0_0_25px_rgba(245,196,83,0.4)]">
            <span className="text-3xl select-none">☀️</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8C2425]/20 border border-[#8C2425]/40 text-[#DFD0B0] text-xs font-semibold uppercase tracking-wider mb-2">
          <span>⚔️ Tactical Checkmate Landed</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-[#FDFCF7] tracking-tight mb-2">
          The Peshmerga Honor Judgment
        </h2>
        <p className="text-sm text-[#DFD0B0]/80 mb-6 leading-relaxed max-w-md mx-auto">
          You have trapped <strong className="text-[#F5C453]">{opponentName}</strong> in an inescapable checkmate. In ancient Kurdish tradition, choose your destiny: deliver the final execution blow or grant honorable chivalrous mercy!
        </p>

        {/* Dual Choice Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          {/* Choice 1: EXECUTE */}
          <button
            onClick={handleExecuteClick}
            className="group relative p-4 rounded-2xl bg-gradient-to-b from-[#8C2425]/30 to-[#8C2425]/10 border-2 border-[#8C2425]/60 hover:border-[#8C2425] text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-[#8C2425]/30 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-xl bg-[#8C2425] text-white shadow-md">
                  <Sword className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold text-[#F5C453] bg-black/40 px-2 py-0.5 rounded-md border border-[#F5C453]/20">
                  +8 ELO
                </span>
              </div>
              <h3 className="font-extrabold text-base text-white group-hover:text-red-200 transition-colors">
                ⚔️ EXECUTE OPPONENT
              </h3>
              <p className="text-xs text-[#DFD0B0]/70 mt-1 leading-normal">
                Deliver the lethal checkmate blow, claim moderate rating points, and log decisive victory.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-bold text-red-300">
              <span>Reward</span>
              <span className="text-[#F5C453] bg-[#8C2425]/40 px-2 py-0.5 rounded-full">+5 ✊ Respect</span>
            </div>
          </button>

          {/* Choice 2: SPARE MERCY */}
          <button
            onClick={handleMercyClick}
            className="group relative p-4 rounded-2xl bg-gradient-to-b from-[#52673A]/40 to-[#435433]/20 border-2 border-[#F5C453]/60 hover:border-[#F5C453] text-left transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-[#F5C453]/30 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-xl bg-[#52673A] text-[#F5C453] border border-[#F5C453]/40 shadow-md">
                  <HeartHandshake className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold text-emerald-300 bg-black/40 px-2 py-0.5 rounded-md border border-emerald-400/20">
                  DOUBLE RESPECT
                </span>
              </div>
              <h3 className="font-extrabold text-base text-[#F5C453] group-hover:text-yellow-200 transition-colors">
                🕊️ SPARE MERCY
              </h3>
              <p className="text-xs text-[#DFD0B0]/70 mt-1 leading-normal">
                Show royal chivalry, undo the checkmate move, and grant your rival another chance!
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs font-bold text-yellow-300">
              <span>Chivalry Honor</span>
              <span className="text-[#F5C453] bg-[#F5C453]/20 border border-[#F5C453]/40 px-2 py-0.5 rounded-full font-black">
                +10 ✊ (+12 ELO)
              </span>
            </div>
          </button>
        </div>

        <p className="text-xs text-[#DFD0B0]/50 italic">
          Respect Points (✊) determine your position on the global and Kurdish Grandmaster rankings.
        </p>
      </div>
    </div>
  );
};
