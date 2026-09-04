// FILE: frontend/src/components/JoinGame.tsx
import React, { useState } from 'react';
import { LogIn, Clipboard, AlertCircle, Sparkles } from 'lucide-react';

interface JoinGameProps {
  onJoin: (code: string) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const JoinGame: React.FC<JoinGameProps> = ({ onJoin, isLoading = false, error }) => {
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      setLocalError('Game codes must be exactly 6 characters.');
      return;
    }
    setLocalError(null);
    onJoin(cleanCode);
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const clean = text.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      if (clean) {
        setCode(clean);
        if (clean.length === 6) {
          setLocalError(null);
        }
      }
    } catch {
      setLocalError('Unable to read from clipboard. Please enter code manually.');
    }
  };

  const activeError = error || localError;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl text-slate-100 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <LogIn className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold">Join With Code</h3>
          <p className="text-xs text-slate-400">Enter your opponent's 6-character room invite code.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            6-Character Game Code
          </label>
          <div className="relative">
            <input
              type="text"
              maxLength={6}
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
                if (localError) setLocalError(null);
              }}
              placeholder="e.g. ABC123"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-4 pr-12 text-center text-2xl font-mono tracking-widest font-black text-amber-400 placeholder-slate-700 focus:outline-none focus:border-amber-500 transition-colors"
            />
            <button
              type="button"
              onClick={handlePaste}
              title="Paste from clipboard"
              className="absolute right-2.5 top-2.5 p-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Clipboard className="w-4 h-4" />
            </button>
          </div>
        </div>

        {activeError && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{activeError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || code.trim().length !== 6}
          className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Connecting to match...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Join Game Room</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
