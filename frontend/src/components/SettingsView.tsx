// FILE: frontend/src/components/SettingsView.tsx
import React, { useState } from 'react';
import { Settings, Volume2, VolumeX, Eye, Shield, Check, Palette } from 'lucide-react';

export interface UserSettings {
  boardTheme: 'classic' | 'wood' | 'emerald' | 'dark' | 'neon';
  pieceStyle: 'neo' | 'alpha' | 'vintage';
  soundEnabled: boolean;
  showLegalMoves: boolean;
  autoQueen: boolean;
  showCoordinates: boolean;
}

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('chess_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      boardTheme: 'classic',
      pieceStyle: 'neo',
      soundEnabled: true,
      showLegalMoves: true,
      autoQueen: false,
      showCoordinates: true
    };
  });

  const [savedMessage, setSavedMessage] = useState(false);

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    localStorage.setItem('chess_settings', JSON.stringify(updated));

    // Save to server
    const token = localStorage.getItem('chess_token');
    const userJson = localStorage.getItem('chess_user');
    if (token && userJson) {
      try {
        const u = JSON.parse(userJson);
        fetch(`/api/users/${u.id}/settings`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ settings: updated })
        }).catch(() => {});
      } catch {}
    }

    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl text-slate-100">
      <div className="flex items-center justify-between pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Settings className="w-7 h-7 text-amber-500" />
            Game & Interface Settings
          </h2>
          <p className="text-sm text-slate-400 mt-1">Configure board appearance, move indicators, and game audio preferences.</p>
        </div>
        {savedMessage && (
          <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1.5 rounded-full animate-fade-in">
            <Check className="w-3.5 h-3.5" /> Saved
          </span>
        )}
      </div>

      <div className="mt-6 space-y-6">
        {/* Board Appearance */}
        <div>
          <label className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
            <Palette className="w-4 h-4 text-amber-400" />
            Board Theme
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {(['classic', 'wood', 'emerald', 'dark', 'neon'] as const).map(theme => (
              <button
                key={theme}
                onClick={() => updateSetting('boardTheme', theme)}
                className={`py-2.5 px-3 rounded-lg border text-xs font-semibold capitalize transition-all ${
                  settings.boardTheme === theme
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700'
                }`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        {/* Piece Style */}
        <div>
          <label className="text-sm font-semibold text-slate-300 flex items-center gap-2 mb-3">
            <Eye className="w-4 h-4 text-amber-400" />
            Piece Art Set
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['neo', 'alpha', 'vintage'] as const).map(style => (
              <button
                key={style}
                onClick={() => updateSetting('pieceStyle', style)}
                className={`py-2.5 px-3 rounded-lg border text-xs font-semibold capitalize transition-all ${
                  settings.pieceStyle === style
                    ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                    : 'border-slate-800 bg-slate-850 text-slate-400 hover:border-slate-700'
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="divide-y divide-slate-800 border-t border-b border-slate-800">
          <div className="py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {settings.soundEnabled ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5 text-slate-500" />}
              <div>
                <div className="text-sm font-medium text-slate-200">Audio & Sound Effects</div>
                <div className="text-xs text-slate-400">Play acoustic tones on move, capture, check, and game over.</div>
              </div>
            </div>
            <button
              onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${settings.soundEnabled ? 'bg-amber-600' : 'bg-slate-700'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${settings.soundEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="py-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-200">Highlight Legal Moves</div>
              <div className="text-xs text-slate-400">Show subtle dots on squares representing valid candidate moves.</div>
            </div>
            <button
              onClick={() => updateSetting('showLegalMoves', !settings.showLegalMoves)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${settings.showLegalMoves ? 'bg-amber-600' : 'bg-slate-700'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${settings.showLegalMoves ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="py-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-200">Auto-Queen on Pawn Promotion</div>
              <div className="text-xs text-slate-400">Automatically promote pawns to Queens without opening the piece selector.</div>
            </div>
            <button
              onClick={() => updateSetting('autoQueen', !settings.autoQueen)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${settings.autoQueen ? 'bg-amber-600' : 'bg-slate-700'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${settings.autoQueen ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="py-4 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-slate-200">Show Board Coordinates</div>
              <div className="text-xs text-slate-400">Display letters (a-h) and numbers (1-8) along board edges.</div>
            </div>
            <button
              onClick={() => updateSetting('showCoordinates', !settings.showCoordinates)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${settings.showCoordinates ? 'bg-amber-600' : 'bg-slate-700'}`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow transform transition-transform ${settings.showCoordinates ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {/* Security & Fair Play Notice */}
        <div className="p-4 bg-slate-850 border border-slate-800 rounded-lg flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-400 leading-relaxed">
            <span className="font-semibold text-slate-200">Server-Authoritative Anti-Cheat Protection:</span> All moves and timestamps are analyzed against engine benchmarks. High-frequency robotic moves (&lt;200ms with variance &lt;50ms) or superhuman accuracy triggers automated investigation and 7-day fair play suspensions.
          </div>
        </div>
      </div>
    </div>
  );
};
