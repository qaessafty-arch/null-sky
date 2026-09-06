import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../utils/firebase';
import { useRoom } from '../context/RoomContext';
import { RoomInvite } from '../context/RoomContext';

export function useRoomInvites() {
  const { currentRoom, acceptInvite, declineInvite } = useRoom();
  const [invites, setInvites] = useState<RoomInvite[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentRoom) {
      setInvites([]);
      return;
    }

    setLoading(true);
    const invitesColl = collection(db, `rooms/${currentRoom.roomCode}/invites`);
    const q = query(invitesColl, orderBy('invitedAt', 'desc'));

    const unsub = onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<RoomInvite, 'id'>),
        })) as RoomInvite[];
        setInvites(items.filter((i) => i.status === 'pending'));
        setLoading(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, `rooms/${currentRoom.roomCode}/invites`);
        setLoading(false);
      },
    );

    return unsub;
  }, [currentRoom]);

  const accept = useCallback(
    async (inviteId: string) => {
      await acceptInvite(inviteId);
    },
    [acceptInvite],
  );

  const decline = useCallback(
    async (inviteId: string) => {
      await declineInvite(inviteId);
    },
    [declineInvite],
  );

  return { invites, loading, accept, decline };
}
