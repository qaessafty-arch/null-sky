import React, { useRef, useEffect } from 'react';
import { MoveLog, OpeningInfo, MoveClassification } from '../types/chess';
import { Copy, Check, BookOpen, Layers } from 'lucide-react';

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
    <div className="flex flex-col h-full obsidian-panel overflow-hidden shadow-2xl" dir="ltr">
      {/* Header with Opening Badge */}
      <div className="p-4 border-b border-[#1F293D] bg-[#111827] flex items-center justify-between backdrop-blur-xl">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="p-1.5 rounded-lg bg-[#0B0F19] border border-[#F59E0B]/30 text-[#F59E0B]">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="truncate">
            {openingInfo ? (
              <div className="flex items-center gap-2 truncate">
                <span className="font-mono text-[9px] font-black px-1.5 py-0.5 rounded bg-[#F59E0B] text-[#0B0F19] shadow-sm uppercase">
                  {openingInfo.eco}
                </span>
                <span className="text-[11px] font-black text-white tracking-tight truncate">
                  {openingInfo.name}
                </span>
              </div>
            ) : (
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8] opacity-50">Opening Analysis</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyFen}
            className="px-2 py-1.5 rounded-lg bg-[#0B0F19] border border-[#1F293D] text-[9px] font-black text-[#94A3B8] hover:text-[#F59E0B] hover:border-[#F59E0B]/30 transition-all interactive-btn uppercase tracking-tighter"
            title="Copy FEN string"
          >
            {copiedFen ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : 'FEN'}
          </button>
          <button
            onClick={handleCopyPgn}
            className="p-1.5 rounded-lg bg-[#0B0F19] border border-[#1F293D] text-[#94A3B8] hover:text-[#F59E0B] hover:border-[#F59E0B]/30 transition-all interactive-btn"
            title="Copy PGN notation"
          >
            {copiedPgn ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Move list table */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-1 font-mono no-scrollbar">
        {movePairs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#94A3B8] opacity-20 py-12 gap-3">
            <Layers className="w-12 h-12 stroke-[1]" />
            <span className="text-[10px] font-black uppercase tracking-widest">Awaiting Moves...</span>
          </div>
        ) : (
          movePairs.map(pair => (
            <div
              key={pair.turnNumber}
              className={`grid grid-cols-12 items-center px-2 py-1 rounded-xl transition-colors ${
                pair.turnNumber % 2 === 0 ? 'bg-[#0B0F19]/20' : 'bg-transparent'
              }`}
            >
              {/* Turn Number */}
              <span className="col-span-2 text-[10px] font-black text-[#94A3B8] opacity-40">{pair.turnNumber}.</span>

              {/* White Move */}
              <div className="col-span-5 flex items-center justify-between pr-1">
                {pair.white && (
                  <button
                    onClick={() => onSelectMoveIndex(pair.white!.index)}
                    className={`w-full flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-lg text-left font-black text-[11px] transition-all interactive-btn ${
                      currentMoveIndex === pair.white.index
                        ? 'bg-[#F59E0B] text-[#0B0F19] shadow-lg shadow-[#F59E0B]/20'
                        : 'text-white hover:bg-[#111827] border border-transparent hover:border-[#1F293D]'
                    }`}
                  >
                    <span>{pair.white.log.san}</span>
                    {pair.white.log.classification && BADGE_MAP[pair.white.log.classification] && (
                      <span
                        className="text-[10px] leading-none"
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
                    className={`w-full flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-lg text-left font-black text-[11px] transition-all interactive-btn ${
                      currentMoveIndex === pair.black.index
                        ? 'bg-[#F59E0B] text-[#0B0F19] shadow-lg shadow-[#F59E0B]/20'
                        : 'text-[#94A3B8] hover:text-white hover:bg-[#111827] border border-transparent hover:border-[#1F293D]'
                    }`}
                  >
                    <span>{pair.black.log.san}</span>
                    {pair.black.log.classification && BADGE_MAP[pair.black.log.classification] && (
                      <span
                        className="text-[10px] leading-none"
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
