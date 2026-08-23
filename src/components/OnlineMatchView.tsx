import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { AppSettings, OnlineMatchSession, PieceColor, PieceType } from '../types/chess';
import { 
  listenToOnlineMatchSession, 
  sendOnlineMove, 
  resignOnlineMatch, 
  offerDrawOnlineMatch, 
  acceptDrawOnlineMatch 
} from '../services/onlineMatchService';
import { findBestMove } from '../utils/chessEngine';
import { useAuth } from '../context/AuthContext';
import { ChessBoard } from './ChessBoard';
import { ChessClock } from './ChessClock';
import { soundManager } from '../utils/audio';
import { 
  Swords, 
  Flag, 
  Handshake, 
  RotateCcw, 
  X, 
  Copy, 
  Check, 
  MessageSquare, 
  Crown, 
  Shield, 
  Sun,
  AlertTriangle
} from 'lucide-react';
import confetti from 'canvas-confetti';

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
  const { profile, updateRespectMetrics } = useAuth();
  const [session, setSession] = useState<OnlineMatchSession | null>(null);
  const [game, setGame] = useState<Chess>(() => new Chess());
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [pendingDraw, setPendingDraw] = useState(false);

  // Clocks local countdown
  const [whiteTime, setWhiteTime] = useState<number>(600);
  const [blackTime, setBlackTime] = useState<number>(600);

  // Subscribe to real-time session
  useEffect(() => {
    if (!matchId) return;

    const unsub = listenToOnlineMatchSession(matchId, newSession => {
      if (!newSession) return;
      setSession(newSession);

      // Synchronize chess game instance
      try {
        const updatedGame = new Chess(newSession.fen);
        setGame(updatedGame);
        if (newSession.lastMoveFrom && newSession.lastMoveTo) {
          setLastMove({ from: newSession.lastMoveFrom, to: newSession.lastMoveTo });
        }
        setWhiteTime(newSession.whiteSecondsRemaining);
        setBlackTime(newSession.blackSecondsRemaining);
      } catch (e) {
        console.error('Error syncing online chess game:', e);
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, [matchId]);

  // Determine current player's side
  const myUid = profile?.uid;
  const isWhitePlayer = session?.whitePlayer.uid === myUid;
  const isBlackPlayer = session?.blackPlayer.uid === myUid;
  const myColor: PieceColor = isWhitePlayer ? 'w' : 'b';
  const isMyTurn = session?.status === 'in_progress' && session?.turn === myColor;

  const opponent = isWhitePlayer ? session?.blackPlayer : session?.whitePlayer;
  const me = isWhitePlayer ? session?.whitePlayer : session?.blackPlayer;

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
          // Calculate move
          const calcDepth = (opp.elo || 1800) >= 2000 ? 4 : 3;
          const best = findBestMove(currentG, calcDepth, oppColor === 'w');
          if (!best.move) return;

          const moveResult = currentG.move({
            from: best.move.from,
            to: best.move.to,
            promotion: best.move.promotion || 'q'
          });

          if (!moveResult) return;

          // Sound effects
          if (currentG.isCheckmate()) {
            soundManager.playDefeat();
          } else if (currentG.inCheck()) {
            soundManager.playCheck();
          } else if (moveResult.captured) {
            soundManager.playCapture();
          } else {
            soundManager.playMove();
          }

          let nextStatus: 'in_progress' | 'checkmate' | 'draw' = 'in_progress';
          let nextWinner: 'w' | 'b' | 'draw' | null = null;
          let nextReason: string | undefined = undefined;

          if (currentG.isCheckmate()) {
            nextStatus = 'checkmate';
            nextWinner = oppColor;
            nextReason = `Checkmate! ${opp.displayName} wins the match.`;
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
            best.move.from,
            best.move.to,
            newWhiteTime,
            newBlackTime,
            nextStatus,
            nextWinner,
            nextReason
          );
        } catch (err) {
          console.error('Error calculating worldwide challenger move:', err);
        }
      }, 1400 + Math.random() * 1200);

      return () => clearTimeout(timer);
    }
  }, [session, isMyTurn, isWhitePlayer, myColor, whiteTime, blackTime, matchId]);

  // Execute Move handler
  const handleMakeMove = useCallback(
    async (from: Square, to: Square) => {
      if (!isMyTurn || session?.status !== 'in_progress') return;

      try {
        const testGame = new Chess(game.fen());
        const move = testGame.move({ from, to, promotion: 'q' });
        if (!move) return;

        // Play local move sound
        if (testGame.isCheckmate()) {
          soundManager.playVictory();
          try {
            confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
          } catch {}
        } else if (testGame.inCheck()) {
          soundManager.playCheck();
        } else if (move.captured) {
          soundManager.playCapture();
        } else {
          soundManager.playMove();
        }

        const nextTurn: 'w' | 'b' = testGame.turn() === 'w' ? 'w' : 'b';
        let status: 'in_progress' | 'checkmate' | 'draw' = 'in_progress';
        let winner: 'w' | 'b' | 'draw' | null = null;
        let reason: string | undefined = undefined;

        if (testGame.isCheckmate()) {
          status = 'checkmate';
          winner = myColor;
          reason = `Checkmate! ${profile?.displayName || 'Player'} wins the match!`;

          // Reward Respect Points & ELO for victory against friend
          if (updateRespectMetrics) {
            updateRespectMetrics({
              respectPoints: 30,
              elo: 20,
              wins: 1,
              gamesPlayed: 1
            });
          }
        } else if (testGame.isDraw()) {
          status = 'draw';
          winner = 'draw';
          reason = 'Game drawn by stalemate or rule.';
        }

        // Apply increment if any
        const increment = session.timeControl.incrementSeconds || 0;
        const finalWhiteTime = myColor === 'w' ? whiteTime + increment : whiteTime;
        const finalBlackTime = myColor === 'b' ? blackTime + increment : blackTime;

        await sendOnlineMove(
          matchId,
          testGame.fen(),
          testGame.pgn(),
          nextTurn,
          from,
          to,
          finalWhiteTime,
          finalBlackTime,
          status,
          winner,
          reason
        );
      } catch (e) {
        console.error('Online move error:', e);
      }
    },
    [isMyTurn, session, game, myColor, whiteTime, blackTime, matchId, profile?.displayName, updateRespectMetrics]
  );

  const handleResign = async () => {
    if (!session || session.status !== 'in_progress') return;
    if (window.confirm('Are you sure you want to resign the online match?')) {
      soundManager.playDefeat();
      await resignOnlineMatch(matchId, myColor, profile?.displayName || 'Player');
    }
  };

  const handleOfferDraw = async () => {
    if (!session || !profile) return;
    if (session.drawOfferFrom && session.drawOfferFrom !== profile.uid) {
      // Accept opponent's draw offer
      await acceptDrawOnlineMatch(matchId);
    } else {
      await offerDrawOnlineMatch(matchId, profile.uid);
      setPendingDraw(true);
    }
  };

  const handleCopyMatchId = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(matchId);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-2 sm:p-4 space-y-4 animate-in fade-in">
      {/* Header Bar */}
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
        <div className="lg:col-span-8 flex flex-col items-center">
          {/* Opponent Info & Clock (Top) */}
          <div className="w-full max-w-[560px] mb-2 p-2.5 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                {opponent?.photoURL || opponent?.avatar ? (
                  <img
                    src={opponent.photoURL || opponent.avatar}
                    alt={opponent.displayName}
                    className="w-9 h-9 rounded-full object-cover border border-[#F5C453]"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#161c12] border border-[#F5C453] flex items-center justify-center font-bold text-xs text-[#F5C453]">
                    {opponent?.displayName?.charAt(0) || '⚔️'}
                  </div>
                )}
                <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black ${
                  opponent?.uid?.startsWith('ww_') ? 'bg-amber-400' : 'bg-emerald-500'
                }`} />
              </div>

              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>{opponent?.displayName || 'Opponent'}</span>
                  {opponent?.flag && <span>{opponent.flag}</span>}
                  {opponent?.uid?.startsWith('ww_') ? (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      🤖 BOT
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      🟢 HUMAN
                    </span>
                  )}
                  {opponent?.username && (
                    <span className="text-[10px] font-mono text-[#F5C453]">@{opponent.username}</span>
                  )}
                </div>
                <div className="text-[10px] text-[#DFD0B0]/60">
                  {opponent?.country ? `${opponent.country} • ` : ''}{opponent?.honorRank || 'Tactician'} • {opponent?.elo || 1200} Elo
                </div>
              </div>
            </div>

            {/* Opponent Clock */}
            <div className={`px-4 py-1.5 rounded-xl font-mono text-base font-black border transition-all ${
              session?.turn !== myColor && session?.status === 'in_progress'
                ? 'bg-[#8C2425] text-white border-[#F5C453] shadow-md shadow-[#8C2425]/40 animate-pulse'
                : 'bg-white/5 text-white/70 border-white/10'
            }`}>
              {Math.floor((isWhitePlayer ? blackTime : whiteTime) / 60)}:
              {String((isWhitePlayer ? blackTime : whiteTime) % 60).padStart(2, '0')}
            </div>
          </div>

          {/* Chess Board */}
          <div className="relative p-2.5 sm:p-3.5 rounded-3xl bg-[#10140e] border-2 border-[#F5C453]/30 shadow-2xl">
            <ChessBoard
              game={game}
              isFlipped={!isWhitePlayer}
              boardTheme={settings.boardTheme}
              pieceTheme={settings.pieceTheme}
              showCoordinates={settings.showCoordinates}
              highlightLastMove={settings.highlightLastMove}
              showLegalMoves={settings.showLegalMoves}
              lastMove={lastMove}
              onMove={handleMakeMove}
              disabled={!isMyTurn || session?.status !== 'in_progress'}
            />

            {/* Turn Indicator Banner */}
            <div className="mt-2.5 px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-[#F5C453]/30 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F5C453] animate-ping" />
                <span className="font-bold text-white">
                  {session?.status !== 'in_progress'
                    ? `Match ${session?.status?.toUpperCase()}`
                    : isMyTurn
                    ? 'Your Turn — Choose your move'
                    : `${opponent?.displayName || 'Opponent'} is thinking...`}
                </span>
              </div>
              <span className="text-[#DFD0B0]/70 font-mono text-[11px]">
                You play as {isWhitePlayer ? 'White ⚪' : 'Black ⚫'}
              </span>
            </div>
          </div>

          {/* Player Info & Clock (Bottom) */}
          <div className="w-full max-w-[560px] mt-2 p-2.5 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                {profile?.photoURL ? (
                  <img
                    src={profile.photoURL}
                    alt={profile.displayName}
                    className="w-9 h-9 rounded-full object-cover border border-[#F5C453]"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-[#52673A] border border-[#F5C453] flex items-center justify-center font-bold text-xs text-white">
                    {profile?.displayName?.charAt(0) || '👑'}
                  </div>
                )}
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-black" />
              </div>

              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>{profile?.displayName || 'You'}</span>
                  <span className="text-[10px] font-mono text-[#F5C453]">(You)</span>
                </div>
                <div className="text-[10px] text-[#DFD0B0]/60">
                  {profile?.rankBadge} {profile?.honorRank} • {profile?.elo} Elo
                </div>
              </div>
            </div>

            {/* My Clock */}
            <div className={`px-4 py-1.5 rounded-xl font-mono text-base font-black border transition-all ${
              isMyTurn
                ? 'bg-[#52673A] text-white border-[#F5C453] shadow-md shadow-[#52673A]/40'
                : 'bg-white/5 text-white/70 border-white/10'
            }`}>
              {Math.floor((isWhitePlayer ? whiteTime : blackTime) / 60)}:
              {String((isWhitePlayer ? whiteTime : blackTime) % 60).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Controls, Draw Offers & Result Details */}
        <div className="lg:col-span-4 space-y-4">
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
            </div>
          )}

          {/* In-Game Action Buttons */}
          <div className="glass-panel p-4 rounded-3xl border border-white/10 space-y-3">
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
  );
};
