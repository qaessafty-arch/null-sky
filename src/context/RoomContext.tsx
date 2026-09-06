import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  addDoc,
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  deleteField,
  onSnapshot,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../utils/firebase';
import { soundManager } from '../utils/audio';
import { createOnlineMatch, joinOnlineMatch } from '../services/onlineMatchService';
import { OnlineMatchPlayer, TimeControl } from '../types/chess';

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
  invitedAt: any;
  settings: RoomSettings;
}

export interface UserInvite {
  id: string;
  userId: string;
  roomId: string;
  roomCode: string;
  invitedBy: string;
  invitedByName: string;
  invitedByPhoto?: string;
  status: 'pending' | 'accepted' | 'declined';
  settings: RoomSettings;
  createdAt: any;
}

export interface RoomChatMessage {
  id: string;
  userId: string;
  userName: string;
  userPhotoURL?: string;
  message: string;
  timestamp: any;
  isSystem?: boolean;
}

export interface PrivateRoom {
  roomId?: string;
  roomCode: string;
  creatorId: string;
  creatorName: string;
  creatorPhotoURL?: string;
  creatorElo: number;
  creatorColor?: 'white' | 'black' | 'random';
  opponentId?: string | null;
  opponentName?: string | null;
  opponentPhotoURL?: string;
  opponentElo?: number | null;
  opponentColor?: 'white' | 'black';
  status: RoomStatus;
  settings: RoomSettings;
  createdAt: any;
  expiresAt: any;
  startedAt?: any;
  gameId?: string | null;
  chat?: RoomChatMessage[];
  invites?: Record<string, RoomInvite>;
}

interface RoomContextType {
  currentRoom: PrivateRoom | null;
  incomingInvites: UserInvite[];
  loading: boolean;
  joinError: string | null;
  countdown: number | null;
  activeGameId: string | null;
  setCurrentRoom: (room: PrivateRoom | null) => void;
  setJoinError: (v: string | null) => void;
  createRoom: (code: string, settings: RoomSettings) => Promise<PrivateRoom>;
  joinRoom: (code: string) => Promise<PrivateRoom>;
  cancelRoom: (code?: string) => Promise<void>;
  leaveRoom: () => void;
  updateRoomStatus: (status: RoomStatus) => Promise<void>;
  addOpponent: (
    uid: string,
    name: string,
    photoURL?: string,
    elo?: number,
  ) => Promise<void>;
  inviteFriend: (friendUid: string, friendName: string, friendPhotoURL?: string) => Promise<void>;
  acceptInvite: (inviteId: string, roomCode?: string) => Promise<void>;
  declineInvite: (inviteId: string) => Promise<void>;
  sendChatMessage: (message: string) => Promise<void>;
  markRoomExpiredIfDue: () => Promise<boolean>;
  dismissActiveGame: () => void;
}

const RoomContext = createContext<RoomContextType | undefined>(undefined);

