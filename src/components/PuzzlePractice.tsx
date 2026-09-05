import React, { useState, useEffect } from 'react';
import { Chess, Move, Square } from 'chess.js';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings } from '../types/chess';
import { ChessBoard } from './ChessBoard';
import { soundManager } from '../utils/audio';
import { EXTENDED_PUZZLES, TacticalTheme, DifficultyLevel, getRandomPuzzle, ExtendedPuzzle } from '../utils/puzzleDatabase';
import { PanelContainer } from './PanelContainer';
import { Trophy, Flame, Target, Clock, ArrowRight, RotateCcw, CheckCircle2, XCircle, Lightbulb } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PuzzlePracticeProps {
  settings: AppSettings;
  onNavigateHome: () => void;
}

export const PuzzlePractice: React.FC<PuzzlePracticeProps> = ({ settings, onNavigateHome }) => {
  const [selectedCategory, setSelectedCategory] = useState<TacticalTheme | 'All'>('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'Any'>('Any');
  
  const [currentPuzzle, setCurrentPuzzle] = useState<ExtendedPuzzle | null>(null);
  const [game, setGame] = useState<Chess | null>(null);
  const [moveStep, setMoveStep] = useState(0);
  
  // Stats
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [solved, setSolved] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [rating, setRating] = useState(1200);
  
  // Puzzle State
  const [puzzleState, setPuzzleState] = useState<'playing' | 'correct' | 'incorrect'>('playing');
  const [startTime, setStartTime] = useState(0);
  const [timeTaken, setTimeTaken] = useState(0);
  
  const loadNextPuzzle = () => {
    const diff = selectedDifficulty === 'Any' ? undefined : selectedDifficulty;
    const next = getRandomPuzzle(selectedCategory, diff);
    setCurrentPuzzle(next);
    setGame(new Chess(next.fen));
    setMoveStep(0);
    setPuzzleState('playing');
    setStartTime(Date.now());
  };

  useEffect(() => {
    loadNextPuzzle();
  }, [selectedCategory, selectedDifficulty]);

  const handleMove = (source: Square, target: Square, promotion?: string) => {
    if (puzzleState !== 'playing' || !currentPuzzle || !game) return false;

    const gameCopy = new Chess(game.fen());
    try {
      const move = gameCopy.move({ from: source, to: target, promotion: promotion || 'q' });
      if (!move) return false;

      const expectedMoveSan = currentPuzzle.solutionMoves[moveStep];
      
      // We check if the move matches expected SAN or simple coordinate check
      const expectedGame = new Chess(game.fen());
      const expectedMoveObj = expectedGame.move(expectedMoveSan);
      
      if (move.san === expectedMoveSan || (move.from === expectedMoveObj?.from && move.to === expectedMoveObj?.to)) {
        // Correct Move
        setGame(gameCopy);
        soundManager.playMove();
        
        if (moveStep + 1 >= currentPuzzle.solutionMoves.length) {
          // Solved completely
          const timeMs = Date.now() - startTime;
          setTimeTaken(timeMs / 1000);
          setPuzzleState('correct');
          soundManager.playCorrect();
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          
          setStreak(s => {
            const newStreak = s + 1;
            setMaxStreak(m => Math.max(m, newStreak));
            return newStreak;
          });
          setSolved(s => s + 1);
          setAttempts(a => a + 1);
          
          // Basic Elo calculation logic (placeholder)
          const ratingDiff = currentPuzzle.rating - rating;
          const kFactor = 32;
          const expectedScore = 1 / (1 + Math.pow(10, ratingDiff / 400));
          setRating(Math.round(rating + kFactor * (1 - expectedScore)));
          
        } else {
          setMoveStep(s => s + 1);
        }
        return true;
      } else {
        // Incorrect Move
        setPuzzleState('incorrect');
        soundManager.playWrong();
        setStreak(0);
        setAttempts(a => a + 1);
        
        // Basic Elo penalty
        const ratingDiff = currentPuzzle.rating - rating;
        const kFactor = 32;
        const expectedScore = 1 / (1 + Math.pow(10, ratingDiff / 400));
        setRating(Math.max(400, Math.round(rating + kFactor * (0 - expectedScore))));
        return false;
      }
    } catch {
      return false;
    }
  };

  if (!currentPuzzle || !game) return null;

  return (
    <div className="w-full h-full max-h-[100dvh] flex flex-col md:flex-row bg-[var(--app-bg)] text-white overflow-hidden p-2 md:p-6 gap-6 relative">
      
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Left Column: Stats & Controls */}
      <div className="w-full md:w-[320px] flex flex-col gap-4 z-10 shrink-0">
        
        {/* Header */}
        <PanelContainer className="p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-sky-400 flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-400" />
              Tactics Trainer
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">
            Puzzle Rating: <span className="text-emerald-400 text-sm">{rating}</span>
          </p>
        </PanelContainer>

        {/* Stats Panel */}
        <PanelContainer className="p-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1 border border-white/5">
              <div className="flex items-center justify-between">
                <Flame className={`w-4 h-4 ${streak > 2 ? 'text-amber-500' : 'text-slate-500'}`} />
                <span className="text-lg font-black">{streak}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Streak</span>
            </div>
            
            <div className="bg-white/5 rounded-xl p-3 flex flex-col gap-1 border border-white/5">
              <div className="flex items-center justify-between">
                <Trophy className="w-4 h-4 text-emerald-500" />
                <span className="text-lg font-black">{solved}/{attempts}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Solved</span>
            </div>
          </div>
          
          <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: attempts > 0 ? `${(solved / attempts) * 100}%` : '0%' }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-right text-xs text-slate-400 font-bold">Accuracy: {attempts > 0 ? Math.round((solved / attempts) * 100) : 0}%</p>
        </PanelContainer>

        {/* Puzzle Info */}
        <PanelContainer className="p-4 flex flex-col gap-3 flex-1 overflow-y-auto">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 border-b border-white/10 pb-2">
            Current Puzzle
          </h2>
          <div className="space-y-2 text-sm text-slate-300">
            <div className="flex justify-between">
              <span className="text-slate-500">Theme:</span>
              <span className="font-bold text-white">{currentPuzzle.theme}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Difficulty:</span>
              <span className={`font-bold ${
                currentPuzzle.level === 'Beginner' ? 'text-emerald-400' :
                currentPuzzle.level === 'Intermediate' ? 'text-sky-400' :
                currentPuzzle.level === 'Advanced' ? 'text-amber-400' : 'text-rose-400'
              }`}>{currentPuzzle.level}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Rating:</span>
              <span className="font-bold text-white">{currentPuzzle.rating}</span>
            </div>
            <p className="text-xs text-slate-400 mt-2 bg-white/5 p-2 rounded-lg italic">
              "{currentPuzzle.description}"
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Change Category</label>
            <select 
              className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-emerald-500/50"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
            >
              <option value="All">All Categories (Mixed)</option>
              <option value="Mate in 1">Mate in 1</option>
              <option value="Mate in 2">Mate in 2</option>
              <option value="Fork">Forks</option>
              <option value="Pin">Pins</option>
              <option value="Skewer">Skewers</option>
              <option value="Endgame">Endgames</option>
            </select>
          </div>
        </PanelContainer>

      </div>

      {/* Right Column: Board & Feedback */}
      <div className="flex-1 flex flex-col items-center justify-center gap-6 z-10 max-h-full">
        
        {/* Status Banner */}
        <AnimatePresence mode="wait">
          {puzzleState === 'correct' && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              className="w-full max-w-[600px] bg-emerald-500/20 border border-emerald-500/50 rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-emerald-900/20"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="font-black text-emerald-400">Puzzle Solved!</h3>
                  <p className="text-xs text-emerald-200/70">Time: {timeTaken.toFixed(1)}s • Streak: {streak} 🔥</p>
                </div>
              </div>
              <button 
                onClick={loadNextPuzzle}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2 text-sm"
              >
                Next Puzzle <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}
          
          {puzzleState === 'incorrect' && (
            <motion.div 
              initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}
              className="w-full max-w-[600px] bg-rose-500/20 border border-rose-500/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg shadow-rose-900/20"
            >
              <div className="flex items-center gap-3">
                <XCircle className="w-6 h-6 text-rose-400" />
                <div>
                  <h3 className="font-black text-rose-400">Incorrect Move</h3>
                  <p className="text-xs text-rose-200/70">That was not the best continuation.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    setGame(new Chess(currentPuzzle.fen));
                    setMoveStep(0);
                    setPuzzleState('playing');
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-colors flex items-center gap-2 text-sm"
                >
                  <RotateCcw className="w-4 h-4" /> Retry
                </button>
                <button 
                  onClick={loadNextPuzzle}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl transition-colors flex items-center gap-2 text-sm"
                >
                  Skip <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* The Board */}
        <div className="w-full max-w-[60vh] aspect-square shadow-2xl relative rounded-xl overflow-hidden ring-1 ring-white/10">
          <ChessBoard 
            game={game}
            isFlipped={currentPuzzle.playerColor === 'b'}
            boardTheme={settings.boardTheme}
            pieceTheme={settings.pieceTheme}
            showCoordinates={settings.showCoordinates}
            highlightLastMove={settings.highlightLastMove}
            showLegalMoves={settings.showLegalMoves}
            onMove={handleMove}
            disabled={puzzleState !== 'playing'}
          />
          
          {puzzleState === 'playing' && (
            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs font-bold flex items-center gap-2 text-emerald-400 shadow-xl">
              Your Turn ({currentPuzzle.playerColor === 'w' ? 'White' : 'Black'})
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
