import React from 'react';
import { TIME_CONTROLS } from '../../utils/chessEngine';
import { TimeControl, FriendUser } from '../../types/chess';
import { Swords, Clock, X, Sparkles } from 'lucide-react';

interface GameInviteProps {
  isOpen: boolean;
  friend: FriendUser | null;
  onClose: () => void;
  onSendChallenge: (friend: FriendUser, timeControl: TimeControl) => void;
}

export const GameInvite: React.FC<GameInviteProps> = ({
  isOpen,
  friend,
  onClose,
  onSendChallenge
}) => {
  const [selectedTc, setSelectedTc] = React.useState<TimeControl>(TIME_CONTROLS[4]); // Blitz 5 min

  if (!isOpen || !friend) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="glass-friend-panel rounded-3xl p-6 max-w-md w-full border border-[#F5C453]/40 space-y-4 animate-in fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-[#8C2425]/40 text-[#F5C453] border border-[#F5C453]/30">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Challenge to Match</h3>
              <p className="text-[11px] text-[#DFD0B0]/70">Versus {friend.displayName}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-white/70 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#F5C453]" />
            <span>Select Time Control</span>
          </label>

          <div className="grid grid-cols-2 gap-2">
            {TIME_CONTROLS.slice(0, 8).map(tc => {
              const isSelected = selectedTc.id === tc.id;
              return (
                <button
                  key={tc.id}
                  type="button"
                  onClick={() => setSelectedTc(tc)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#52673A]/40 border-[#F5C453] shadow-md'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="text-xs font-black text-white flex items-center justify-between">
                    <span>{tc.name}</span>
                    <span className="text-[10px] text-[#F5C453] font-mono">
                      {Math.floor(tc.initialSeconds / 60)}+{tc.incrementSeconds}s
                    </span>
                  </div>
                  <p className="text-[10px] text-white/40 mt-0.5 capitalize">{tc.category}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-3">
          <button
            type="button"
            onClick={() => {
              onSendChallenge(friend, selectedTc);
              onClose();
            }}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#8C2425] to-[#B91C1C] hover:brightness-110 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl border border-[#F5C453]/40 cursor-pointer active:scale-98 transition-all"
          >
            <Sparkles className="w-4 h-4 text-[#F5C453]" />
            <span>Issue Challenge</span>
          </button>
        </div>
      </div>
    </div>
  );
};
