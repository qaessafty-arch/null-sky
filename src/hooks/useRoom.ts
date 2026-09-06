import { useRoom as _useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../utils/firebase';

export function useRoom() {
  const room = _useRoom();
  const { profile } = useAuth();
  const { showToast, sendNotification } = useNotification();

  const joinAsOpponent = async (code: string) => {
    try {
      await room.joinRoom(code);
      showToast({
        type: 'room_join',
        title: 'Opponent joined',
        message: `You joined room ${code}. Prepare for battle.`,
        duration: 5000,
      });
      // Notify the host.
      if (room.currentRoom) {
      await sendNotification(room.currentRoom.creatorId, {
        userId: room.currentRoom.creatorId,
        type: 'room_join',
        title: 'Opponent joined your room',
        message: `${profile?.displayName || 'Opponent'} joined room ${code}.`,
      });
      }
    } catch (e: any) {
      room.setJoinError(e?.message || 'Could not join the room.');
      return false;
    }
    return true;
  };

  const hostRoom = async (code: string, settings: Parameters<typeof room.createRoom>[1]) => {
    try {
      await room.createRoom(code, settings);
      showToast({
        type: 'room_join',
        title: 'Room created',
        message: `Share code ${code} with your friend.`,
        duration: 6000,
      });
    } catch (e: any) {
      room.setJoinError(e?.message || 'Could not create the room.');
      return false;
    }
    return true;
  };

  const inviteFriendNotify = async (friendUid: string, friendName: string, roomCode: string) => {
    if (!profile) return;
    await sendNotification(friendUid, {
      userId: friendUid,
      type: 'room_invite',
      title: 'Game invite',
      message: `${profile.displayName || 'A friend'} invited you to room ${roomCode}. Accept to join.`,
    });
    showToast({
      type: 'room_invite',
      title: 'Invite sent',
      message: `${friendName} was invited to room ${roomCode}.`,
      duration: 5000,
    });
  };

  return {
    ...room,
    joinAsOpponent,
    hostRoom,
    inviteFriendNotify,
  };
}
