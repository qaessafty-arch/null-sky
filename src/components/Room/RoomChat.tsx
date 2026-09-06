import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { useRoomChat } from '../../hooks/useRoomChat';

export const RoomChat: React.FC = () => {
  const { messages, pending, setPending, sending, handleSend, typingUsers, canChat } =
    useRoomChat();

  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (pending === '') inputRef.current?.focus();
  }, [pending]);

  return (
    <div className="room-chat room-card-secondary">
      {/* Header — sentence case, not ALL-CAPS */}
      <div className="room-chat__header">
        <MessageSquare style={{ width: 16, height: 16, color: 'var(--room-gold)' }} />
        <span className="room-label">Battle chat</span>
        {typingUsers.size > 0 && (
          <span style={{ fontSize: 11, color: 'var(--room-gold)', fontFamily: "'JetBrains Mono', monospace" }}>
            {[...typingUsers][0]} is typing…
          </span>
        )}
      </div>

      {/* Messages — warm, readable */}
      <div className="room-chat__messages">
        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="room-chat__message"
            >
              {!!msg.userPhotoURL && (
                <img
                  src={msg.userPhotoURL}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover"
                  style={{ border: '1px solid var(--room-border)', flexShrink: 0 }}
                  loading="lazy"
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="room-chat__message-name">{msg.userName}</span>
                  <span className="room-chat__message-time">
                    {msg.timestamp ? new Date(msg.timestamp as Date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <p className="room-chat__message-text">{msg.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Input — warm, readable */}
      {canChat && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="room-chat__input"
        >
          <input
            ref={inputRef}
            value={pending}
            onChange={(e) => setPending(e.target.value)}
            placeholder="Chat with your opponent…"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!pending.trim() || sending}
            className="room-btn-primary"
            style={{ width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {sending ? (
              <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
            ) : (
              <Send style={{ width: 16, height: 16 }} />
            )}
          </button>
        </form>
      )}
    </div>
  );
};
