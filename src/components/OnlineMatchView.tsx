import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Chess, Square } from 'chess.js';
import {
  AppSettings,
  MoveLog,
  OnlineMatchSession,
  PieceColor,
  PieceType
} from '../types/chess';
import {
  ABANDON_CLAIM_MS,
  HEARTBEAT_INTERVAL_MS,
  abortMatch,
  acceptOnlineMatchChallenge,
  acceptRematch,
  canClaimAbandon,
  claimAbandonment,
  claimTimeout,
  colorOfPlayer,
  hasFlagged,
  heartbeat,
  isOpponentOffline,
  listenToMatch,
  offerDraw,
  offerRematch,
  remainingMs,
  resignMatch,
  respondToDrawOffer,
  serverNow,
  submitMove
} from '../services/onlineMatchService';
import { eloDelta, getCapturedMaterial } from '../utils/chessEngine';
import { engine } from '../engine/client';
import { detectOpening } from '../utils/openings';
import { useAuth } from '../context/AuthContext';
import { ChessBoard } from './ChessBoard';
import { CapturedPieces } from './CapturedPieces';
import { EvalBar } from './EvalBar';
import { MoveHistory } from './MoveHistory';
import { PromotionModal } from './PromotionModal';
import { soundManager } from '../utils/audio';
import {
  AlertTriangle,
  Bot,
  Check,
  Copy,
  Eye,
  Flag,
  Handshake,
  Link2,
  RotateCcw,
  ShieldAlert,
  Swords,
  Trophy,
  Wifi,
  WifiOff,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface OnlineMatchViewProps {
  matchId: string;
  settings: AppSettings;
  onClose: () => void;
  /** Called when the players start a rematch, so the parent can swap match ids. */
  onSwitchMatch?: (matchId: string) => void;
  onOpenChatWithOpponent?: (opponentUid: string) => void;
}

const formatClock = (ms: number) => {
  if (!Number.isFinite(ms)) return '∞';
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }
  // Show tenths under 20 seconds — it matters in bullet.
  if (totalSeconds < 20 && ms > 0) {
    return `${minutes}:${String(seconds).padStart(2, '0')}.${Math.floor((ms % 1000) / 100)}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const isTerminal = (session: OnlineMatchSession | null) =>
  !!session && session.status !== 'in_progress' && session.status !== 'waiting';

export const OnlineMatchView: React.FC<OnlineMatchViewProps> = ({
  matchId,
  settings,
  onClose,
  onSwitchMatch,
  onOpenChatWithOpponent
}) => {
  const { profile, updateRespectMetrics } = useAuth();
  const myUid = profile?.uid;

  const [session, setSession] = useState<OnlineMatchSession | null>(null);
  const [integrity, setIntegrity] = useState<{ ok: boolean; reason?: string }>({ ok: true });
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmResign, setConfirmResign] = useState(false);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [viewIndex, setViewIndex] = useState(-1);
  const [evalScore, setEvalScore] = useState(0);
  const [botThinking, setBotThinking] = useState(false);
  const [, forceTick] = useState(0);

  const botBusyRef = useRef(false);
  const timeoutClaimedRef = useRef(false);
  const ratingAppliedRef = useRef<string | null>(null);
  const lastSoundedMoveRef = useRef(-1);

  /* ---------------------------------------------------------------- *
   * Subscription
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (!matchId) return;
    setSession(null);
    setViewIndex(-1);
    setNotice(null);
    setConnectionError(null);
    timeoutClaimedRef.current = false;
    lastSoundedMoveRef.current = -1;

    const unsubscribe = listenToMatch(
      matchId,
      update => {
        setSession(update.session);
        setIntegrity({ ok: update.integrityOk, reason: update.integrityReason });
      },
      error => setConnectionError(error.message)
    );
    return unsubscribe;
  }, [matchId]);

  /* ---------------------------------------------------------------- *
   * Derived state
   * ---------------------------------------------------------------- */
  const myColor = colorOfPlayer(session, myUid);
  const isSpectator = !!session && myColor === null;
  const boardColor: PieceColor = myColor ?? 'w';
  const opponentColor: PieceColor = boardColor === 'w' ? 'b' : 'w';

  const me = session ? (boardColor === 'w' ? session.whitePlayer : session.blackPlayer) : null;
  const opponent = session ? (boardColor === 'w' ? session.blackPlayer : session.whitePlayer) : null;

  const liveGame = useMemo(() => {
    const chess = new Chess();
    if (!session) return chess;
    try {
      chess.load(session.startFen || undefined);
    } catch {
      /* fall back to the standard start position */
    }
    for (const san of session.moves ?? []) {
      try {
        chess.move(san);
      } catch {
        break;
      }
    }
    return chess;
  }, [session?.moves?.length, session?.fen, session?.startFen]);

  const moveLogs = useMemo<MoveLog[]>(() => {
    const logs: MoveLog[] = [];
    const chess = new Chess();
    try {
      chess.load(session?.startFen || undefined);
    } catch {
      /* standard start */
    }
    for (const san of session?.moves ?? []) {
      try {
        const move = chess.move(san);
        if (!move) break;
        logs.push({
          san: move.san,
          from: move.from,
          to: move.to,
          piece: move.piece as PieceType,
          color: move.color as PieceColor,
          captured: move.captured as PieceType | undefined,
          promotion: move.promotion as PieceType | undefined,
          fen: chess.fen()
        });
      } catch {
        break;
      }
    }
    return logs;
  }, [session?.moves?.length, session?.fen]);

  const isViewingHistory = viewIndex >= 0 && viewIndex < moveLogs.length - 1;
  const displayGame = useMemo(() => {
    if (!isViewingHistory) return liveGame;
    try {
      return new Chess(moveLogs[viewIndex].fen);
    } catch {
      return liveGame;
    }
  }, [isViewingHistory, viewIndex, moveLogs, liveGame]);

  const finished = isTerminal(session);
  const isMyTurn =
    !!session && !!myColor && session.status === 'in_progress' && session.turn === myColor;
  const canInteract = isMyTurn && !isViewingHistory && integrity.ok;

  const lastMove =
    session?.lastMoveFrom && session?.lastMoveTo && !isViewingHistory
      ? { from: session.lastMoveFrom, to: session.lastMoveTo }
      : null;

  const capturedMaterial = getCapturedMaterial(displayGame);
  const openingInfo = useMemo(() => detectOpening(moveLogs.map(log => log.san)), [moveLogs]);

  /* ---------------------------------------------------------------- *
   * Clock ticking — the document stores timestamps, we just re-render
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (!session || session.status !== 'in_progress') return;
    const interval = setInterval(() => forceTick(tick => tick + 1), 200);
    return () => clearInterval(interval);
  }, [session?.status, session?.turn, session?.moveCount]);

  const myTimeMs = session ? remainingMs(session, boardColor) : 0;
  const opponentTimeMs = session ? remainingMs(session, opponentColor) : 0;

  /* ---------------------------------------------------------------- *
   * Flag falls — whoever notices first settles it, the transaction re-checks
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (!session || !myUid || isSpectator) return;
    if (!hasFlagged(session) || timeoutClaimedRef.current) return;
    timeoutClaimedRef.current = true;
    void claimTimeout(matchId, myUid).finally(() => {
      window.setTimeout(() => {
        timeoutClaimedRef.current = false;
      }, 3000);
    });
  }, [session, myUid, isSpectator, matchId, myTimeMs, opponentTimeMs]);

  // A challenge sits in "waiting" until the invited player opens it.
  useEffect(() => {
    if (!session || !myColor) return;
    if (session.status !== 'waiting') return;
    if (session.hostId === myUid) return;
    void acceptOnlineMatchChallenge(matchId);
  }, [session?.status, session?.hostId, myColor, myUid, matchId]);

  /* ---------------------------------------------------------------- *
   * Presence heartbeat
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (!session || !myUid || !myColor || session.status !== 'in_progress') return;
    void heartbeat(matchId, myUid, myColor);
    const interval = setInterval(() => {
      void heartbeat(matchId, myUid, myColor);
    }, HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [matchId, myUid, myColor, session?.status]);

  /* ---------------------------------------------------------------- *
   * Move sounds (driven by the document, so both sides hear the same thing)
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (!session) return;
    const count = session.moveCount ?? 0;
    if (lastSoundedMoveRef.current === -1) {
      lastSoundedMoveRef.current = count;
      return;
    }
    if (count <= lastSoundedMoveRef.current) return;
    lastSoundedMoveRef.current = count;

    const san = session.lastMoveSan ?? '';
    if (san.includes('#')) soundManager.playCheck();
    else if (san.includes('+')) soundManager.playCheck();
    else if (san.includes('x')) soundManager.playCapture();
    else if (san.includes('O-O')) soundManager.playCastle();
    else soundManager.playMove();
  }, [session?.moveCount, session?.lastMoveSan]);

  /* ---------------------------------------------------------------- *
   * Live evaluation (worker — never blocks the board)
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (!settings.showEvalBar || !session) return;
    let cancelled = false;
    const fen = displayGame.fen();
    const timer = window.setTimeout(() => {
      engine
        .search({ fen }, { depth: 8, timeMs: 350 })
        .then(result => {
          if (!cancelled) setEvalScore(result.scoreWhite / 100);
        })
        .catch(() => {});
    }, 120);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [displayGame, settings.showEvalBar, session?.moveCount]);

  /* ---------------------------------------------------------------- *
   * Engine opponent.
   *
   * The old version re-created its timeout on every clock tick, so the
   * 1.4–2.6s "thinking" delay was cancelled every second and the bot never
   * actually moved. This effect only depends on the position.
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (!session || !myUid || !myColor) return;
    if (!session.vsBot || session.status !== 'in_progress') return;
    if (session.turn === myColor) return;
    if (botBusyRef.current) return;

    const botPlayer = session.turn === 'w' ? session.whitePlayer : session.blackPlayer;
    if (!botPlayer?.isBot) return;

    botBusyRef.current = true;
    setBotThinking(true);
    let cancelled = false;

    const think = async () => {
      const startedAt = Date.now();
      try {
        const result = await engine.botMove({ fen: session.fen }, botPlayer.botId ?? 'bot-bishop');
        if (cancelled || !result.bestMove) return;

        // Keep a human-feeling minimum delay, without ever cancelling the move.
        const elapsed = Date.now() - startedAt;
        const minimumDelay = 600 + Math.random() * 900;
        if (elapsed < minimumDelay) {
          await new Promise(resolve => setTimeout(resolve, minimumDelay - elapsed));
        }
        if (cancelled) return;

        await submitMove(
          matchId,
          myUid,
          {
            from: result.bestMove.slice(0, 2),
            to: result.bestMove.slice(2, 4),
            promotion: result.bestMove[4]
          },
          botPlayer.uid
        );
      } catch (error) {
        console.error('Engine opponent failed:', error);
        setNotice('The engine opponent hit an error. Try resigning or starting a new match.');
      } finally {
        botBusyRef.current = false;
        if (!cancelled) setBotThinking(false);
      }
    };

    void think();

    return () => {
      cancelled = true;
      setBotThinking(false);
    };
  }, [session?.fen, session?.turn, session?.status, session?.vsBot, matchId, myUid, myColor]);

  /* ---------------------------------------------------------------- *
   * Rating — applied exactly once per match, per client
   * ---------------------------------------------------------------- */
  const ratingChange = useMemo(() => {
    if (!session || !myColor || !finished || session.status === 'aborted') return null;
    if (session.isRated === false) return null;
    const myElo = typeof profile?.elo === 'number' ? profile.elo : 1200;
    const opponentElo = opponent?.elo ?? 1200;
    const score = session.winner === 'draw' ? 0.5 : session.winner === myColor ? 1 : 0;
    return {
      score,
      delta: eloDelta(myElo, opponentElo, score, profile?.gamesPlayed ?? 30)
    };
  }, [session?.status, session?.winner, myColor, finished, profile?.elo, profile?.gamesPlayed, opponent?.elo]);

  useEffect(() => {
    if (!session || !ratingChange || !myColor || !updateRespectMetrics) return;
    const storageKey = `chesskys_rated_${matchId}`;
    if (ratingAppliedRef.current === matchId) return;
    if (localStorage.getItem(storageKey)) return;

    ratingAppliedRef.current = matchId;
    localStorage.setItem(storageKey, '1');

    const won = ratingChange.score === 1;
    const drew = ratingChange.score === 0.5;

    void updateRespectMetrics({
      elo: ratingChange.delta,
      respectPoints: won ? 25 : drew ? 8 : -6,
      wins: won ? 1 : 0,
      gamesPlayed: 1
    });

    if (won) {
      soundManager.playVictory();
      try {
        confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
      } catch {
        /* confetti is cosmetic */
      }
    } else if (!drew) {
      soundManager.playDefeat();
    }
  }, [ratingChange, session?.status, matchId, myColor, updateRespectMetrics]);

  /* ---------------------------------------------------------------- *
   * Actions
   * ---------------------------------------------------------------- */
  const runMove = useCallback(
    async (from: Square, to: Square, promotion?: string) => {
      if (!myUid || !session) return;
      const result = await submitMove(matchId, myUid, { from, to, promotion });
      if (!result.ok && result.reason) setNotice(result.reason);
      else setNotice(null);
    },
    [matchId, myUid, session]
  );

  const handleBoardMove = useCallback(
    (from: Square, to: Square) => {
      if (!canInteract) return;
      const piece = liveGame.get(from);
      const isPromotion =
        piece?.type === 'p' &&
        ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'));

      if (isPromotion && !settings.autoQueen) {
        setPendingPromotion({ from, to });
        return;
      }
      void runMove(from, to, isPromotion ? 'q' : undefined);
    },
    [canInteract, liveGame, runMove, settings.autoQueen]
  );

  const handleResign = async () => {
    if (!myUid) return;
    setConfirmResign(false);
    await resignMatch(matchId, myUid);
  };

  const handleAbort = async () => {
    if (!myUid) return;
    const ok = await abortMatch(matchId, myUid);
    if (!ok) setNotice('This match is past the abort window — resign instead.');
  };

  const handleDraw = async () => {
    if (!myUid || !session) return;
    if (session.drawOfferFrom && session.drawOfferFrom !== myUid) {
      await respondToDrawOffer(matchId, myUid, true);
      return;
    }
    if (session.vsBot) {
      setNotice('Engine challengers play on — beat them on the board.');
      return;
    }
    await offerDraw(matchId, myUid);
    setNotice('Draw offered.');
  };

  const handleDeclineDraw = async () => {
    if (!myUid) return;
    await respondToDrawOffer(matchId, myUid, false);
  };

  const handleClaimAbandon = async () => {
    if (!myUid) return;
    const ok = await claimAbandonment(matchId, myUid);
    if (!ok) setNotice('Your opponent is still connected.');
  };

  const handleRematch = async () => {
    if (!myUid || !session) return;
    if (session.rematchMatchId) {
      onSwitchMatch?.(session.rematchMatchId);
      return;
    }
    if (session.vsBot || session.rematchOfferFrom) {
      const newId = await acceptRematch(matchId, myUid);
      if (newId) onSwitchMatch?.(newId);
      return;
    }
    await offerRematch(matchId, myUid);
    setNotice('Rematch offered.');
  };

  const shareLink = `${window.location.origin}${window.location.pathname}?match=${matchId}`;
  const handleCopyLink = () => {
    navigator.clipboard?.writeText(shareLink).then(
      () => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      },
      () => setNotice('Could not copy the link.')
    );
  };

  // Jump into an accepted rematch automatically.
  useEffect(() => {
    if (session?.rematchMatchId && finished) {
      const timer = window.setTimeout(() => onSwitchMatch?.(session.rematchMatchId!), 900);
      return () => window.clearTimeout(timer);
    }
  }, [session?.rematchMatchId, finished, onSwitchMatch]);

  /* ---------------------------------------------------------------- *
   * Render
   * ---------------------------------------------------------------- */
  if (!session) {
    return (
      <div className="w-full max-w-3xl mx-auto p-10 text-center glass-panel rounded-3xl border border-white/10">
        <div className="animate-spin w-10 h-10 border-2 border-[#F5C453] border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-sm text-[#DFD0B0]/80">
          {connectionError ? `Connection problem: ${connectionError}` : 'Loading match…'}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white border border-white/10 cursor-pointer"
        >
          Back to the board
        </button>
      </div>
    );
  }

  const opponentOffline = isOpponentOffline(session, myColor);
  const abandonClaimable = canClaimAbandon(session, myColor);
  const drawOfferedToMe = !!session.drawOfferFrom && session.drawOfferFrom !== myUid;
  const iOfferedDraw = session.drawOfferFrom === myUid;
  const lowTime = Number.isFinite(myTimeMs) && myTimeMs < 20_000 && session.status === 'in_progress';

  const PlayerStrip: React.FC<{
    player: typeof me;
    timeMs: number;
    active: boolean;
    isSelf: boolean;
  }> = ({ player, timeMs, active, isSelf }) => (
    <div className="w-full max-w-[560px] p-2.5 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative shrink-0">
          {player?.photoURL || player?.avatar ? (
            <img
              src={player.photoURL || player.avatar}
              alt={player.displayName}
              className="w-9 h-9 rounded-full object-cover border border-[#F5C453] bg-[#161c12]"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-[#161c12] border border-[#F5C453] flex items-center justify-center font-bold text-xs text-[#F5C453]">
              {player?.displayName?.charAt(0) ?? '?'}
            </div>
          )}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-black ${
              player?.isBot
                ? 'bg-amber-400'
                : !isSelf && opponentOffline
                  ? 'bg-rose-500'
                  : 'bg-emerald-500'
            }`}
          />
        </div>

        <div className="min-w-0">
          <div className="text-xs font-black text-white flex items-center gap-1.5 flex-wrap">
            <span className="truncate max-w-[150px]">{player?.displayName ?? 'Player'}</span>
            {player?.flag && <span>{player.flag}</span>}
            {isSelf && <span className="text-[10px] font-mono text-[#F5C453]">(you)</span>}
            {player?.isBot ? (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Bot className="w-2.5 h-2.5" /> ENGINE
              </span>
            ) : (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                HUMAN
              </span>
            )}
            {!isSelf && opponentOffline && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                <WifiOff className="w-2.5 h-2.5" /> RECONNECTING
              </span>
            )}
          </div>
          <div className="text-[10px] text-[#DFD0B0]/60 truncate">
            {player?.country ? `${player.country} • ` : ''}
            {player?.honorRank ?? 'Tactician'} • {player?.elo ?? 1200} Elo
            {!isSelf && botThinking && player?.isBot ? ' • thinking…' : ''}
          </div>
        </div>
      </div>

      <div
        className={`px-4 py-1.5 rounded-xl font-mono text-base font-black border transition-all tabular-nums ${
          active
            ? isSelf
              ? 'bg-[#52673A] text-white border-[#F5C453] shadow-md shadow-[#52673A]/40'
              : 'bg-[#8C2425] text-white border-[#F5C453] shadow-md shadow-[#8C2425]/40'
            : 'bg-white/5 text-white/70 border-white/10'
        } ${isSelf && lowTime && active ? 'animate-pulse text-rose-200 border-rose-400' : ''}`}
      >
        {formatClock(timeMs)}
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto p-2 sm:p-4 space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="glass-panel p-3.5 sm:p-4 rounded-3xl border border-[#F5C453]/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#8C2425] via-[#52673A] to-[#F5C453] text-[#F5C453] border border-[#F5C453]/40 shadow-md">
            <Swords className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
              {session.vsBot ? 'Engine Challenge' : 'Live Online Match'}
              {isSpectator && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> SPECTATING
                </span>
              )}
            </h2>
            <p className="text-[11px] text-[#DFD0B0]/70 font-mono">
              {session.timeControl?.name ?? 'Unlimited'} •{' '}
              {session.isRated === false ? 'Casual' : 'Rated'} • move{' '}
              {Math.ceil((session.moveCount ?? 0) / 2) || 1}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer transition-colors"
            title="Copy an invite link to this match"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />}
            {copied ? 'Copied' : 'Invite link'}
          </button>
          {opponent && !opponent.isBot && onOpenChatWithOpponent && (
            <button
              type="button"
              onClick={() => onOpenChatWithOpponent(opponent.uid)}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white cursor-pointer transition-colors"
            >
              Chat
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white cursor-pointer transition-colors"
            title="Leave the match view"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Integrity / connection banners */}
      {!integrity.ok && (
        <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5">
          <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-black">Match state rejected</p>
            <p className="text-rose-200/80">
              {integrity.reason ?? 'The stored position does not match the move history.'} Moves are
              disabled — this position was not produced by legal play.
            </p>
          </div>
        </div>
      )}

      {connectionError && (
        <div className="p-3 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {connectionError}
        </div>
      )}

      {notice && (
        <div className="p-3 rounded-2xl bg-white/5 border border-white/15 text-[#DFD0B0] text-xs flex items-center justify-between gap-2">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Board column */}
        <div className="lg:col-span-8 flex flex-col items-center gap-2">
          <PlayerStrip
            player={opponent}
            timeMs={opponentTimeMs}
            active={session.turn === opponentColor && session.status === 'in_progress'}
            isSelf={false}
          />

          <div className="flex gap-2 items-stretch">
            {settings.showEvalBar && (
              <div className="hidden sm:block w-6">
                <EvalBar score={evalScore} isFlipped={boardColor === 'b'} />
              </div>
            )}

            <div className="relative p-2.5 sm:p-3.5 rounded-3xl bg-[#10140e] border-2 border-[#F5C453]/30 shadow-2xl">
              <ChessBoard
                game={displayGame}
                isFlipped={boardColor === 'b'}
                boardTheme={settings.boardTheme}
                pieceTheme={settings.pieceTheme}
                showCoordinates={settings.showCoordinates}
                highlightLastMove={settings.highlightLastMove}
                showLegalMoves={settings.showLegalMoves}
                lastMove={lastMove}
                onMove={handleBoardMove}
                disabled={!canInteract}
              />

              <div className="mt-2.5 px-4 py-2 rounded-2xl bg-black/80 backdrop-blur-md border border-[#F5C453]/30 flex items-center justify-between text-xs gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      finished ? 'bg-white/40' : isMyTurn ? 'bg-[#F5C453] animate-ping' : 'bg-white/40'
                    }`}
                  />
                  <span className="font-bold text-white truncate">
                    {isViewingHistory
                      ? 'Reviewing an earlier position'
                      : finished
                        ? `Match ${session.status.replace('_', ' ')}`
                        : isSpectator
                          ? `${session.turn === 'w' ? 'White' : 'Black'} to move`
                          : isMyTurn
                            ? 'Your turn'
                            : `${opponent?.displayName ?? 'Opponent'} is thinking…`}
                  </span>
                </div>
                <span className="text-[#DFD0B0]/70 font-mono text-[11px] shrink-0">
                  {isSpectator ? 'spectator' : `you play ${boardColor === 'w' ? 'white' : 'black'}`}
                </span>
              </div>

              {isViewingHistory && (
                <button
                  type="button"
                  onClick={() => setViewIndex(-1)}
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-[#F5C453] text-black text-[11px] font-black shadow-lg cursor-pointer"
                >
                  Back to live
                </button>
              )}
            </div>
          </div>

          <PlayerStrip
            player={me}
            timeMs={myTimeMs}
            active={session.turn === boardColor && session.status === 'in_progress'}
            isSelf
          />

          <div className="w-full max-w-[560px] flex items-center justify-between px-1">
            <CapturedPieces
              pieces={boardColor === 'w' ? capturedMaterial.capturedByWhite : capturedMaterial.capturedByBlack}
              pieceTheme={settings.pieceTheme}
              colorOfCapturedPieces={opponentColor}
              materialAdvantage={
                boardColor === 'w' ? capturedMaterial.materialDifference : -capturedMaterial.materialDifference
              }
            />
            {openingInfo && (
              <span className="text-[10px] text-[#DFD0B0]/60 font-mono truncate max-w-[45%] text-right">
                {openingInfo.eco} {openingInfo.name}
              </span>
            )}
          </div>
        </div>

        {/* Side column */}
        <div className="lg:col-span-4 space-y-3">
          {finished && (
            <div className="glass-panel p-5 rounded-3xl border border-[#F5C453]/40 shadow-xl space-y-3 text-center animate-in zoom-in-95">
              <div className="text-3xl">
                {session.winner === 'draw'
                  ? '🤝'
                  : session.winner && session.winner === myColor
                    ? '👑'
                    : session.status === 'aborted'
                      ? '⏹️'
                      : '⚔️'}
              </div>
              <h3 className="text-lg font-black text-white">
                {session.status === 'aborted'
                  ? 'Match aborted'
                  : session.winner === 'draw'
                    ? 'Draw'
                    : session.winner === myColor
                      ? 'Victory'
                      : isSpectator
                        ? `${session.winner === 'w' ? 'White' : 'Black'} wins`
                        : 'Defeat'}
              </h3>
              <p className="text-xs text-[#DFD0B0]/80">{session.reason}</p>

              {ratingChange && (
                <div
                  className={`p-2.5 rounded-xl text-xs font-bold border ${
                    ratingChange.delta >= 0
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}
                >
                  {ratingChange.delta >= 0 ? '+' : ''}
                  {ratingChange.delta} Elo
                  <span className="text-white/50 font-normal">
                    {' '}
                    (vs {opponent?.elo ?? 1200})
                  </span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleRematch}
                  disabled={isSpectator}
                  className="py-2.5 px-3 rounded-xl bg-[#F5C453] hover:bg-[#e0b246] disabled:opacity-40 text-black font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  {session.rematchMatchId
                    ? 'Enter rematch'
                    : session.rematchOfferFrom && session.rematchOfferFrom !== myUid
                      ? 'Accept rematch'
                      : 'Rematch'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 cursor-pointer transition-colors"
                >
                  Leave
                </button>
              </div>
              {session.rematchOfferFrom === myUid && !session.rematchMatchId && (
                <p className="text-[11px] text-[#DFD0B0]/60">Waiting for your opponent to accept…</p>
              )}
            </div>
          )}

          {/* Opponent disconnected */}
          {opponentOffline && !finished && (
            <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs space-y-2">
              <p className="font-black flex items-center gap-2">
                <Wifi className="w-4 h-4" /> {opponent?.displayName} lost connection
              </p>
              <p className="text-amber-200/80">
                {abandonClaimable
                  ? 'They have been gone long enough — you can claim the win.'
                  : `Waiting ${Math.max(
                      0,
                      Math.ceil(
                        (ABANDON_CLAIM_MS -
                          (serverNow() - (myColor === 'w' ? session.blackSeenAt ?? 0 : session.whiteSeenAt ?? 0))) /
                          1000
                      )
                    )}s before you can claim the win.`}
              </p>
              {abandonClaimable && (
                <button
                  type="button"
                  onClick={handleClaimAbandon}
                  className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs cursor-pointer transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trophy className="w-4 h-4" /> Claim victory
                </button>
              )}
            </div>
          )}

          {/* Draw offer */}
          {drawOfferedToMe && !finished && (
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs space-y-2">
              <p className="font-bold">{opponent?.displayName} offers a draw.</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDraw}
                  className="py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black text-xs cursor-pointer"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={handleDeclineDraw}
                  className="py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                >
                  Decline
                </button>
              </div>
            </div>
          )}

          {/* Controls */}
          {!isSpectator && !finished && (
            <div className="glass-panel p-4 rounded-3xl border border-white/10 space-y-3">
              <h4 className="text-xs font-bold text-[#DFD0B0]/70 uppercase tracking-wider">
                Match controls
              </h4>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDraw}
                  disabled={iOfferedDraw}
                  className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                >
                  <Handshake className="w-4 h-4 text-amber-400" />
                  {iOfferedDraw ? 'Draw offered' : 'Offer draw'}
                </button>

                {(session.moveCount ?? 0) < 2 ? (
                  <button
                    type="button"
                    onClick={handleAbort}
                    className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4 text-rose-300" /> Abort
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmResign(true)}
                    className="py-2.5 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-rose-500/30 transition-colors cursor-pointer"
                  >
                    <Flag className="w-4 h-4" /> Resign
                  </button>
                )}
              </div>

              {confirmResign && (
                <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 space-y-2">
                  <p className="text-xs text-rose-100 font-bold">Resign this match?</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleResign}
                      className="py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs cursor-pointer"
                    >
                      Yes, resign
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmResign(false)}
                      className="py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                    >
                      Keep playing
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <MoveHistory
            moveLogs={moveLogs}
            currentMoveIndex={isViewingHistory ? viewIndex : moveLogs.length - 1}
            onSelectMoveIndex={index => setViewIndex(index >= moveLogs.length - 1 ? -1 : index)}
            openingInfo={openingInfo}
            pgn={session.pgn ?? ''}
            fen={displayGame.fen()}
          />
        </div>
      </div>

      {pendingPromotion && (
        <PromotionModal
          color={boardColor}
          pieceTheme={settings.pieceTheme}
          onSelect={piece => {
            const promotion = pendingPromotion;
            setPendingPromotion(null);
            void runMove(promotion.from, promotion.to, piece);
          }}
        />
      )}
    </div>
  );
};
