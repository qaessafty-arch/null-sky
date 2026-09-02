import React, { useState, useEffect, useRef } from 'react';
import { PanelContainer } from './PanelContainer';
import { Chess, Square } from 'chess.js';
import { AppSettings, PieceColor } from '../types/chess';
import {
  DailyPuzzleData,
  getTodayDateKey,
  getFormattedDate,
  getDailyPuzzleForDate,
  fetchLiveDailyPuzzle,
  loadDailyProgress,
  saveDailyProgress,
  getTimeUntilNextDailyPuzzle,
  getMonthlyCalendarDays,
  generateDailyShareText
} from '../utils/dailyPuzzles';
import { ChessBoard } from './ChessBoard';
import { soundManager } from '../utils/audio';
import { useAuth } from '../context/AuthContext';
import {
  Sun,
  Flame,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Share2,
  Check,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Trophy,
  RefreshCw,
  Info,
  Award,
  Zap,
  HelpCircle,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DailyPuzzleViewProps {
  settings: AppSettings;
  onNavigateMode?: (mode: 'ai' | 'puzzle' | 'analysis') => void;
}

export const DailyPuzzleView: React.FC<DailyPuzzleViewProps> = ({
  settings,
  onNavigateMode
}) => {
  const { user, profile, updateRespectMetrics } = useAuth();

  const todayKey = getTodayDateKey();
  const [selectedDateKey, setSelectedDateKey] = useState<string>(todayKey);
  const [dailyPuzzle, setDailyPuzzle] = useState<DailyPuzzleData>(() => getDailyPuzzleForDate(todayKey));
  const [dailyProgress, setDailyProgress] = useState(() => loadDailyProgress(todayKey));
  const [isLoadingLive, setIsLoadingLive] = useState(false);

  // 24h Countdown Timer State
  const [timeUntilReset, setTimeUntilReset] = useState(getTimeUntilNextDailyPuzzle());

  // Interactive Chess State
  const [puzzleGame, setPuzzleGame] = useState<Chess>(() => new Chess(dailyPuzzle.fen));
  const [moveStep, setMoveStep] = useState(0);
  const [puzzleStatus, setPuzzleStatus] = useState<'playing' | 'correct' | 'wrong' | 'completed'>('playing');
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showCelebrationBanner, setShowCelebrationBanner] = useState(false);

  // Month navigation for archive calendar
  const now = new Date();
  const [calendarYear, setCalendarYear] = useState(now.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(now.getMonth());

  // 1-second interval to update 24-hour reset countdown
  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = getTimeUntilNextDailyPuzzle();
      setTimeUntilReset(remaining);

      // If at 00:00:00 midnight, auto-refresh to today's new puzzle
      if (remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0) {
        const newTodayKey = getTodayDateKey();
        if (newTodayKey !== todayKey) {
          setSelectedDateKey(newTodayKey);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [todayKey]);

  // Load puzzle data whenever selectedDateKey changes
  useEffect(() => {
    let isMounted = true;

    const loadPuzzle = async () => {
      const localPuzzle = getDailyPuzzleForDate(selectedDateKey);
      setDailyPuzzle(localPuzzle);
      setPuzzleGame(new Chess(localPuzzle.fen));
      setMoveStep(0);
      setShowHint(false);
      setShowSolution(false);

      const progress = loadDailyProgress(selectedDateKey);
      setDailyProgress(progress);
      setPuzzleStatus(progress.solved ? 'completed' : 'playing');
      setShowCelebrationBanner(false);

      // Attempt online fetch if today's puzzle
      if (selectedDateKey === todayKey) {
        setIsLoadingLive(true);
        try {
          const liveData = await fetchLiveDailyPuzzle(todayKey);
          if (isMounted && liveData) {
            setDailyPuzzle(liveData);
            if (!progress.solved) {
              setPuzzleGame(new Chess(liveData.fen));
            }
          }
        } catch {
          // Keep local fallback
        } finally {
          if (isMounted) setIsLoadingLive(false);
        }
      }
    };

    loadPuzzle();

    return () => {
      isMounted = false;
    };
  }, [selectedDateKey, todayKey]);

  // Trigger a satisfying multi-wave celebration animation with Kurdish heraldic colors & stars
  const triggerCelebrationEffects = () => {
    try {
      // Wave 1: Central high-velocity golden burst
      confetti({
        particleCount: 80,
        spread: 90,
        startVelocity: 45,
        origin: { x: 0.5, y: 0.55 },
        colors: ['#F5C453', '#8C2425', '#52673A', '#FFFFFF', '#FFD700'],
        zIndex: 9999
      });

      // Wave 2: Left cannon burst with Emerald & Gold after 160ms
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 65,
          startVelocity: 50,
          origin: { x: 0.1, y: 0.7 },
          colors: ['#F5C453', '#52673A', '#8C2425', '#FFFFFF'],
          zIndex: 9999
        });
      }, 160);

      // Wave 3: Right cannon burst with Crimson & Gold after 320ms
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 65,
          startVelocity: 50,
          origin: { x: 0.9, y: 0.7 },
          colors: ['#F5C453', '#8C2425', '#52673A', '#FFFFFF'],
          zIndex: 9999
        });
      }, 320);

      // Wave 4: Shimmering golden star shower after 480ms
      setTimeout(() => {
        confetti({
          particleCount: 45,
          spread: 120,
          startVelocity: 24,
          decay: 0.93,
          scalar: 1.25,
          origin: { x: 0.5, y: 0.35 },
          colors: ['#FFD700', '#F5C453', '#FFF9E6', '#52673A'],
          shapes: ['circle'],
          zIndex: 9999
        });
      }, 480);
    } catch (err) {
      console.error('Confetti animation error:', err);
    }
  };

  const handlePuzzleMove = (from: Square, to: Square) => {
    if (puzzleStatus === 'completed' || puzzleStatus === 'wrong') return;

    try {
      // Validate move with chess.js
      const tempGame = new Chess(puzzleGame.fen());
      const move = tempGame.move({ from, to, promotion: 'q' });
      if (!move) return;

      const expectedMoveSan = dailyPuzzle.solutionMoves[moveStep];
      if (!expectedMoveSan) return;

      // Clean check and checkmate symbols for tolerant matching
      const cleanSan = move.san.replace('+', '').replace('#', '');
      const cleanExpected = expectedMoveSan.replace('+', '').replace('#', '');

      if (move.san === expectedMoveSan || cleanSan === cleanExpected) {
        // Player move is correct!
        const nextGame = new Chess(puzzleGame.fen());
        nextGame.move({ from, to, promotion: 'q' });
        setPuzzleGame(nextGame);
        soundManager.playMove();

        const nextStep = moveStep + 1;
        setMoveStep(nextStep);

        if (nextStep >= dailyPuzzle.solutionMoves.length) {
          // Solved entire puzzle correctly!
          setPuzzleStatus('completed');
          setShowCelebrationBanner(true);
          soundManager.playVictory();

          const updated = saveDailyProgress(selectedDateKey, true);
          setDailyProgress(updated);

          // Reward Respect points (+25 Respect, +15 Elo)
          if (updateRespectMetrics) {
            updateRespectMetrics({
              respectPoints: 25,
              elo: 15,
              wins: 1
            });
          }

          // Trigger multi-wave celebratory confetti
          triggerCelebrationEffects();
        } else {
          // Opponent automatically replies after short delay
          const opponentMoveSan = dailyPuzzle.solutionMoves[nextStep];
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
        // Inaccurate move
        soundManager.playWrong();
        setPuzzleStatus('wrong');
      }
    } catch {
      // Illegal move
    }
  };

  const handleReset = () => {
    setPuzzleGame(new Chess(dailyPuzzle.fen));
    setMoveStep(0);
    setPuzzleStatus('playing');
    setShowHint(false);
    setShowSolution(false);
    setShowCelebrationBanner(false);
  };

  const handleShare = () => {
    const text = generateDailyShareText(dailyPuzzle, dailyProgress.streak || 1);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  const calendarDays = getMonthlyCalendarDays(calendarYear, calendarMonth);
  const monthTitle = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(calendarYear, calendarMonth, 1)
  );

  return (
    <PanelContainer>
      {/* 24-Hour Top Mission Banner */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-[#F5C453]/40 shadow-2xl relative overflow-hidden bg-gradient-to-r from-[#161c12] via-[#1a2315] to-[#8C2425]/30">
        {/* Kurdish Sun Glow Effect */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#F5C453]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          {/* Title & Brand */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8C2425] via-[#52673A] to-[#F5C453] p-0.5 shadow-lg shadow-[#F5C453]/20 flex-shrink-0">
              <div className="w-full h-full bg-[#161c12] rounded-[14px] flex items-center justify-center text-[#F5C453]">
                <Sun className="w-6 h-6 animate-spin-slow" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black font-heading text-white tracking-tight">
                  Daily Tactical Challenge
                </h1>
                <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-[#F5C453]/20 text-[#F5C453] border border-[#F5C453]/40 uppercase tracking-wide">
                  24-Hour Cycle
                </span>
                {isLoadingLive && (
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Syncing Arena...
                  </span>
                )}
              </div>
              <p className="text-xs text-[#DFD0B0]/80 mt-0.5">
                New master puzzle every 24 hours. Solve daily to build your tactical streak and earn Peshmerga Respect.
              </p>
            </div>
          </div>

          {/* 24-Hour Countdown & Streak Metrics Pill */}
          <div className="flex items-center gap-2 sm:gap-3 w-full lg:w-auto justify-between lg:justify-end flex-wrap">
            {/* 24h Countdown Badge */}
            <div className="flex items-center gap-2 bg-black/60 px-3.5 py-2 rounded-2xl border border-white/15 backdrop-blur-md">
              <Clock className="w-4 h-4 text-[#F5C453] animate-pulse" />
              <div>
                <div className="text-[10px] uppercase font-bold text-[#DFD0B0]/60 leading-none">
                  Next Challenge In
                </div>
                <div className="text-xs sm:text-sm font-mono font-black text-white tracking-wide">
                  {timeUntilReset.formatted}
                </div>
              </div>
            </div>

            {/* Streak Counter */}
            <div className="flex items-center gap-2 bg-amber-950/50 px-3.5 py-2 rounded-2xl border border-amber-500/40 text-amber-300">
              <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
              <div>
                <div className="text-[10px] uppercase font-bold text-amber-300/70 leading-none">
                  Daily Streak
                </div>
                <div className="text-xs sm:text-sm font-mono font-black text-amber-200">
                  {dailyProgress.streak || (dailyProgress.solved ? 1 : 0)} Days
                </div>
              </div>
            </div>

            {/* Calendar / Archive Toggle */}
            <button
              onClick={() => setIsCalendarOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold transition-all hover:scale-105 cursor-pointer shadow-sm"
              title="Open Daily Puzzle Archive Calendar"
            >
              <Calendar className="w-4 h-4 text-[#F5C453]" />
              <span className="hidden sm:inline">Archive</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Tactical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: Interactive Board */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="relative p-3 sm:p-4 rounded-3xl bg-[#10140e] border-2 border-[#F5C453]/30 shadow-2xl w-full max-w-[560px] mx-auto">
            <ChessBoard
              game={puzzleGame}
              isFlipped={dailyPuzzle.playerColor === 'b'}
              boardTheme={settings.boardTheme}
              pieceTheme={settings.pieceTheme}
              showCoordinates={settings.showCoordinates}
              highlightLastMove={settings.highlightLastMove}
              showLegalMoves={settings.showLegalMoves}
              lastMove={null}
              onMove={handlePuzzleMove}
              disabled={puzzleStatus === 'completed'}
            />

            {/* Celebratory Victory Overlay directly triggered on puzzle solve */}
            {showCelebrationBanner && puzzleStatus === 'completed' && (
              <div className="absolute inset-2 sm:inset-3 rounded-2xl bg-black/85 backdrop-blur-md border-2 border-[#F5C453] shadow-2xl z-30 p-4 flex flex-col items-center justify-center text-center animate-in zoom-in-90 fade-in duration-300">
                {/* Sunburst background glow */}
                <div className="absolute w-40 h-40 bg-[#F5C453]/20 rounded-full blur-2xl pointer-events-none" />

                {/* Animated Kurdish Sun badge */}
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#8C2425] via-[#52673A] to-[#F5C453] p-0.5 shadow-xl shadow-[#F5C453]/30 mb-2.5">
                  <div className="w-full h-full bg-[#161c12] rounded-[14px] flex items-center justify-center text-[#F5C453]">
                    <Sparkles className="w-8 h-8 animate-bounce" />
                  </div>
                </div>

                <span className="text-[10px] font-black uppercase tracking-widest text-[#F5C453] bg-[#F5C453]/15 px-2.5 py-0.5 rounded-full border border-[#F5C453]/30 mb-1">
                  Tactical Victory
                </span>

                <h3 className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight">
                  Master Combination Solved!
                </h3>

                <p className="text-xs text-[#DFD0B0]/80 max-w-xs mt-1 mb-3">
                  You successfully found every grandmaster defense and mate sequence.
                </p>

                {/* Reward metrics badges */}
                <div className="flex items-center gap-2 mb-4 flex-wrap justify-center">
                  <div className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-400/40 text-amber-300 text-xs font-black flex items-center gap-1.5 shadow-sm">
                    <Award className="w-3.5 h-3.5 text-amber-400" />
                    <span>+25 Respect</span>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black flex items-center gap-1.5 shadow-sm">
                    <Trophy className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+15 Tactics Elo</span>
                  </div>
                  <div className="px-3 py-1 rounded-xl bg-[#8C2425]/30 border border-[#8C2425]/50 text-rose-200 text-xs font-black flex items-center gap-1.5 shadow-sm">
                    <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>{dailyProgress.streak || 1} Day Streak</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 w-full max-w-xs justify-center">
                  <button
                    onClick={triggerCelebrationEffects}
                    className="flex-1 py-2 px-3 rounded-xl bg-gradient-to-r from-[#F5C453] to-amber-500 hover:brightness-110 text-black font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md hover:scale-105"
                    title="Trigger celebratory confetti again"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-black" />
                    <span>Confetti</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 border border-emerald-400/40 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied!' : 'Share'}</span>
                  </button>
                  <button
                    onClick={() => setShowCelebrationBanner(false)}
                    className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all cursor-pointer"
                    title="Inspect board position"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            )}

            {/* Move Instruction / Step Progress Chip */}
            <div className="mt-3 px-4 py-2.5 rounded-2xl bg-black/80 backdrop-blur-md border border-[#F5C453]/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-base">{dailyPuzzle.playerColor === 'w' ? '⚪' : '⚫'}</span>
                <span className="font-black text-white">
                  {dailyPuzzle.playerColor === 'w' ? 'White to move and win' : 'Black to move and win'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[#DFD0B0]/80 font-mono text-[11px]">
                <span>
                  Step {Math.min(Math.floor(moveStep / 2) + 1, Math.ceil(dailyPuzzle.solutionMoves.length / 2))} /{' '}
                  {Math.ceil(dailyPuzzle.solutionMoves.length / 2)}
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.ceil(dailyPuzzle.solutionMoves.length / 2) }).map((_, idx) => (
                    <span
                      key={idx}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx < Math.floor(moveStep / 2)
                          ? 'bg-emerald-400'
                          : idx === Math.floor(moveStep / 2)
                          ? 'bg-[#F5C453] animate-ping'
                          : 'bg-white/20'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Mission Lore, Details, Feedback & Controls */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-[#F5C453]/40 shadow-xl space-y-4 relative overflow-hidden">
            {/* Header Info: Date & Solved Status */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#F5C453]" />
                <span className="text-xs font-black text-white">{getFormattedDate(selectedDateKey)}</span>
                {selectedDateKey === todayKey && (
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    TODAY
                  </span>
                )}
              </div>

              {dailyProgress.solved ? (
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-500/40 shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>SOLVED</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#F5C453] bg-[#52673A]/30 px-2.5 py-1 rounded-full border border-[#F5C453]/30">
                  <Zap className="w-3.5 h-3.5 text-[#F5C453]" />
                  <span>UNSOLVED</span>
                </div>
              )}
            </div>

            {/* Badges & Difficulty */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg bg-[#8C2425]/50 text-[#F5C453] text-[11px] font-black border border-[#F5C453]/30 shadow-sm">
                {dailyPuzzle.difficulty} ({dailyPuzzle.rating} Elo)
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-[#52673A]/50 text-emerald-300 text-[11px] font-bold border border-emerald-500/30 shadow-sm">
                {dailyPuzzle.theme}
              </span>
              <span className="px-2.5 py-0.5 rounded-lg bg-black/40 text-[#DFD0B0]/80 text-[11px] font-mono border border-white/10">
                +25 Respect
              </span>
            </div>

            {/* Title & Description */}
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">{dailyPuzzle.title}</h2>
              <p className="text-xs text-[#DFD0B0]/85 mt-1 leading-relaxed">{dailyPuzzle.description}</p>
            </div>

            {/* Peshmerga Lore / Zagros Backstory */}
            {dailyPuzzle.loreContext && (
              <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-[#F5C453]/25 text-xs text-[#DFD0B0]/90 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-[#F5C453]">
                  <span>🏔️ Zagros Tactical Heritage</span>
                </div>
                <p className="text-[11px] leading-relaxed text-[#DFD0B0]/80">{dailyPuzzle.loreContext}</p>
              </div>
            )}

            {/* Solved Victory Banner */}
            {puzzleStatus === 'completed' && (
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/80 to-[#161c12] border border-emerald-400/60 text-emerald-300 space-y-2 animate-in zoom-in-95 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="font-black text-sm text-white">Daily Tactical Victory!</h4>
                      <p className="text-[11px] text-emerald-300/80">+25 Respect Points & +15 Tactics Rating awarded</p>
                    </div>
                  </div>
                  <button
                    onClick={handleShare}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/50 border border-emerald-400/40 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{isCopied ? 'Copied!' : 'Share'}</span>
                  </button>
                </div>

                {dailyPuzzle.solutionExplanation && (
                  <div className="pt-2 border-t border-emerald-500/20 text-[11px] text-white/90 leading-relaxed">
                    <strong className="text-[#F5C453] block mb-0.5">Grandmaster Analysis:</strong>
                    {dailyPuzzle.solutionExplanation}
                  </div>
                )}
              </div>
            )}

            {/* Inaccuracy Banner */}
            {puzzleStatus === 'wrong' && (
              <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 flex items-center gap-2.5 animate-in zoom-in-95">
                <XCircle className="w-5 h-5 text-rose-400 shrink-0" />
                <div className="text-xs">
                  <strong className="block font-bold">Tactical Inaccuracy</strong>
                  <span>That was not the master move. Regroup and calculate the defense!</span>
                </div>
              </div>
            )}

            {/* Hint Box */}
            {showHint && !puzzleStatus.includes('completed') && (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs space-y-1 animate-in fade-in">
                <div className="flex items-center gap-1.5 font-bold text-amber-300">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>Peshmerga Scout Tactical Hint</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {dailyPuzzle.tacticalTidbit || 'Focus on king vulnerability, undefended pieces, or checking rays.'}
                </p>
                <div className="pt-1 text-[11px] font-mono text-amber-300/90">
                  Key move starts with piece: "
                  <strong className="text-white font-bold">{dailyPuzzle.solutionMoves[moveStep]?.charAt(0)}</strong>"
                </div>
              </div>
            )}

            {/* Full Solution Breakdown Modal/Accordion */}
            {showSolution && (
              <div className="p-3.5 rounded-2xl bg-sky-950/40 border border-sky-400/40 text-sky-200 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between font-bold text-sky-300">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-sky-400" />
                    <span>Complete Master Solution</span>
                  </span>
                  <button onClick={() => setShowSolution(false)} className="text-white/60 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap font-mono text-xs text-white">
                  {dailyPuzzle.solutionMoves.map((m, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-md bg-black/40 border border-white/10">
                      {i % 2 === 0 ? `${Math.floor(i / 2) + 1}. ` : ''}
                      <strong className="text-[#F5C453]">{m}</strong>
                    </span>
                  ))}
                </div>
                {dailyPuzzle.solutionExplanation && (
                  <p className="text-[11px] text-sky-100/80 leading-relaxed pt-1">
                    {dailyPuzzle.solutionExplanation}
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              {puzzleStatus === 'wrong' ? (
                <button
                  onClick={handleReset}
                  className="col-span-2 py-3 rounded-2xl bg-gradient-to-r from-[#8C2425] to-[#52673A] text-white font-black text-xs flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer shadow-lg border border-[#F5C453]/40"
                >
                  <RotateCcw className="w-4 h-4 text-[#F5C453]" />
                  <span>Retry Tactical Mission</span>
                </button>
              ) : puzzleStatus === 'completed' ? (
                <>
                  <button
                    onClick={handleShare}
                    className="py-3 px-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs flex items-center justify-center gap-1.5 hover:scale-[1.01] transition-all cursor-pointer shadow-md border border-emerald-400/40"
                  >
                    {isCopied ? <Check className="w-4 h-4 text-amber-300" /> : <Share2 className="w-4 h-4" />}
                    <span>{isCopied ? 'Copied!' : 'Share Result'}</span>
                  </button>
                  <button
                    onClick={() => setIsCalendarOpen(true)}
                    className="py-3 px-3 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/20 transition-all cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-[#F5C453]" />
                    <span>Browse Archive</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowHint(true)}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition-all cursor-pointer"
                  >
                    <Lightbulb className="w-3.5 h-3.5 text-[#F5C453]" />
                    <span>Tactical Hint</span>
                  </button>
                  <button
                    onClick={handleReset}
                    className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/15 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#DFD0B0]" />
                    <span>Reset Board</span>
                  </button>
                  <button
                    onClick={() => setShowSolution(prev => !prev)}
                    className="col-span-2 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[#DFD0B0]/70 hover:text-white text-[11px] font-bold flex items-center justify-center gap-1 border border-white/10 transition-all cursor-pointer"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#F5C453]" />
                    <span>{showSolution ? 'Hide Solution' : 'Reveal Grandmaster Solution'}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="glass-panel p-4 rounded-3xl border border-white/10 grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="text-base sm:text-lg font-black text-amber-400 font-mono">
                {dailyProgress.streak || (dailyProgress.solved ? 1 : 0)}
              </div>
              <div className="text-[10px] text-[#DFD0B0]/60 uppercase font-semibold">Active Streak</div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="text-base sm:text-lg font-black text-emerald-400 font-mono">
                {dailyProgress.totalDailySolved}
              </div>
              <div className="text-[10px] text-[#DFD0B0]/60 uppercase font-semibold">Total Solved</div>
            </div>

            <div className="p-2.5 rounded-2xl bg-white/[0.03] border border-white/5">
              <div className="text-base sm:text-lg font-black text-[#F5C453] font-mono">
                {profile?.respectPoints || 100}
              </div>
              <div className="text-[10px] text-[#DFD0B0]/60 uppercase font-semibold">Respect Points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Puzzle Archive Calendar Modal */}
      {isCalendarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="relative glass-panel rounded-3xl p-5 sm:p-7 max-w-xl w-full border border-[#F5C453]/40 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCalendarOpen(false)}
              className="absolute top-4 right-4 text-[#DFD0B0]/60 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#52673A]/40 text-[#F5C453] flex items-center justify-center border border-[#F5C453]/40">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-heading font-black text-white">Daily Puzzle Archive</h3>
                <p className="text-xs text-[#DFD0B0]/70">Practice or replay any daily challenge from the calendar</p>
              </div>
            </div>

            {/* Month Selector Bar */}
            <div className="flex items-center justify-between bg-black/50 p-2 rounded-2xl border border-white/10 mb-4">
              <button
                onClick={() => {
                  if (calendarMonth === 0) {
                    setCalendarMonth(11);
                    setCalendarYear(calendarYear - 1);
                  } else {
                    setCalendarMonth(calendarMonth - 1);
                  }
                }}
                className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-sm text-white font-ui">{monthTitle}</span>
              <button
                onClick={() => {
                  if (calendarMonth === 11) {
                    setCalendarMonth(0);
                    setCalendarYear(calendarYear + 1);
                  } else {
                    setCalendarMonth(calendarMonth + 1);
                  }
                }}
                className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-[#DFD0B0]/50 uppercase py-1">
                  {d}
                </div>
              ))}

              {calendarDays.map(day => {
                const isSelected = selectedDateKey === day.dateKey;
                const isSolved = (dailyProgress.solvedDates || []).includes(day.dateKey);

                return (
                  <button
                    key={day.dateKey}
                    disabled={day.isFuture}
                    onClick={() => {
                      setSelectedDateKey(day.dateKey);
                      setIsCalendarOpen(false);
                    }}
                    className={`h-16 p-1.5 rounded-2xl border flex flex-col items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-tr from-[#52673A] to-[#8C2425] border-[#F5C453] ring-2 ring-[#F5C453]/60 text-white shadow-lg'
                        : day.isToday
                        ? 'bg-amber-950/40 border-amber-400 text-amber-200'
                        : isSolved
                        ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                        : day.isFuture
                        ? 'opacity-30 cursor-not-allowed border-white/5 bg-black/20 text-white/40'
                        : 'bg-[#1a2315]/60 border-white/10 text-[#DFD0B0]/80 hover:bg-[#1a2315] hover:border-[#F5C453]/50'
                    }`}
                  >
                    <span className="text-xs font-bold font-mono">{day.dayNumber}</span>
                    <div>
                      {isSolved ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : day.isToday ? (
                        <Sun className="w-3.5 h-3.5 text-[#F5C453] animate-spin-slow" />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20 inline-block" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-[#DFD0B0]/70">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Solved
              </span>
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-[#F5C453]" /> Today's Mission
              </span>
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> Continuous Streak
              </span>
            </div>
          </div>
        </div>
      )}
    </PanelContainer>
  );
};
