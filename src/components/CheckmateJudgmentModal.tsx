import React from 'react';
import { motion } from 'motion/react';
import { Shield, Sword, HeartHandshake, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { GlassButton } from './GlassButton';

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
    triggerConfetti(['#EF4444', '#F59E0B', '#0B0F19']);
    onExecute();
  };

  const handleMercyClick = () => {
    triggerConfetti(['#F59E0B', '#10B981', '#3B82F6']);
    onMercy();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="relative obsidian-panel rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-[#1F293D] text-center overflow-hidden"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#94A3B8] hover:text-white p-1.5 rounded-xl hover:bg-[#1F293D] transition-colors z-10 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tactical Emblem */}
        <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-[#F59E0B]/10 animate-pulse blur-xl" />
          <div className="relative w-16 h-16 rounded-2xl bg-[#0B0F19] border border-[#F59E0B] flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.2)]">
            <Shield className="w-8 h-8 text-[#F59E0B]" />
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EF4444]/10 border border-[#EF4444]/30 text-[#EF4444] text-[10px] font-black uppercase tracking-widest mb-4">
          <span>⚔️ Tactical Superiority Verified</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 uppercase">
          Final Judgment
        </h2>
        <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-8 opacity-70 max-w-sm mx-auto leading-relaxed">
          Opponent <strong className="text-white">{opponentName}</strong> has been cornered. Deliver the strike or show supreme restraint.
        </p>

        {/* Dual Choice Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
          {/* Choice 1: EXECUTE */}
          <GlassButton
            onClick={handleExecuteClick}
            variant="red"
            className="group relative !p-5 !rounded-2xl !bg-[#0B0F19] border border-[#EF4444]/30 hover:border-[#EF4444] !flex-col !items-start transition-all active:scale-95 shadow-lg flex justify-between cursor-pointer"
          >
            <div className="w-full text-left">
              <div className="flex items-center justify-between mb-4">
                <span className="p-2 rounded-xl bg-[#EF4444] text-white shadow-lg">
                  <Sword className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-black text-[#EF4444] bg-[#EF4444]/10 px-2 py-0.5 rounded-lg border border-[#EF4444]/20">
                  DECISIVE
                </span>
              </div>
              <h3 className="font-black text-xs text-white group-hover:text-[#EF4444] transition-colors uppercase tracking-wider">
                Execute
              </h3>
              <p className="text-[10px] font-black text-[#94A3B8] mt-1 leading-normal uppercase opacity-60">
                Lethal blow. Claim rating points immediately.
              </p>
            </div>
            <div className="w-full mt-4 pt-3 border-t border-[#1F293D] flex items-center justify-between text-[9px] font-black uppercase tracking-tighter">
              <span className="text-[#94A3B8]">Reward</span>
              <span className="text-[#EF4444]">+8 ELO</span>
            </div>
          </GlassButton>

          {/* Choice 2: MERCY */}
          <GlassButton
            onClick={handleMercyClick}
            variant="secondary"
            className="group relative !p-5 !rounded-2xl !bg-[#0B0F19] border border-[#10B981]/30 hover:border-[#10B981] !flex-col !items-start transition-all active:scale-95 shadow-lg flex justify-between cursor-pointer"
          >
            <div className="w-full text-left">
              <div className="flex items-center justify-between mb-4">
                <span className="p-2 rounded-xl bg-[#10B981] text-white shadow-lg">
                  <HeartHandshake className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-black text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-lg border border-[#10B981]/20">
                  LEGENDARY
                </span>
              </div>
              <h3 className="font-black text-xs text-white group-hover:text-[#10B981] transition-colors uppercase tracking-wider">
                Show Mercy
              </h3>
              <p className="text-[10px] font-black text-[#94A3B8] mt-1 leading-normal uppercase opacity-60">
                Spare opponent. Earn maximum respect.
              </p>
            </div>
            <div className="w-full mt-4 pt-3 border-t border-[#1F293D] flex items-center justify-between text-[9px] font-black uppercase tracking-tighter">
              <span className="text-[#94A3B8]">Bonus</span>
              <span className="text-[#F59E0B]">+50 Respect</span>
            </div>
          </GlassButton>
        </div>
      </motion.div>
    </div>
  );
};
