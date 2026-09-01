import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  serverTimestamp,
  addDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../utils/firebase';
import { FriendUser, FriendRequestItem, UserRole } from '../types/chess';
import { UserProfileData } from '../context/AuthContext';

const LOCAL_FRIENDS_STORAGE_KEY = 'chesskys_local_friends';
const LOCAL_REQUESTS_STORAGE_KEY = 'chesskys_local_requests';

// Check if a unique username is available
export const checkUsernameAvailability = async (username: string, currentUid?: string): Promise<boolean> => {
  const normalized = username.trim().toLowerCase().replace(/^@/, '');
  if (normalized.length < 3 || normalized.length > 20) return false;
  if (!/^[a-zA-Z0-9_]+$/.test(normalized)) return false;

  try {
    const q = query(collection(db, 'users'), where('username', '==', normalized), limit(1));
    const snap = await getDocs(q);
    if (snap.empty) return true;
    
    // If it belongs to current user, it is available
    const docData = snap.docs[0].data();
    return docData.uid === currentUid;
  } catch (e: any) {
    if (e?.code === 'permission-denied' || (e instanceof Error && e.message.includes('permission'))) {
      handleFirestoreError(e, OperationType.LIST, 'users');
    }
    console.error('Error checking username availability:', e);
    return true;
  }
};

// Search users by @username or Display Name
export const searchUsersInDirectory = async (searchQuery: string, currentUid?: string): Promise<FriendUser[]> => {
  const clean = searchQuery.trim().toLowerCase().replace(/^@/, '');
  if (!clean) return [];

  try {
    const results: FriendUser[] = [];
    const usersRef = collection(db, 'users');

    // Query by exact username or fetch top users and filter in-memory
    const q = query(usersRef, limit(25));
    const snap = await getDocs(q);

    snap.forEach(docSnap => {
      const data = docSnap.data();
      if (data.uid === currentUid) return;

      const uname = (data.username || '').toLowerCase();
      const dname = (data.displayName || '').toLowerCase();

      if (uname.includes(clean) || dname.includes(clean)) {
        results.push({
          uid: data.uid,
          displayName: data.displayName || 'Peshmerga Tactician',
          username: data.username || undefined,
          photoURL: data.photoURL || undefined,
          elo: typeof data.elo === 'number' ? data.elo : parseInt(data.elo || '1200', 10),
          respectPoints: typeof data.respectPoints === 'number' ? data.respectPoints : parseInt(data.respectPoints || '100', 10),
          honorRank: data.honorRank || 'Peshmerga Tactician',
          rankBadge: data.rankBadge || '🌿',
          role: data.role as UserRole,
          badgeNumber: data.badgeNumber,
          isOnline: true
        });
      }
    });

    return results;
  } catch (e: any) {
    if (e?.code === 'permission-denied' || (e instanceof Error && e.message.includes('permission'))) {
      handleFirestoreError(e, OperationType.LIST, 'users');
    }
    console.error('Error searching users:', e);
    return [];
  }
};

// Send a friend request
export const sendFriendRequest = async (
  currentUser: { uid: string; displayName: string; username?: string; photoURL?: string; elo?: any; honorRank?: string },
  targetUser: { uid: string; displayName: string; username?: string }
): Promise<{ success: boolean; message: string }> => {
  try {
    const rateLimitRes = await fetch('/api/friends/rate-limit-check', { method: 'POST' });
    if (!rateLimitRes.ok) {
      if (rateLimitRes.status === 429) {
        return { success: false, message: 'Too many friend requests sent. Please wait.' };
      }
    }
  } catch(e) {
    console.warn('Rate limit check failed', e);
  }

  if (currentUser.uid === targetUser.uid) {
    return { success: false, message: 'You cannot add yourself as a friend.' };
  }

  try {
    // Check if request already exists
    const q = query(
      collection(db, 'friend_requests'),
      where('fromUserId', '==', currentUser.uid),
      where('toUserId', '==', targetUser.uid),
      where('status', '==', 'pending')
    );
    
    // Check if blocked by target
    const targetBlockRef = doc(db, `users/${targetUser.uid}/blocked/${currentUser.uid}`);
    const targetBlockSnap = await getDoc(targetBlockRef);
    if (targetBlockSnap.exists()) {
      return { success: false, message: 'You cannot send a friend request to this user.' };
    }
    
    // Check if we blocked target
    const myBlockRef = doc(db, `users/${currentUser.uid}/blocked/${targetUser.uid}`);
    const myBlockSnap = await getDoc(myBlockRef);
    if (myBlockSnap.exists()) {
      return { success: false, message: 'You have blocked this user. Unblock them first.' };
    }
const existing = await getDocs(q);
    if (!existing.empty) {
      return { success: false, message: 'A friend request is already pending.' };
    }

    const reqData = {
      fromUserId: currentUser.uid,
      fromUserName: currentUser.displayName || 'Tactician',
      fromUsername: currentUser.username || '',
      fromUserAvatar: currentUser.photoURL || '',
      fromUserElo: typeof currentUser.elo === 'number' ? currentUser.elo : parseInt(currentUser.elo || '1200', 10),
      fromUserHonorRank: currentUser.honorRank || 'Peshmerga Tactician',
      toUserId: targetUser.uid,
      toUsername: targetUser.username || '',
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    await addDoc(collection(db, 'friend_requests'), reqData);
    return { success: true, message: `Friend request sent to ${targetUser.displayName}!` };
  } catch (e: any) {
    console.error('Error sending friend request:', e);
    return { success: false, message: e?.message || 'Failed to send friend request.' };
  }
};

// Respond to friend request (Accept or Decline)
export const respondToFriendRequest = async (
  requestId: string,
  accept: boolean,
  currentUserId: string,
  otherUserId: string
): Promise<boolean> => {
  try {
    const reqRef = doc(db, 'friend_requests', requestId);
    if (!accept) {
      await updateDoc(reqRef, { status: 'declined', updatedAt: new Date().toISOString() });
      return true;
    }

    // Accept request
    await updateDoc(reqRef, { status: 'accepted', updatedAt: new Date().toISOString() });

    // Store friend relationship under both users
    const myFriendRef = doc(db, `users/${currentUserId}/friends/${otherUserId}`);
    const otherFriendRef = doc(db, `users/${otherUserId}/friends/${currentUserId}`);

    await setDoc(myFriendRef, { friendUid: otherUserId, addedAt: new Date().toISOString() }, { merge: true });
    await setDoc(otherFriendRef, { friendUid: currentUserId, addedAt: new Date().toISOString() }, { merge: true });

    return true;
  } catch (e) {
    console.error('Error responding to friend request:', e);
    return false;
  }
};

// Listen to incoming and outgoing friend requests in real-time
export const listenToFriendRequests = (
  userId: string,
  callback: (incoming: FriendRequestItem[], outgoing: FriendRequestItem[]) => void
) => {
  if (!userId) return () => {};

  try {
    const incQ = query(
      collection(db, 'friend_requests'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending')
    );

    const outQ = query(
      collection(db, 'friend_requests'),
      where('fromUserId', '==', userId)
    );

    let incomingList: FriendRequestItem[] = [];
    let outgoingList: FriendRequestItem[] = [];

    const unsubInc = onSnapshot(incQ, snap => {
      incomingList = snap.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequestItem));
      callback(incomingList, outgoingList);
    }, err => {
      console.warn('Friend requests incoming listener error:', err);
    });

    const unsubOut = onSnapshot(outQ, snap => {
      outgoingList = snap.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequestItem));
      callback(incomingList, outgoingList);
    }, err => {
      console.warn('Friend requests outgoing listener error:', err);
    });

    return () => {
      unsubInc();
      unsubOut();
    };
  } catch (e) {
    console.error('Failed to setup friend request listeners:', e);
    return () => {};
  }
};

