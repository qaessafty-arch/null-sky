import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Swords,
  LogIn,
  Plus,
  Shield,
  Clock,
  Sparkles,
  Users,
  Copy,
  Check,
  Crown,
  ChevronRight,
  AlertCircle,
  Gamepad2,
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { WaitingRoom } from './Room/WaitingRoom';
import { CreateRoomModal } from './Room/CreateRoomModal';
import { JoinRoomModal } from './Room/JoinRoomModal';
import { InviteNotification } from './Notifications/InviteNotification';
import { listenToFriendsList } from '../services/friendService';

interface PrivateRoomProps {
  onStartMatch?: (matchId: string) => void;
  onNavigateHome?: () => void;
}

export const PrivateRoom: React.FC<PrivateRoomProps> = ({
  onStartMatch,
  onNavigateHome,
}) => {
  const {
    currentRoom,
    incomingInvites,
    acceptInvite,
    declineInvite,
    joinError,
    activeGameId,
    dismissActiveGame,
  } = useRoom();
  const { profile } = useAuth();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);

  // When match starts and activeGameId is set, launch online match!
  useEffect(() => {
    if (activeGameId) {
      onStartMatch?.(activeGameId);
    }
  }, [activeGameId, onStartMatch]);

  // Listen to friends for quick allies list
  useEffect(() => {
    if (!profile?.uid) return;
    const unsub = listenToFriendsList(profile.uid, (list) => {
      if (Array.isArray(list)) {
        setFriends(list);
      }
    });
    return () => unsub?.();
  }, [profile?.uid]);

  // If in an active room, display the Waiting Room interface!
  if (currentRoom) {
    return (
      <div className="w-full min-h-screen py-6 px-3 sm:px-6">
        <WaitingRoom onLeave={() => dismissActiveGame()} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 flex flex-col gap-8">
      {/* 1. Header Banner */}
      <div className="room-glass-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#F5C453]/20 to-[#E5B543]/40 border border-[#F5C453]/40 flex items-center justify-center text-[#F5C453] shadow-lg shadow-[#F5C453]/10">
            <Swords className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-white">
                Private Arena
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-[#F5C453]/20 text-[#F5C453] border border-[#F5C453]/30">
                1v1 Duel
              </span>
            </div>
            <p className="text-xs sm:text-sm text-white/50 mt-1">
              Host custom battles with room codes or challenge allies directly.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsJoinOpen(true)}
            className="flex-1 sm:flex-initial px-5 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            <span>Join Room</span>
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 sm:flex-initial px-6 py-3 rounded-xl bg-gradient-to-r from-[#F5C453] via-[#E5B543] to-[#D4A843] text-black text-xs font-black uppercase tracking-widest shadow-lg shadow-[#F5C453]/20 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Room</span>
          </button>
        </div>
      </div>

      {/* 2. Incoming Challenges / Invites */}
      <AnimatePresence>
        {incomingInvites.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3"
          >
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#F5C453]">
              <Sparkles className="w-4 h-4" />
              <span>Pending Direct Challenges ({incomingInvites.length})</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {incomingInvites.map((invite) => (
                <InviteNotification
                  key={invite.id}
                  inviteId={invite.id}
                  roomCode={invite.roomCode}
                  invitedByName={invite.invitedByName}
                  invitedByPhoto={invite.invitedByPhoto}
                  timeControlName={invite.settings.timeControlName}
                  rated={invite.settings.rated}
                  onAccept={acceptInvite}
                  onDecline={declineInvite}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main Action Hub Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create Card */}
        <div className="room-glass-card p-6 sm:p-8 flex flex-col justify-between gap-6 hover:border-[#F5C453]/40 transition-all group">
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#F5C453]/10 border border-[#F5C453]/20 flex items-center justify-center text-[#F5C453] group-hover:scale-105 transition-transform">
              <Crown className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-wider text-white">
              Host a Battle
            </h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Create a custom private room, pick your desired time controls, preferred side, and rated status. Share your 6-digit code or invite friends from your social roster.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-white/50 font-mono">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#F5C453]" /> 1m - 30m formats
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#F5C453]" /> Rated or Casual
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="w-full py-3.5 rounded-xl bg-[#F5C453] text-[#05070A] text-xs font-black uppercase tracking-widest hover:brightness-110 shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Setup Waiting Room</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Join Card */}
        <div className="room-glass-card p-6 sm:p-8 flex flex-col justify-between gap-6 hover:border-white/20 transition-all group">
          <div className="flex flex-col gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:scale-105 transition-transform">
              <LogIn className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black uppercase tracking-wider text-white">
              Join with Code
            </h3>
            <p className="text-xs text-white/60 leading-relaxed">
              Have a friend waiting for you? Enter their unique 6-character room code to instantly connect and take your seat as the challenger.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 text-xs text-white/50 font-mono">
              <span>Instant synchronization</span>
              <span>·</span>
              <span>Sub-second match startup</span>
            </div>
            <button
              type="button"
              onClick={() => setIsJoinOpen(true)}
              className="w-full py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Enter Room Code</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error display if any */}
      {joinError && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{joinError}</span>
        </div>
      )}

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
      />

      <JoinRoomModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
      />
    </div>
  );
};
