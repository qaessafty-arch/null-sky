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

  if (!currentRoom) return null;

  const isHost = currentRoom.creatorId === (currentRoom as any).creatorId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-6"
    >
      {/* Header — sentence case, not ALL-CAPS */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'var(--room-gold-soft)', border: '1px solid var(--room-gold-border)' }}>
            <Swords style={{ width: 16, height: 16, color: 'var(--room-gold)' }} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--room-text)' }}>
              Private Room
            </div>
            <div style={{ fontSize: 12, color: 'var(--room-text-muted)', fontWeight: 500 }}>
              Waiting for challenger…
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentRoom.status === 'waiting' && (
            <span className="room-status room-status--open">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--room-green)', display: 'inline-block' }} />
              Open
            </span>
          )}
          {currentRoom.status === 'ready' && (
            <span className="room-status room-status--ready">
              Ready
            </span>
          )}
        </div>
      </div>

      {/* Main content — primary card (solid, not glass) */}
      <div className="room-card-primary flex flex-col gap-6">
        {/* Code display */}
        <RoomCodeDisplay
          code={currentRoom.roomCode}
          onCopy={() => {}}
          onShare={() => {}}
        />

        {/* Player cards — hierarchy through weight, not glass */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Host */}
          <div className="room-player">
            <img
              src={currentRoom.creatorPhotoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              alt=""
              className="room-player__avatar"
            />
            <div>
              <div className="room-player__name">{currentRoom.creatorName}</div>
              <div className="room-player__rating">{currentRoom.creatorElo} ELO</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Users style={{ width: 12, height: 12, color: 'var(--room-text-muted)' }} />
              <span style={{ fontSize: 11, color: 'var(--room-text-muted)', fontWeight: 500 }}>Host</span>
            </div>
          </div>

          {/* Challenger */}
          <div className={currentRoom.opponentId ? 'room-player' : 'room-card-ghost'}>
            {currentRoom.opponentId ? (
              <>
                <img
                  src={currentRoom.opponentPhotoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                  alt=""
                  className="room-player__avatar"
                />
                <div>
                  <div className="room-player__name">{currentRoom.opponentName}</div>
                  <div className="room-player__rating">{currentRoom.opponentElo ?? '—'} ELO</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Swords style={{ width: 12, height: 12, color: 'var(--room-gold)' }} />
                  <span style={{ fontSize: 11, color: 'var(--room-gold)', fontWeight: 500 }}>Challenger</span>
                </div>
              </>
            ) : (
              <div className="room-empty">
                <Swords style={{ width: 20, height: 20, color: 'var(--room-text-muted)', marginBottom: 8 }} />
                <span>Waiting for challenger…</span>
              </div>
            )}
          </div>
        </div>

        {/* Settings — restrained pills, not glass badges */}
        <div className="flex flex-wrap gap-2">
          <span className="room-setting">
            <Clock />
            {currentRoom.settings.timeControlName} ({Math.floor(currentRoom.settings.initialSeconds / 60)}:{(currentRoom.settings.initialSeconds % 60).toString().padStart(2, '0')})
          </span>
          <span className="room-setting">
            <Gauge />
            {currentRoom.settings.color === 'white' ? 'Playing White' : currentRoom.settings.color === 'black' ? 'Playing Black' : 'Random color'}
          </span>
          {currentRoom.settings.rated && (
            <span className="room-setting" style={{ background: 'var(--room-gold-soft)', color: 'var(--room-gold)', borderColor: 'var(--room-gold-border)' }}>
              Rated match
            </span>
          )}
        </div>

        {/* Chat + Invites — secondary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
          <RoomChat />
          <div className="room-card-secondary flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus style={{ width: 16, height: 16, color: 'var(--room-gold)' }} />
                <span className="room-label">Invite allies</span>
              </div>
              <button
                type="button"
                onClick={() => onShowInvitePickerChange(true)}
                className="room-btn-secondary"
                style={{ padding: '6px 14px', fontSize: 12 }}
              >
                Pick friends
              </button>
            </div>

            {invitesLoading ? (
              <div className="room-empty">
                <span>Checking invites…</span>
              </div>
            ) : invites.length === 0 ? (
              <div className="room-empty">
                <UserPlus style={{ width: 20, height: 20, color: 'var(--room-text-muted)', marginBottom: 8 }} />
                <span>No pending invites. Invite friends to join you.</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {invites.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'var(--room-bg-raised)', border: '1px solid var(--room-border)' }}
                  >
                    <img
                      src={invite.userPhotoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover"
                      style={{ border: '2px solid var(--room-border-strong)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--room-text)' }}>
                        {invite.userName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--room-text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
                        {currentRoom.settings.timeControlName} · {invite.settings.color}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => accept(invite.id)}
                        className="room-btn-primary"
                        style={{ padding: '6px 14px', fontSize: 12 }}
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => decline(invite.id)}
                        className="room-btn-secondary"
                        style={{ padding: '6px 14px', fontSize: 12 }}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Error state — direction, not mood */}
        {joinError && (
          <div
            className="p-3 rounded-xl"
            style={{ background: 'var(--room-red-soft)', color: '#D4A0A0', fontSize: 13, fontWeight: 600, border: '1px solid rgba(123, 45, 46, 0.3)' }}
          >
            {joinError}
          </div>
        )}
      </div>

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
