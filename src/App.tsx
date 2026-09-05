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

import { MessageSquare, Layers } from 'lucide-react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { AmbientBackground } from './components/AmbientBackground';
import { ChessBoard } from './components/ChessBoard';
import { EvalBar } from './components/EvalBar';
import { CapturedPieces } from './components/CapturedPieces';
import { GlassCard } from './components/GlassUI';
import { ChessClock } from './components/ChessClock';
import { MoveHistory } from './components/MoveHistory';
import { StrategicVisionPanel } from './components/StrategicVisionPanel';
import { GameControls } from './components/GameControls';
import { GlassButton } from './components/GlassButton';
import { InGameChatPanel } from './components/InGameChatPanel';
import { PromotionModal } from './components/PromotionModal';
import { Watermark } from './components/Watermark';
import { ViewFallback } from './components/ViewFallback';
import type { SettingsTab } from './components/SettingsModal';
import { InGameMessage } from './services/chatService';
import { logCompletedGame } from './services/loggingService';
import { FriendUser } from './types/chess';
import { engine } from './engine/client';

// Everything below the live board is loaded on demand: the first paint only
// needs the board, the clocks and the header.
const lazyPreload = <P extends object>(load: () => Promise<{ default: React.ComponentType<P> }>) => {
  const Component = lazy(load) as React.LazyExoticComponent<React.ComponentType<P>> & { preload: () => void };
  Component.preload = () => { void load(); };
  return Component;
};

const AboutUsModal = lazyPreload(() => import('./components/AboutUsModal').then(m => ({ default: m.AboutUsModal })));

