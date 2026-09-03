// FILE: frontend/src/components/Tournament.tsx
import React from 'react';
import { TournamentView } from './TournamentView';

export { TournamentView as Tournament };
export default function Tournament(props: any) {
  return <TournamentView {...props} />;
}
