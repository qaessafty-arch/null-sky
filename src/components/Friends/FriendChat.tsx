import React, { useState, useEffect, useRef } from 'react';
import { FriendUser, DirectMessageItem } from '../../types/chess';
import { getChatId, sendDirectMessage, listenToDirectMessages } from '../../services/chatService';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Send, X, Swords, Smile, Check, Shield } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface FriendChatProps {
  friend: FriendUser;
  onClose: () => void;
  onChallenge: (friend: FriendUser) => void;
}

const QUICK_EMOJIS = ['⚔️', '♟️', '👑', '🔥', '🏆', '👏', '🤝', '😎'];

export const FriendChat: React.FC<FriendChatProps> = ({
  friend,
  onClose,
  onChallenge
}) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<DirectMessageItem[]>([]);
  const [text, setText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showEmojiBar, setShowEmojiBar] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatId = profile?.uid && friend.uid ? getChatId(profile.uid, friend.uid) : '';

  useEffect(() => {
    if (!chatId) return;
    const unsub = listenToDirectMessages(chatId, msgs => {
      setMessages(msgs);
    });
    return () => {
      if (unsub) unsub();
    };
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (messageToSend?: string) => {
    const payload = (messageToSend || text).trim();
    if (!payload || !profile || isSending) return;

    setIsSending(true);
    try {
      await sendDirectMessage(chatId, {
        senderId: profile.uid,
        senderName: profile.displayName || 'Tactician',
        senderAvatar: profile.photoURL || undefined,
        senderBadge: profile.rankBadge || '☀️',
        text: payload
      });
      if (!messageToSend) setText('');
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px] glass-card-subtle rounded-3xl border border-white/10 overflow-hidden">
      {/* Chat Header */}
      <div className="p-3.5 bg-black/40 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative">
            {friend.photoURL ? (
              <img
                src={friend.photoURL}
                alt={friend.displayName}
                className="w-9 h-9 rounded-full object-cover border border-[#F5C453]"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#52673A] border border-[#F5C453] flex items-center justify-center font-black text-xs text-white">
                {friend.displayName ? friend.displayName.charAt(0).toUpperCase() : 'T'}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5">
              <StatusBadge isOnline={friend.isOnline ?? true} size="sm" />
            </div>
          </div>

          <div className="min-w-0">
            <h4 className="text-xs font-black text-white truncate">{friend.displayName}</h4>
            <div className="text-[10px] text-white/50 flex items-center gap-1">
              <span>{friend.elo} Elo</span>
              <span>•</span>
              <StatusBadge isOnline={friend.isOnline ?? true} size="sm" showLabel />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onChallenge(friend)}
            className="p-1.5 rounded-xl bg-[#8C2425]/60 hover:bg-[#8C2425] text-white text-xs font-bold flex items-center gap-1 border border-[#F5C453]/30 cursor-pointer"
            title="Challenge to Chess Match"
          >
            <Swords className="w-3.5 h-3.5 text-[#F5C453]" />
            <span className="hidden sm:inline">Play</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 p-3.5 overflow-y-auto space-y-2.5 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-white/40 space-y-2">
            <MessageSquare className="w-8 h-8 text-white/20" />
            <p className="text-xs">No direct messages yet. Send a greeting or challenge to battle!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isSelf = msg.senderId === profile?.uid;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                    isSelf ? 'glass-chat-bubble-self text-white' : 'glass-chat-bubble-peer text-white/90'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <span className="text-[9px] text-white/40 mt-0.5 px-1 font-mono">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Bar */}
      {showEmojiBar && (
        <div className="px-3 py-1.5 bg-black/40 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto">
          {QUICK_EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleSend(emoji)}
              className="text-base hover:scale-125 transition-transform p-1 cursor-pointer"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input */}
      <div className="p-2.5 bg-black/50 border-t border-white/10 flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => setShowEmojiBar(prev => !prev)}
          className={`p-2 rounded-xl text-white/50 hover:text-white transition-colors cursor-pointer ${
            showEmojiBar ? 'bg-white/10 text-white' : ''
          }`}
        >
          <Smile className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSend();
          }}
          placeholder="Type message..."
          className="flex-1 bg-black/40 border border-white/10 focus:border-[#F5C453] rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none"
        />

        <button
          type="button"
          onClick={() => handleSend()}
          disabled={!text.trim() || isSending}
          className="p-2 rounded-xl bg-[#52673A] hover:bg-[#52673A]/80 disabled:opacity-40 text-white transition-all cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
