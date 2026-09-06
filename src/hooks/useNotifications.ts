import { useNotification } from '../context/NotificationContext';
import { soundManager } from '../utils/audio';

export const useNotifications = () => {
  const notif = useNotification();

  const notifyRoomCreated = (code: string) => {
    notif.showToast({
      type: 'system',
      title: '🏠 Room Created',
      message: `Room code ${code} is ready. Waiting for opponent.`,
      duration: 6000,
    });
    soundManager.playNotification();
  };

  const notifyOpponentJoined = (opponentName: string) => {
    notif.showToast({
      type: 'challenge',
      title: '👤 Opponent Joined!',
      message: `${opponentName} joined the room. Game starting soon!`,
      duration: 5000,
    });
    soundManager.playMatchFound();
  };

  const notifyNewMessage = (senderName: string, text: string) => {
    soundManager.playChat();
  };

  const notifyInviteSent = (friendName: string) => {
    notif.showToast({
      type: 'system',
      title: '📨 Invite Sent',
      message: `Challenge dispatched to ${friendName}.`,
      duration: 4000,
    });
  };

  const notifyRoomExpiringSoon = () => {
    notif.showToast({
      type: 'system',
      title: '⏳ Room Expiring',
      message: 'Room will expire in 5 minutes if no opponent joins.',
      duration: 8000,
    });
  };

  const notifyRoomError = (errorMsg: string) => {
    notif.showToast({
      type: 'system',
      title: '⚠️ Room Notice',
      message: errorMsg,
      duration: 5000,
    });
  };

  return {
    ...notif,
    notifyRoomCreated,
    notifyOpponentJoined,
    notifyNewMessage,
    notifyInviteSent,
    notifyRoomExpiringSoon,
    notifyRoomError,
  };
};

export default useNotifications;
