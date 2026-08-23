import React from 'react';
import { GameMode, RespectProfile } from '../types/chess';
import { Bot, Users, Sparkles, Compass, Settings, Crown, Plus, Palette, Trophy, Shield, User, Globe, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  activeMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onOpenSettings: () => void;
  onOpenThemes?: () => void;
  onOpenLeaderboard?: () => void;
  onOpenProfile?: () => void;
  onOpenFriends?: () => void;
  onOpenWorldwideMatch?: () => void;
  onNewGame: () => void;
  respectProfile?: RespectProfile;
}

export const Header: React.FC<HeaderProps> = ({
  activeMode,
  onSelectMode,
  onOpenSettings,
  onOpenThemes,
  onOpenLeaderboard,
  onOpenProfile,
  onOpenFriends,
  onOpenWorldwideMatch,
  onNewGame,
  respectProfile
}) => {
  const { user, profile } = useAuth();
  const navItems: { mode: GameMode; label: string; icon: React.ReactNode }[] = [
    { mode: 'ai', label: 'Play AI', icon: <Bot className="w-4 h-4" /> },
    { mode: 'pass_and_play', label: 'Pass & Play', icon: <Users className="w-4 h-4" /> },
    { mode: 'puzzle', label: 'Tactics', icon: <Sparkles className="w-4 h-4" /> },
    { mode: 'analysis', label: 'Analysis', icon: <Compass className="w-4 h-4" /> }
  ];

  return (
    <header className="w-full bg-[#10140e]/95 border-b border-[#F5C453]/25 backdrop-blur-2xl sticky top-0 z-40 px-3 sm:px-6 py-2.5 shadow-xl shadow-black/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2.5">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          {/* Peshmerga Sun Crest */}
          <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#8C2425] via-[#52673A] to-[#F5C453] p-0.5 shadow-lg shadow-[#F5C453]/20 border border-[#F5C453]/40 flex-shrink-0">
            <div className="w-full h-full bg-[#161c12] rounded-[14px] flex items-center justify-center text-lg select-none">
              <span title="Kurdish 21-Ray Sun of Glory">☀️</span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 leading-none">
              <span className="font-heading font-black text-[#FDFCF7] text-base sm:text-lg tracking-tight">
                Chesskys
              </span>
              {/* Jamadani Crimson Red PRO Badge */}
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#8C2425] text-white border border-[#F5C453]/40 shadow-sm">
                PRO
              </span>
            </div>
            <span className="text-[11px] text-[#DFD0B0]/70 font-medium hidden sm:inline">
              Peshmerga Edition
            </span>
          </div>
        </div>

        {/* Mode Navigation Tabs */}
        <nav className="flex items-center gap-1 bg-[#1a2315]/80 p-1.5 rounded-2xl border border-[#F5C453]/20 backdrop-blur-md">
          {navItems.map(item => {
            const isActive = activeMode === item.mode;
            return (
              <button
                key={item.mode}
                onClick={() => onSelectMode(item.mode)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold font-ui transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#52673A] text-white shadow-md shadow-[#52673A]/40 border border-[#F5C453]/50'
                    : 'text-[#DFD0B0]/70 hover:text-white hover:bg-white/[0.06]'
                }`}
              >
                {item.icon}
                <span className="hidden md:inline">{item.label}</span>
              </button>
            );
          })}

          {/* Worldwide Quick Match Nav Button */}
          {onOpenWorldwideMatch && (
            <button
              onClick={onOpenWorldwideMatch}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl text-xs font-black font-ui transition-all cursor-pointer ${
                activeMode === 'online_match'
                  ? 'bg-gradient-to-r from-[#52673A] to-[#8C2425] text-white border border-[#F5C453] shadow-md shadow-[#F5C453]/20'
                  : 'bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/50 border border-emerald-500/30'
              }`}
              title="Worldwide Online Quick Match (Instant Pairing)"
            >
              <Globe className="w-3.5 h-3.5 text-[#F5C453] animate-pulse" />
              <span className="hidden sm:inline">Worldwide</span>
              <span className="inline sm:hidden">Online</span>
            </button>
          )}
        </nav>

        {/* Actions, Respect Pill, Friends, Profile, Themes & Settings */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Quick Worldwide Match Pill Button (Highlighted on Mobile/Desktop) */}
          {onOpenWorldwideMatch && (
            <button
              onClick={onOpenWorldwideMatch}
              className="hidden lg:flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-700/80 to-[#52673A] hover:brightness-110 border border-emerald-400/50 text-white text-xs font-black transition-all hover:scale-105 shadow-md shadow-emerald-500/15 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-[#F5C453]" />
              <span>Quick Match</span>
            </button>
          )}

          {/* Friends & Social Panel Button */}
          {onOpenFriends && (
            <button
              onClick={onOpenFriends}
              className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r from-[#52673A]/80 to-[#8C2425]/80 hover:brightness-110 border border-[#F5C453]/40 text-white text-xs font-black transition-all hover:scale-[1.02] shadow-sm cursor-pointer"
              title="Open Friends & Social Panel"
            >
              <Users className="w-3.5 h-3.5 text-[#F5C453]" />
              <span className="hidden sm:inline">Friends</span>
            </button>
          )}

          {/* Respect Honor Pill */}
          <button
            onClick={onOpenLeaderboard}
            className="flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r from-[#52673A]/30 to-[#8C2425]/30 hover:from-[#52673A]/50 hover:to-[#8C2425]/50 border border-[#F5C453]/40 text-[#F5C453] text-xs font-black transition-all hover:scale-[1.02] shadow-sm shadow-[#F5C453]/10 cursor-pointer"
            title="Click to view Peshmerga Honor & Grandmaster Leaderboard"
          >
            <span className="text-sm select-none">✊</span>
            <span>{profile?.respectPoints ?? respectProfile?.respectPoints ?? 100}</span>
            <span className="hidden md:inline text-[10px] text-[#DFD0B0]/80 uppercase font-semibold">Respect</span>
          </button>

          {/* Profile / Sign-in button */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1.5 py-1.5 px-2 sm:px-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.10] border border-[#F5C453]/30 text-white transition-all shadow-sm cursor-pointer"
            title={user ? `Signed in as ${profile?.displayName || user.displayName || user.email}` : 'Sign in with Google / Profile'}
          >
            {(profile?.photoURL || user?.photoURL) ? (
              <img
                src={profile?.photoURL || user?.photoURL}
                alt={profile?.displayName || user?.displayName || 'Profile'}
                className="w-5 h-5 rounded-full object-cover border border-[#F5C453]"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="w-4 h-4 text-[#F5C453]" />
            )}
            <span className="text-xs font-bold hidden xl:inline max-w-[85px] truncate text-[#DFD0B0]">
              {user ? (profile?.displayName || user.displayName?.split(' ')[0] || 'Warrior') : 'Sign In'}
            </span>
          </button>

          {/* New Match Button */}
          <button
            onClick={onNewGame}
            className="hidden sm:flex items-center gap-1.5 py-2 px-3 rounded-xl bg-[#52673A]/90 hover:bg-[#52673A] border border-[#F5C453]/40 text-white font-bold text-xs transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#F5C453]" />
            <span>New Match</span>
          </button>

          {/* Settings & Themes */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 py-1.5 px-2.5 rounded-xl bg-[#52673A]/40 hover:bg-[#52673A]/80 text-[#FDFCF7] border border-[#F5C453]/40 transition-all shadow-sm text-xs font-bold hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            title="Settings, Themes, Board & Piece Sets"
          >
            <Settings className="w-3.5 h-3.5 text-[#F5C453]" />
            <span className="hidden lg:inline">Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};

