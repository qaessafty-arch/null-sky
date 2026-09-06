import React, { useState } from 'react';
import { Clock, Gauge, Gamepad2 } from 'lucide-react';

export const TIME_CONTROLS: { id: string; name: string; initial: number; increment: number; category: 'bullet' | 'blitz' | 'rapid' | 'classical' }[] = [
  { id: 'bullet', name: 'Bullet', initial: 60, increment: 0, category: 'bullet' },
  { id: 'blitz', name: 'Blitz', initial: 180, increment: 0, category: 'blitz' },
  { id: 'rapid', name: 'Rapid', initial: 600, increment: 0, category: 'rapid' },
  { id: 'classical', name: 'Classical', initial: 1800, increment: 0, category: 'classical' },
];

interface RoomSettingsProps {
  value: {
    timeControlId: string;
    timeControlName: string;
    initialSeconds: number;
    incrementSeconds: number;
    color: 'white' | 'black' | 'random';
    rated: boolean;
  };
  onChange: (next: {
    timeControlId: string;
    timeControlName: string;
    initialSeconds: number;
    incrementSeconds: number;
    color: 'white' | 'black' | 'random';
    rated: boolean;
  }) => void;
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

  const toggleColor = () => {
    const order: Array<'white' | 'black' | 'random'> = ['white', 'black', 'random'];
    const idx = order.indexOf(value.color);
    onChange({ ...value, color: order[(idx + 1) % order.length] });
  };

  const toggleRated = () => onChange({ ...value, rated: !value.rated });

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-white/50">
          <Clock className="inline w-3 h-3 mr-1" /> Time Control
        </label>
        <div className="grid grid-cols-2 gap-2">
          {TIME_CONTROLS.map((tc) => (
            <button
              key={tc.id}
              type="button"
              onClick={() => setTimeControl(tc)}
              className={`px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer ${
                value.timeControlId === tc.id
                  ? 'border-[#F5C453] bg-[#F5C453]/10 text-white shadow-lg shadow-[#F5C453]/20'
                  : 'border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white/80'
              }`}
            >
              <span className="block">{tc.name}</span>
              <span className="block text-[10px] text-white/40 mt-0.5">
                {tc.initial / 60}:{String(tc.initial % 60).padStart(2, '0')}
                {tc.increment > 0 ? `+${tc.increment}` : ''}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-white/50">
          <Gamepad2 className="inline w-3 h-3 mr-1" /> My Color
        </label>
        <div className="flex gap-2">
          {(
            [
              { key: 'white', label: 'White', color: 'text-emerald-300 border-emerald-500/40' },
              { key: 'black', label: 'Black', color: 'text-rose-300 border-rose-500/40' },
              { key: 'random', label: 'Random', color: 'text-amber-300 border-amber-500/40' },
            ] as const
          ).map(({ key, label, color }) => (
            <button
              key={key}
              type="button"
              onClick={toggleColor}
              className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer ${
                value.color === key
                  ? `border-white/30 bg-white/10 text-white shadow-md`
                  : `border-white/10 bg-white/[0.04] text-white/50 hover:bg-white/[0.08]`
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-[10px] font-black uppercase tracking-widest text-white/50">
          <Gauge className="inline w-3 h-3 mr-1" /> Rated Match
        </label>
        <button
          type="button"
          onClick={toggleRated}
          className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer ${
            value.rated
              ? 'border-amber-400/50 bg-amber-400/10 text-amber-300 shadow-md shadow-amber-400/20'
              : 'border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white/80'
          }`}
        >
          {value.rated ? 'Rated · ELO will change' : 'Unrated · Casual battle'}
        </button>
      </div>
    </div>
  );
};
