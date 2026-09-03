import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Chess, Square, Move } from 'chess.js';
import { ChessPiece } from './ChessPiece';
import { PieceThemeId, BoardThemeId, PieceColor, PieceType } from '../types/chess';
import { UkhLogo } from './UkhLogo';

interface ChessBoardProps {
  game: Chess;
  isFlipped: boolean;
  boardTheme: BoardThemeId;
  pieceTheme: PieceThemeId;
  whitePieceTheme?: PieceThemeId;
  blackPieceTheme?: PieceThemeId;
  showCoordinates: boolean;
  highlightLastMove: boolean;
  showLegalMoves: boolean;
  lastMove?: { from: string; to: string } | null;
  onMove: (from: Square, to: Square) => boolean | void;
  disabled?: boolean;
  evalScore?: number | null;
  showWeather?: boolean;
  showTerritory?: boolean;
}

const PIECE_NAMES: Record<PieceType, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};

const THEME_STYLES: Record<
  BoardThemeId,
  {
    light: string;
    dark: string;
    lightText: string;
    darkText: string;
    border: string;
    glow: string;
    /** Move markers default to dark ink; boards with dark squares override them. */
    marker?: string;
    captureRing?: string;
  }
> = {
  obsidian: {
    light: 'obsidian-texture-light bg-[#27272a]', // Zinc 800
    dark: 'obsidian-texture-dark bg-[#09090b]',  // Zinc 950
    lightText: 'text-[#a1a1aa]', // Zinc 400
    darkText: 'text-[#3f3f46]',  // Zinc 600
    border: 'border-[#3f3f46]',  // Zinc 600
    glow: 'shadow-[0_0_50px_rgba(245,158,11,0.08)]',
    marker: 'bg-[var(--secondary-accent)]/30',
    captureRing: 'border-[var(--secondary-accent)]/30'
  },
  'one-piece': {
    light: 'bg-[#0b1d3a]',
    dark: 'bg-[#d4a359]',
    lightText: 'text-[#d4a359]',
    darkText: 'text-[#0b1d3a]',
    border: 'border-[#a855f7]',
    glow: 'shadow-[0_0_40px_rgba(168,85,247,0.5)]'
  },
  batman: {
    light: 'bg-[#39445A]',
    dark: 'bg-[#0E141D]',
    lightText: 'text-[#0D1117]',
    darkText: 'text-[#FACC15]',
    border: 'border-[#FACC15]/80',
    glow: 'shadow-[0_0_35px_rgba(250,204,21,0.45)]'
  },
  'gotham-city': {
    light: 'bg-[#39445A]',
    dark: 'bg-[#0E141D]',
    lightText: 'text-[#0D1117]',
    darkText: 'text-[#FACC15]',
    border: 'border-[#FACC15]/80',
    glow: 'shadow-[0_0_35px_rgba(250,204,21,0.45)]'
  },
  aot: {
    light: 'wall-maria-stone-dark bg-[#1C221A]',
    dark: 'wall-maria-stone-light bg-[#4A5D43]',
    lightText: 'text-[#4A5D43]',
    darkText: 'text-[#1C221A]',
    border: 'border-[#2B3827]',
    glow: 'shadow-[0_0_35px_rgba(74,93,67,0.45)]'
  },
  'wall-maria': {
    light: 'wall-maria-stone-dark bg-[#1C221A]',
    dark: 'wall-maria-stone-light bg-[#4A5D43]',
    lightText: 'text-[#4A5D43]',
    darkText: 'text-[#1C221A]',
    border: 'border-[#2B3827]',
    glow: 'shadow-[0_0_35px_rgba(74,93,67,0.45)]'
  },
  classic: {
    light: 'bg-[#b58863]',
    dark: 'bg-[#f0d9b5]',
    lightText: 'text-[#f0d9b5]',
    darkText: 'text-[#b58863]',
    border: 'border-[#8B5A2B]',
    glow: 'shadow-[0_0_25px_rgba(181,136,99,0.3)]'
  },
  peshmerga: {
    light: 'bg-[#435433]',
    dark: 'bg-[#DFD0B0]',
    lightText: 'text-[#DFD0B0]',
    darkText: 'text-[#435433]',
    border: 'border-[#8C2425]',
    glow: 'shadow-[0_0_35px_rgba(245,196,83,0.35)]'
  },
  ukh: {
    light: 'bg-[#1A3B5C]',
    dark: 'bg-[#E8EEF5]',
    lightText: 'text-[#E8EEF5]',
    darkText: 'text-[#1A3B5C]',
    border: 'border-[#D4AF37]',
    glow: 'shadow-[0_0_35px_rgba(229,169,59,0.38)]'
  },
  emerald: {
    light: 'bg-[#769656]',
    dark: 'bg-[#eeeed2]',
    lightText: 'text-[#eeeed2]',
    darkText: 'text-[#769656]',
    border: 'border-[#4a6333]',
    glow: 'shadow-[0_0_30px_rgba(118,150,86,0.25)]'
  },
  wood: {
    light: 'bg-[#9c6a38]',
    dark: 'bg-[#e2c499]',
    lightText: 'text-[#e2c499]',
    darkText: 'text-[#9c6a38]',
    border: 'border-[#5e381b]',
    glow: 'shadow-[0_0_30px_rgba(156,106,56,0.3)]'
  },
  ocean: {
    light: 'bg-[#678292]',
    dark: 'bg-[#dee3e6]',
    lightText: 'text-[#dee3e6]',
    darkText: 'text-[#678292]',
    border: 'border-[#3f525d]',
    glow: 'shadow-[0_0_30px_rgba(103,130,146,0.3)]'
  },
  midnight: {
    light: 'bg-[#1a1a2e]',
    dark: 'bg-[#16213e]',
    lightText: 'text-[#4e5d7a]',
    darkText: 'text-[#0f3460]',
    border: 'border-[#0f3460]',
    glow: 'shadow-[0_0_50px_rgba(15,52,96,0.4)]',
    marker: 'bg-blue-400/30',
    captureRing: 'border-blue-400/40'
  },
  premium: {
    light: 'bg-[#1e293b]', // Slate 800ish
    dark: 'bg-[#0f172a]',  // Slate 900ish
    lightText: 'text-slate-500',
    darkText: 'text-slate-400',
    border: 'border-slate-700',
    glow: 'shadow-[0_20px_50px_rgba(0,0,0,0.5)]',
    marker: 'bg-emerald-400/40',
    captureRing: 'border-emerald-400/50'
  },
  marble: {
    light: 'bg-[#8ca2b0]',
    dark: 'bg-[#e8ebf0]',
    lightText: 'text-[#e8ebf0]',
    darkText: 'text-[#8ca2b0]',
    border: 'border-[#596d79]',
    glow: 'shadow-[0_0_30px_rgba(140,162,176,0.3)]'
  },
  custom: {
    light: 'bg-[var(--board-dark,#769656)]',
    dark: 'bg-[var(--board-light,#eeeed2)]',
    lightText: 'text-[var(--board-light,#eeeed2)]',
    darkText: 'text-[var(--board-dark,#769656)]',
    border: 'border-[var(--board-border,#4a6333)]',
    glow: 'shadow-[0_0_30px_var(--accent-glow,rgba(59,130,246,0.35))]'
  }
};

