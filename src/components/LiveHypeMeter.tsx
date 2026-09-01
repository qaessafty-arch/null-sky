import React, { useState, useEffect } from 'react';
import { Zap } from 'lucide-react';
import { socketService } from '../utils/socket';
import confetti from 'canvas-confetti';

interface LiveHypeMeterProps {
  matchId: string;
}

export const LiveHypeMeter: React.FC<LiveHypeMeterProps> = ({ matchId }) => {
  const [hype, setHype] = useState(0);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) return;

    const handleHype = (data: { hype: number }) => {
      setHype(data.hype);
      if (data.hype >= 100) {
        triggerHypeEffect();
        setTimeout(() => setHype(0), 2000);
      }
    };

    socket.on('match_hype_update', handleHype);
    return () => {
      socket.off('match_hype_update', handleHype);
    };
  }, []);

  const triggerHypeEffect = () => {
    confetti({
      particleCount: 100,
      spread: 90,
      origin: { y: 0.5 },
      colors: ['#F5C453', '#A855F7', '#EF4444']
    });
  };

  const handleClick = () => {
    const newHype = Math.min(100, hype + 10);
    setHype(newHype);
    const socket = socketService.getSocket();
    if (socket) {
      socket.emit('match_hype_increment', { matchId, increment: 10 });
    }
    if (newHype >= 100) {
      triggerHypeEffect();
      setTimeout(() => setHype(0), 2000);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 relative">
      <div className="flex items-center justify-between text-[10px] uppercase font-black text-[#F5C453]/70">
        <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Spectator Hype</span>
        <span>{hype}%</span>
      </div>
      <button 
        onClick={handleClick}
        className="relative w-full h-8 rounded-full bg-black/40 border border-white/10 overflow-hidden cursor-pointer group hover:border-[#F5C453]/50 transition-colors"
      >
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-orange-500 via-rose-500 to-purple-500 transition-all duration-300"
          style={{ width: `${hype}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse mix-blend-overlay" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] font-black text-white drop-shadow-md tracking-widest uppercase">Click to Hype!</span>
        </div>
      </button>
    </div>
  );
};
