import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from './GlassUI';
import { GlassButton } from './GlassButton';
import { ConnectionStatus } from './multiplayer/ConnectionStatus';
import { SyncedClock } from './Clock';
import { Flag, Handshake, RotateCcw, AlertCircle, WifiOff, Trophy } from 'lucide-react';

interface GameRoomProps {
  status: 'in_progress' | 'game_over' | 'disconnected';
  turn: 'white' | 'black';
  myColor: 'white' | 'black';
  whitePlayer: { name: string; elo: number; avatar?: string };
  blackPlayer: { name: string; elo: number; avatar?: string };
  clocks: { white: number; black: number; total: number };
  onResign: () => void;
  onOfferDraw: () => void;
  onRematch?: () => void;
  isReconnecting?: boolean;
}

export const GameRoom: React.FC<GameRoomProps> = ({
  status,
  turn,
  myColor,
  whitePlayer,
  blackPlayer,
  clocks,
  onResign,
  onOfferDraw,
  onRematch,
  isReconnecting
}) => {
  const isMyTurn = turn === myColor && status === 'in_progress';
  const opponent = myColor === 'white' ? blackPlayer : whitePlayer;
  const me = myColor === 'white' ? whitePlayer : blackPlayer;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Network & Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <ConnectionStatus 
          status={isReconnecting ? 'syncing' : status === 'disconnected' ? 'offline' : 'online'} 
          latency={24}
          syncMessage={isReconnecting ? "Reconnecting..." : "Synced with Server"}
        />
        
        <div className={`px-6 py-2 rounded-full glass-frost border-[#FFD700]/20 flex items-center gap-3 transition-all duration-500 ${
          isMyTurn ? 'shadow-[0_0_20px_rgba(255,215,0,0.2)] bg-[#FFD700]/10' : ''
        }`}>
          <div className={`w-2 h-2 rounded-full ${isMyTurn ? 'bg-[#FFD700] animate-ping' : 'bg-white/20'}`} />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">
            {isMyTurn ? "Your Turn" : "Opponent's Turn"}
          </span>
        </div>
      </div>

      {/* Disconnection Overlay */}
      <AnimatePresence>
        {status === 'disconnected' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-4 bg-red-500/20 border border-red-500/40 rounded-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <WifiOff className="text-red-500" />
              <div>
                <div className="text-sm font-black text-white">CONNECTION LOST</div>
                <div className="text-[10px] text-white/50 uppercase font-bold tracking-widest">Opponent disconnected - Waiting 60s</div>
              </div>
            </div>
            <div className="text-xl font-mono font-black text-red-500">59s</div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Opponent Side */}
        <SyncedClock 
          timeSeconds={myColor === 'white' ? clocks.black : clocks.white}
          totalTimeSeconds={clocks.total}
          isActive={!isMyTurn && status === 'in_progress'}
          label={opponent.name}
          isOpponent
        />

        {/* My Side */}
        <SyncedClock 
          timeSeconds={myColor === 'white' ? clocks.white : clocks.black}
          totalTimeSeconds={clocks.total}
          isActive={isMyTurn && status === 'in_progress'}
          label="You"
        />
      </div>

      {/* Action Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GlassButton variant="default" onClick={onOfferDraw} className="flex-1">
          <Handshake size={14} />
          Offer Draw
        </GlassButton>
        <GlassButton variant="red" onClick={onResign} className="flex-1">
          <Flag size={14} />
          Resign
        </GlassButton>
        {status === 'game_over' && (
          <GlassButton variant="secondary" onClick={onRematch} className="col-span-2">
            <RotateCcw size={14} />
            Rematch
          </GlassButton>
        )}
      </div>

      {/* Game State Banner */}
      <AnimatePresence>
        {status === 'game_over' && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none"
          >
            <GlassCard intensity="high" className="p-10 text-center space-y-4">
              <Trophy size={64} className="text-[#FFD700] mx-auto mb-4" />
              <h2 className="text-4xl font-black uppercase text-white tracking-tighter">White Wins!</h2>
              <p className="text-white/50 font-bold uppercase tracking-[0.3em]">Checkmate by Resignation</p>
              <div className="flex items-center justify-center gap-4 text-[#FFD700] font-mono text-sm pt-4">
                <span>ELO +24</span>
                <span className="w-1 h-1 bg-white/20 rounded-full" />
                <span>RESPECT +50</span>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
