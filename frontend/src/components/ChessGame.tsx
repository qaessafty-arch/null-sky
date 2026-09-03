import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chess } from 'chess.js';
import { 
  Trophy, Flag, Handshake, Undo2, Pause, Play, Send, 
  Share2, RotateCcw, Volume2, VolumeX, ShieldAlert, Sparkles,
  CheckCircle2, Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlayerInfo {
  id: string;
  username: string;
  rating: number;
  avatarUrl?: string;
  countryCode?: string;
}

interface ChessGameProps {
  socket: any;
  gameId: string;
  myColor: 'white' | 'black' | 'spectator';
  initialFen?: string;
  timeControl?: string;
  opponent?: PlayerInfo;
  currentUser?: PlayerInfo;
  onLeaveGame: () => void;
  onOpenAnalysis?: (pgn: string) => void;
}

export const ChessGame: React.FC<ChessGameProps> = ({
  socket,
  gameId,
  myColor,
  initialFen,
  timeControl = '10+0',
  opponent,
  currentUser,
  onLeaveGame,
  onOpenAnalysis
}) => {
  const [game, setGame] = useState<Chess>(new Chess(initialFen || undefined));
  const [fen, setFen] = useState<string>(game.fen());
  const [turn, setTurn] = useState<'w' | 'b'>(game.turn());
  const [whiteTime, setWhiteTime] = useState<number>(600);
  const [blackTime, setBlackTime] = useState<number>(600);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);

  // Promotion Dialog
  const [pendingPromotion, setPendingPromotion] = useState<{ from: string; to: string } | null>(null);
  const promotionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Modals & Notices
  const [drawOfferReceived, setDrawOfferReceived] = useState<boolean>(false);
  const [takebackReceived, setTakebackReceived] = useState<any>(null);
  const [gameOverData, setGameOverData] = useState<any>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Chat
  const [messages, setMessages] = useState<Array<{ username: string; message: string; timestamp: number }>>([]);
  const [chatInput, setChatInput] = useState<string>('');
  const [isOpponentTyping, setIsOpponentTyping] = useState<boolean>(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Move history for stepping through
  const [moveHistory, setMoveHistory] = useState<Array<{ san: string; fen: string }>>([]);
  const [viewingIndex, setViewingIndex] = useState<number>(-1);

  // Audio Synthesizer for instant zero-dependency sound effects
  const playSound = useCallback((type: 'move' | 'capture' | 'check' | 'gameover') => {
    if (!soundEnabled || typeof window === 'undefined' || !window.AudioContext) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'move') {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } else if (type === 'capture') {
        osc.frequency.setValueAtTime(320, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else if (type === 'check') {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
        osc.start();
        osc.stop(ctx.currentTime + 0.2);
      } else if (type === 'gameover') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {}
  }, [soundEnabled]);

  // Socket Listener Wireup
  useEffect(() => {
    if (!socket) return;

    socket.on('moveMade', (data: any) => {
      const newGame = new Chess(data.fen);
      setGame(newGame);
      setFen(data.fen);
      setTurn(newGame.turn());
      setLastMove(data.lastMove);
      setWhiteTime(data.timeWhite);
      setBlackTime(data.timeBlack);
      setSelectedSquare(null);
      setLegalMoves([]);

      setMoveHistory(prev => [...prev, { san: data.san, fen: data.fen }]);

      if (data.isCheckmate || data.isDraw) {
        playSound('gameover');
      } else if (data.isCheck) {
        playSound('check');
      } else if (data.captured) {
        playSound('capture');
      } else {
        playSound('move');
      }
    });

    socket.on('timerUpdate', (data: any) => {
      setWhiteTime(data.white);
      setBlackTime(data.black);
    });

    socket.on('gameOver', (data: any) => {
      setGameOverData(data);
      playSound('gameover');
      if (data.winner === myColor) {
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
    });

    socket.on('drawOffered', () => setDrawOfferReceived(true));
    socket.on('drawDeclined', () => alert('Draw offer was declined'));
    socket.on('takebackRequested', (data: any) => setTakebackReceived(data));
    socket.on('takebackDeclined', () => alert('Takeback request was declined'));

    socket.on('takebackAccepted', (data: any) => {
      const newGame = new Chess(data.fen);
      setGame(newGame);
      setFen(data.fen);
      setTurn(newGame.turn());
      setLastMove(data.lastMove);
      setMoveHistory(prev => prev.slice(0, -1));
    });

    socket.on('gamePaused', () => setIsPaused(true));
    socket.on('gameResumed', () => setIsPaused(false));

    socket.on('newMessage', (msg: any) => {
      setMessages(prev => [...prev, msg]);
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
    });

    return () => {
      socket.off('moveMade');
      socket.off('timerUpdate');
      socket.off('gameOver');
      socket.off('drawOffered');
      socket.off('drawDeclined');
      socket.off('takebackRequested');
      socket.off('takebackDeclined');
      socket.off('takebackAccepted');
      socket.off('gamePaused');
      socket.off('gameResumed');
      socket.off('newMessage');
    };
  }, [socket, playSound, myColor]);

  // Execute Move
  const makeMove = (from: string, to: string, promotion = 'q') => {
    if (gameOverData || isPaused) return;
    if (myColor !== 'spectator' && ((turn === 'w' && myColor !== 'white') || (turn === 'b' && myColor !== 'black'))) {
      return;
    }

    // Check pawn promotion
    const piece = game.get(from as any);
    if (piece && piece.type === 'p' && ((piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1'))) {
      setPendingPromotion({ from, to });
      // Auto-promote to Queen after 5 seconds
      if (promotionTimerRef.current) clearTimeout(promotionTimerRef.current);
      promotionTimerRef.current = setTimeout(() => {
        confirmPromotion('q');
      }, 5000);
      return;
    }

    socket.emit('makeMove', { gameId, from, to, promotion });
  };

  const confirmPromotion = (piece: 'q' | 'r' | 'b' | 'n') => {
    if (!pendingPromotion) return;
    if (promotionTimerRef.current) clearTimeout(promotionTimerRef.current);
    socket.emit('makeMove', {
      gameId,
      from: pendingPromotion.from,
      to: pendingPromotion.to,
      promotion: piece
    });
    setPendingPromotion(null);
  };

  // Square Click handler
  const handleSquareClick = (square: string) => {
    if (selectedSquare) {
      if (legalMoves.includes(square)) {
        makeMove(selectedSquare, square);
        setSelectedSquare(null);
        setLegalMoves([]);
        return;
      }
    }

    const piece = game.get(square as any);
    if (piece && ((piece.color === 'w' && myColor === 'white') || (piece.color === 'b' && myColor === 'black'))) {
      setSelectedSquare(square);
      const moves = game.moves({ square: square as any, verbose: true });
      setLegalMoves(moves.map(m => m.to));
    } else {
      setSelectedSquare(null);
      setLegalMoves([]);
    }
  };

  // Chat message send
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    if (chatInput.startsWith('/')) {
      const cmd = chatInput.trim().toLowerCase();
      if (cmd === '/resign') socket.emit('resign', { gameId });
      else if (cmd === '/draw') socket.emit('offerDraw', { gameId });
      else if (cmd === '/takeback') socket.emit('requestTakeback', { gameId, moveIndex: moveHistory.length - 1 });
      setChatInput('');
      return;
    }

    socket.emit('sendMessage', { gameId, message: chatInput });
    setChatInput('');
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(Math.max(0, secs) / 60);
    const s = Math.max(0, secs) % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isMyTurn = (turn === 'w' && myColor === 'white') || (turn === 'b' && myColor === 'black');

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto p-4 select-none">
      {/* LEFT / CENTER: Chessboard & Players */}
      <div className="flex-1 flex flex-col items-center">
        {/* Opponent Info Bar */}
        <div className="w-full max-w-[560px] flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center font-bold text-neutral-300">
              {opponent?.username?.charAt(0).toUpperCase() || 'O'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{opponent?.username || 'Opponent'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                  {opponent?.rating || 1200}
                </span>
              </div>
              <span className="text-xs text-neutral-500">
                {myColor === 'white' ? 'Playing as Black' : 'Playing as White'}
              </span>
            </div>
          </div>
          <div className={`px-4 py-1.5 rounded-lg font-mono font-bold text-lg flex items-center gap-1.5 ${
            (myColor === 'white' ? blackTime : whiteTime) <= 30
              ? 'bg-rose-950/80 text-rose-400 border border-rose-800 animate-pulse'
              : 'bg-neutral-800 text-white'
          }`}>
            <Clock className="w-4 h-4 text-neutral-400" />
            {formatTime(myColor === 'white' ? blackTime : whiteTime)}
          </div>
        </div>

        {/* The Board Frame */}
        <div className="w-full max-w-[560px] aspect-square bg-neutral-800 p-2 border-x border-neutral-800 shadow-2xl relative">
          {/* Custom SVG / High-Performance Canvas Board */}
          <div className="grid grid-cols-8 grid-rows-8 w-full h-full border border-neutral-700 rounded-lg overflow-hidden">
            {Array.from({ length: 64 }).map((_, idx) => {
              const row = Math.floor(idx / 8);
              const col = idx % 8;
              const actualRow = myColor === 'black' ? row : 7 - row;
              const actualCol = myColor === 'black' ? 7 - col : col;
              const file = String.fromCharCode(97 + actualCol);
              const rank = (actualRow + 1).toString();
              const square = `${file}${rank}`;

              const isDark = (actualRow + actualCol) % 2 === 0;
              const piece = game.get(square as any);
              const isSelected = selectedSquare === square;
              const isLegal = legalMoves.includes(square);
              const isLast = lastMove && (lastMove.from === square || lastMove.to === square);

              return (
                <div
                  key={square}
                  onClick={() => handleSquareClick(square)}
                  className={`relative flex items-center justify-center cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-yellow-400/70'
                      : isLast
                      ? 'bg-sky-400/40'
                      : isDark
                      ? 'bg-emerald-800 hover:bg-emerald-700'
                      : 'bg-amber-100 hover:bg-amber-50'
                  }`}
                >
                  {/* Square Coordinate Markers */}
                  {actualCol === (myColor === 'black' ? 7 : 0) && (
                    <span className={`absolute top-0.5 left-1 text-[10px] font-bold ${isDark ? 'text-emerald-300/60' : 'text-amber-800/60'}`}>
                      {rank}
                    </span>
                  )}
                  {actualRow === (myColor === 'black' ? 7 : 0) && (
                    <span className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${isDark ? 'text-emerald-300/60' : 'text-amber-800/60'}`}>
                      {file}
                    </span>
                  )}

                  {/* Legal Move Indicator */}
                  {isLegal && (
                    <div className={`absolute z-10 ${piece ? 'w-full h-full border-4 border-rose-500/80 rounded-full' : 'w-4 h-4 bg-emerald-500/80 rounded-full'}`} />
                  )}

                  {/* Chess Piece Display */}
                  {piece && (
                    <span className={`text-3xl md:text-4xl font-serif select-none transition-transform hover:scale-110 ${
                      piece.color === 'w' ? 'text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' : 'text-neutral-900 drop-shadow-[0_1px_2px_rgba(255,255,255,0.4)]'
                    }`}>
                      {piece.type === 'k' && (piece.color === 'w' ? '♔' : '♚')}
                      {piece.type === 'q' && (piece.color === 'w' ? '♕' : '♛')}
                      {piece.type === 'r' && (piece.color === 'w' ? '♖' : '♜')}
                      {piece.type === 'b' && (piece.color === 'w' ? '♗' : '♝')}
                      {piece.type === 'n' && (piece.color === 'w' ? '♘' : '♞')}
                      {piece.type === 'p' && (piece.color === 'w' ? '♙' : '♟')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Promotion Modal Dialog */}
          {pendingPromotion && (
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-30">
              <div className="bg-neutral-900 border border-neutral-700 p-6 rounded-2xl shadow-2xl text-center">
                <h3 className="text-lg font-bold text-white mb-4">Select Promotion Piece</h3>
                <div className="flex gap-4">
                  {(['q', 'r', 'b', 'n'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => confirmPromotion(p)}
                      className="w-16 h-16 bg-neutral-800 hover:bg-neutral-700 border border-neutral-600 rounded-xl text-4xl flex items-center justify-center transition-all hover:scale-105"
                    >
                      {p === 'q' && '♕'}
                      {p === 'r' && '♖'}
                      {p === 'b' && '♗'}
                      {p === 'n' && '♘'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-neutral-400 mt-4">Auto-promotes to Queen in 5s...</p>
              </div>
            </div>
          )}
        </div>

        {/* User Info Bar */}
        <div className="w-full max-w-[560px] flex items-center justify-between p-3 bg-neutral-900 border border-neutral-800 rounded-b-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-700 flex items-center justify-center font-bold text-white">
              {currentUser?.username?.charAt(0).toUpperCase() || 'Y'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">{currentUser?.username || 'You'}</span>
                <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                  {currentUser?.rating || 1200}
                </span>
              </div>
              <span className={`text-xs font-semibold ${isMyTurn ? 'text-emerald-400' : 'text-neutral-500'}`}>
                {isMyTurn ? 'Your Turn' : 'Waiting for opponent...'}
              </span>
            </div>
          </div>
          <div className={`px-4 py-1.5 rounded-lg font-mono font-bold text-lg flex items-center gap-1.5 ${
            (myColor === 'white' ? whiteTime : blackTime) <= 30
              ? 'bg-rose-950/80 text-rose-400 border border-rose-800 animate-pulse'
              : 'bg-neutral-800 text-white'
          }`}>
            <Clock className="w-4 h-4 text-neutral-400" />
            {formatTime(myColor === 'white' ? whiteTime : blackTime)}
          </div>
        </div>

        {/* Game Control Actions */}
        <div className="w-full max-w-[560px] grid grid-cols-4 gap-2 mt-4">
          <button
            onClick={() => {
              if (confirm('Are you sure you want to resign?')) socket.emit('resign', { gameId });
            }}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-neutral-900 hover:bg-rose-950/60 border border-neutral-800 hover:border-rose-800 text-neutral-300 hover:text-rose-300 rounded-lg text-sm font-medium transition-colors"
          >
            <Flag className="w-4 h-4 text-rose-500" />
            Resign
          </button>
          <button
            onClick={() => socket.emit('offerDraw', { gameId })}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg text-sm font-medium transition-colors"
          >
            <Handshake className="w-4 h-4 text-amber-400" />
            Draw
          </button>
          <button
            onClick={() => socket.emit('requestTakeback', { gameId, moveIndex: moveHistory.length - 1 })}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg text-sm font-medium transition-colors"
          >
            <Undo2 className="w-4 h-4 text-sky-400" />
            Takeback
          </button>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center justify-center gap-2 py-2 px-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded-lg text-sm font-medium transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
            Sound
          </button>
        </div>
      </div>

      {/* RIGHT SIDEBAR: Move History, PGN, Chat */}
      <div className="w-full lg:w-96 flex flex-col gap-4">
        {/* Move History Panel */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex-1 flex flex-col min-h-[220px]">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <span className="font-semibold text-white text-sm">Move History</span>
            <span className="text-xs text-neutral-400">{moveHistory.length} moves</span>
          </div>
          <div className="flex-1 overflow-y-auto py-2 space-y-1 font-mono text-sm max-h-48">
            {Array.from({ length: Math.ceil(moveHistory.length / 2) }).map((_, i) => {
              const whiteMove = moveHistory[i * 2];
              const blackMove = moveHistory[i * 2 + 1];
              return (
                <div key={i} className="flex items-center px-2 py-1 rounded hover:bg-neutral-800/60">
                  <span className="w-8 text-neutral-500 text-xs">{i + 1}.</span>
                  <span className="w-24 text-neutral-200 font-semibold">{whiteMove?.san}</span>
                  <span className="w-24 text-neutral-400">{blackMove?.san || ''}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* In-Game Live Chat */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex flex-col h-72">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
            <span className="font-semibold text-white text-sm">Live Match Chat</span>
            <span className="text-[10px] text-neutral-500 font-mono">Commands: /resign /draw</span>
          </div>

          <div className="flex-1 overflow-y-auto py-2 space-y-2 text-xs">
            {messages.map((m, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-neutral-300">{m.username}:</span>
                  <span className="text-neutral-400">{m.message}</span>
                </div>
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-neutral-800">
            <input
              type="text"
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="Send message or /draw..."
              className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* DRAW OFFER MODAL */}
      {drawOfferReceived && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-neutral-900 border border-neutral-700 p-6 rounded-2xl max-w-sm w-full text-center">
            <Handshake className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Draw Offered</h3>
            <p className="text-sm text-neutral-400 mb-6">Your opponent has offered a draw. Would you like to accept?</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  socket.emit('acceptDraw', { gameId });
                  setDrawOfferReceived(false);
                }}
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-sm"
              >
                Accept Draw
              </button>
              <button
                onClick={() => {
                  socket.emit('declineDraw', { gameId });
                  setDrawOfferReceived(false);
                }}
                className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-semibold rounded-lg text-sm"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}

      {/* GAME OVER MODAL */}
      {gameOverData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-neutral-900 border border-neutral-700 p-6 md:p-8 rounded-3xl max-w-md w-full text-center shadow-2xl">
            <Trophy className="w-16 h-16 text-amber-400 mx-auto mb-4 animate-bounce" />
            <h2 className="text-2xl font-black text-white mb-1">
              {gameOverData.winner === 'draw'
                ? 'Game Drawn!'
                : `${gameOverData.winner.toUpperCase()} Wins!`}
            </h2>
            <p className="text-sm text-neutral-400 capitalize mb-6">
              Reason: {gameOverData.reason?.replace('_', ' ')} ({gameOverData.result})
            </p>

            {gameOverData.ratingChanges && (
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 flex justify-around mb-6">
                <div>
                  <span className="text-xs text-neutral-400">White</span>
                  <div className="font-mono font-bold text-white">
                    {gameOverData.ratingChanges.newWhiteRating} ({gameOverData.ratingChanges.whiteDelta >= 0 ? '+' : ''}{gameOverData.ratingChanges.whiteDelta})
                  </div>
                </div>
                <div className="border-r border-neutral-800" />
                <div>
                  <span className="text-xs text-neutral-400">Black</span>
                  <div className="font-mono font-bold text-white">
                    {gameOverData.ratingChanges.newBlackRating} ({gameOverData.ratingChanges.blackDelta >= 0 ? '+' : ''}{gameOverData.ratingChanges.blackDelta})
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (onOpenAnalysis) onOpenAnalysis(game.pgn());
                }}
                className="py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                Review & Analyze
              </button>
              <button
                onClick={onLeaveGame}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-colors"
              >
                Back to Lobby
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
