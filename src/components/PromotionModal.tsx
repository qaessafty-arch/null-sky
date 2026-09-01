import React from 'react';
import { motion } from 'motion/react';
import { PieceType, PieceColor, PieceThemeId } from '../types/chess';
import { ChessPiece } from './ChessPiece';

interface PromotionModalProps {
  color: PieceColor;
  pieceTheme: PieceThemeId;
  onSelect: (piece: PieceType) => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  color,
  pieceTheme,
  onSelect
}) => {
  const pieces: { type: PieceType; name: string }[] = [
    { type: 'q', name: 'Queen' },
    { type: 'n', name: 'Knight' },
    { type: 'r', name: 'Rook' },
    { type: 'b', name: 'Bishop' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="obsidian-panel rounded-3xl p-6 shadow-2xl max-w-sm w-full mx-4 text-center border-[#1F293D]"
      >
        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">
          Pawn Promotion
        </h3>
        <p className="text-[11px] font-black text-[#94A3B8] uppercase tracking-[0.2em] mb-8 opacity-70">
          Reinforcements Required
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {pieces.map(p => (
            <button
              key={p.type}
              onClick={() => onSelect(p.type)}
              className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#0B0F19] border border-[#1F293D] hover:border-[#F59E0B] transition-all active:scale-95 group cursor-pointer"
            >
              <div className="w-14 h-14 mb-3 transition-transform group-hover:scale-110">
                <ChessPiece type={p.type} color={color} theme={pieceTheme} />
              </div>
              <span className="text-[10px] font-black text-[#94A3B8] uppercase tracking-tighter group-hover:text-white transition-colors">
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
