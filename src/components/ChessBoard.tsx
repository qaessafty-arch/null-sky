import React, { useState, useRef, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { ChessPiece } from './ChessPiece';
import { PieceThemeId, BoardThemeId, PieceColor } from '../types/chess';

interface ChessBoardProps {
  game: Chess;
  isFlipped: boolean;
  boardTheme: BoardThemeId;
  pieceTheme: PieceThemeId;
  showCoordinates: boolean;
  highlightLastMove: boolean;
  showLegalMoves: boolean;
  lastMove: { from: string; to: string } | null;
  onMove: (from: Square, to: Square) => boolean | void;
  disabled?: boolean;
}

const THEME_STYLES: Record<
  BoardThemeId,
  { light: string; dark: string; lightText: string; darkText: string; border: string; glow: string }
> = {
  peshmerga: {
    light: 'bg-[#DFD0B0]',
    dark: 'bg-[#435433]',
    lightText: 'text-[#435433]',
    darkText: 'text-[#DFD0B0]',
    border: 'border-[#8C2425]',
    glow: 'shadow-[0_0_35px_rgba(245,196,83,0.35)]'
  },
  ukh: {
    light: 'bg-[#E8EEF5]',
    dark: 'bg-[#1A3B5C]',
    lightText: 'text-[#1A3B5C]',
    darkText: 'text-[#E8EEF5]',
    border: 'border-[#D4AF37]',
    glow: 'shadow-[0_0_35px_rgba(229,169,59,0.38)]'
  },
  emerald: {
    light: 'bg-[#eeeed2]',
    dark: 'bg-[#769656]',
    lightText: 'text-[#769656]',
    darkText: 'text-[#eeeed2]',
    border: 'border-[#4a6333]',
    glow: 'shadow-[0_0_30px_rgba(118,150,86,0.25)]'
  },
  wood: {
    light: 'bg-[#e2c499]',
    dark: 'bg-[#9c6a38]',
    lightText: 'text-[#9c6a38]',
    darkText: 'text-[#e2c499]',
    border: 'border-[#5e381b]',
    glow: 'shadow-[0_0_30px_rgba(156,106,56,0.3)]'
  },
  ocean: {
    light: 'bg-[#dee3e6]',
    dark: 'bg-[#678292]',
    lightText: 'text-[#678292]',
    darkText: 'text-[#dee3e6]',
    border: 'border-[#3f525d]',
    glow: 'shadow-[0_0_30px_rgba(103,130,146,0.3)]'
  },
  midnight: {
    light: 'bg-[#334155]',
    dark: 'bg-[#0f172a]',
    lightText: 'text-[#94a3b8]',
    darkText: 'text-[#64748b]',
    border: 'border-slate-800',
    glow: 'shadow-[0_0_35px_rgba(30,41,59,0.5)]'
  },
  marble: {
    light: 'bg-[#e8ebf0]',
    dark: 'bg-[#8ca2b0]',
    lightText: 'text-[#8ca2b0]',
    darkText: 'text-[#e8ebf0]',
    border: 'border-[#596d79]',
    glow: 'shadow-[0_0_30px_rgba(140,162,176,0.3)]'
  },
  custom: {
    light: 'bg-[var(--board-light,#eeeed2)]',
    dark: 'bg-[var(--board-dark,#769656)]',
    lightText: 'text-[var(--board-dark,#769656)]',
    darkText: 'text-[var(--board-light,#eeeed2)]',
    border: 'border-[var(--board-border,#4a6333)]',
    glow: 'shadow-[0_0_30px_var(--accent-glow,rgba(59,130,246,0.35))]'
  }
};

import { UkhLogo } from './UkhLogo';

// UKH Official University Erbil Citadel Emblem Board Watermark
const UkhBoardWatermark: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[8] select-none overflow-hidden p-6">
    <div className="w-[82%] h-[82%] opacity-35 transition-opacity duration-300 drop-shadow-[0_0_25px_rgba(22,91,170,0.35)]">
      <UkhLogo showText={true} textColor="#DFD0B0" />
    </div>
  </div>
);

