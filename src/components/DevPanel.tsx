import React from 'react';
import { useAuth } from '../context/AuthContext';
import { PanelContainer } from './PanelContainer';
import { Terminal, Database, Server, Settings, AlertTriangle, ShieldCheck, BugPlay } from 'lucide-react';

interface DevPanelProps {
  onClose: () => void;
  onNavigate: (mode: 'database' | 'logging') => void;
}

export const DevPanel: React.FC<DevPanelProps> = ({ onClose, onNavigate }) => {
  const { profile } = useAuth();

  // Strict check: Must have dev role (isDeveloper)
  if (!profile?.isDeveloper) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-rose-500">
        <AlertTriangle className="w-12 h-12" />
        <h2 className="text-xl font-bold font-mono">ACCESS DENIED</h2>
        <p className="text-sm font-mono opacity-80">Insufficient privileges to access Developer Terminal.</p>
        <button 
          onClick={onClose}
          className="px-4 py-2 mt-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-mono"
        >
          Return to Safety
        </button>
      </div>
    );
  }

  return (
    <PanelContainer>
      {/* Header */}
      <div className="glass-panel p-5 rounded-3xl border border-sky-500/30 shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-950 border border-sky-500/50 flex items-center justify-center text-sky-400">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black font-heading text-white tracking-tight flex items-center gap-2">
              Developer Console
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </h2>
            <p className="text-xs text-sky-200/60 font-mono mt-1">
              Authorized access granted to: {profile?.email || profile?.username}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold uppercase tracking-wider transition-colors"
        >
          Exit Console
        </button>
      </div>

      {/* Control Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
        {/* Database Explorer */}
        <button 
          onClick={() => onNavigate('database')}
          className="glass-panel p-6 rounded-2xl border border-amber-500/20 hover:border-amber-500/50 hover:bg-amber-950/20 transition-all text-left group flex flex-col gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-950/50 border border-amber-500/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-amber-100">Database Explorer</h3>
            <p className="text-xs text-amber-200/60 mt-1 font-mono leading-relaxed">
              Direct access to Firestore collections. View, edit, and delete raw documents in real-time.
            </p>
          </div>
        </button>

        {/* Telemetry & Logs */}
        <button 
          onClick={() => onNavigate('logging')}
          className="glass-panel p-6 rounded-2xl border border-emerald-500/20 hover:border-emerald-500/50 hover:bg-emerald-950/20 transition-all text-left group flex flex-col gap-4"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-emerald-100">Telemetry Stream</h3>
            <p className="text-xs text-emerald-200/60 mt-1 font-mono leading-relaxed">
              Monitor real-time system logs, AI engine evaluation metrics, and API request tracing.
            </p>
          </div>
        </button>

        {/* Feature Flags (Placeholder) */}
        <button 
          className="glass-panel p-6 rounded-2xl border border-purple-500/20 hover:border-purple-500/50 hover:bg-purple-950/20 transition-all text-left group flex flex-col gap-4 opacity-50 cursor-not-allowed"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-950/50 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-purple-100">Feature Flags</h3>
            <p className="text-xs text-purple-200/60 mt-1 font-mono leading-relaxed">
              [COMING SOON] Toggle experimental features, A/B tests, and maintenance mode.
            </p>
          </div>
        </button>
      </div>
      
      {/* System Status Banner */}
      <div className="mt-4 p-4 rounded-2xl bg-black/40 border border-white/5 flex items-start gap-4">
        <BugPlay className="w-5 h-5 text-sky-400 mt-0.5 shrink-0" />
        <div>
          <h4 className="text-sm font-bold text-sky-100">System Diagnostic</h4>
          <p className="text-xs text-sky-200/70 font-mono mt-1">
            Environment: PRODUCTION | Mode: SECURE | Platform: VITE_REACT_APP
          </p>
          <p className="text-xs text-sky-200/40 font-mono mt-0.5">
            Dev access is logged and monitored. Use caution when modifying production data.
          </p>
        </div>
      </div>
    </PanelContainer>
  );
};
