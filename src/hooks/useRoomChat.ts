import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { useRoom, RoomChatMessage } from '../context/RoomContext';

const RECENT_LIMIT = 50;

export function useRoomChat() {
  const { currentRoom, sendChatMessage } = useRoom();
  const { profile, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<RoomChatMessage[]>([]);
  const [pending, setPending] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Real-time chat messages from the rooms/{code}/chat subcollection OR room.chat array
  useEffect(() => {
    if (!currentRoom?.roomCode || authLoading) return;

    // First use denormalized chat array if available
    if (currentRoom.chat && currentRoom.chat.length > 0) {
      setMessages(currentRoom.chat);
    }

    const chatColl = collection(db, `rooms/${currentRoom.roomCode}/chat`);
    const q = query(chatColl, orderBy('timestamp', 'asc'), limit(RECENT_LIMIT));

    const unsub = onSnapshot(
      q,
      (snap) => {
        if (!snap.empty) {
          const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as RoomChatMessage));
          setMessages(msgs);
        } else if (currentRoom.chat && currentRoom.chat.length > 0) {
          setMessages(currentRoom.chat);
        }
      },
      (err) => {
        // If subcollection read fails or doesn't exist, fall back to denormalized array
        if (currentRoom.chat) {
          setMessages(currentRoom.chat);
        }
      }
    );

    return () => unsub();
  }, [currentRoom?.roomCode, currentRoom?.chat, authLoading]);

  const handleSend = useCallback(async () => {
    const msg = pending.trim();
    if (!msg || sending) return;
    setPending('');
    setSending(true);
    try {
      await sendChatMessage(msg);
    } finally {
      setSending(false);
    }
  }, [pending, sending, sendChatMessage]);

  const handleTyping = useCallback(
    (uid: string, name: string) => {
      if (!currentRoom || uid === profile?.uid) return;
      setTypingUsers((prev) => new Set(prev).add(name));

      const prev = typingTimers.current.get(uid);
      if (prev) clearTimeout(prev);

      const t = setTimeout(() => {
        setTypingUsers((prevSet) => {
          const next = new Set(prevSet);
          next.delete(name);
          return next;
        });
        typingTimers.current.delete(uid);
      }, 2500);
      typingTimers.current.set(uid, t);
    },
    [currentRoom, profile?.uid]
  );

  return {
    messages,
    pending,
    setPending,
    sending,
    handleSend,
    handleTyping,
    typingUsers,
    canChat: !!currentRoom && currentRoom.status !== 'ended' && currentRoom.status !== 'expired',
  };
}
