import React, { useEffect, useState } from 'react';
import { GameMode, RespectProfile, BoardThemeId, PieceThemeId } from '../types/chess';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { listenToFriendsList } from '../services/friendService';
import { useTranslation } from 'react-i18next';
import { LanguageSelector } from './LanguageSelector';
import { motion, AnimatePresence } from 'motion/react';
import {
  Bot,
  Swords,
  Sparkles,
  Glasses,
  User,
  Globe,
  Users,
  Palette,
  Sun,
  Moon,
  X,
  ChevronRight,
  Shield,
  Crown,
  Layers,
  Settings,
  Bell,
  Trophy,
  Info,
  Terminal
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onOpenFriends: () => void;
  onOpenWorldwideMatch: () => void;
  onOpenLeaderboard: () => void;
  onOpenThemes: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onOpenProfile: () => void;
  currentThemeName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeMode,
  onSelectMode,
  onOpenFriends,
  onOpenWorldwideMatch,
  onOpenLeaderboard,
  onOpenThemes,
  onOpenSettings,
  onOpenAbout,
  onOpenProfile,
  currentThemeName = 'Peshmerga'
}) => {
  const { user, profile } = useAuth();
  const { unreadCount } = useNotification();
  const { t } = useTranslation();
  const [onlineFriendsCount, setOnlineFriendsCount] = useState<number>(0);
  const [totalFriendsCount, setTotalFriendsCount] = useState<number>(0);

  // Subscribe to friends list for live online count
  useEffect(() => {
    if (!profile?.uid) {
      setOnlineFriendsCount(0);
      setTotalFriendsCount(0);
      return;
    }

    const unsub = listenToFriendsList(profile.uid, friends => {
      if (Array.isArray(friends)) {
        setTotalFriendsCount(friends.length);
        const online = friends.filter(f => f && f.isOnline !== false).length;
        setOnlineFriendsCount(online);
      } else {
        setOnlineFriendsCount(0);
        setTotalFriendsCount(0);
      }
    });

    return () => {
      if (unsub) unsub();
    };
  }, [profile?.uid]);

  // Clean formatted online string that NEVER returns "null null"
  const formattedOnlineText = () => {
    if (onlineFriendsCount > 0) {
      return `${onlineFriendsCount} Online`;
    }
    if (totalFriendsCount > 0) {
      return `${totalFriendsCount} ${totalFriendsCount === 1 ? 'Friend' : 'Friends'}`;
    }
    return 'Social';
  };

  const navItems = [
    {
      id: 'ai',
      mode: 'ai' as GameMode,
      label: t('sidebar.playAI'),
      icon: <Bot className="w-5 h-5 text-emerald-400" />,
      action: () => {
        onSelectMode('ai');
        onClose();
      }
    },
    {
      id: 'multiplayer',
      mode: 'multiplayer' as GameMode,
      label: t('sidebar.multiplayer'),
      icon: <Swords className="w-5 h-5 text-amber-400" />,
      action: () => {
        onSelectMode('multiplayer');
        onClose();
      }
    },
    {
      id: 'notifications',
      label: 'Notifications',
      badge: unreadCount > 0 ? `${unreadCount}` : undefined,
      badgeClass: 'bg-[#EF4444] text-white text-[10px] px-1.5 py-0.5 rounded-full font-black shadow-lg',
      icon: <Bell className="w-5 h-5 text-[#F59E0B]" />,
      action: () => {
        // Notifications are in the header, but we could add a notification page later
        onClose();
      }
    },
    {
      id: 'puzzle',
      mode: 'puzzle' as GameMode,
      label: t('sidebar.puzzles'),
      badge: 'DAILY',
      badgeClass: 'bg-gradient-to-r from-amber-400 to-[#F59E0B] text-black font-black text-[10px] px-1.5 py-0.5 rounded shadow-sm',
      icon: <Sparkles className="w-5 h-5 text-yellow-300" />,
      action: () => {
        onSelectMode('puzzle');
        onClose();
      }
    },
    {
      id: 'puzzle_practice',
      label: 'Tactics Trainer',
      icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
      description: 'Practice specific tactical motifs',
      isActive: activeMode === 'puzzle_practice',
      onClick: () => {
        onSelectMode('puzzle_practice');
        onClose();
      }
    },

    {
      id: 'analysis',
      mode: 'analysis' as GameMode,
      label: t('sidebar.analysis'),
      icon: <Glasses className="w-5 h-5 text-sky-400" />,
      action: () => {
        onSelectMode('analysis');
        onClose();
      }
    },
    {
      id: 'profile',
      mode: 'profile_page' as GameMode,
      label: t('sidebar.profile'),
      icon: <User className="w-5 h-5 text-purple-400" />,
      action: () => {
        onOpenProfile();
        onClose();
      }
    },
    {
      id: 'leaderboard',
      label: t('sidebar.worldwide') + ' Leaderboard',
      icon: <Trophy className="w-5 h-5 text-amber-400 animate-pulse" />,
      action: () => {
        onOpenLeaderboard();
        onClose();
      }
    },
    {
      id: 'worldwide',
      label: t('sidebar.worldwide'),
      icon: <Globe className="w-5 h-5 text-blue-400" />,
      action: () => {
        onOpenWorldwideMatch();
        onClose();
      }
    },
    {
      id: 'friends',
      label: t('sidebar.friends'),
      badge: formattedOnlineText(),
      badgeClass: onlineFriendsCount > 0 
        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1'
        : 'bg-[#1F293D] text-slate-300 text-[10px] px-2 py-0.5 rounded-full border border-white/5',
      badgeDot: onlineFriendsCount > 0,
      icon: <Users className="w-5 h-5 text-indigo-400" />,
      action: () => {
        onOpenFriends();
        onClose();
      }
    },
    {
      id: 'about',
      label: 'About Chesskys',
      icon: <Info className="w-5 h-5 text-amber-400" />,
      action: () => {
        onOpenAbout();
        onClose();
      }
    }
  ];

  if (profile?.isDeveloper) {
    navItems.push({
      id: 'dev_panel',
      mode: 'dev_panel' as GameMode,
      label: 'Developer Console',
      icon: <Terminal className="w-5 h-5 text-sky-400" />,
      action: () => {
        onSelectMode('dev_panel' as GameMode);
        onClose();
      }
    });
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile Backdrop Overlay with Smooth Fade */}
          <motion.div
            key="sidebar-backdrop"
            id="sidebar-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Collapsible Left Sidebar Drawer with Smooth Spring Animation */}
          <motion.aside
            key="app-collapsible-sidebar"
            id="app-collapsible-sidebar"
            initial={{ x: document.documentElement.dir === 'rtl' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: document.documentElement.dir === 'rtl' ? '100%' : '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 26, mass: 0.8 }}
            className="fixed top-0 bottom-0 start-0 z-50 w-72 sm:w-80 glass-panel !rounded-none border-e border-white/10 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.8)] flex flex-col justify-between select-none"
            aria-label="Application Main Sidebar"
            style={{ willChange: 'transform' }}
          >
            {/* Sidebar Header & Brand */}
            <div className="p-5 border-b border-[var(--glass-border)] flex items-center justify-between bg-[var(--app-bg)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--glass-bg)] border border-[var(--secondary-accent)]/50 flex items-center justify-center text-xl shadow-inner">
                  <span>☀️</span>
                </div>
                <div>
                  <div className="flex items-center gap-1.5 leading-none">
                    <span className="font-display font-black text-lg text-white tracking-tight">
                      Chesskys
                    </span>
                    <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-[var(--secondary-accent)] text-[var(--app-bg)] shadow-md uppercase tracking-tighter font-mono">
                      PRO
                    </span>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1 uppercase tracking-widest opacity-60">Architect System</p>
                </div>
              </div>

              <button
                id="sidebar-close-btn"
                type="button"
                onClick={onClose}
                className="w-10 h-10 rounded-xl bg-[var(--glass-bg)] text-[var(--text-muted)] hover:text-[var(--secondary-accent)] flex items-center justify-center transition-all interactive-btn border border-[var(--glass-border)] hover:border-[var(--secondary-accent)]/30"
                aria-label="Close Sidebar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sidebar Navigation Items */}
            <div className="flex-1 min-h-0 overflow-y-auto p-4 pb-6 space-y-2 overscroll-contain">
              <div className="px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] opacity-50 font-mono">
                System Main
              </div>

              {navItems.map(item => {
                const isActive = item.mode && activeMode === item.mode;
                return (
                  <button
                    key={item.id}
                    id={`sidebar-nav-${item.id}`}
                    type="button"
                    onClick={item.action}
                    className={`w-full min-h-[52px] px-4 py-3 rounded-2xl flex items-center justify-between text-left transition-all group border ${
                      isActive
                        ? 'bg-[var(--glass-bg)] text-white border-[var(--secondary-accent)] shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                        : 'text-[var(--text-muted)] hover:text-white hover:bg-[var(--glass-bg-hover)] border-transparent hover:border-[var(--glass-border)]'
                    } active:scale-95`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                        isActive ? 'bg-[var(--secondary-accent)] text-[var(--app-bg)]' : 'bg-[var(--app-bg)] text-[var(--text-muted)] border border-[var(--glass-border)] group-hover:border-[var(--text-muted)]/30 group-hover:text-white'
                      }`}>
                        {item.icon}
                      </div>
                      <span className="text-[13px] font-black tracking-tight uppercase tracking-widest">{item.label}</span>
                    </div>

                    {item.badge && (
                      <div className="flex items-center gap-2">
                        {item.badgeDot && <span className="w-2 h-2 bg-[#10B981] rounded-full animate-pulse" />}
                        <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-lg border ${
                          isActive ? 'bg-white/10 text-white border-white/20' : 'bg-[var(--app-bg)] text-[var(--text-muted)] border-[var(--glass-border)]'
                        }`}>
                          {item.badge}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Theme & Settings Controls (Pinned) */}
            <div className="p-4 border-t border-[var(--glass-border)] bg-[var(--glass-panel)] space-y-3">
              {/* Switch Theme Button */}
              <button
                id="sidebar-switch-theme-btn"
                type="button"
                onClick={() => {
                  onOpenThemes();
                  onClose();
                }}
                className="w-full min-h-[52px] px-4 py-3 rounded-2xl bg-[var(--app-bg)] border border-[var(--glass-border)] hover:border-[var(--secondary-accent)]/40 text-white flex items-center justify-between transition-all interactive-btn group shadow-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--glass-bg)] border border-[var(--secondary-accent)]/30 flex items-center justify-center text-[var(--secondary-accent)] group-hover:rotate-12 transition-transform duration-300">
                    <Palette className="w-4 h-4" />
                  </div>
                  <div className="text-left leading-tight">
                    <div className="text-xs font-black text-white flex items-center gap-2">
                      <span>VISUAL CORES</span>
                      <span className="text-[8px] px-1.5 py-0.5 rounded bg-[var(--secondary-accent)] text-[var(--app-bg)] font-black font-mono">
                        NEW
                      </span>
                    </div>
                    <span className="text-[9px] text-[var(--text-muted)] font-mono uppercase tracking-widest opacity-60">
                      Design Presets
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--secondary-accent)]/60 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  id="sidebar-settings-btn"
                  type="button"
                  onClick={() => {
                    onOpenSettings();
                    onClose();
                  }}
                  className="w-full min-h-[44px] rounded-xl bg-[var(--app-bg)] text-[var(--text-muted)] hover:text-[var(--secondary-accent)] flex items-center justify-center gap-2 text-[10px] font-black transition-all interactive-btn border border-[var(--glass-border)] uppercase tracking-widest"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>{t('sidebar.settings')}</span>
                </button>
                <LanguageSelector />
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

