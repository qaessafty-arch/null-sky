import React from 'react';
import { FriendRequestItem } from '../../types/chess';
import { Check, X, Clock, UserPlus } from 'lucide-react';

interface FriendRequestsProps {
  incomingRequests: FriendRequestItem[];
  outgoingRequests: FriendRequestItem[];
  onAccept: (req: FriendRequestItem) => void;
  onDecline: (req: FriendRequestItem) => void;
  onCancelSent?: (req: FriendRequestItem) => void;
}

export const FriendRequests: React.FC<FriendRequestsProps> = ({
  incomingRequests,
  outgoingRequests,
  onAccept,
  onDecline,
  onCancelSent
}) => {
  return (
    <div className="space-y-6 overflow-y-auto max-h-[500px] pr-1">
      {/* Incoming Requests */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-[#F5C453] uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Received Requests</span>
          </h4>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F5C453]/20 text-[#F5C453] font-bold">
            {incomingRequests.length}
          </span>
        </div>

        {incomingRequests.length === 0 ? (
          <div className="p-5 text-center glass-card-subtle rounded-2xl">
            <p className="text-xs text-white/40 italic">No incoming friend requests at the moment.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {incomingRequests.map(req => (
              <div
                key={req.id}
                className="p-3.5 rounded-2xl glass-card-subtle border border-[#F5C453]/30 flex items-center justify-between gap-3 transition-all"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {req.fromUserAvatar ? (
                    <img
                      src={req.fromUserAvatar}
                      alt={req.fromUserName}
                      className="w-10 h-10 rounded-full object-cover border border-[#F5C453]"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#52673A] to-[#8C2425] border border-[#F5C453] flex items-center justify-center font-bold text-sm text-white">
                      {req.fromUserName ? req.fromUserName.charAt(0).toUpperCase() : 'T'}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-xs font-black text-white truncate">
                        {req.fromUserName}
                      </span>
                      {req.fromUsername && (
                        <span className="text-[10px] font-mono text-[#F5C453]">
                          @{req.fromUsername}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#DFD0B0]/60 flex items-center gap-1.5">
                      <span>{req.fromUserHonorRank}</span>
                      <span>•</span>
                      <span className="font-mono text-emerald-400 font-bold">{req.fromUserElo} Elo</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onAccept(req)}
                    className="px-3 py-1.5 rounded-xl bg-[#52673A] hover:bg-[#52673A]/80 text-white text-xs font-bold flex items-center gap-1 shadow-md border border-[#F5C453]/30 cursor-pointer active:scale-95"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Accept</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDecline(req)}
                    className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs cursor-pointer"
                    title="Decline Request"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Outgoing Requests */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-white/60 uppercase tracking-wider flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" />
            <span>Sent Requests</span>
          </h4>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white/60 font-bold">
            {outgoingRequests.length}
          </span>
        </div>

        {outgoingRequests.length === 0 ? (
          <p className="text-xs text-white/30 italic">No sent requests pending.</p>
        ) : (
          <div className="space-y-2">
            {outgoingRequests.map(req => (
              <div
                key={req.id}
                className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-white/80">
                    To: {req.toUsername ? `@${req.toUsername}` : 'Player'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">
                    Pending
                  </span>
                </div>
                {onCancelSent && (
                  <button
                    type="button"
                    onClick={() => onCancelSent(req)}
                    className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Cancel
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
