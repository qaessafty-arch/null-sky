// FILE: frontend/src/components/PromotionDialog.tsx
import React from 'react';

interface PromotionDialogProps {
  color: 'w' | 'b';
  isOpen: boolean;
  onSelectPiece: (piece: 'q' | 'r' | 'b' | 'n') => void;
  onCancel?: () => void;
}

export const PromotionDialog: React.FC<PromotionDialogProps> = ({
  color,
  isOpen,
  onSelectPiece,
  onCancel
}) => {
  if (!isOpen) return null;

  const pieces: { type: 'q' | 'r' | 'b' | 'n'; label: string; symbol: string }[] = [
    { type: 'q', label: 'Queen', symbol: color === 'w' ? '♕' : '♛' },
    { type: 'r', label: 'Rook', symbol: color === 'w' ? '♖' : '♜' },
    { type: 'b', label: 'Bishop', symbol: color === 'w' ? '♗' : '♝' },
    { type: 'n', label: 'Knight', symbol: color === 'w' ? '♘' : '♞' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl max-w-xs w-full text-center">
        <h3 className="text-lg font-bold text-slate-100 mb-1">Pawn Promotion</h3>
        <p className="text-xs text-slate-400 mb-5">Choose a piece to replace your advanced pawn:</p>

        <div className="grid grid-cols-4 gap-3 mb-4">
          {pieces.map((p) => (
            <button
              key={p.type}
              onClick={() => onSelectPiece(p.type)}
              className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-800 hover:bg-amber-500/20 hover:border-amber-500 border border-slate-700 transition-all group"
            >
              <span className="text-4xl group-hover:scale-110 transition-transform">
                {p.symbol}
              </span>
              <span className="text-[11px] font-semibold text-slate-300 group-hover:text-amber-300 mt-1">
                {p.label}
              </span>
            </button>
          ))}
        </div>

        {onCancel && (
          <button
            onClick={onCancel}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Cancel Move
          </button>
        )}
      </div>
    </div>
  );
};
