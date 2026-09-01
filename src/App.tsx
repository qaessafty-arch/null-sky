import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
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
import { AntiCheatEngine } from "./utils/security";
import { socketService } from './utils/socket';
import { getActiveTheme, applyThemeToDOM } from './utils/themePresets';
import { getRespectProfile, recordVictory, recordMercy } from './utils/respectSystem';
import { useAuth } from './context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ChessBoard } from './components/ChessBoard';
import { EvalBar } from './components/EvalBar';
import { CapturedPieces } from './components/CapturedPieces';
import { ChessClock } from './components/ChessClock';
import { MoveHistory } from './components/MoveHistory';
import { GameControls } from './components/GameControls';
import { LocalChatDock } from './components/LocalChatDock';
import { PromotionModal } from './components/PromotionModal';
import { ViewFallback } from './components/ViewFallback';
import type { SettingsTab } from './components/SettingsModal';
import { logCompletedGame } from './services/loggingService';
import { FriendUser } from './types/chess';

// Everything below the live board is loaded on demand: the first paint only
// needs the board, the clocks and the header.
const lazyPreload = <P extends object>(load: () => Promise<{ default: React.ComponentType<P> }>) => {
  const Component = lazy(load) as React.LazyExoticComponent<React.ComponentType<P>> & { preload: () => void };
  Component.preload = () => { void load(); };
  return Component;
};

