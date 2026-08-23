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
  updateDoc
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { DirectMessageItem } from '../types/chess';

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
