import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, updateDoc, increment, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { AuthoredPuzzle, PieceColor } from '../types/chess';
import { Chess } from 'chess.js';

const LOCAL_STORAGE_KEY = 'chesskys_authored_puzzles';

export const DEFAULT_AUTHORED_TEMPLATES: AuthoredPuzzle[] = [
  {
    id: 'template-sunburst-mate',
    title: 'The Kurdish Sunburst Mate',
    description: 'Sacrifice the queen on the h-file to unleash the double bishop and knight crossfire for a legendary royal checkmate.',
    theme: 'Queen Sacrifice & Mate',
    difficulty: 'Master',
    rating: 2150,
    fen: 'r1b2rk1/pp3ppp/2n1p3/3pP3/5P2/2NB1N2/PPP3PP/R2Q1RK1 w - - 0 1',
    playerColor: 'w',
    solutionMoves: ['Bxh7+', 'Kxh7', 'Ng5+', 'Kg8', 'Qh5', 'Re8', 'Qxf7+', 'Kh8', 'Qh5+', 'Kg8', 'Qh7+', 'Kf8', 'Qh8+', 'Ke7', 'Qxg7#'],
    hints: ['Look for the classical Greek gift sacrifice on h7!', 'Follow up with Ng5+ to drag the king into the open.'],
    authorUid: 'citadel-grandmaster',
    authorName: 'Grandmaster Qays',
    authorBadge: '👑',
    createdAt: new Date().toISOString(),
    likesCount: 84,
    solvesCount: 192,
    isPublished: true
  },
  {
    id: 'template-erbil-citadel',
    title: 'Erbil Citadel Rook Tempest',
    description: 'White infiltrates the 7th rank to trap Black’s king against the citadel walls.',
    theme: '7th Rank Rook Infiltration',
    difficulty: 'Medium',
    rating: 1550,
    fen: '5rk1/1R4pp/p3p3/4P3/8/5N2/PP3PPP/6K1 w - - 0 1',
    playerColor: 'w',
    solutionMoves: ['Rb6', 'Re8', 'Rxa6'],
    hints: ['Attack the weak isolated pawn on e6 or a6 while dominating the open file.'],
    authorUid: 'erbil-tactician',
    authorName: 'Peshmerga Commander',
    authorBadge: '🛡️',
    createdAt: new Date().toISOString(),
    likesCount: 42,
    solvesCount: 118,
    isPublished: true
  },
  {
    id: 'template-knight-fork',
    title: 'Jamadani Knight Royal Fork',
    description: 'Black exploits White’s uncoordinated royal pieces with a devastating tactical knight maneuver.',
    theme: 'Royal Fork',
    difficulty: 'Easy',
    rating: 1100,
    fen: 'r1bqk2r/pppp1ppp/2n5/4p3/1b2n3/2NP1N2/PPP1BPPP/R1BQK2R b KQkq - 0 5',
    playerColor: 'b',
    solutionMoves: ['Nxc3', 'bxc3', 'Bxc3+', 'Bd2', 'Bxa1'],
    hints: ['Look at the pin on the c3 knight and win the exchange!'],
    authorUid: 'soran-coach',
    authorName: 'Coach Barzan',
    authorBadge: '⚡',
    createdAt: new Date().toISOString(),
    likesCount: 56,
    solvesCount: 230,
    isPublished: true
  }
];

export function getLocalAuthoredPuzzles(): AuthoredPuzzle[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_AUTHORED_TEMPLATES));
      return DEFAULT_AUTHORED_TEMPLATES;
    }
    const parsed: AuthoredPuzzle[] = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_AUTHORED_TEMPLATES;
  } catch (e) {
    console.error('Failed to load authored puzzles from localStorage:', e);
    return DEFAULT_AUTHORED_TEMPLATES;
  }
}

export function saveLocalAuthoredPuzzles(puzzles: AuthoredPuzzle[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(puzzles));
  } catch (e) {
    console.error('Failed to save authored puzzles to localStorage:', e);
  }
}

export async function fetchCloudAuthoredPuzzles(): Promise<AuthoredPuzzle[]> {
  try {
    const coll = collection(db, 'authored_puzzles');
    const q = query(coll, orderBy('createdAt', 'desc'), limit(40));
    const snap = await getDocs(q);
    const results: AuthoredPuzzle[] = [];
    snap.forEach(docSnap => {
      results.push(docSnap.data() as AuthoredPuzzle);
    });
    return results;
  } catch (err) {
    console.warn('Could not fetch cloud authored puzzles, using local storage:', err);
    return [];
  }
}

export async function saveAuthoredPuzzle(puzzle: AuthoredPuzzle): Promise<void> {
  // 1. Save locally
  const current = getLocalAuthoredPuzzles();
  const existingIdx = current.findIndex(p => p.id === puzzle.id);
  let updatedList: AuthoredPuzzle[];
  if (existingIdx >= 0) {
    updatedList = [...current];
    updatedList[existingIdx] = puzzle;
  } else {
    updatedList = [puzzle, ...current];
  }
  saveLocalAuthoredPuzzles(updatedList);

  // 2. Sync to Firestore if published
  try {
    const ref = doc(db, 'authored_puzzles', puzzle.id);
    await setDoc(ref, puzzle, { merge: true });
  } catch (err) {
    console.warn('Cloud puzzle save failed (offline or guest):', err);
  }
}

export async function deleteAuthoredPuzzle(puzzleId: string): Promise<void> {
  const current = getLocalAuthoredPuzzles();
  const filtered = current.filter(p => p.id !== puzzleId);
  saveLocalAuthoredPuzzles(filtered);

  try {
    const ref = doc(db, 'authored_puzzles', puzzleId);
    await deleteDoc(ref);
  } catch (err) {
    console.warn('Cloud puzzle delete failed:', err);
  }
}

export async function likeAuthoredPuzzle(puzzleId: string): Promise<void> {
  // Update local
  const current = getLocalAuthoredPuzzles();
  const found = current.find(p => p.id === puzzleId);
  if (found) {
    found.likesCount = (found.likesCount || 0) + 1;
    saveLocalAuthoredPuzzles(current);
  }

  // Update cloud
  try {
    const ref = doc(db, 'authored_puzzles', puzzleId);
    await updateDoc(ref, {
      likesCount: increment(1)
    });
  } catch (e) {
    console.warn('Could not update like count in cloud:', e);
  }
}

export async function recordPuzzleSolve(puzzleId: string): Promise<void> {
  const current = getLocalAuthoredPuzzles();
  const found = current.find(p => p.id === puzzleId);
  if (found) {
    found.solvesCount = (found.solvesCount || 0) + 1;
    saveLocalAuthoredPuzzles(current);
  }

  try {
    const ref = doc(db, 'authored_puzzles', puzzleId);
    await updateDoc(ref, {
      solvesCount: increment(1)
    });
  } catch (e) {
    console.warn('Could not update solve count in cloud:', e);
  }
}

export function validateFen(fen: string): { valid: boolean; error?: string } {
  try {
    const chess = new Chess(fen);
    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Invalid FEN notation format' };
  }
}

export function validateSolutionMoves(fen: string, moves: string[]): { valid: boolean; error?: string } {
  try {
    const chess = new Chess(fen);
    for (let i = 0; i < moves.length; i++) {
      const san = moves[i].trim();
      if (!san) continue;
      const res = chess.move(san);
      if (!res) {
        return { valid: false, error: `Illegal move #${i + 1} "${san}" from position FEN: ${chess.fen()}` };
      }
    }
    return { valid: true };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Failed to simulate move sequence' };
  }
}