// Bat-Signal & Gotham Skyline Board Watermark

// Peshmerga Royal Board Watermark
const PeshmergaBoardWatermark: React.FC = () => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[8] select-none overflow-hidden p-6">
      <div className="w-[85%] h-[85%] opacity-35 transition-opacity duration-500 drop-shadow-[0_0_35px_rgba(245,196,83,0.45)] flex items-center justify-center relative">
        {!imgFailed ? (
          <img
            src="https://i.pinimg.com/originals/57/08/bb/5708bbf5c87fcc41897a809d11e96064.jpg"
            alt="Peshmerga Royal Kurdistan"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain mix-blend-multiply filter contrast-125 brightness-90 drop-shadow-[0_0_20px_rgba(245,196,83,0.3)]"
            onError={() => setImgFailed(true)}
          />
        ) : null}
      </div>
    </div>
  );
};

const BatmanBoardWatermark: React.FC = () => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[8] select-none overflow-hidden p-6">
      <div className="w-[85%] h-[85%] opacity-35 transition-opacity duration-500 drop-shadow-[0_0_35px_rgba(234,179,8,0.45)] flex items-center justify-center relative">
        {!imgFailed ? (
          <img
            src="https://www.highreshdwallpapers.com/wp-content/uploads/2015/02/Awesome-Batman-Bat-Symbol.jpg"
            alt="Awesome Batman Bat Symbol"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain mix-blend-screen filter contrast-125 brightness-110 drop-shadow-[0_0_20px_rgba(234,179,8,0.7)]"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.tried) {
                target.dataset.tried = 'true';
                target.src = 'https://th.bing.com/th/id/R.bf20590eed51d6f6ccf21349f901e9d3?rik=Gn63b87H%2f%2bGKFQ&pid=ImgRaw&r=0';
              } else {
                setImgFailed(true);
              }
            }}
          />
        ) : (
          <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M 5 85 L 5 65 L 12 65 L 12 55 L 18 55 L 18 70 L 25 70 L 25 45 L 32 45 L 32 60 L 38 60 L 38 40 L 44 40 L 44 50 L 52 50 L 52 35 L 58 35 L 58 50 L 65 50 L 65 42 L 72 42 L 72 60 L 78 60 L 78 48 L 85 48 L 85 68 L 95 68 L 95 85 Z"
              fill="#1E293B"
              opacity="0.6"
            />
            <polygon points="50,90 20,20 80,20" fill="#EAB308" opacity="0.12" />
            <ellipse cx="50" cy="35" rx="22" ry="14" fill="#EAB308" stroke="#CA8A04" strokeWidth="1.5" opacity="0.85" />
            <path
              d="M 37 35 C 37 30 42 31 50 36 C 58 31 63 30 63 35 C 61.5 39 58 41 50 38.5 C 42 41 38.5 39 37 35 Z"
              fill="#0F172A"
            />
            <polygon points="48,27 50,30 52,27" fill="#0F172A" />
          </svg>
        )}
      </div>
    </div>
  );
};

