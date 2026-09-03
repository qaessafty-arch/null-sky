import React from 'react';
import { User, Trophy, Shield, ArrowLeft, Calendar, Flag } from 'lucide-react';

interface ProfileViewProps {
  user: any;
  onBack: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onBack }) => {
  const gamesPlayed = user?.games_played || 0;
  const gamesWon = user?.games_won || 0;
  const gamesDrawn = user?.games_drawn || 0;
  const gamesLost = Math.max(0, gamesPlayed - gamesWon - gamesDrawn);
  const winPercent = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Lobby
      </button>

      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{user?.username || 'Grandmaster'}</h1>
            <div className="flex items-center gap-3 text-xs text-neutral-400 mt-1">
              <span className="flex items-center gap-1">
                <Flag className="w-3.5 h-3.5 text-neutral-500" />
                {user?.country_code || 'US'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                Member since 2026
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl text-center">
            <span className="text-xs text-neutral-400">Current ELO</span>
            <div className="text-2xl font-black text-emerald-400 font-mono mt-1">{user?.elo_rating || 1200}</div>
          </div>
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl text-center">
            <span className="text-xs text-neutral-400">Games Won</span>
            <div className="text-2xl font-black text-white font-mono mt-1">{gamesWon}</div>
          </div>
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl text-center">
            <span className="text-xs text-neutral-400">Win Rate</span>
            <div className="text-2xl font-black text-amber-400 font-mono mt-1">{winPercent}%</div>
          </div>
          <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl text-center">
            <span className="text-xs text-neutral-400">Total Played</span>
            <div className="text-2xl font-black text-neutral-300 font-mono mt-1">{gamesPlayed}</div>
          </div>
        </div>

        {/* Win/Loss Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold">
            <span className="text-emerald-400">{gamesWon} Wins</span>
            <span className="text-neutral-400">{gamesDrawn} Draws</span>
            <span className="text-rose-400">{gamesLost} Losses</span>
          </div>
          <div className="h-2.5 w-full bg-neutral-950 rounded-full overflow-hidden flex">
            <div style={{ width: `${gamesPlayed ? (gamesWon / gamesPlayed) * 100 : 33}%` }} className="bg-emerald-500 h-full" />
            <div style={{ width: `${gamesPlayed ? (gamesDrawn / gamesPlayed) * 100 : 33}%` }} className="bg-neutral-600 h-full" />
            <div style={{ width: `${gamesPlayed ? (gamesLost / gamesPlayed) * 100 : 34}%` }} className="bg-rose-500 h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
