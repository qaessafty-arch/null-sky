import React from 'react';
import { FriendPanel } from './Friends/FriendPanel';
import { FriendUser } from '../types/chess';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (friend: FriendUser) => void;
  onChallengeFriend: (friend: FriendUser) => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({
  isOpen,
  onClose,
  onOpenChat,
  onChallengeFriend
}) => {
  return (
    <FriendPanel
      isOpen={isOpen}
      onClose={onClose}
      onOpenChat={onOpenChat}
      onChallengeFriend={onChallengeFriend}
    />
  );
};
