import { 
  collection, 
  doc, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  getDocs,
  setDoc,
  updateDoc,
  Timestamp
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { DirectMessageItem } from '../types/chess';

// --- Direct Messages (Private Friends Chat) ---

// Derives a deterministic Chat ID for any two users
export const getChatId = (uid1: string, uid2: string): string => {
  return [uid1, uid2].sort().join('_');
};

// Send a private direct message
export const sendDirectMessage = async (
  chatId: string,
  message: {
    senderId: string;
    senderName: string;
    senderAvatar?: string;
    senderBadge?: string;
    text: string;
    challengeData?: any;
  }
): Promise<string | null> => {
  try {
    const messagesRef = collection(db, `direct_messages/${chatId}/messages`);
    const docRef = await addDoc(messagesRef, {
      ...message,
      createdAt: new Date().toISOString()
    });

    // Update the parent chat metadata
    await setDoc(doc(db, 'direct_messages', chatId), {
      lastMessage: message.text,
      lastMessageTime: new Date().toISOString(),
      senderId: message.senderId
    }, { merge: true });

    return docRef.id;
  } catch (e) {
    console.error('Error sending direct message:', e);
    return null;
  }
};

// Listen to private messages in real-time
export const listenToDirectMessages = (
  chatId: string,
  callback: (messages: DirectMessageItem[]) => void
) => {
  if (!chatId) return () => {};

  try {
    const q = query(
      collection(db, `direct_messages/${chatId}/messages`),
      orderBy('createdAt', 'asc'),
      limit(100)
    );

    const unsub = onSnapshot(q, snap => {
      const msgs: DirectMessageItem[] = snap.docs.map(d => ({
        id: d.id,
        chatId,
        ...d.data()
      } as DirectMessageItem));
      callback(msgs);
    }, err => {
      console.warn('Direct messages listener error:', err);
    });

    return unsub;
  } catch (e) {
    console.error('Failed to listen to messages:', e);
    return () => {};
  }
};

// --- In-Game Match Chat (Live Arena Chat) ---

export interface InGameMessage {
  id: string;
  senderUid: string;
  senderName: string;
  text: string;
  type: 'text' | 'canned' | 'emote' | 'system';
  timestamp: any; // serverTimestamp
}

export const sendInGameMessage = async (
  gameId: string,
  message: Omit<InGameMessage, 'id' | 'timestamp'>
): Promise<string | null> => {
  try {
    const messagesRef = collection(db, `online_matches/${gameId}/chat`);
    const docRef = await addDoc(messagesRef, {
      ...message,
      timestamp: serverTimestamp()
    });
    return docRef.id;
  } catch (e) {
    console.error('Error sending in-game message:', e);
    return null;
  }
};

export const listenToInGameMessages = (
  gameId: string,
  callback: (messages: InGameMessage[]) => void
) => {
  if (!gameId) return () => {};

  try {
    const q = query(
      collection(db, `online_matches/${gameId}/chat`),
      orderBy('timestamp', 'asc'),
      limit(200)
    );

    const unsub = onSnapshot(q, snap => {
      const msgs: InGameMessage[] = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          // Handle potential null timestamp immediately after sending
          timestamp: data.timestamp ? (data.timestamp as Timestamp).toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'just now'
        } as unknown as InGameMessage;
      });
      callback(msgs);
    }, err => {
      console.warn('In-game chat listener error:', err);
    });

    return unsub;
  } catch (e) {
    console.error('Failed to listen to in-game messages:', e);
    return () => {};
  }
};

export const setInGameTypingStatus = async (
  gameId: string,
  uid: string,
  isTyping: boolean
) => {
  try {
    const typingDocRef = doc(db, `online_matches/${gameId}/typing`, uid);
    await setDoc(typingDocRef, {
      isTyping,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.error('Error setting typing status:', e);
  }
};

export const listenToInGameTypingStatus = (
  gameId: string,
  callback: (typingMap: Record<string, boolean>) => void
) => {
  if (!gameId) return () => {};

  try {
    const typingRef = collection(db, `online_matches/${gameId}/typing`);
    const unsub = onSnapshot(typingRef, snap => {
      const typingMap: Record<string, boolean> = {};
      snap.forEach(d => {
        const data = d.data();
        // Only count as typing if updated in last 5 seconds to prevent stale states
        const lastUpdate = data.updatedAt ? (data.updatedAt as Timestamp).toMillis() : 0;
        const now = Date.now();
        if (data.isTyping && now - lastUpdate < 5000) {
          typingMap[d.id] = true;
        }
      });
      callback(typingMap);
    }, err => {
      console.warn('Typing status listener error:', err);
    });

    return unsub;
  } catch (e) {
    console.error('Failed to listen to typing status:', e);
    return () => {};
  }
};
