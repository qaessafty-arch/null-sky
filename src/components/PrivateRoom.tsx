import React from 'react';
import { motion } from 'motion/react';
import { GlassCard } from './GlassUI';
import { Share2, Copy, Users, LogIn } from 'lucide-react';

interface PrivateRoomProps {
  roomCode: string;
  isHost: boolean;
  onJoin: (code: string) => void;
  onCreate: () => void;
  waitingForOpponent: boolean;
}

export const PrivateRoomView: React.FC<PrivateRoomProps> = ({
  roomCode,
  isHost,
  onJoin,
  onCreate,
  waitingForOpponent
}) => {
  const [inputCode, setInputCode] = React.useState('');

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  return (
    <div className="flex flex-col gap-6">
      {!roomCode && !waitingForOpponent ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard intensity="medium" className="flex flex-col gap-6 p-8">
            <div className="p-3 w-12 h-12 rounded-2xl bg-[#FFD700]/10 flex items-center justify-center">
              <Users className="text-[#FFD700]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase text-white">Create Arena</h3>
              <p className="text-xs text-white/50 font-bold">HOST A PRIVATE BATTLE WITH A FRIEND</p>
            </div>
            <button 
              onClick={onCreate}
              className="w-full py-4 glass-button-gold rounded-xl font-black uppercase tracking-widest text-xs"
            >
              Generate Room Code
            </button>
          </GlassCard>

          <GlassCard intensity="medium" className="flex flex-col gap-6 p-8">
            <div className="p-3 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
              <LogIn className="text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase text-white">Join Arena</h3>
              <p className="text-xs text-white/50 font-bold">ENTER CODE TO CHALLENGE HOST</p>
            </div>
            <div className="flex gap-2">
              <input 
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="6-DIGIT CODE"
                className="flex-1 glass-input font-mono text-center tracking-[0.5em]"
                maxLength={6}
              />
              <button 
                onClick={() => onJoin(inputCode)}
                className="px-6 glass-button-gold rounded-xl font-black uppercase text-xs"
              >
                JOIN
              </button>
            </div>
          </GlassCard>
        </div>
      ) : (
        <GlassCard intensity="high" className="max-w-md mx-auto w-full p-10 text-center space-y-8">
          <div className="relative inline-block">
            <div className="text-xs font-black text-[#FFD700] uppercase tracking-[0.3em] mb-4">ROOM SECURE</div>
            <div className="text-5xl font-mono font-black text-white tracking-[0.2em] py-4 border-y border-white/10">
              {roomCode}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-bold text-white uppercase tracking-widest animate-pulse">
              {waitingForOpponent ? "Waiting for Challenger..." : "Room Established"}
            </p>
            <p className="text-xs text-white/40">SHARE THIS CODE WITH YOUR OPPONENT TO START THE BATTLE</p>
          </div>

          <div className="flex gap-3">
            <button 
              onClick={copyCode}
              className="flex-1 flex items-center justify-center gap-2 py-3 glass-frost hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
            >
              <Copy size={14} />
              Copy Code
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 glass-frost hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest">
              <Share2 size={14} />
              Share Link
            </button>
          </div>
        </GlassCard>
      )}
    </div>
  );
};
