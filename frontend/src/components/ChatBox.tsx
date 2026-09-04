// FILE: frontend/src/components/ChatBox.tsx
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Smile } from 'lucide-react';
import { Socket } from 'socket.io-client';

interface ChatMessage {
  id?: string;
  username: string;
  userId?: string;
  message: string;
  timestamp: string | number;
  isSystem?: boolean;
}

interface ChatBoxProps {
  socket: Socket | null;
  gameId: string;
  currentUsername: string;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ socket, gameId, currentUsername }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { username: 'System', message: 'Game room connected. Be respectful and have fun!', timestamp: Date.now(), isSystem: true }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [opponentTyping, setOpponentTyping] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<any>(null);

  useEffect(() => {
    if (!socket || !gameId) return;

    const handleNewMessage = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    };

    const handlePlayerTyping = ({ playerId, isTyping: typing }: { playerId: string; isTyping: boolean }) => {
      if (typing) {
        setOpponentTyping('Opponent is typing...');
      } else {
        setOpponentTyping(null);
      }
    };

    socket.on('newMessage', handleNewMessage);
    socket.on('playerTyping', handlePlayerTyping);

    return () => {
      socket.off('newMessage', handleNewMessage);
      socket.off('playerTyping', handlePlayerTyping);
    };
  }, [socket, gameId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, opponentTyping]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);

    if (socket && gameId) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('sendTyping', { gameId, isTyping: true });
      }

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        socket.emit('sendTyping', { gameId, isTyping: false });
      }, 1500);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const message = inputText.trim();

    // Check for chat /commands
    if (message === '/resign' && socket) {
      socket.emit('resign', { gameId });
    } else if (message === '/draw' && socket) {
      socket.emit('offerDraw', { gameId });
    } else if (message === '/help') {
      setMessages(prev => [
        ...prev,
        { username: 'System', message: 'Commands available: /draw, /resign', timestamp: Date.now(), isSystem: true }
      ]);
    } else if (socket) {
      socket.emit('sendMessage', { gameId, message });
    }

    setInputText('');
    if (socket && gameId && isTyping) {
      setIsTyping(false);
      socket.emit('sendTyping', { gameId, isTyping: false });
    }
  };

  const sendQuickReaction = (emoji: string) => {
    if (socket && gameId) {
      socket.emit('sendMessage', { gameId, message: emoji });
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col h-full text-slate-200">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <MessageSquare className="w-4 h-4 text-emerald-500" />
          Game Chat
        </div>
        <div className="flex gap-1">
          {['👍', '🔥', '👏', '😮'].map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => sendQuickReaction(emoji)}
              className="text-xs p-1 rounded hover:bg-slate-800 transition-colors"
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
        {messages.map((m, idx) => {
          const isMe = m.username === currentUsername;
          return (
            <div
              key={idx}
              className={`p-2 rounded-lg max-w-[85%] ${
                m.isSystem
                  ? 'bg-slate-850/80 border border-slate-750 text-slate-400 text-[11px] mx-auto text-center w-full'
                  : isMe
                  ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 ml-auto'
                  : 'bg-slate-800/80 border border-slate-700 text-slate-200 mr-auto'
              }`}
            >
              {!m.isSystem && (
                <div className="text-[10px] font-bold text-slate-400 mb-0.5">{m.username}</div>
              )}
              <div className="break-words">{m.message}</div>
            </div>
          );
        })}
        {opponentTyping && (
          <div className="text-[11px] text-slate-500 italic px-2 animate-pulse">
            {opponentTyping}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="mt-3 flex gap-2 pt-2 border-t border-slate-800">
        <input
          type="text"
          value={inputText}
          onChange={handleInputChange}
          placeholder="Send a message (or /help)..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white rounded-lg transition-colors"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
