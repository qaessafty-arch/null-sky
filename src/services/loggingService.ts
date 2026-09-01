import { doc, setDoc, collection, getDocs, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { MatchLogRecord, GameMode, PieceColor } from '../types/chess';

const LOCAL_STORAGE_LOGS_KEY = 'chesskys_match_history_logs';
const LOCAL_STORAGE_AUDIT_KEY = 'chesskys_system_audit_logs';

export interface AuditEvent {
  id: string;
  timestamp: string;
  category: 'auth' | 'game' | 'respect' | 'theme' | 'multiplayer' | 'puzzle' | 'system';
  message: string;
  details?: string;
  level: 'info' | 'success' | 'warn' | 'error';
}

const DEFAULT_SAMPLE_LOGS: MatchLogRecord[] = [
  {
    id: 'log-sample-1',
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    mode: 'ai',
    opponentName: 'Bishop Tactician (Bot)',
    opponentAvatar: '♗',
    opponentElo: 1400,
    playerColor: 'w',
    result: 'win',
    reason: 'Checkmate on f7 with Peshmerga Queen Invasion',
    movesCount: 28,
    timeControlName: 'Rapid 10 min',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. O-O Nf6 5. d3 d6 6. c3 a6 7. Nbd2 Ba7 8. Bb3 O-O 9. h3 h6 10. Re1 Be6 11. Nf1 d5 12. exd5 Nxd5 13. Nxe5 Nxe5 14. Rxe5 Bxf2+ 15. Kxf2 Qf6+ 16. Qf3 Qxe5 17. d4 Qd6 18. Ng3 f5 19. Bd2 Rae8 20. Re1 c6 21. Re5 Qd7 22. Nh5 f4 23. Bc2 Ne3 24. Bxe3 fxe3+ 25. Kxe3 Rxf3+ 26. gxf3 Bf7 27. Nf4 Rxe5+ 28. dxe5 g5 1-0',
    finalFen: '8/1p1q1b2/p1p4p/4P1p1/5N2/2P1KP1P/PPB5/8 w - - 0 29',
    respectChange: 25,
    eloChange: 18,
    accuracy: 91.4
  },
  {
    id: 'log-sample-2',
    date: new Date(Date.now() - 3600000 * 18).toISOString(),
    mode: 'online_match',
    opponentName: 'Grandmaster_Azad',
    opponentAvatar: '👑',
    opponentElo: 1840,
    playerColor: 'b',
    result: 'executed',
    reason: 'Royal Execution Judgment enacted upon King surrender',
    movesCount: 34,
    timeControlName: 'Blitz 5 min',
    pgn: '1. d4 Nf6 2. c4 e6 3. Nc3 Bb4 4. Qc2 O-O 5. e4 d5 6. e5 Ne4 7. Bd3 c5 8. Nf3 cxd4 9. Nxd4 Nd7 10. Bf4 Ndc5 11. O-O Bxc3 12. bxc3 Nxd3 13. Qxd3 b6 14. cxd5 Qxd5 15. Rfe1 Nc5 16. Qg3 Kh8 17. Rad1 Bb7 18. Nf5 Qxg2+ 19. Qxg2 Bxg2 20. Kxg2 exf5 21. Rd6 Ne6 22. Be3 Rfc8 23. Bd4 Kg8 24. Kf3 Kf8 25. Rd7 Ke8 26. Rb7 Rc7 27. Rxc7 Nxc7 28. Rg1 Ne6 29. Ke3 Kd7 30. Kd3 Kc6 31. Kc4 Rd8 32. a4 g6 33. Rb1 Rd5 34. Rb5 Nf4 0-1',
    finalFen: '8/p4p1p/1pk3p1/1R1rPp2/P1KB1n2/2P5/5P1P/8 w - - 4 35',
    respectChange: 35,
    eloChange: 22,
    accuracy: 94.2
  },
  {
    id: 'log-sample-3',
    date: new Date(Date.now() - 3600000 * 42).toISOString(),
    mode: 'daily_puzzle',
    opponentName: 'Daily Tactical Mission',
    opponentAvatar: '☀️',
    opponentElo: 1950,
    playerColor: 'w',
    result: 'win',
    reason: 'Flawless Daily Tactical Combination Solved',
    movesCount: 6,
    timeControlName: 'Daily Mission',
    pgn: '1. Qxh7+ Kxh7 2. Rh3+ Kg8 3. Ng6 fxg6 4. Bxe6+ Rf7 5. Rh8# 1-0',
    finalFen: '5r1R/5rp1/4B1p1/8/8/8/PPP2PPP/6K1 b - - 1 5',
    respectChange: 25,
    eloChange: 15,
    accuracy: 100.0
  }
];

export function getLocalGameLogs(): MatchLogRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(DEFAULT_SAMPLE_LOGS));
      return DEFAULT_SAMPLE_LOGS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_SAMPLE_LOGS;
  } catch (e) {
    console.error('Error reading game logs from storage:', e);
    return DEFAULT_SAMPLE_LOGS;
  }
}

