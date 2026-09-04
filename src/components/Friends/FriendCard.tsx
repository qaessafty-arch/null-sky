import React from 'react';
import { FriendUser } from '../../types/chess';
import { StatusBadge } from './StatusBadge';
import { MessageSquare, Swords, Trash2, Award } from 'lucide-react';

interface FriendCardProps {
  friend: FriendUser;
  isSelected?: boolean;
  onSelect: (friend: FriendUser) => void;
  onChallenge: (friend: FriendUser) => void;
  onChat: (friend: FriendUser) => void;
  onRemove: (friend: FriendUser) => void;
}

export const FriendCard: React.FC<FriendCardProps> = ({
  friend,
  isSelected = false,
  onSelect,
  onChallenge,
  onChat,
  onRemove
}) => {
  return (
    <div
      onClick={() => onSelect(friend)}
      className={`p-3 rounded-2xl cursor-pointer flex items-center justify-between gap-3 transition-all ${
        isSelected
          ? 'glass-card-selected'
          : 'glass-card-subtle'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="relative shrink-0">
          {friend.photoURL ? (
            <img
              src={friend.photoURL}
              alt={friend.displayName}
              className="w-10 h-10 rounded-full object-cover border-2 border-[#F5C453]"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#52673A] to-[#8C2425] border-2 border-[#F5C453] flex items-center justify-center text-sm font-black text-white shadow-md">
              {friend.displayName ? friend.displayName.charAt(0).toUpperCase() : 'T'}
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5">
            <StatusBadge isOnline={friend.isOnline ?? true} size="sm" />
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-xs font-black text-white truncate max-w-[120px] sm:max-w-[150px]">
              {friend.displayName || 'Tactician'}
            </span>
            {friend.username && (
              <span className="text-[10px] font-mono text-[#F5C453]/80 shrink-0">
                @{friend.username}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#DFD0B0]/70">
            <span className="flex items-center gap-0.5">
              <Award className="w-3 h-3 text-[#F5C453]" />
              {friend.rankBadge} {friend.honorRank || 'Peshmerga'}
            </span>
            <span>•</span>
            <span className="font-mono text-emerald-400 font-bold">{friend.elo} Elo</span>
          </div>
        </div>
      </div>

      {/* Quick Action Icons */}
      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onChat(friend)}
          className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all cursor-pointer"
          title="Direct Chat"
        >
          <MessageSquare className="w-3.5 h-3.5 text-blue-400" />
        </button>

        <button
          type="button"
          onClick={() => onChallenge(friend)}
          className="p-1.5 rounded-xl bg-[#8C2425]/60 hover:bg-[#8C2425] text-white border border-[#F5C453]/30 transition-all cursor-pointer"
          title="Challenge Match"
        >
          <Swords className="w-3.5 h-3.5 text-[#F5C453]" />
        </button>

        <button
          type="button"
          onClick={() => onRemove(friend)}
          className="p-1.5 rounded-xl hover:bg-rose-500/20 text-white/30 hover:text-rose-400 transition-all cursor-pointer"
          title="Remove Friend"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
