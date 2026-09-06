import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageSquare, Smile, Loader2, Crown } from 'lucide-react';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';
import { useRoomChat } from '../../hooks/useRoomChat';
import { useAuth } from '../../context/AuthContext';

export const RoomChat: React.FC = () => {
  const { messages, pending, setPending, sending, handleSend, typingUsers, canChat } = useRoomChat();
  const { user } = useAuth();
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Click outside to close emoji picker
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    };
    if (showEmoji) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmoji]);

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setPending((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
    inputRef.current?.focus();
  };

  const quickReactions = ['👋', '⚔️', '🔥', '👑', '🤝', '😂', '🎯'];

  return (
    <div className="room-chat-container">
      {/* Header */}
      <div className="room-chat-header">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#F5C453]" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Battle Chat
          </span>
        </div>
        {typingUsers.size > 0 && (
          <span className="text-[11px] text-[#F5C453] font-mono animate-pulse">
            {[...typingUsers][0]} is typing...
          </span>
        )}
      </div>

      {/* Messages */}
      <div className="room-chat-messages">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-white/40 p-4">
            <MessageSquare className="w-8 h-8 mb-2 opacity-40 text-[#F5C453]" />
            <p className="text-xs">No messages yet. Say hi to your challenger!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.userId === user?.uid;
            const isSys = msg.isSystem || msg.userId === 'system';

            if (isSys) {
              return (
                <div key={msg.id} className="chat-bubble system">
                  <div className="chat-content">
                    {msg.message}
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`chat-bubble ${isMe ? 'mine' : 'theirs'}`}
              >
                {!isMe && (
                  <img
                    src={
                      msg.userPhotoURL ||
                      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=80'
                    }
                    alt=""
                    className="w-7 h-7 rounded-full object-cover border border-white/10 flex-shrink-0"
                    loading="lazy"
                  />
                )}
                <div className="flex flex-col gap-1 max-w-full">
                  {!isMe && (
                    <span className="text-[10px] font-bold text-white/50 px-1">
                      {msg.userName}
                    </span>
                  )}
                  <div className="chat-content">
                    {msg.message}
                  </div>
                  <span
                    className={`text-[9px] text-white/30 px-1 ${
                      isMe ? 'text-right' : 'text-left'
                    }`}
                  >
                    {msg.timestamp
                      ? new Date(
                          typeof msg.timestamp === 'string'
                            ? msg.timestamp
                            : msg.timestamp.toDate
                            ? msg.timestamp.toDate()
                            : msg.timestamp
                        ).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : ''}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Reactions Bar */}
      {canChat && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/30 border-t border-white/5 overflow-x-auto">
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest mr-1">
            Quick:
          </span>
          {quickReactions.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setPending((prev) => prev + emoji)}
              className="px-2 py-0.5 rounded text-sm hover:bg-white/10 active:scale-95 transition-all cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Bar */}
      {canChat && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="room-chat-input-bar relative"
        >
          {/* Emoji Picker Popover */}
          <AnimatePresence>
            {showEmoji && (
              <motion.div
                ref={emojiRef}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="emoji-picker-anchor"
              >
                <EmojiPicker
                  theme={Theme.DARK}
                  onEmojiClick={onEmojiClick}
                  width={300}
                  height={360}
                  lazyLoadEmojis
                  searchPlaceHolder="Search emoji..."
                />
              </motion.div>
            )}
          </AnimatePresence>

          <button
            type="button"
            onClick={() => setShowEmoji((v) => !v)}
            className={`p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-all cursor-pointer ${
              showEmoji ? 'text-[#F5C453] bg-white/10' : ''
            }`}
            title="Emoji"
          >
            <Smile className="w-4 h-4" />
          </button>

          <input
            ref={inputRef}
            type="text"
            value={pending}
            onChange={(e) => setPending(e.target.value)}
            placeholder="Type a message or cheer..."
            maxLength={500}
            className="room-chat-input"
          />

          <button
            type="submit"
            disabled={!pending.trim() || sending}
            className="p-2.5 rounded-lg bg-gradient-to-r from-[#F5C453] to-[#D4A843] text-black font-bold hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center flex-shrink-0"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      )}
    </div>
  );
};