export const ChessBoard: React.FC<ChessBoardProps> = ({
  game,
  isFlipped,
  boardTheme,
  pieceTheme,
  showCoordinates,
  highlightLastMove,
  showLegalMoves,
  lastMove,
  onMove,
  disabled = false
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [legalTargets, setLegalTargets] = useState<{ square: Square; isCapture: boolean }[]>([]);
  const [draggingSquare, setDraggingSquare] = useState<Square | null>(null);
  const [dragPosition, setDragPosition] = useState<{ x: number; y: number } | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const theme = THEME_STYLES[boardTheme] || THEME_STYLES.emerald;

  // Board ranks and files
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = isFlipped ? [...files].reverse() : files;
  const displayRanks = isFlipped ? [...ranks].reverse() : ranks;

  // Find king square in check
  const inCheck = game.inCheck();
  let kingInCheckSquare: Square | null = null;
  if (inCheck) {
    const turn = game.turn();
    const boardState = game.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = boardState[r][f];
        if (piece && piece.type === 'k' && piece.color === turn) {
          const fileStr = String.fromCharCode('a'.charCodeAt(0) + f);
          const rankStr = (8 - r).toString();
          kingInCheckSquare = (fileStr + rankStr) as Square;
          break;
        }
      }
    }
  }

  // Calculate legal moves for selected square
  useEffect(() => {
    if (!selectedSquare || disabled) {
      setLegalTargets([]);
      return;
    }

    try {
      const moves = game.moves({ square: selectedSquare, verbose: true });
      const targets = moves.map((m: Move) => ({
        square: m.to as Square,
        isCapture: !!m.captured
      }));
      setLegalTargets(targets);
    } catch {
      setLegalTargets([]);
    }
  }, [selectedSquare, game, disabled]);

  const handleSquareClick = (square: Square) => {
    if (disabled) return;

    if (selectedSquare === null) {
      // Select piece if it belongs to current player
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
      }
    } else {
      // If clicking same square, deselect
      if (selectedSquare === square) {
        setSelectedSquare(null);
        return;
      }

      // If clicking another piece of current player, select that one instead
      const piece = game.get(square);
      if (piece && piece.color === game.turn()) {
        setSelectedSquare(square);
        return;
      }

      // Attempt move
      const isLegal = legalTargets.some(t => t.square === square);
      if (isLegal) {
        onMove(selectedSquare, square);
        setSelectedSquare(null);
      } else {
        setSelectedSquare(null);
      }
    }
  };

  // Drag and drop handlers
  const handleMouseDown = (e: React.MouseEvent, square: Square) => {
    if (disabled) return;
    const piece = game.get(square);
    if (!piece || piece.color !== game.turn()) return;

    setSelectedSquare(square);
    setDraggingSquare(square);
    setDragPosition({ x: e.clientX, y: e.clientY });
  };

  const handleTouchStart = (e: React.TouchEvent, square: Square) => {
    if (disabled) return;
    const piece = game.get(square);
    if (!piece || piece.color !== game.turn()) return;

    const touch = e.touches[0];
    setSelectedSquare(square);
    setDraggingSquare(square);
    setDragPosition({ x: touch.clientX, y: touch.clientY });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingSquare) {
        setDragPosition({ x: e.clientX, y: e.clientY });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (draggingSquare && e.touches[0]) {
        setDragPosition({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (draggingSquare && boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        const clientX = e.clientX;
        const clientY = e.clientY;

        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          const squareWidth = rect.width / 8;
          const squareHeight = rect.height / 8;
          const col = Math.floor((clientX - rect.left) / squareWidth);
          const row = Math.floor((clientY - rect.top) / squareHeight);

          if (col >= 0 && col < 8 && row >= 0 && row < 8) {
            const targetFile = displayFiles[col];
            const targetRank = displayRanks[row];
            const targetSquare = (targetFile + targetRank) as Square;

            if (targetSquare !== draggingSquare) {
              const isLegal = legalTargets.some(t => t.square === targetSquare);
              if (isLegal) {
                onMove(draggingSquare, targetSquare);
                setSelectedSquare(null);
              }
            }
          }
        }
        setDraggingSquare(null);
        setDragPosition(null);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (draggingSquare && boardRef.current && dragPosition) {
        const rect = boardRef.current.getBoundingClientRect();
        const clientX = dragPosition.x;
        const clientY = dragPosition.y;

        if (
          clientX >= rect.left &&
          clientX <= rect.right &&
          clientY >= rect.top &&
          clientY <= rect.bottom
        ) {
          const squareWidth = rect.width / 8;
          const squareHeight = rect.height / 8;
          const col = Math.floor((clientX - rect.left) / squareWidth);
          const row = Math.floor((clientY - rect.top) / squareHeight);

          if (col >= 0 && col < 8 && row >= 0 && row < 8) {
            const targetFile = displayFiles[col];
            const targetRank = displayRanks[row];
            const targetSquare = (targetFile + targetRank) as Square;

            if (targetSquare !== draggingSquare) {
              const isLegal = legalTargets.some(t => t.square === targetSquare);
              if (isLegal) {
                onMove(draggingSquare, targetSquare);
                setSelectedSquare(null);
              }
            }
          }
        }
        setDraggingSquare(null);
        setDragPosition(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [draggingSquare, legalTargets, displayFiles, displayRanks, dragPosition, onMove]);

  return (
    <div className="relative inline-block select-none max-w-full">
      {/* Outer Frosted Glass Chess Frame */}
      <div
        ref={boardRef}
        id="chess-board-container"
        className={`relative aspect-square w-full max-w-[560px] sm:w-[480px] md:w-[520px] lg:w-[560px] rounded-2xl overflow-hidden shadow-2xl border-4 ${theme.border} ${theme.glow} bg-black/40 grid grid-cols-8 grid-rows-8 touch-none ring-1 ring-white/20`}
      >
        {displayRanks.map((rank, rankIdx) =>
          displayFiles.map((file, fileIdx) => {
            const square = (file + rank) as Square;
            const isLight = (fileIdx + rankIdx) % 2 === 0;
            const piece = game.get(square);

            const isSelected = selectedSquare === square;
            const isLegalTarget = legalTargets.find(t => t.square === square);
            const isLastMoveSquare =
              highlightLastMove &&
              lastMove &&
              (lastMove.from === square || lastMove.to === square);
            const isKingInCheck = kingInCheckSquare === square;
            const isHiddenByDrag = draggingSquare === square;

            return (
              <div
                key={square}
                id={`square-${square}`}
                onClick={() => handleSquareClick(square)}
                onMouseDown={e => handleMouseDown(e, square)}
                onTouchStart={e => handleTouchStart(e, square)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors duration-150 ${
                  isLight ? theme.light : theme.dark
                }`}
              >
                {/* Last Move Overlay */}
                {isLastMoveSquare && (
                  <div className="absolute inset-0 bg-amber-400/35 mix-blend-multiply" />
                )}

                {/* Selected Square Highlight */}
                {isSelected && (
                  <div className="absolute inset-0 bg-yellow-400/40 border-2 border-yellow-300 shadow-[inset_0_0_12px_rgba(234,179,8,0.6)] z-10" />
                )}

                {/* Check King Red Glow */}
                {isKingInCheck && (
                  <div className="absolute inset-0 bg-rose-600/70 pulse-check shadow-[inset_0_0_20px_rgba(225,29,72,0.8)] z-10" />
                )}

                {/* Piece on Square */}
                {piece && !isHiddenByDrag && (
                  <div className="w-[85%] h-[85%] z-20 transition-transform duration-100 active:scale-95">
                    <ChessPiece
                      type={piece.type}
                      color={piece.color as PieceColor}
                      theme={pieceTheme}
                    />
                  </div>
                )}

                {/* Legal Move Indicators */}
                {showLegalMoves && isLegalTarget && (
                  <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                    {isLegalTarget.isCapture ? (
                      <div className="w-full h-full border-4 border-slate-900/40 rounded-full scale-90 transition-transform" />
                    ) : (
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-slate-900/35 rounded-full shadow-sm" />
                    )}
                  </div>
                )}

                {/* Board Coordinates */}
                {showCoordinates && (
                  <>
                    {/* Rank label on left column */}
                    {fileIdx === 0 && (
                      <span
                        className={`absolute top-1 left-1 text-[10px] font-bold select-none leading-none z-10 ${
                          isLight ? theme.lightText : theme.darkText
                        }`}
                      >
                        {rank}
                      </span>
                    )}

                    {/* File label on bottom row */}
                    {rankIdx === 7 && (
                      <span
                        className={`absolute bottom-1 right-1 text-[10px] font-bold select-none leading-none z-10 ${
                          isLight ? theme.lightText : theme.darkText
                        }`}
                      >
                        {file}
                      </span>
                    )}
                  </>
                )}
              </div>
            );
          })
        )}

        {/* UKH University Seal Watermark Overlay */}
        {boardTheme === 'ukh' && <UkhBoardWatermark />}
      </div>

      {/* Floating Dragged Piece */}
      {draggingSquare && dragPosition && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 drop-shadow-2xl scale-110"
          style={{ left: `${dragPosition.x}px`, top: `${dragPosition.y}px` }}
        >
          {(() => {
            const p = game.get(draggingSquare);
            if (!p) return null;
            return (
              <ChessPiece
                type={p.type}
                color={p.color as PieceColor}
                theme={pieceTheme}
              />
            );
          })()}
        </div>
      )}
    </div>
  );
};
