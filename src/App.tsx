import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess, Square, Move } from 'chess.js';
import {
  GameMode,
  BotProfile,
  TimeControl,
  PieceColor,
  PieceType,
  AppSettings,
  MoveLog,
  GameResult,
  OpeningInfo,
  RespectProfile
} from './types/chess';
import { BOT_PROFILES, TIME_CONTROLS, getBotMove, evaluateBoard, getCapturedMaterial, classifyMove, findBestMove } from './utils/chessEngine';
import { detectOpening } from './utils/openings';
import { soundManager } from './utils/audio';
import { getActiveTheme, applyThemeToDOM } from './utils/themePresets';
import { getRespectProfile, recordVictory, recordMercy } from './utils/respectSystem';
import { useAuth } from './context/AuthContext';

import { Header } from './components/Header';
import { ChessBoard } from './components/ChessBoard';
import { EvalBar } from './components/EvalBar';
import { CapturedPieces } from './components/CapturedPieces';
import { ChessClock } from './components/ChessClock';
import { MoveHistory } from './components/MoveHistory';
import { GameControls } from './components/GameControls';
import { PromotionModal } from './components/PromotionModal';
import { GameOverModal } from './components/GameOverModal';
import { NewGameModal } from './components/NewGameModal';
import { SettingsModal } from './components/SettingsModal';
import { PuzzleMode } from './components/PuzzleMode';
import { AnalysisPanel } from './components/AnalysisPanel';
import { CheckmateJudgmentModal } from './components/CheckmateJudgmentModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ProfileModal } from './components/ProfileModal';
import { FriendsModal } from './components/FriendsModal';
import { FriendChatModal } from './components/FriendChatModal';
import { OnlineMatchView } from './components/OnlineMatchView';
import { WorldwideMatchModal } from './components/WorldwideMatchModal';
import { FriendUser } from './types/chess';