// Listen to accepted friends in real-time
export const listenToFriendsList = (
  userId: string,
  callback: (friends: FriendUser[]) => void
) => {
  if (!userId) return () => {};

  try {
    const friendsSubColl = collection(db, `users/${userId}/friends`);
    const unsub = onSnapshot(friendsSubColl, async snap => {
      const friendUids = snap.docs.map(d => d.id);
      if (friendUids.length === 0) {
        callback([]);
        return;
      }

      // Fetch user docs for all friends
      const friendsData: FriendUser[] = [];
      for (const fUid of friendUids) {
        try {
          const userDocSnap = await getDoc(doc(db, 'users', fUid));
          if (userDocSnap.exists()) {
            const d = userDocSnap.data();
            friendsData.push({
              uid: d.uid || fUid,
              displayName: d.displayName || 'Peshmerga Friend',
              username: d.username,
              photoURL: d.photoURL,
              elo: typeof d.elo === 'number' ? d.elo : parseInt(d.elo || '1200', 10),
              respectPoints: typeof d.respectPoints === 'number' ? d.respectPoints : parseInt(d.respectPoints || '100', 10),
              honorRank: d.honorRank || 'Peshmerga Tactician',
              rankBadge: d.rankBadge || '🌿',
              role: d.role as UserRole,
              badgeNumber: d.badgeNumber,
              isOnline: true
            });
          }
        } catch (err) {
          console.warn('Failed to load friend doc:', fUid, err);
        }
      }
      callback(friendsData);
    }, err => {
      console.warn('Friends list listener error:', err);
    });

    return unsub;
  } catch (e) {
    console.error('Failed to listen to friends list:', e);
    return () => {};
  }
};

// Remove friend
export const removeFriendRelationship = async (userId: string, friendId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, `users/${userId}/friends/${friendId}`));
    await deleteDoc(doc(db, `users/${friendId}/friends/${userId}`));
    return true;
  } catch (e) {
    console.error('Error removing friend:', e);
    return false;
  }
};

export const blockUser = async (currentUid: string, targetUid: string, targetName: string): Promise<boolean> => {
  try {
    const blockRef = doc(db, `users/${currentUid}/blocked/${targetUid}`);
    await setDoc(blockRef, { uid: targetUid, displayName: targetName, blockedAt: new Date().toISOString() });
    
    // Also remove from friends list if they are friends
    const myFriendRef = doc(db, `users/${currentUid}/friends/${targetUid}`);
    const theirFriendRef = doc(db, `users/${targetUid}/friends/${currentUid}`);
    await deleteDoc(myFriendRef);
    await deleteDoc(theirFriendRef);
    
    return true;
  } catch (e) {
    console.error('Failed to block user', e);
    return false;
  }
};

export const unblockUser = async (currentUid: string, targetUid: string): Promise<boolean> => {
  try {
    const blockRef = doc(db, `users/${currentUid}/blocked/${targetUid}`);
    await deleteDoc(blockRef);
    return true;
  } catch (e) {
    console.error('Failed to unblock user', e);
    return false;
  }
};

export const listenToBlockedUsers = (userId: string, callback: (blockedIds: string[]) => void) => {
  if (!userId) return () => {};
  const q = query(collection(db, `users/${userId}/blocked`));
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => d.id));
  });
};
