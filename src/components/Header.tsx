import React, { useState, useEffect } from 'react';
import { GameMode, RespectProfile, Notification } from '../types/chess';
import { Menu, X, User, Crown, Shield, Bell, Swords, UserPlus, Trophy, Info, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';

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
          className="w-10 h-10 glass-button text-[#F59E0B] border-white/5 interactive-btn shadow-lg"
          aria-label={isSidebarOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        {/* 2. Brand Logo */}
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#111827] to-[#0B0F19] border border-[#F59E0B]/40 flex items-center justify-center text-sm shadow-xl group-hover:border-[#F59E0B] transition-colors">
            <span className="animate-pulse">☀️</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display font-black text-xl tracking-tight text-white drop-shadow-md">
              Chesskys
            </span>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-[#F59E0B] text-[#0B0F19] shadow-lg uppercase tracking-tighter font-mono">
              PRO
            </span>
          </div>
        </div>
      </div>

      {/* 2. Center: Live Match Evaluation Bar */}
      <div className="hidden md:flex flex-col items-center justify-center flex-1 mx-8" dir="ltr">
        <div className="w-full max-w-sm flex items-center justify-between text-[10px] font-mono font-bold uppercase tracking-widest text-[#94A3B8] mb-1.5">
          <span>Engine Analysis</span>
          <span className="text-[#F59E0B] font-black">+1.2</span>
        </div>
        <div className="w-full max-w-sm h-1.5 bg-[#0B0F19] rounded-full border border-[#1F293D] overflow-hidden flex relative shadow-inner">
          <div className="h-full bg-white w-[55%] transition-all duration-700 ease-out shadow-[0_0_15px_rgba(255,255,255,0.4)] z-10" />
          <div className="h-full bg-[#EF4444] flex-1 z-0 opacity-80" />
        </div>
      </div>

      {/* 3. Far Right: User Profile Avatar & Stats */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Connection Status - Hidden on mobile */}
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-[9px] font-black text-[#94A3B8] uppercase tracking-[0.2em] leading-none">Global Rank</span>
          <span className="text-[11px] font-mono font-black text-white mt-1">
            {currentElo} <span className="text-[#F59E0B]">ELO</span>
          </span>
        </div>

        {/* Notification Bell */}
        {user && (
          <div className="relative">
            <button
              id="header-notif-bell-btn"
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`w-10 h-10 glass-button flex items-center justify-center hover:border-[#F59E0B]/30 transition-all relative interactive-btn ${isNotifOpen ? 'text-[#F59E0B] border-[#F59E0B]/30' : 'text-[#94A3B8]'}`}
              aria-label="View Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-[#0B0F19] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <AnimatePresence>
              {isNotifOpen && (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    className="absolute right-0 mt-3 w-[320px] sm:w-[380px] glass-panel rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden"
                  >
                    {/* Header */}
                    <div className="p-4 border-b border-[#1F293D] flex items-center justify-between bg-[#0B0F19]/50">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black text-white uppercase tracking-widest">Inbox</span>
                        {unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-[#F59E0B] text-[#0B0F19] text-[9px] font-black shadow-sm">{unreadCount}</span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button 
                          onClick={() => markAllAsRead()}
                          className="text-[10px] font-black text-[#F59E0B] hover:text-white uppercase tracking-tighter transition-colors"
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
                          <div className="w-16 h-16 rounded-3xl bg-[#0B0F19] border border-[#1F293D] flex items-center justify-center text-3xl shadow-inner">
                            ☀️
                          </div>
                          <div>
                            <p className="text-sm font-black text-white uppercase tracking-tight">System Status: All Clear</p>
                            <p className="text-[10px] text-[#94A3B8] font-mono mt-1 opacity-60">No pending notifications in matrix</p>
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
          className="flex items-center gap-3 p-1.5 pr-4 rounded-2xl bg-[#111827] border border-[#1F293D] interactive-btn hover:border-[#F59E0B]/40 group"
        >
          <div className="relative">
            {profile?.photoURL || user?.photoURL ? (
              <img
                src={profile?.photoURL || user?.photoURL || ''}
                alt={userDisplayName}
                className="w-9 h-9 rounded-xl object-cover ring-1 ring-[#1F293D] group-hover:ring-[#F59E0B] transition-all"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-9 h-9 rounded-xl bg-[#0B0F19] flex items-center justify-center text-[#F59E0B] border border-[#1F293D] group-hover:border-[#F59E0B] transition-all">
                {user ? <span className="text-xs font-black">{userDisplayName.charAt(0).toUpperCase()}</span> : <User className="w-5 h-5" />}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-[#10B981] rounded-full border-2 border-[#111827] shadow-sm" />
          </div>

          <div className="hidden lg:flex flex-col items-start leading-tight">
            <span className="text-[10px] font-black text-white uppercase tracking-tighter truncate max-w-[80px]">
              {userDisplayName}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`text-[9px] font-black uppercase tracking-widest ${latency < 40 ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
                {latency}ms
              </span>
              <Shield className="w-2.5 h-2.5 text-[#F59E0B]" />
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
      className={`p-4 border-b border-[#1F293D] hover:bg-white/5 transition-colors group cursor-pointer relative ${!notification.isRead ? 'bg-[#F59E0B]/5' : ''}`}
      onClick={onRead}
    >
      {!notification.isRead && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#F59E0B]" />
      )}
      <div className="flex gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
          !notification.isRead ? 'bg-[#111827] border-[#F59E0B]/30' : 'bg-[#0B0F19] border-[#1F293D]'
        }`}>
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-black text-white uppercase tracking-tight truncate">{notification.title}</span>
            <span className="text-[9px] font-mono text-[#94A3B8] shrink-0">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-[11px] text-[#94A3B8] leading-normal mt-1 line-clamp-2">{notification.message}</p>
          
          {!notification.isRead && (
            <div className="flex items-center gap-2 mt-3">
              <button 
                className="px-3 py-1.5 rounded-lg bg-[#F59E0B] text-[#0B0F19] text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
              >
                View Action
              </button>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onRead();
                }}
                className="px-3 py-1.5 rounded-lg bg-[#1F293D] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#374151] transition-all"
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
          className="opacity-0 group-hover:opacity-100 p-1 text-[#94A3B8] hover:text-red-400 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