export default function App() {
  const { user, profile: authProfile, updateRespectMetrics } = useAuth();

  // Global Settings with Peshmerga default
  const [settings, setSettings] = useState<AppSettings>({
    sound: true,
    volume: 0.7,
    showLegalMoves: true,
    autoQueen: false,
    flipBoard: false,
    boardTheme: 'peshmerga',
    pieceTheme: 'peshmerga',
    showCoordinates: true,
    highlightLastMove: true,
    showEvalBar: true,
    showMoveArrows: true
  });

  // Respect System Profile
  const [respectProfile, setRespectProfile] = useState<RespectProfile>(() => getRespectProfile());

  // Keep respectProfile synchronized with cloud auth profile if logged in
  useEffect(() => {
    if (authProfile) {
      setRespectProfile({
        respectPoints: authProfile.respectPoints || 100,
        elo: authProfile.elo || 1200,
        executions: authProfile.executions || 0,
        merciesGranted: authProfile.merciesGranted || 0,
        honorRank: authProfile.honorRank || 'Peshmerga Tactician',
        rankBadge: authProfile.rankBadge || '🌿'
      });
    }
  }, [authProfile]);

  // Game Mode
  const [activeMode, setActiveMode] = useState<GameMode>('ai');

  // Match Configuration
  const [currentBot, setCurrentBot] = useState<BotProfile>(BOT_PROFILES[2]); // Bishop Tactician (1400 Elo)
  const [timeControl, setTimeControl] = useState<TimeControl>(TIME_CONTROLS[5]); // Rapid 10 min
  const [playerColor, setPlayerColor] = useState<PieceColor>('w');

  // Chess Game State
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [moveLogs, setMoveLogs] = useState<MoveLog[]>([]);
  const [viewingMoveIndex, setViewingMoveIndex] = useState<number>(-1);
  const [evalScore, setEvalScore] = useState<number>(0);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Clocks
  const [whiteTime, setWhiteTime] = useState<number>(timeControl.initialSeconds);
  const [blackTime, setBlackTime] = useState<number>(timeControl.initialSeconds);
  const [isClockRunning, setIsClockRunning] = useState<boolean>(false);

  // Modals
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [isWorldwideMatchModalOpen, setIsWorldwideMatchModalOpen] = useState(false);
  const [activeChatFriend, setActiveChatFriend] = useState<FriendUser | null>(null);
  const [activeOnlineMatchId, setActiveOnlineMatchId] = useState<string | null>(null);
  const [isJudgmentModalOpen, setIsJudgmentModalOpen] = useState(false);
  const [pendingCheckmateResult, setPendingCheckmateResult] = useState<GameResult | null>(null);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  // Synchronize audio sound toggle with soundManager
  useEffect(() => {
    soundManager.setEnabled(settings.sound);
    soundManager.setVolume(settings.volume);
  }, [settings.sound, settings.volume]);

  // Initialize and apply user theme on mount
  useEffect(() => {
    try {
      const activeTheme = getActiveTheme();
      applyThemeToDOM(activeTheme);
      setSettings(prev => ({ ...prev, uiThemeId: activeTheme.id }));
    } catch (e) {
      console.error('Failed to apply initial theme:', e);
    }
  }, []);

  // Derived Board View Game (if user is browsing move history)
  const displayGame = React.useMemo(() => {
    if (viewingMoveIndex >= 0 && viewingMoveIndex < moveLogs.length) {
      const targetFen = moveLogs[viewingMoveIndex].fen;
      return new Chess(targetFen);
    }
    return game;
  }, [game, viewingMoveIndex, moveLogs]);

  // Check Game Over status
  const checkGameOver = useCallback((currentGame: Chess): GameResult | null => {
    if (currentGame.isCheckmate()) {
      const winner = currentGame.turn() === 'w' ? 'b' : 'w';
      return {
        winner,
        reason: `Checkmate! ${winner === 'w' ? 'White' : 'Black'} delivers tactical checkmate.`
      };
    }
    if (currentGame.isDraw()) {
      if (currentGame.isStalemate()) {
        return { winner: 'draw', reason: 'Stalemate — No legal moves available.' };
      }
      if (currentGame.isThreefoldRepetition()) {
        return { winner: 'draw', reason: 'Draw by threefold repetition.' };
      }
      if (currentGame.isInsufficientMaterial()) {
        return { winner: 'draw', reason: 'Draw due to insufficient material.' };
      }
      return { winner: 'draw', reason: 'Game drawn by 50-move rule.' };
    }
    return null;
  }, []);

  // Clock countdown interval
  useEffect(() => {
    if (!isClockRunning || gameResult || timeControl.category === 'unlimited') return;

    const timer = setInterval(() => {
      const turn = game.turn();
      if (turn === 'w') {
        setWhiteTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameResult({ winner: 'b', reason: 'White ran out of time on the clock!' });
            soundManager.playDefeat();
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBlackTime(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setGameResult({ winner: 'w', reason: 'Black ran out of time on the clock!' });
            soundManager.playVictory();
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isClockRunning, game, gameResult, timeControl]);

  // Execute a verified legal move
  const executeMove = useCallback(
    (from: Square, to: Square, promotionPiece?: PieceType) => {
      try {
        const prevEval = evalScore;
        const isWhiteTurn = game.turn() === 'w';

        const newGame = new Chess(game.fen());
        const moveResult = newGame.move({
          from,
          to,
          promotion: promotionPiece || 'q'
        });

        if (!moveResult) return false;

        // Sound effects
        if (newGame.isCheckmate()) {
          soundManager.playVictory();
        } else if (newGame.inCheck()) {
          soundManager.playCheck();
        } else if (moveResult.captured) {
          soundManager.playCapture();
        } else if (moveResult.flags.includes('k') || moveResult.flags.includes('q')) {
          soundManager.playCastle();
        } else {
          soundManager.playMove();
        }

        // Apply clock increment
        if (timeControl.incrementSeconds > 0) {
          if (isWhiteTurn) {
            setWhiteTime(t => t + timeControl.incrementSeconds);
          } else {
            setBlackTime(t => t + timeControl.incrementSeconds);
          }
        }

        // Start clock on first move
        if (!isClockRunning && timeControl.category !== 'unlimited') {
          setIsClockRunning(true);
        }

        // Compute new evaluation & classification
        const newScore = evaluateBoard(newGame);
        const classification = classifyMove(
          prevEval,
          newScore,
          isWhiteTurn,
          !!moveResult.captured,
          newGame.isCheckmate()
        );

        const newLog: MoveLog = {
          san: moveResult.san,
          from: moveResult.from,
          to: moveResult.to,
          piece: moveResult.piece as PieceType,
          color: moveResult.color as PieceColor,
          captured: moveResult.captured as PieceType | undefined,
          promotion: moveResult.promotion as PieceType | undefined,
          fen: newGame.fen(),
          evaluation: newScore,
          classification
        };

        setGame(newGame);
        setLastMove({ from: moveResult.from, to: moveResult.to });
        setMoveLogs(prev => [...prev, newLog]);
        setViewingMoveIndex(-1);
        setEvalScore(newScore);

        // Check for Game Over / Checkmate Judgment
        const overResult = checkGameOver(newGame);
        if (overResult) {
          setIsClockRunning(false);
          if (newGame.isCheckmate()) {
            const playerDeliveredCheckmate = 
              activeMode === 'pass_and_play' ||
              (activeMode === 'ai' && overResult.winner === playerColor);

            if (playerDeliveredCheckmate) {
              setPendingCheckmateResult(overResult);
              setIsJudgmentModalOpen(true);
            } else {
              setGameResult(overResult);
            }
          } else {
            setGameResult(overResult);
          }
        }

        return true;
      } catch {
        return false;
      }
    },
    [game, evalScore, timeControl, isClockRunning, checkGameOver, activeMode, playerColor]
  );

  // Trigger AI Move when it's bot's turn
  useEffect(() => {
    if (activeMode !== 'ai' || gameResult || isJudgmentModalOpen) {
      setIsAiThinking(false);
      return;
    }

    const isAiTurn =
      (playerColor === 'w' && game.turn() === 'b') ||
      (playerColor === 'b' && game.turn() === 'w');

    if (!isAiTurn) {
      setIsAiThinking(false);
      return;
    }

    setIsAiThinking(true);

    // Natural bot think delay (300ms - 750ms)
    const delay = Math.min(800, Math.max(300, 200 + currentBot.depth * 100));

    const timeoutId = setTimeout(() => {
      try {
        const botMove = getBotMove(game, currentBot);
        if (botMove) {
          executeMove(botMove.from as Square, botMove.to as Square, botMove.promotion as PieceType | undefined);
        }
      } catch (err) {
        console.error('AI Move calculation error:', err);
      } finally {
        setIsAiThinking(false);
      }
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [activeMode, game, playerColor, gameResult, currentBot, executeMove, isJudgmentModalOpen]);

  // Handle board square move attempts
  const handleBoardMove = (from: Square, to: Square) => {
    if (gameResult || isAiThinking || isJudgmentModalOpen) return;

    // Check if player is allowed to move in AI mode
    if (activeMode === 'ai') {
      const isPlayerTurn =
        (playerColor === 'w' && game.turn() === 'w') ||
        (playerColor === 'b' && game.turn() === 'b');
      if (!isPlayerTurn) return;
    }

    // Check if move is a pawn promotion
    const piece = game.get(from);
    const isPawn = piece && piece.type === 'p';
    const isPromotingWhite = isPawn && piece.color === 'w' && to.endsWith('8');
    const isPromotingBlack = isPawn && piece.color === 'b' && to.endsWith('1');

    if (isPromotingWhite || isPromotingBlack) {
      if (settings.autoQueen) {
        executeMove(from, to, 'q');
      } else {
        setPendingPromotion({ from, to });
      }
      return;
    }

    executeMove(from, to);
  };

  const handlePromotionSelect = (promoPiece: PieceType) => {
    if (pendingPromotion) {
      executeMove(pendingPromotion.from, pendingPromotion.to, promoPiece);
      setPendingPromotion(null);
    }
  };

  // Start fresh game with new config
  const handleStartGame = (config: {
    mode: GameMode;
    bot: BotProfile;
    playerColor: PieceColor | 'random';
    timeControl: TimeControl;
  }) => {
    const resolvedColor: PieceColor =
      config.playerColor === 'random'
        ? Math.random() < 0.5
          ? 'w'
          : 'b'
        : config.playerColor;

    setActiveMode(config.mode);
    setCurrentBot(config.bot);
    setPlayerColor(resolvedColor);
    setTimeControl(config.timeControl);

    const freshGame = new Chess();
    setGame(freshGame);
    setLastMove(null);
    setMoveLogs([]);
    setViewingMoveIndex(-1);
    setEvalScore(0);
    setGameResult(null);
    setIsAiThinking(false);
    setIsJudgmentModalOpen(false);
    setPendingCheckmateResult(null);

    setWhiteTime(config.timeControl.initialSeconds);
    setBlackTime(config.timeControl.initialSeconds);
    setIsClockRunning(false);
  };

  // Resign match
  const handleResign = () => {
    if (gameResult || isJudgmentModalOpen) return;
    const resigningColor = game.turn();
    const winningColor = resigningColor === 'w' ? 'b' : 'w';
    setGameResult({
      winner: winningColor,
      reason: `${resigningColor === 'w' ? 'White' : 'Black'} resigned the match.`
    });
    soundManager.playDefeat();
    setIsClockRunning(false);
  };

  // Undo last move
  const handleUndo = () => {
    if (moveLogs.length === 0 || gameResult || isAiThinking) return;

    // In AI mode, undo two moves (player move + AI move) so it's user's turn again
    const undoCount = activeMode === 'ai' ? 2 : 1;
    const newGame = new Chess();
    const remainingLogs = moveLogs.slice(0, Math.max(0, moveLogs.length - undoCount));

    for (const log of remainingLogs) {
      newGame.move({ from: log.from, to: log.to, promotion: log.promotion });
    }

    setGame(newGame);
    setMoveLogs(remainingLogs);
    setViewingMoveIndex(-1);
    setLastMove(remainingLogs.length > 0 ? { from: remainingLogs[remainingLogs.length - 1].from, to: remainingLogs[remainingLogs.length - 1].to } : null);
    setEvalScore(evaluateBoard(newGame));
    soundManager.playMove();
  };

  // Checkmate Judgment Decisions
  const handleExecuteJudgment = () => {
    setIsJudgmentModalOpen(false);
    const updated = recordVictory(respectProfile);
    setRespectProfile(updated);
    updateRespectMetrics({
      respectPoints: 5,
      elo: 8,
      executions: 1,
      wins: 1,
      gamesPlayed: 1
    });
    if (pendingCheckmateResult) {
      setGameResult(pendingCheckmateResult);
    }
  };

  const handleMercyJudgment = () => {
    setIsJudgmentModalOpen(false);
    const updated = recordMercy(respectProfile);
    setRespectProfile(updated);
    updateRespectMetrics({
      respectPoints: 10,
      elo: 12,
      merciesGranted: 1,
      gamesPlayed: 1
    });
    setPendingCheckmateResult(null);

    // Undo the checkmate move to give opponent another chance
    if (moveLogs.length > 0) {
      const remainingLogs = moveLogs.slice(0, moveLogs.length - 1);
      const newGame = new Chess();
      for (const log of remainingLogs) {
        newGame.move({ from: log.from, to: log.to, promotion: log.promotion });
      }
      setGame(newGame);
      setMoveLogs(remainingLogs);
      setViewingMoveIndex(-1);
      setLastMove(remainingLogs.length > 0 ? { from: remainingLogs[remainingLogs.length - 1].from, to: remainingLogs[remainingLogs.length - 1].to } : null);
      setEvalScore(evaluateBoard(newGame));
      soundManager.playVictory();
    }
  };

  // Provide engine tactical hint
  const handleGetHint = () => {
    if (gameResult || isAiThinking) return;
    try {
      const isWhite = game.turn() === 'w';
      const best = findBestMove(game, 3, isWhite);
      if (best.move) {
        soundManager.playCheck();
        setHintMessage(`💡 Engine Recommendation: Play ${best.move.san} (${best.move.from} to ${best.move.to})`);
        setTimeout(() => {
          setHintMessage(null);
        }, 5000);
      }
    } catch {
      // Ignore
    }
  };

  // Material summary
  const capturedMaterial = getCapturedMaterial(displayGame);

  // Opening book info
  const openingInfo: OpeningInfo | null = detectOpening(moveLogs.map(l => l.san));

  // Determine flipped orientation
  const isBoardFlipped =
    activeMode === 'pass_and_play'
      ? settings.flipBoard || game.turn() === 'b'
      : settings.flipBoard || playerColor === 'b';

  return (
    <div className="min-h-screen bg-[var(--app-bg,#10140e)] text-[var(--text-main,#FDFCF7)] flex flex-col selection:bg-[#F5C453]/30 selection:text-[#F5C453] relative overflow-x-hidden font-ui transition-colors duration-300">
      {/* Ambient Peshmerga Radial Mesh Gradient */}
      <div className="mesh-gradient" />

      {/* Sleek Tactical Hint Banner */}
      {hintMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-black/90 border border-[#F5C453] text-[#F5C453] text-xs font-bold shadow-2xl backdrop-blur-xl">
            <span>{hintMessage}</span>
            <button
              onClick={() => setHintMessage(null)}
              className="text-[#DFD0B0]/60 hover:text-white ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header
        activeMode={activeMode}
        onSelectMode={mode => {
          if (activeMode === 'online_match') {
            setActiveOnlineMatchId(null);
          }
          setActiveMode(mode);
        }}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenThemes={() => setIsSettingsModalOpen(true)}
        onOpenLeaderboard={() => setIsLeaderboardModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenFriends={() => setIsFriendsModalOpen(true)}
        onOpenWorldwideMatch={() => setIsWorldwideMatchModalOpen(true)}
        onNewGame={() => setIsNewGameModalOpen(true)}
        respectProfile={respectProfile}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-center max-w-7xl w-full mx-auto p-2 sm:p-4 md:p-6 z-10">
        {activeMode === 'online_match' && activeOnlineMatchId ? (
          <OnlineMatchView
            matchId={activeOnlineMatchId}
            settings={settings}
            onClose={() => {
              setActiveOnlineMatchId(null);
              setActiveMode('ai');
            }}
          />
        ) : activeMode === 'puzzle' ? (
          <PuzzleMode settings={settings} />
        ) : activeMode === 'analysis' ? (
          <AnalysisPanel settings={settings} initialPgn={game.pgn()} initialFen={game.fen()} />
        ) : (
          /* Live Match View (Play AI / Pass & Play) */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start justify-center">
            {/* Center Left: Chess Board & Eval Bar Area */}
            <div className="lg:col-span-8 flex flex-col items-center justify-center">
              {/* Top Player Status / Clock Bar */}
              <div className="w-full max-w-[560px] mb-2 flex flex-col gap-1.5">
                <ChessClock
                  timeSeconds={isBoardFlipped ? whiteTime : blackTime}
                  isActive={isClockRunning && (isBoardFlipped ? game.turn() === 'w' : game.turn() === 'b')}
                  isWhite={isBoardFlipped}
                  playerName={
                    activeMode === 'ai'
                      ? isBoardFlipped
                        ? 'Player (You)'
                        : `${currentBot.name}`
                      : isBoardFlipped
                      ? 'White Player'
                      : 'Black Player'
                  }
                  playerTitle={activeMode === 'ai' && !isBoardFlipped ? currentBot.title : undefined}
                  avatar={activeMode === 'ai' && !isBoardFlipped ? currentBot.avatar : isBoardFlipped ? '♔' : '♚'}
                  elo={activeMode === 'ai' && !isBoardFlipped ? currentBot.elo : respectProfile.elo}
                  isUnlimited={timeControl.category === 'unlimited'}
                />

                <div className="px-2 flex items-center justify-between">
                  <CapturedPieces
                    pieces={isBoardFlipped ? capturedMaterial.capturedByBlack : capturedMaterial.capturedByWhite}
                    pieceTheme={settings.pieceTheme}
                    colorOfCapturedPieces={isBoardFlipped ? 'w' : 'b'}
                    materialAdvantage={
                      isBoardFlipped
                        ? capturedMaterial.materialDifference < 0
                          ? Math.abs(capturedMaterial.materialDifference)
                          : 0
                        : capturedMaterial.materialDifference > 0
                        ? capturedMaterial.materialDifference
                        : 0
                    }
                  />

                  {isAiThinking && !isBoardFlipped && (
                    <div className="flex items-center gap-2 text-xs text-[#F5C453] font-mono animate-pulse px-2.5 py-1 rounded-full bg-[#52673A]/30 border border-[#F5C453]/40">
                      <span className="w-2 h-2 rounded-full bg-[#F5C453] animate-ping" />
                      <span>{currentBot.name} is calculating...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Main Board Stage with Evaluation Bar */}
              <div className="flex items-center justify-center gap-2 sm:gap-3 w-full">
                {settings.showEvalBar && (
                  <EvalBar score={evalScore} isFlipped={isBoardFlipped} />
                )}

                <ChessBoard
                  game={displayGame}
                  isFlipped={isBoardFlipped}
                  boardTheme={settings.boardTheme}
                  pieceTheme={settings.pieceTheme}
                  showCoordinates={settings.showCoordinates}
                  highlightLastMove={settings.highlightLastMove}
                  showLegalMoves={settings.showLegalMoves}
                  lastMove={lastMove}
                  onMove={handleBoardMove}
                  disabled={viewingMoveIndex !== -1 || isAiThinking || !!gameResult || isJudgmentModalOpen}
                />
              </div>

              {/* Bottom Player Status / Clock Bar */}
              <div className="w-full max-w-[560px] mt-2 flex flex-col gap-1.5">
                <div className="px-2 flex items-center justify-between">
                  <CapturedPieces
                    pieces={isBoardFlipped ? capturedMaterial.capturedByWhite : capturedMaterial.capturedByBlack}
                    pieceTheme={settings.pieceTheme}
                    colorOfCapturedPieces={isBoardFlipped ? 'b' : 'w'}
                    materialAdvantage={
                      isBoardFlipped
                        ? capturedMaterial.materialDifference > 0
                          ? capturedMaterial.materialDifference
                          : 0
                        : capturedMaterial.materialDifference < 0
                        ? Math.abs(capturedMaterial.materialDifference)
                        : 0
                    }
                  />

                  {isAiThinking && isBoardFlipped && (
                    <div className="flex items-center gap-2 text-xs text-[#F5C453] font-mono animate-pulse px-2.5 py-1 rounded-full bg-[#52673A]/30 border border-[#F5C453]/40">
                      <span className="w-2 h-2 rounded-full bg-[#F5C453] animate-ping" />
                      <span>{currentBot.name} is calculating...</span>
                    </div>
                  )}
                </div>

                <ChessClock
                  timeSeconds={isBoardFlipped ? blackTime : whiteTime}
                  isActive={isClockRunning && (isBoardFlipped ? game.turn() === 'b' : game.turn() === 'w')}
                  isWhite={!isBoardFlipped}
                  playerName={
                    activeMode === 'ai'
                      ? isBoardFlipped
                        ? `${currentBot.name}`
                        : 'Player (You)'
                      : isBoardFlipped
                      ? 'Black Player'
                      : 'White Player'
                  }
                  playerTitle={activeMode === 'ai' && isBoardFlipped ? currentBot.title : undefined}
                  avatar={activeMode === 'ai' && isBoardFlipped ? currentBot.avatar : isBoardFlipped ? '♚' : '♔'}
                  elo={activeMode === 'ai' && isBoardFlipped ? currentBot.elo : respectProfile.elo}
                  isUnlimited={timeControl.category === 'unlimited'}
                />
              </div>
            </div>

            {/* Right Sidebar: History & Tactical Controls */}
            <div className="lg:col-span-4 flex flex-col gap-3 w-full max-w-[560px] mx-auto lg:max-w-none">
              {/* Game Control Action Buttons */}
              <GameControls
                onNewGame={() => setIsNewGameModalOpen(true)}
                onFlipBoard={() => setSettings(s => ({ ...s, flipBoard: !s.flipBoard }))}
                onUndo={handleUndo}
                onResign={handleResign}
                onHint={handleGetHint}
                soundEnabled={settings.sound}
                onToggleSound={() => setSettings(s => ({ ...s, sound: !s.sound }))}
                canUndo={moveLogs.length > 0 && !gameResult && !isAiThinking}
                isAiMode={activeMode === 'ai'}
              />

              {/* Move Notation & History Log */}
              <div className="h-[340px] sm:h-[400px]">
                <MoveHistory
                  moveLogs={moveLogs}
                  currentMoveIndex={viewingMoveIndex >= 0 ? viewingMoveIndex : moveLogs.length - 1}
                  onSelectMoveIndex={idx => {
                    if (idx === moveLogs.length - 1) {
                      setViewingMoveIndex(-1);
                    } else {
                      setViewingMoveIndex(idx);
                    }
                  }}
                  openingInfo={openingInfo}
                  pgn={game.pgn()}
                  fen={displayGame.fen()}
                />
              </div>

              {/* Quick Game Info Card */}
              <div className="p-3.5 glass-card flex items-center justify-between text-xs text-[#DFD0B0]/70">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F5C453] shadow-[0_0_8px_rgba(245,196,83,0.6)]" />
                  <span className="font-bold text-[#FDFCF7]">
                    {activeMode === 'ai' ? `Vs ${currentBot.name} (${currentBot.elo} Elo)` : 'Pass & Play Local'}
                  </span>
                </div>
                <span className="font-mono font-bold text-[#F5C453] px-2 py-0.5 rounded-md bg-[#52673A]/40 border border-[#F5C453]/30">
                  {timeControl.name}
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Promotion Selector Modal */}
      {pendingPromotion && (
        <PromotionModal
          color={game.turn() as PieceColor}
          pieceTheme={settings.pieceTheme}
          onSelect={handlePromotionSelect}
        />
      )}

      {/* Checkmate Judgment Modal (Execute vs Spare Mercy) */}
      {isJudgmentModalOpen && (
        <CheckmateJudgmentModal
          onExecute={handleExecuteJudgment}
          onMercy={handleMercyJudgment}
          onClose={() => {
            setIsJudgmentModalOpen(false);
            if (pendingCheckmateResult) setGameResult(pendingCheckmateResult);
          }}
          opponentName={activeMode === 'ai' ? currentBot.name : 'Opponent'}
        />
      )}

      {/* Game Over Modal */}
      {gameResult && !isJudgmentModalOpen && (
        <GameOverModal
          result={gameResult}
          onRematch={() => {
            handleStartGame({
              mode: activeMode,
              bot: currentBot,
              playerColor: playerColor,
              timeControl: timeControl
            });
          }}
          onNewGame={() => {
            setGameResult(null);
            setIsNewGameModalOpen(true);
          }}
          onAnalyze={() => {
            setGameResult(null);
            setActiveMode('analysis');
          }}
          onClose={() => setGameResult(null)}
        />
      )}

      {/* New Game Matchmaker Modal */}
      <NewGameModal
        isOpen={isNewGameModalOpen}
        onClose={() => setIsNewGameModalOpen(false)}
        onStartGame={handleStartGame}
        onOpenWorldwideMatch={() => {
          setIsNewGameModalOpen(false);
          setIsWorldwideMatchModalOpen(true);
        }}
        initialMode={activeMode}
      />

      {/* Worldwide Quick Match Live Modal */}
      <WorldwideMatchModal
        isOpen={isWorldwideMatchModalOpen}
        onClose={() => setIsWorldwideMatchModalOpen(false)}
        onMatchFound={matchId => {
          setIsWorldwideMatchModalOpen(false);
          setActiveOnlineMatchId(matchId);
          setActiveMode('online_match');
        }}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSettings={newS => setSettings(prev => ({ ...prev, ...newS }))}
        onThemeChange={theme => {
          setSettings(prev => ({ ...prev, uiThemeId: theme.id }));
        }}
      />

      {/* Respect & Honor Leaderboard Modal */}
      {isLeaderboardModalOpen && (
        <LeaderboardModal
          profile={respectProfile}
          onClose={() => setIsLeaderboardModalOpen(false)}
        />
      )}

      {/* Profile & Google Auth Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Friends & Social Panel Modal */}
      <FriendsModal
        isOpen={isFriendsModalOpen}
        onClose={() => setIsFriendsModalOpen(false)}
        onOpenChat={friend => {
          setIsFriendsModalOpen(false);
          setActiveChatFriend(friend);
        }}
        onChallengeFriend={friend => {
          setIsFriendsModalOpen(false);
          setActiveChatFriend(friend);
        }}
      />

      {/* Friends 1-on-1 Private Chat Modal */}
      <FriendChatModal
        isOpen={!!activeChatFriend}
        onClose={() => setActiveChatFriend(null)}
        friend={activeChatFriend}
        onStartOnlineMatch={matchId => {
          setActiveChatFriend(null);
          setActiveOnlineMatchId(matchId);
          setActiveMode('online_match');
        }}
      />
    </div>
  );
}
