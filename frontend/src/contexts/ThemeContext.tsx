// FILE: frontend/src/contexts/ThemeContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

export type BoardTheme = 'classic' | 'wood' | 'emerald' | 'dark' | 'neon';
export type PieceSet = 'neo' | 'alpha' | 'vintage';

interface ThemeContextType {
  boardTheme: BoardTheme;
  setBoardTheme: (theme: BoardTheme) => void;
  pieceSet: PieceSet;
  setPieceSet: (set: PieceSet) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  boardTheme: 'classic',
  setBoardTheme: () => {},
  pieceSet: 'neo',
  setPieceSet: () => {},
  isDarkMode: true,
  toggleDarkMode: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [boardTheme, setBoardThemeState] = useState<BoardTheme>(() => {
    return (localStorage.getItem('chess_board_theme') as BoardTheme) || 'classic';
  });

  const [pieceSet, setPieceSetState] = useState<PieceSet>(() => {
    return (localStorage.getItem('chess_piece_set') as PieceSet) || 'neo';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);

  const setBoardTheme = (theme: BoardTheme) => {
    setBoardThemeState(theme);
    localStorage.setItem('chess_board_theme', theme);
  };

  const setPieceSet = (set: PieceSet) => {
    setPieceSetState(set);
    localStorage.setItem('chess_piece_set', set);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <ThemeContext.Provider
      value={{
        boardTheme,
        setBoardTheme,
        pieceSet,
        setPieceSet,
        isDarkMode,
        toggleDarkMode
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
