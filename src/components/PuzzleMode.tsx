import React, { useState, useEffect } from 'react';
import { PanelContainer } from './PanelContainer';
import { Chess, Square, Move } from 'chess.js';
import { Puzzle, AppSettings } from '../types/chess';
import { PUZZLES_COLLECTION } from '../utils/puzzles';
import { 
  getDailyPuzzleForDate, 
  getTodayDateKey, 
  getFormattedTodayDate, 
  loadDailyProgress, 
  saveDailyProgress, 
  generateDailyShareText,
  DailyPuzzleData 
} from '../utils/dailyPuzzles';
import { ChessBoard } from './ChessBoard';
import { soundManager } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import { 
  Sparkles, 
  ArrowRight, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  Trophy, 
  Calendar, 
  Flame, 
  Share2, 
  Award,
  Compass,
  Check,
  BookOpen,
  Zap,
  Sun
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PuzzleModeProps {
  settings: AppSettings;
}

type PuzzleTab = 'daily' | 'library';

export const PuzzleMode: React.FC<PuzzleModeProps> = ({ settings }) => {
  const { user, profile, updateRespectMetrics } = useAuth();
  const [activeTab, setActiveTab] = useState<PuzzleTab>('daily');

  // Daily Puzzle State
  const todayKey = getTodayDateKey();
  const todayFormatted = getFormattedTodayDate();
  const [dailyPuzzle, setDailyPuzzle] = useState<DailyPuzzleData>(() => getDailyPuzzleForDate(todayKey));
  const [dailyProgress, setDailyProgress] = useState(() => loadDailyProgress(todayKey));
  const [dailyCopied, setDailyCopied] = useState(false);

  // Library Tactics State
  const [libraryIndex, setLibraryIndex] = useState(0);
  const libraryPuzzle = PUZZLES_COLLECTION[libraryIndex];

  // Active Puzzle reference
  const currentPuzzle: Puzzle = activeTab === 'daily' ? dailyPuzzle : libraryPuzzle;

  // Game Engine & Step State
  const [puzzleGame, setPuzzleGame] = useState<Chess>(() => new Chess(currentPuzzle.fen));
  const [moveStep, setMoveStep] = useState(0);
  const [puzzleStatus, setPuzzleStatus] = useState<'playing' | 'correct' | 'wrong' | 'completed'>('playing');
  const [showHint, setShowHint] = useState(false);
  const [playerRating, setPlayerRating] = useState(1350);
  const [solvedLibraryCount, setSolvedLibraryCount] = useState(0);

  // Re-initialize board whenever active tab or puzzle index changes
  useEffect(() => {
    const game = new Chess(currentPuzzle.fen);
    setPuzzleGame(game);
    setMoveStep(0);
    setPuzzleStatus('playing');
    setShowHint(false);
  }, [activeTab, libraryIndex, dailyPuzzle]);

  const handlePuzzleMove = (from: Square, to: Square) => {
    if (puzzleStatus === 'completed' || puzzleStatus === 'wrong') return;

    try {
      // Test move legality
      const tempGame = new Chess(puzzleGame.fen());
      const move = tempGame.move({ from, to, promotion: 'q' });
      if (!move) return;

      const expectedMoveSan = currentPuzzle.solutionMoves[moveStep];

      // Normalize check and mate symbols for tolerant matching
      const cleanSan = move.san.replace('+', '').replace('#', '');
      const cleanExpected = expectedMoveSan.replace('+', '').replace('#', '');

      if (move.san === expectedMoveSan || cleanSan === cleanExpected) {
        // Correct move!
        const nextGame = new Chess(puzzleGame.fen());
        nextGame.move({ from, to, promotion: 'q' });
        setPuzzleGame(nextGame);
        soundManager.playMove();

        const nextStep = moveStep + 1;
        setMoveStep(nextStep);

        if (nextStep >= currentPuzzle.solutionMoves.length) {
          // Solved entire puzzle!
          setPuzzleStatus('completed');
          soundManager.playVictory();

          if (activeTab === 'daily') {
            const updated = saveDailyProgress(todayKey, true);
            setDailyProgress(updated);
            
            // Reward Respect Points (+25 for daily puzzle)
            if (updateRespectMetrics) {
              updateRespectMetrics({
                respectPoints: 25,
                elo: 15,
                wins: 1
              });
            }
          } else {
            setPlayerRating(prev => prev + 15);
            setSolvedLibraryCount(prev => prev + 1);
          }

          try {
            confetti({ 
              particleCount: 75, 
              spread: 70, 
              origin: { y: 0.6 },
              colors: ['#F5C453', '#8C2425', '#52673A', '#FFFFFF']
            });
          } catch {}
        } else {
          // Play opponent response automatically after 400ms
          const opponentMoveSan = currentPuzzle.solutionMoves[nextStep];
          setTimeout(() => {
            try {
              const oppGame = new Chess(nextGame.fen());
              oppGame.move(opponentMoveSan);
              setPuzzleGame(oppGame);
              soundManager.playMove();
              setMoveStep(nextStep + 1);
            } catch {
              // Ignore
            }
          }, 450);
        }
      } else {
        // Wrong move!
        soundManager.playWrong();
        setPuzzleStatus('wrong');
        if (activeTab === 'library') {
          setPlayerRating(prev => Math.max(800, prev - 8));
        }
      }
    } catch {
      // Illegal move
    }
  };

  const handleRetry = () => {
    setPuzzleGame(new Chess(currentPuzzle.fen));
    setMoveStep(0);
    setPuzzleStatus('playing');
    setShowHint(false);
  };

  const handleNextLibraryPuzzle = () => {
    if (libraryIndex < PUZZLES_COLLECTION.length - 1) {
      setLibraryIndex(prev => prev + 1);
    } else {
      setLibraryIndex(0);
    }
  };

  const handleShareDaily = () => {
    const text = generateDailyShareText(dailyPuzzle, dailyProgress.streak || 1);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setDailyCopied(true);
      setTimeout(() => setDailyCopied(false), 2500);
    }
  };

  return (
    <PanelContainer>
      {/* Top Header Mode Tabs: Daily Puzzle vs Tactics Trainer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-panel p-3 sm:p-4 rounded-3xl border border-[#F5C453]/30 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#8C2425] via-[#52673A] to-[#F5C453] text-[#F5C453] border border-[#F5C453]/40 shadow-md">
            <Sun className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                Peshmerga Tactics & Daily Missions
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-[#F5C453]/20 text-[#F5C453] text-[10px] font-black border border-[#F5C453]/40 uppercase">
                Tactics Pro
              </span>
            </div>
            <p className="text-xs text-[#DFD0B0]/70">
              Sharpen your tactical vision with daily grandmaster puzzles & earn battlefield Respect
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-[#161c12] p-1.5 rounded-2xl border border-[#F5C453]/30 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'daily'
                ? 'bg-gradient-to-r from-[#8C2425] to-[#52673A] text-white border border-[#F5C453]/50 shadow-md'
                : 'text-[#DFD0B0]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-[#F5C453]" />
            <span>Daily Tactical Mission</span>
            {dailyProgress.solved && <span className="text-emerald-400 text-xs">✓</span>}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('library')}
            className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              activeTab === 'library'
                ? 'bg-[#52673A] text-white border border-[#F5C453]/50 shadow-md'
                : 'text-[#DFD0B0]/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-[#F5C453]" />
            <span>Tactics Library</span>
          </button>
        </div>
      </div>

      {/* Main Board & Tactical Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / CENTER: Chess Board View */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[640px] p-2.5 sm:p-3.5 rounded-3xl bg-[#10140e] border-2 border-[#F5C453]/30 shadow-2xl">
            <ChessBoard
              game={puzzleGame}
              isFlipped={currentPuzzle.playerColor === 'b'}
              boardTheme={settings.boardTheme}
              pieceTheme={settings.pieceTheme}
              showCoordinates={settings.showCoordinates}
              highlightLastMove={settings.highlightLastMove}
              showLegalMoves={settings.showLegalMoves}
              lastMove={null}
              onMove={handlePuzzleMove}
              disabled={puzzleStatus === 'completed'}
            />

            {/* Turn Prompt Floating Chip */}
            <div className="mt-3 px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-[#F5C453]/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">{currentPuzzle.playerColor === 'w' ? '⚪' : '⚫'}</span>
                <span className="font-bold text-white">
                  {currentPuzzle.playerColor === 'w' ? 'White to move and win' : 'Black to move and win'}
                </span>
              </div>
              <span className="text-[#DFD0B0]/70 font-mono text-[11px]">
                Step {Math.floor(moveStep / 2) + 1} / {Math.ceil(currentPuzzle.solutionMoves.length / 2)}
              </span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Puzzle Lore, Details, Actions & Stats */}
        <div className="lg:col-span-5 space-y-4">
          {/* Daily Mission Header or Library Progress Card */}
          {activeTab === 'daily' ? (
            <div className="glass-panel p-5 rounded-3xl border border-[#F5C453]/40 shadow-xl relative overflow-hidden">
              {/* Daily Kurdish Aura Decor */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#F5C453]/15 rounded-full blur-2xl pointer-events-none" />

              {/* Date & Streak Bar */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#F5C453]" />
                  <span className="text-xs font-bold text-white tracking-wide">{todayFormatted}</span>
                </div>

                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-black shadow-sm">
                  <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span>{dailyProgress.streak || (dailyProgress.solved ? 1 : 0)} Day Streak</span>
                </div>
              </div>

              {/* Daily Puzzle Title & Badges */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-lg bg-[#8C2425]/40 text-[#F5C453] text-[11px] font-black border border-[#F5C453]/30">
                  {dailyPuzzle.difficulty} ({dailyPuzzle.rating} Elo)
                </span>
                <span className="px-2.5 py-0.5 rounded-lg bg-[#52673A]/40 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  {dailyPuzzle.theme}
                </span>
              </div>

              <h3 className="text-lg font-black text-white mb-1.5">{dailyPuzzle.title}</h3>
              <p className="text-xs text-[#DFD0B0]/80 mb-3 leading-relaxed">{dailyPuzzle.description}</p>

              {/* Kurdish Lore Context Card */}
              {dailyPuzzle.loreContext && (
                <div className="p-3 rounded-2xl bg-white/[0.04] border border-[#F5C453]/20 text-xs text-[#DFD0B0]/90 mb-3 flex items-start gap-2">
                  <span className="text-sm shrink-0">🏔️</span>
                  <div>
                    <span className="font-bold text-[#F5C453]">Zagros Lore: </span>
                    <span>{dailyPuzzle.loreContext}</span>
                  </div>
                </div>
              )}

              {/* Status Feedback Banners */}
              {puzzleStatus === 'completed' && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 flex items-center justify-between gap-3 mb-3 animate-in zoom-in-95">
                  <div className="flex items-center gap-2.5 text-xs">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <strong className="block font-black text-sm">Daily Mission Accomplished!</strong>
                      <span>+25 Respect Points & +15 Tactics Rating</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleShareDaily}
                    className="p-2 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/50 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  >
                    {dailyCopied ? <Check className="w-4 h-4 text-amber-300" /> : <Share2 className="w-4 h-4" />}
                    <span>{dailyCopied ? 'Copied!' : 'Share'}</span>
                  </button>
                </div>
              )}

              {puzzleStatus === 'wrong' && (
                <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-300 flex items-center gap-2.5 mb-3 animate-in zoom-in-95">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div className="text-xs">
                    <strong className="block font-bold">Tactical Inaccuracy</strong>
                    <span>That was not the master move. Regroup and strike again!</span>
                  </div>
                </div>
              )}

              {showHint && (
                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs mb-3 flex items-start gap-2 animate-in fade-in">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Peshmerga Scout Hint: </strong>
                    Look for a decisive move starting with notation "
                    <span className="font-mono text-amber-300 font-bold">
                      {currentPuzzle.solutionMoves[moveStep]?.charAt(0)}
                    </span>
                    ".
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                {puzzleStatus === 'wrong' ? (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="col-span-2 py-3 rounded-2xl bg-gradient-to-r from-[#8C2425] to-[#52673A] text-white font-black text-xs flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer shadow-lg border border-[#F5C453]/40"
                  >
                    <RotateCcw className="w-4 h-4 text-[#F5C453]" />
                    <span>Retry Mission</span>
                  </button>
                ) : puzzleStatus === 'completed' ? (
                  <button
                    type="button"
                    onClick={handleShareDaily}
                    className="col-span-2 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer shadow-lg border border-emerald-400/40"
                  >
                    {dailyCopied ? <Check className="w-4 h-4 text-amber-300" /> : <Share2 className="w-4 h-4" />}
                    <span>{dailyCopied ? 'Result Copied to Clipboard!' : 'Share Daily Result'}</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowHint(true)}
                      className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition-all cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#F5C453]" />
                      <span>Get Hint</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRetry}
                      className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#DFD0B0]" />
                      <span>Reset Board</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Tactics Library Panel */
            <div className="glass-panel p-5 rounded-3xl border border-[#F5C453]/40 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#F5C453]" />
                  <span className="text-xs font-bold text-white">Tactics Library</span>
                </div>
                <span className="text-xs font-mono font-bold text-[#F5C453]">
                  Puzzle {libraryIndex + 1} / {PUZZLES_COLLECTION.length}
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-[#8C2425]/30 text-[#F5C453] text-[11px] font-bold border border-[#F5C453]/30">
                  {libraryPuzzle.difficulty}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#52673A]/30 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
                  {libraryPuzzle.rating} Elo
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-white/80 text-[11px] font-mono">
                  {libraryPuzzle.theme}
                </span>
              </div>

              <h3 className="text-base font-black text-white">{libraryPuzzle.title}</h3>
              <p className="text-xs text-[#DFD0B0]/80 leading-relaxed">{libraryPuzzle.description}</p>

              {/* Status Feedback */}
              {puzzleStatus === 'completed' && (
                <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 flex items-center gap-2 animate-in zoom-in-95 text-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <strong className="block font-bold">Solved Cleanly!</strong>
                    <span>+15 Tactics Rating</span>
                  </div>
                </div>
              )}

              {puzzleStatus === 'wrong' && (
                <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center gap-2 animate-in zoom-in-95 text-xs">
                  <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                  <div>
                    <strong className="block font-bold">Incorrect Move</strong>
                    <span>Try again or request a hint!</span>
                  </div>
                </div>
              )}

              {showHint && (
                <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong>Hint: </strong> Move starts with notation "
                    <span className="font-mono text-amber-300 font-bold">
                      {currentPuzzle.solutionMoves[moveStep]?.charAt(0)}
                    </span>
                    ".
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {puzzleStatus === 'wrong' ? (
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="col-span-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Retry Puzzle</span>
                  </button>
                ) : puzzleStatus === 'completed' ? (
                  <button
                    type="button"
                    onClick={handleNextLibraryPuzzle}
                    className="col-span-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <span>Next Tactical Puzzle</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowHint(true)}
                      className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/15 cursor-pointer transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#F5C453]" />
                      <span>Get Hint</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleNextLibraryPuzzle}
                      className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/15 cursor-pointer transition-all"
                    >
                      <span>Skip</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Tactical Performance Metrics Card */}
          <div className="glass-panel p-4 rounded-3xl border border-white/10 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-2xl bg-white/[0.03]">
              <div className="text-base sm:text-lg font-black text-amber-400 font-mono">
                {dailyProgress.streak || (dailyProgress.solved ? 1 : 0)}
              </div>
              <div className="text-[10px] text-[#DFD0B0]/60 uppercase font-semibold">Daily Streak</div>
            </div>

            <div className="p-2 rounded-2xl bg-white/[0.03]">
              <div className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                {activeTab === 'daily' ? dailyProgress.totalDailySolved : solvedLibraryCount}
              </div>
              <div className="text-[10px] text-[#DFD0B0]/60 uppercase font-semibold">Solved</div>
            </div>

            <div className="p-2 rounded-2xl bg-white/[0.03]">
              <div className="text-base sm:text-lg font-black text-[#F5C453] font-mono">
                {profile?.respectPoints || 100}
              </div>
              <div className="text-[10px] text-[#DFD0B0]/60 uppercase font-semibold">Respect Pts</div>
            </div>
          </div>
        </div>
      </div>
    </PanelContainer>
  );
};
