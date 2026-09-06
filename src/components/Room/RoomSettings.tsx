import React from 'react';
import { Clock, Shield, Sparkles } from 'lucide-react';

export const TIME_CONTROLS = [
  { id: 'bullet', name: 'Bullet 1+0', initial: 60, increment: 0, category: 'bullet' as const },
  { id: 'blitz_3', name: 'Blitz 3+0', initial: 180, increment: 0, category: 'blitz' as const },
  { id: 'blitz_5', name: 'Blitz 5+0', initial: 300, increment: 0, category: 'blitz' as const },
  { id: 'rapid', name: 'Rapid 10+0', initial: 600, increment: 0, category: 'rapid' as const },
  { id: 'classical', name: 'Classical 15+10', initial: 900, increment: 10, category: 'classical' as const },
];

export interface RoomSettingsData {
  timeControlId: string;
  timeControlName: string;
  initialSeconds: number;
  incrementSeconds: number;
  color: 'white' | 'black' | 'random';
  rated: boolean;
}

interface RoomSettingsProps {
  value: RoomSettingsData;
  onChange: (next: RoomSettingsData) => void;
}

export const RoomSettings: React.FC<RoomSettingsProps> = ({ value, onChange }) => {
  const setTimeControl = (tc: typeof TIME_CONTROLS[number]) => {
    onChange({
      ...value,
      timeControlId: tc.id,
      timeControlName: tc.name,
      initialSeconds: tc.initial,
      incrementSeconds: tc.increment,
    });
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Time Control */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#F5C453]" />
          <span>Time Control</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TIME_CONTROLS.map((tc) => {
            const isSelected = value.timeControlId === tc.id;
            return (
              <button
                key={tc.id}
                type="button"
                onClick={() => setTimeControl(tc)}
                className={`p-3 rounded-xl text-left border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#F5C453] bg-[#F5C453]/15 text-white shadow-lg shadow-[#F5C453]/15'
                    : 'border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <span className="block text-xs font-bold">{tc.name}</span>
                <span className="block text-[11px] text-white/40 mt-0.5 font-mono">
                  {Math.floor(tc.initial / 60)} min {tc.increment > 0 ? `+${tc.increment}s` : ''}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Choose Color */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#F5C453]" />
          <span>Preferred Color</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { key: 'white' as const, label: 'White', icon: '♔' },
            { key: 'random' as const, label: 'Random', icon: '⚖' },
            { key: 'black' as const, label: 'Black', icon: '♚' },
          ].map(({ key, label, icon }) => {
            const isSelected = value.color === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChange({ ...value, color: key })}
                className={`py-3 px-2 rounded-xl text-center border transition-all cursor-pointer flex flex-col items-center gap-1 ${
                  isSelected
                    ? 'border-[#F5C453] bg-[#F5C453]/15 text-white shadow-lg shadow-[#F5C453]/15'
                    : 'border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.08]'
                }`}
              >
                <span className="text-lg leading-none">{icon}</span>
                <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rated vs Casual Toggle */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#F5C453]" />
          <span>Match Rating</span>
        </label>
        <button
          type="button"
          onClick={() => onChange({ ...value, rated: !value.rated })}
          className={`w-full py-3 px-4 rounded-xl text-left border flex items-center justify-between transition-all cursor-pointer ${
            value.rated
              ? 'border-amber-400/50 bg-amber-400/10 text-amber-300'
              : 'border-white/10 bg-white/[0.03] text-white/70 hover:bg-white/[0.08]'
          }`}
        >
          <div>
            <div className="text-xs font-black uppercase tracking-wider">
              {value.rated ? 'Rated Battle' : 'Casual / Friendly'}
            </div>
            <div className="text-[11px] text-white/40 mt-0.5">
              {value.rated ? 'Affects Grandmaster ELO rating' : 'Practice match without ELO stakes'}
            </div>
          </div>
          <div
            className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${
              value.rated ? 'bg-amber-400 text-black border-amber-400 font-bold' : 'border-white/30 text-transparent'
            }`}
          >
            ✓
          </div>
        </button>
      </div>
    </div>
  );
};
