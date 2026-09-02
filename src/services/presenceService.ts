import { doc, updateDoc, onSnapshot, collection, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';

/**
 * Presence Service for Chesskys PRO
 * Tracks user online/offline/in-game status
 */
export const updateUserPresence = async (uid: string, status: 'online' | 'offline' | 'in-game', matchId?: string) => {
  if (!uid) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    presence: {
      status,
      lastSeen: new Date().toISOString(),
      currentMatchId: matchId || null
    }
  });
};

export const listenToFriendsPresence = (uids: string[], callback: (presenceMap: Record<string, any>) => void) => {
  if (!uids.length) return () => {};
  const q = query(collection(db, 'users'), where('uid', 'in', uids));
  return onSnapshot(q, (snap) => {
    const map: Record<string, any> = {};
    snap.forEach(d => {
      const data = d.data();
      map[d.id] = data.presence || { status: 'offline' };
    });
    callback(map);
  });
};
