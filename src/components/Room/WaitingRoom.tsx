import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Copy,
  Share2,
  Check,
  X,
  Users,
  UserPlus,
  Clock,
  Shield,
  Sparkles,
  Swords,
  Crown,
  AlertCircle,
  Gamepad2,
} from 'lucide-react';
import { useRoom } from '../../context/RoomContext';
import { useAuth } from '../../context/AuthContext';
import { RoomChat } from './RoomChat';
import { InviteFriendModal } from './InviteFriendModal';
import { listenToFriendsList } from '../../services/friendService';

interface WaitingRoomProps {
  onLeave?: () => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({ onLeave }) => {
  const { currentRoom, cancelRoom, leaveRoom, countdown, inviteFriend } = useRoom();
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [invitedUids, setInvitedUids] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!profile?.uid) return;
    const unsub = listenToFriendsList(profile.uid, (list) => {
      if (Array.isArray(list)) {
        setFriends(list.slice(0, 6));
      }
    });
    return () => unsub?.();
  }, [profile?.uid]);

  if (!currentRoom) {
    return (
      <div className="p-8 text-center text-white/50">
        No active room. Create or join a private room to begin.
      </div>
    );
  }

  const myUid = profile?.uid || user?.uid;
  const isCreator = currentRoom.creatorId === myUid;
  const roomCode = currentRoom.roomCode;
  const isOpponentJoined = Boolean(currentRoom.opponentId);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
    } catch {
      const el = document.createElement('input');
      el.value = roomCode;
      document.body.appendChild(el);
      el.select();
      try {
        document.execCommand('copy');
      } catch {}
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = `Play chess with me in Chesskys PRO! Room Code: ${roomCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Chesskys Private Battle', text });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
        return;
      } catch {}
    }
    handleCopyCode();
  };

  const handleCancelOrLeave = async () => {
    if (isCreator && currentRoom.status === 'waiting') {
      await cancelRoom(roomCode);
    } else {
      leaveRoom();
    }
    onLeave?.();
  };

  const handleQuickInvite = async (friend: any) => {
    if (invitedUids.has(friend.uid)) return;
    try {
      await inviteFriend(friend.uid, friend.displayName, friend.photoURL);
      setInvitedUids((prev) => new Set(prev).add(friend.uid));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col gap-5 p-2 sm:p-4">
      {/* 3-Second Automatic Game Countdown Overlay */}
      <AnimatePresence>
        {countdown !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="room-countdown-overlay rounded-2xl"
          >
            <div className="p-8 max-w-md mx-auto flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#F5C453]/20 border border-[#F5C453]/40 flex items-center justify-center text-[#F5C453] shadow-xl">
                <Swords className="w-8 h-8" />
              </div>
              <div className="text-xl font-black uppercase tracking-widest text-white">
                Opponent Joined!
              </div>
              <p className="text-xs text-white/70">
                Battle commencing in
              </p>
              <div className="room-countdown-number my-2">
                {countdown}
              </div>
              <div className="text-xs font-mono text-[#F5C453] tracking-widest uppercase">
                Prepare your pieces
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 1. Header Bar */}
      <div className="room-glass-card px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5C453]/15 border border-[#F5C453]/30 flex items-center justify-center text-[#F5C453]">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black uppercase tracking-wider text-white">
                Private Room
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider ${
                isOpponentJoined
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
              }`}>
                {isOpponentJoined ? 'Ready' : 'Waiting'}
              </span>
            </div>
            <p className="text-xs text-white/40">
              {isCreator ? 'You are the host' : 'You joined as challenger'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCancelOrLeave}
          className="room-btn-action danger"
          title={isCreator ? 'Cancel and delete room' : 'Leave room'}
        >
          <X className="w-4 h-4" />
          <span>{isCreator ? 'Cancel Room' : 'Leave Room'}</span>
        </button>
      </div>

      {/* 2. Room Code & Game Settings Summary Card */}
      <div className="room-glass-card p-6 sm:p-8 flex flex-col items-center text-center gap-5">
        <div className="flex flex-col items-center gap-2">
          <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#F5C453]">
            Room Code
          </span>
          <div className="flex items-center gap-3">
            <div className="room-code-badge">
              {roomCode}
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleCopyCode}
                className="room-btn-action ghost !p-2.5"
                title="Copy code"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-white/80" />
                )}
                <span className="text-xs">{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="room-btn-action ghost !p-2.5"
                title="Share link"
              >
                {shared ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Share2 className="w-4 h-4 text-white/80" />
                )}
                <span className="text-xs">{shared ? 'Shared' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-xs font-semibold text-white/80">
          {isOpponentJoined ? (
            <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
              <Check className="w-4 h-4" /> Opponent Joined! Starting match...
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span>Waiting for opponent</span>
              <div className="waiting-dots">
                <span />
                <span />
                <span />
              </div>
            </div>
          )}
        </div>

        {/* Settings Pill Summary Bar */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2 border-t border-white/10 w-full max-w-lg">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/80">
            <Clock className="w-3.5 h-3.5 text-[#F5C453]" />
            <span>{currentRoom.settings.timeControlName}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/80">
            <Shield className="w-3.5 h-3.5 text-[#F5C453]" />
            <span>{currentRoom.settings.rated ? 'Rated Match' : 'Casual'}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-white/80">
            <Gamepad2 className="w-3.5 h-3.5 text-[#F5C453]" />
            <span>
              Color: {currentRoom.settings.color.charAt(0).toUpperCase() + currentRoom.settings.color.slice(1)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Players (Left) & Invites (Right) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Left: 👤 Players */}
        <div className="room-glass-card p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#F5C453]" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Battle Contenders
              </span>
            </div>
            <span className="text-[11px] font-mono text-white/40">
              {isOpponentJoined ? '2/2' : '1/2'} Players
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {/* Host / Creator Player Slot */}
            <div className="player-slot active">
              <div className="relative">
                <img
                  src={
                    currentRoom.creatorPhotoURL ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                  }
                  alt=""
                  className="w-11 h-11 rounded-full object-cover border-2 border-[#F5C453]"
                />
                <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#F5C453] text-black text-[9px] font-black flex items-center justify-center">
                  👑
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white truncate">
                    {currentRoom.creatorName}
                  </span>
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-[#52673A] text-white">
                    Host
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/50 font-mono mt-0.5">
                  <span>⭐ ELO: {currentRoom.creatorElo}</span>
                  <span>·</span>
                  <span className="text-[#F5C453]">
                    {currentRoom.creatorColor === 'black' ? 'Black ♚' : 'White ♔'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center text-xs font-black text-white/30 tracking-widest">
              VS
            </div>

            {/* Challenger Player Slot */}
            {isOpponentJoined ? (
              <div className="player-slot active">
                <img
                  src={
                    currentRoom.opponentPhotoURL ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
                  }
                  alt=""
                  className="w-11 h-11 rounded-full object-cover border-2 border-emerald-400"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">
                      {currentRoom.opponentName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Challenger
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/50 font-mono mt-0.5">
                    <span>⭐ ELO: {currentRoom.opponentElo || 1200}</span>
                    <span>·</span>
                    <span className="text-emerald-300">
                      {currentRoom.opponentColor === 'white' ? 'White ♔' : 'Black ♚'}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="player-slot waiting justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-white/30">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white/60">
                      Waiting for opponent...
                    </div>
                    <div className="text-[11px] text-white/40">
                      Share code or invite friends
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowInviteModal(true)}
                  className="room-btn-action gold !py-2 !px-3 !text-xs"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right: 📨 Invites & Allies */}
        <div className="room-glass-card p-5 sm:p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#F5C453]" />
              <span className="text-xs font-black uppercase tracking-wider text-white">
                Invite Allies
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="text-xs font-bold text-[#F5C453] hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>View All</span>
            </button>
          </div>

          <div className="flex flex-col gap-2 flex-1">
            {friends.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-center text-white/40 gap-2">
                <Users className="w-8 h-8 opacity-40 text-[#F5C453]" />
                <p className="text-xs">No online friends available right now.</p>
                <button
                  type="button"
                  onClick={handleShare}
                  className="room-btn-action ghost !py-1.5 !px-3 !text-xs mt-1"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Room Link</span>
                </button>
              </div>
            ) : (
              friends.slice(0, 3).map((friend) => {
                const isInvited = invitedUids.has(friend.uid);
                const isOnline = friend.isOnline !== false;

                return (
                  <div
                    key={friend.uid}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5"
                  >
                    <div className="relative">
                      <img
                        src={
                          friend.photoURL ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'
                        }
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-white/10"
                      />
                      <div
                        className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border border-black ${
                          isOnline ? 'bg-emerald-400' : 'bg-slate-500'
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white truncate">
                        {friend.displayName}
                      </div>
                      <div className="text-[10px] text-white/40 font-mono">
                        {isOnline ? 'Online' : 'Offline'} · {friend.elo || 1200} ELO
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleQuickInvite(friend)}
                      disabled={isInvited || isOpponentJoined}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isInvited
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-[#F5C453] text-black font-black uppercase text-[10px] hover:brightness-110'
                      } disabled:opacity-40 disabled:cursor-not-allowed`}
                    >
                      {isInvited ? 'Invited' : 'Invite'}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Card: 💬 Room Chat */}
      <RoomChat />

      {/* Invite Friends Modal */}
      <InviteFriendModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
      />
    </div>
  );
};
