// FILE: frontend/src/contexts/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthContext } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  activeSpectators: number;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  activeSpectators: 0
});

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [activeSpectators, setActiveSpectators] = useState(0);
  const { token, user } = useAuthContext();

  useEffect(() => {
    const s = io(window.location.origin, {
      auth: { token: token || undefined, username: user?.username },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    s.on('connect', () => {
      setIsConnected(true);
      if (token) {
        s.emit('authenticate', { token });
      }
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('spectatorCount', ({ count }) => {
      setActiveSpectators(count);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [token, user?.username]);

  return (
    <SocketContext.Provider value={{ socket, isConnected, activeSpectators }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocketContext = () => useContext(SocketContext);