export function saveLocalGameLogs(logs: MatchLogRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(logs.slice(0, 100)));
  } catch (e) {
    console.error('Error saving game logs to storage:', e);
  }
}

export async function logCompletedGame(record: Omit<MatchLogRecord, 'id' | 'date'> & { userId?: string }): Promise<MatchLogRecord> {
  const newLog: MatchLogRecord = {
    ...record,
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    date: new Date().toISOString()
  };

  // 1. Save to local storage
  const currentLogs = getLocalGameLogs();
  const updatedLogs = [newLog, ...currentLogs];
  saveLocalGameLogs(updatedLogs);

  // 2. Add audit event
  addAuditLog({
    category: 'game',
    level: newLog.result === 'win' || newLog.result === 'executed' ? 'success' : 'info',
    message: `Match Finished: ${newLog.mode.toUpperCase()} vs ${newLog.opponentName} (${newLog.result.toUpperCase()})`,
    details: `${newLog.reason} - Respect ${newLog.respectChange >= 0 ? '+' : ''}${newLog.respectChange}`
  });

  // 3. Persist to Firestore if available
  try {
    const ref = doc(db, 'game_logs', newLog.id);
    await setDoc(ref, {
      ...newLog,
      userId: record.userId || 'guest'
    });
  } catch (err) {
    console.warn('Could not sync game log to Firestore (offline/guest):', err);
  }

  return newLog;
}

export async function fetchCloudGameLogs(userId: string): Promise<MatchLogRecord[]> {
  try {
    const coll = collection(db, 'game_logs');
    const q = query(coll, orderBy('date', 'desc'), limit(50));
    const snap = await getDocs(q);
    const logs: MatchLogRecord[] = [];
    snap.forEach(d => {
      logs.push(d.data() as MatchLogRecord);
    });
    return logs;
  } catch (err) {
    console.warn('Could not fetch cloud game logs:', err);
    return getLocalGameLogs();
  }
}

export function clearGameLogs(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_LOGS_KEY);
    addAuditLog({
      category: 'system',
      level: 'warn',
      message: 'User cleared local match history logs.'
    });
  } catch (e) {
    console.error('Failed to clear logs:', e);
  }
}

// ----------------------------------------------------------------------------
// AUDIT EVENT LOGGING
// ----------------------------------------------------------------------------

export function getAuditLogs(): AuditEvent[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_AUDIT_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addAuditLog(event: Omit<AuditEvent, 'id' | 'timestamp'>): void {
  try {
    const newEvent: AuditEvent = {
      ...event,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString()
    };
    const current = getAuditLogs();
    const updated = [newEvent, ...current].slice(0, 150);
    localStorage.setItem(LOCAL_STORAGE_AUDIT_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to append audit log:', e);
  }
}

// ----------------------------------------------------------------------------
// PGN & DATA EXPORTS
// ----------------------------------------------------------------------------

export function exportLogsToPGN(logs: MatchLogRecord[]): string {
  return logs
    .map(log => {
      const dateStr = log.date.split('T')[0].replace(/-/g, '.');
      const white = log.playerColor === 'w' ? 'Player' : log.opponentName;
      const black = log.playerColor === 'b' ? 'Player' : log.opponentName;
      const resultStr = log.result === 'win' || log.result === 'executed'
        ? (log.playerColor === 'w' ? '1-0' : '0-1')
        : log.result === 'loss'
        ? (log.playerColor === 'w' ? '0-1' : '1-0')
        : '1/2-1/2';

      return [
        `[Event "Chesskys Match - ${log.mode}"]`,
        `[Site "Erbil Citadel, Kurdistan"]`,
        `[Date "${dateStr}"]`,
        `[White "${white}"]`,
        `[Black "${black}"]`,
        `[Result "${resultStr}"]`,
        `[TimeControl "${log.timeControlName}"]`,
        `[Termination "${log.reason}"]`,
        '',
        log.pgn || '1. e4 e5',
        ''
      ].join('\n');
    })
    .join('\n\n');
}

export function exportLogsToJSON(logs: MatchLogRecord[]): string {
  return JSON.stringify(logs, null, 2);
}
