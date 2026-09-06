import React from 'react';
import { motion } from 'motion/react';
import { Swords, Clock, Check, X, Shield } from 'lucide-react';

interface InviteNotificationProps {
  inviteId: string;
  roomCode: string;
  invitedByName: string;
  invitedByPhoto?: string;
  timeControlName?: string;
  rated?: boolean;
  onAccept: (inviteId: string, roomCode: string) => void;
  onDecline: (inviteId: string) => void;
}

export const InviteNotification: React.FC<InviteNotificationProps> = ({
  inviteId,
  roomCode,
  invitedByName,
  invitedByPhoto,
  timeControlName = '10+0',
  rated = true,
  onAccept,
  onDecline,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -10 }}
      className="p-4 rounded-xl border border-[#F5C453]/40 bg-gradient-to-br from-[#0F172A] to-[#1E293B] shadow-2xl backdrop-blur-2xl flex flex-col gap-3 max-w-sm w-full"
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <img
            src={invitedByPhoto || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
            alt=""
            className="w-10 h-10 rounded-full object-cover border-2 border-[#F5C453]"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#52673A] flex items-center justify-center text-white border border-[#0F172A]">
            <Swords className="w-3 h-3" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-white truncate">
            {invitedByName}
          </h4>
          <p className="text-xs text-[#F5C453] font-semibold flex items-center gap-1.5 mt-0.5">
            <Clock className="w-3 h-3" />
            <span>Challenged you to a private battle</span>
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 font-mono text-white/70">
        <span>Format: {timeControlName}</span>
        <span className="flex items-center gap-1 text-[#F5C453]">
          <Shield className="w-3 h-3" />
          {rated ? 'Rated' : 'Casual'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-1">
        <button
          type="button"
          onClick={() => onAccept(inviteId, roomCode)}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gradient-to-r from-[#F5C453] to-[#D4A843] text-black text-xs font-black uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-md cursor-pointer"
        >
          <Check className="w-3.5 h-3.5" />
          Accept
        </button>
        <button
          type="button"
          onClick={() => onDecline(inviteId)}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-white/10 hover:bg-white/15 text-white/80 text-xs font-bold active:scale-95 transition-all cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
          Decline
        </button>
      </div>
    </motion.div>
  );
};
