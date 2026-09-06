import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { useRoomChat } from '../../hooks/useRoomChat';
import { GlassCard } from '../GlassUI';

export const RoomChat: React.FC = () => {
  const { messages, pending, setPending, sending, handleSend, typingUsers, canChat } =
    useRoomChat();

  const inputRef = React.useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    if (pending === '') inputRef.current?.focus();
  }, [pending]);

  return (
    <GlassCard intensity="high" className="flex flex-col gap-3 h-full p-4">
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 shrink-0">
        <MessageSquare className="w-4 h-4 text-[#F5C453]" />
        <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
          Battle Chat
        </span>
        {typingUsers.size > 0 && (
          <span className="text-[10px] text-amber-300 font-mono animate-pulse">
            {[...typingUsers][0]} is typing...
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin pr-1">
        <AnimatePresence>
          {messages.map((msg) => {
            const isMe =
              msg.userId === undefined ||
              msg.message === undefined
                ? false
                : true;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2"
              >
                {!!msg.userPhotoURL && (
                  <img
                    src={msg.userPhotoURL}
                    alt=""
                    className="w-6 h-6 rounded-full object-cover border border-white/10 shrink-0"
                    loading="lazy"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-[#F5C453] truncate max-w-[120px]">
                      {msg.userName}
                    </span>
                    <span className="text-[9px] text-white/30 font-mono">
                      {msg.timestamp ? new Date(msg.timestamp as Date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-white/80 break-words leading-relaxed mt-0.5">
                    {msg.message}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {canChat && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex gap-2 border-t border-white/10 pt-3 shrink-0"
        >
          <input
            ref={inputRef}
            value={pending}
            onChange={(e) => setPending(e.target.value)}
            onInput={(e) => {
              // typing indicator is handled by the parent in a real impl;
              // here we just keep the input focused.
            }}
            placeholder="Chat with your opponent..."
            maxLength={500}
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 font-mono focus:outline-none focus:border-[#F5C453]/50 transition-colors"
          />
          <button
            type="submit"
            disabled={!pending.trim() || sending}
            className="shrink-0 p-2 rounded-xl bg-[#F5C453]/10 border border-[#F5C453]/30 text-[#F5C453] hover:bg-[#F5C453]/20 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      )}
    </GlassCard>
  );
};
