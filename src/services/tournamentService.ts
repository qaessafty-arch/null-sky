import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs,
  query,
  where,
  updateDoc, 
  onSnapshot
} from 'firebase/firestore';
import { db } from '../utils/firebase';
import { Tournament, TournamentPlayer, TimeControl, TournamentMatchNode } from '../types/chess';
import { createOnlineMatchChallenge } from './onlineMatchService';

export const listenToTournaments = (
  callback: (tournaments: Tournament[]) => void
) => {
  const q = query(collection(db, 'tournaments'));
  return onSnapshot(q, snap => {
    const t: Tournament[] = [];
    snap.forEach(d => t.push(d.data() as Tournament));
    callback(t);
  });
};

export const createTournament = async (
  name: string,
  creator: TournamentPlayer,
  maxPlayers: number,
  timeControl: TimeControl
): Promise<string> => {
  const id = `tourn_${Date.now()}`;
  const t: Tournament = {
    id,
    name,
    creatorId: creator.uid,
    creatorName: creator.displayName,
    status: 'registration',
    maxPlayers,
    players: [creator],
    timeControl,
    matches: [],
    createdAt: new Date().toISOString()
  };
  await setDoc(doc(db, 'tournaments', id), t);
  return id;
};

const generateBracket = (players: TournamentPlayer[], maxPlayers: number): TournamentMatchNode[] => {
  const matches: TournamentMatchNode[] = [];
  const rounds = Math.log2(maxPlayers);
  
  let matchCounter = 1;
  const nodesByRound: { [round: number]: TournamentMatchNode[] } = {};
  
  // Create first round matches
  nodesByRound[1] = [];
  for (let i = 0; i < maxPlayers / 2; i++) {
    const p1 = players[i * 2] || null;
    const p2 = players[i * 2 + 1] || null;
    const node: TournamentMatchNode = {
      id: `m_${matchCounter++}`,
      round: 1,
      player1: p1,
      player2: p2,
      winnerId: null,
      matchSessionId: null,
      nextMatchId: null,
      status: (p1 && p2) ? 'ready' : (p1 ? 'completed' : 'pending') // if bye, completed
    };
    if (node.status === 'completed' && p1) node.winnerId = p1.uid;
    matches.push(node);
    nodesByRound[1].push(node);
  }
  
  // Create subsequent rounds
  for (let r = 2; r <= rounds; r++) {
    nodesByRound[r] = [];
    const prevRoundNodes = nodesByRound[r - 1];
    for (let i = 0; i < prevRoundNodes.length; i += 2) {
      const node: TournamentMatchNode = {
        id: `m_${matchCounter++}`,
        round: r,
        player1: null,
        player2: null,
        winnerId: null,
        matchSessionId: null,
        nextMatchId: null,
        status: 'pending'
      };
      
      prevRoundNodes[i].nextMatchId = node.id;
      prevRoundNodes[i+1].nextMatchId = node.id;
      
      // Auto-advance byes
      if (prevRoundNodes[i].winnerId) node.player1 = players.find(p => p.uid === prevRoundNodes[i].winnerId) || null;
      if (prevRoundNodes[i+1].winnerId) node.player2 = players.find(p => p.uid === prevRoundNodes[i+1].winnerId) || null;
      if (node.player1 && node.player2) node.status = 'ready';

      matches.push(node);
      nodesByRound[r].push(node);
    }
  }

  return matches;
};

export const joinTournament = async (tournamentId: string, player: TournamentPlayer) => {
  const ref = doc(db, 'tournaments', tournamentId);
  const snap = await getDoc(ref);
  if (!snap.exists()) throw new Error("Tournament not found");
  
  const t = snap.data() as Tournament;
  if (t.status !== 'registration') throw new Error("Tournament already started");
  if (t.players.length >= t.maxPlayers) throw new Error("Tournament is full");
  if (t.players.find(p => p.uid === player.uid)) throw new Error("Already joined");
  
  const updatedPlayers = [...t.players, player];
  let updateData: Partial<Tournament> = { players: updatedPlayers };
  
  // Auto-start if full
  if (updatedPlayers.length === t.maxPlayers) {
    updateData.status = 'in_progress';
    updateData.matches = generateBracket(updatedPlayers, t.maxPlayers);
  }
  
  await updateDoc(ref, updateData);
};

export const startMatch = async (tournamentId: string, matchId: string, timeControl: TimeControl): Promise<string> => {
  const ref = doc(db, 'tournaments', tournamentId);
  const snap = await getDoc(ref);
  const t = snap.data() as Tournament;
  
  const matchIndex = t.matches.findIndex(m => m.id === matchId);
  if (matchIndex === -1) throw new Error("Match not found");
  const m = t.matches[matchIndex];
  
  if (!m.player1 || !m.player2) throw new Error("Players not ready");
  
  const sessionId = await createOnlineMatchChallenge(
    { uid: m.player1.uid, displayName: m.player1.displayName, elo: m.player1.elo },
    { uid: m.player2.uid, displayName: m.player2.displayName, elo: m.player2.elo },
    timeControl,
    'random'
  );
  
  if (!sessionId) throw new Error("Failed to create match");

  // Attach tournament info to the match session
  await updateDoc(doc(db, 'online_matches', sessionId), {
    tournamentId,
    tournamentMatchId: matchId
  });
  
  const updatedMatches = [...t.matches];
  updatedMatches[matchIndex] = { ...m, matchSessionId: sessionId, status: 'in_progress' };
  
  await updateDoc(ref, { matches: updatedMatches });
  
  return sessionId;
};

export const advanceTournamentMatch = async (tournamentId: string, matchId: string, winnerId: string) => {
  const ref = doc(db, 'tournaments', tournamentId);
  const snap = await getDoc(ref);
  const t = snap.data() as Tournament;
  
  const matchIndex = t.matches.findIndex(m => m.id === matchId);
  const m = t.matches[matchIndex];
  
  const updatedMatches = [...t.matches];
  updatedMatches[matchIndex] = { ...m, winnerId, status: 'completed' };
  
  const winner = t.players.find(p => p.uid === winnerId) || null;
  
  if (m.nextMatchId) {
    const nextIndex = updatedMatches.findIndex(nm => nm.id === m.nextMatchId);
    if (nextIndex !== -1) {
      const nm = { ...updatedMatches[nextIndex] };
      if (!nm.player1) nm.player1 = winner;
      else nm.player2 = winner;
      
      if (nm.player1 && nm.player2) nm.status = 'ready';
      updatedMatches[nextIndex] = nm;
    }
  } else {
    // Finals!
    await updateDoc(ref, { matches: updatedMatches, winnerId, status: 'completed' });
    return;
  }
  
  await updateDoc(ref, { matches: updatedMatches });
};
