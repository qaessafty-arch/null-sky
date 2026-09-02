import React from 'react';
import { FriendUser } from '../../types/chess';
import { FriendCard } from './FriendCard';
import { FriendSkeleton } from './FriendSkeleton';
import { Users, UserPlus } from 'lucide-react';

interface FriendListProps {
  friends: FriendUser[];
  selectedFriend: FriendUser | null;
  isLoading: boolean;
  onSelectFriend: (friend: FriendUser) => void;
  onChallengeFriend: (friend: FriendUser) => void;
  onChatFriend: (friend: FriendUser) => void;
  onRemoveFriend: (friend: FriendUser) => void;
  onFindFriends: () => void;
}

export const FriendList: React.FC<FriendListProps> = ({
  friends,
  selectedFriend,
  isLoading,
  onSelectFriend,
  onChallengeFriend,
  onChatFriend,
  onRemoveFriend,
  onFindFriends
}) => {
  if (isLoading) {
    return <FriendSkeleton count={4} />;
  }

  if (friends.length === 0) {
    return (
      <div className="p-8 text-center glass-card-subtle rounded-3xl flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#F5C453]">
          <Users className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-white">No Friends Found</h4>
        <p className="text-xs text-[#DFD0B0]/60 max-w-xs">
          Your social realm is empty or no player matched your filter. Invite other tacticians to join your alliance!
        </p>
        <button
          type="button"
          onClick={onFindFriends}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#52673A] to-[#8C2425] text-white text-xs font-black shadow-lg hover:brightness-110 transition-all cursor-pointer"
        >
          <UserPlus className="w-4 h-4 text-[#F5C453]" />
          <span>Add Friends</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2 overflow-y-auto max-h-[500px] pr-1 custom-scrollbar">
      {friends.map(friend => (
        <FriendCard
          key={friend.uid}
          friend={friend}
          isSelected={selectedFriend?.uid === friend.uid}
          onSelect={onSelectFriend}
          onChallenge={onChallengeFriend}
          onChat={onChatFriend}
          onRemove={onRemoveFriend}
        />
      ))}
    </div>
  );
};
