import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Swords, Medal, Target } from 'lucide-react';
import { GlassCard } from './GlassUI';

interface TournamentMatch {
  id: string;
  white: { name: string; elo: number; wins: number };
  black: { name: string; elo: number; wins: number };
  status: 'pending' | 'active' | 'completed';
  winner?: string;
}

interface TournamentBracketProps {
  round: number;
  totalRounds: number;
  matches: TournamentMatch[];
  currentMatchId?: string;
}

export const TournamentBracket: React.FC<TournamentBracketProps> = ({
  round,
  totalRounds,
  matches,
  currentMatchId
}) => {
  return (
    <div className="w-full space-y-8 py-6">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FFD700]/10 flex items-center justify-center border border-[#FFD700]/20">
            <Trophy className="text-[#FFD700]" size={20} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase text-white tracking-tight">Knockout Stage</h3>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Round {round} of {totalRounds}</p>
          </div>
        </div>
        <GlassCard intensity="low" className="px-4 py-2 !rounded-full border-[#FFD700]/20">
          <span className="text-[10px] font-black text-[#FFD700] uppercase tracking-widest">Grand Prize: 10,000 XP</span>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 px-4">
        {matches.map((match, idx) => (
          <div key={match.id} className="relative">
            <GlassCard 
              intensity={match.id === currentMatchId ? 'high' : 'medium'}
              className={`p-4 border-l-4 ${
                match.id === currentMatchId 
                  ? 'border-l-[#FFD700] shadow-[0_0_30px_rgba(255,215,0,0.1)]' 
                  : 'border-l-white/10'
              }`}
            >
              <div className="space-y-3">
                {/* Player 1 */}
                <div className={`flex items-center justify-between p-2 rounded-lg ${match.winner === 'white' ? 'bg-green-500/10' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-[10px] font-bold">W</div>
                    <div className="text-[11px] font-black uppercase text-white/80">{match.white.name}</div>
                  </div>
                  <div className="text-[10px] font-mono text-[#FFD700]">{match.white.elo}</div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="h-[1px] flex-1 bg-white/5" />
                  <span className="text-[9px] font-black text-white/20">VS</span>
                  <div className="h-[1px] flex-1 bg-white/5" />
                </div>

                {/* Player 2 */}
                <div className={`flex items-center justify-between p-2 rounded-lg ${match.winner === 'black' ? 'bg-green-500/10' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md bg-white/5 flex items-center justify-center text-[10px] font-bold">B</div>
                    <div className="text-[11px] font-black uppercase text-white/80">{match.black.name}</div>
                  </div>
                  <div className="text-[10px] font-mono text-[#FFD700]">{match.black.elo}</div>
                </div>
              </div>

              {match.id === currentMatchId && (
                <div className="mt-4 pt-3 border-t border-white/5">
                  <button className="w-full py-2 bg-[#FFD700] text-black text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-white transition-colors">
                    Enter Match
                  </button>
                </div>
              )}
            </GlassCard>
            
            {/* Connector Lines */}
            {idx % 2 === 0 && (
              <div className="hidden lg:block absolute -right-6 top-1/2 w-6 h-[1px] bg-white/10" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