export const RoomProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile } = useAuth();
  const [currentRoom, setCurrentRoom] = useState<PrivateRoom | null>(null);
  const [incomingInvites, setIncomingInvites] = useState<UserInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [activeGameId, setActiveGameId] = useState<string | null>(null);

  const countdownTimerRef = useRef<any>(null);
  const currentRoomRef = useRef<PrivateRoom | null>(null);
  currentRoomRef.current = currentRoom;

  // Migration helper: Strip legacy bloated fields and backfill subcollections if present
  const cleanUpLegacyRoomDoc = useCallback(async (roomCode: string, data: PrivateRoom) => {
    try {
      const roomRef = doc(db, 'rooms', roomCode);

      // Backfill messages to subcollection if present on doc
      if (Array.isArray(data.chat) && data.chat.length > 0) {
        const msgColl = collection(db, 'rooms', roomCode, 'messages');
        for (const msg of data.chat) {
          if (msg && msg.message) {
            await addDoc(msgColl, {
              userId: msg.userId || 'system',
              userName: msg.userName || 'System',
              userPhotoURL: msg.userPhotoURL || null,
              message: msg.message,
              timestamp: msg.timestamp || serverTimestamp(),
              isSystem: Boolean(msg.isSystem),
              type: msg.isSystem ? 'system' : 'chat',
            }).catch(() => {});
          }
        }
      }

      // Backfill invites to subcollection if present on doc
      if (data.invites && typeof data.invites === 'object') {
        const invitesColl = collection(db, 'rooms', roomCode, 'invites');
        for (const inv of Object.values(data.invites) as any[]) {
          if (inv && inv.userId) {
            await addDoc(invitesColl, {
              userId: inv.userId,
              userName: inv.userName || 'Friend',
              userPhotoURL: inv.userPhotoURL || null,
              status: inv.status || 'pending',
              invitedAt: inv.invitedAt || serverTimestamp(),
              settings: inv.settings || null,
              invitedBy: data.creatorId,
            }).catch(() => {});
          }
        }
      }

      // Prune legacy fields so the document size drops under 1KB
      await updateDoc(roomRef, {
        chat: deleteField(),
        invites: deleteField(),
      });
    } catch (err) {
      console.warn('Could not auto-prune legacy room fields:', err);
    }
  }, []);

  // Real-time listener for current room
  useEffect(() => {
    if (!currentRoom?.roomCode) return;

    const roomRef = doc(db, 'rooms', currentRoom.roomCode);
    const unsub = onSnapshot(
      roomRef,
      (docSnap) => {
        if (!docSnap.exists()) {
          // Room was canceled or deleted
          if (currentRoomRef.current?.status === 'waiting') {
            setCurrentRoom(null);
          }
          return;
        }

        const data = docSnap.data() as PrivateRoom;
        const prevStatus = currentRoomRef.current?.status;
        const prevOpponent = currentRoomRef.current?.opponentId;

        // Auto-cleanup legacy bloated fields if found on existing room
        if (data.chat || data.invites) {
          cleanUpLegacyRoomDoc(currentRoom.roomCode, data);
        }

        setCurrentRoom(data);

        // Opponent just joined
        if (!prevOpponent && data.opponentId && (data.status === 'ready' || data.status === 'waiting')) {
          soundManager.playMatchFound();
        }

        // Handle game start countdown if ready
        if (data.status === 'ready' && prevStatus !== 'ready' && prevStatus !== 'in_progress') {
          startCountdownFlow(data);
        }

        // If gameId is set and status in_progress, transition to active match
        if (data.status === 'in_progress' && data.gameId) {
          setActiveGameId(data.gameId);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `rooms/${currentRoom.roomCode}`);
      }
    );

    return () => unsub();
  }, [currentRoom?.roomCode, cleanUpLegacyRoomDoc]);

  // Real-time listener for incoming user invites
  useEffect(() => {
    if (!user) {
      setIncomingInvites([]);
      return;
    }

    const invitesQuery = query(
      collection(db, 'user_invites'),
      where('userId', '==', user.uid),
      where('status', '==', 'pending')
    );

    const unsub = onSnapshot(
      invitesQuery,
      (snapshot) => {
        const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as UserInvite));
        setIncomingInvites(list);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'user_invites');
      }
    );

    return () => unsub();
  }, [user]);

  // 3-second automatic countdown when status is 'ready'
  const startCountdownFlow = (room: PrivateRoom) => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);

    let count = 3;
    setCountdown(count);
    soundManager.playCountdownTick(false);

    countdownTimerRef.current = setInterval(async () => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        soundManager.playCountdownTick(false);
      } else {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        setCountdown(null);
        soundManager.playCountdownTick(true);

        // If creator, create or link the online match session and update status to in_progress
        if (profile?.uid === room.creatorId) {
          try {
            const hostPlayer: OnlineMatchPlayer = {
              uid: room.creatorId,
              displayName: room.creatorName,
              avatar: room.creatorPhotoURL,
              elo: room.creatorElo,
            };

            const category: 'bullet' | 'blitz' | 'rapid' | 'classical' =
              room.settings.initialSeconds < 180
                ? 'bullet'
                : room.settings.initialSeconds < 600
                ? 'blitz'
                : room.settings.initialSeconds < 1800
                ? 'rapid'
                : 'classical';

            const tc: TimeControl = {
              id: room.settings.timeControlId || 'tc_custom',
              name: room.settings.timeControlName,
              initialSeconds: room.settings.initialSeconds,
              incrementSeconds: room.settings.incrementSeconds,
              category,
            };

            const preferredSide =
              room.settings.color === 'random'
                ? Math.random() < 0.5
                  ? 'w'
                  : 'b'
                : room.settings.color === 'black'
                ? 'b'
                : 'w';

            const gameSessionId = await createOnlineMatch(hostPlayer, tc, preferredSide, room.roomCode);

            // Add opponent to match session
            if (room.opponentId) {
              const opponentPlayer: OnlineMatchPlayer = {
                uid: room.opponentId,
                displayName: room.opponentName || 'Challenger',
                avatar: room.opponentPhotoURL,
                elo: room.opponentElo || 1200,
              };

              const matchDocRef = doc(db, 'online_matches', gameSessionId);
              const isHostWhite = preferredSide === 'w';
              await updateDoc(matchDocRef, {
                [isHostWhite ? 'blackPlayer' : 'whitePlayer']: opponentPlayer,
                guestId: room.opponentId,
                status: 'in_progress',
                updatedAt: new Date().toISOString(),
              });
            }

            // Update room to in_progress with gameId
            const roomDoc = doc(db, 'rooms', room.roomCode);
            await updateDoc(roomDoc, {
              status: 'in_progress',
              gameId: gameSessionId,
              startedAt: serverTimestamp(),
            });

            setActiveGameId(gameSessionId);
          } catch (err: any) {
            console.error('Failed to launch room game session:', err);
          }
        }
      }
    }, 1000);
  };

  const createRoom = useCallback(
    async (code: string, settings: RoomSettings): Promise<PrivateRoom> => {
      if (!profile) throw new Error('Not authenticated');
      const cleanCode = code.trim().toUpperCase();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60 * 1000);

      const roomDoc = doc(db, 'rooms', cleanCode);
      const existing = await getDoc(roomDoc);
      if (existing.exists()) {
        throw new Error('This room code is already active. Please generate a different code.');
      }

      const creatorColor = settings.color;
      const opponentColor = creatorColor === 'white' ? 'black' : creatorColor === 'black' ? 'white' : 'black';

      // Keep main room document lean (essential metadata only) to strictly avoid 1MB document size limit
      const room: PrivateRoom = {
        roomId: cleanCode,
        roomCode: cleanCode,
        creatorId: profile.uid,
        creatorName: profile.displayName || 'You',
        creatorPhotoURL: profile.photoURL || undefined,
        creatorElo: typeof profile.elo === 'number' ? profile.elo : 1200,
        creatorColor,
        opponentColor,
        opponentId: null,
        opponentName: null,
        opponentElo: null,
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

      // Write initial message into subcollection (rooms/{code}/messages)
      try {
        const msgColl = collection(db, 'rooms', cleanCode, 'messages');
        await addDoc(msgColl, {
          userId: 'system',
          userName: 'System',
          message: `Battle room created! Code: ${cleanCode}. Waiting for challenger.`,
          timestamp: serverTimestamp(),
          isSystem: true,
          type: 'system',
        });
      } catch (err) {
        console.warn('Could not write initial room message to subcollection:', err);
      }

      // Mirror into online_matches collection so the room is instantly discoverable and joinable
      try {
        const hostPlayer: OnlineMatchPlayer = {
          uid: profile.uid,
          displayName: profile.displayName || 'Host',
          avatar: profile.photoURL || undefined,
          elo: typeof profile.elo === 'number' ? profile.elo : 1200,
        };
        const preferredSide = settings.color === 'white' ? 'w' : settings.color === 'black' ? 'b' : 'random';
        const category =
          settings.initialSeconds < 180
            ? 'bullet'
            : settings.initialSeconds < 600
            ? 'blitz'
            : settings.initialSeconds < 1800
            ? 'rapid'
            : 'classical';

        const tc: TimeControl = {
          id: settings.timeControlId || 'tc_custom',
          name: settings.timeControlName,
          initialSeconds: settings.initialSeconds,
          incrementSeconds: settings.incrementSeconds,
          category,
        };
        await createOnlineMatch(hostPlayer, tc, preferredSide, cleanCode);
      } catch (err) {
        console.warn('Could not mirror room to online_matches:', err);
      }

      setCurrentRoom(room);
      setJoinError(null);
      soundManager.playNotification();
      return room;
    },
    [profile]
  );

  const joinRoom = useCallback(
    async (code: string): Promise<PrivateRoom> => {
      if (!profile) throw new Error('Not authenticated');
      const cleanCode = code.trim().toUpperCase();
      const roomDoc = doc(db, 'rooms', cleanCode);

      const snap = await getDoc(roomDoc);
      if (!snap.exists()) {
        // Fallback: check online_matches collection
        const matchDocRef = doc(db, 'online_matches', cleanCode);
        const matchSnap = await getDoc(matchDocRef);
        if (matchSnap.exists()) {
          const matchSession = matchSnap.data() as any;
          if (matchSession.status !== 'waiting' && matchSession.guestId && matchSession.guestId !== profile.uid) {
            throw new Error('This match is already in progress or completed.');
          }
          if (matchSession.hostId === profile.uid) {
            throw new Error('You are the creator of this match. Share your code with a friend!');
          }

          const guestPlayer: OnlineMatchPlayer = {
            uid: profile.uid,
            displayName: profile.displayName || 'Opponent',
            avatar: profile.photoURL || undefined,
            elo: typeof profile.elo === 'number' ? profile.elo : 1200,
          };
          await joinOnlineMatch(cleanCode, guestPlayer);
          setActiveGameId(cleanCode);

          const synthRoom: PrivateRoom = {
            roomId: cleanCode,
            roomCode: cleanCode,
            creatorId: matchSession.hostId,
            creatorName: matchSession.whitePlayer?.displayName || 'Host',
            creatorElo: matchSession.whitePlayer?.elo || 1200,
            creatorColor: matchSession.whitePlayer?.uid === matchSession.hostId ? 'white' : 'black',
            opponentColor: matchSession.whitePlayer?.uid === matchSession.hostId ? 'black' : 'white',
            opponentId: profile.uid,
            opponentName: profile.displayName || 'Opponent',
            opponentElo: typeof profile.elo === 'number' ? profile.elo : 1200,
            status: 'in_progress',
            settings: {
              timeControlId: matchSession.timeControl?.id || 'rapid',
              timeControlName: matchSession.timeControl?.name || 'Rapid 10+0',
              initialSeconds: matchSession.timeControl?.initialSeconds || 600,
              incrementSeconds: matchSession.timeControl?.incrementSeconds || 0,
              color: 'random',
              rated: true,
            },
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 600000),
            gameId: cleanCode,
          };
          setCurrentRoom(synthRoom);
          soundManager.playMatchFound();
          return synthRoom;
        }

        throw new Error('No room found with that code. Please check and try again.');
      }

      const data = snap.data() as PrivateRoom;
      if (data.status !== 'waiting') {
        throw new Error('This room is already in progress or no longer available.');
      }

      if (data.creatorId === profile.uid) {
        throw new Error("You are the creator of this room. Share your code with a friend!");
      }

      const opponentName = profile.displayName || 'Opponent';
      const opponentPhotoURL = profile.photoURL || undefined;
      const opponentElo = typeof profile.elo === 'number' ? profile.elo : 1200;

      // Write system announcement to messages subcollection
      try {
        const msgColl = collection(db, 'rooms', cleanCode, 'messages');
        await addDoc(msgColl, {
          userId: 'system',
          userName: 'System',
          message: `${opponentName} joined the room! 🎉`,
          timestamp: serverTimestamp(),
          isSystem: true,
          type: 'system',
        });
      } catch (err) {
        console.warn('Could not write join message to subcollection:', err);
      }

      // Update room document with ONLY essential fields, explicitly pruning bloated legacy arrays to prevent 1MB limit failures
      const updatePayload: Record<string, any> = {
        opponentId: profile.uid,
        opponentName,
        opponentPhotoURL,
        opponentElo,
        status: 'ready',
        updatedAt: serverTimestamp(),
      };
      if (data.chat) updatePayload.chat = deleteField();
      if (data.invites) updatePayload.invites = deleteField();

      await updateDoc(roomDoc, updatePayload);

      // Also sync into online_matches
      try {
        const guestPlayer: OnlineMatchPlayer = {
          uid: profile.uid,
          displayName: opponentName,
          avatar: opponentPhotoURL,
          elo: opponentElo,
        };
        await joinOnlineMatch(cleanCode, guestPlayer);
      } catch (e) {
        console.warn('Could not sync online match on private room join:', e);
      }

      const joinedRoom: PrivateRoom = {
        ...data,
        opponentId: profile.uid,
        opponentName,
        opponentPhotoURL,
        opponentElo,
        status: 'ready',
      };
      delete joinedRoom.chat;
      delete joinedRoom.invites;

      setCurrentRoom(joinedRoom);
      setJoinError(null);
      soundManager.playMatchFound();
      return joinedRoom;
    },
    [profile]
  );

  const cancelRoom = useCallback(
    async (code?: string) => {
      const targetCode = code || currentRoom?.roomCode;
      if (!targetCode) return;

      try {
        const roomDoc = doc(db, 'rooms', targetCode);
        const snap = await getDoc(roomDoc);
        if (snap.exists()) {
          const data = snap.data() as PrivateRoom;
          if (data.status === 'waiting' && (!profile || data.creatorId === profile.uid)) {
            await deleteDoc(roomDoc);
          }
        }
      } catch (e) {
        console.warn('Error deleting room during cancel:', e);
      }

      // Also clean up online_matches mirror if waiting
      try {
        const matchRef = doc(db, 'online_matches', targetCode);
        const mSnap = await getDoc(matchRef);
        if (mSnap.exists()) {
          const mData = mSnap.data();
          if (mData.status === 'waiting' && (!profile || mData.hostId === profile.uid)) {
            await deleteDoc(matchRef).catch(() => {});
          }
        }
      } catch (err) {} finally {
        if (currentRoom?.roomCode === targetCode) {
          setCurrentRoom(null);
          setCountdown(null);
        }
      }
    },
    [currentRoom, profile]
  );

  const leaveRoom = useCallback(() => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
    setCurrentRoom(null);
    setJoinError(null);
  }, []);

  const updateRoomStatus = useCallback(
    async (status: RoomStatus) => {
      if (!currentRoom) return;
      const roomDoc = doc(db, 'rooms', currentRoom.roomCode);
      await updateDoc(roomDoc, {
        status,
        updatedAt: serverTimestamp(),
      });
      setCurrentRoom((prev) => (prev ? { ...prev, status } : null));
    },
    [currentRoom]
  );

  const addOpponent = useCallback(
    async (uid: string, name: string, photoURL?: string, elo?: number) => {
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
    },
    [currentRoom]
  );

  const inviteFriend = useCallback(
    async (friendUid: string, friendName: string, friendPhotoURL?: string) => {
      if (!currentRoom || !profile) return;
      const roomCode = currentRoom.roomCode;
      const roomDoc = doc(db, 'rooms', roomCode);

      // Create invite in subcollection ONLY
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

      // Also create document in user_invites for direct notification targeting
      const userInviteDoc = doc(db, 'user_invites', inviteRef.id);
      await setDoc(userInviteDoc, {
        id: inviteRef.id,
        userId: friendUid,
        roomId: roomCode,
        roomCode: roomCode,
        invitedBy: profile.uid,
        invitedByName: profile.displayName || 'You',
        invitedByPhoto: profile.photoURL || undefined,
        status: 'pending',
        settings: currentRoom.settings,
        createdAt: serverTimestamp(),
      });

      // If main room doc has legacy invites map, clean it up to prevent size issues
      if (currentRoom.invites) {
        try {
          await updateDoc(roomDoc, { invites: deleteField() });
        } catch {}
      }

      soundManager.playChat();
    },
    [currentRoom, profile]
  );

  const acceptInvite = useCallback(
    async (inviteId: string, roomCode?: string) => {
      const code = roomCode || currentRoom?.roomCode;
      if (!code) return;

      try {
        // Update user_invites status
        const userInviteRef = doc(db, 'user_invites', inviteId);
        await updateDoc(userInviteRef, { status: 'accepted' });

        // Update room subcollection invite if possible
        try {
          const roomInviteRef = doc(db, 'rooms', code, 'invites', inviteId);
          await updateDoc(roomInviteRef, { status: 'accepted' });
        } catch {}

        // Join room as opponent
        await joinRoom(code);
      } catch (err: any) {
        setJoinError(err?.message || 'Could not join invited room.');
      }
    },
    [currentRoom, joinRoom]
  );

  const declineInvite = useCallback(
    async (inviteId: string) => {
      try {
        const userInviteRef = doc(db, 'user_invites', inviteId);
        await updateDoc(userInviteRef, { status: 'declined' });
      } catch (err) {
        console.warn('Error declining invite:', err);
      }
    },
    []
  );

  const sendChatMessage = useCallback(
    async (message: string) => {
      if (!currentRoom || !profile) return;
      const text = message.trim();
      if (!text) return;

      const roomCode = currentRoom.roomCode;
      const roomDoc = doc(db, 'rooms', roomCode);

      // Write directly into subcollection: rooms/{roomCode}/messages
      const msgColl = collection(roomDoc, 'messages');
      await addDoc(msgColl, {
        userId: profile.uid,
        userName: profile.displayName || 'You',
        userPhotoURL: profile.photoURL || undefined,
        message: text,
        timestamp: serverTimestamp(),
        isSystem: false,
        type: 'chat',
      });

      // If main room doc has legacy chat array, delete it to keep room document lean
      if (currentRoom.chat) {
        try {
          await updateDoc(roomDoc, { chat: deleteField() });
        } catch {}
      }

      soundManager.playChat();
    },
    [currentRoom, profile]
  );

  const markRoomExpiredIfDue = useCallback(async (): Promise<boolean> => {
    if (!currentRoom) return false;
    const expiresAt = currentRoom.expiresAt;
    if (!expiresAt) return false;
    const expMs =
      expiresAt instanceof Timestamp
        ? expiresAt.toDate().getTime()
        : new Date(expiresAt).getTime();

    if (Date.now() >= expMs && currentRoom.status === 'waiting') {
      await updateRoomStatus('expired');
      return true;
    }
    return false;
  }, [currentRoom, updateRoomStatus]);

  const dismissActiveGame = useCallback(() => {
    setActiveGameId(null);
    setCurrentRoom(null);
  }, []);

  return (
    <RoomContext.Provider
      value={{
        currentRoom,
        incomingInvites,
        loading,
        joinError,
        countdown,
        activeGameId,
        setCurrentRoom,
        setJoinError,
        createRoom,
        joinRoom,
        cancelRoom,
        leaveRoom,
        updateRoomStatus,
        addOpponent,
        inviteFriend,
        acceptInvite,
        declineInvite,
        sendChatMessage,
        markRoomExpiredIfDue,
        dismissActiveGame,
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
