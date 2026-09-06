import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, UserPlus, Check, Sparkles, Swords, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRoom } from '../../hooks/useRoom';
import { listenToFriendsList } from '../../services/friendService';

interface FriendItem {
  uid: string;
  displayName: string;
  photoURL?: string;
  elo?: number;
  isOnline?: boolean;
}

interface InviteFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InviteFriendModal: React.FC<InviteFriendModalProps> = ({ isOpen, onClose }) => {
  const { profile } = useAuth();
  const room = useRoom();
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [search, setSearch] = useState('');
  const [invitedUids, setInvitedUids] = useState<Set<string>>(new Set());
  const [invitingUid, setInvitingUid] = useState<string | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    const unsub = listenToFriendsList(profile.uid, (list) => {
      if (Array.isArray(list)) {
        // Sort online friends first, then alphabetically
        const sorted = [...list].sort((a, b) => {
          const aOn = a.isOnline !== false ? 1 : 0;
          const bOn = b.isOnline !== false ? 1 : 0;
          if (aOn !== bOn) return bOn - aOn;
          return (a.displayName || '').localeCompare(b.displayName || '');
        });
        setFriends(sorted);
      }
    });
    return () => unsub?.();
  }, [profile?.uid]);

  const handleInvite = async (friend: FriendItem) => {
    if (!room.currentRoom || invitedUids.has(friend.uid)) return;
    setInvitingUid(friend.uid);
    try {
      await room.inviteFriend(friend.uid, friend.displayName, friend.photoURL);
      if (room.inviteFriendNotify) {
        await room.inviteFriendNotify(friend.uid, friend.displayName, room.currentRoom.roomCode);
      }
      setInvitedUids((prev) => new Set(prev).add(friend.uid));
    } catch (e) {
      console.error('Failed to invite friend:', e);
    } finally {
      setInvitingUid(null);
    }
  };

  const filteredFriends = friends.filter((f) =>
    (f.displayName || '').toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md room-glass-card p-6 flex flex-col gap-4 max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#F5C453]" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Invite Allies
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Room Info Tag */}
        {room.currentRoom && (
          <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-black/40 border border-white/5 font-mono text-white/70">
            <span>Room Code: <strong className="text-[#F5C453]">{room.currentRoom.roomCode}</strong></span>
            <span>{room.currentRoom.settings.timeControlName}</span>
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search friends by name..."
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder:text-white/40 outline-none focus:border-[#F5C453]/50 transition-all"
          />
        </div>

        {/* Friends List */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-[220px] max-h-[350px] pr-1">
          {friends.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-white/40 gap-2">
              <UserPlus className="w-8 h-8 opacity-40 text-[#F5C453]" />
              <p className="text-xs">No friends found on your roster yet.</p>
              <p className="text-[11px] text-white/30">Add friends via the Friends tab to challenge them directly.</p>
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-xs text-white/40">
              No friend matched "{search}"
            </div>
          ) : (
            filteredFriends.map((friend) => {
              const isInvited = invitedUids.has(friend.uid);
              const isInviting = invitingUid === friend.uid;
              const isOnline = friend.isOnline !== false;

              return (
                <div
                  key={friend.uid}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="relative">
                    <img
                      src={
                        friend.photoURL ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                      }
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                    />
                    <div
                      className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0A0E16] ${
                        isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                      }`}
                      title={isOnline ? 'Online' : 'Offline'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {friend.displayName}
                      </span>
                      {isOnline && (
                        <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">
                          Online
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-white/40 font-mono">
                      ELO: {friend.elo || 1200}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleInvite(friend)}
                    disabled={isInvited || isInviting}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isInvited
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-[#F5C453] text-[#05070A] font-black uppercase tracking-wider hover:brightness-110 shadow-sm'
                    } disabled:cursor-not-allowed`}
                  >
                    {isInvited ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Invited</span>
                      </>
                    ) : isInviting ? (
                      <span>Sending...</span>
                    ) : (
                      <>
                        <Swords className="w-3.5 h-3.5" />
                        <span>Invite</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/10 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/15 transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
