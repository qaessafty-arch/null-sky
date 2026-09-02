import React from 'react';
import { Glasses, Map, CloudSun, BarChart2, ArrowUpRight } from 'lucide-react';
import { AppSettings } from '../types/chess';

interface StrategicVisionPanelProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

/**
 * StrategicVisionPanel (The "Glasses Panel")
 * Provides tactical overlays and environmental effects for the battlefield.
 */
export const StrategicVisionPanel: React.FC<StrategicVisionPanelProps> = ({
  settings,
  onUpdateSettings,
}) => {
  return (
    <div className="glass-panel p-4 rounded-3xl border border-white/10 shadow-xl space-y-4 animate-in fade-in slide-in-from-right-5">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-[#94A3B8] uppercase tracking-[0.2em] flex items-center gap-2">
          <Glasses className="w-4 h-4 text-sky-400" />
          Strategic Vision
        </h4>
        <span className="text-[8px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 font-black font-mono border border-sky-500/30">
          ENGAGED
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {/* Territory Vision Toggle */}
        <button
          onClick={() => onUpdateSettings({ showTerritory: !settings.showTerritory })}
          className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
            settings.showTerritory
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-white/5 border-white/5 text-white/40 hover:text-white/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${settings.showTerritory ? 'bg-emerald-500/20' : 'bg-black/40'}`}>
              <Map className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-black uppercase tracking-wider">Territory Vision</div>
              <div className="text-[9px] opacity-60">Heatmap of controlled squares</div>
            </div>
          </div>
          <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.showTerritory ? 'bg-emerald-500' : 'bg-white/10'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${settings.showTerritory ? 'right-0.5' : 'left-0.5'}`} />
          </div>
        </button>

        {/* Dynamic Weather Toggle */}
        <button
          onClick={() => onUpdateSettings({ showWeather: !settings.showWeather })}
          className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
            settings.showWeather
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              : 'bg-white/5 border-white/5 text-white/40 hover:text-white/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${settings.showWeather ? 'bg-amber-500/20' : 'bg-black/40'}`}>
              <CloudSun className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-black uppercase tracking-wider">Atmospheric Intel</div>
              <div className="text-[9px] opacity-60">Dynamic battlefield weather</div>
            </div>
          </div>
          <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.showWeather ? 'bg-amber-500' : 'bg-white/10'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${settings.showWeather ? 'right-0.5' : 'left-0.5'}`} />
          </div>
        </button>

        {/* Eval Bar Toggle */}
        <button
          onClick={() => onUpdateSettings({ showEvalBar: !settings.showEvalBar })}
          className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
            settings.showEvalBar
              ? 'bg-blue-500/10 border-blue-500/40 text-blue-300'
              : 'bg-white/5 border-white/5 text-white/40 hover:text-white/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${settings.showEvalBar ? 'bg-blue-500/20' : 'bg-black/40'}`}>
              <BarChart2 className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-black uppercase tracking-wider">Engine Evaluation</div>
              <div className="text-[9px] opacity-60">Real-time match scoring</div>
            </div>
          </div>
          <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.showEvalBar ? 'bg-blue-500' : 'bg-white/10'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${settings.showEvalBar ? 'right-0.5' : 'left-0.5'}`} />
          </div>
        </button>

        {/* Move Arrows Toggle */}
        <button
          onClick={() => onUpdateSettings({ showMoveArrows: !settings.showMoveArrows })}
          className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
            settings.showMoveArrows
              ? 'bg-purple-500/10 border-purple-500/40 text-purple-300'
              : 'bg-white/5 border-white/5 text-white/40 hover:text-white/60'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${settings.showMoveArrows ? 'bg-purple-500/20' : 'bg-black/40'}`}>
              <ArrowUpRight className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="text-[11px] font-black uppercase tracking-wider">Tactical Arrows</div>
              <div className="text-[9px] opacity-60">Visualizing threat paths</div>
            </div>
          </div>
          <div className={`w-8 h-4 rounded-full relative transition-colors ${settings.showMoveArrows ? 'bg-purple-500' : 'bg-white/10'}`}>
            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${settings.showMoveArrows ? 'right-0.5' : 'left-0.5'}`} />
          </div>
        </button>
      </div>
    </div>
  );
};
