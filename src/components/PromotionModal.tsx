import React from 'react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="glass-panel rounded-3xl p-6 shadow-2xl max-w-sm w-full mx-4 text-center border-white/15">
        <h3 className="text-lg font-bold text-white font-ui mb-1">
          Pawn Promotion
        </h3>
        <p className="text-xs text-white/60 mb-6">
          Choose a piece to promote your pawn
        </p>

        <div className="grid grid-cols-4 gap-2.5">
          {pieces.map(p => (
            <button
              key={p.type}
              onClick={() => onSelect(p.type)}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-white/[0.06] border border-white/10 hover:border-blue-400/60 hover:bg-white/[0.12] transition-all hover:scale-105 active:scale-95 group backdrop-blur-md"
            >
              <div className="w-12 h-12 mb-2 group-hover:drop-shadow-[0_0_12px_rgba(96,165,250,0.5)]">
                <ChessPiece type={p.type} color={color} theme={pieceTheme} />
              </div>
              <span className="text-xs font-semibold text-white/80 group-hover:text-blue-300">
                {p.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
