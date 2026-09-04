import React, { useEffect, useState } from 'react';
import { Trophy, Medal, ArrowLeft } from 'lucide-react';

interface LeaderboardViewProps {
  onBack: () => void;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onBack }) => {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/leaderboard')
      .then(res => res.json())
      .then(data => {
        setLeaders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Lobby
      </button>

      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8">
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-8 h-8 text-amber-400" />
          <div>
            <h1 className="text-2xl font-black text-white">Global Leaderboard</h1>
            <p className="text-sm text-neutral-400">Top rated chess grandmasters across all time controls</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Country</th>
                  <th className="py-3 px-4 text-center">ELO Rating</th>
                  <th className="py-3 px-4 text-right">Win Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60">
                {leaders.map((user, idx) => {
                  const winRate = user.games_played > 0
                    ? Math.round((user.games_won / user.games_played) * 100)
                    : 0;

                  return (
                    <tr key={user.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold">
                        {idx === 0 && <span className="text-amber-400">🥇 #1</span>}
                        {idx === 1 && <span className="text-neutral-300">🥈 #2</span>}
                        {idx === 2 && <span className="text-amber-600">🥉 #3</span>}
                        {idx > 2 && <span className="text-neutral-500">#{idx + 1}</span>}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">{user.username}</td>
                      <td className="py-3 px-4 text-neutral-400 uppercase font-mono text-xs">{user.country_code || 'US'}</td>
                      <td className="py-3 px-4 text-center font-mono font-black text-emerald-400 text-base">{user.elo_rating}</td>
                      <td className="py-3 px-4 text-right font-mono text-neutral-300">{winRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
