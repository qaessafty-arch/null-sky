import React, { useState, useEffect } from 'react';
import { GameMode, RespectProfile, Notification } from '../types/chess';
import { Menu, X, User, Crown, Shield, Bell, Swords, UserPlus, Trophy, Info, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';
import { useGlassFloat } from '../hooks/useGlassFloat';
import { formatDistanceToNow } from 'date-fns';
import { KurdishFlag } from './KurdishFlag';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen?: boolean;
  onOpenProfile: () => void;
  onOpenLogin?: () => void;
  respectProfile?: RespectProfile;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  isSidebarOpen = false,
  onOpenProfile,
  onOpenLogin,
  respectProfile
}) => {
  const [latency, setLatency] = useState<number>(18);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLatency(prev => {
        const variation = Math.floor(Math.random() * 5) - 2;
        let newLatency = prev + variation;
        if (newLatency < 12) newLatency = 12;
        if (newLatency > 85) newLatency = 85;
        return isNaN(newLatency) ? 18 : newLatency;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const { user, profile } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotification();
  const floatVariants = useGlassFloat(0.8);

  const currentRespect = profile?.respectPoints ?? respectProfile?.respectPoints ?? 100;
  const currentElo = profile?.elo ?? respectProfile?.elo ?? 1200;
  const userDisplayName = profile?.displayName || user?.displayName?.split(' ')[0] || (user ? 'Grandmaster' : 'Guest');

  return (
    <header
      id="top-header-bar"
      className="w-full h-14 glass-panel !rounded-none border-b border-white/10 backdrop-blur-3xl sticky top-0 z-30 shadow-2xl transition-all flex items-center justify-between px-4 sm:px-8 select-none"
    >
      {/* 1. Far Left: Hamburger Toggle Button */}
      <div className="flex items-center gap-4">
        <button
          id="header-hamburger-toggle"
          type="button"
          onClick={onToggleSidebar}
          className="w-10 h-10 glass-button text-[var(--secondary-accent)] border-white/5 interactive-btn shadow-lg"
          aria-label={isSidebarOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* 2. Brand Logo */}
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-7 rounded shadow-xl overflow-hidden group-hover:scale-110 transition-transform duration-300">
            <KurdishFlag />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-xl tracking-tight text-white drop-shadow-md">
              Chesskys
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[var(--secondary-accent)] text-[var(--app-bg)] shadow-lg uppercase tracking-tighter font-mono">
              PRO
            </span>
          </div>
        </div>
      </div>

      {/* 2. Center: Live Match Evaluation Bar */}
      <div className="hidden md:flex flex-col items-center justify-center flex-1 mx-8" dir="ltr">
        <div className="w-full max-w-sm flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5">
          <span>Engine Analysis</span>
          <span className="text-[var(--secondary-accent)] font-black">+1.2</span>
        </div>
        <div className="w-full max-w-sm h-1.5 bg-[var(--app-bg)] rounded-full border border-[var(--glass-border)] overflow-hidden flex relative shadow-inner">
          <div className="h-full bg-white w-[55%] transition-all duration-700 ease-out shadow-[0_0_15px_rgba(255,255,255,0.4)] z-10" />
          <div className="h-full bg-[#EF4444] flex-1 z-0 opacity-80" />
        </div>
      </div>

      {/* 3. Far Right: User Profile Avatar & Stats */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Connection Status - Hidden on mobile */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] leading-none">Global Rank</span>
          <span className="text-[11px] font-mono font-black text-white mt-1">
            {currentElo} <span className="text-[var(--secondary-accent)]">ELO</span>
          </span>
        </div>

        {/* Notification Bell */}
        {user && (
          <div className="relative">
            <button
              id="header-notif-bell-btn"
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`w-10 h-10 glass-button flex items-center justify-center hover:border-[var(--secondary-accent)]/30 transition-all relative interactive-btn ${isNotifOpen ? 'text-[var(--secondary-accent)] border-[var(--secondary-accent)]/30' : 'text-[var(--text-muted)]'}`}
              aria-label="View Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[var(--app-bg)] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isNotifOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={["visible", "float"]}
                    variants={{
                      visible: { opacity: 1, y: 0, scale: 1 },
                      ...floatVariants
                    }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute right-0 mt-3 w-[320px] sm:w-[380px] bg-[var(--glass-panel)] border border-[var(--glass-border)] backdrop-blur-xl rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-[var(--glass-border)] flex items-center justify-between bg-[var(--app-bg)]/50">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Inbox</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-[var(--secondary-accent)] text-[var(--app-bg)] text-[9px] font-black shadow-sm">{unreadCount}</span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => markAllAsRead()}
                          className="text-[10px] font-black text-[var(--secondary-accent)] hover:text-white uppercase tracking-tighter transition-colors"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    {/* Scrollable List */}
                    <div className="max-h-[420px] overflow-y-auto no-scrollbar py-1">
                      {notifications.length > 0 ? (
                        notifications.map(notif => (
                          <NotificationListItem 
                            key={notif.id} 
                            notification={notif} 
                            onRead={() => markAsRead(notif.id)}
                            onDelete={() => deleteNotification(notif.id)}
                          />
                        ))
                      ) : (
                        <div className="p-12 flex flex-col items-center justify-center text-center gap-4">
                          <div className="w-16 h-16 rounded-3xl bg-[var(--app-bg)] border border-[var(--glass-border)] flex items-center justify-center text-3xl shadow-inner">
                            ☀️
                          </div>
                          <div>
                            <p className="text-sm font-black text-white uppercase tracking-tight">System Status: All Clear</p>
                            <p className="text-[10px] text-[var(--text-muted)] font-mono mt-1 opacity-60">No pending notifications in matrix</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                  {/* Backdrop */}
                  <div className="fixed inset-0 z-40 bg-black/5" onClick={() => setIsNotifOpen(false)} />
                </>
              )}
            </AnimatePresence>
          </div>
        )}

        <button
          id="header-user-avatar-btn"
          type="button"
          onClick={user ? onOpenProfile : (onOpenLogin || onOpenProfile)}
          className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl bg-[var(--glass-bg)] border border-[var(--glass-border)] interactive-btn hover:border-[var(--secondary-accent)]/40 group"
        >
          <div className="relative">
            {profile?.photoURL || user?.photoURL ? (
              <img
                src={profile?.photoURL || user?.photoURL || ''}
                alt={userDisplayName}
                className="w-9 h-9 rounded-xl object-cover ring-1 ring-[var(--glass-border)] group-hover:ring-[var(--secondary-accent)] transition-all"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[var(--app-bg)] flex items-center justify-center text-[var(--secondary-accent)] border border-[var(--glass-border)] group-hover:border-[var(--secondary-accent)] transition-all">
                {user ? <span className="text-xs font-black">{userDisplayName.charAt(0).toUpperCase()}</span> : <User className="w-5 h-5" />}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#10B981] rounded-full border-2 border-[var(--app-bg)] shadow-sm" />
          </div>

          <div className="hidden lg:flex flex-col items-start leading-tight">
            <span className="text-[10px] font-black text-white uppercase tracking-tighter truncate max-w-[80px]">
              {userDisplayName}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[9px] font-black uppercase tracking-widest ${latency < 40 ? 'text-[#10B981]' : 'text-[var(--secondary-accent)]'}`}>
                {latency}ms
              </span>
              <Shield className="w-2.5 h-2.5 text-[var(--secondary-accent)]" />
            </div>
          </div>
        </button>
      </div>
    </header>
  );
};

const NotificationListItem: React.FC<{ 
  notification: Notification; 
  onRead: () => void;
  onDelete: () => void;
}> = ({ notification, onRead, onDelete }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'challenge': return <Swords className="w-4 h-4 text-amber-400" />;
      case 'friend_request': return <UserPlus className="w-4 h-4 text-emerald-400" />;
      case 'achievement': return <Trophy className="w-4 h-4 text-yellow-400" />;
      default: return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div 
      className={`p-4 border-b border-[var(--glass-border)] hover:bg-white/5 transition-colors group cursor-pointer relative ${!notification.isRead ? 'bg-[var(--secondary-accent)]/5' : ''}`}
      onClick={onRead}
    >
      {!notification.isRead && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--secondary-accent)]" />
      )}
      <div className="flex gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
          !notification.isRead ? 'bg-[var(--glass-bg)] border-[var(--secondary-accent)]/30' : 'bg-[var(--app-bg)] border-[var(--glass-border)]'
        }`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black text-white uppercase tracking-tight truncate">{notification.title}</span>
            <span className="text-[9px] font-mono text-[var(--text-muted)] shrink-0">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-[11px] text-[var(--text-muted)] leading-normal mt-1 line-clamp-2">{notification.message}</p>
          
          {!notification.isRead && (
            <div className="flex items-center gap-2 mt-3">
              <button 
                className="px-3 py-1.5 rounded-lg bg-[var(--secondary-accent)] text-[var(--app-bg)] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
              >
                View Action
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onRead();
                }}
                className="px-3 py-1.5 rounded-lg bg-[var(--glass-border)] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[var(--glass-bg-hover)] transition-all"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="opacity-0 group-hover:opacity-100 p-1 text-[var(--text-muted)] hover:text-red-400 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
