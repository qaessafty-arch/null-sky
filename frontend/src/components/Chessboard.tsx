// FILE: frontend/src/components/Chessboard.tsx
import React, { useState } from 'react';
import { Chess } from 'chess.js';

interface ChessboardProps {
  fen: string;
  orientation?: 'white' | 'black';
  onPieceDrop?: (sourceSquare: string, targetSquare: string) => boolean;
  arePiecesDraggable?: boolean;
  customSquareStyles?: Record<string, any>;
  boardWidth?: number;
  theme?: 'classic' | 'wood' | 'emerald' | 'dark' | 'neon';
  showCoordinates?: boolean;
}

const THEME_COLORS = {
  classic: { light: 'bg-amber-100', dark: 'bg-amber-800' },
  wood: { light: 'bg-[#e3c193]', dark: 'bg-[#9c6a38]' },
  emerald: { light: 'bg-[#ebecd0]', dark: 'bg-[#779556]' },
  dark: { light: 'bg-slate-700', dark: 'bg-slate-900' },
  neon: { light: 'bg-cyan-950/40', dark: 'bg-purple-950/70' }
};

const PIECE_SYMBOLS: Record<string, string> = {
  p: '♟', r: '♜', n: '♞', b: '♝', q: '♛', k: '♚',
  P: '♙', R: '♖', N: '♘', B: '♗', Q: '♕', K: '♔'
};

export const Chessboard: React.FC<ChessboardProps> = ({
  fen,
  orientation = 'white',
  onPieceDrop,
  arePiecesDraggable = true,
  customSquareStyles = {},
  boardWidth = 480,
  theme = 'classic',
  showCoordinates = true
}) => {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const chess = new Chess(fen);
  const board = chess.board();

  // Columns & Rows according to orientation
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = orientation === 'white' ? files : [...files].reverse();
  const displayRanks = orientation === 'white' ? ranks : [...ranks].reverse();

  const handleSquareClick = (square: string) => {
    if (!arePiecesDraggable) return;

    if (!selectedSquare) {
      const piece = chess.get(square as any);
      if (piece) {
        setSelectedSquare(square);
      }
    } else {
      if (selectedSquare === square) {
        setSelectedSquare(null);
      } else {
        const success = onPieceDrop ? onPieceDrop(selectedSquare, square) : false;
        setSelectedSquare(null);
      }
    }
  };

  const currentTheme = THEME_COLORS[theme] || THEME_COLORS.classic;

  return (
    <div
      style={{ width: boardWidth, height: boardWidth }}
      className="relative select-none rounded-2xl overflow-hidden shadow-2xl border-4 border-slate-800 bg-slate-950"
    >
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {displayRanks.map((rank, rankIdx) =>
          displayFiles.map((file, fileIdx) => {
            const square = `${file}${rank}`;
            const isLight = (fileIdx + rankIdx) % 2 === 0;
            const piece = chess.get(square as any);
            const isSelected = selectedSquare === square;
            const customStyle = customSquareStyles[square] || {};

            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors ${
                  isLight ? currentTheme.light : currentTheme.dark
                } ${isSelected ? 'ring-4 ring-amber-400 z-10' : ''}`}
                style={customStyle}
              >
                {/* Board edge coordinates */}
                {showCoordinates && fileIdx === 0 && (
                  <span
                    className={`absolute top-1 left-1 text-[10px] font-bold ${
                      isLight ? 'text-amber-900/60' : 'text-amber-100/60'
                    }`}
                  >
                    {rank}
                  </span>
                )}
                {showCoordinates && rankIdx === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${
                      isLight ? 'text-amber-900/60' : 'text-amber-100/60'
                    }`}
                  >
                    {file}
                  </span>
                )}

                {/* Chess Piece Display */}
                {piece && (
                  <span
                    className={`text-4xl md:text-5xl font-serif filter drop-shadow-md select-none transition-transform hover:scale-105 ${
                      piece.color === 'w' ? 'text-white' : 'text-slate-950'
                    }`}
                  >
                    {piece.color === 'w'
                      ? PIECE_SYMBOLS[piece.type.toUpperCase()]
                      : PIECE_SYMBOLS[piece.type]}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
