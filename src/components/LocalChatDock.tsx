import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare } from 'lucide-react';
import { InGameMessage } from '../services/chatService';
import { soundManager } from '../utils/audio';
import { InGameChatDrawer } from './InGameChatDrawer';

interface LocalChatDockProps {
  mode: 'ai' | 'local';
  turn: 'w' | 'b';
  botName: string;
  isMuted: boolean;
  onToggleMute: () => void;
}

const WHITE_UID = 'local_white';
const BLACK_UID = 'local_black';
const BOT_UID = 'local_bot';

const BOT_REPLIES = [
  'Interesting choice. 🤔',
  'My turn to punish that. ⚔️',
  'Calculating... ⏳',
  'Bold. I respect it. 👑',
  'You will need more than that. 🔥',
  'Nice one. 🎯',
];

const stamp = () =>
  new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const LocalChatDock: React.FC<LocalChatDockProps> = ({
  mode,
  turn,
  botName,
  isMuted,
  onToggleMute,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<InGameMessage[]>([]);
  const [seenCount, setSeenCount] = useState(0);
  const replyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (isOpen) setSeenCount(messages.length);
  }, [isOpen, messages.length]);

  const myUid = mode === 'ai' ? WHITE_UID : turn === 'w' ? WHITE_UID : BLACK_UID;
  const opponentName = mode === 'ai' ? botName : turn === 'w' ? 'Black' : 'White';

  const appendMessage = useCallback((msg: InGameMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const handleSend = useCallback(
    (text: string, type: 'text' | 'canned' | 'emote') => {
      const senderUid = mode === 'ai' ? WHITE_UID : turn === 'w' ? WHITE_UID : BLACK_UID;
      const senderName =
        mode === 'ai' ? 'You' : turn === 'w' ? 'White' : 'Black';

      appendMessage({
        id: `local_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        senderUid,
        senderName,
        text,
        type,
        timestamp: stamp(),
      });

      if (mode !== 'ai') return;

      if (replyTimeoutRef.current) clearTimeout(replyTimeoutRef.current);
      replyTimeoutRef.current = setTimeout(() => {
        appendMessage({
          id: `bot_${Date.now()}`,
          senderUid: BOT_UID,
          senderName: botName,
          text: BOT_REPLIES[Math.floor(Math.random() * BOT_REPLIES.length)],
          type: 'text',
          timestamp: stamp(),
        });
        if (!isMuted) soundManager.playChat();
      }, 900 + Math.random() * 900);
    },
    [appendMessage, botName, isMuted, mode, turn]
  );

  const unread = useMemo(
    () => Math.max(0, messages.length - seenCount),
    [messages.length, seenCount]
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(open => !open)}
        aria-expanded={isOpen}
        className="relative w-full min-h-[44px] px-4 rounded-2xl obsidian-panel flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#94A3B8] hover:text-white hover:border-[#F59E0B]/40 transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <MessageSquare className="w-4 h-4 text-[#F59E0B]" />
          {mode === 'ai' ? 'Match Chat' : 'Table Talk'}
        </span>
        <span className="flex items-center gap-2 normal-case tracking-normal text-[10px] font-mono text-[#64748B]">
          {mode === 'ai' ? `vs ${botName}` : turn === 'w' ? 'White to speak' : 'Black to speak'}
          {unread > 0 && (
            <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#F59E0B] text-black text-[10px] font-black flex items-center justify-center">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </span>
      </button>

      <InGameChatDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        gameId="local"
        myUid={myUid}
        opponentName={opponentName}
        messages={messages}
        onSendMessage={handleSend}
        isMuted={isMuted}
        onToggleMute={onToggleMute}
        typingMap={{}}
        onTyping={() => {}}
      />
    </>
  );
};
