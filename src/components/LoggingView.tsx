import React, { useState, useEffect } from 'react';
import { PanelContainer } from './PanelContainer';
import { 
  MatchLogRecord, 
  GameMode, 
  PieceColor, 
  AppSettings 
} from '../types/chess';
import { 
  getLocalGameLogs, 
  clearGameLogs, 
  exportLogsToPGN, 
  exportLogsToJSON, 
  getAuditLogs, 
  AuditEvent,
  logCompletedGame 
} from '../services/loggingService';
import { useAuth } from '../context/AuthContext';
import { 
  History, 
  ShieldAlert, 
  Download, 
  Trash2, 
  Search, 
  Filter, 
  FileText, 
  Trophy, 
  Swords, 
  Flame, 
  HeartHandshake, 
  CheckCircle, 
  XCircle, 
  Copy, 
  Check, 
  Compass, 
  Activity, 
  Database, 
  UploadCloud, 
  FileCode,
  Sparkles
} from 'lucide-react';
import { soundManager } from '../utils/audio';

interface LoggingViewProps {
  settings: AppSettings;
  onOpenAnalysisWithFen?: (fen: string) => void;
}

export const LoggingView: React.FC<LoggingViewProps> = ({
  settings,
  onOpenAnalysisWithFen
}) => {
  const { profile, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'matches' | 'audit' | 'import'>('matches');
  const [logs, setLogs] = useState<MatchLogRecord[]>(() => getLocalGameLogs());
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>(() => getAuditLogs());

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState<'all' | 'win' | 'loss' | 'draw' | 'executed' | 'mercied'>('all');
  const [modeFilter, setModeFilter] = useState<string>('all');

  // Selected Log for Inspection
  const [selectedLog, setSelectedLog] = useState<MatchLogRecord | null>(null);
  const [copiedPgn, setCopiedPgn] = useState(false);

  // Import State
  const [importPgnText, setImportPgnText] = useState('');
  const [importOpponentName, setImportOpponentName] = useState('Imported Match');
  const [importMessage, setImportMessage] = useState<string | null>(null);

  // Reload logs
  const refreshLogs = () => {
    setLogs(getLocalGameLogs());
    setAuditEvents(getAuditLogs());
  };

  useEffect(() => {
    refreshLogs();
  }, []);

  // Filtered Logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.opponentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.mode.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesResult = resultFilter === 'all' ? true : log.result === resultFilter;
    const matchesMode = modeFilter === 'all' ? true : log.mode === modeFilter;

    return matchesSearch && matchesResult && matchesMode;
  });

  // Analytics Metrics
  const totalGames = logs.length;
  const wins = logs.filter(l => l.result === 'win' || l.result === 'executed').length;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
  const executions = logs.filter(l => l.result === 'executed').length;
  const mercies = logs.filter(l => l.result === 'mercied').length;
  const totalRespectGained = logs.reduce((acc, l) => acc + (l.respectChange || 0), 0);

  const handleExportPGN = () => {
    const pgnData = exportLogsToPGN(logs);
    const blob = new Blob([pgnData], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chesskys_match_history_${new Date().toISOString().split('T')[0]}.pgn`;
    a.click();
    URL.revokeObjectURL(url);
    soundManager.playCapture();
  };

  const handleExportJSON = () => {
    const jsonData = exportLogsToJSON(logs);
    const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chesskys_battle_logs_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundManager.playCapture();
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to clear all local match logs and audits?')) {
      clearGameLogs();
      refreshLogs();
      setSelectedLog(null);
    }
  };

  const handleCopySelectedPGN = () => {
    if (!selectedLog?.pgn) return;
    navigator.clipboard.writeText(selectedLog.pgn);
    setCopiedPgn(true);
    setTimeout(() => setCopiedPgn(false), 2000);
  };

  const handleImportPGN = async () => {
    if (!importPgnText.trim()) {
      setImportMessage('Please paste valid PGN text.');
      return;
    }

    try {
      await logCompletedGame({
        mode: 'analysis',
        opponentName: importOpponentName.trim() || 'Imported PGN Opponent',
        playerColor: 'w',
        result: 'win',
        reason: 'Imported PGN Game Log Archive',
        movesCount: (importPgnText.match(/\d+\./g) || []).length,
        timeControlName: 'Imported',
        pgn: importPgnText.trim(),
        finalFen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        respectChange: 0,
        eloChange: 0
      });

      refreshLogs();
      setImportPgnText('');
      setImportMessage('PGN successfully imported into Battle Logs!');
      soundManager.playVictory();
      setActiveTab('matches');
    } catch (e: any) {
      setImportMessage(`Import failed: ${e?.message || 'Invalid format'}`);
    }
  };

  return (
    <PanelContainer>
      {/* Top Banner Header */}
      <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-[#F5C453]/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#8C2425] via-[#52673A] to-[#F5C453] p-0.5 shadow-lg shadow-[#F5C453]/25 flex-shrink-0">
            <div className="w-full h-full bg-[#161c12] rounded-[14px] flex items-center justify-center text-[#F5C453]">
              <History className="w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight">
                Match Logs & Battle History
              </h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#52673A] text-white border border-[#F5C453]/40 uppercase tracking-wider">
                Audit Ledger
              </span>
            </div>
            <p className="text-xs text-[#DFD0B0]/75">
              Comprehensive chronological archives of chess games, move accuracy, and respect actions.
            </p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-[#161c12] p-1.5 rounded-2xl border border-white/10">
          <button
            onClick={() => setActiveTab('matches')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'matches'
                ? 'bg-[#8C2425] text-white shadow-md border border-[#F5C453]/50'
                : 'text-[#DFD0B0]/70 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Matches ({logs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-[#8C2425] text-white shadow-md border border-[#F5C453]/50'
                : 'text-[#DFD0B0]/70 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Events ({auditEvents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('import')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'bg-[#8C2425] text-white shadow-md border border-[#F5C453]/50'
                : 'text-[#DFD0B0]/70 hover:text-white'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Import PGN</span>
          </button>
        </div>
      </div>

      {/* Analytics Summary Bento Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-[#F5C453] border border-amber-500/30">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-white font-mono">{totalGames}</div>
            <div className="text-[11px] text-[#DFD0B0]/70">Total Games Logged</div>
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-white font-mono">{winRate}%</div>
            <div className="text-[11px] text-[#DFD0B0]/70">Victory Ratio</div>
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-white font-mono">{executions}</div>
            <div className="text-[11px] text-[#DFD0B0]/70">Executions Enacted</div>
          </div>
        </div>

        <div className="glass-panel p-3.5 rounded-2xl border border-white/10 flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#52673A]/40 text-[#DFD0B0] border border-[#52673A]">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base sm:text-lg font-black text-[#F5C453] font-mono">+{totalRespectGained}</div>
            <div className="text-[11px] text-[#DFD0B0]/70">Respect Points Logged</div>
          </div>
        </div>
      </div>

      {/* TAB 1: MATCHES & LOG INSPECTOR */}
      {activeTab === 'matches' && (
        <div className="space-y-4">
          {/* Controls & Export Toolbar */}
          <div className="glass-panel p-3 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search and Filters */}
            <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
              <div className="relative flex-1 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Search opponent or event..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs focus:border-[#F5C453] focus:outline-none"
                />
              </div>

              <select
                value={resultFilter}
                onChange={e => setResultFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs cursor-pointer focus:outline-none"
              >
                <option value="all">All Outcomes</option>
                <option value="win">Victories</option>
                <option value="loss">Defeats</option>
                <option value="draw">Draws</option>
                <option value="executed">Executions</option>
                <option value="mercied">Mercies</option>
              </select>

              <select
                value={modeFilter}
                onChange={e => setModeFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs cursor-pointer focus:outline-none"
              >
                <option value="all">All Modes</option>
                <option value="ai">AI Bots</option>
                <option value="online_match">Online Match</option>
                <option value="daily_puzzle">Daily Puzzle</option>
                <option value="pass_and_play">Pass & Play</option>
              </select>
            </div>

            {/* Export & Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportPGN}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                title="Download all games as PGN file"
              >
                <Download className="w-3.5 h-3.5 text-[#F5C453]" />
                <span>Export PGN</span>
              </button>

              <button
                onClick={handleExportJSON}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 border border-white/10 transition-colors cursor-pointer"
                title="Download JSON ledger"
              >
                <FileCode className="w-3.5 h-3.5 text-amber-300" />
                <span>JSON</span>
              </button>

              <button
                onClick={handleClearAll}
                className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
                title="Clear all logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Grid: Match List + Match Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* LEFT: Scrollable Log List */}
            <div className="lg:col-span-7 space-y-2.5 max-h-[620px] overflow-y-auto pr-1">
              {filteredLogs.length === 0 ? (
                <div className="p-8 rounded-3xl bg-black/40 border border-dashed border-white/15 text-center text-xs text-white/50">
                  No match logs match your current filter criteria.
                </div>
              ) : (
                filteredLogs.map(log => {
                  const isSelected = selectedLog?.id === log.id;
                  const isWin = log.result === 'win' || log.result === 'executed';
                  const isDraw = log.result === 'draw';

                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLog(log)}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-[#52673A]/40 border-[#F5C453] shadow-lg shadow-[#F5C453]/15'
                          : 'bg-black/50 border-white/10 hover:border-white/30 hover:bg-black/70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base border flex-shrink-0 ${
                          isWin
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isDraw
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}>
                          {log.opponentAvatar || (isWin ? '👑' : isDraw ? '🤝' : '⚔️')}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-white">
                              vs {log.opponentName}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/10 text-white/70 font-mono">
                              {log.timeControlName}
                            </span>
                          </div>
                          <div className="text-[11px] text-[#DFD0B0]/60 line-clamp-1">
                            {log.reason}
                          </div>
                          <div className="text-[10px] text-white/40 font-mono mt-0.5">
                            {new Date(log.date).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })} • {log.movesCount} moves
                          </div>
                        </div>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-md border ${
                          isWin
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : isDraw
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        }`}>
                          {log.result}
                        </span>
                        {log.respectChange !== undefined && log.respectChange !== 0 && (
                          <div className="text-[10px] font-mono font-bold text-[#F5C453] mt-1">
                            +{log.respectChange} Respect
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* RIGHT: Match Deep Inspection Panel */}
            <div className="lg:col-span-5">
              {selectedLog ? (
                <div className="glass-panel p-5 rounded-3xl border border-[#F5C453]/40 shadow-xl space-y-4 animate-in zoom-in-95">
                  <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#F5C453]">
                        Match Audit Inspector
                      </span>
                      <h3 className="text-base font-black text-white mt-0.5">
                        vs {selectedLog.opponentName}
                      </h3>
                      <p className="text-xs text-[#DFD0B0]/70">
                        Played as {selectedLog.playerColor === 'w' ? 'White ⚪' : 'Black ⚫'}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-black uppercase px-2 py-1 rounded bg-[#8C2425] text-white">
                        {selectedLog.result}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-white/60">Termination</span>
                      <span className="text-white font-bold">{selectedLog.reason}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-white/60">Move Count</span>
                      <span className="text-white font-mono font-bold">{selectedLog.movesCount} moves</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/5">
                      <span className="text-white/60">Time Control</span>
                      <span className="text-white font-mono font-bold">{selectedLog.timeControlName}</span>
                    </div>
                    {selectedLog.accuracy && (
                      <div className="flex justify-between py-1 border-b border-white/5">
                        <span className="text-white/60">Move Accuracy</span>
                        <span className="text-emerald-400 font-mono font-bold">{selectedLog.accuracy}%</span>
                      </div>
                    )}
                  </div>

                  {/* PGN Inspector Block */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#DFD0B0]">PGN Record</span>
                      <button
                        onClick={handleCopySelectedPGN}
                        className="text-[11px] text-amber-300 hover:text-white flex items-center gap-1 font-mono cursor-pointer"
                      >
                        {copiedPgn ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPgn ? 'Copied' : 'Copy PGN'}</span>
                      </button>
                    </div>
                    <div className="p-3 rounded-2xl bg-black/80 border border-white/10 font-mono text-[11px] text-white/80 max-h-36 overflow-y-auto leading-relaxed">
                      {selectedLog.pgn || 'No move text available.'}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => onOpenAnalysisWithFen && onOpenAnalysisWithFen(selectedLog.finalFen)}
                      className="py-2.5 px-3 rounded-xl bg-[#52673A] hover:bg-[#52673A]/90 text-white font-black text-xs flex items-center justify-center gap-1.5 border border-[#F5C453]/40 cursor-pointer shadow-md"
                    >
                      <Compass className="w-4 h-4 text-[#F5C453]" />
                      <span>Analyze Final FEN</span>
                    </button>

                    <button
                      onClick={handleCopySelectedPGN}
                      className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-4 h-4" />
                      <span>{copiedPgn ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass-panel p-8 rounded-3xl border border-white/10 text-center space-y-3">
                  <FileText className="w-10 h-10 text-[#F5C453]/40 mx-auto" />
                  <h4 className="text-sm font-bold text-white">Select a Match to Inspect</h4>
                  <p className="text-xs text-[#DFD0B0]/60 max-w-xs mx-auto">
                    Click any game record on the left to inspect move counts, PGN notations, accuracy, and termination reasons.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT LOGS & HEALTH LEDGER */}
      {activeTab === 'audit' && (
        <div className="glass-panel p-5 rounded-3xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Database className="w-5 h-5 text-[#F5C453]" />
                <span>System Activity & Audit Ledger</span>
              </h3>
              <p className="text-xs text-[#DFD0B0]/70">
                Real-time operational event trace for battle state transitions, authentication, and database synchronization.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono text-emerald-400 font-bold">Live DB Sync Active</span>
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {auditEvents.length === 0 ? (
              <div className="p-8 text-center text-xs text-white/40">
                No recent system audit records logged.
              </div>
            ) : (
              auditEvents.map(evt => (
                <div
                  key={evt.id}
                  className="p-3 rounded-2xl bg-black/50 border border-white/10 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      evt.level === 'success'
                        ? 'bg-emerald-400'
                        : evt.level === 'warn'
                        ? 'bg-amber-400'
                        : evt.level === 'error'
                        ? 'bg-rose-400'
                        : 'bg-cyan-400'
                    }`} />
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{evt.message}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-white/60 uppercase">
                          {evt.category}
                        </span>
                      </div>
                      {evt.details && (
                        <div className="text-[11px] text-[#DFD0B0]/70 font-mono mt-0.5">
                          {evt.details}
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-white/40 flex-shrink-0">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: IMPORT PGN */}
      {activeTab === 'import' && (
        <div className="glass-panel p-6 rounded-3xl border border-[#F5C453]/30 shadow-xl max-w-2xl mx-auto space-y-4">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <UploadCloud className="w-6 h-6 text-[#F5C453]" />
            <div>
              <h3 className="text-base font-black text-white">Import External PGN File / Text</h3>
              <p className="text-xs text-[#DFD0B0]/70">
                Paste portable game notation (PGN) from Chess.com, Lichess, or FIDE tournaments to add to your personal battle log archive.
              </p>
            </div>
          </div>

          {importMessage && (
            <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold">
              {importMessage}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#DFD0B0]">Opponent Name / Tournament Label</label>
            <input
              type="text"
              value={importOpponentName}
              onChange={e => setImportOpponentName(e.target.value)}
              placeholder="e.g. GM Magnus Carlsen"
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white text-xs font-bold focus:border-[#F5C453] focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#DFD0B0]">PGN Move Text</label>
            <textarea
              rows={6}
              value={importPgnText}
              onChange={e => setImportPgnText(e.target.value)}
              placeholder="1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. c3 Nf6..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-black/60 border border-white/20 text-white font-mono text-xs focus:border-[#F5C453] focus:outline-none"
            />
          </div>

          <button
            onClick={handleImportPGN}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#52673A] via-[#8C2425] to-[#F5C453] hover:brightness-110 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#F5C453]/20 border border-[#F5C453]/50 transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Import to Battle Logs</span>
          </button>
        </div>
      )}
    </PanelContainer>
  );
};
