import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, UserPlus, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRoom } from '../../hooks/useRoom';
import { listenToFriendsList } from '../../services/friendService';
import { FriendUser } from '../../types/chess';
import { GlassCard } from '../GlassUI';

interface FriendInviteProps {
  onClose: () => void;
  onInvited: () => void;
}

export const FriendInvite: React.FC<FriendInviteProps> = ({ onClose, onInvited }) => {
  const { profile } = useAuth();
  const { currentRoom, inviteFriend, inviteFriendNotify } = useRoom();
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [inviting, setInviting] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    const unsub = listenToFriendsList(profile.uid, (list) => {
      // Exclude the current user and the opponent if already joined
      const opponentId = currentRoom?.opponentId;
      setFriends(
        list.filter(
          (f) => f.uid !== profile.uid && f.uid !== opponentId,
        ),
      );
      setLoading(false);
    });
    return unsub;
  }, [profile, currentRoom]);

  const toggle = (uid: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid);
      else next.add(uid);
      return next;
    });
  };

  const handleSend = async () => {
    setInviting('batch');
    let sent = 0;
    for (const uid of selected) {
      const friend = friends.find((f) => f.uid === uid);
      if (!friend) continue;
      try {
        await inviteFriend(friend.uid, friend.displayName, friend.photoURL);
        await inviteFriendNotify(friend.uid, friend.displayName, currentRoom?.roomCode || '');
        sent++;
      } catch {}
    }
    setInviting(null);
    setSelected(new Set());
    onInvited();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl border border-white/15 bg-[#0B0F19]/90 backdrop-blur-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-[#F5C453]/10 border border-[#F5C453]/30">
              <Users className="w-4 h-4 text-[#F5C453]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest">
                Invite Allies
              </h3>
              <p className="text-[10px] text-white/40 font-bold">
                Choose friends to join room {currentRoom?.roomCode || '...'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 transition-all flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {loading ? (
            <div className="text-center py-8 text-white/40 text-xs font-bold">
              Loading allies...
            </div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8 text-white/40 text-xs font-bold">
              No allies found. Add friends first from the Social panel.
            </div>
          ) : (
            <div className="space-y-1">
              {friends.map((f) => (
                <button
                  key={f.uid}
                  type="button"
                  onClick={() => toggle(f.uid)}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl border transition-all cursor-pointer ${
                    selected.has(f.uid)
                      ? 'border-[#F5C453]/40 bg-[#F5C453]/10'
                      : 'border-transparent bg-white/[0.03] hover:bg-white/[0.06]'
                  }`}
                >
                  <img
                    src={f.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt=""
                    className="w-8 h-8 rounded-full object-cover border border-white/10 shrink-0"
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">
                        {f.displayName}
                      </span>
                      {f.isOnline && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                      )}
                    </div>
                    <div className="text-[10px] text-white/40 font-mono">
                      {f.elo} ELO · {f.honorRank}
                    </div>
                  </div>
                  {selected.has(f.uid) && (
                    <div className="w-5 h-5 rounded-full bg-[#F5C453] text-black flex items-center justify-center">
                      <Sparkles className="w-3 h-3" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {selected.size > 0 && (
          <div className="p-4 border-t border-white/10 shrink-0">
            <button
              type="button"
              onClick={handleSend}
              disabled={!!inviting}
              className={`w-full py-3 rounded-xl font-black uppercase text-xs tracking-widest border transition-all cursor-pointer ${
                inviting
                  ? 'bg-white/5 text-white/30 cursor-not-allowed border-white/10'
                  : 'bg-gradient-to-r from-[#52673A] to-[#8C2425] hover:brightness-110 text-white border-[#F5C453]/40 shadow-lg'
              }`}
            >
              {inviting === 'batch' ? 'Sending invites...' : `Send ${selected.size} invite(s)`}
            </button>
          </div>
        )}

        {!selected.size && !loading && friends.length > 0 && (
          <div className="p-4 border-t border-white/10 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-bold uppercase tracking-widest border border-white/10 transition-all cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
