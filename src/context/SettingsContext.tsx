import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { AppSettings, CustomBackgroundConfig } from '../types/chess';
import { useAuth } from './AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  getSavedCustomBackground,
  saveCustomBackground,
  applyCustomBackgroundToDOM,
  DEFAULT_CUSTOM_BG,
  getActiveTheme,
  applyThemeToDOM,
} from '../utils/themePresets';

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  customBackground: CustomBackgroundConfig;
  setCustomBackground: (bg: CustomBackgroundConfig) => void;
  resetCustomBackground: () => void;
}

const LOCAL_STORAGE_KEY_SETTINGS = 'chess_settings';

const DEFAULT_SETTINGS: AppSettings = {
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
  showWeather: false,
  customBackground: DEFAULT_CUSTOM_BG,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();

  // Initialize settings from localStorage or defaults
  const [settings, setSettingsState] = useState<AppSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SETTINGS);
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('Could not read settings from localStorage:', e);
    }
    return DEFAULT_SETTINGS;
  });

  // Initialize custom background
  const [customBackground, setCustomBgState] = useState<CustomBackgroundConfig>(() => {
    return getSavedCustomBackground();
  });

  // Apply custom background on initial mount
  useEffect(() => {
    applyCustomBackgroundToDOM(customBackground);
  }, []);

  // Sync settings & background from remote user profile on login if present
  useEffect(() => {
    if (!profile) return;
    const remoteBg = (profile as any).customBackground;
    const remoteSettings = (profile as any).settings;

    if (remoteBg && typeof remoteBg === 'object') {
      setCustomBgState(remoteBg);
      saveCustomBackground(remoteBg);
    }

    if (remoteSettings && typeof remoteSettings === 'object') {
      setSettingsState(prev => {
        const merged = { ...prev, ...remoteSettings };
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(merged));
        } catch {}
        return merged;
      });
    }
  }, [profile?.uid]);

  // Update Settings Handler
  const updateSettings = useCallback(
    (newSettings: Partial<AppSettings>) => {
      setSettingsState(prev => {
        const next = { ...prev, ...newSettings };
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY_SETTINGS, JSON.stringify(next));
        } catch (e) {
          console.warn('Could not save settings to localStorage:', e);
        }

        // Sync to Firestore if authenticated
        if (user?.uid) {
          try {
            const userDocRef = doc(db, 'users', user.uid);
            updateDoc(userDocRef, { settings: next }).catch(() => {});
          } catch {}
        }

        return next;
      });
    },
    [user?.uid]
  );

  // Set Custom Background Handler
  const setCustomBackground = useCallback(
    (newBg: CustomBackgroundConfig) => {
      setCustomBgState(newBg);
      saveCustomBackground(newBg);

      // Keep settings object in sync
      updateSettings({ customBackground: newBg });

      // Sync directly to user profile in Firebase
      if (user?.uid) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          updateDoc(userDocRef, {
            customBackground: newBg,
          }).catch(() => {});
        } catch {}
      }
    },
    [updateSettings, user?.uid]
  );

  // Reset to default
  const resetCustomBackground = useCallback(() => {
    setCustomBackground(DEFAULT_CUSTOM_BG);
    const activeTheme = getActiveTheme();
    applyThemeToDOM(activeTheme);
  }, [setCustomBackground]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        customBackground,
        setCustomBackground,
        resetCustomBackground,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
