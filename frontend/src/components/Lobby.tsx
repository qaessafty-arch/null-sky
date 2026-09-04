import React, { useState } from 'react';
import { Play, Plus, Key, Trophy, Users, Zap, Clock, ShieldCheck } from 'lucide-react';

interface LobbyProps {
  socket: any;
  onQuickMatch: (timeControl: string) => void;
  onCreateGame: (settings: any) => void;
  onJoinGame: (code: string) => void;
  onSelectTournament: (id: string) => void;
  availableGames: any[];
  tournaments: any[];
}

export const Lobby: React.FC<LobbyProps> = ({
  socket,
  onQuickMatch,
  onCreateGame,
  onJoinGame,
  onSelectTournament,
  availableGames,
  tournaments
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'custom' | 'join'>('quick');
  const [gameCodeInput, setGameCodeInput] = useState('');
  
  // Custom Game Form State
  const [timeControl, setTimeControl] = useState('10+0');
  const [rated, setRated] = useState(true);
  const [colorPref, setColorPref] = useState<'white' | 'black' | 'random'>('random');
  const [variant, setVariant] = useState('standard');

  const TIME_PRESETS = [
    { label: 'Bullet 1+0', value: '1+0', icon: Zap },
    { label: 'Blitz 3+2', value: '3+2', icon: Zap },
    { label: 'Rapid 5+3', value: '5+3', icon: Clock },
    { label: 'Rapid 10+0', value: '10+0', icon: Clock },
    { label: 'Classical 15+10', value: '15+10', icon: Clock }
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 space-y-8">
      {/* HERO / QUICK MATCH HUB */}
      <div className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 border border-neutral-800 rounded-3xl p-6 md:p-10 shadow-2xl">
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1 rounded-full">
            Real-Time Grandmaster Engine
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-white mt-4 tracking-tight">
            Play Chess Online
          </h1>
          <p className="text-neutral-400 mt-2 text-sm md:text-base leading-relaxed">
            Rated matchmaking, anti-cheat detection, synchronized low-latency clocks, and custom tournament brackets.
          </p>
        </div>

        {/* Quick Play Presets */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-8">
          {TIME_PRESETS.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.value}
                onClick={() => onQuickMatch(preset.value)}
                className="flex flex-col items-center justify-center p-4 bg-neutral-800/80 hover:bg-emerald-600 border border-neutral-700 hover:border-emerald-500 rounded-2xl transition-all duration-200 group hover:-translate-y-1 hover:shadow-xl shadow-neutral-950/50"
              >
                <Icon className="w-6 h-6 text-emerald-400 group-hover:text-white mb-2 transition-colors" />
                <span className="font-bold text-white text-sm group-hover:text-white">{preset.label}</span>
                <span className="text-[11px] text-neutral-400 group-hover:text-emerald-100">Quick Match</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TABS & CUSTOM MATCHMAKING */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Create or Join Game */}
        <div className="lg:col-span-1 bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
          <div className="flex border-b border-neutral-800 pb-3 gap-4 mb-6">
            <button
              onClick={() => setActiveTab('custom')}
              className={`text-sm font-semibold pb-2 -mb-3 transition-colors ${
                activeTab === 'custom' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Create Game
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`text-sm font-semibold pb-2 -mb-3 transition-colors ${
                activeTab === 'join' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Join with Code
            </button>
          </div>

          {activeTab === 'custom' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Time Control</label>
                <select
                  value={timeControl}
                  onChange={(e) => setTimeControl(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="1+0">1 min (Bullet)</option>
                  <option value="3+2">3 min + 2s (Blitz)</option>
                  <option value="5+3">5 min + 3s (Rapid)</option>
                  <option value="10+0">10 min (Rapid)</option>
                  <option value="15+10">15 min + 10s (Classical)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Play As</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['white', 'random', 'black'] as const).map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setColorPref(color)}
                      className={`py-2 text-xs font-bold uppercase rounded-xl border transition-colors ${
                        colorPref === color
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:text-white'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-neutral-400">Rated Game</span>
                <input
                  type="checkbox"
                  checked={rated}
                  onChange={(e) => setRated(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
              </div>

              <button
                onClick={() => onCreateGame({ timeControl, rated, variant, colorPreference: colorPref })}
                className="w-full mt-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Create Room
              </button>
            </div>
          )}

          {activeTab === 'join' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">6-Character Room Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={gameCodeInput}
                  onChange={(e) => setGameCodeInput(e.target.value.toUpperCase())}
                  placeholder="e.g. 7K9M2W"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-3 text-center text-lg font-mono font-bold tracking-widest text-white uppercase focus:outline-none focus:border-emerald-500"
                />
              </div>

              <button
                disabled={gameCodeInput.length < 6}
                onClick={() => onJoinGame(gameCodeInput)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                Join Game Room
              </button>
            </div>
          )}
        </div>

        {/* Center/Right Column: Open Games & Featured Tournaments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Public Waiting Games */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-white text-base">Public Lobby</h3>
              </div>
              <span className="text-xs text-neutral-400">{availableGames.length} waiting</span>
            </div>

            {availableGames.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-sm">
                No active public challenges right now. Create a room or play Quick Match!
              </div>
            ) : (
              <div className="space-y-2">
                {availableGames.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-3 bg-neutral-950 border border-neutral-800 rounded-xl hover:border-neutral-700 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white text-sm">{g.white_username || 'Challenger'}</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono">
                          {g.white_rating || 1200}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500">
                        {g.time_control} • {g.rated ? 'Rated' : 'Casual'}
                      </span>
                    </div>
                    <button
                      onClick={() => onJoinGame(g.game_code)}
                      className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/40 rounded-lg text-xs font-semibold transition-all"
                    >
                      Play Match
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Tournaments Teaser */}
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Live & Upcoming Tournaments</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tournaments.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTournament(t.id)}
                  className="p-4 bg-neutral-950 border border-neutral-800 hover:border-amber-500/50 rounded-xl cursor-pointer transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white text-sm">{t.name}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-neutral-800 text-amber-400 font-semibold uppercase text-[10px]">
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    {t.type} • {t.time_control} • {t.participant_count || 0}/{t.max_players} Players
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
