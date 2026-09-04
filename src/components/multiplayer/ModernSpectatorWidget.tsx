import React, { useState } from 'react';
import { Eye, Users, Heart, Bell, Check, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Spectator {
  id: string;
  name: string;
  avatar: string;
}

interface ModernSpectatorWidgetProps {
  initialCount?: number;
  playerName: string;
  onOpenSpectatorChat?: () => void;
}

const SAMPLE_SPECTATORS: Spectator[] = [
  { id: '1', name: 'GrandmasterAlex', avatar: '♔' },
  { id: '2', name: 'ChessTactician', avatar: '♕' },
  { id: '3', name: 'PawnStormer', avatar: '♘' },
  { id: '4', name: 'RookMaster', avatar: '♖' }
];

export const ModernSpectatorWidget: React.FC<ModernSpectatorWidgetProps> = ({
  initialCount = 6,
  playerName,
  onOpenSpectatorChat
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [spectatorCount] = useState(initialCount);

  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-lg flex-wrap gap-2.5">
      {/* Live Watching Indicator */}
      <div className="flex items-center gap-2.5">
        <div className="relative flex items-center justify-center">
          <span className="absolute w-6 h-6 rounded-full bg-emerald-500/20 animate-ping" />
          <div className="w-6 h-6 rounded-full bg-emerald-500/30 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
            <Eye className="w-3.5 h-3.5 animate-pulse" />
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-black text-white font-mono">{spectatorCount}</span>
          <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">Watching</span>
        </div>

        {/* Spectator Avatar Circles */}
        <div className="flex -space-x-1.5 overflow-hidden ml-1">
          {SAMPLE_SPECTATORS.slice(0, 3).map(s => (
            <div
              key={s.id}
              className="w-5 h-5 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center text-[10px] shadow-sm text-white/80"
              title={s.name}
            >
              {s.avatar}
            </div>
          ))}
          {spectatorCount > 3 && (
            <div className="w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[8px] font-mono font-bold text-white/70">
              +{spectatorCount - 3}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons: Follow Player & Spectator Chat */}
      <div className="flex items-center gap-1.5 ml-auto">
        {onOpenSpectatorChat && (
          <button
            onClick={onOpenSpectatorChat}
            className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-[10px] font-bold flex items-center gap-1 transition-all"
            title="Open Spectator Chat"
          >
            <MessageSquare className="w-3 h-3 text-cyan-400" />
            <span>Chat</span>
          </button>
        )}

        <button
          onClick={() => setIsFollowing(!isFollowing)}
          className={`px-3 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
            isFollowing
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'bg-gradient-to-r from-[var(--primary-accent)] to-[var(--secondary-accent)] text-white hover:brightness-110 shadow-md'
          }`}
        >
          {isFollowing ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span>Subscribed</span>
            </>
          ) : (
            <>
              <Bell className="w-3 h-3" />
              <span>Follow</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
