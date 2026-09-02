import React from 'react';
import { Trophy, Swords, Zap, Star } from 'lucide-react';

export interface ActivityItem {
  id: string;
  type: 'game_win' | 'game_loss' | 'achievement' | 'elo_milestone';
  title: string;
  timeAgo: string;
  eloChange?: number;
  badge?: string;
}

interface FriendActivityProps {
  friendName: string;
  activities?: ActivityItem[];
}

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  { id: '1', type: 'game_win', title: 'Won vs Peshmerga Grandmaster', timeAgo: '20m ago', eloChange: +18 },
  { id: '2', type: 'achievement', title: 'Unlocked "Mountain Vanguard"', timeAgo: '2h ago', badge: '🏔️' },
  { id: '3', type: 'elo_milestone', title: 'Crossed 1800 Elo Threshold', timeAgo: '1d ago', eloChange: +24 }
];

export const FriendActivity: React.FC<FriendActivityProps> = ({
  friendName,
  activities = DEFAULT_ACTIVITIES
}) => {
  return (
    <div className="space-y-3">
      <h4 className="text-xs font-black text-[#F5C453] uppercase tracking-wider flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5" />
        <span>Recent Activity • {friendName}</span>
      </h4>

      <div className="space-y-2">
        {activities.map(act => (
          <div
            key={act.id}
            className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between gap-3 text-xs"
          >
            <div className="flex items-center gap-2 min-w-0">
              {act.type === 'game_win' ? (
                <Swords className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : act.type === 'achievement' ? (
                <Trophy className="w-4 h-4 text-[#F5C453] shrink-0" />
              ) : (
                <Star className="w-4 h-4 text-blue-400 shrink-0" />
              )}
              <span className="text-white/90 truncate">{act.title}</span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {act.eloChange && (
                <span className={`font-mono font-bold text-[10px] ${
                  act.eloChange > 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {act.eloChange > 0 ? `+${act.eloChange}` : act.eloChange}
                </span>
              )}
              <span className="text-[10px] text-white/40">{act.timeAgo}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
