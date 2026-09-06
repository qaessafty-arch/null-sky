import React, { createContext, useContext, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  addDoc,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../utils/firebase';
import { TimeControl } from '../types/chess';

export type RoomStatus = 'waiting' | 'ready' | 'in_progress' | 'ended' | 'expired';

export interface RoomSettings {
  timeControlId: string;
  timeControlName: string;
  initialSeconds: number;
  incrementSeconds: number;
  color: 'white' | 'black' | 'random';
  rated: boolean;
}

export interface RoomInvite {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  status: 'pending' | 'accepted' | 'declined';
  invitedAt: Timestamp | Date | null;
  settings: RoomSettings;
}

export interface RoomChatMessage {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  message: string;
  timestamp: Timestamp | Date | null;
}

export interface PrivateRoom {
  roomCode: string;
  creatorId: string;
  creatorName: string;
  creatorPhotoURL?: string;
  creatorElo: number;
  opponentId?: string;
  opponentName?: string;
  opponentPhotoURL?: string;
  opponentElo?: number;
  status: RoomStatus;
  settings: RoomSettings;
  createdAt: Timestamp | Date | null;
  expiresAt: Timestamp | Date | null;
  gameId?: string;
}

interface RoomContextType {
  currentRoom: PrivateRoom | null;
  setCurrentRoom: (room: PrivateRoom | null) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  joinError: string | null;
  setJoinError: (v: string | null) => void;
  createRoom: (
    code: string,
    settings: RoomSettings,
  ) => Promise<PrivateRoom>;
  joinRoom: (code: string) => Promise<PrivateRoom>;
  updateRoomStatus: (status: RoomStatus) => Promise<void>;
  addOpponent: (
    uid: string,
    name: string,
    photoURL?: string,
    elo?: number,
  ) => Promise<void>;
  inviteFriend: (friendUid: string, friendName: string, friendPhotoURL?: string) => Promise<void>;
  acceptInvite: (inviteId: string) => Promise<void>;
  declineInvite: (inviteId: string) => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  markRoomExpiredIfDue: () => Promise<boolean>;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile } = useAuth();
  const [currentRoom, setCurrentRoom] = useState<PrivateRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const createRoom = useCallback(
    async (code: string, settings: RoomSettings): Promise<PrivateRoom> => {
      if (!profile) throw new Error('Not authenticated');
      const cleanCode = code.trim().toUpperCase();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

      const roomDoc = doc(db, 'rooms', cleanCode);

      // Verify the code is not already active (wait for the doc to settle).
      const existing = await getDoc(roomDoc);
      if (existing.exists()) {
        throw new Error('This room code is already in use. Choose another.');
      }

      const room: PrivateRoom = {
        roomCode: cleanCode,
        creatorId: profile.uid,
        creatorName: profile.displayName || 'You',
        creatorPhotoURL: profile.photoURL || undefined,
        creatorElo:
          typeof profile.elo === 'number' ? profile.elo : 1200,
        status: 'waiting',
        settings,
        createdAt: now,
        expiresAt,
      };

      await setDoc(roomDoc, {
        ...room,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromDate(expiresAt),
      });

      setCurrentRoom(room);
      setJoinError(null);
      return room;
    },
    [profile],
  );

  const joinRoom = useCallback(
    async (code: string): Promise<PrivateRoom> => {
      if (!profile) throw new Error('Not authenticated');
      const cleanCode = code.trim().toUpperCase();
      const roomDoc = doc(db, 'rooms', cleanCode);

      const snap = await getDoc(roomDoc);
      if (!snap.exists()) {
        throw new Error(
          'No room found with that code. Check it and try again.',
        );
      }

      const data = snap.data() as PrivateRoom;
      if (data.status !== 'waiting') {
        throw new Error(
          'This room is no longer waiting for a challenger.',
        );
      }
      if (data.creatorId === profile.uid) {
        throw new Error(
          "You can't join your own room as the opponent.",
        );
      }

      const opponentDoc = await getDoc(doc(db, 'users', profile.uid));
      const opponentName =
        profile.displayName || opponentDoc.data()?.displayName || 'Opponent';
      const opponentPhotoURL = profile.photoURL || undefined;
      const opponentElo =
        typeof profile.elo === 'number' ? profile.elo : undefined;

      await updateDoc(roomDoc, {
        opponentId: profile.uid,
        opponentName,
        opponentPhotoURL,
        opponentElo,
        status: 'ready',
        updatedAt: serverTimestamp(),
      });

      const joined: PrivateRoom = {
        ...data,
        opponentId: profile.uid,
        opponentName,
        opponentPhotoURL,
        opponentElo,
        status: 'ready',
      };

      setCurrentRoom(joined);
      setJoinError(null);
      return joined;
    },
    [profile],
  );

  const updateRoomStatus = useCallback(
    async (status: RoomStatus) => {
      if (!currentRoom) return;
      const roomDoc = doc(db, 'rooms', currentRoom.roomCode);
      await updateDoc(roomDoc, {
        status,
        updatedAt: serverTimestamp(),
      });
      setCurrentRoom((prev) =>
        prev ? { ...prev, status } : null,
      );
    },
    [currentRoom],
  );

  const addOpponent = useCallback(
    async (
      uid: string,
      name: string,
      photoURL?: string,
      elo?: number,
    ) => {
      if (!currentRoom) return;
      const roomDoc = doc(db, 'rooms', currentRoom.roomCode);
      await updateDoc(roomDoc, {
        opponentId: uid,
        opponentName: name,
        opponentPhotoURL: photoURL,
        opponentElo: elo,
        status: 'ready',
        updatedAt: serverTimestamp(),
      });
      setCurrentRoom((prev) =>
        prev
          ? {
              ...prev,
              opponentId: uid,
              opponentName: name,
              opponentPhotoURL: photoURL,
              opponentElo: elo,
              status: 'ready',
            }
          : null,
      );
    },
    [currentRoom],
  );

  const inviteFriend = useCallback(
    async (
      friendUid: string,
      friendName: string,
      friendPhotoURL?: string,
    ) => {
      if (!currentRoom || !profile) return;
      const roomDoc = doc(db, 'rooms', currentRoom.roomCode);
      const invitesColl = collection(roomDoc, 'invites');
      const inviteRef = await addDoc(invitesColl, {
        userId: friendUid,
        userName: friendName,
        userPhotoURL: friendPhotoURL,
        status: 'pending',
        invitedAt: serverTimestamp(),
        settings: currentRoom.settings,
        invitedBy: profile.uid,
      });

      // Denormalized list on the room doc for quick reads.
      await updateDoc(roomDoc, {
        [`invites.${inviteRef.id}`]: {
          id: inviteRef.id,
          userId: friendUid,
          userName: friendName,
          userPhotoURL: friendPhotoURL,
          status: 'pending',
          invitedAt: serverTimestamp(),
          settings: currentRoom.settings,
        },
      });
    },
    [currentRoom, profile],
  );

  const acceptInvite = useCallback(
    async (inviteId: string) => {
      if (!currentRoom) return;
      const inviteRef = doc(collection(doc(db, 'rooms', currentRoom.roomCode), 'invites'), inviteId);
      await updateDoc(inviteRef, { status: 'accepted' });

      // Remove from denormalized list.
      await updateDoc(doc(db, 'rooms', currentRoom.roomCode), {
        [`invites.${inviteId}`]: null,
      });
    },
    [currentRoom],
  );

  const declineInvite = useCallback(
    async (inviteId: string) => {
      if (!currentRoom) return;
      const inviteRef = doc(collection(doc(db, 'rooms', currentRoom.roomCode), 'invites'), inviteId);
      await updateDoc(inviteRef, { status: 'declined' });

      await updateDoc(doc(db, 'rooms', currentRoom.roomCode), {
        [`invites.${inviteId}`]: null,
      });
    },
    [currentRoom],
  );

  const sendChatMessage = useCallback(
    async (message: string) => {
      if (!currentRoom || !profile) return;
      if (!message.trim()) return;
      const chatColl = collection(doc(db, 'rooms', currentRoom.roomCode), 'chat');
      const msgRef = await addDoc(chatColl, {
        userId: profile.uid,
        userName: profile.displayName || 'You',
        userPhotoURL: profile.photoURL || undefined,
        message: message.trim(),
        timestamp: serverTimestamp(),
      });

      // Denormalize last 50 messages onto the room doc for quick history reads.
      const roomDoc = doc(db, 'rooms', currentRoom.roomCode);
      const existing = await getDoc(roomDoc);
      const existingChat: RoomChatMessage[] = (existing.data()?.chat || []) as RoomChatMessage[];
      const newMsg: RoomChatMessage = {
        id: msgRef.id,
        userId: profile.uid,
        userName: profile.displayName || 'You',
        userPhotoURL: profile.photoURL || undefined,
        message: message.trim(),
        timestamp: null,
      };
      const merged = [newMsg, ...existingChat].slice(0, 50);
      await updateDoc(roomDoc, {
        chat: merged,
        updatedAt: serverTimestamp(),
      });
    },
    [currentRoom, profile],
  );

  const markRoomExpiredIfDue = useCallback(async (): Promise<boolean> => {
    if (!currentRoom) return false;
    const expiresAt = currentRoom.expiresAt;
    if (!expiresAt) return false;
    const expMs =
      expiresAt instanceof Timestamp
        ? expiresAt.toDate().getTime()
        : new Date(expiresAt as Date).getTime();
    if (Date.now() >= expMs) {
      await updateRoomStatus('expired');
      return true;
    }
    return false;
  }, [currentRoom, updateRoomStatus]);

  return (
    <RoomContext.Provider
      value={{
        currentRoom,
        setCurrentRoom,
        loading,
        setLoading,
        joinError,
        setJoinError,
        createRoom,
        joinRoom,
        updateRoomStatus,
        addOpponent,
        inviteFriend,
        acceptInvite,
        declineInvite,
        sendChatMessage,
        markRoomExpiredIfDue,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error('useRoom must be used within a RoomProvider');
  return ctx;
};
