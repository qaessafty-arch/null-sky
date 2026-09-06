import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Users, UserPlus, Sparkles, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRoom } from '../../hooks/useRoom';
import { listenToFriendsList } from '../../services/friendService';
import { FriendUser } from '../../types/chess';

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
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'var(--room-bg-overlay)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg max-h-[80vh] flex flex-col rounded-2xl overflow-hidden"
        style={{ background: 'var(--room-bg-mountain)', border: '1px solid var(--room-border-strong)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — sentence case */}
        <div className="flex items-center justify-between p-4 shrink-0" style={{ borderBottom: '1px solid var(--room-border)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl" style={{ background: 'var(--room-gold-soft)', border: '1px solid var(--room-gold-border)' }}>
              <Users style={{ width: 16, height: 16, color: 'var(--room-gold)' }} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--room-text)' }}>
                Invite allies
              </h3>
              <p style={{ fontSize: 12, color: 'var(--room-text-muted)' }}>
                Choose friends to join room {currentRoom?.roomCode || '…'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl"
            style={{ background: 'var(--room-bg-raised)', border: '1px solid var(--room-border)', color: 'var(--room-text-muted)', cursor: 'pointer' }}
          >
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {/* Friends list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {loading ? (
            <div className="room-empty">
              <span>Loading allies…</span>
            </div>
          ) : friends.length === 0 ? (
            <div className="room-empty">
              <UserPlus style={{ width: 24, height: 24, color: 'var(--room-text-muted)', marginBottom: 12 }} />
              <span>No allies found. Add friends first from the Social panel.</span>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {friends.map((f) => (
                <button
                  key={f.uid}
                  type="button"
                  onClick={() => toggle(f.uid)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer"
                  style={{
                    background: selected.has(f.uid) ? 'var(--room-gold-soft)' : 'transparent',
                    border: selected.has(f.uid) ? '1px solid var(--room-gold-border)' : '1px solid transparent',
                  }}
                >
                  <img
                    src={f.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover"
                    style={{ border: '2px solid var(--room-border-strong)' }}
                    loading="lazy"
                  />
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--room-text)' }}>
                        {f.displayName}
                      </span>
                      {f.isOnline && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--room-green)', display: 'inline-block' }} />
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--room-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                      {f.elo} ELO · {f.honorRank}
                    </div>
                  </div>
                  {selected.has(f.uid) && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--room-gold)', color: 'var(--room-bg-deep)' }}>
                      <Sparkles style={{ width: 12, height: 12 }} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer — action */}
        {selected.size > 0 && (
          <div className="p-4 shrink-0" style={{ borderTop: '1px solid var(--room-border)' }}>
            <button
              type="button"
              onClick={handleSend}
              disabled={!!inviting}
              className="room-btn-primary w-full"
              style={{ opacity: inviting ? 0.5 : 1, cursor: inviting ? 'not-allowed' : 'pointer' }}
            >
              {inviting === 'batch' ? 'Sending invites…' : `Send ${selected.size} invite(s)`}
            </button>
          </div>
        )}

        {!selected.size && !loading && friends.length > 0 && (
          <div className="p-4 shrink-0" style={{ borderTop: '1px solid var(--room-border)' }}>
            <button
              type="button"
              onClick={onClose}
              className="room-btn-secondary w-full"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};
