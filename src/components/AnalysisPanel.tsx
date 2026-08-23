import React, { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
import { AppSettings, OpeningInfo } from '../types/chess';
import { ChessBoard } from './ChessBoard';
import { EvalBar } from './EvalBar';
import { MoveHistory } from './MoveHistory';
import { engine } from '../engine/client';
import { detectOpening } from '../utils/openings';
import { soundManager } from '../utils/audio';
import {
  ChevronFirst,
  ChevronLeft,
  ChevronRight,
  ChevronLast,
  RotateCw,
  Sparkles,
  ClipboardPaste,
  FileText
} from 'lucide-react';

interface AnalysisPanelProps {
  settings: AppSettings;
  initialFen?: string;
  initialPgn?: string;
}

export const AnalysisPanel: React.FC<AnalysisPanelProps> = ({
  settings,
  initialFen,
  initialPgn
}) => {
  const [analysisGame, setAnalysisGame] = useState<Chess>(() => {
    const g = new Chess();
    if (initialPgn) {
      try {
        g.loadPgn(initialPgn);
      } catch {}
    } else if (initialFen) {
      try {
        g.load(initialFen);
      } catch {}
    }
    return g;
  });

  const [historyFens, setHistoryFens] = useState<string[]>([analysisGame.fen()]);
  const [historySans, setHistorySans] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [evalScore, setEvalScore] = useState<number>(0);
  const [bestMoveSan, setBestMoveSan] = useState<string | null>(null);
  const [searchDepth, setSearchDepth] = useState(0);
  const [mateIn, setMateIn] = useState<number | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [fenInput, setFenInput] = useState('');
  const [showFenModal, setShowFenModal] = useState(false);

  // Re-evaluate on position change — the search runs in the engine worker, so
  // the panel stays responsive while it thinks.
  useEffect(() => {
    let cancelled = false;
    const fen = analysisGame.fen();
    setIsThinking(true);

    engine
      .search({ fen }, { depth: 14, timeMs: 1200 })
      .then(result => {
        if (cancelled) return;
        setEvalScore(result.mateIn !== null ? (result.mateIn > 0 ? 1000 : -1000) : result.scoreWhite / 100);
        setSearchDepth(result.depth);
        setMateIn(result.mateIn);
        if (!result.bestMove) {
          setBestMoveSan(null);
          return;
        }
        try {
          const probe = new Chess(fen);
          const applied = probe.move({
            from: result.bestMove.slice(0, 2) as Square,
            to: result.bestMove.slice(2, 4) as Square,
            promotion: (result.bestMove[4] as 'q' | 'r' | 'b' | 'n' | undefined) ?? 'q'
          });
          setBestMoveSan(applied ? applied.san : null);
        } catch {
          setBestMoveSan(null);
        }
      })
      .catch(() => {
        if (!cancelled) setBestMoveSan(null);
      })
      .finally(() => {
        if (!cancelled) setIsThinking(false);
      });

    return () => {
      cancelled = true;
    };
  }, [analysisGame]);

  const handleAnalysisMove = (from: Square, to: Square) => {
    try {
      const newGame = new Chess(analysisGame.fen());
      const move = newGame.move({ from, to, promotion: 'q' });
      if (!move) return;

      soundManager.playMove();

      const newFens = historyFens.slice(0, currentStep + 1);
      newFens.push(newGame.fen());

      const newSans = historySans.slice(0, currentStep);
      newSans.push(move.san);

      setHistoryFens(newFens);
      setHistorySans(newSans);
      setCurrentStep(newFens.length - 1);
      setAnalysisGame(newGame);
    } catch {
      // Illegal
    }
  };

  const jumpToStep = (step: number) => {
    if (step < 0 || step >= historyFens.length) return;
    const targetFen = historyFens[step];
    const g = new Chess(targetFen);
    setAnalysisGame(g);
    setCurrentStep(step);
  };

  const handleLoadFen = () => {
    try {
      const g = new Chess(fenInput.trim());
      setAnalysisGame(g);
      setHistoryFens([g.fen()]);
      setHistorySans([]);
      setCurrentStep(0);
      setShowFenModal(false);
      setFenInput('');
    } catch {
      alert('Invalid FEN format.');
    }
  };

  const openingInfo: OpeningInfo | null = detectOpening(historySans);

  return (
    <div className="flex flex-col lg:flex-row items-center lg:items-start justify-center gap-5 max-w-6xl mx-auto p-3">
      {/* Board & Eval Bar */}
      <div className="flex items-center gap-3">
        {settings.showEvalBar && (
          <EvalBar score={evalScore} isFlipped={isFlipped} />
        )}
        <ChessBoard
          game={analysisGame}
          isFlipped={isFlipped}
          boardTheme={settings.boardTheme}
          pieceTheme={settings.pieceTheme}
          showCoordinates={settings.showCoordinates}
          highlightLastMove={settings.highlightLastMove}
          showLegalMoves={settings.showLegalMoves}
          lastMove={null}
          onMove={handleAnalysisMove}
        />
      </div>

      {/* Analysis Tools Sidebar */}
      <div className="w-full lg:w-96 flex flex-col gap-3">
        {/* Engine Evaluation Header */}
        <div className="glass-card p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-white/80 font-ui uppercase tracking-wider">
              Engine Analysis
            </span>
            <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 backdrop-blur-md">
              Depth 18
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/10 mb-3 backdrop-blur-md">
            <div>
              <div className="text-[11px] text-white/50 font-medium flex items-center gap-1.5">
                Evaluation
                {isThinking && (
                  <span className="w-2.5 h-2.5 rounded-full border border-blue-400 border-t-transparent animate-spin" />
                )}
              </div>
              <div className="text-lg font-mono font-extrabold text-white">
                {mateIn !== null
                  ? `#${mateIn > 0 ? '' : '-'}${Math.abs(mateIn)}`
                  : evalScore > 0
                    ? `+${evalScore.toFixed(2)}`
                    : evalScore.toFixed(2)}
              </div>
              {searchDepth > 0 && (
                <div className="text-[10px] text-white/40 font-mono">depth {searchDepth}</div>
              )}
            </div>

            {bestMoveSan && (
              <div className="text-right">
                <div className="text-[11px] text-white/50 font-medium">Top engine move</div>
                <div className="flex items-center gap-1 text-sm font-mono font-bold text-blue-400">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{bestMoveSan}</span>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="grid grid-cols-5 gap-1.5 mb-3">
            <button
              onClick={() => jumpToStep(0)}
              disabled={currentStep === 0}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-20 disabled:cursor-not-allowed border border-white/10 flex items-center justify-center text-white/80 transition-colors backdrop-blur-md"
              title="First move"
            >
              <ChevronFirst className="w-4 h-4" />
            </button>
            <button
              onClick={() => jumpToStep(currentStep - 1)}
              disabled={currentStep === 0}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-20 disabled:cursor-not-allowed border border-white/10 flex items-center justify-center text-white/80 transition-colors backdrop-blur-md"
              title="Previous move"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => jumpToStep(currentStep + 1)}
              disabled={currentStep >= historyFens.length - 1}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-20 disabled:cursor-not-allowed border border-white/10 flex items-center justify-center text-white/80 transition-colors backdrop-blur-md"
              title="Next move"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => jumpToStep(historyFens.length - 1)}
              disabled={currentStep >= historyFens.length - 1}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] disabled:opacity-20 disabled:cursor-not-allowed border border-white/10 flex items-center justify-center text-white/80 transition-colors backdrop-blur-md"
              title="Latest move"
            >
              <ChevronLast className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFlipped(prev => !prev)}
              className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center text-white/80 transition-colors backdrop-blur-md"
              title="Flip board"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFenModal(true)}
              className="flex-1 py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white/80 hover:text-white flex items-center justify-center gap-1.5 transition-colors backdrop-blur-md"
            >
              <ClipboardPaste className="w-3.5 h-3.5 text-blue-400" />
              <span>Import FEN</span>
            </button>
            <button
              onClick={() => {
                const g = new Chess();
                setAnalysisGame(g);
                setHistoryFens([g.fen()]);
                setHistorySans([]);
                setCurrentStep(0);
              }}
              className="py-2 px-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-colors backdrop-blur-md"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Move History Table */}
        <MoveHistory
          moveLogs={historySans.map((san, idx) => ({
            san,
            from: '',
            to: '',
            piece: 'p',
            color: idx % 2 === 0 ? 'w' : 'b',
            fen: historyFens[idx + 1] || ''
          }))}
          currentMoveIndex={currentStep - 1}
          onSelectMoveIndex={idx => jumpToStep(idx + 1)}
          openingInfo={openingInfo}
          pgn={analysisGame.pgn()}
          fen={analysisGame.fen()}
        />
      </div>

      {/* FEN Import Modal */}
      {showFenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xl p-4">
          <div className="glass-panel rounded-3xl p-6 max-w-md w-full shadow-2xl border-white/15">
            <h3 className="text-base font-bold text-white font-ui mb-2">
              Import FEN String
            </h3>
            <p className="text-xs text-white/60 mb-4">
              Paste a Forsyth-Edwards Notation (FEN) string to load any specific board position:
            </p>
            <textarea
              value={fenInput}
              onChange={e => setFenInput(e.target.value)}
              placeholder="r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3"
              className="w-full h-24 p-3 rounded-2xl bg-white/[0.04] border border-white/10 font-mono text-xs text-white/90 focus:outline-none focus:border-blue-400 mb-4 backdrop-blur-md"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowFenModal(false)}
                className="py-2.5 px-4 rounded-xl bg-white/[0.06] text-white/80 font-semibold text-xs hover:bg-white/10 hover:text-white border border-white/10 transition-all backdrop-blur-md"
              >
                Cancel
              </button>
              <button
                onClick={handleLoadFen}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold text-xs hover:opacity-95 transition-all shadow-md shadow-blue-500/25 border border-white/20"
              >
                Load Position
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
