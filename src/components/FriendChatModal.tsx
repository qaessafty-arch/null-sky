import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { FriendUser, DirectMessageItem, TimeControl } from '../types/chess';
import { TIME_CONTROLS } from '../utils/chessEngine';
import { getChatId, sendDirectMessage, listenToDirectMessages } from '../services/chatService';
import { acceptOnlineMatchChallenge, createOnlineMatchChallenge } from '../services/onlineMatchService';
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
  ChevronDown
} from 'lucide-react';

interface FriendChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: FriendUser | null;
  onStartOnlineMatch: (matchId: string) => void;
}

const QUICK_EMOTES = [
  '☀️ Honor to you, Grandmaster!',
  '⚔️ Ready for a 5-minute Blitz battle?',
  '♟️ Checkmate incoming on the f7 square!',
  '🏔️ The Zagros mountains will defend my King!',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-3 sm:p-4 animate-in fade-in">
      <div className="relative glass-panel rounded-3xl p-4 sm:p-6 max-w-lg w-full border border-[#F5C453]/40 shadow-2xl overflow-hidden flex flex-col h-[600px] max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              {friend.photoURL ? (
                <img
                  src={friend.photoURL}
                  alt={friend.displayName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-[#F5C453]"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#161c12] border-2 border-[#F5C453] flex items-center justify-center font-black text-sm text-[#F5C453]">
                  {friend.displayName.charAt(0)}
                </div>
              )}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#161c12]" />
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white">{friend.displayName}</span>
                {friend.username && (
                  <span className="text-[11px] font-mono text-[#F5C453]">@{friend.username}</span>
                )}
              </div>
              <div className="text-[10px] text-[#DFD0B0]/70">
                {friend.rankBadge} {friend.honorRank} • <span className="text-emerald-400 font-mono font-bold">{friend.elo} Elo</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowChallengeMenu(!showChallengeMenu)}
              className="px-3 py-1.5 rounded-xl bg-[#8C2425] hover:bg-[#8C2425]/80 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-[#F5C453]/40 shadow-sm"
              title="Issue Chess Challenge"
            >
              <Swords className="w-3.5 h-3.5 text-[#F5C453]" />
              <span>Challenge</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-white/50 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
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
                    <div>{msg.text}</div>

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

        {/* Quick Taunt / Emote Bar */}
        <div className="py-2 border-t border-white/10 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {QUICK_EMOTES.map((emote, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(emote)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer border border-white/5 shrink-0"
            >
              {emote}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="pt-2 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={`Message ${friend.displayName}...`}
            className="flex-1 px-3.5 py-2.5 bg-black/60 border border-white/15 rounded-2xl text-xs text-white placeholder:text-white/40 focus:outline-none focus:border-[#F5C453]"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-2.5 rounded-2xl bg-[#52673A] hover:bg-[#52673A]/80 disabled:opacity-40 text-white transition-all cursor-pointer shrink-0 border border-[#F5C453]/30 shadow-md"
          >
            <Send className="w-4 h-4 text-[#F5C453]" />
          </button>
        </form>
      </div>
    </div>
  );
};
