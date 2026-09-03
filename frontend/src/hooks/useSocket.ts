// FILE: frontend/src/hooks/useSocket.ts
import { useEffect, useRef } from 'react';
import { useSocketContext } from '../contexts/SocketContext';

export function useSocketEvent<T = any>(event: string, handler: (data: T) => void) {
  const { socket } = useSocketContext();
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!socket) return;
    const listener = (data: T) => savedHandler.current(data);
    socket.on(event, listener);
    return () => {
      socket.off(event, listener);
    };
  }, [socket, event]);
}

export function useSocket() {
  return useSocketContext();
}
