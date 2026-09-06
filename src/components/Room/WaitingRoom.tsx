import React from 'react';
import { motion } from 'motion/react';
import { Clock, Gauge, Swords, Users, MessageSquare, UserPlus } from 'lucide-react';
import { useRoom } from '../../hooks/useRoom';
import { useRoomChat } from '../../hooks/useRoomChat';
import { useRoomInvites } from '../../hooks/useRoomInvites';
import { RoomCodeDisplay } from './RoomCodeDisplay';
import { RoomChat } from './RoomChat';
import { FriendInvite } from './FriendInvite';
import { RoomSettings } from './RoomSettings';
import { GlassCard } from '../GlassUI';

interface WaitingRoomProps {
  showInvitePicker: boolean;
  onShowInvitePickerChange: (v: boolean) => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  showInvitePicker,
  onShowInvitePickerChange,
}) => {
  const {
    currentRoom,
    joinError,
    setJoinError,
    addOpponent,
    updateRoomStatus,
    markRoomExpiredIfDue,
  } = useRoom();
  const { canChat } = useRoomChat();
  const { invites, loading: invitesLoading, accept, decline } = useRoomInvites();

  React.useEffect(() => {
    const timer = setInterval(async () => {
      await markRoomExpiredIfDue();
    }, 1000);
    return () => clearInterval(timer);
  }, [markRoomExpiredIfDue]);

  React.useEffect(() => {
    if (currentRoom?.status === 'ready') {
      // When the opponent joins, notify them via the hook path.
      if (currentRoom.opponentId) {
        // If the current user is the host, the opponent has joined;
        // if the current user is the opponent, the join already succeeded.
      }
    }
  }, [currentRoom?.status]);

  if (!currentRoom) return null;

  const host = currentRoom.creatorId === undefined ? null : currentRoom.creatorId;
  const isHost = host && host === (currentRoom as any).creatorId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      {/* Header strip */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-[#F5C453]/10 border border-[#F5C453]/30">
            <Swords className="w-4 h-4 text-[#F5C453]" />
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F5C453]">
              Private Room
            </div>
            <div className="text-xs text-white/50 font-bold">Waiting for challenger...</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentRoom.status === 'waiting' && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30 animate-pulse">
              Open
            </span>
          )}
          {currentRoom.status === 'ready' && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-black uppercase tracking-widest border border-amber-500/30">
              Ready
            </span>
          )}
        </div>
      </div>

      <GlassCard intensity="high" className="flex flex-col gap-6 p-6">
        {/* Code display */}
        <RoomCodeDisplay
          code={currentRoom.roomCode}
          onCopy={() => {}}
          onShare={() => {}}
        />

        {/* Opponent card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Host card */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                Host
              </span>
              <Users className="w-3.5 h-3.5 text-[#F5C453]" />
            </div>
            <div className="flex items-center gap-3">
              <img
                src={
                  currentRoom.creatorPhotoURL ||
                  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                }
                alt=""
                className="w-10 h-10 rounded-full object-cover border border-white/10"
              />
              <div>
                <div className="text-sm font-bold text-white">
                  {currentRoom.creatorName}
                </div>
                <div className="text-[10px] text-white/40 font-mono">
                  {currentRoom.creatorElo} ELO
                </div>
              </div>
            </div>
          </div>

          {/* Opponent card */}
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50">
                Challenger
              </span>
              <Swords className="w-3.5 h-3.5 text-[#F5C453]" />
            </div>
            {currentRoom.opponentId ? (
              <div className="flex items-center gap-3">
                <img
                  src={
                    currentRoom.opponentPhotoURL ||
                    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                  }
                  alt=""
                  className="w-10 h-10 rounded-full object-cover border border-white/10"
                />
                <div>
                  <div className="text-sm font-bold text-white">
                    {currentRoom.opponentName}
                  </div>
                  <div className="text-[10px] text-white/40 font-mono">
                    {currentRoom.opponentElo ?? '—'} ELO
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-14 border border-dashed border-white/10 rounded-xl text-xs text-white/40 font-bold">
                Waiting for challenger...
              </div>
            )}
          </div>
        </div>

        {/* Settings summary */}
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-full bg-white/[0.05] text-white/70 text-[10px] font-black uppercase tracking-widest border border-white/10">
            <Clock className="inline w-3 h-3 mr-1" />
            {currentRoom.settings.timeControlName} ({Math.floor(currentRoom.settings.initialSeconds / 60)}:{(currentRoom.settings.initialSeconds % 60).toString().padStart(2, '0')})
          </span>
          <span className="px-2.5 py-1 rounded-full bg-white/[0.05] text-white/70 text-[10px] font-black uppercase tracking-widest border border-white/10">
            <Gauge className="inline w-3 h-3 mr-1" />
            {currentRoom.settings.color === 'white' ? 'Playing White' : currentRoom.settings.color === 'black' ? 'Playing Black' : 'Random Color'}
          </span>
          {currentRoom.settings.rated && (
            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-300 text-[10px] font-black uppercase tracking-widest border border-amber-500/30">
              Rated Match
            </span>
          )}
        </div>

        {/* Chat + Invites split */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <RoomChat />
          <GlassCard intensity="medium" className="flex flex-col gap-3 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#F5C453]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                  Invite Allies
                </span>
              </div>
              <button
                type="button"
                onClick={() => onShowInvitePickerChange(true)}
                className="px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[#F5C453]/30 bg-[#F5C453]/10 text-[#F5C453] hover:bg-[#F5C453]/20 transition-all cursor-pointer"
              >
                Pick
              </button>
            </div>

            {invitesLoading ? (
              <div className="text-center py-6 text-white/40 text-xs font-bold">
                Checking invites...
              </div>
            ) : invites.length === 0 ? (
              <div className="text-center py-6 text-white/40 text-xs font-bold">
                No pending invites. Invite friends to join you.
              </div>
            ) : (
              <div className="space-y-2">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="p-3 rounded-xl bg-white/[0.04] border border-white/10"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <img
                        src={
                          invite.userPhotoURL ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
                        }
                        alt=""
                        className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0"
                      />
                      <span className="text-xs font-bold text-white">{invite.userName}</span>
                    </div>
                    <div className="text-[10px] text-white/40 font-mono">
                      {currentRoom.settings.timeControlName} · {invite.settings.color}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => accept(invite.id)}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all cursor-pointer"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => decline(invite.id)}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 transition-all cursor-pointer"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </div>

        {joinError && (
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-300 text-xs font-bold border border-rose-500/30">
            {joinError}
          </div>
        )}
      </GlassCard>

      {/* Invite picker modal */}
      {showInvitePicker && (
        <FriendInvite
          onClose={() => onShowInvitePickerChange(false)}
          onInvited={() => onShowInvitePickerChange(false)}
        />
      )}
    </motion.div>
  );
};
