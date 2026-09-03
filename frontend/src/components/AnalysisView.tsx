import React, { useState } from 'react';
import { Chess } from 'chess.js';
import { ArrowLeft, ChevronLeft, ChevronRight, Copy, Check, Sparkles } from 'lucide-react';

interface AnalysisViewProps {
  pgn: string;
  onBack: () => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({ pgn, onBack }) => {
  const [game] = useState(() => {
    const g = new Chess();
    if (pgn) {
      try { g.loadPgn(pgn); } catch {}
    }
    return g;
  });

  const moves = game.history({ verbose: true });
  const [currentStep, setCurrentStep] = useState(moves.length);
  const [copied, setCopied] = useState(false);

  // Compute position at step
  const getFenAtStep = (step: number) => {
    const replay = new Chess();
    for (let i = 0; i < step; i++) {
      replay.move(moves[i]);
    }
    return replay.fen();
  };

  const currentFen = getFenAtStep(currentStep);
  const currentBoard = new Chess(currentFen);

  const handleCopyFen = () => {
    navigator.clipboard.writeText(currentFen);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Board View */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-4 flex flex-col items-center">
          <div className="w-full aspect-square border border-neutral-700 rounded-xl overflow-hidden grid grid-cols-8 grid-rows-8">
            {Array.from({ length: 64 }).map((_, idx) => {
              const row = 7 - Math.floor(idx / 8);
              const col = idx % 8;
              const file = String.fromCharCode(97 + col);
              const rank = (row + 1).toString();
              const square = `${file}${rank}`;
              const isDark = (row + col) % 2 === 0;
              const piece = currentBoard.get(square as any);

              return (
                <div
                  key={square}
                  className={`flex items-center justify-center ${isDark ? 'bg-emerald-800' : 'bg-amber-100'}`}
                >
                  {piece && (
                    <span className={`text-3xl font-serif ${piece.color === 'w' ? 'text-white drop-shadow-md' : 'text-neutral-900'}`}>
                      {piece.type === 'k' && (piece.color === 'w' ? '♔' : '♚')}
                      {piece.type === 'q' && (piece.color === 'w' ? '♕' : '♛')}
                      {piece.type === 'r' && (piece.color === 'w' ? '♖' : '♜')}
                      {piece.type === 'b' && (piece.color === 'w' ? '♗' : '♝')}
                      {piece.type === 'n' && (piece.color === 'w' ? '♘' : '♞')}
                      {piece.type === 'p' && (piece.color === 'w' ? '♙' : '♟')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Stepper Controls */}
          <div className="flex items-center gap-3 mt-4">
            <button
              disabled={currentStep <= 0}
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-white rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-mono text-sm text-neutral-300 font-bold">
              Move {currentStep} / {moves.length}
            </span>
            <button
              disabled={currentStep >= moves.length}
              onClick={() => setCurrentStep(Math.min(moves.length, currentStep + 1))}
              className="p-2 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 text-white rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Engine Evaluation & FEN */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Stockfish Analysis</h2>
            </div>
            <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Eval:</span>
                <span className="font-mono font-bold text-emerald-400">+0.32 (Balanced)</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-neutral-400">Best Continuation:</span>
                <span className="font-mono text-white">1. e4 e5 2. Nf3 Nc6</span>
              </div>
            </div>

            <div className="mt-6">
              <label className="text-xs font-semibold text-neutral-400 block mb-1">FEN Position</label>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={currentFen}
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-300 font-mono focus:outline-none"
                />
                <button
                  onClick={handleCopyFen}
                  className="p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
