import React, { useRef, useEffect } from 'react';
import { MoveLog, OpeningInfo, MoveClassification } from '../types/chess';
import { Copy, Check, BookOpen } from 'lucide-react';

interface MoveHistoryProps {
  moveLogs: MoveLog[];
  currentMoveIndex: number;
  onSelectMoveIndex: (index: number) => void;
  openingInfo: OpeningInfo | null;
  pgn: string;
  fen: string;
}

const BADGE_MAP: Record<MoveClassification, { icon: string; text: string; bg: string; border: string }> = {
  brilliant: { icon: '💎', text: 'Brilliant', bg: 'bg-cyan-500/20 text-cyan-200', border: 'border-cyan-400/40' },
  best: { icon: '★', text: 'Best', bg: 'bg-emerald-500/20 text-emerald-200', border: 'border-emerald-400/40' },
  good: { icon: '✓', text: 'Good', bg: 'bg-blue-500/20 text-blue-200', border: 'border-blue-400/40' },
  book: { icon: '📖', text: 'Book', bg: 'bg-purple-500/20 text-purple-200', border: 'border-purple-400/40' },
  inaccuracy: { icon: '?!', text: 'Inaccuracy', bg: 'bg-yellow-500/20 text-yellow-200', border: 'border-yellow-400/40' },
  mistake: { icon: '?', text: 'Mistake', bg: 'bg-orange-500/20 text-orange-200', border: 'border-orange-400/40' },
  blunder: { icon: '??', text: 'Blunder', bg: 'bg-rose-500/20 text-rose-200', border: 'border-rose-400/40' }
};

export const MoveHistory: React.FC<MoveHistoryProps> = ({
  moveLogs,
  currentMoveIndex,
  onSelectMoveIndex,
  openingInfo,
  pgn,
  fen
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedPgn, setCopiedPgn] = React.useState(false);
  const [copiedFen, setCopiedFen] = React.useState(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moveLogs.length, currentMoveIndex]);

  // Group moves into pairs (White & Black)
  const movePairs: { turnNumber: number; white?: { log: MoveLog; index: number }; black?: { log: MoveLog; index: number } }[] = [];

  for (let i = 0; i < moveLogs.length; i += 2) {
    const turnNumber = Math.floor(i / 2) + 1;
    movePairs.push({
      turnNumber,
      white: { log: moveLogs[i], index: i },
      black: moveLogs[i + 1] ? { log: moveLogs[i + 1], index: i + 1 } : undefined
    });
  }

  const handleCopyPgn = () => {
    navigator.clipboard.writeText(pgn || 'No moves recorded yet.');
    setCopiedPgn(true);
    setTimeout(() => setCopiedPgn(false), 2000);
  };

  const handleCopyFen = () => {
    navigator.clipboard.writeText(fen);
    setCopiedFen(true);
    setTimeout(() => setCopiedFen(false), 2000);
  };

  return (
    <div className="flex flex-col h-full glass-card overflow-hidden shadow-2xl">
      {/* Header with Opening Badge */}
      <div className="p-3.5 border-b border-white/10 bg-white/[0.03] flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <BookOpen className="w-4 h-4 text-blue-400 shrink-0" />
          <div className="truncate">
            {openingInfo ? (
              <div className="flex items-center gap-2 truncate">
                <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {openingInfo.eco}
                </span>
                <span className="text-xs font-semibold text-white/90 truncate">
                  {openingInfo.name}
                  {openingInfo.variation ? `: ${openingInfo.variation}` : ''}
                </span>
              </div>
            ) : (
              <span className="text-xs font-medium text-white/40">Opening: Initial State</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyFen}
            className="px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-lg border border-transparent hover:border-white/10 transition-all font-mono text-[10px]"
            title="Copy FEN string"
          >
            {copiedFen ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : 'FEN'}
          </button>
          <button
            onClick={handleCopyPgn}
            className="p-1.5 text-xs text-white/60 hover:text-white hover:bg-white/10 rounded-lg border border-transparent hover:border-white/10 transition-all"
            title="Copy PGN notation"
          >
            {copiedPgn ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Move list table */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1 font-mono text-sm max-h-[300px]">
        {movePairs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-white/30 text-xs italic py-8">
            Moves will appear here as you play
          </div>
        ) : (
          movePairs.map(pair => (
            <div
              key={pair.turnNumber}
              className={`grid grid-cols-12 items-center px-2.5 py-1 rounded-xl transition-colors ${
                pair.turnNumber % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'
              }`}
            >
              {/* Turn Number */}
              <span className="col-span-2 text-white/30 text-xs font-bold">{pair.turnNumber}.</span>

              {/* White Move */}
              <div className="col-span-5 flex items-center justify-between pr-2">
                {pair.white && (
                  <button
                    onClick={() => onSelectMoveIndex(pair.white!.index)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-left font-semibold text-xs transition-all ${
                      currentMoveIndex === pair.white.index
                        ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white border border-blue-400/40 shadow-sm backdrop-blur-md'
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{pair.white.log.san}</span>
                    {pair.white.log.classification && BADGE_MAP[pair.white.log.classification] && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded border ${
                          BADGE_MAP[pair.white.log.classification].bg
                        } ${BADGE_MAP[pair.white.log.classification].border}`}
                        title={BADGE_MAP[pair.white.log.classification].text}
                      >
                        {BADGE_MAP[pair.white.log.classification].icon}
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Black Move */}
              <div className="col-span-5 flex items-center justify-between pl-1">
                {pair.black && (
                  <button
                    onClick={() => onSelectMoveIndex(pair.black!.index)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-left font-semibold text-xs transition-all ${
                      currentMoveIndex === pair.black.index
                        ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white border border-blue-400/40 shadow-sm backdrop-blur-md'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span>{pair.black.log.san}</span>
                    {pair.black.log.classification && BADGE_MAP[pair.black.log.classification] && (
                      <span
                        className={`text-[9px] px-1 py-0.2 rounded border ${
                          BADGE_MAP[pair.black.log.classification].bg
                        } ${BADGE_MAP[pair.black.log.classification].border}`}
                        title={BADGE_MAP[pair.black.log.classification].text}
                      >
                        {BADGE_MAP[pair.black.log.classification].icon}
                      </span>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
