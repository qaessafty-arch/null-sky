import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Smile, 
  Volume2, 
  VolumeX, 
  Clock,
  MessageSquare
} from 'lucide-react';
import { InGameMessage } from '../services/chatService';
import { soundManager } from '../utils/audio';
import { sanitizeChatText } from '../utils/security';
import { GlassButton } from './GlassButton';

interface InGameChatPanelProps {
  messages: InGameMessage[];
  onSendMessage: (text: string, type: 'text' | 'canned' | 'emote') => void;
  myUid: string;
  opponentName: string;
  isMuted: boolean;
  onToggleMute: () => void;
  typingMap?: Record<string, boolean>;
  opponentUid?: string;
  onTyping?: (isTyping: boolean) => void;
}

const CANNED_PHRASES = [
  "kodiiiiiiiiiiii ☀️🔥",
  "NAH I'D WIN!! 👑⚡",
  "sacraficeeeeeeee the .......... ♟️💥",
  "Good luck! 🍀",
  "Good game! 🤝",
  "Nice move! 🎯",
  "Oops! 😅",
  "Thinking... ⏳",
  "Rematch? ⚔️"
];

const EMOTES = ['🔥', '👏', '🤯', '😂', '💀', '🏆', '☀️'];

export const InGameChatPanel: React.FC<InGameChatPanelProps> = ({
  messages,
  onSendMessage,
  myUid,
  opponentName,
  isMuted,
  onToggleMute,
  typingMap = {},
  opponentUid,
  onTyping
}) => {
  const [inputText, setInputText] = useState('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [lastSentTime, setLastSentTime] = useState(0);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const now = Date.now();
    if (now - lastSentTime < 1000) {
      setIsRateLimited(true);
      setTimeout(() => setIsRateLimited(false), 1000);
      return;
    }

    const sanitized = sanitizeChatText(inputText.trim());
    if (!sanitized) return;

    onSendMessage(sanitized, 'text');
    if (!isMuted) soundManager.playChat();
    setInputText('');
    setLastSentTime(now);
    if (onTyping) onTyping(false);
  };

  const handleInputChange = (val: string) => {
    setInputText(val);
    if (onTyping) {
      onTyping(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => onTyping(false), 3000);
    }
  };

  const handleEmote = (emote: string) => {
    onSendMessage(emote, 'emote');
    if (!isMuted) soundManager.playEmote();
  };

  const handleCanned = (phrase: string) => {
    onSendMessage(phrase, 'canned');
    if (!isMuted) soundManager.playChat();
  };

  const isOpponentTyping = opponentUid ? typingMap[opponentUid] : false;

  return (
    <div className="flex flex-col h-full obsidian-panel rounded-3xl border border-white/5 overflow-hidden">
      {/* Mini Header */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between bg-black/20">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[var(--secondary-accent)]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-white">Live Transmission</span>
        </div>
        <button
          onClick={onToggleMute}
          className={`p-1.5 rounded-lg transition-colors ${isMuted ? 'text-rose-400 bg-rose-500/10' : 'text-[#94A3B8] hover:text-white'}`}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-30 space-y-2">
            <Smile className="w-8 h-8 text-[var(--secondary-accent)]" />
            <p className="text-[9px] font-black uppercase tracking-widest">Quiet in the Arena</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderUid === myUid;
            const isSystem = msg.type === 'system';

            if (isSystem) {
              return (
                <div key={msg.id || idx} className="flex justify-center">
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-[9px] font-bold text-[#94A3B8] uppercase">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <motion.div
                key={msg.id || idx}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                {!isMe && (
                  <span className="text-[8px] font-black uppercase tracking-widest text-[#64748B] px-1">
                    {msg.senderName}
                  </span>
                )}
                <div
                  className={`max-w-[90%] px-3 py-2 rounded-2xl text-[11px] font-medium leading-tight shadow-md ${
                    isMe
                      ? 'bg-[var(--secondary-accent)] text-black rounded-br-xs'
                      : 'bg-[var(--glass-bg)] text-white border border-white/5 rounded-bl-xs'
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      {isOpponentTyping && (
        <div className="px-4 py-1 flex items-center gap-1.5">
          <div className="flex gap-0.5">
            <span className="w-1 h-1 rounded-full bg-[var(--secondary-accent)] animate-bounce" />
            <span className="w-1 h-1 rounded-full bg-[var(--secondary-accent)] animate-bounce [animation-delay:0.2s]" />
            <span className="w-1 h-1 rounded-full bg-[var(--secondary-accent)] animate-bounce [animation-delay:0.4s]" />
          </div>
          <span className="text-[8px] font-black uppercase text-[var(--secondary-accent)]">{opponentName} is transmitting...</span>
        </div>
      )}

      {/* Quick Actions & Input */}
      <div className="p-3 bg-black/40 border-t border-white/5 space-y-3">
        {/* Emotes */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {EMOTES.map(emote => (
            <button
              key={emote}
              onClick={() => handleEmote(emote)}
              className="shrink-0 w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-sm hover:bg-[var(--secondary-accent)]/20 transition-all active:scale-90"
            >
              {emote}
            </button>
          ))}
        </div>

        {/* Canned */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {CANNED_PHRASES.map(phrase => (
            <button
              key={phrase}
              onClick={() => handleCanned(phrase)}
              className="shrink-0 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-wider text-[#94A3B8] hover:text-white hover:bg-[var(--secondary-accent)]/20 transition-all"
            >
              {phrase}
            </button>
          ))}
        </div>

        {/* Text Input */}
        <form onSubmit={handleSend} className="relative flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Tactical msg..."
            className="flex-1 bg-black/40 border border-white/10 focus:border-[var(--secondary-accent)]/50 rounded-xl px-3 py-2 text-[11px] text-white outline-none transition-all"
            maxLength={100}
          />
          <GlassButton
            type="submit"
            disabled={!inputText.trim() || isRateLimited}
            className="!w-9 !h-9 !p-0 !rounded-xl"
            variant="primary"
          >
            {isRateLimited ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </GlassButton>
        </form>
      </div>
    </div>
  );
};
