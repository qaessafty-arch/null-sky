// FILE: frontend/src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  email?: string;
  display_name?: string;
  bio?: string;
  country_code?: string;
  avatar_url?: string;
  elo_rating: number;
  rapid_rating?: number;
  blitz_rating?: number;
  bullet_rating?: number;
  games_played: number;
  games_won: number;
  games_drawn: number;
  games_lost?: number;
  win_streak?: number;
  settings?: Record<string, any>;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('chess_user');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      id: 'demo_user_1',
      username: 'Grandmaster' + Math.floor(100 + Math.random() * 900),
      elo_rating: 1200,
      rapid_rating: 1200,
      blitz_rating: 1200,
      bullet_rating: 1200,
      games_played: 14,
      games_won: 9,
      games_drawn: 2,
      country_code: 'US'
    };
  });

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('chess_token'));
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('chess_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('chess_user');
    }
  }, [user]);

  const login = async (emailOrUsername: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailOrUsername, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      setToken(data.accessToken);
      setUser(data.user);
      localStorage.setItem('chess_token', data.accessToken);
      if (data.refreshToken) localStorage.setItem('chess_refresh_token', data.refreshToken);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setToken(data.accessToken);
      setUser(data.user);
      localStorage.setItem('chess_token', data.accessToken);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    fetch('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    }).catch(() => {});

    setToken(null);
    setUser(null);
    localStorage.removeItem('chess_token');
    localStorage.removeItem('chess_refresh_token');
    localStorage.removeItem('chess_user');
  };

  const updateUser = (updated: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updated } : null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within an AuthProvider');
  return ctx;
};
