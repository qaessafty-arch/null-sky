import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import { db } from '../utils/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { FriendUser, DirectMessageItem, TimeControl } from '../types/chess';
import { TIME_CONTROLS } from '../utils/chessEngine';
import { getChatId, sendDirectMessage, listenToDirectMessages } from '../services/chatService';
import { acceptOnlineMatchChallenge, createOnlineMatchChallenge } from '../services/onlineMatchService';
import { StickerPicker } from './StickerPicker';
import { 
  MessageSquare, 
  Send, 
  Swords, 
  X, 
  Sun, 
  Shield, 
  Clock, 
  Sparkles, 
  Check,
  ChevronDown,
  Plus
} from 'lucide-react';

interface FriendChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: FriendUser | null;
  onStartOnlineMatch: (matchId: string) => void;
}

const QUICK_EMOTES = [
  'shakh shakh',
  'sacraficeeeeeeeeeee the.............',
  "nah i'd win",
  'kodiiiiiiii',
  'Want a rematch? ⚔️',
  '☀️ Honor to you, Grandmaster!',
  '♟️ Checkmate incoming!',
  '💎 Brilliant move, well played!'
];

export const FriendChatModal: React.FC<FriendChatModalProps> = ({
  isOpen,
  onClose,
  friend,
  onStartOnlineMatch
}) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<DirectMessageItem[]>([]);
  const [inputText, setInputText] = useState('');
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showChallengeMenu, setShowChallengeMenu] = useState(false);
  const [selectedTimeControl, setSelectedTimeControl] = useState<TimeControl>(TIME_CONTROLS[2]); // Blitz 5 min

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatId = profile?.uid && friend?.uid ? getChatId(profile.uid, friend.uid) : '';

  // Listen to messages in real-time
  useEffect(() => {
    if (!isOpen || !chatId) return;

    const unsub = listenToDirectMessages(chatId, msgs => {
      setMessages(msgs);
    });

    return () => {
      if (unsub) unsub();
    };
  }, [isOpen, chatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen || !friend || !profile) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isSending) return;

    setIsSending(true);
    try {
      await sendDirectMessage(chatId, {
        senderId: profile.uid,
        senderName: profile.displayName || 'Tactician',
        senderAvatar: profile.photoURL || undefined,
        senderBadge: profile.rankBadge || '☀️',
        text
      });
      if (!textToSend) setInputText('');
    } catch (e) {
      console.error('Failed to send message:', e);
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMatchChallenge = async () => {
    if (!profile || !friend) return;
    try {
      const matchId = await createOnlineMatchChallenge(
        {
          uid: profile.uid,
          displayName: profile.displayName || 'Tactician',
          username: profile.username,
          photoURL: profile.photoURL || undefined,
          elo: typeof profile.elo === 'number' ? profile.elo : parseInt(profile.elo || '1200', 10),
          respectPoints: typeof profile.respectPoints === 'number' ? profile.respectPoints : parseInt(profile.respectPoints || '100', 10),
          honorRank: profile.honorRank,
          rankBadge: profile.rankBadge
        },
        friend,
        selectedTimeControl,
        'random'
      );

      if (matchId) {
        // Send challenge message in chat
        await sendDirectMessage(chatId, {
          senderId: profile.uid,
          senderName: profile.displayName || 'Tactician',
          senderAvatar: profile.photoURL || undefined,
          senderBadge: profile.rankBadge || '☀️',
          text: `⚔️ Issued an Online Match Challenge (${selectedTimeControl.name})!`,
          challengeData: {
            matchId,
            timeControlName: selectedTimeControl.name,
            timeControlSeconds: selectedTimeControl.initialSeconds,
            challengerColor: 'random',
            status: 'pending'
          }
        });

        setShowChallengeMenu(false);
        onStartOnlineMatch(matchId);
      }
    } catch (e) {
      console.error('Error challenging friend:', e);
    }
  };

  const handleAcceptChallengeFromMessage = async (matchId: string) => {
    // Flip the challenge from "waiting" to "in_progress" before entering it,
    // otherwise the clocks never start for the challenger.
    await acceptOnlineMatchChallenge(matchId);
    onStartOnlineMatch(matchId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="relative obsidian-panel rounded-3xl p-4 sm:p-6 max-w-lg w-full border border-[#1F293D] shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1F293D] shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              {friend.photoURL ? (
                <img
                  src={friend.photoURL}
                  alt={friend.displayName}
                  className="w-12 h-12 rounded-2xl object-cover border border-[#F59E0B] shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-[#0B0F19] border border-[#F59E0B] flex items-center justify-center font-black text-lg text-[#F59E0B]">
                  {friend.displayName.charAt(0)}
                </div>
              )}
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#10B981] border-2 border-[#111827] shadow-xl" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-black text-white uppercase tracking-tight">{friend.displayName}</span>
                {friend.username && (
                  <span className="text-[10px] font-black text-[#F59E0B] uppercase tracking-tighter opacity-70">@{friend.username}</span>
                )}
              </div>
              <div className="text-[9px] font-black uppercase text-[#94A3B8] tracking-widest flex items-center gap-2">
                <span>{friend.honorRank}</span>
                <span className="w-1 h-1 bg-[#1F293D] rounded-full" />
                <span className="text-[#10B981]">{friend.elo} RATING</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowChallengeMenu(!showChallengeMenu)}
              className="w-10 h-10 rounded-xl bg-[#111827] hover:bg-[#1F293D] text-[#F59E0B] transition-all border border-[#1F293D] active:scale-95 flex items-center justify-center cursor-pointer shadow-lg"
              title="Issue Chess Challenge"
            >
              <Swords className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-[#111827] hover:bg-[#1F293D] text-[#94A3B8] transition-all border border-[#1F293D] active:scale-95 flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Challenge Selector Popover */}
        {showChallengeMenu && (
          <div className="p-3.5 rounded-2xl bg-[#161c12] border border-[#F5C453]/50 my-2 shrink-0 animate-in slide-in-from-top-2 shadow-xl">
            <div className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
              <Swords className="w-4 h-4 text-[#F5C453]" />
              <span>Select Match Time Control:</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {TIME_CONTROLS.slice(0, 6).map(tc => (
                <button
                  key={tc.id}
                  type="button"
                  onClick={() => setSelectedTimeControl(tc)}
                  className={`p-2 rounded-xl text-left border text-xs transition-all cursor-pointer ${
                    selectedTimeControl.id === tc.id
                      ? 'bg-[#52673A] border-[#F5C453] text-white font-bold shadow-md'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <div className="font-bold">{tc.name}</div>
                  <div className="text-[10px] text-white/50">{tc.category}</div>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSendMatchChallenge}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-[#8C2425] to-[#52673A] text-white font-black text-xs flex items-center justify-center gap-2 hover:scale-[1.01] transition-all cursor-pointer shadow-md border border-[#F5C453]/40"
            >
              <Swords className="w-4 h-4 text-[#F5C453]" />
              <span>Launch Match Challenge Now</span>
            </button>
          </div>
        )}

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-xs text-[#DFD0B0]/60 space-y-2">
              <div className="text-2xl">💬</div>
              <p>Start a conversation with {friend.displayName} or challenge them to an online duel!</p>
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.senderId === profile.uid;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} space-y-1`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-white/40 px-1">
                    <span>{msg.senderName}</span>
                    <span>•</span>
                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                      isMine
                        ? 'bg-gradient-to-r from-[#52673A] to-[#3f502d] text-white rounded-tr-sm border border-[#F5C453]/30 shadow-md'
                        : 'bg-[#1e2719] text-[#FDFCF7] rounded-tl-sm border border-white/10'
                    }`}
                  >
                    {(() => {
                      const stickerRegex = /\[STICKER:(https?:\/\/[^\]]+)\]/g;
                      const hasSticker = stickerRegex.test(msg.text);
                      
                      if (hasSticker) {
                        const sanitized = DOMPurify.sanitize(msg.text.replace(stickerRegex, '<img src="$1" alt="sticker" class="w-16 h-16 object-contain inline-block my-1" />'));
                        return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
                      }
                      return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.text) }} />;
                    })()}

                    {/* Challenge Card in Chat */}
                    {msg.challengeData && (
                      <div className="mt-2.5 p-2.5 rounded-xl bg-black/40 border border-[#F5C453]/40 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <Swords className="w-4 h-4 text-[#F5C453]" />
                          <span className="text-xs font-bold text-white">
                            {msg.challengeData.timeControlName} Match
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleAcceptChallengeFromMessage(msg.challengeData!.matchId)}
                          className="px-3 py-1 rounded-lg bg-[#8C2425] hover:bg-[#8C2425]/80 text-white font-bold text-[11px] transition-all cursor-pointer border border-[#F5C453]/30"
                        >
                          Join Match
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Taunt / Emote / Sticker Bar */}
        <div className="py-2 border-t border-white/10 shrink-0">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#F5C453]">Text Reactions</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar min-h-[44px]">
            {QUICK_EMOTES.map((emote, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(emote)}
                className="px-2.5 py-1.5 min-h-[36px] rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer border border-white/5 shrink-0"
              >
                {emote}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Bar */}
        <div className="relative pt-2 shrink-0">
          <AnimatePresence>
            {showStickerPicker && (
              <StickerPicker 
                onSelect={(url) => {
                  handleSendMessage(`[STICKER:${url}]`);
                }}
                onClose={() => setShowStickerPicker(false)}
              />
            )}
          </AnimatePresence>
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={() => setShowStickerPicker(!showStickerPicker)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border active:scale-95 ${showStickerPicker ? 'bg-[#1F293D] border-[#F59E0B] text-[#F59E0B]' : 'bg-[#0B0F19] border-[#1F293D] text-[#94A3B8] hover:text-white'}`}
            >
              <Plus className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              placeholder={`Message ${friend.displayName}...`}
              className="flex-1 obsidian-input"
            />
            <button
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="w-10 h-10 rounded-xl bg-[#F59E0B] hover:brightness-110 disabled:opacity-40 text-[#0B0F19] transition-all cursor-pointer shrink-0 active:scale-95 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.3)]"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