const ThemeSelectorModal = lazyPreload(() => import('./components/ThemeSelectorModal').then(m => ({ default: m.ThemeSelectorModal })));
const GameOverModal = lazyPreload(() => import('./components/GameOverModal').then(m => ({ default: m.GameOverModal })));
const NewGameModal = lazyPreload(() => import('./components/NewGameModal').then(m => ({ default: m.NewGameModal })));
const SettingsModal = lazyPreload(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const PuzzleMode = lazyPreload(() => import('./components/PuzzleMode').then(m => ({ default: m.PuzzleMode })));
const DailyPuzzleView = lazyPreload(() => import('./components/DailyPuzzleView').then(m => ({ default: m.DailyPuzzleView })));
const AnalysisPanel = lazyPreload(() => import('./components/AnalysisPanel').then(m => ({ default: m.AnalysisPanel })));
const CheckmateJudgmentModal = lazyPreload(() => import('./components/CheckmateJudgmentModal').then(m => ({ default: m.CheckmateJudgmentModal })));
const LeaderboardModal = lazyPreload(() => import('./components/LeaderboardModal').then(m => ({ default: m.LeaderboardModal })));
const ProfileModal = lazyPreload(() => import('./components/ProfileModal').then(m => ({ default: m.ProfileModal })));
const FriendsModal = lazyPreload(() => import('./components/FriendsModal').then(m => ({ default: m.FriendsModal })));
const FriendChatModal = lazyPreload(() => import('./components/FriendChatModal').then(m => ({ default: m.FriendChatModal })));
const OnlineMatchView = lazyPreload(() => import('./components/OnlineMatchView').then(m => ({ default: m.OnlineMatchView })));
const WorldwideMatchModal = lazyPreload(() => import('./components/WorldwideMatchModal').then(m => ({ default: m.WorldwideMatchModal })));
const WorldwideLeaderboardView = lazyPreload(() => import('./components/WorldwideLeaderboardView').then(m => ({ default: m.WorldwideLeaderboardView })));
const AuthoringView = lazyPreload(() => import('./components/AuthoringView').then(m => ({ default: m.AuthoringView })));
const LoggingView = lazyPreload(() => import('./components/LoggingView').then(m => ({ default: m.LoggingView })));
const DatabaseView = lazyPreload(() => import('./components/DatabaseView').then(m => ({ default: m.DatabaseView })));
const MultiplayerLobbyView = lazyPreload(() => import('./components/MultiplayerLobbyView').then(m => ({ default: m.MultiplayerLobbyView })));
const LoginPage = lazyPreload(() => import('./components/LoginPage').then(m => ({ default: m.LoginPage })));
const UserProfilePage = lazyPreload(() => import('./components/UserProfilePage').then(m => ({ default: m.UserProfilePage })));

export default function App() {
  const { user, profile: authProfile, updateRespectMetrics } = useAuth();
  const { t, i18n } = useTranslation();

  // Global Settings with Obsidian default
  const [settings, setSettings] = useState<AppSettings>({
    sound: true,
    volume: 0.7,
    showLegalMoves: true,
    autoQueen: false,
    flipBoard: false,
    boardTheme: 'obsidian',
    pieceTheme: 'classic',
    showCoordinates: true,
    highlightLastMove: true,
    showEvalBar: true,
    showMoveArrows: true
  });

  // Respect System Profile
  const [respectProfile, setRespectProfile] = useState<RespectProfile>(() => getRespectProfile());

  useEffect(() => {
    AntiCheatEngine.initializeTelemetry();
  }, []);

  // Warm the chunks a player reaches for first, once the board is interactive.
  useEffect(() => {
    const preload = () => {
      NewGameModal.preload();
      GameOverModal.preload();
      SettingsModal.preload();
      ThemeSelectorModal.preload();
    };
    const idle = window.requestIdleCallback;
    if (idle) {
      const handle = idle(preload);
      return () => window.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(preload, 1500);
    return () => window.clearTimeout(timer);
  }, []);

  // Sync respect profile

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
  const [redoStack, setRedoStack] = useState<MoveLog[]>([]);
  const [viewingMoveIndex, setViewingMoveIndex] = useState<number>(-1);
  const [evalScore, setEvalScore] = useState<number>(0);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Clocks
  const [whiteTime, setWhiteTime] = useState<number>(timeControl.initialSeconds);
  const [blackTime, setBlackTime] = useState<number>(timeControl.initialSeconds);
  const [isClockRunning, setIsClockRunning] = useState<boolean>(false);

  // Navigation & Modals
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isNewGameModalOpen, setIsNewGameModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('themes');
  const [isLeaderboardModalOpen, setIsLeaderboardModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [isWorldwideMatchModalOpen, setIsWorldwideMatchModalOpen] = useState(false);
  const [activeChatFriend, setActiveChatFriend] = useState<FriendUser | null>(null);
  const [activeOnlineMatchId, setActiveOnlineMatchId] = useState<string | null>(null);
  const [isJudgmentModalOpen, setIsJudgmentModalOpen] = useState(false);
  const [pendingCheckmateResult, setPendingCheckmateResult] = useState<GameResult | null>(null);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  // Tab focus tracking for anti-cheat
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && activeMode === 'online_match' && activeOnlineMatchId && user) {
        socketService.emitTabBlur(activeOnlineMatchId, user.uid);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeMode, activeOnlineMatchId, user]);

  // Synchronize audio sound toggle with soundManager

  useEffect(() => {
    soundManager.setEnabled(settings.sound);
    soundManager.setVolume(settings.volume);
    soundManager.setTheme(settings.pieceTheme);
  }, [settings.sound, settings.volume, settings.pieceTheme]);

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

  // Update layout and direction for i18n
  useEffect(() => {
    const isRtl = i18n.language === 'ckb' || i18n.language === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
    if (isRtl) {
      document.body.classList.add('font-vazirmatn');
      document.body.classList.remove('font-ui');
    } else {
      document.body.classList.remove('font-vazirmatn');
      document.body.classList.add('font-ui');
    }
  }, [i18n.language]);

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
        AntiCheatEngine.recordMoveTiming();
        const isWhiteTurn = game.turn() === 'w';

        const newGame = new Chess(game.fen());
        const moveResult = newGame.move({
          from,
          to,
          promotion: promotionPiece || 'q'
        });

        if (!moveResult) return false;

        soundManager.setLastMoveInfo(moveResult.piece, moveResult.color);

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
        setRedoStack([]);
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
  const handleBoardMove = useCallback((from: Square, to: Square) => {
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
  }, [gameResult, isAiThinking, isJudgmentModalOpen, activeMode, playerColor, game, settings.autoQueen, executeMove]);

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
    setRedoStack([]);
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
    if (activeMode === 'multiplayer' || activeMode === 'puzzle' || activeMode === 'online_match' || activeMode === 'analysis' || activeMode === 'authoring' || activeMode === 'logging' || activeMode === 'database' || activeMode === 'login' || activeMode === 'profile_page') return;
    if (moveLogs.length === 0 || gameResult || isAiThinking) return;

    // In AI mode, undo two moves (player move + AI move) so it's user's turn again
    const undoCount = activeMode === 'ai' ? 2 : 1;
    const remainingLogs = moveLogs.slice(0, Math.max(0, moveLogs.length - undoCount));
    const undoneLogs = moveLogs.slice(Math.max(0, moveLogs.length - undoCount));

    const newGame = new Chess();
    for (const log of remainingLogs) {
      newGame.move({ from: log.from, to: log.to, promotion: log.promotion });
    }

    setGame(newGame);
    setMoveLogs(remainingLogs);
    setRedoStack(prev => [...undoneLogs, ...prev]);
    setViewingMoveIndex(-1);
    setLastMove(remainingLogs.length > 0 ? { from: remainingLogs[remainingLogs.length - 1].from, to: remainingLogs[remainingLogs.length - 1].to } : null);
    setEvalScore(evaluateBoard(newGame));
    soundManager.playMove();
  };

  // Redo last undone move
  const handleRedo = () => {
    if (activeMode === 'multiplayer' || activeMode === 'puzzle' || activeMode === 'online_match' || activeMode === 'analysis' || activeMode === 'authoring' || activeMode === 'logging' || activeMode === 'database' || activeMode === 'login' || activeMode === 'profile_page') return;
    if (redoStack.length === 0 || gameResult || isAiThinking) return;

    const redoCount = activeMode === 'ai' ? Math.min(2, redoStack.length) : 1;
    const movesToRedo = redoStack.slice(0, redoCount);
    const nextLogs = [...moveLogs, ...movesToRedo];

    const newGame = new Chess();
    for (const log of nextLogs) {
      newGame.move({ from: log.from, to: log.to, promotion: log.promotion });
    }

    setGame(newGame);
    setMoveLogs(nextLogs);
    setRedoStack(prev => prev.slice(redoCount));
    setViewingMoveIndex(-1);
    const last = movesToRedo[movesToRedo.length - 1];
    setLastMove({ from: last.from, to: last.to });
    setEvalScore(evaluateBoard(newGame));
    soundManager.playMove();
  };

  const handleUndoRef = useRef(handleUndo);
  const handleRedoRef = useRef(handleRedo);
  
  useEffect(() => {
    handleUndoRef.current = handleUndo;
    handleRedoRef.current = handleRedo;
  }, [handleUndo, handleRedo]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyZ') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedoRef.current();
        } else {
          e.preventDefault();
          handleUndoRef.current();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.code === 'KeyY') {
        e.preventDefault();
        handleRedoRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
      const best = findBestMove(game, 12, isWhite, 700);
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
  // Automatic logging of finished games
  useEffect(() => {
    if (!gameResult) return;
    try {
      const isWin = gameResult.winner === playerColor;
      const isDraw = gameResult.winner === 'draw';
      const resultType = isWin ? 'win' : isDraw ? 'draw' : 'loss';
      logCompletedGame({
        userId: user?.uid,
        mode: activeMode,
        opponentName: activeMode === 'ai' ? currentBot.name : 'Opponent Player',
        opponentAvatar: activeMode === 'ai' ? currentBot.avatar : '♚',
        opponentElo: activeMode === 'ai' ? currentBot.elo : 1200,
        playerColor: playerColor,
        result: resultType,
        reason: gameResult.reason,
        movesCount: moveLogs.length,
        timeControlName: timeControl.name,
        pgn: game.pgn(),
        finalFen: game.fen(),
        respectChange: isWin ? 20 : isDraw ? 5 : 0,
        eloChange: isWin ? 15 : isDraw ? 0 : -10
      });
    } catch (e) {
      console.warn('Auto match log failed:', e);
    }
  }, [gameResult]);

  // Material summary
  const capturedMaterial = getCapturedMaterial(displayGame);

  // Opening book info
  const openingInfo: OpeningInfo | null = detectOpening(moveLogs.map(l => l.san));

  // Determine flipped orientation
  const isBoardFlipped =
    activeMode === 'pass_and_play'
      ? settings.flipBoard || game.turn() === 'b'
      : settings.flipBoard || playerColor === 'b';

  const isOnePieceTheme =
    settings.boardTheme === 'one-piece' ||
    settings.pieceTheme === 'one-piece' ||
    settings.whitePieceTheme === 'one-piece' ||
    settings.blackPieceTheme === 'one-piece';

  const isAotTheme =
    settings.boardTheme === 'aot' ||
    settings.pieceTheme === 'aot' ||
    settings.whitePieceTheme === 'aot' ||
    settings.blackPieceTheme === 'aot';

  const isPeshmergaTheme = 
    settings.boardTheme === 'peshmerga';
  const isBatmanTheme =
    settings.boardTheme === 'batman' ||
    settings.boardTheme === 'gotham-city' ||
    settings.pieceTheme === 'batman' ||
    settings.whitePieceTheme === 'batman' ||
    settings.blackPieceTheme === 'batman';

  return (
    <div id="app-root-container" className="flex flex-col min-h-screen text-white overflow-hidden font-sans selection:bg-[#F59E0B]/30 relative transition-colors duration-500">
      {/* Background Ambient Glow the glass surfaces refract */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-12%] left-[-8%] w-[45%] h-[45%] bg-[#8B5CF6]/12 blur-[140px] rounded-full" />
        <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] bg-[#38BDF8]/10 blur-[130px] rounded-full" />
        <div className="absolute bottom-[-12%] left-[25%] w-[45%] h-[40%] bg-[#F59E0B]/10 blur-[140px] rounded-full" />
      </div>

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

      {/* Collapsible Left Navigation Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activeMode={activeMode}
        onSelectMode={mode => {
          if (activeMode === 'online_match') {
            setActiveOnlineMatchId(null);
          }
          setActiveMode(mode);
        }}
        onOpenFriends={() => setIsFriendsModalOpen(true)}
        onOpenWorldwideMatch={() => setIsWorldwideMatchModalOpen(true)}
        onOpenLeaderboard={() => setActiveMode('leaderboard')}
        onOpenThemes={() => setIsThemeModalOpen(true)}
        onOpenSettings={() => {
          setSettingsTab('themes');
          setIsSettingsModalOpen(true);
        }}
        onOpenProfile={() => setActiveMode('profile_page')}
        currentThemeName={settings.pieceTheme}
      />

      {/* Top Header */}
      {/* Ambient Dynamic Glow Backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="ambient-sphere w-[600px] h-[600px] bg-cyan-500/20 top-[-10%] left-[-10%] animate-[ambient-float_20s_infinite_ease-in-out]" />
        <div className="ambient-sphere w-[500px] h-[500px] bg-orange-500/15 bottom-[10%] right-[-5%] animate-[ambient-float_25s_infinite_ease-in-out_reverse]" />
        <div className="ambient-sphere w-[400px] h-[400px] bg-blue-500/10 top-[40%] left-[20%] animate-[ambient-float_18s_infinite_linear]" />
      </div>

      <Header
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isSidebarOpen={isSidebarOpen}
        onOpenProfile={() => setActiveMode('profile_page')}
        onOpenLogin={() => setActiveMode('login')}
        respectProfile={respectProfile}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-start overflow-y-auto w-full z-10 min-h-0 no-scrollbar">
        <Suspense fallback={<ViewFallback />}>
        <AnimatePresence mode="wait" initial={false}>
          {activeMode === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="w-full h-full"
            >
              <LoginPage
                onSuccess={() => setActiveMode('profile_page')}
                onCancel={() => setActiveMode('ai')}
                onNavigateHome={() => setActiveMode('ai')}
              />
            </motion.div>
          ) : activeMode === 'profile_page' ? (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <UserProfilePage
                onChallenge={() => {
                  setActiveMode('ai');
                  setIsNewGameModalOpen(true);
                }}
                onAnalyzeGame={(pgn, fen) => {
                  try {
                    const g = fen ? new Chess(fen) : new Chess();
                    setGame(g);
                    setActiveMode('analysis');
                  } catch {
                    setActiveMode('analysis');
                  }
                }}
                onEditProfileModal={() => setIsProfileModalOpen(true)}
                onNavigateHome={() => setActiveMode('ai')}
              />
            </motion.div>
          ) : activeMode === 'online_match' && activeOnlineMatchId ? (
            <OnlineMatchView
              matchId={activeOnlineMatchId}
              settings={settings}
              onClose={() => {
                setActiveOnlineMatchId(null);
                setActiveMode('ai');
              }}
            />
          ) : (activeMode === 'multiplayer' || (activeMode === 'online_match' && !activeOnlineMatchId)) ? (
            <MultiplayerLobbyView
              settings={settings}
              onStartMatch={matchId => {
                setActiveOnlineMatchId(matchId);
                setActiveMode('online_match');
              }}
              onOpenWorldwideModal={() => setIsWorldwideMatchModalOpen(true)}
            />
          ) : activeMode === 'authoring' ? (
            <AuthoringView
              settings={settings}
              onOpenAnalysisWithFen={fen => {
                try {
                  const g = new Chess(fen);
                  setGame(g);
                  setActiveMode('analysis');
                } catch {}
              }}
            />
          ) : activeMode === 'logging' ? (
            <LoggingView
              settings={settings}
              onOpenAnalysisWithFen={fen => {
                try {
                  const g = new Chess(fen);
                  setGame(g);
                  setActiveMode('analysis');
                } catch {}
              }}
            />
          ) : activeMode === 'leaderboard' ? (
            <WorldwideLeaderboardView />
          ) : activeMode === 'database' ? (
            <DatabaseView
              onClose={() => setActiveMode('ai')}
            />
          ) : activeMode === 'daily_puzzle' ? (
            <DailyPuzzleView
              settings={settings}
              onNavigateMode={mode => setActiveMode(mode)}
            />
          ) : activeMode === 'puzzle' ? (
            <PuzzleMode settings={settings} />
          ) : activeMode === 'analysis' ? (
            <AnalysisPanel settings={settings} initialPgn={game.pgn()} initialFen={game.fen()} />
          ) : (
            /* Live Match View (Play AI / Pass & Play) */
            <div className="w-full max-w-7xl mx-auto p-3 sm:p-6 lg:px-8 lg:py-5 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start justify-center">
              {/* Center Left: Chess Board & Eval Bar Area */}
              <div className="lg:col-span-8 flex flex-col items-center justify-center">
                {/* Board stage: clocks, board and eval bar share one grid so their edges line up */}
                <div className="w-full max-w-[644px] lg:max-w-[min(644px,calc(100svh-300px))] grid grid-cols-[auto_1fr] gap-x-2 sm:gap-x-4 gap-y-3 items-stretch">
                {/* Top Player Status / Clock Bar */}
                <div className="col-start-2 flex flex-col gap-3 min-w-0">
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

                  <div className="px-1 flex items-center justify-between">
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
                      <div className="flex items-center gap-2 text-[10px] text-[#F59E0B] font-black uppercase tracking-widest animate-pulse px-3 py-1 rounded-full bg-[#111827] border border-[#F59E0B]/30 shadow-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-ping" />
                        <span>Calculating Path...</span>
                      </div>
                    )}
                  </div>
                </div>

                {settings.showEvalBar && (
                  <div className="col-start-1 row-start-2 flex">
                    <EvalBar score={evalScore} isFlipped={isBoardFlipped} />
                  </div>
                )}

                <div className="col-start-2 row-start-2 flex justify-center min-w-0">
                  <div className="relative group w-full max-w-[600px]">
                    <div className="absolute -inset-4 bg-[#F59E0B]/5 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <ChessBoard
                      game={displayGame}
                      isFlipped={isBoardFlipped}
                      boardTheme={settings.boardTheme}
                      pieceTheme={settings.pieceTheme}
                      whitePieceTheme={settings.whitePieceTheme}
                      blackPieceTheme={settings.blackPieceTheme}
                      showCoordinates={settings.showCoordinates}
                      highlightLastMove={settings.highlightLastMove}
                      showLegalMoves={settings.showLegalMoves}
                      lastMove={lastMove}
                      onMove={handleBoardMove}
                      disabled={viewingMoveIndex !== -1 || isAiThinking || !!gameResult || isJudgmentModalOpen}
                    />
                  </div>
                </div>

                {/* Bottom Player Status / Clock Bar */}
                <div className="col-start-2 row-start-3 flex flex-col gap-3 min-w-0">
                  <div className="px-1 flex items-center justify-between">
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
                      <div className="flex items-center gap-2 text-[10px] text-[#F59E0B] font-black uppercase tracking-widest animate-pulse px-3 py-1 rounded-full bg-[#111827] border border-[#F59E0B]/30 shadow-lg">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-ping" />
                        <span>Calculating Path...</span>
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
              </div>

              {/* Right Sidebar: History & Tactical Controls */}
              <div className="lg:col-span-4 flex flex-col gap-5 w-full max-w-[600px] mx-auto lg:max-w-none">
                {/* Game Control Action Buttons */}
                <GameControls
                  onNewGame={() => setIsNewGameModalOpen(true)}
                  onFlipBoard={() => setSettings(s => ({ ...s, flipBoard: !s.flipBoard }))}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onResign={handleResign}
                  onHint={handleGetHint}
                  soundEnabled={settings.sound}
                  onToggleSound={() => setSettings(s => ({ ...s, sound: !s.sound }))}
                  canUndo={moveLogs.length > 0 && !gameResult && !isAiThinking && activeMode !== 'multiplayer' && activeMode !== 'puzzle' && activeMode !== 'online_match'}
                  canRedo={redoStack.length > 0 && !gameResult && !isAiThinking && activeMode !== 'multiplayer' && activeMode !== 'puzzle' && activeMode !== 'online_match'}
                  isAiMode={activeMode === 'ai'}
                />

                <LocalChatDock
                  mode={activeMode === 'ai' ? 'ai' : 'local'}
                  turn={game.turn() as 'w' | 'b'}
                  botName={currentBot.name}
                  isMuted={!settings.sound}
                  onToggleMute={() => setSettings(s => ({ ...s, sound: !s.sound }))}
                />

                {/* Move Notation & History Log */}
                <div className="h-[360px] lg:h-[clamp(280px,calc(100svh-372px),560px)]">
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
                <div className="p-4 obsidian-panel flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] gold-glow" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                        {activeMode === 'ai' ? `VS ${currentBot.name}` : 'Local Session'}
                      </span>
                      <span className="text-[9px] font-mono text-[#94A3B8] mt-1">
                        Active Simulation • 60 FPS
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-[#0B0F19] border border-[#1F293D] text-[10px] font-black text-[#F59E0B] uppercase tracking-tighter">
                    {timeControl.name}
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>
        </Suspense>
      </main>

      {/* Promotion Selector Modal */}
      {pendingPromotion && (
        <PromotionModal
          color={game.turn() as PieceColor}
          pieceTheme={settings.pieceTheme}
          onSelect={handlePromotionSelect}
        />
      )}

      <Suspense fallback={null}>
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
          pgn={game.pgn()}
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
      {isNewGameModalOpen && (
      <NewGameModal
        isOpen={isNewGameModalOpen}
        onClose={() => setIsNewGameModalOpen(false)}
        onStartGame={handleStartGame}
        onOpenDailyPuzzle={() => {
          setIsNewGameModalOpen(false);
          setActiveMode('daily_puzzle');
        }}
        onOpenWorldwideMatch={() => {
          setIsNewGameModalOpen(false);
          setIsWorldwideMatchModalOpen(true);
        }}
        initialMode={activeMode}
      />
      )}

      {/* Worldwide Quick Match Live Modal */}
      {isWorldwideMatchModalOpen && (
      <WorldwideMatchModal
        isOpen={isWorldwideMatchModalOpen}
        onClose={() => setIsWorldwideMatchModalOpen(false)}
        onMatchFound={matchId => {
          setIsWorldwideMatchModalOpen(false);
          setActiveOnlineMatchId(matchId);
          setActiveMode('online_match');
        }}
      />
      )}

      {/* Dedicated Theme Selector Modal (AoT, Batman, Classic & Crossover) */}
      {isThemeModalOpen && (
      <ThemeSelectorModal
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
        settings={settings}
        onUpdateSettings={newS => setSettings(prev => ({ ...prev, ...newS }))}
      />
      )}

      {/* Settings Modal Hub */}
      {isSettingsModalOpen && (
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        initialTab={settingsTab}
        onUpdateSettings={newS => setSettings(prev => ({ ...prev, ...newS }))}
        onThemeChange={theme => {
          setSettings(prev => ({ ...prev, uiThemeId: theme.id }));
        }}
        onOpenAnalysisWithFen={fen => {
          try {
            const g = new Chess(fen);
            setGame(g);
            setIsSettingsModalOpen(false);
            setActiveMode('analysis');
          } catch {}
        }}
      />
      )}

      {/* Respect & Honor Leaderboard Modal */}
      {isLeaderboardModalOpen && (
        <LeaderboardModal
          profile={respectProfile}
          onClose={() => setIsLeaderboardModalOpen(false)}
        />
      )}

      {/* Profile & Google Auth Modal */}
      {isProfileModalOpen && (
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
      )}

      {/* Friends & Social Panel Modal */}
      {isFriendsModalOpen && (
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
      )}

      {/* Friends 1-on-1 Private Chat Modal */}
      {activeChatFriend && (
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
      )}
      </Suspense>
    </div>
  );
}
