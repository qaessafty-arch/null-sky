import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  limit, 
  orderBy, 
  getDocFromServer
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../utils/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

export interface DatabaseCollectionMeta {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

export const KNOWN_COLLECTIONS: { id: string; name: string; description: string; icon: string }[] = [
  { id: 'users', name: 'User Profiles', description: 'Player accounts, ELO ratings, respect points, and honor badges', icon: '👑' },
  { id: 'online_matches', name: 'Live PvP Matches', description: 'Active multiplayer rooms, board FEN, timers, and moves', icon: '⚔️' },
  { id: 'authored_puzzles', name: 'Authored Puzzles', description: 'Community created tactical challenges and solution moves', icon: '🧩' },
  { id: 'game_logs', name: 'Battle Logs', description: 'Match history archives, PGN records, and result statistics', icon: '📜' },
  { id: 'friend_requests', name: 'Friend Requests', description: 'Pending and accepted invitations between chess warriors', icon: '🤝' },
  { id: 'feedbacks', name: 'User Feedback', description: 'Bug reports, engine suggestions, and developer notes', icon: '💬' },
  { id: 'announcements', name: 'Announcements', description: 'Broadcast notices, updates, and championship events', icon: '📢' }
];

export interface DatabaseHealthInfo {
  status: 'connected' | 'degraded' | 'offline';
  latencyMs: number;
  databaseId: string;
  projectId: string;
  storageBucket: string;
  lastChecked: string;
}

/**
 * Ping Cloud Firestore to check live connectivity and measure latency
 */
export const checkDatabaseHealth = async (): Promise<DatabaseHealthInfo> => {
  const startTime = Date.now();
  const dbId = firebaseConfig.firestoreDatabaseId || 'default';
  const projId = firebaseConfig.projectId || 'unknown';
  const storage = firebaseConfig.storageBucket || '';

  try {
    const testDoc = doc(db, 'system_health', 'ping_check');
    await getDoc(testDoc);
    const latency = Date.now() - startTime;
    return {
      status: 'connected',
      latencyMs: latency,
      databaseId: dbId,
      projectId: projId,
      storageBucket: storage,
      lastChecked: new Date().toLocaleTimeString()
    };
  } catch (err: any) {
    const latency = Date.now() - startTime;
    return {
      status: 'degraded',
      latencyMs: latency,
      databaseId: dbId,
      projectId: projId,
      storageBucket: storage,
      lastChecked: new Date().toLocaleTimeString()
    };
  }
};

/**
 * Fetch document count and list for a specific collection
 */
export const getCollectionDocuments = async (
  collectionName: string,
  maxLimit: number = 50
): Promise<{ id: string; data: Record<string, any> }[]> => {
  try {
    const colRef = collection(db, collectionName);
    const q = query(colRef, limit(maxLimit));
    const snap = await getDocs(q);

    const docs: { id: string; data: Record<string, any> }[] = [];
    snap.forEach(d => {
      docs.push({
        id: d.id,
        data: d.data()
      });
    });
    return docs;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.LIST, collectionName);
    console.error(`Error fetching collection ${collectionName}:`, err);
    return [];
  }
};

/**
 * Create or overwrite a document in any collection
 */
export const writeDatabaseDocument = async (
  collectionName: string,
  docId: string,
  data: Record<string, any>
): Promise<boolean> => {
  try {
    const targetDoc = doc(db, collectionName, docId);
    await setDoc(targetDoc, {
      ...data,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, collectionName);
    console.error(`Error writing document ${docId} in ${collectionName}:`, err);
    throw err;
  }
};

/**
 * Delete a document from a collection
 */
export const deleteDatabaseDocument = async (
  collectionName: string,
  docId: string
): Promise<boolean> => {
  try {
    const targetDoc = doc(db, collectionName, docId);
    await deleteDoc(targetDoc);
    return true;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.DELETE, collectionName);
    console.error(`Error deleting document ${docId} from ${collectionName}:`, err);
    throw err;
  }
};

/**
 * Seed initial sample records for database verification
 */
export const seedSampleDatabaseData = async (): Promise<{ seeded: number; errors: number }> => {
  let seeded = 0;
  let errors = 0;

  // 1. Seed System Announcement
  try {
    await setDoc(doc(db, 'announcements', 'welcome_v2'), {
      id: 'welcome_v2',
      title: '☀️ Welcome to Chesskys PRO Cloud Arena',
      content: 'Cloud Firestore database is live and synchronized with real-time multiplayer, leaderboard rankings, tactics puzzles, and battle audits.',
      author: 'q.brz 👑',
      type: 'update',
      active: true,
      createdAt: new Date().toISOString()
    });
    seeded++;
  } catch (e: any) {
    handleFirestoreError(e, OperationType.WRITE, 'announcements');
    errors++;
  }

  // 2. Seed Default Grandmaster Profiles
  const sampleUsers = [
    {
      uid: 'gm_peshmerga_leader',
      displayName: 'General Sherwan ☀️',
      username: 'sherwan',
      country: 'Kurdistan',
      flag: '☀️',
      elo: 2450,
      respectPoints: 1200,
      executions: 84,
      merciesGranted: 35,
      gamesPlayed: 140,
      wins: 112,
      honorRank: 'Peshmerga Supreme Commander',
      rankBadge: '☀️',
      role: 'grandmaster',
      badgeNumber: 3,
      customStatus: 'Defending the mountains with tactical precision'
    },
    {
      uid: 'gm_tactics_master',
      displayName: 'Arya Tactical ⚔️',
      username: 'arya_chess',
      country: 'Kurdistan',
      flag: '⚔️',
      elo: 2200,
      respectPoints: 850,
      executions: 42,
      merciesGranted: 20,
      gamesPlayed: 90,
      wins: 70,
      honorRank: 'High Tactician',
      rankBadge: '⚔️',
      role: 'grandmaster',
      badgeNumber: 4,
      customStatus: 'Always seeking smothered mate combinations'
    }
  ];

  for (const u of sampleUsers) {
    try {
      await setDoc(doc(db, 'users', u.uid), {
        ...u,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      seeded++;
    } catch (e: any) {
      handleFirestoreError(e, OperationType.WRITE, 'users');
      errors++;
    }
  }

  // 3. Seed Sample Tactical Puzzle
  try {
    await setDoc(doc(db, 'authored_puzzles', 'puzzle_arabian_mate'), {
      id: 'puzzle_arabian_mate',
      title: 'Mountain Fortress Arabian Mate',
      description: 'Coordinate knight and rook to trap the enemy king against the corner rim.',
      theme: 'Arabian Mate',
      difficulty: 'Medium',
      rating: 1650,
      fen: '7k/5R2/8/5N2/8/8/8/6K1 w - - 0 1',
      playerColor: 'w',
      solutionMoves: ['f7f8'],
      hints: ['Coordinate your Rook and Knight to attack h8 and deliver checkmate'],
      authorName: 'Grandmaster Sherwan',
      authorBadge: '☀️',
      createdAt: new Date().toISOString(),
      likesCount: 15,
      solvesCount: 42,
      isPublished: true
    });
    seeded++;
  } catch (e: any) {
    handleFirestoreError(e, OperationType.WRITE, 'authored_puzzles');
    errors++;
  }

  return { seeded, errors };
};
