import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Sun,
  Moon,
  Shield,
  Palette,
  Layers,
  Image as ImageIcon,
  RotateCcw,
  Check,
  AlertTriangle,
  Eye,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { BackgroundMode, CustomBackgroundConfig } from '../../types/chess';
import { useSettings } from '../../context/SettingsContext';

const PRESET_SOLID_COLORS = [
  { name: 'Pure Obsidian', hex: '#05070a' },
  { name: 'Deep GitHub Void', hex: '#0d1117' },
  { name: 'Midnight Navy', hex: '#0a192f' },
  { name: 'Charcoal Slate', hex: '#1e293b' },
  { name: 'Deep Emerald', hex: '#064e3b' },
  { name: 'Dark Burgundy', hex: '#450a0a' },
  { name: 'Imperial Violet', hex: '#2e1065' },
  { name: 'Cold Titanium', hex: '#18181b' },
];

const PRESET_GRADIENTS = [
  { name: 'Obsidian to Blue', start: '#05070a', end: '#1e3a8a', angle: 135 },
  { name: 'Midnight Void', start: '#090d16', end: '#1a102f', angle: 160 },
  { name: 'Emerald Forest', start: '#022c22', end: '#064e3b', angle: 120 },
  { name: 'Crimson Abyss', start: '#1c0508', end: '#4c0519', angle: 145 },
  { name: 'Cyber Sunset', start: '#180b2c', end: '#4c0519', angle: 135 },
  { name: 'Deep Titanium', start: '#09090b', end: '#27272a', angle: 180 },
];

const SAMPLE_WALLPAPERS = [
  {
    name: 'Cosmic Nebula',
    url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'Dark Marble Stone',
    url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'Minimalist Architecture',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1600&auto=format&fit=crop',
  },
  {
    name: 'Dark Velvet Geometry',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1600&auto=format&fit=crop',
  },
];

