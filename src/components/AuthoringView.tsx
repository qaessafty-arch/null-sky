import React, { useState, useEffect, useCallback } from 'react';
import { PanelContainer } from './PanelContainer';
import { Chess, Square, Move } from 'chess.js';
import { AppSettings, AuthoredPuzzle, PieceColor, PieceType } from '../types/chess';
import { ChessBoard } from './ChessBoard';
import { useAuth } from '../context/AuthContext';
import { 
  getLocalAuthoredPuzzles, 
  saveAuthoredPuzzle, 
  deleteAuthoredPuzzle, 
  likeAuthoredPuzzle, 
  recordPuzzleSolve,
  validateFen,
  validateSolutionMoves
} from '../services/authoringService';
import { soundManager } from '../utils/audio';
import { 
  PenTool, 
  Play, 
  Plus, 
  Save, 
  Trash2, 
  Heart, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles, 
  HelpCircle, 
  Share2, 
  Code, 
  Compass, 
  Sun, 
  Award, 
  Layers, 
  Flame, 
  Check, 
  BookOpen, 
  RefreshCw,
  Eye
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthoringViewProps {
  settings: AppSettings;
  onSelectPuzzleToSolve?: (puzzle: AuthoredPuzzle) => void;
  onOpenAnalysisWithFen?: (fen: string) => void;
}

const THEME_OPTIONS = [
  'Queen Sacrifice & Mate',
  'Jamadani Knight Fork',
  '7th Rank Rook Infiltration',
  'Peshmerga Citadel Defense',
  'Sunburst Mate',
  'Discovered Check',
  'Back-Rank Mate',
  'Pin & Skewer',
  'Tactical Deflection',
  'Endgame Technique'
];

export const AuthoringView: React.FC<AuthoringViewProps> = ({
  settings,
  onSelectPuzzleToSolve,
  onOpenAnalysisWithFen
}) => {
  const { profile, user } = useAuth();

  const [tab, setTab] = useState<'create' | 'library' | 'community'>('create');
  const [puzzles, setPuzzles] = useState<AuthoredPuzzle[]>(() => getLocalAuthoredPuzzles());

  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('Kurdish Citadel Combination');
  const [description, setDescription] = useState('Sacrifice material to infiltrate the opponent citadel and force a royal checkmate.');
  const [theme, setTheme] = useState(THEME_OPTIONS[0]);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Master'>('Hard');
  const [rating, setRating] = useState(1850);
  const [playerColor, setPlayerColor] = useState<PieceColor>('w');
  const [fenInput, setFenInput] = useState('r1b2rk1/pp3ppp/2n1p3/3pP3/5P2/2NB1N2/PPP3PP/R2Q1RK1 w - - 0 1');
  const [hints, setHints] = useState<string[]>(['Look for the dynamic bishop strike on the king!']);
  const [newHintText, setNewHintText] = useState('');

  // Recorded Solution Moves
  const [solutionMoves, setSolutionMoves] = useState<string[]>(['Bxh7+', 'Kxh7', 'Ng5+', 'Kg8', 'Qh5']);

  // Board and recording state
  const [boardGame, setBoardGame] = useState<Chess>(() => new Chess(fenInput));
  const [isRecordingMoves, setIsRecordingMoves] = useState(true);
  const [testSolving, setTestSolving] = useState(false);
  const [solveStep, setSolveStep] = useState(0);
  const [solveSuccess, setSolveSuccess] = useState(false);
  const [testError, setTestError] = useState<string | null>(null);

  // Status message
  const [bannerMessage, setBannerMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Synchronize board when FEN changes
  const applyFen = (newFen: string) => {
    const val = validateFen(newFen);
    if (!val.valid) {
      setBannerMessage({ type: 'error', text: val.error || 'Invalid FEN' });
      return;
    }
    setFenInput(newFen);
    try {
      const g = new Chess(newFen);
      setBoardGame(g);
      setPlayerColor(g.turn() === 'w' ? 'w' : 'b');
      setSolutionMoves([]);
      setBannerMessage({ type: 'info', text: 'Board position updated from FEN.' });
    } catch (e) {
      console.error(e);
    }
  };

  const handleMakeBoardMove = (from: Square, to: Square) => {
    try {
      const copy = new Chess(boardGame.fen());
      const move = copy.move({ from, to, promotion: 'q' });
      if (!move) return;

      soundManager.playMove();

      if (testSolving) {
        // Test solving mode
        const expectedSan = solutionMoves[solveStep];
        if (move.san === expectedSan) {
          setBoardGame(copy);
          const nextStep = solveStep + 1;
          setSolveStep(nextStep);
          setTestError(null);

          if (nextStep >= solutionMoves.length) {
            setSolveSuccess(true);
            soundManager.playVictory();
            try {
              confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
            } catch {}
          } else {
            // Opponent auto reply in test mode
            const opponentSan = solutionMoves[nextStep];
            setTimeout(() => {
              try {
                const autoGame = new Chess(copy.fen());
                autoGame.move(opponentSan);
                setBoardGame(autoGame);
                setSolveStep(nextStep + 1);
                soundManager.playMove();
              } catch (e) {
                console.error(e);
              }
            }, 500);
          }
        } else {
          setTestError(`Move "${move.san}" is not the recorded solution move (Expected: ${expectedSan || 'None'}).`);
          soundManager.playDefeat();
        }
      } else {
        // Authoring / Recording mode
        setBoardGame(copy);
        setSolutionMoves(prev => [...prev, move.san]);
      }
    } catch (e) {
      console.error('Error during board move:', e);
    }
  };

  const resetBoardToInitial = () => {
    try {
      const g = new Chess(fenInput);
      setBoardGame(g);
      setSolveStep(0);
      setSolveSuccess(false);
      setTestError(null);
    } catch {}
  };

  const handleAddHint = () => {
    if (!newHintText.trim()) return;
    setHints(prev => [...prev, newHintText.trim()]);
    setNewHintText('');
  };

  const handleRemoveHint = (index: number) => {
    setHints(prev => prev.filter((_, i) => i !== index));
  };

  const handleSavePuzzle = async () => {
    if (!title.trim()) {
      setBannerMessage({ type: 'error', text: 'Please provide a title for your tactical scenario.' });
      return;
    }
    if (solutionMoves.length === 0) {
      setBannerMessage({ type: 'error', text: 'Please play at least one solution move on the board.' });
      return;
    }

    const val = validateSolutionMoves(fenInput, solutionMoves);
    if (!val.valid) {
      setBannerMessage({ type: 'error', text: val.error || 'Invalid move sequence' });
      return;
    }

    const newPuzzle: AuthoredPuzzle = {
      id: editingId || `authored-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      description: description.trim(),
      theme,
      difficulty,
      rating,
      fen: fenInput,
      playerColor,
      solutionMoves,
      hints,
      authorUid: user?.uid || 'warrior-author',
      authorName: profile?.displayName || user?.displayName || 'Peshmerga Tactician',
      authorBadge: profile?.rankBadge || '☀️',
      createdAt: new Date().toISOString(),
      likesCount: 0,
      solvesCount: 0,
      isPublished: true
    };

    await saveAuthoredPuzzle(newPuzzle);
    setPuzzles(getLocalAuthoredPuzzles());
    setBannerMessage({ type: 'success', text: 'Tactical Puzzle successfully saved and published!' });
    soundManager.playVictory();
    setEditingId(newPuzzle.id);
  };

  const handleLoadPuzzleForEdit = (p: AuthoredPuzzle) => {
    setEditingId(p.id);
    setTitle(p.title);
    setDescription(p.description);
    setTheme(p.theme);
    setDifficulty(p.difficulty);
    setRating(p.rating);
    setPlayerColor(p.playerColor);
    setFenInput(p.fen);
    setSolutionMoves(p.solutionMoves);
    setHints(p.hints || []);
    try {
      setBoardGame(new Chess(p.fen));
    } catch {}
    setTab('create');
    setTestSolving(false);
    setBannerMessage({ type: 'info', text: `Loaded "${p.title}" for editing.` });
  };

  const handleDeletePuzzle = async (id: string) => {
    if (window.confirm('Delete this authored puzzle?')) {
      await deleteAuthoredPuzzle(id);
      setPuzzles(getLocalAuthoredPuzzles());
      setBannerMessage({ type: 'info', text: 'Puzzle deleted.' });
    }
  };

  const handleLike = async (p: AuthoredPuzzle) => {
    await likeAuthoredPuzzle(p.id);
    setPuzzles(getLocalAuthoredPuzzles());
    soundManager.playCapture();
  };

  const startTestSolving = () => {
    resetBoardToInitial();
    setTestSolving(true);
    setSolveStep(0);
    setSolveSuccess(false);
    setTestError(null);
  };

  const stopTestSolving = () => {
    resetBoardToInitial();
    setTestSolving(false);
  };

  return (
    <PanelContainer>
      {/* Top Header Card */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-[#F5C453]/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8C2425] via-[#52673A] to-[#F5C453] p-0.5 shadow-lg shadow-[#F5C453]/25 flex-shrink-0">
            <div className="w-full h-full bg-[#161c12] rounded-[14px] flex items-center justify-center text-[#F5C453]">
              <PenTool className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight">
                Chesskys Creator Studio
              </h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#8C2425] text-white border border-[#F5C453]/40 uppercase tracking-wider">
                Authoring Hub
              </span>
            </div>
            <p className="text-xs text-[#DFD0B0]/75">
              Design, test, and publish tactical chess puzzles and historical Kurdish battle scenarios.
            </p>
          </div>
        </div>

        {/* Studio Sub-Tabs */}
        <div className="flex items-center gap-1.5 bg-[#161c12] p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => { setTab('create'); setTestSolving(false); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'create'
                ? 'bg-[#52673A] text-white shadow-md border border-[#F5C453]/50'
                : 'text-[#DFD0B0]/70 hover:text-white'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Puzzle Creator</span>
          </button>

          <button
            onClick={() => setTab('library')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              tab === 'library'
                ? 'bg-[#52673A] text-white shadow-md border border-[#F5C453]/50'
                : 'text-[#DFD0B0]/70 hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>My Creations ({puzzles.length})</span>
          </button>
        </div>
      </div>

      {/* Banner Feedback */}
      {bannerMessage && (
        <div className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between animate-in fade-in ${
          bannerMessage.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
            : bannerMessage.type === 'error'
            ? 'bg-rose-950/80 border-rose-500/50 text-rose-200'
            : 'bg-amber-950/80 border-amber-500/50 text-amber-200'
        }`}>
          <span>{bannerMessage.text}</span>
          <button onClick={() => setBannerMessage(null)} className="text-white/60 hover:text-white font-mono">✕</button>
        </div>
      )}

      {/* TAB 1: CREATOR & INTERACTIVE RECORDER */}
      {tab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Chessboard & Solution Moves Visualizer */}
          <div className="lg:col-span-7 flex flex-col items-center">
            <div className="p-3.5 rounded-3xl bg-[#10140e] border-2 border-[#F5C453]/30 shadow-2xl w-full max-w-[540px]">
              {/* Board Header Status */}
              <div className="mb-3 px-3 py-2 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${testSolving ? 'bg-amber-400 animate-ping' : 'bg-emerald-400'}`} />
                  <span className="font-bold text-white">
                    {testSolving ? `Test Solve Mode (Step ${solveStep}/${solutionMoves.length})` : 'Position & Solution Recorder'}
                  </span>
                </div>
                <span className="text-[#DFD0B0]/70 font-mono text-[11px]">
                  Turn: {boardGame.turn() === 'w' ? 'White ⚪' : 'Black ⚫'}
                </span>
              </div>

              {/* Main Board */}
              <ChessBoard
                game={boardGame}
                isFlipped={playerColor === 'b'}
                boardTheme={settings.boardTheme}
                pieceTheme={settings.pieceTheme}
                showCoordinates={settings.showCoordinates}
                highlightLastMove={settings.highlightLastMove}
                showLegalMoves={settings.showLegalMoves}
                onMove={handleMakeBoardMove}
              />

              {/* Action Controls for the Board */}
              <div className="mt-3.5 flex items-center gap-2 flex-wrap justify-between">
                <div className="flex items-center gap-1.5">
                  {!testSolving ? (
                    <button
                      onClick={startTestSolving}
                      disabled={solutionMoves.length === 0}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 disabled:opacity-40 text-black font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      <Play className="w-3.5 h-3.5 fill-black" />
                      <span>Test Solve</span>
                    </button>
                  ) : (
                    <button
                      onClick={stopTestSolving}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Exit Test</span>
                    </button>
                  )}

                  <button
                    onClick={resetBoardToInitial}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#DFD0B0] text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                    title="Reset to starting FEN"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>

                <button
                  onClick={() => setSolutionMoves([])}
                  disabled={solutionMoves.length === 0 || testSolving}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                >
                  Clear Moves
                </button>
              </div>

              {/* Test Solve Victory Banner */}
              {solveSuccess && (
                <div className="mt-3 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs font-bold text-center animate-in zoom-in-95 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Success! Solution verified perfectly from start to finish.</span>
                </div>
              )}

              {/* Test Solve Error */}
              {testError && (
                <div className="mt-3 p-3 rounded-2xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-bold text-center">
                  {testError}
                </div>
              )}
            </div>

            {/* Recorded Move Sequence Flow */}
            <div className="w-full max-w-[540px] mt-4 p-4 rounded-3xl bg-black/60 border border-white/10">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-black uppercase tracking-wider text-[#DFD0B0]/70 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#F5C453]" />
                  Recorded Solution Sequence ({solutionMoves.length} moves)
                </span>
                <span className="text-[10px] text-amber-300 font-mono">
                  {solutionMoves.length === 0 ? 'Play moves on the board to record' : 'Moves validated in order'}
                </span>
              </div>

              {solutionMoves.length === 0 ? (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-dashed border-white/15 text-center text-xs text-white/40">
                  Click and drag pieces on the board above to record the winning tactical solution!
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {solutionMoves.map((m, idx) => (
                    <div
                      key={idx}
                      className={`px-3 py-1 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 border shadow-sm ${
                        testSolving && solveStep === idx
                          ? 'bg-amber-500 text-black border-amber-300 font-black animate-pulse'
                          : testSolving && solveStep > idx
                          ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40'
                          : 'bg-[#52673A]/40 text-white border-[#F5C453]/40'
                      }`}
                    >
                      <span className="text-[10px] opacity-60">#{idx + 1}</span>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Scenario Metadata & Publishing Configuration */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel p-5 rounded-3xl border border-[#F5C453]/30 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#F5C453]" />
                  <span>Scenario Specification</span>
                </h3>
                <span className="text-xs font-mono text-[#F5C453] bg-[#F5C453]/10 px-2 py-0.5 rounded-md">
                  {playerColor === 'w' ? 'White to Move' : 'Black to Move'}
                </span>
              </div>

              {/* Title & Lore */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#DFD0B0]">Puzzle Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g., Mount Qandil Fortress Breakout"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs font-bold focus:border-[#F5C453] focus:outline-none"
                />
              </div>

              {/* Tactical Theme */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#DFD0B0]">Tactical Theme</label>
                  <select
                    value={theme}
                    onChange={e => setTheme(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs font-bold focus:border-[#F5C453] focus:outline-none cursor-pointer"
                  >
                    {THEME_OPTIONS.map(opt => (
                      <option key={opt} value={opt} className="bg-[#161c12] text-white">
                        {opt}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#DFD0B0]">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={e => setDifficulty(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs font-bold focus:border-[#F5C453] focus:outline-none cursor-pointer"
                  >
                    <option value="Easy" className="bg-[#161c12]">Easy (1000 - 1300)</option>
                    <option value="Medium" className="bg-[#161c12]">Medium (1300 - 1700)</option>
                    <option value="Hard" className="bg-[#161c12]">Hard (1700 - 2100)</option>
                    <option value="Master" className="bg-[#161c12]">Master (2100+)</option>
                  </select>
                </div>
              </div>

              {/* Rating Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#DFD0B0]">Target Tactical Rating</span>
                  <span className="font-black text-[#F5C453] font-mono">{rating} Elo</span>
                </div>
                <input
                  type="range"
                  min={800}
                  max={2800}
                  step={25}
                  value={rating}
                  onChange={e => setRating(Number(e.target.value))}
                  className="w-full accent-[#F5C453] cursor-pointer"
                />
              </div>

              {/* FEN String Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#DFD0B0] flex items-center justify-between">
                  <span>Starting Position (FEN)</span>
                  <button
                    onClick={() => applyFen('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')}
                    className="text-[10px] text-amber-300 hover:underline cursor-pointer"
                  >
                    Set Starting Board
                  </button>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={fenInput}
                    onChange={e => applyFen(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white font-mono text-[11px] focus:border-[#F5C453] focus:outline-none"
                  />
                  <button
                    onClick={() => onOpenAnalysisWithFen && onOpenAnalysisWithFen(fenInput)}
                    className="px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
                    title="Open in Analysis Engine"
                  >
                    <Compass className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Description / Tactical Clue */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#DFD0B0]">Description & Tactical Lore</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Explain the tactical goal or historic lore of this position..."
                  className="w-full px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white text-xs focus:border-[#F5C453] focus:outline-none"
                />
              </div>

              {/* Tactical Hints */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#DFD0B0]">Author's Hints</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newHintText}
                    onChange={e => setNewHintText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddHint()}
                    placeholder="Add a helpful solving hint..."
                    className="flex-1 px-3 py-2 rounded-xl bg-black/60 border border-white/20 text-white text-xs focus:border-[#F5C453] focus:outline-none"
                  />
                  <button
                    onClick={handleAddHint}
                    className="px-3 py-2 rounded-xl bg-[#52673A] text-white text-xs font-bold hover:brightness-110 cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="space-y-1">
                  {hints.map((h, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-[#DFD0B0]">
                      <span className="truncate pr-2">💡 {h}</span>
                      <button onClick={() => handleRemoveHint(i)} className="text-rose-400 hover:text-rose-300 font-mono text-xs">✕</button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save / Publish Button */}
              <button
                onClick={handleSavePuzzle}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#52673A] via-[#8C2425] to-[#F5C453] hover:brightness-110 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#F5C453]/20 border border-[#F5C453]/50 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Save & Publish Tactical Scenario</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MY CREATIONS & COMMUNITY SHOWCASE */}
      {tab === 'library' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <Sun className="w-5 h-5 text-[#F5C453]" />
              <span>Authored Tactical Challenges ({puzzles.length})</span>
            </h3>
            <button
              onClick={() => {
                setEditingId(null);
                setTitle('New Tactical Challenge');
                setFenInput('r1b2rk1/pp3ppp/2n1p3/3pP3/5P2/2NB1N2/PPP3PP/R2Q1RK1 w - - 0 1');
                setBoardGame(new Chess('r1b2rk1/pp3ppp/2n1p3/3pP3/5P2/2NB1N2/PPP3PP/R2Q1RK1 w - - 0 1'));
                setSolutionMoves([]);
                setTab('create');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-[#52673A] hover:bg-[#52673A]/90 text-white text-xs font-bold flex items-center gap-1.5 border border-[#F5C453]/40 cursor-pointer shadow-md"
            >
              <Plus className="w-4 h-4 text-[#F5C453]" />
              <span>Create New</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {puzzles.map(p => (
              <div
                key={p.id}
                className="glass-panel p-4 rounded-3xl border border-[#F5C453]/25 hover:border-[#F5C453]/60 transition-all shadow-lg flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#F5C453] bg-[#F5C453]/15 px-2 py-0.5 rounded-md border border-[#F5C453]/30">
                        {p.theme}
                      </span>
                      <h4 className="text-base font-black text-white mt-1.5 leading-snug">
                        {p.title}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-amber-400 font-mono">{p.rating} Elo</span>
                      <div className="text-[10px] text-white/50">{p.difficulty}</div>
                    </div>
                  </div>

                  <p className="text-xs text-[#DFD0B0]/75 line-clamp-2">
                    {p.description}
                  </p>

                  <div className="mt-3 flex items-center gap-3 text-[11px] text-[#DFD0B0]/60">
                    <span>By {p.authorName}</span>
                    <span>•</span>
                    <span>{p.solutionMoves.length} moves</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLike(p)}
                      className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-rose-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />
                      <span>{p.likesCount || 0}</span>
                    </button>
                    <span className="text-[11px] text-white/50">{p.solvesCount || 0} solves</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleLoadPuzzleForEdit(p)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                      title="Edit Scenario"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleDeletePuzzle(p.id)}
                      className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </PanelContainer>
  );
};
