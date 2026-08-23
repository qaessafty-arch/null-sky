import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PieceType, PieceColor, PieceThemeId } from '../types/chess';
import { ChessPiece } from './ChessPiece';

interface CapturedPiecesProps {
  pieces: PieceType[];
  pieceTheme: PieceThemeId;
  colorOfCapturedPieces: PieceColor;
  materialAdvantage?: number; // >0 if this player has material advantage
}

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({
  pieces,
  pieceTheme,
  colorOfCapturedPieces,
  materialAdvantage
}) => {
  // Sort pieces by value: q > r > b > n > p
  const piecePriority: Record<PieceType, number> = {
    q: 5,
    r: 4,
    b: 3,
    n: 2,
    p: 1,
    k: 0
  };

  const sortedPieces = [...pieces].sort((a, b) => piecePriority[b] - piecePriority[a]);

  // Generate stable keys for each piece occurrence so layout & entry animations work seamlessly
  const pieceCounts: Record<string, number> = {};
  const pieceItems = sortedPieces.map(piece => {
    pieceCounts[piece] = (pieceCounts[piece] || 0) + 1;
    return {
      piece,
      key: `${colorOfCapturedPieces}-${piece}-${pieceCounts[piece]}`
    };
  });

  const isWhite = colorOfCapturedPieces === 'w';

  return (
    <div className="flex items-center gap-2 flex-wrap min-h-[28px]">
      <div className="flex items-center -space-x-1.5 sm:-space-x-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {pieceItems.map(({ piece, key }, idx) => (
            <motion.div
              key={key}
              layout
              initial={{
                opacity: 0,
                scale: 0.2,
                x: isWhite ? -18 : 18,
                y: isWhite ? 12 : -12,
                rotate: isWhite ? -15 : 15,
                filter: 'blur(4px)'
              }}
              animate={{
                opacity: 1,
                scale: 1,
                x: 0,
                y: 0,
                rotate: 0,
                filter: 'blur(0px)'
              }}
              exit={{
                opacity: 0,
                scale: 0.2,
                transition: { duration: 0.2 }
              }}
              transition={{
                type: 'spring',
                stiffness: 420,
                damping: 26,
                mass: 0.7,
                layout: {
                  type: 'spring',
                  stiffness: 450,
                  damping: 30
                }
              }}
              whileHover={{
                scale: 1.35,
                y: -3,
                zIndex: 50,
                transition: { duration: 0.15 }
              }}
              className="relative w-5 h-5 sm:w-6 sm:h-6 cursor-pointer select-none drop-shadow-md"
              style={{ zIndex: 10 + idx }}
              title={`${piece.toUpperCase()} (${colorOfCapturedPieces === 'w' ? 'White' : 'Black'}) captured`}
            >
              <ChessPiece type={piece} color={colorOfCapturedPieces} theme={pieceTheme} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Material advantage badge with smooth scale & pop transition */}
      <AnimatePresence>
        {materialAdvantage && materialAdvantage > 0 ? (
          <motion.span
            key={`advantage-${materialAdvantage}`}
            initial={{ opacity: 0, scale: 0.6, x: -8 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.6, x: 4 }}
            transition={{ type: 'spring', stiffness: 500, damping: 28 }}
            className="text-[11px] font-mono font-black px-2 py-0.5 rounded-full bg-[#52673A]/40 text-[#F5C453] border border-[#F5C453]/40 backdrop-blur-md shadow-sm shadow-[#F5C453]/10"
          >
            +{materialAdvantage}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
};