export const BackgroundSettings: React.FC = () => {
  const { customBackground, setCustomBackground, resetCustomBackground } = useSettings();

  // Local draft state so user can experiment before persisting
  const [draft, setDraft] = useState<CustomBackgroundConfig>(customBackground);
  const [imageError, setImageError] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);

  // Sync draft when external settings change
  useEffect(() => {
    setDraft(customBackground);
  }, [customBackground]);

  // Test custom image URL validity
  useEffect(() => {
    if (draft.mode === 'image' && draft.imageUrl) {
      const img = new Image();
      img.src = draft.imageUrl;
      img.onload = () => setImageError(false);
      img.onerror = () => setImageError(true);
    } else {
      setImageError(false);
    }
  }, [draft.mode, draft.imageUrl]);

  const handleModeChange = (mode: BackgroundMode) => {
    const updated: CustomBackgroundConfig = {
      ...draft,
      mode,
      // Default fallback values if fields are missing
      color: draft.color || '#05070a',
      gradientStart: draft.gradientStart || '#0f172a',
      gradientEnd: draft.gradientEnd || '#1e1b4b',
      gradientAngle: draft.gradientAngle ?? 135,
      imageUrl: draft.imageUrl || '',
      imageOpacity: draft.imageOpacity ?? 0.65,
      blur: draft.blur ?? 0,
    };
    setDraft(updated);
    setCustomBackground(updated);
  };

  const handleApply = () => {
    setCustomBackground(draft);
    setIsSavedRecently(true);
    setTimeout(() => setIsSavedRecently(false), 2000);
  };

  const handleReset = () => {
    resetCustomBackground();
    setDraft({
      mode: 'system',
      color: '#05070a',
      gradientStart: '#0f172a',
      gradientEnd: '#1e1b4b',
      gradientAngle: 135,
      imageUrl: '',
      imageOpacity: 0.65,
      blur: 0,
    });
    setImageError(false);
  };

  // Compute live preview CSS style
  const previewBackgroundStyle = useMemo<React.CSSProperties>(() => {
    if (draft.mode === 'system') {
      return {
        backgroundColor: '#05070a',
        backgroundImage:
          'radial-gradient(circle at 10% 20%, rgba(245, 196, 83, 0.15) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(82, 103, 58, 0.2) 0%, transparent 45%)',
      };
    }
    if (draft.mode === 'dark') {
      return { backgroundColor: '#05070a' };
    }
    if (draft.mode === 'high_contrast') {
      return {
        backgroundColor: '#080C14',
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
        backgroundSize: '100% 24px',
      };
    }
    if (draft.mode === 'color') {
      return { backgroundColor: draft.color || '#05070a' };
    }
    if (draft.mode === 'gradient') {
      const angle = draft.gradientAngle ?? 135;
      const start = draft.gradientStart || '#0f172a';
      const end = draft.gradientEnd || '#1e1b4b';
      return { backgroundImage: `linear-gradient(${angle}deg, ${start}, ${end})` };
    }
    if (draft.mode === 'image' && draft.imageUrl && !imageError) {
      return {
        backgroundImage: `url("${draft.imageUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: draft.blur ? `blur(${draft.blur}px)` : undefined,
      };
    }
    return { backgroundColor: '#05070a' };
  }, [draft, imageError]);

  return (
    <div className="space-y-6 pb-2" id="background-settings-container">
      {/* Overview Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-500/20 flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
          <Palette className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Custom Background & Accessibility
          </h3>
          <p className="text-xs text-white/70 leading-relaxed mt-0.5">
            Personalize your tactical chess atmosphere. Switch to our <b>High-Contrast Dark Theme</b> (WCAG AAA compliant) for enhanced visual clarity, select solid colors, gradients, or link your custom wallpaper without breaking glassmorphism panels.
          </p>
        </div>
      </div>

      {/* Mode Selector Chips */}
      <div>
        <label className="text-[11px] font-black uppercase tracking-[0.15em] text-white/50 block mb-2.5">
          Background Style
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            type="button"
            id="bg-mode-system"
            onClick={() => handleModeChange('system')}
            className={`bg-mode-chip ${draft.mode === 'system' ? 'active' : ''}`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Theme Default</span>
          </button>

          <button
            type="button"
            id="bg-mode-dark"
            onClick={() => handleModeChange('dark')}
            className={`bg-mode-chip ${draft.mode === 'dark' ? 'active' : ''}`}
          >
            <Moon className="w-4 h-4 text-indigo-400" />
            <span>Obsidian Dark</span>
          </button>

          <button
            type="button"
            id="bg-mode-high-contrast"
            onClick={() => handleModeChange('high_contrast')}
            className={`bg-mode-chip ${draft.mode === 'high_contrast' ? 'active' : ''}`}
          >
            <Shield className="w-4 h-4 text-sky-400" />
            <span>High Contrast AAA</span>
          </button>

          <button
            type="button"
            id="bg-mode-color"
            onClick={() => handleModeChange('color')}
            className={`bg-mode-chip ${draft.mode === 'color' ? 'active' : ''}`}
          >
            <Palette className="w-4 h-4 text-rose-400" />
            <span>Custom Color</span>
          </button>

          <button
            type="button"
            id="bg-mode-gradient"
            onClick={() => handleModeChange('gradient')}
            className={`bg-mode-chip ${draft.mode === 'gradient' ? 'active' : ''}`}
          >
            <Layers className="w-4 h-4 text-purple-400" />
            <span>Custom Gradient</span>
          </button>

          <button
            type="button"
            id="bg-mode-image"
            onClick={() => handleModeChange('image')}
            className={`bg-mode-chip ${draft.mode === 'image' ? 'active' : ''}`}
          >
            <ImageIcon className="w-4 h-4 text-emerald-400" />
            <span>Custom Image</span>
          </button>
        </div>
      </div>

      {/* Mode 1: High Contrast Dark Highlights */}
      {draft.mode === 'high_contrast' && (
        <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-400/30 space-y-2">
          <div className="flex items-center gap-2 text-sky-300 font-bold text-xs">
            <Check className="w-4 h-4" />
            <span>Accessibility Mode: High-Contrast Dark Active</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Optimized for maximum legibility and reduced eye strain:
          </p>
          <ul className="text-[11px] text-slate-300 space-y-1 list-disc list-inside">
            <li><b>18.4:1 contrast ratio</b> between primary white text and deep void background (exceeds WCAG AAA requirement of 7:1)</li>
            <li>Solid <b>#4B5563</b> high-visibility container borders instead of low-contrast shadows</li>
            <li>Electric <b>Sky Cyan (#38BDF8)</b> focus rings and active square markers for instant tactical recognition</li>
            <li>Board squares calibrated with high contrast: <b>#F1F5F9</b> vs <b>#1E293B</b></li>
          </ul>
        </div>
      )}

      {/* Mode 2: Custom Solid Color */}
      {draft.mode === 'color' && (
        <div className="p-4 bg-settings-card space-y-3.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Pick Background Color
            </span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id="custom-color-picker"
                value={draft.color || '#05070a'}
                onChange={(e) => {
                  const updated = { ...draft, color: e.target.value };
                  setDraft(updated);
                  setCustomBackground(updated);
                }}
                className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <span className="text-xs font-mono text-white/80 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                {draft.color?.toUpperCase()}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] text-white/50 uppercase font-black tracking-widest block mb-2">
              Curated Obsidian & Night Swatches
            </span>
            <div className="flex flex-wrap gap-2">
              {PRESET_SOLID_COLORS.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  title={swatch.name}
                  onClick={() => {
                    const updated = { ...draft, color: swatch.hex };
                    setDraft(updated);
                    setCustomBackground(updated);
                  }}
                  className={`bg-color-swatch ${draft.color === swatch.hex ? 'active' : ''}`}
                  style={{ backgroundColor: swatch.hex }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mode 3: Custom Gradient */}
      {draft.mode === 'gradient' && (
        <div className="p-4 bg-settings-card space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-white/70 block mb-1">
                Start Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="gradient-start-picker"
                  value={draft.gradientStart || '#0f172a'}
                  onChange={(e) => {
                    const updated = { ...draft, gradientStart: e.target.value };
                    setDraft(updated);
                    setCustomBackground(updated);
                  }}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono text-white/80 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                  {draft.gradientStart}
                </span>
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-white/70 block mb-1">
                End Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="gradient-end-picker"
                  value={draft.gradientEnd || '#1e1b4b'}
                  onChange={(e) => {
                    const updated = { ...draft, gradientEnd: e.target.value };
                    setDraft(updated);
                    setCustomBackground(updated);
                  }}
                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <span className="text-xs font-mono text-white/80 bg-white/5 px-2 py-1 rounded-lg border border-white/10">
                  {draft.gradientEnd}
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-white/70">
                Gradient Angle: {draft.gradientAngle ?? 135}°
              </label>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="15"
              value={draft.gradientAngle ?? 135}
              onChange={(e) => {
                const updated = { ...draft, gradientAngle: parseInt(e.target.value, 10) };
                setDraft(updated);
                setCustomBackground(updated);
              }}
              className="custom-range-slider"
            />
          </div>

          <div>
            <span className="text-[10px] text-white/50 uppercase font-black tracking-widest block mb-2">
              Preset Gradients
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PRESET_GRADIENTS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => {
                    const updated = {
                      ...draft,
                      gradientStart: p.start,
                      gradientEnd: p.end,
                      gradientAngle: p.angle,
                    };
                    setDraft(updated);
                    setCustomBackground(updated);
                  }}
                  className="p-2 rounded-xl border border-white/10 text-left hover:border-white/30 transition-all flex items-center gap-2 text-xs text-white"
                  style={{
                    background: `linear-gradient(${p.angle}deg, ${p.start}, ${p.end})`,
                  }}
                >
                  <div className="w-3 h-3 rounded-full border border-white/30 shrink-0" />
                  <span className="truncate drop-shadow-sm font-semibold">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mode 4: Custom Image */}
      {draft.mode === 'image' && (
        <div className="p-4 bg-settings-card space-y-4">
          <div>
            <label className="text-[11px] font-bold text-white/70 block mb-1.5">
              Custom Wallpaper Image URL
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                id="bg-image-url-input"
                placeholder="https://example.com/wallpaper.jpg"
                value={draft.imageUrl || ''}
                onChange={(e) => {
                  const updated = { ...draft, imageUrl: e.target.value.trim() };
                  setDraft(updated);
                  setCustomBackground(updated);
                }}
                className="flex-1 glass-input text-xs"
              />
            </div>
            {imageError && (
              <p className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Could not load image from this URL. Reverting safely to default base.</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-[11px] text-white/70 mb-1">
                <span>Image Opacity</span>
                <span>{Math.round((draft.imageOpacity ?? 0.65) * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={draft.imageOpacity ?? 0.65}
                onChange={(e) => {
                  const updated = { ...draft, imageOpacity: parseFloat(e.target.value) };
                  setDraft(updated);
                  setCustomBackground(updated);
                }}
                className="custom-range-slider"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-white/70 mb-1">
                <span>Blur Filter</span>
                <span>{draft.blur ?? 0}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="1"
                value={draft.blur ?? 0}
                onChange={(e) => {
                  const updated = { ...draft, blur: parseInt(e.target.value, 10) };
                  setDraft(updated);
                  setCustomBackground(updated);
                }}
                className="custom-range-slider"
              />
            </div>
          </div>

          <div>
            <span className="text-[10px] text-white/50 uppercase font-black tracking-widest block mb-2">
              Curated Dark Chess Wallpapers
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SAMPLE_WALLPAPERS.map((sw) => (
                <button
                  key={sw.name}
                  type="button"
                  onClick={() => {
                    const updated = { ...draft, imageUrl: sw.url };
                    setDraft(updated);
                    setCustomBackground(updated);
                  }}
                  className={`group relative h-16 rounded-xl overflow-hidden border transition-all text-left ${
                    draft.imageUrl === sw.url ? 'border-amber-400 ring-2 ring-amber-400/40' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <img
                    src={sw.url}
                    alt={sw.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-1.5">
                    <span className="text-[10px] text-white font-medium truncate">{sw.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Interactive Preview */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] font-black uppercase tracking-[0.15em] text-white/50 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Live Interactive Preview</span>
          </label>
          <span className="text-[10px] text-white/40">Confirm Glassmorphism Legibility</span>
        </div>

        <div className="bg-preview-stage p-4 flex flex-col justify-between" style={previewBackgroundStyle}>
          {/* Simulated Glass Panel Mockup */}
          <div className="glass-frost p-3.5 max-w-sm rounded-xl border border-white/15 shadow-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white">Live Match in Progress</span>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                10:00 + 2s
              </span>
            </div>

            <p className="text-xs text-white/80 leading-snug">
              Grandmaster HUD • White to move. Glass readability is preserved under all conditions.
            </p>

            <div className="flex gap-2 pt-1">
              <div className="px-2.5 py-1 rounded-lg bg-white/10 text-[10px] font-bold text-white border border-white/15">
                Resign
              </div>
              <div className="px-2.5 py-1 rounded-lg bg-amber-400 text-black text-[10px] font-bold shadow-lg shadow-amber-400/20">
                Offer Draw
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-2 flex items-center justify-between border-t border-white/10">
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white/60 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset to Default</span>
        </button>

        <button
          type="button"
          onClick={handleApply}
          className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-400 text-black hover:bg-amber-300 transition-all shadow-xl shadow-amber-400/20 cursor-pointer active:scale-95"
        >
          {isSavedRecently ? (
            <>
              <Check className="w-4 h-4" />
              <span>Saved!</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>Save Background</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
