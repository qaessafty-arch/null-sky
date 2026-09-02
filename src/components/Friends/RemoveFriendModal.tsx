import React from 'react';
import { FriendUser } from '../../types/chess';
import { Trash2, AlertTriangle } from 'lucide-react';

interface RemoveFriendModalProps {
  isOpen: boolean;
  friend: FriendUser | null;
  onClose: () => void;
  onConfirm: (friend: FriendUser) => void;
}

export const RemoveFriendModal: React.FC<RemoveFriendModalProps> = ({
  isOpen,
  friend,
  onClose,
  onConfirm
}) => {
  if (!isOpen || !friend) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="glass-friend-panel rounded-3xl p-6 max-w-sm w-full border border-rose-500/30 text-center space-y-4 animate-in fade-in">
        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-base font-black text-white">Remove Friend?</h3>
          <p className="text-xs text-white/60 mt-1">
            Are you sure you want to remove <strong className="text-white">{friend.displayName}</strong> from your alliance list?
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm(friend);
              onClose();
            }}
            className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-rose-900/40"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};
