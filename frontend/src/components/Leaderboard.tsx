// FILE: frontend/src/components/Leaderboard.tsx
import React from 'react';
import { LeaderboardView } from './LeaderboardView';

export { LeaderboardView as Leaderboard };
export default function Leaderboard(props: any) {
  return <LeaderboardView {...props} />;
}
