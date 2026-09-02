import React from 'react';
import { FriendUser } from '../../types/chess';
import { StatusBadge } from './StatusBadge';
import { Swords, MessageSquare, Trash2, Shield, Award, Calendar, Trophy, Flame } from 'lucide-react';

interface FriendDetailsProps {
  friend: FriendUser | null;
  onChallenge: (friend: FriendUser) => void;
  onChat: (friend: FriendUser) => void;
  onRemove: (friend: FriendUser) => void;
  onBlock: (friend: FriendUser) => void;
}

export const FriendDetails: React.FC<FriendDetailsProps> = ({
  friend,
  onChallenge,
  onChat,
  onRemove,
  onBlock
}) => {
  if (!friend) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center glass-card-subtle rounded-3xl border border-white/5 space-y-3 min-h-[350px]">
        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
          <Shield className="w-7 h-7 text-[#F5C453]/60" />
        </div>
        <h4 className="text-sm font-bold text-white">Select a Friend</h4>
        <p className="text-xs text-[#DFD0B0]/60 max-w-xs">
          Click any tactician from your list on the left to inspect their Elo ratings, alliance rank, and challenge them to a live match.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card-subtle rounded-3xl p-5 border border-white/10 space-y-5 flex flex-col justify-between h-full">
      {/* Profile Overview */}
      <div className="space-y-4">
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            {friend.photoURL ? (
              <img
                src={friend.photoURL}
                alt={friend.displayName}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#F5C453] shadow-lg"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#52673A] to-[#8C2425] border-2 border-[#F5C453] flex items-center justify-center text-xl font-black text-white shadow-lg">
                {friend.displayName ? friend.displayName.charAt(0).toUpperCase() : 'T'}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1">
              <StatusBadge isOnline={friend.isOnline ?? true} size="md" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-base font-black text-white truncate">
              {friend.displayName || 'Tactician'}
            </h3>
            {friend.username && (
              <p className="text-xs font-mono text-[#F5C453]">
                @{friend.username}
              </p>
            )}
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge isOnline={friend.isOnline ?? true} size="sm" showLabel />
              {friend.lastSeen && (
                <span className="text-[10px] text-white/40">
                  • Last seen {friend.lastSeen}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] text-white/50 uppercase font-bold">
              <Award className="w-3 h-3 text-[#F5C453]" />
              <span>Elo Rating</span>
            </div>
            <div className="text-base font-black font-mono text-emerald-400 mt-0.5">
              {friend.elo}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-center">
            <div className="flex items-center justify-center gap-1 text-[10px] text-white/50 uppercase font-bold">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>Rank Title</span>
            </div>
            <div className="text-xs font-bold text-white mt-1 truncate">
              {friend.rankBadge} {friend.honorRank || 'Peshmerga'}
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 text-center col-span-2 sm:col-span-1">
            <div className="flex items-center justify-center gap-1 text-[10px] text-white/50 uppercase font-bold">
              <Flame className="w-3 h-3 text-rose-400" />
              <span>Respect</span>
            </div>
            <div className="text-base font-black font-mono text-[#F5C453] mt-0.5">
              {friend.respectPoints || 100}
            </div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={() => onChallenge(friend)}
            className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#8C2425] to-[#B91C1C] hover:brightness-110 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-lg border border-[#F5C453]/40 transition-all cursor-pointer active:scale-95"
          >
            <Swords className="w-4 h-4 text-[#F5C453]" />
            <span>Challenge Match</span>
          </button>

          <button
            type="button"
            onClick={() => onChat(friend)}
            className="py-2.5 px-3 rounded-xl bg-[#52673A] hover:bg-[#52673A]/80 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-lg border border-white/10 transition-all cursor-pointer active:scale-95"
          >
            <MessageSquare className="w-4 h-4 text-blue-300" />
            <span>Open Chat</span>
          </button>
        </div>
      </div>

      {/* Danger Zone Options */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
        <button
          type="button"
          onClick={() => onRemove(friend)}
          className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove Friend</span>
        </button>

        <button
          type="button"
          onClick={() => onBlock(friend)}
          className="text-white/40 hover:text-rose-400 flex items-center gap-1 text-[11px] font-bold transition-colors cursor-pointer"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Block User</span>
        </button>
      </div>
    </div>
  );
};