// UKH Official University Erbil Citadel Emblem Board Watermark
const UkhBoardWatermark: React.FC = () => (
  <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[8] select-none overflow-hidden p-6">
    <div className="w-[82%] h-[82%] opacity-35 transition-opacity duration-300 drop-shadow-[0_0_25px_rgba(22,91,170,0.35)]">
      <UkhLogo showText={true} textColor="#DFD0B0" />
    </div>
  </div>
);
// Attack on Titan: Wall Maria Battlement & Wings of Freedom Board Watermark
const AotBoardWatermark: React.FC = () => {
  const [imgFailed, setImgFailed] = useState(false);

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[8] select-none overflow-hidden p-6">
      <div className="w-[82%] h-[82%] opacity-30 transition-opacity duration-500 drop-shadow-[0_0_30px_rgba(34,197,94,0.4)] flex items-center justify-center relative">
        {!imgFailed ? (
          <img
            src="https://wallpaperaccess.com/full/279002.jpg"
            alt="Attack on Titan Wings of Freedom"
            referrerPolicy="no-referrer"
            className="w-full h-full object-contain mix-blend-screen filter contrast-125 brightness-110 drop-shadow-[0_0_20px_rgba(37,99,235,0.6)]"
            onError={(e) => {
              const target = e.currentTarget;
              if (!target.dataset.tried) {
                target.dataset.tried = 'true';
                target.src = 'https://th.bing.com/th/id/R.f8555069fe528bd92d0f7fe1323bddf1?rik=0syxADwAFinCeQ&pid=ImgRaw&r=0';
              } else {
                setImgFailed(true);
              }
            }}
          />
        ) : (
          <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            {/* Wall Maria Stone Battlements Silhouette */}
            <path
              d="M 10 75 L 10 50 L 18 50 L 18 56 L 26 56 L 26 50 L 34 50 L 34 56 L 42 56 L 42 50 L 58 50 L 58 56 L 66 56 L 66 50 L 74 50 L 74 56 L 82 56 L 82 50 L 90 50 L 90 75 Z"
              fill="#5D6F54"
              opacity="0.5"
            />
            {/* Crossed ODM Slasher Blades */}
            <path d="M 15 80 L 85 20 M 85 80 L 15 20" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 12 83 L 18 77 M 82 83 L 88 77" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
            {/* Central Wings of Freedom Shield */}
            <path
              d="M 36 30 L 64 30 C 64 30 66 52 50 68 C 34 52 36 30 36 30 Z"
              fill="#1E293B"
              stroke="#F59E0B"
              strokeWidth="2"
            />
            {/* Left Wing (Blue) */}
            <path
              d="M 43 50 C 41 45 40 38 42 34 C 44 36 46 39 46 42 C 46 38 48 35 49 33 C 50 36 49 42 47 48 Z"
              fill="#2563EB"
            />
            {/* Right Wing (White) */}
            <path
              d="M 57 50 C 59 45 60 38 58 34 C 56 36 54 39 54 42 C 54 38 52 35 51 33 C 50 36 51 42 53 48 Z"
              fill="#F8FAFC"
            />
          </svg>
        )}
      </div>
    </div>
  );
};

interface ActivePiece {
  id: string;
  type: PieceType;
  color: PieceColor;
  square: Square;
}

