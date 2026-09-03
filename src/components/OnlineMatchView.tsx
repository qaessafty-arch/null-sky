import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PanelContainer } from './PanelContainer';
import { Chess, Square, Move } from 'chess.js';
import { AppSettings, OnlineMatchSession, PieceColor, PieceType } from '../types/chess';
import { 
  listenToOnlineMatchSession, 
  sendOnlineMove, 
  resignOnlineMatch, 
  offerDrawOnlineMatch, 
  acceptDrawOnlineMatch 
} from '../services/onlineMatchService';
import { 
  sendInGameMessage, 
  listenToInGameMessages, 
  setInGameTypingStatus, 
  listenToInGameTypingStatus,
  InGameMessage 
} from '../services/chatService';
import { advanceTournamentMatch } from '../services/tournamentService';
import { getBotMoveForElo, getCapturedMaterial, evaluateBoard } from '../utils/chessEngine';
import { useAuth } from '../context/AuthContext';
import { ChessBoard } from './ChessBoard';
import { CapturedPieces } from './CapturedPieces';
import { ChessClock } from './ChessClock';
import { VoiceMoveDictator } from './VoiceMoveDictator';
import { LiveHypeMeter } from './LiveHypeMeter';
import { soundManager } from '../utils/audio';
import { socketService } from '../utils/socket';
import { getLocalPlayerUid } from '../utils/identity';
import { 
  Swords, 
  Flag, 
  Handshake, 
  RotateCcw, 
  X, 
  Copy, 
  Check, 
  MessageSquare, 
  Layers,
  Crown, 
  Shield, 
  Sun,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'motion/react';
import { GameRoom } from './GameRoom';
import { ConnectionStatus } from './multiplayer/ConnectionStatus';
import { InGameChatPanel } from './InGameChatPanel';

interface FloatingEmote {
  id: string;
  emote: string;
  isMe: boolean;
}

interface OnlineMatchViewProps {
  matchId: string;
  settings: AppSettings;
  onClose: () => void;
  onOpenChatWithOpponent?: (opponentUid: string) => void;
}

export const OnlineMatchView: React.FC<OnlineMatchViewProps> = ({
  matchId,
  settings,
  onClose,
  onOpenChatWithOpponent
}) => {
  const { profile, user, updateRespectMetrics } = useAuth();
  const [session, setSession] = useState<OnlineMatchSession | null>(null);
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'missing'>('loading');
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [pendingDraw, setPendingDraw] = useState(false);

  // In-Game Chat State
  const [activeTab, setActiveTab] = useState<'moves' | 'chat'>('moves');
  const [isMuted, setIsMuted] = useState(false);
  const [isPendingMove, setIsPendingMove] = useState(false);
  const [socketStatus, setSocketStatus] = useState<'connecting' | 'connected' | 'reconnecting' | 'error'>('connecting');
  const [chatMessages, setChatMessages] = useState<InGameMessage[]>([]);
  const [seenChatCount, setSeenChatCount] = useState(0);
  const [typingMap, setTypingMap] = useState<Record<string, boolean>>({});
  const [floatingEmotes, setFloatingEmotes] = useState<FloatingEmote[]>([]);

  // Clocks local countdown
  const [whiteTime, setWhiteTime] = useState<number>(600);
  const [blackTime, setBlackTime] = useState<number>(600);

  // Engine Evaluation & Overlays
  const [evalScore, setEvalScore] = useState<number>(0);
  const [showWeather, setShowWeather] = useState(false);
  const [showTerritory, setShowTerritory] = useState(false);

  const [moveHistory, setMoveHistory] = useState<string[]>([]);
  const [moveIndex, setMoveIndex] = useState(0);

  const myUid = profile?.uid || user?.uid || getLocalPlayerUid();
  const isWhitePlayer = session?.whitePlayer?.uid === myUid;
  const myColor: PieceColor = isWhitePlayer ? 'w' : 'b';
  const isMyTurn = session?.status === 'in_progress' && session?.turn === myColor;
  const capturedMaterial = getCapturedMaterial(game);

  const opponent = isWhitePlayer ? session?.blackPlayer : session?.whitePlayer;
  const me = isWhitePlayer ? session?.whitePlayer : session?.blackPlayer;

  // Subscribe to real-time session
  useEffect(() => {
    if (!matchId) return;

    const unsub = listenToOnlineMatchSession(matchId, newSession => {
      if (!newSession) {
        setLoadState('missing');
        return;
      }
      setLoadState('ready');
      setSession(newSession);

      // Synchronize chess game instance
      try {
        const updatedGame = new Chess(newSession.fen);
        setGame(updatedGame);
        setEvalScore(evaluateBoard(updatedGame));
        if (newSession.lastMoveFrom && newSession.lastMoveTo) {
          setLastMove({ from: newSession.lastMoveFrom, to: newSession.lastMoveTo });
        }
        setWhiteTime(newSession.whiteSecondsRemaining);
        setBlackTime(newSession.blackSecondsRemaining);
      } catch (e) {
        console.error('Error syncing online chess game:', e);
      }
    });

    const socket = socketService.getSocket() || socketService.connect(myUid);
    
    setSocketStatus(socket.connected ? 'connected' : 'connecting');

    const onConnect = () => setSocketStatus('connected');
    const onDisconnect = () => setSocketStatus('reconnecting');
    const onConnectError = () => setSocketStatus('error');

    const onMoveMade = (data: any) => {
      console.log('[Socket] Move made:', data.san);
      setIsPendingMove(false);
      try {
        const updatedGame = new Chess(data.fen);
        setGame(updatedGame);
        setMoveHistory(updatedGame.history());
        setEvalScore(evaluateBoard(updatedGame));
        setLastMove({ from: data.from, to: data.to });
        setWhiteTime(data.whiteSecondsRemaining);
        setBlackTime(data.blackSecondsRemaining);
        setMoveIndex(data.moveIndex);
        
        // Play sounds based on move result
        if (updatedGame.isCheckmate()) soundManager.playVictory();
        else if (updatedGame.inCheck()) soundManager.playCheck();
        else if (data.san.includes('x')) soundManager.playCapture('p', 'w'); // generic capture sound
        else soundManager.playMove('p', 'w');
      } catch (e) {
        console.error('Error processing socket move:', e);
      }
    };

    const onClockSync = (data: { white: number, black: number }) => {
      setWhiteTime(data.white);
      setBlackTime(data.black);
    };

    const onGameOver = (data: { reason: string, winner: string }) => {
      soundManager.playDefeat();
      // Session update will come via Firestore to show the outcome banner
    };

    const onMatchAborted = (data: { reason: string }) => {
      alert(`Match Aborted: ${data.reason}`);
      onClose();
    };

    const onReconnectSuccess = (data: any) => {
      const g = new Chess(data.fen);
      setGame(g);
      setMoveHistory(g.history());
      setWhiteTime(data.whiteSecondsRemaining);
      setBlackTime(data.blackSecondsRemaining);
      setMoveIndex(g.history().length);
    };
    
    socket.on('move_made', onMoveMade);
    socket.on('move_rejected', (data: any) => {
      console.error('[Socket] Move rejected:', data.error);
      setIsPendingMove(false);
      if (data.currentFen) {
        setGame(new Chess(data.currentFen));
      }
    });
    socket.on('clock_sync', onClockSync);
    socket.on('game_over', onGameOver);
    socket.on('match_aborted', onMatchAborted);
    socket.on('reconnect_success', onReconnectSuccess);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);

    // Initial identify
    socket.emit('identify', { uid: myUid });

    return () => {
      if (unsub) unsub();
      socket.off('move_made', onMoveMade);
      socket.off('clock_sync', onClockSync);
      socket.off('game_over', onGameOver);
      socket.off('match_aborted', onMatchAborted);
      socket.off('reconnect_success', onReconnectSuccess);
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
    };
  }, [matchId, onClose, myUid]);

  // Subscribe to Chat & Typing
  useEffect(() => {
    if (!matchId) return;

    const unsubChat = listenToInGameMessages(matchId, (msgs) => {
      // Play notification for new message if it's from opponent
      if (msgs.length > chatMessages.length) {
        const lastMsg = msgs[msgs.length - 1];
        const isMsgMe = lastMsg.senderUid === myUid;
        if (!isMsgMe && !isMuted) {
          if (lastMsg.type === 'text') {
            soundManager.playChat();
          } else {
            soundManager.playEmote();
          }
        }
      }

      setChatMessages(msgs);
      
      // Handle floating emotes
      const lastMsg = msgs[msgs.length - 1];
      if (lastMsg && (lastMsg.type === 'emote' || lastMsg.type === 'canned')) {
        const isMsgMe = lastMsg.senderUid === myUid;
        if (isMuted && !isMsgMe) return;

        // Play sound for opponent emote
        if (!isMsgMe) {
          soundManager.playEmote();
        }

        const newEmote: FloatingEmote = {
          id: `emote_${Date.now()}_${Math.random()}`,
          emote: lastMsg.text,
          isMe: isMsgMe
        };
        setFloatingEmotes(prev => [...prev, newEmote]);
        setTimeout(() => {
          setFloatingEmotes(prev => prev.filter(e => e.id !== newEmote.id));
        }, 2500);
      }
    });

    const unsubTyping = listenToInGameTypingStatus(matchId, setTypingMap);

    return () => {
      unsubChat();
      unsubTyping();
    };
  }, [matchId, myUid, isMuted, chatMessages.length]);

  useEffect(() => {
    if (activeTab === 'chat') setSeenChatCount(chatMessages.length);
  }, [activeTab, chatMessages.length]);

  const unreadChatCount = Math.max(0, chatMessages.length - seenChatCount);

  // Active clock countdown
  useEffect(() => {
    if (session?.status !== 'in_progress') return;

    const interval = setInterval(() => {
      if (session.turn === 'w') {
        setWhiteTime(prev => Math.max(0, prev - 1));
      } else {
        setBlackTime(prev => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session?.status, session?.turn]);

  // Automated responder for worldwide challengers (uid starting with 'ww_')
  useEffect(() => {
    if (!session || session.status !== 'in_progress') return;
    if (isMyTurn) return; // Only trigger when it's opponent's turn

    const opp = isWhitePlayer ? session.blackPlayer : session.whitePlayer;
    if (opp?.uid?.startsWith('ww_')) {
      const timer = setTimeout(async () => {
        try {
          const currentG = new Chess(session.fen);
          if (currentG.isGameOver()) return;

          const oppColor = isWhitePlayer ? 'b' : 'w';
          const botMove = getBotMoveForElo(currentG, opp.elo || 1800);
          if (!botMove) return;

          const moveResult = currentG.move({
            from: botMove.from,
            to: botMove.to,
            promotion: botMove.promotion || 'q'
          });

          if (!moveResult) return;

          // Sound effects
          if (currentG.isCheckmate()) {
            soundManager.playDefeat();
          } else if (currentG.inCheck()) {
            soundManager.playCheck();
          } else if (moveResult.captured) {
            soundManager.playCapture(moveResult.piece, moveResult.color);
          } else {
            soundManager.playMove(moveResult.piece, moveResult.color);
          }

          let nextStatus: 'in_progress' | 'checkmate' | 'draw' = 'in_progress';
          let nextWinner: 'w' | 'b' | 'draw' | null = null;
          let nextReason: string | undefined = undefined;

          if (currentG.isCheckmate()) {
            nextStatus = 'checkmate';
            nextWinner = oppColor;
            nextReason = `Checkmate! ${opp.displayName} wins the match.`;
            
            if (session?.tournamentId && session?.tournamentMatchId) {
              advanceTournamentMatch(session.tournamentId, session.tournamentMatchId, opp.uid).catch(console.error);
            }
          } else if (currentG.isDraw()) {
            nextStatus = 'draw';
            nextWinner = 'draw';
            nextReason = 'Game drawn.';
          }

          const inc = session.timeControl.incrementSeconds || 0;
          const newWhiteTime = oppColor === 'w' ? whiteTime + inc : whiteTime;
          const newBlackTime = oppColor === 'b' ? blackTime + inc : blackTime;

          await sendOnlineMove(
            matchId,
            currentG.fen(),
            currentG.pgn(),
            myColor,
            botMove.from,
            botMove.to,
            newWhiteTime,
            newBlackTime,
            nextStatus,
            nextWinner,
            nextReason
          );
        } catch (err) {
          console.error('Error calculating worldwide challenger move:', err);
        }
      }, 300 + Math.random() * 300);

      return () => clearTimeout(timer);
    }
  }, [session, isMyTurn, isWhitePlayer, myColor, whiteTime, blackTime, matchId]);

  // Execute Move handler
  const handleMakeMove = useCallback(
    (from: Square, to: Square) => {
      if (!isMyTurn || session?.status !== 'in_progress' || isPendingMove) return;

      const socket = socketService.getSocket();
      if (!socket) return;

      setIsPendingMove(true);
      // Send move to server
      socket.emit('make_move', {
        matchId,
        uid: myUid,
        from,
        to,
        promotion: 'q',
        moveIndex
      });
    },
    [isMyTurn, session, myUid, matchId, moveIndex, isPendingMove]
  );

  const handleResign = async () => {
    if (!session || session.status !== 'in_progress') return;
    if (window.confirm('Are you sure you want to resign the online match?')) {
      const socket = socketService.getSocket();
      if (socket) {
        socket.emit('resign', { matchId, uid: myUid });
      }
      
      if (session.tournamentId && session.tournamentMatchId) {
        const winnerColor = myColor === 'w' ? 'b' : 'w';
        const winnerPlayer = winnerColor === 'w' ? session.whitePlayer : session.blackPlayer;
        if (winnerPlayer) {
          advanceTournamentMatch(session.tournamentId, session.tournamentMatchId, winnerPlayer.uid).catch(console.error);
        }
      }
    }
  };

  const handleOfferDraw = async () => {
    if (!session) return;
    const currentUid = profile?.uid || user?.uid;
    if (session.drawOfferFrom && session.drawOfferFrom !== currentUid) {
      // Accept opponent's draw offer
      await acceptDrawOnlineMatch(matchId);
    } else if (currentUid) {
      await offerDrawOnlineMatch(matchId, currentUid);
      setPendingDraw(true);
    }
  };

  const handleSendMessage = async (text: string, type: 'text' | 'canned' | 'emote') => {
    if (!myUid) return;
    await sendInGameMessage(matchId, {
      senderUid: myUid,
      senderName: profile?.displayName || 'Player',
      text,
      type
    });
  };

  const handleTyping = (isTyping: boolean) => {
    if (!myUid) return;
    setInGameTypingStatus(matchId, myUid, isTyping);
  };

  const handleCopyMatchId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(matchId);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!session) {
    return (
      <PanelContainer>
        <div className="obsidian-panel rounded-3xl p-10 flex flex-col items-center justify-center gap-4 text-center">
          {loadState === 'missing' ? (
            <>
              <AlertTriangle className="w-10 h-10 text-[#F59E0B]" />
              <h2 className="text-lg font-black text-white">Match not found</h2>
              <p className="text-xs text-[#94A3B8] max-w-sm">
                This match room no longer exists or has expired. Head back to the lobby and start a new match.
              </p>
            </>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full border-4 border-[#F59E0B] border-t-transparent animate-spin" />
              <h2 className="text-lg font-black text-white">Connecting to the arena…</h2>
            </>
          )}
          <button
            onClick={onClose}
            className="mt-2 px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-black cursor-pointer"
          >
            Back to Lobby
          </button>
        </div>
      </PanelContainer>
    );
  }

  return (
    <PanelContainer>
      {/* Network & Connection Indicators */}
      <div className="fixed top-20 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <ConnectionStatus 
          status={socketStatus === 'connected' ? 'online' : socketStatus === 'reconnecting' ? 'syncing' : 'offline'} 
          latency={24}
        />
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 py-8 space-y-8">
        <GameRoom
          status={session.status === 'in_progress' ? 'in_progress' : 'game_over'}
          turn={session.turn === 'w' ? 'white' : 'black'}
          myColor={isWhitePlayer ? 'white' : 'black'}
          whitePlayer={{ 
            name: session.whitePlayer?.displayName || 'White', 
            elo: session.whitePlayer?.elo || 1200,
            avatar: session.whitePlayer?.photoURL 
          }}
          blackPlayer={{ 
            name: session.blackPlayer?.displayName || 'Black', 
            elo: session.blackPlayer?.elo || 1200,
            avatar: session.blackPlayer?.photoURL 
          }}
          clocks={{ 
            white: whiteTime, 
            black: blackTime, 
            total: session.timeControl.initialSeconds 
          }}
          onResign={handleResign}
          onOfferDraw={handleOfferDraw}
          isReconnecting={socketStatus === 'reconnecting'}
        />

        <div className="glass-panel p-3.5 sm:p-4 rounded-3xl border border-[#F5C453]/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#8C2425] via-[#52673A] to-[#F5C453] text-[#F5C453] border border-[#F5C453]/40 shadow-md">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Live Online Match
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-[#8C2425]/40 text-[#F5C453] text-[10px] font-black border border-[#F5C453]/40 uppercase">
                  {session?.timeControl.name || 'Rapid'}
                </span>
              </div>
              <p className="text-xs text-[#DFD0B0]/70">
                Battle for Peshmerga Grandmaster Honor & Respect Points
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
          {/* In-Game Chat Toggle */}
          <button
            type="button"
            onClick={() => setActiveTab(activeTab === 'moves' ? 'chat' : 'moves')}
            className={`min-h-[38px] px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer relative ${
              activeTab === 'chat'
                ? 'bg-[#52673A] text-white border-[#F5C453] shadow-md'
                : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border-white/10'
            }`}
            title="Toggle In-Game Match Chat"
          >
            <MessageSquare className="w-4 h-4 text-[#F59E0B]" />
            <span>{activeTab === 'chat' ? 'Show Moves' : 'Show Chat'}</span>
            {unreadChatCount > 0 && activeTab !== 'chat' && (
              <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center shadow-lg border-2 border-[var(--app-bg)] animate-bounce">
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={handleCopyMatchId}
            className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-bold flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
            title="Copy Match ID"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span className="font-mono text-[11px]">{copiedLink ? 'Copied ID' : 'Match ID'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>Leave</span>
          </button>
        </div>
      </div>

      {/* Main Game Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT / CENTER: Chess Board and Clocks */}
        <div className="lg:col-span-8 flex flex-col items-center relative">
          {/* Top Player Status / Clock Bar (Opponent) */}
          <div className="w-full max-w-[560px] mb-2 flex flex-col gap-1.5 relative">
            <ChessClock
              timeSeconds={isWhitePlayer ? blackTime : whiteTime}
              totalTimeSeconds={session?.timeControl?.initialSeconds}
              isActive={session?.turn !== myColor && session?.status === 'in_progress'}
              isWhite={!isWhitePlayer}
              playerName={opponent?.displayName || 'Opponent'}
              playerTitle={opponent?.honorRank}
              avatar={opponent?.avatar || opponent?.photoURL || (isWhitePlayer ? '♚' : '♔')}
              elo={opponent?.elo || 1200}
            />
            {/* Opponent Floating Emotes */}
            <div className="absolute top-0 left-12 z-20">
              <AnimatePresence>
                {floatingEmotes.filter(e => !e.isMe).map(e => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: 0, scale: 0.5 }}
                    animate={{ opacity: 1, y: -40, scale: 1.5 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 1, type: 'spring' }}
                    className="text-3xl pointer-events-none drop-shadow-2xl"
                  >
                    {e.emote}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="px-2 flex items-center justify-between">
              <CapturedPieces
                pieces={isWhitePlayer ? capturedMaterial.capturedByBlack : capturedMaterial.capturedByWhite}
                pieceTheme={settings.pieceTheme}
                colorOfCapturedPieces={isWhitePlayer ? 'w' : 'b'}
                materialAdvantage={
                  isWhitePlayer
                    ? capturedMaterial.materialDifference < 0
                      ? Math.abs(capturedMaterial.materialDifference)
                      : 0
                    : capturedMaterial.materialDifference > 0
                    ? capturedMaterial.materialDifference
                    : 0
                }
              />
            </div>
          </div>

          {/* Chess Board */}
          <div className={`relative p-2.5 sm:p-3.5 rounded-3xl bg-[#10140e] border-2 border-[#F5C453]/30 shadow-2xl ${settings.boardTheme === 'one-piece' ? 'one-piece-board-bg' : ''}`}>
            {/* Status Overlays */}
            <AnimatePresence>
              {socketStatus !== 'connected' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 rounded-3xl"
                >
                  <div className="w-10 h-10 rounded-full border-4 border-[#F5C453] border-t-transparent animate-spin" />
                  <span className="text-white font-black uppercase tracking-widest text-xs">
                    {socketStatus === 'reconnecting' ? 'Reconnecting...' : 'Connecting to Arena...'}
                  </span>
                </motion.div>
              )}

              {socketStatus === 'connected' && session?.status === 'waiting' && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-3 rounded-3xl"
                >
                  <div className="w-12 h-12 rounded-full bg-[#F5C453]/20 flex items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-[#F5C453] animate-ping" />
                  </div>
                  <span className="text-white font-black uppercase tracking-widest text-xs">
                    Waiting for Opponent...
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            <ChessBoard
              game={game}
              isFlipped={!isWhitePlayer}
              boardTheme={settings.boardTheme}
              pieceTheme={settings.pieceTheme}
              whitePieceTheme={settings.whitePieceTheme}
              blackPieceTheme={settings.blackPieceTheme}
              showCoordinates={settings.showCoordinates}
              highlightLastMove={settings.highlightLastMove}
              showLegalMoves={settings.showLegalMoves}
              lastMove={lastMove}
              onMove={handleMakeMove}
              disabled={!isMyTurn || session?.status !== 'in_progress'}
              evalScore={evalScore}
              showWeather={showWeather}
              showTerritory={showTerritory}
            />

            {/* Turn Indicator Banner */}
            <div className="mt-2.5 px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-[#F5C453]/30 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F5C453] animate-ping shrink-0" />
                <span className="font-bold text-white truncate">
                  {session?.status !== 'in_progress'
                    ? `Match ${session?.status?.toUpperCase()}`
                    : isMyTurn
                    ? 'Your Turn — Choose your move'
                    : `${opponent?.displayName || 'Opponent'} is thinking...`}
                </span>
              </div>
              <span className="text-[#DFD0B0]/70 font-mono text-[11px] whitespace-nowrap">
                You play as {isWhitePlayer ? 'White ⚪' : 'Black ⚫'}
              </span>
            </div>
          </div>

          {/* Bottom Player Status / Clock Bar (You) */}
          <div className="w-full max-w-[560px] mt-2 flex flex-col gap-1.5 relative">
            <div className="px-2 flex items-center justify-between">
              <CapturedPieces
                pieces={isWhitePlayer ? capturedMaterial.capturedByWhite : capturedMaterial.capturedByBlack}
                pieceTheme={settings.pieceTheme}
                colorOfCapturedPieces={isWhitePlayer ? 'b' : 'w'}
                materialAdvantage={
                  isWhitePlayer
                    ? capturedMaterial.materialDifference > 0
                      ? capturedMaterial.materialDifference
                      : 0
                    : capturedMaterial.materialDifference < 0
                    ? Math.abs(capturedMaterial.materialDifference)
                    : 0
                }
              />
            </div>
            <ChessClock
              timeSeconds={isWhitePlayer ? whiteTime : blackTime}
              totalTimeSeconds={session?.timeControl?.initialSeconds}
              isActive={isMyTurn && session?.status === 'in_progress'}
              isWhite={isWhitePlayer}
              playerName={profile?.displayName || 'You'}
              playerTitle={profile?.honorRank}
              avatar={profile?.photoURL || (isWhitePlayer ? '♔' : '♚')}
              elo={Number(profile?.elo) || 1200}
            />
            {/* My Floating Emotes */}
            <div className="absolute bottom-16 left-12 z-20">
              <AnimatePresence>
                {floatingEmotes.filter(e => e.isMe).map(e => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: 0, scale: 0.5 }}
                    animate={{ opacity: 1, y: -40, scale: 1.5 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ duration: 1, type: 'spring' }}
                    className="text-3xl pointer-events-none drop-shadow-2xl"
                  >
                    {e.emote}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Controls, Move History & Chat Hub */}
        <div className="lg:col-span-4 flex flex-col gap-4 h-full min-h-0 overflow-hidden">
          {/* Tactical Tabs Card */}
          <div className="glass-panel rounded-3xl border border-white/10 flex-1 flex flex-col overflow-hidden shadow-2xl relative min-h-[400px]">
            {/* Tab Header */}
            <div className="flex items-center p-1.5 bg-black/40 border-b border-white/10 shrink-0">
              <button
                onClick={() => setActiveTab('moves')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative ${
                  activeTab === 'moves'
                    ? 'text-black'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {activeTab === 'moves' && (
                  <motion.div
                    layoutId="match-tab-bg"
                    className="absolute inset-0 bg-[#F5C453] rounded-2xl shadow-lg shadow-[#F5C453]/20"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Layers className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">Move Log</span>
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all relative ${
                  activeTab === 'chat'
                    ? 'text-black'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {activeTab === 'chat' && (
                  <motion.div
                    layoutId="match-tab-bg"
                    className="absolute inset-0 bg-[#F5C453] rounded-2xl shadow-lg shadow-[#F5C453]/20"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <MessageSquare className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10">Match Chat</span>
                {unreadChatCount > 0 && activeTab !== 'chat' && (
                  <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce shadow-lg border-2 border-[var(--app-bg)] relative z-20">
                    {unreadChatCount}
                  </span>
                )}
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 relative">
              <AnimatePresence mode="wait">
                {activeTab === 'moves' ? (
                  <motion.div
                    key="match-moves"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="h-full flex flex-col"
                  >
                    <div className="flex items-center justify-between p-3 border-b border-white/5 bg-black/20">
                      <h4 className="text-[10px] font-black text-[#DFD0B0]/50 uppercase tracking-widest">
                        Tactical History
                      </h4>
                      <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-white/60 font-mono">
                        {moveHistory.length} Moves
                      </span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-1 p-3 custom-scrollbar">
                      {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => (
                        <div key={i} className="grid grid-cols-6 items-center gap-2 py-1 border-b border-white/5 last:border-0 font-mono">
                          <span className="col-span-1 text-[10px] text-white/30 font-black">{i + 1}.</span>
                          <span className={`col-span-2 text-xs font-bold cursor-pointer hover:text-[#F5C453] transition-colors ${moveIndex === i * 2 + 1 ? 'text-[#F5C453]' : 'text-white/80'}`}>
                            {moveHistory[i * 2]}
                          </span>
                          {moveHistory[i * 2 + 1] && (
                            <span className={`col-span-3 text-xs font-bold cursor-pointer hover:text-[#F5C453] transition-colors ${moveIndex === i * 2 + 2 ? 'text-[#F5C453]' : 'text-white/80'}`}>
                              {moveHistory[i * 2 + 1]}
                            </span>
                          )}
                        </div>
                      ))}
                      {moveHistory.length === 0 && (
                        <div className="h-full flex flex-col items-center justify-center text-[#DFD0B0]/20 gap-3 py-10">
                          <Layers className="w-10 h-10 opacity-20" />
                          <span className="text-[10px] font-black uppercase tracking-widest">Awaiting First Strike</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="match-chat"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="h-full"
                  >
                      <InGameChatPanel
                        messages={chatMessages}
                        onSendMessage={handleSendMessage}
                        myUid={myUid}
                        opponentName={opponent?.displayName || 'Opponent'}
                        opponentUid={opponent?.uid}
                        isMuted={isMuted}
                        onToggleMute={() => setIsMuted(prev => !prev)}
                        typingMap={typingMap}
                        onTyping={handleTyping}
                      />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Match Outcome Banner */}
          {session?.status && session.status !== 'in_progress' && session.status !== 'waiting' && (
            <div className="glass-panel p-5 rounded-3xl border border-[#F5C453]/40 shadow-xl space-y-3 animate-in zoom-in-95 text-center">
              <div className="text-3xl">
                {session.winner === myColor ? '👑' : session.winner === 'draw' ? '🤝' : '⚔️'}
              </div>
              <h3 className="text-lg font-black text-white">
                {session.winner === myColor
                  ? 'Victorious Grandmaster!'
                  : session.winner === 'draw'
                  ? 'Game Drawn'
                  : 'Match Concluded'}
              </h3>
              <p className="text-xs text-[#DFD0B0]/80">{session.reason}</p>

              {session.winner === myColor && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/40">
                  +30 Respect Points & +20 Elo Awarded! ☀️
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full py-3 rounded-2xl bg-[#F5C453] hover:bg-[#D4AF37] text-black font-black text-sm flex items-center justify-center gap-2 transition-transform active:scale-95 cursor-pointer shadow-lg"
                >
                  <RotateCcw className="w-4 h-4" />
                  New Match / Rematch
                </button>
              </div>
            </div>
          )}

          {/* In-Game Action Buttons */}
          <div className="glass-panel p-4 rounded-3xl border border-white/10 space-y-4">
            <h4 className="text-xs font-bold text-[#DFD0B0]/70 uppercase tracking-wider">
              Match Controls
            </h4>

            {session?.drawOfferFrom && session.drawOfferFrom !== profile?.uid && (
              <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between gap-2">
                <span>Opponent offered a draw!</span>
                <button
                  type="button"
                  onClick={handleOfferDraw}
                  className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs transition-colors cursor-pointer"
                >
                  Accept Draw
                </button>
              </div>
            )}

            <VoiceMoveDictator 
              game={game} 
              onVoiceMove={handleMakeMove} 
              disabled={!isMyTurn || session?.status !== 'in_progress'} 
            />

            <LiveHypeMeter matchId={matchId} />

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showWeather} onChange={e => setShowWeather(e.target.checked)} className="form-checkbox text-amber-500 rounded bg-black/40 border-white/20" />
                <span className="text-xs text-white/80 font-bold">Dynamic Weather</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showTerritory} onChange={e => setShowTerritory(e.target.checked)} className="form-checkbox text-emerald-500 rounded bg-black/40 border-white/20" />
                <span className="text-xs text-white/80 font-bold">Territory Heatmap</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleOfferDraw}
                disabled={session?.status !== 'in_progress'}
                className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
              >
                <Handshake className="w-4 h-4 text-amber-400" />
                <span>Offer Draw</span>
              </button>

              <button
                type="button"
                onClick={handleResign}
                disabled={session?.status !== 'in_progress'}
                className="py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 disabled:opacity-40 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-500/30 transition-colors cursor-pointer"
              >
                <Flag className="w-4 h-4 text-rose-400" />
                <span>Resign</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      </div>
    </PanelContainer>
  );
};
