import React, { useEffect, useState } from 'react';
import { Trophy, Users, Shield, ArrowLeft, Award, Clock } from 'lucide-react';

interface TournamentViewProps {
  tournamentId: string;
  onBack: () => void;
  onJoinTournament: (id: string) => void;
  currentUserId?: string;
}

export const TournamentView: React.FC<TournamentViewProps> = ({
  tournamentId,
  onBack,
  onJoinTournament,
  currentUserId
}) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch(`/api/tournaments/${tournamentId}`)
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [tournamentId]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    );
  }

  const { tournament, participants = [] } = data;
  const isJoined = participants.some((p: any) => p.user_id === currentUserId);

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Lobby
      </button>

      {/* Header Card */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <Trophy className="w-8 h-8 text-amber-400" />
            <h1 className="text-2xl md:text-3xl font-black text-white">{tournament.name}</h1>
          </div>
          <p className="text-sm text-neutral-400 mt-2">
            Format: <span className="text-white capitalize">{tournament.type}</span> • Time Control:{' '}
            <span className="text-white">{tournament.time_control}</span> • Prize Pool:{' '}
            <span className="text-amber-400 font-bold">${tournament.prize_pool || '0'}</span>
          </p>
        </div>

        <div>
          {isJoined ? (
            <div className="px-5 py-2.5 bg-emerald-950/60 border border-emerald-800 text-emerald-400 rounded-xl font-bold text-sm text-center">
              Registered
            </div>
          ) : (
            <button
              onClick={() => onJoinTournament(tournament.id)}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-colors shadow-lg"
            >
              Register Now
            </button>
          )}
        </div>
      </div>

      {/* Standings Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Award className="w-5 h-5 text-emerald-400" />
          Standings & Pairings
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-800 text-neutral-400 text-xs uppercase">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-right">Tiebreak (SB)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {participants.map((p: any, idx: number) => (
                <tr key={p.user_id} className="hover:bg-neutral-800/40">
                  <td className="py-3 px-4 font-mono font-bold text-neutral-400">#{idx + 1}</td>
                  <td className="py-3 px-4 font-semibold text-white">{p.username}</td>
                  <td className="py-3 px-4 font-mono text-neutral-400">{p.elo_rating || 1200}</td>
                  <td className="py-3 px-4 text-center font-bold text-emerald-400 font-mono">{p.score}</td>
                  <td className="py-3 px-4 text-right font-mono text-neutral-400">{p.tiebreak_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