const ThemeSelectorModal = lazyPreload(() => import('./components/ThemeSelectorModal').then(m => ({ default: m.ThemeSelectorModal })));
const GameOverModal = lazyPreload(() => import('./components/GameOverModal').then(m => ({ default: m.GameOverModal })));
const NewGameModal = lazyPreload(() => import('./components/NewGameModal').then(m => ({ default: m.NewGameModal })));
const SettingsModal = lazyPreload(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const PuzzlePractice = lazyPreload(() => import('./components/PuzzlePractice').then(m => ({ default: m.PuzzlePractice })));
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
const DevPanel = lazyPreload(() => import('./components/DevPanel').then(m => ({ default: m.DevPanel })));
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
    showMoveArrows: true,
    showTerritory: false,
    showWeather: false
  });

  // Respect System Profile
  const [respectProfile, setRespectProfile] = useState<RespectProfile>(() => getRespectProfile());

  useEffect(() => {
    const cleanup = AntiCheatEngine.initializeTelemetry();
    return () => {
      cleanup();
    };
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
        respectPoints: Number(authProfile.respectPoints || 0),
        elo: Number(authProfile.elo || 1200),
        executions: Number(authProfile.executions || 0),
        merciesGranted: Number(authProfile.merciesGranted || 0),
        honorRank: authProfile.honorRank || 'Peshmerga Tactician',
        rankBadge: authProfile.rankBadge || '🌿',
        gamesPlayed: Number(authProfile.gamesPlayed || 0),
        wins: Number(authProfile.wins || 0)
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
  const [isAboutUsModalOpen, setIsAboutUsModalOpen] = useState(false);
  const [activeChatFriend, setActiveChatFriend] = useState<FriendUser | null>(null);
  const [activeOnlineMatchId, setActiveOnlineMatchId] = useState<string | null>(null);
  const [isJudgmentModalOpen, setIsJudgmentModalOpen] = useState(false);
  const [pendingCheckmateResult, setPendingCheckmateResult] = useState<GameResult | null>(null);
  const [hintMessage, setHintMessage] = useState<string | null>(null);

  // Tactical HUD Tabs (Moves vs Chat)
  const [activeTacticalTab, setActiveTacticalTab] = useState<'moves' | 'chat'>('moves');
  const [localMessages, setLocalMessages] = useState<InGameMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  const handleSendLocalMessage = useCallback((text: string, type: 'text' | 'canned' | 'emote') => {
    const isAiMode = activeMode === 'ai';
    const currentTurn = game.turn();
    const senderUid = isAiMode ? 'local_white' : currentTurn === 'w' ? 'local_white' : 'local_black';
    const senderName = isAiMode ? 'You' : currentTurn === 'w' ? 'White' : 'Black';

    const newMessage: InGameMessage = {
      id: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      senderUid,
      senderName,
      text,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setLocalMessages(prev => [...prev, newMessage]);

    if (isAiMode) {
      setTimeout(() => {
        const botReplies = [
          'Interesting choice. 🤔',
          'My turn to punish that. ⚔️',
          'Calculating... ⏳',
          'Bold. I respect it. 👑',
          'You will need more than that. 🔥',
          'Nice one. 🎯',
          'Kodiiiiiiii ☀️🔥',
          'NAH I\'D WIN!! 👑⚡'
        ];
        const botMessage: InGameMessage = {
          id: `bot_${Date.now()}`,
          senderUid: 'local_bot',
          senderName: currentBot.name,
          text: botReplies[Math.floor(Math.random() * botReplies.length)],
          type: 'text',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setLocalMessages(prev => [...prev, botMessage]);
        if (settings.sound) soundManager.playChat();
      }, 1000 + Math.random() * 1500);
    }
  }, [activeMode, game, currentBot.name, settings.sound]);

  useEffect(() => {
    if (activeTacticalTab === 'chat') {
      setUnreadChatCount(0);
    } else if (localMessages.length > 0) {
      const lastMsg = localMessages[localMessages.length - 1];
      // If last message is from opponent, increment unread
      if (lastMsg.senderUid !== 'local_white') {
        setUnreadChatCount(prev => prev + 1);
      }
    }
  }, [localMessages.length, activeTacticalTab]);

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

    // Natural human-like bot think delay (400ms - 1500ms)
    const delay = Math.min(1500, Math.max(400, 300 + currentBot.depth * 80));
    const currentFen = game.fen();

    const timeoutId = setTimeout(async () => {
      try {
        let uci: string | null = null;
        try {
          const res = await engine.botMove({ fen: currentFen }, currentBot.id);
          uci = res.bestMove;
        } catch {
          // Fallback to sync engine if worker fails
          const botMove = getBotMove(game, currentBot);
          if (botMove) {
            executeMove(botMove.from as Square, botMove.to as Square, botMove.promotion as PieceType | undefined);
            return;
          }
        }
        if (uci && uci.length >= 4) {
          const from = uci.slice(0, 2) as Square;
          const to = uci.slice(2, 4) as Square;
          const promo = (uci[4] as PieceType | undefined) ?? undefined;
          executeMove(from, to, promo);
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
    <div id="app-root-container" className="min-h-screen flex flex-col relative overflow-x-hidden font-jakarta text-white selection:bg-[#FFD700]/30 selection:text-white transition-all duration-700">
      {/* Sleek Tactical Hint Banner */}
      {hintMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-black/90 border border-[#F5C453] text-[#F5C453] text-xs font-bold shadow-2xl backdrop-blur-xl">
            <span>{hintMessage}</span>
            <GlassButton
              onClick={() => setHintMessage(null)}
              variant="ghost"
              size="sm"
              className="!px-2 !py-1 ml-2 text-xs"
            >
              ✕
            </GlassButton>
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
        onOpenAbout={() => setIsAboutUsModalOpen(true)}
        onOpenProfile={() => setActiveMode('profile_page')}
        currentThemeName={settings.pieceTheme}
      />

      {/* Top Header */}
      {/* Cinematic Ambient Backdrop */}
      <AmbientBackground />

      <Header
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        isSidebarOpen={isSidebarOpen}
        onOpenProfile={() => setActiveMode('profile_page')}
        onOpenLogin={() => setActiveMode('login')}
        respectProfile={respectProfile}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col justify-start overflow-y-auto w-full z-10 min-h-0">
        <Suspense fallback={<ViewFallback />}>
        <AnimatePresence mode="wait" initial={false}>
          {activeMode === 'login' ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
              transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
              className="w-full h-full flex flex-col items-center justify-center"
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
              initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -30, filter: 'blur(10px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
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
                onOpenAbout={() => setIsAboutUsModalOpen(true)}
                onEditProfileModal={() => setIsProfileModalOpen(true)}
                onNavigateHome={() => setActiveMode('ai')}
              />
            </motion.div>
          ) : activeMode === 'online_match' && activeOnlineMatchId ? (
            <motion.div
              key="online-match-view"
              initial={{ opacity: 0, scale: 0.98, filter: 'blur(15px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.02, filter: 'blur(15px)' }}
              transition={{ duration: 0.7, ease: [0.19, 1, 0.22, 1] }}
              className="w-full h-full"
            >
              <OnlineMatchView
                matchId={activeOnlineMatchId}
                settings={settings}
                onClose={() => {
                  setActiveOnlineMatchId(null);
                  setActiveMode('ai');
                }}
              />
            </motion.div>
          ) : (activeMode === 'multiplayer' || (activeMode === 'online_match' && !activeOnlineMatchId)) ? (
            <motion.div
              key="multiplayer-lobby"
              initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -40, filter: 'blur(10px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="w-full h-full"
            >
              <MultiplayerLobbyView
                settings={settings}
                onStartMatch={matchId => {
                  setActiveOnlineMatchId(matchId);
                  setActiveMode('online_match');
                }}
                onOpenWorldwideModal={() => setIsWorldwideMatchModalOpen(true)}
              />
            </motion.div>
          ) : activeMode === 'authoring' ? (
            <motion.div
              key="authoring-view"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full"
            >
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
            </motion.div>
          ) : activeMode === 'logging' ? (
            <motion.div
              key="logging-view"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full"
            >
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
            </motion.div>
          ) : activeMode === 'leaderboard' ? (
            <motion.div
              key="leaderboard-view"
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full"
            >
              <WorldwideLeaderboardView />
            </motion.div>
          ) : activeMode === 'dev_panel' ? (
            <motion.div
              key="dev_panel"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full"
            >
              <DevPanel
                onClose={() => setActiveMode('ai')}
                onNavigate={(m) => setActiveMode(m)}
              />
            </motion.div>
          ) : activeMode === 'database' ? (
            <motion.div
              key="database-view"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full"
            >
              <DatabaseView
                onClose={() => setActiveMode('ai')}
              />
            </motion.div>
          ) : activeMode === 'daily_puzzle' ? (
            <motion.div
              key="daily-puzzle-view"
              initial={{ opacity: 0, scale: 0.9, rotate: -1 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 1.1, rotate: 1 }}
              transition={{ duration: 0.5 }}
              className="w-full h-full"
            >
              <DailyPuzzleView
                settings={settings}
                onNavigateMode={mode => setActiveMode(mode)}
              />
            </motion.div>
          ) : activeMode === 'puzzle' ? (
            <motion.div
              key="puzzle-mode"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full"
            >
              <PuzzleMode settings={settings} />
            </motion.div>
          ) : activeMode === 'puzzle_practice' ? (
            <motion.div
              key="puzzle-practice"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full"
            >
              <PuzzlePractice settings={settings} onNavigateHome={() => setActiveMode('ai')} />
            </motion.div>
          ) : activeMode === 'analysis' ? (
            <motion.div
              key="analysis-panel"
              initial={{ opacity: 0, filter: 'brightness(0.5) blur(10px)' }}
              animate={{ opacity: 1, filter: 'brightness(1) blur(0px)' }}
              exit={{ opacity: 0, filter: 'brightness(0.5) blur(10px)' }}
              transition={{ duration: 0.4 }}
              className="w-full h-full"
            >
              <AnalysisPanel 
                settings={settings} 
                onUpdateSettings={updates => setSettings(s => ({ ...s, ...updates }))}
                initialPgn={game.pgn()} 
                initialFen={game.fen()} 
              />
            </motion.div>
          ) : (
            <motion.div
              key="local-game-view"
              initial={{ opacity: 0, scale: 1.02, filter: 'blur(20px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.98, filter: 'blur(20px)' }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
              className="w-full max-w-7xl mx-auto p-3 sm:p-6 lg:px-8 lg:py-5 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start justify-center relative z-10"
            >
              {/* Center Left: Chess Board & Eval Bar Area */}
              <div className="lg:col-span-8 flex flex-col items-center justify-center relative">
                
                {/* Board stage: clocks, board and eval bar share one grid so their edges line up */}
                <div className="w-full max-w-[644px] lg:max-w-[min(644px,calc(100svh-300px))] grid grid-cols-[auto_1fr] gap-x-2 sm:gap-x-4 gap-y-3 items-stretch">
                  
                  {/* Top Player Status / Clock Bar */}
                  <div className="col-start-2 flex flex-col gap-3 min-w-0">
                    <GlassCard intensity="low" className="p-3 !rounded-2xl" animateFloat>
                      <ChessClock
                        timeSeconds={isBoardFlipped ? whiteTime : blackTime}
                        totalTimeSeconds={timeControl.initialSeconds}
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
                        elo={activeMode === 'ai' && !isBoardFlipped ? currentBot.elo : Number(respectProfile.elo)}
                        isUnlimited={timeControl.category === 'unlimited'}
                      />
                    </GlassCard>

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
                        <div className="flex items-center gap-2 text-[10px] text-[var(--secondary-accent)] font-black uppercase tracking-widest animate-pulse px-3 py-1 rounded-full bg-[var(--app-bg)] border border-[var(--secondary-accent)]/30 shadow-lg">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--secondary-accent)] animate-ping" />
                          <span>Calculating Path...</span>
                        </div>
                      )}
                    </div>
                  </div>

                {settings.showEvalBar && (
                  <div className="col-start-1 row-start-2 flex">
                    <div className="w-5 sm:w-8 h-full glass-premium overflow-hidden !rounded-xl border-white/10">
                      <EvalBar score={evalScore} isFlipped={isBoardFlipped} />
                    </div>
                  </div>
                )}

                <div className="col-start-2 row-start-2 flex justify-center min-w-0">
                  <div className="relative group w-full max-w-[600px] glass-platform">
                    {/* Cinematic Reflection */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[90%] h-6 bg-black/40 blur-2xl rounded-full pointer-events-none" />
                    
                    {/* Golden Glow Edge */}
                    <div className="absolute inset-0 z-[5] pointer-events-none rounded-[2rem] bg-gradient-to-tr from-[#FFD700]/10 via-transparent to-white/10 opacity-50" />
                    
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
                      showTerritory={settings.showTerritory}
                      showWeather={settings.showWeather}
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
                      <div className="flex items-center gap-2 text-[10px] text-[#FFD700] font-black uppercase tracking-widest animate-pulse px-3 py-1 rounded-full bg-white/5 border border-[#FFD700]/30 shadow-lg backdrop-blur-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#FFD700] animate-ping" />
                        <span>Calculating Path...</span>
                      </div>
                    )}
                   </div>

                  <GlassCard intensity="low" className="p-3 !rounded-2xl border-white/10" animateFloat>
                    <ChessClock
                      timeSeconds={isBoardFlipped ? blackTime : whiteTime}
                      totalTimeSeconds={timeControl.initialSeconds}
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
                      elo={activeMode === 'ai' && isBoardFlipped ? currentBot.elo : Number(respectProfile.elo)}
                      isUnlimited={timeControl.category === 'unlimited'}
                    />
                  </GlassCard>
                </div>
              </div>
            </div>

              {/* Right Sidebar: History & Tactical Controls */}
              <div className="lg:col-span-4 flex flex-col gap-5 w-full max-w-[600px] mx-auto lg:max-w-none">
                {/* Game Control Action Buttons */}
                <GlassCard className="p-4 !rounded-[2rem] border-white/10 shadow-2xl" animateFloat>
                  <GameControls
                    onNewGame={() => setIsNewGameModalOpen(true)}
                    onFlipBoard={() => setSettings(s => ({ ...s, flipBoard: !s.flipBoard }))}
                    onUndo={handleUndo}
                    onRedo={handleRedo}
                    onResign={handleResign}
                    onHint={handleGetHint}
                    soundEnabled={settings.sound}
                    onToggleSound={() => setSettings(s => ({ ...s, sound: !s.sound }))}
                    canUndo={moveLogs.length > 0 && !gameResult && !isAiThinking && (activeMode as string) !== 'multiplayer' && (activeMode as string) !== 'puzzle' && (activeMode as string) !== 'online_match'}
                    canRedo={redoStack.length > 0 && !gameResult && !isAiThinking && (activeMode as string) !== 'multiplayer' && (activeMode as string) !== 'puzzle' && (activeMode as string) !== 'online_match'}
                    isAiMode={activeMode === 'ai'}
                  />
                </GlassCard>

                {/* TACTICAL HUD: Unified Tabs for Moves & Chat */}
                <div className="flex flex-col gap-4 h-full">
                  <GlassCard className="flex-1 !rounded-[2rem] border-white/10 shadow-2xl overflow-hidden flex flex-col" animateFloat>
                    {/* Tab Header */}
                    <div className="flex items-center p-1.5 bg-white/5 border-b border-white/10 shrink-0">
                      <button
                        onClick={() => setActiveTacticalTab('moves')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative ${
                          activeTacticalTab === 'moves'
                            ? 'text-black'
                            : 'text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        {activeTacticalTab === 'moves' && (
                          <motion.div
                            layoutId="tactical-tab-bg"
                            className="absolute inset-0 bg-[var(--secondary-accent)] rounded-2xl shadow-lg shadow-[var(--secondary-accent)]/20"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <Layers className="w-3.5 h-3.5 relative z-10" />
                        <span className="relative z-10">Battle Log</span>
                      </button>
                      <button
                        onClick={() => setActiveTacticalTab('chat')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative ${
                          activeTacticalTab === 'chat'
                            ? 'text-black'
                            : 'text-[#94A3B8] hover:text-white'
                        }`}
                      >
                        {activeTacticalTab === 'chat' && (
                          <motion.div
                            layoutId="tactical-tab-bg"
                            className="absolute inset-0 bg-[var(--secondary-accent)] rounded-2xl shadow-lg shadow-[var(--secondary-accent)]/20"
                            transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                          />
                        )}
                        <MessageSquare className="w-3.5 h-3.5 relative z-10" />
                        <span className="relative z-10">Match Chat</span>
                        {unreadChatCount > 0 && activeTacticalTab !== 'chat' && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-bounce shadow-lg border-2 border-[var(--app-bg)] relative z-20">
                            {unreadChatCount}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 min-h-0 overflow-hidden relative">
                      <AnimatePresence mode="wait">
                        {activeTacticalTab === 'moves' ? (
                          <motion.div
                            key="tab-moves"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            className="h-full flex flex-col"
                          >
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
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
                          </motion.div>
                        ) : (
                          <motion.div
                            key="tab-chat"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="h-full"
                          >
                            <InGameChatPanel
                              messages={localMessages}
                              onSendMessage={handleSendLocalMessage}
                              myUid="local_white"
                              opponentName={activeMode === 'ai' ? currentBot.name : 'Black'}
                              isMuted={!settings.sound}
                              onToggleMute={() => setSettings(s => ({ ...s, sound: !s.sound }))}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </GlassCard>

                  {/* Strategic Vision (The Glasses Panel) */}
                  <GlassCard className="p-4 !rounded-[2rem] border-white/10 shadow-2xl" animateFloat>
                    <StrategicVisionPanel
                      settings={settings}
                      onUpdateSettings={updates => setSettings(s => ({ ...s, ...updates }))}
                    />
                  </GlassCard>
                </div>

                {/* Quick Game Info Card */}
                <div className="p-4 obsidian-panel flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-[var(--secondary-accent)] gold-glow" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
                        {activeMode === 'ai' ? `VS ${currentBot.name}` : 'Local Session'}
                      </span>
                      <span className="text-[9px] font-mono text-[#94A3B8] mt-1">
                        Active Simulation • 60 FPS
                      </span>
                    </div>
                  </div>
                  <div className="px-3 py-1.5 rounded-lg bg-[var(--app-bg)] border border-[var(--glass-border)] text-[10px] font-black text-[var(--secondary-accent)] uppercase tracking-tighter">
                    {timeControl.name}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </Suspense>
      </main>

      <AboutUsModal
        isOpen={isAboutUsModalOpen}
        onClose={() => setIsAboutUsModalOpen(false)}
      />

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
          onPracticePuzzles={() => { setGameResult(null); setActiveMode("puzzle_practice"); }}
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

      {/* Global Craft Watermark */}
      <Watermark onClick={() => setIsAboutUsModalOpen(true)} />
    </div>
  );
}
