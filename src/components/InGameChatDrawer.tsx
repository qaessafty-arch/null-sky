import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Volume2, 
  VolumeX, 
  X, 
  Sparkles, 
  Smile, 
  ChevronDown,
  Clock,
  Zap,
  Flame,
  Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sanitizeChatText } from '../utils/security';
import { InGameMessage } from '../services/chatService';
import { soundManager } from '../utils/audio';

interface InGameChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  myUid: string;
  opponentName: string;
  opponentUid?: string;
  messages: InGameMessage[];
  onSendMessage: (text: string, type: 'text' | 'canned' | 'emote') => void;
  isMuted: boolean;
  onToggleMute: () => void;
  typingMap: Record<string, boolean>;
  onTyping: (isTyping: boolean) => void;
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

export const InGameChatDrawer: React.FC<InGameChatDrawerProps> = ({
  isOpen,
  onClose,
  gameId,
  myUid,
  opponentName,
  opponentUid,
  messages,
  onSendMessage,
  isMuted,
  onToggleMute,
  typingMap,
  onTyping
}) => {
  const [inputText, setInputText] = useState('');
  const [showAutoScrollPill, setShowAutoScrollPill] = useState(false);
  const [lastSentTime, setLastSentTime] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isOpponentTyping = opponentUid ? typingMap[opponentUid] : false;

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
    setShowAutoScrollPill(false);
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom('auto');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!showAutoScrollPill) {
      scrollToBottom();
    }
  }, [messages]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    setShowAutoScrollPill(!isAtBottom);
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    const now = Date.now();
    if (now - lastSentTime < 1500) {
      setIsRateLimited(true);
      setTimeout(() => setIsRateLimited(false), 1500);
      return;
    }

    const sanitized = sanitizeChatText(inputText.trim());
    if (!sanitized) return;

    onSendMessage(sanitized, 'text');
    soundManager.playChat();
    setInputText('');
    setLastSentTime(now);
    onTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleInputChange = (val: string) => {
    setInputText(val);
    onTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => onTyping(false), 3000);
  };

  const handleCannedPhrase = (phrase: string) => {
    onSendMessage(phrase, 'canned');
    soundManager.playChat();
  };

  const handleEmote = (emote: string) => {
    onSendMessage(emote, 'emote');
    soundManager.playEmote();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="fixed inset-y-0 right-0 z-50 w-full max-w-sm bg-[#111827]/85 backdrop-blur-xl border-l border-[#1F293D] shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-[#1F293D] flex items-center justify-between shrink-0 bg-[#0B0F19]/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0B0F19] border border-[#F59E0B]/30 flex items-center justify-center text-[#F59E0B]">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-tight">Match Chat</h3>
                <div className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${isOpponentTyping ? 'bg-[#F59E0B] animate-pulse' : 'bg-emerald-500'}`} />
                  <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    {isOpponentTyping ? 'Opponent is typing...' : `VS ${opponentName}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onToggleMute}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all active:scale-95 border ${
                  isMuted ? 'bg-rose-500/20 border-rose-500/40 text-rose-400' : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white transition-all active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div 
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar scroll-smooth"
          >
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 space-y-3">
                <Smile className="w-10 h-10 text-[#F59E0B]" />
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-white">No Transmissions</p>
                  <p className="text-[10px] text-[#94A3B8]">Start the tactical dialogue</p>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderUid === myUid;
                const isSystem = msg.type === 'system';

                if (isMuted && !isMe && !isSystem) return null;

                if (isSystem) {
                  return (
                    <div key={msg.id || idx} className="flex justify-center">
                      <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                        {msg.text}
                      </span>
                    </div>
                  );
                }

                return (
                  <motion.div
                    key={msg.id || idx}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div
                      className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm transition-all shadow-lg ${
                        isMe
                          ? 'bg-[#F59E0B] text-black rounded-br-xs font-bold shadow-[#F59E0B]/10'
                          : 'bg-[#1F293D] text-white rounded-bl-xs border border-white/5 shadow-black/40'
                      }`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[9px] font-black text-white/30 px-1 uppercase">
                      {msg.timestamp}
                    </span>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Auto-scroll Pill */}
          <AnimatePresence>
            {showAutoScrollPill && (
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                onClick={() => scrollToBottom()}
                className="absolute bottom-32 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-full bg-[#F59E0B] text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-xl active:scale-95 transition-transform"
              >
                <ChevronDown className="w-3 h-3" />
                New Messages
              </motion.button>
            )}
          </AnimatePresence>

          {/* Input Area */}
          <div className="p-4 bg-[#0B0F19]/80 border-t border-[#1F293D] space-y-4 shrink-0">
            {/* Emotes Bar */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {EMOTES.map((emote) => (
                <button
                  key={emote}
                  onClick={() => handleEmote(emote)}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg hover:bg-[#F59E0B]/20 hover:border-[#F59E0B]/40 transition-all active:scale-90"
                >
                  {emote}
                </button>
              ))}
            </div>

            {/* Canned Phrases */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {CANNED_PHRASES.map((phrase) => (
                <button
                  key={phrase}
                  onClick={() => handleCannedPhrase(phrase)}
                  className="px-3 py-1.5 rounded-full bg-[#1F293D]/80 hover:bg-[#F59E0B]/20 hover:border-[#F59E0B]/50 border border-white/5 text-[10px] font-bold text-slate-200 hover:text-white transition-all shrink-0 active:scale-95 uppercase tracking-wider"
                >
                  {phrase}
                </button>
              ))}
            </div>

            {/* Text Input */}
            <form onSubmit={handleSend} className="relative flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Transmit tactical message..."
                  maxLength={250}
                  className="w-full bg-[#0B0F19] border border-[#1F293D] focus:border-[#F59E0B] rounded-xl pl-4 pr-12 py-3 text-white placeholder:text-slate-500 text-sm outline-none transition-colors"
                />
                {inputText.length > 200 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-[#F59E0B]">
                    {250 - inputText.length}
                  </span>
                )}
              </div>
              <button
                type="submit"
                disabled={!inputText.trim() || isRateLimited}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all active:scale-95 shadow-xl ${
                  isRateLimited 
                    ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' 
                    : 'bg-gradient-to-r from-amber-500 to-[#F59E0B] text-black font-black border border-white/10'
                }`}
              >
                {isRateLimited ? <Clock className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
