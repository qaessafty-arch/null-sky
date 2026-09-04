// FILE: frontend/src/hooks/useGame.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Chess } from 'chess.js';
import { useSocketContext } from '../contexts/SocketContext';
import { useSound } from './useSound';

export interface GameHookProps {
  gameId: string | null;
  playerColor: 'white' | 'black' | 'spectator';
  initialFen?: string;
  timeControl?: string;
}

export function useGame({ gameId, playerColor, initialFen, timeControl = '10+0' }: GameHookProps) {
  const { socket } = useSocketContext();
  const chessRef = useRef(new Chess(initialFen || undefined));
  const [fen, setFen] = useState(chessRef.current.fen());
  const [turn, setTurn] = useState<'w' | 'b'>(chessRef.current.turn());
  const [isCheck, setIsCheck] = useState(chessRef.current.inCheck());
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);
  const [isDrawOffered, setIsDrawOffered] = useState(false);
  const [isTakebackRequested, setIsTakebackRequested] = useState(false);

  const { playMove, playCapture, playCheck, playGameOver } = useSound(true);

  // Initialize clock from time control
  useEffect(() => {
    const mins = parseInt(timeControl.split('+')[0], 10) || 10;
    setWhiteTime(mins * 60);
    setBlackTime(mins * 60);
  }, [timeControl]);

  // Handle Socket Game Events
  useEffect(() => {
    if (!socket || !gameId) return;

    const onMoveMade = (data: any) => {
      try {
        const move = chessRef.current.move({
          from: data.move.from,
          to: data.move.to,
          promotion: data.move.promotion || 'q'
        });

        if (move) {
          setFen(chessRef.current.fen());
          setTurn(chessRef.current.turn());
          setIsCheck(chessRef.current.inCheck());
          setLastMove({ from: data.move.from, to: data.move.to });
          setHistory(prev => [...prev, data.san || move.san]);

          if (data.captured) {
            playCapture();
          } else if (chessRef.current.inCheck()) {
            playCheck();
          } else {
            playMove();
          }
        }
      } catch (e) {
        // Fallback sync FEN from authoritative server
        if (data.fen) {
          chessRef.current.load(data.fen);
          setFen(data.fen);
          setTurn(chessRef.current.turn());
        }
      }
    };

    const onTimerUpdate = (data: { white: number; black: number }) => {
      setWhiteTime(data.white);
      setBlackTime(data.black);
    };

    const onGameOver = (data: any) => {
      setIsGameOver(true);
      setWinner(data.winner);
      setReason(data.reason);
      playGameOver();
    };

    const onDrawOffered = () => setIsDrawOffered(true);
    const onDrawDeclined = () => setIsDrawOffered(false);
    const onTakebackRequested = () => setIsTakebackRequested(true);
    const onTakebackDeclined = () => setIsTakebackRequested(false);

    socket.on('moveMade', onMoveMade);
    socket.on('timerUpdate', onTimerUpdate);
    socket.on('gameOver', onGameOver);
    socket.on('drawOffered', onDrawOffered);
    socket.on('drawDeclined', onDrawDeclined);
    socket.on('takebackRequested', onTakebackRequested);
    socket.on('takebackDeclined', onTakebackDeclined);

    return () => {
      socket.off('moveMade', onMoveMade);
      socket.off('timerUpdate', onTimerUpdate);
      socket.off('gameOver', onGameOver);
      socket.off('drawOffered', onDrawOffered);
      socket.off('drawDeclined', onDrawDeclined);
      socket.off('takebackRequested', onTakebackRequested);
      socket.off('takebackDeclined', onTakebackDeclined);
    };
  }, [socket, gameId, playMove, playCapture, playCheck, playGameOver]);

  const makeMove = useCallback((from: string, to: string, promotion: string = 'q') => {
    if (isGameOver || !socket || !gameId) return false;

    // Check turn matches playerColor
    const currentTurn = chessRef.current.turn();
    const isMyTurn = (currentTurn === 'w' && playerColor === 'white') || (currentTurn === 'b' && playerColor === 'black');
    if (!isMyTurn && playerColor !== 'spectator') return false;

    try {
      const move = chessRef.current.move({ from, to, promotion });
      if (!move) return false;

      // Optimistic local update
      setFen(chessRef.current.fen());
      setTurn(chessRef.current.turn());
      setIsCheck(chessRef.current.inCheck());
      setLastMove({ from, to });
      setHistory(prev => [...prev, move.san]);

      if (move.captured) playCapture();
      else if (chessRef.current.inCheck()) playCheck();
      else playMove();

      // Emit to server for validation and broadcast
      socket.emit('makeMove', { gameId, from, to, promotion });
      return true;
    } catch {
      return false;
    }
  }, [isGameOver, socket, gameId, playerColor, playCapture, playCheck, playMove]);

  const resign = useCallback(() => {
    if (socket && gameId) socket.emit('resign', { gameId });
  }, [socket, gameId]);

  const offerDraw = useCallback(() => {
    if (socket && gameId) socket.emit('offerDraw', { gameId });
  }, [socket, gameId]);

  const acceptDraw = useCallback(() => {
    if (socket && gameId) {
      socket.emit('acceptDraw', { gameId });
      setIsDrawOffered(false);
    }
  }, [socket, gameId]);

  const declineDraw = useCallback(() => {
    if (socket && gameId) {
      socket.emit('declineDraw', { gameId });
      setIsDrawOffered(false);
    }
  }, [socket, gameId]);

  const requestTakeback = useCallback(() => {
    if (socket && gameId) socket.emit('requestTakeback', { gameId });
  }, [socket, gameId]);

  const acceptTakeback = useCallback(() => {
    if (socket && gameId) {
      socket.emit('acceptTakeback', { gameId });
      setIsTakebackRequested(false);
    }
  }, [socket, gameId]);

  const declineTakeback = useCallback(() => {
    if (socket && gameId) {
      socket.emit('declineTakeback', { gameId });
      setIsTakebackRequested(false);
    }
  }, [socket, gameId]);

  return {
    fen,
    turn,
    isCheck,
    isGameOver,
    winner,
    reason,
    lastMove,
    history,
    whiteTime,
    blackTime,
    isDrawOffered,
    isTakebackRequested,
    makeMove,
    resign,
    offerDraw,
    acceptDraw,
    declineDraw,
    requestTakeback,
    acceptTakeback,
    declineTakeback
  };
}