export const ChessBoard: React.FC<ChessBoardProps> = React.memo(({
  game,
  isFlipped,
  boardTheme,
  pieceTheme,
  whitePieceTheme,
  blackPieceTheme,
  showCoordinates,
  highlightLastMove,
  showLegalMoves,
  lastMove,
  onMove,
  disabled = false,
  evalScore,
  showWeather = false,
  showTerritory = false
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [draggingSquare, setDraggingSquare] = useState<Square | null>(null);

  const boardRef = useRef<HTMLDivElement>(null);
  const dragPieceRef = useRef<HTMLDivElement>(null);
  const dragPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const pointerStartPosRef = useRef<{ x: number; y: number; square: Square | null }>({ x: 0, y: 0, square: null });
  const isActivelyDraggingRef = useRef<boolean>(false);
  const ignoreNextClickRef = useRef<boolean>(false);
  const rafRef = useRef<number | null>(null);

  // Keep previous board map for diffing and rotation tracking
  const prevBoardMapRef = useRef<Map<Square, { type: PieceType; color: PieceColor }>>(new Map());
  const prevFlippedRef = useRef<boolean>(isFlipped);
  const [isRotating, setIsRotating] = useState(false);

  useEffect(() => {
    if (prevFlippedRef.current !== isFlipped) {
      prevFlippedRef.current = isFlipped;
      setIsRotating(true);
      const timer = setTimeout(() => setIsRotating(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isFlipped]);

  // Active Pieces State for Smooth Motion Transitions
  const [activePieces, setActivePieces] = useState<ActivePiece[]>(() => {
    const initial: ActivePiece[] = [];
    const counts: Record<string, number> = {};
    const bState = game.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = bState[r][f];
        if (piece) {
          const fileStr = String.fromCharCode('a'.charCodeAt(0) + f);
          const rankStr = (8 - r).toString();
          const sq = (fileStr + rankStr) as Square;
          const key = `${piece.color}_${piece.type}`;
          counts[key] = (counts[key] || 0) + 1;
          initial.push({
            id: `${key}_${counts[key]}_${sq}`,
            type: piece.type,
            color: piece.color as PieceColor,
            square: sq
          });
        }
      }
    }
    return initial;
  });

  const fen = game.fen();

  // Reconcile and track persistent piece IDs across moves & board updates
  useEffect(() => {
    const currentBoard = game.board();
    const currentOccupied: { square: Square; type: PieceType; color: PieceColor }[] = [];
    const currentBoardMap = new Map<Square, { type: PieceType; color: PieceColor }>();

    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const p = currentBoard[r][f];
        if (p) {
          const fileStr = String.fromCharCode('a'.charCodeAt(0) + f);
          const rankStr = (8 - r).toString();
          const sq = (fileStr + rankStr) as Square;
          currentOccupied.push({
            square: sq,
            type: p.type,
            color: p.color as PieceColor
          });
          currentBoardMap.set(sq, { type: p.type, color: p.color as PieceColor });
        }
      }
    }

    setActivePieces(prevPieces => {
      // If previous pieces were empty or board was completely reset (e.g. new game)
      if (prevPieces.length === 0 || Math.abs(prevPieces.length - currentOccupied.length) > 3 && !lastMove) {
        const counts: Record<string, number> = {};
        prevBoardMapRef.current = currentBoardMap;
        return currentOccupied.map(p => {
          const key = `${p.color}_${p.type}`;
          counts[key] = (counts[key] || 0) + 1;
          return {
            id: `${key}_${counts[key]}_${p.square}`,
            type: p.type,
            color: p.color,
            square: p.square
          };
        });
      }

      const nextPieces: ActivePiece[] = [];
      const usedPrevIds = new Set<string>();
      const unplacedOccupied = [...currentOccupied];

      // 1. If we have a recorded lastMove, prioritize moving the piece at from -> to
      if (lastMove) {
        const fromSq = lastMove.from as Square;
        const toSq = lastMove.to as Square;

        const movingPiece = prevPieces.find(p => p.square === fromSq && !usedPrevIds.has(p.id));
        const targetOccIndex = unplacedOccupied.findIndex(o => o.square === toSq);

        if (movingPiece && targetOccIndex !== -1) {
          const targetOcc = unplacedOccupied[targetOccIndex];
          nextPieces.push({
            id: movingPiece.id,
            type: targetOcc.type, // handles pawn promotion
            color: targetOcc.color,
            square: toSq
          });
          usedPrevIds.add(movingPiece.id);
          unplacedOccupied.splice(targetOccIndex, 1);
        }

        // Handle Castling: White/Black King & Rook simultaneous slide
        let castlingRookFrom: Square | null = null;
        let castlingRookTo: Square | null = null;
        if (fromSq === 'e1' && toSq === 'g1') { castlingRookFrom = 'h1'; castlingRookTo = 'f1'; }
        else if (fromSq === 'e1' && toSq === 'c1') { castlingRookFrom = 'a1'; castlingRookTo = 'd1'; }
        else if (fromSq === 'e8' && toSq === 'g8') { castlingRookFrom = 'h8'; castlingRookTo = 'f8'; }
        else if (fromSq === 'e8' && toSq === 'c8') { castlingRookFrom = 'a8'; castlingRookTo = 'd8'; }

        if (castlingRookFrom && castlingRookTo) {
          const rookPiece = prevPieces.find(p => p.square === castlingRookFrom && !usedPrevIds.has(p.id));
          const rookOccIndex = unplacedOccupied.findIndex(o => o.square === castlingRookTo);
          if (rookPiece && rookOccIndex !== -1) {
            const rookOcc = unplacedOccupied[rookOccIndex];
            nextPieces.push({
              id: rookPiece.id,
              type: rookOcc.type,
              color: rookOcc.color,
              square: castlingRookTo
            });
            usedPrevIds.add(rookPiece.id);
            unplacedOccupied.splice(rookOccIndex, 1);
          }
        }
      }

      // 2. Diffing fallback: if lastMove is not supplied (e.g. puzzle / direct FEN step)
      if (!lastMove && prevBoardMapRef.current.size > 0) {
        const vacated: { square: Square; type: PieceType; color: PieceColor }[] = [];
        for (const [sq, p] of prevBoardMapRef.current.entries()) {
          const cur = currentBoardMap.get(sq);
          if (!cur || cur.color !== p.color || cur.type !== p.type) {
            vacated.push({ square: sq, type: p.type, color: p.color });
          }
        }

        if (vacated.length === 1 && unplacedOccupied.length > 0) {
          const vac = vacated[0];
          const movingPiece = prevPieces.find(p => p.square === vac.square && !usedPrevIds.has(p.id));
          const targetOccIndex = unplacedOccupied.findIndex(o => {
            const prevAtO = prevBoardMapRef.current.get(o.square);
            return !prevAtO || prevAtO.color !== o.color;
          });
          if (movingPiece && targetOccIndex !== -1) {
            const targetOcc = unplacedOccupied[targetOccIndex];
            nextPieces.push({
              id: movingPiece.id,
              type: targetOcc.type,
              color: targetOcc.color,
              square: targetOcc.square
            });
            usedPrevIds.add(movingPiece.id);
            unplacedOccupied.splice(targetOccIndex, 1);
          }
        }
      }

      // 3. Match exact stationary pieces (same square, color, type)
      for (let i = unplacedOccupied.length - 1; i >= 0; i--) {
        const occ = unplacedOccupied[i];
        const match = prevPieces.find(
          p => !usedPrevIds.has(p.id) && p.square === occ.square && p.color === occ.color && p.type === occ.type
        );
        if (match) {
          nextPieces.push({
            id: match.id,
            type: occ.type,
            color: occ.color,
            square: occ.square
          });
          usedPrevIds.add(match.id);
          unplacedOccupied.splice(i, 1);
        }
      }

      // 4. Match remaining pieces of same color and type
      for (let i = unplacedOccupied.length - 1; i >= 0; i--) {
        const occ = unplacedOccupied[i];
        const match = prevPieces.find(
          p => !usedPrevIds.has(p.id) && p.color === occ.color && p.type === occ.type
        );
        if (match) {
          nextPieces.push({
            id: match.id,
            type: occ.type,
            color: occ.color,
            square: occ.square
          });
          usedPrevIds.add(match.id);
          unplacedOccupied.splice(i, 1);
        }
      }

      // 5. Any newly spawned pieces get unique fresh IDs
      const timestamp = Date.now();
      let newCount = 0;
      for (const occ of unplacedOccupied) {
        newCount++;
        nextPieces.push({
          id: `${occ.color}_${occ.type}_${timestamp}_${newCount}`,
          type: occ.type,
          color: occ.color,
          square: occ.square
        });
      }

      prevBoardMapRef.current = currentBoardMap;
      return nextPieces;
    });
  }, [fen, lastMove]);

  const theme = THEME_STYLES[boardTheme] || THEME_STYLES.emerald;
  const isAotBoard = boardTheme === 'aot' || boardTheme === 'wall-maria';
  const isBatmanBoard = boardTheme === 'batman' || boardTheme === 'gotham-city';
  const isOnePieceBoard = boardTheme === 'one-piece';
  const isPeshmergaBoard = boardTheme === 'peshmerga';

  // Board ranks and files
  const files = useMemo(() => ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'], []);
  const ranks = useMemo(() => ['8', '7', '6', '5', '4', '3', '2', '1'], []);

  const displayFiles = useMemo(() => isFlipped ? [...files].reverse() : files, [isFlipped, files]);
  const displayRanks = useMemo(() => isFlipped ? [...ranks].reverse() : ranks, [isFlipped, ranks]);

  // Calculate territory heat map
  const territoryMap = useMemo(() => {
    const map = new Map<Square, 'w' | 'b' | 'both'>();
    if (!showTerritory) return map;
    try {
      const allFiles = ['a','b','c','d','e','f','g','h'];
      const allRanks = ['1','2','3','4','5','6','7','8'];
      for (const f of allFiles) {
        for (const r of allRanks) {
          const sq = (f + r) as Square;
          const byW = game.isAttacked(sq, 'w');
          const byB = game.isAttacked(sq, 'b');
          if (byW && byB) map.set(sq, 'both');
          else if (byW) map.set(sq, 'w');
          else if (byB) map.set(sq, 'b');
        }
      }
    } catch {}
    return map;
  }, [fen, showTerritory, game]);

  // Find king square in check
  const kingInCheckSquare = useMemo(() => {
    if (!game.inCheck()) return null;
    const turn = game.turn();
    const boardState = game.board();
    for (let r = 0; r < 8; r++) {
      for (let f = 0; f < 8; f++) {
        const piece = boardState[r][f];
        if (piece && piece.type === 'k' && piece.color === turn) {
          const fileStr = String.fromCharCode('a'.charCodeAt(0) + f);
          const rankStr = (8 - r).toString();
          return (fileStr + rankStr) as Square;
        }
      }
    }
    return null;
  }, [game]);

  // Calculate legal moves for selected square synchronously
  const legalTargets = useMemo(() => {
    if (!selectedSquare || disabled) return [];
    try {
      const moves = game.moves({ square: selectedSquare, verbose: true });
      return moves.map((m: Move) => ({
        square: m.to as Square,
        isCapture: !!m.captured || m.flags.includes('e')
      }));
    } catch {
      return [];
    }
  }, [selectedSquare, game, disabled]);

  // Reset selected square when disabled or game turn changes
  useEffect(() => {
    if (disabled) {
      setSelectedSquare(null);
      setDraggingSquare(null);
    }
  }, [disabled]);

  // Update floating dragged piece position via GPU transform
  const updateDragElementPosition = (x: number, y: number) => {
    dragPosRef.current = { x, y };
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        if (dragPieceRef.current) {
          dragPieceRef.current.style.transform = `translate3d(${dragPosRef.current.x - 32}px, ${dragPosRef.current.y - 32}px, 0px)`;
        }
        rafRef.current = null;
      });
    }
  };

  // Convert screen coordinates to Board Square
  const getSquareFromCoords = useCallback((clientX: number, clientY: number): Square | null => {
    if (!boardRef.current) return null;
    const rect = boardRef.current.getBoundingClientRect();
    if (
      clientX < rect.left ||
      clientX > rect.right ||
      clientY < rect.top ||
      clientY > rect.bottom
    ) {
      return null;
    }

    const squareWidth = rect.width / 8;
    const squareHeight = rect.height / 8;
    const col = Math.min(7, Math.max(0, Math.floor((clientX - rect.left) / squareWidth)));
    const row = Math.min(7, Math.max(0, Math.floor((clientY - rect.top) / squareHeight)));

    const file = displayFiles[col];
    const rank = displayRanks[row];
    return (file + rank) as Square;
  }, [displayFiles, displayRanks]);

  // Handle Square Selection & Click-to-Move
  const handleSquareClick = (square: Square) => {
    if (disabled) return;
    if (ignoreNextClickRef.current) {
      ignoreNextClickRef.current = false;
      return;
    }

    const clickedPiece = game.get(square);
    const isCurrentPlayerPiece = clickedPiece && clickedPiece.color === game.turn();

    if (selectedSquare === null) {
      // If clicking current player's piece, select it
      if (isCurrentPlayerPiece) {
        setSelectedSquare(square);
      }
    } else {
      // Already have a selected square
      if (selectedSquare === square) {
        // Deselect when clicking same square
        setSelectedSquare(null);
        return;
      }

      if (isCurrentPlayerPiece) {
        // Switch selection to another own piece
        setSelectedSquare(square);
        return;
      }

      // Target square is either empty or enemy piece: check legal move
      const isLegal = legalTargets.some(t => t.square === square);
      if (isLegal) {
        onMove(selectedSquare, square);
        setSelectedSquare(null);
      } else {
        setSelectedSquare(null);
      }
    }
  };

  // Pointer / Mouse Down
  const handlePointerDown = (clientX: number, clientY: number, square: Square) => {
    if (disabled) return;
    const piece = game.get(square);
    if (!piece || piece.color !== game.turn()) {
      return;
    }

    pointerStartPosRef.current = { x: clientX, y: clientY, square };
    isActivelyDraggingRef.current = false;
    updateDragElementPosition(clientX, clientY);
  };

  // Pointer / Mouse Move
  const handlePointerMove = useCallback((clientX: number, clientY: number) => {
    const start = pointerStartPosRef.current;
    if (!start.square) return;

    const dx = clientX - start.x;
    const dy = clientY - start.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If moved more than 4px, activate dragging
    if (dist >= 4 && !isActivelyDraggingRef.current) {
      isActivelyDraggingRef.current = true;
      setSelectedSquare(start.square);
      setDraggingSquare(start.square);
    }

    if (isActivelyDraggingRef.current) {
      updateDragElementPosition(clientX, clientY);
    }
  }, []);

  // Pointer / Mouse Up / Drop
  const handlePointerUp = useCallback((clientX: number, clientY: number) => {
    const start = pointerStartPosRef.current;
    const wasDragging = isActivelyDraggingRef.current;

    // Reset tracking refs
    pointerStartPosRef.current = { x: 0, y: 0, square: null };
    isActivelyDraggingRef.current = false;
    setDraggingSquare(null);

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (wasDragging && start.square) {
      ignoreNextClickRef.current = true;
      setTimeout(() => {
        ignoreNextClickRef.current = false;
      }, 50);

      const targetSquare = getSquareFromCoords(clientX, clientY);
      if (targetSquare && targetSquare !== start.square) {
        try {
          const legalMoves = game.moves({ square: start.square, verbose: true });
          const isLegal = legalMoves.some((m: Move) => m.to === targetSquare);
          if (isLegal) {
            setActivePieces(prev => {
              const moving = prev.find(p => p.square === start.square);
              if (!moving) return prev;
              return prev
                .filter(p => p.square !== targetSquare)
                .map(p => (p.id === moving.id ? { ...p, square: targetSquare } : p));
            });
            onMove(start.square, targetSquare);
            setSelectedSquare(null);
            return;
          }
        } catch {}
        setSelectedSquare(null);
      } else if (targetSquare === start.square) {
        // Dropped back on same square: keep selected for click-to-move
        setSelectedSquare(start.square);
      } else {
        setSelectedSquare(null);
      }
    }
  }, [game, getSquareFromCoords, onMove]);

  // Global window listeners for drag tracking
  useEffect(() => {
    const onWindowMouseMove = (e: MouseEvent) => {
      if (pointerStartPosRef.current.square) {
        handlePointerMove(e.clientX, e.clientY);
      }
    };

    const onWindowMouseUp = (e: MouseEvent) => {
      if (pointerStartPosRef.current.square) {
        handlePointerUp(e.clientX, e.clientY);
      }
    };

    const onWindowTouchMove = (e: TouchEvent) => {
      if (pointerStartPosRef.current.square && e.touches[0]) {
        if (isActivelyDraggingRef.current && e.cancelable) {
          e.preventDefault();
        }
        handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onWindowTouchEnd = (e: TouchEvent) => {
      if (pointerStartPosRef.current.square) {
        const lastTouch = e.changedTouches[0];
        const clientX = lastTouch ? lastTouch.clientX : dragPosRef.current.x;
        const clientY = lastTouch ? lastTouch.clientY : dragPosRef.current.y;
        handlePointerUp(clientX, clientY);
      }
    };

    window.addEventListener('mousemove', onWindowMouseMove, { passive: true });
    window.addEventListener('mouseup', onWindowMouseUp);
    window.addEventListener('touchmove', onWindowTouchMove, { passive: false });
    window.addEventListener('touchend', onWindowTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onWindowMouseMove);
      window.removeEventListener('mouseup', onWindowMouseUp);
      window.removeEventListener('touchmove', onWindowTouchMove);
      window.removeEventListener('touchend', onWindowTouchEnd);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [handlePointerMove, handlePointerUp]);

  return (
    <div className="relative block w-full flex-1 min-w-[240px] max-w-[min(600px,88svh)] select-none touch-none mx-auto p-2 sm:p-4 board-3d-frame rounded-2xl" dir="ltr">
      {/* 3D Rim Lighting for tactical feel */}
      <div className="absolute inset-0 rounded-2xl pointer-events-none shadow-[inset_0_2px_4px_rgba(255,255,255,0.1),inset_0_-2px_4px_rgba(0,0,0,0.4)] z-50" />
      
      {/* Outer Frosted Glass Chess Frame */}
      <div
        ref={boardRef}
        id="chess-board-container"
        data-board-theme={boardTheme}
        role="grid"
        aria-label="Chess board"
        className={`relative aspect-square w-full rounded-xl overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.9)] border border-white/5 ${theme.glow} bg-[#111827] grid grid-cols-8 grid-rows-8 touch-none will-change-transform`}
        style={{ willChange: 'transform' }}
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
                onMouseDown={e => {
                  if (e.button === 0) {
                    handlePointerDown(e.clientX, e.clientY, square);
                  }
                }}
                onTouchStart={e => {
                  if (e.touches[0]) {
                    handlePointerDown(e.touches[0].clientX, e.touches[0].clientY, square);
                  }
                }}
                role="gridcell"
                aria-label={`${square}${piece ? `, ${piece.color === 'w' ? 'white' : 'black'} ${PIECE_NAMES[piece.type]}` : ', empty'}${isLegalTarget ? `, ${isLegalTarget.isCapture ? 'capture' : 'legal'} move` : ''}`}
                aria-selected={isSelected}
                className={`relative flex items-center justify-center transition-all duration-200 ${
                  piece || isLegalTarget ? 'cursor-pointer' : 'cursor-default'
                } ${isLight ? theme.light : theme.dark} group`}
              >
                {/* Gradient Square Overlays for Premium Look */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                
                {/* Last Move Overlay */}
                {isLastMoveSquare && (
                  <div className="absolute inset-0 bg-yellow-500/20 border border-yellow-400/30 shadow-[inset_0_0_12px_rgba(234,179,8,0.2)] pointer-events-none z-10" />
                )}

                {/* Selected Square Highlight (ODM Gas Glow Aura for AoT, Bat-Signal Yellow for Batman) */}
                {isSelected && (
                  isAotBoard ? (
                    <div className="absolute inset-0 bg-emerald-500/25 aot-odm-gas-aura border-2 border-emerald-400 shadow-[inset_0_0_18px_rgba(34,197,94,0.7),0_0_24px_rgba(34,197,94,0.5)] z-10 pointer-events-none" />
                  ) : isBatmanBoard ? (
                    <div className="absolute inset-0 bg-yellow-400/30 border-2 border-yellow-400 shadow-[inset_0_0_18px_rgba(234,179,8,0.7),0_0_25px_rgba(234,179,8,0.6)] z-10 pointer-events-none" />
                  ) : isOnePieceBoard ? (
                    <div className="absolute inset-0 bg-purple-500/20 haki-aura-active border-2 border-purple-400 z-10 pointer-events-none overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-purple-800/40 via-transparent to-purple-800/20 mix-blend-overlay" />
                      {/* Conqueror's Haki Lightning Bolts */}
                      <div className="haki-lightning-particle top-1 left-2 h-6" style={{ animationDelay: '0.1s' }} />
                      <div className="haki-lightning-particle top-3 right-3 h-8" style={{ animationDelay: '0.4s' }} />
                      <div className="haki-lightning-particle bottom-2 left-1/2 h-5" style={{ animationDelay: '0.8s' }} />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-yellow-400/40 border-2 border-yellow-300 shadow-[inset_0_0_12px_rgba(234,179,8,0.6)] z-10 pointer-events-none" />
                  )
                )}

                {/* Territory Heat Map Overlay */}
                {showTerritory && territoryMap.has(square) && (
                  <div className={`absolute inset-0 z-[5] pointer-events-none mix-blend-color-burn dark:mix-blend-color-dodge transition-colors duration-500 opacity-30 ${
                    territoryMap.get(square) === 'w' ? 'bg-emerald-500' :
                    territoryMap.get(square) === 'b' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} />
                )}

                {/* Check King Red Steam Glow */}
                {isKingInCheck && (
                  isAotBoard ? (
                    <div className="absolute inset-0 bg-red-600/75 aot-steam-danger z-10 pointer-events-none overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-red-800/80 via-rose-600/50 to-transparent" />
                      <div className="absolute top-1 left-2 w-3 h-3 rounded-full bg-red-200/70 aot-steam-particle" />
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-rose-200/60 aot-steam-particle" style={{ animationDelay: '0.4s' }} />
                      <div className="absolute bottom-2 left-3 w-3.5 h-3.5 rounded-full bg-red-100/50 aot-steam-particle" style={{ animationDelay: '0.8s' }} />
                    </div>
                  ) : isOnePieceBoard ? (
                    <div className="absolute inset-0 bg-red-600/70 aot-steam-danger z-10 pointer-events-none overflow-hidden mix-blend-color-burn">
                      <div className="absolute inset-0 bg-gradient-to-t from-orange-600/80 via-red-600/50 to-transparent" />
                      <div className="absolute top-1 left-2 w-3 h-3 rounded-full bg-orange-300/70 aot-steam-particle" />
                      <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-orange-400/60 aot-steam-particle" style={{ animationDelay: '0.4s' }} />
                      <div className="absolute bottom-2 left-3 w-3.5 h-3.5 rounded-full bg-red-400/50 aot-steam-particle" style={{ animationDelay: '0.8s' }} />
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-rose-600/70 pulse-check shadow-[inset_0_0_20px_rgba(225,29,72,0.8)] z-10 pointer-events-none" />
                  )
                )}

                {/* Legal Move Indicators (ODM Green Vapor for AoT, Bat-Signal Yellow for Batman) */}
                {showLegalMoves && isLegalTarget && (
                  <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
                    {isLegalTarget.isCapture ? (
                      isAotBoard ? (
                        <div className="w-[88%] h-[88%] border-4 border-emerald-400 shadow-[0_0_14px_rgba(34,197,94,0.85)] rounded-full scale-95 transition-transform" />
                      ) : isBatmanBoard ? (
                        <div className="w-[88%] h-[88%] border-4 border-yellow-400 shadow-[0_0_14px_rgba(234,179,8,0.85)] rounded-full scale-95 transition-transform" />
                      ) : (
                        <div className={`w-[85%] h-[85%] border-4 rounded-full scale-95 transition-transform ${theme.captureRing || 'border-slate-900/40'}`} />
                      )
                    ) : (
                      isAotBoard ? (
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-emerald-400 shadow-[0_0_12px_rgba(34,197,94,0.9)] aot-odm-vapor rounded-full ring-2 ring-emerald-300/80" />
                      ) : isBatmanBoard ? (
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 bg-yellow-400 shadow-[0_0_12px_rgba(234,179,8,0.9)] rounded-full ring-2 ring-yellow-300/80" />
                      ) : (
                        <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shadow-sm ${theme.marker || 'bg-slate-900/35'}`} />
                      )
                    )}
                  </div>
                )}

                {/* Board Coordinates - Engraved Look */}
                {showCoordinates && (
                  <>
                    {/* Rank label on left column */}
                    {fileIdx === 0 && (
                      <span
                        className={`absolute top-1.5 left-1.5 text-[10px] font-black select-none leading-none z-15 pointer-events-none opacity-80 uppercase tracking-tighter ${
                          isLight ? theme.lightText : theme.darkText
                        }`}
                      >
                        {rank}
                      </span>
                    )}
                    {/* File label on bottom row */}
                    {rankIdx === 7 && (
                      <span
                        className={`absolute bottom-1.5 right-1.5 text-[10px] font-black select-none leading-none z-15 pointer-events-none opacity-80 uppercase tracking-tighter ${
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

        {/* Checkmate / Draw Overlays */}
        <AnimatePresence>
          {game.isGameOver() && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none"
            >
              <div className="text-center space-y-2 p-6 rounded-3xl bg-black/80 border border-white/10 shadow-2xl">
                <h2 className="text-3xl font-black text-[#F5C453] uppercase tracking-widest animate-pulse">
                  {game.isCheckmate() ? 'Checkmate' : 'Game Over'}
                </h2>
                <p className="text-xs text-white/60 font-medium">
                  {game.isCheckmate() ? (game.turn() === 'w' ? 'Black Wins' : 'White Wins') : 'Draw'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Animated Pieces Overlay Layer with Framer Motion Spring Transitions */}
        <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          <AnimatePresence initial={false}>
            {activePieces.map(p => {
              const file = p.square[0];
              const rank = p.square[1];
              const colIdx = displayFiles.indexOf(file);
              const rankIdx = displayRanks.indexOf(rank);

              if (colIdx === -1 || rankIdx === -1) return null;

              const isHiddenByDrag = draggingSquare === p.square;
              const themeToUse =
                p.color === 'w'
                  ? (whitePieceTheme || pieceTheme)
                  : (blackPieceTheme || pieceTheme);

              return (
                <motion.div
                  key={p.id}
                  id={`piece-${p.id}`}
                  initial={false}
                  animate={{
                    x: `${colIdx * 100}%`,
                    y: `${rankIdx * 100}%`,
                    opacity: isHiddenByDrag ? 0 : 1,
                    scale: isHiddenByDrag ? 0.9 : 1
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.3,
                    transition: { duration: 0.1, ease: 'easeOut' }
                  }}
                  transition={
                    isRotating
                      ? { duration: 0 }
                      : {
                          type: 'spring',
                          stiffness: 480,
                          damping: 26,
                          mass: 0.5
                        }
                  }
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '12.5%',
                    height: '12.5%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    willChange: 'transform'
                  }}
                >
                  <div
                    className="chess-board-piece w-[85%] h-[85%] flex items-center justify-center pointer-events-none select-none"
                    data-piece-color={p.color}
                  >
                    <ChessPiece
                      type={p.type}
                      color={p.color}
                      theme={themeToUse}
                    />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* UKH University Seal Watermark Overlay */}
        {boardTheme === 'ukh' && <UkhBoardWatermark />}

        {/* Attack on Titan Wall Maria & Wings of Freedom Watermark Overlay */}
        {isAotBoard && <AotBoardWatermark />}
        {isPeshmergaBoard && <PeshmergaBoardWatermark />}

        {/* Batman Gotham City Skyline & Bat-Signal Watermark Overlay */}
        {isBatmanBoard && <BatmanBoardWatermark />}

        {/* One Piece Wano Watermark Overlay */}

        <div className="pointer-events-none absolute inset-0 z-20 rounded-xl bg-[radial-gradient(130%_100%_at_50%_-10%,rgba(255,255,255,0.07),transparent_55%)] shadow-[inset_0_0_70px_-20px_rgba(0,0,0,0.85)]" />
      </div>

      {/* Weather Overlay */}
      {showWeather && typeof evalScore === 'number' && (
        <div className="absolute inset-0 z-25 pointer-events-none overflow-hidden rounded-2xl mix-blend-screen opacity-70">
          {evalScore > 2 && (
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-300/30 to-orange-400/10 animate-pulse pointer-events-none" />
          )}
          {evalScore < -2 && (
            <div className="absolute inset-0 bg-slate-900/40 pointer-events-none flex flex-col justify-between">
              <div className="w-full h-full absolute inset-0 animate-[flash_3s_ease-out_infinite] bg-white/20 opacity-0" />
              {/* Rain lines */}
              <div className="w-full h-full relative overflow-hidden">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="absolute w-[1px] h-12 bg-white/40 animate-rain" style={{ left: `${Math.random() * 100}%`, animationDuration: `${0.3 + Math.random() * 0.2}s`, animationDelay: `${Math.random() * 0.5}s` }} />
                ))}
              </div>
            </div>
          )}
          {Math.abs(evalScore) <= 0.5 && (
            <div className="absolute inset-0 bg-slate-300/10 backdrop-blur-[1px] animate-[pulse_4s_ease-in-out_infinite] pointer-events-none" />
          )}
        </div>
      )}

      {/* Floating Dragged Piece with 120 FPS GPU Transform */}
      {draggingSquare && (
        <div
          ref={dragPieceRef}
          className="fixed pointer-events-none z-50 w-16 h-16 scale-110 top-0 left-0 chess-drag-piece chess-board-piece"
          data-piece-color={game.get(draggingSquare)?.color}
          style={{
            transform: `translate3d(${dragPosRef.current.x - 32}px, ${dragPosRef.current.y - 32}px, 0px)`
          }}
        >
          {(() => {
            const p = game.get(draggingSquare);
            if (!p) return null;
            return (
              <ChessPiece
                type={p.type}
                color={p.color as PieceColor}
                theme={p.color === 'w' ? (whitePieceTheme || pieceTheme) : (blackPieceTheme || pieceTheme)}
              />
            );
          })()}
        </div>
      )}
    </div>
  );
});
