import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { useRoom } from '../context/RoomContext';
import { RoomChatMessage } from '../context/RoomContext';

const RECENT_LIMIT = 50;

export function useRoomChat() {
  const { currentRoom, sendChatMessage } = useRoom();
  const { profile, loading: authLoading } = useAuth();
  const [messages, setMessages] = useState<RoomChatMessage[]>([]);
  const [pending, setPending] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Real-time chat messages from the rooms/{code}/chat subcollection
  useEffect(() => {
    if (!currentRoom || authLoading) return;

    const chatColl = collection(db, `rooms/${currentRoom.roomCode}/chat`);
    const q = query(chatColl, orderBy('timestamp', 'desc'), limit(RECENT_LIMIT));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const msgs = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as RoomChatMessage))
          .sort(
            (a, b) =>
              new Date(a.timestamp as Date).getTime() -
              new Date(b.timestamp as Date).getTime(),
          );
        setMessages(msgs);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `rooms/${currentRoom.roomCode}/chat`);
      },
    );

    return unsub;
  }, [currentRoom, authLoading]);

  const handleSend = useCallback(() => {
    const msg = pending.trim();
    if (!msg) return;
    setPending('');
    setSending(true);
    sendChatMessage(msg).finally(() => setSending(false));
  }, [pending, sendChatMessage]);

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
    [currentRoom, profile?.uid],
  );

  return {
    messages,
    pending,
    setPending,
    sending,
    handleSend,
    handleTyping,
    typingUsers,
    canChat: !!currentRoom && currentRoom.status === 'waiting',
  };
}
