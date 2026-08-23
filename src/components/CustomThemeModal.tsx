import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Check, 
  Save, 
  RotateCcw, 
  Eye, 
  Download, 
  Upload,
  Palette,
  Layers,
  Wand2
} from 'lucide-react';
import { UITheme } from '../types/theme';
import { 
  generateThemePalette, 
  saveCustomTheme, 
  generateRandomHarmoniousPalette, 
  applyThemeToDOM,
  hexToRgba,
  isProtectedTheme
} from '../utils/themePresets';
import { ChessPiece } from './ChessPiece';

interface CustomThemeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onThemeCreated: (newTheme: UITheme) => void;
  initialTheme?: UITheme | null;
}

const QUICK_ACCENT_COLORS = [
  '#52673A', // Kurdish Tactical Olive
  '#F5C453', // Kurdish Sun Gold
  '#8C2425', // Jamadani Crimson Red
  '#DFD0B0', // Sandstone Khaki
  '#3b82f6', // Electric Blue
  '#10b981', // Emerald
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#f97316', // Orange
];

const QUICK_BG_COLORS = [
  '#10140e', // Peshmerga Mountain Night
  '#161c12', // Zagros Olive Dark
  '#0a0a0c', // Obsidian Deep
  '#06140e', // Forest Dark
  '#110f0c', // Warm Charcoal
  '#0e0b1a', // Twilight Purple
  '#07121b', // Glacial Navy
  '#09090b', // Pure Slate
];

const BOARD_PRESETS = [
  { name: '☀️ Peshmerga Tactical', light: '#DFD0B0', dark: '#435433', border: '#8C2425' },
  { name: 'Tournament Green', light: '#eeeed2', dark: '#769656', border: '#4a6333' },
  { name: 'Warm Wood', light: '#fef3c7', dark: '#b45309', border: '#78350f' },
  { name: 'Glacier Blue', light: '#e0f2fe', dark: '#0369a1', border: '#075985' },
  { name: 'Royal Amethyst', light: '#f3e8ff', dark: '#7e22ce', border: '#581c87' },
  { name: 'Crimson Wine', light: '#ffe4e6', dark: '#be123c', border: '#881337' },
];

export const CustomThemeModal: React.FC<CustomThemeModalProps> = ({
  isOpen,
  onClose,
  onThemeCreated,
  initialTheme
}) => {
  const [themeName, setThemeName] = useState('My Custom Theme');
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [secondaryColor, setSecondaryColor] = useState('#a855f7');
  const [bgColor, setBgColor] = useState('#0a0a0c');
  const [boardLight, setBoardLight] = useState('#eeeed2');
  const [boardDark, setBoardDark] = useState('#769656');
  const [boardBorder, setBoardBorder] = useState('#4a6333');
  const [importExportJson, setImportExportJson] = useState('');
  const [showJsonMode, setShowJsonMode] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const isPresetCloned = initialTheme && isProtectedTheme(initialTheme.id);

  useEffect(() => {
    if (initialTheme) {
      if (isProtectedTheme(initialTheme.id)) {
        // When copying the default or preset theme, start with an editable copy name
        const cleanBaseName = initialTheme.name.replace(/^[^\w\s]*\s*/, '').replace(/\s*\([^)]*\)/g, '');
        setThemeName(`${cleanBaseName} (Custom Copy)`);
      } else {
        setThemeName(initialTheme.name || 'My Custom Theme');
      }
      setPrimaryColor(initialTheme.colors.primary || '#3b82f6');
      setSecondaryColor(initialTheme.colors.secondary || '#a855f7');
      setBgColor(initialTheme.colors.appBg || '#0a0a0c');
      setBoardLight(initialTheme.colors.boardLight || '#eeeed2');
      setBoardDark(initialTheme.colors.boardDark || '#769656');
      setBoardBorder(initialTheme.colors.boardBorder || '#4a6333');
    } else {
      setThemeName('My Custom Theme');
      setPrimaryColor('#3b82f6');
      setSecondaryColor('#a855f7');
      setBgColor('#0a0a0c');
      setBoardLight('#eeeed2');
      setBoardDark('#769656');
      setBoardBorder('#4a6333');
    }
  }, [initialTheme, isOpen]);

  if (!isOpen) return null;

  const handleRandomize = () => {
    const pal = generateRandomHarmoniousPalette();
    setThemeName(pal.name);
    setPrimaryColor(pal.primary);
    setSecondaryColor(pal.secondary);
    setBgColor(pal.bg);
    setBoardLight(pal.boardLight);
    setBoardDark(pal.boardDark);
    setBoardBorder(pal.boardBorder);
  };

  const handleSaveAndApply = () => {
    const newTheme = generateThemePalette(
      themeName.trim() || 'Custom Theme',
      primaryColor,
      secondaryColor,
      bgColor,
      boardLight,
      boardDark,
      boardBorder
    );

    // Only reuse ID if it's already an existing custom theme (NOT a protected preset)
    if (initialTheme?.id && initialTheme.isCustom && !isProtectedTheme(initialTheme.id)) {
      newTheme.id = initialTheme.id;
    }

    saveCustomTheme(newTheme);
    applyThemeToDOM(newTheme);
    onThemeCreated(newTheme);
    onClose();
  };

  const handleExportJson = () => {
    const themeObj = generateThemePalette(
      themeName.trim() || 'Custom Theme',
      primaryColor,
      secondaryColor,
      bgColor,
      boardLight,
      boardDark,
      boardBorder
    );
    const json = JSON.stringify(themeObj, null, 2);
    setImportExportJson(json);
    setShowJsonMode(true);
    navigator.clipboard.writeText(json);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importExportJson);
      if (parsed && parsed.colors) {
        setThemeName(parsed.name || 'Imported Theme');
        if (parsed.colors.primary) setPrimaryColor(parsed.colors.primary);
        if (parsed.colors.secondary) setSecondaryColor(parsed.colors.secondary);
        if (parsed.colors.appBg) setBgColor(parsed.colors.appBg);
        if (parsed.colors.boardLight) setBoardLight(parsed.colors.boardLight);
        if (parsed.colors.boardDark) setBoardDark(parsed.colors.boardDark);
        if (parsed.colors.boardBorder) setBoardBorder(parsed.colors.boardBorder);
        setShowJsonMode(false);
      }
    } catch (e) {
      alert('Invalid JSON structure. Please check and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl animate-in fade-in duration-200 p-4">
      <div className="relative glass-panel rounded-3xl p-6 sm:p-7 max-w-2xl w-full shadow-2xl overflow-y-auto max-h-[92vh] border border-white/20">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/50 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4 pr-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 rounded-xl bg-gradient-to-tr from-[#52673A]/40 to-[#F5C453]/30 border border-[#F5C453]/40 text-[#F5C453]">
                <Palette className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-white font-heading">
                {isPresetCloned
                  ? 'Duplicate & Customize Theme'
                  : initialTheme
                  ? 'Edit Custom Theme'
                  : 'Theme Creator'}
              </h2>
            </div>
            <p className="text-xs text-white/60">
              Personalize colors, ambient glows, buttons, and chessboard styling
            </p>
          </div>

          <button
            onClick={handleRandomize}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.14] text-white/90 text-xs font-semibold border border-white/15 transition-all shadow-sm active:scale-95"
            title="Generate harmonious palette"
          >
            <Wand2 className="w-3.5 h-3.5 text-yellow-400" />
            <span>Randomize</span>
          </button>
        </div>

        {/* Protected preset cloning badge */}
        {isPresetCloned && (
          <div className="mb-4 p-3 rounded-2xl bg-[#52673A]/20 border border-[#F5C453]/40 flex items-center gap-2.5 text-xs text-[#DFD0B0]">
            <span className="text-base">🔒</span>
            <div className="leading-tight">
              <strong className="text-[#F5C453] font-bold">Protected Master Theme: </strong>
              The original preset remains permanent and untouched. You can modify any colors below and save this as your own custom edition.
            </div>
          </div>
        )}

        {/* Live Interactive Preview Box */}
        <div 
          className="mb-6 p-4 rounded-2xl border transition-all duration-300 relative overflow-hidden"
          style={{
            backgroundColor: bgColor,
            borderColor: hexToRgba(primaryColor, 0.4),
            boxShadow: `0 8px 32px ${hexToRgba(primaryColor, 0.2)}`
          }}
        >
          {/* Ambient Glows inside preview */}
          <div 
            className="absolute top-0 right-0 w-32 h-32 rounded-full pointer-events-none filter blur-2xl opacity-40"
            style={{ backgroundColor: secondaryColor }}
          />
          <div 
            className="absolute bottom-0 left-0 w-32 h-32 rounded-full pointer-events-none filter blur-2xl opacity-40"
            style={{ backgroundColor: primaryColor }}
          />

          <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Live Board Preview (4x4 Mini Board) */}
            <div 
              className="w-28 h-28 rounded-xl overflow-hidden shadow-lg border-2 grid grid-cols-4 grid-rows-4 shrink-0"
              style={{ borderColor: boardBorder }}
            >
              {[0, 1, 2, 3].map(row =>
                [0, 1, 2, 3].map(col => {
                  const isLight = (row + col) % 2 === 0;
                  const isPieceSquare = (row === 0 && col === 1) || (row === 3 && col === 2);
                  return (
                    <div
                      key={`${row}-${col}`}
                      style={{ backgroundColor: isLight ? boardLight : boardDark }}
                      className="flex items-center justify-center relative"
                    >
                      {row === 0 && col === 1 && (
                        <div className="w-5 h-5">
                          <ChessPiece type="n" color="b" theme="classic" />
                        </div>
                      )}
                      {row === 3 && col === 2 && (
                        <div className="w-5 h-5">
                          <ChessPiece type="q" color="w" theme="classic" />
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Live UI Components Demonstration */}
            <div className="flex-1 w-full flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white tracking-wide">
                  {themeName || 'Theme Preview'}
                </span>
                <span 
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border"
                  style={{
                    backgroundColor: hexToRgba(primaryColor, 0.2),
                    borderColor: hexToRgba(primaryColor, 0.5),
                    color: primaryColor
                  }}
                >
                  +1.20 Eval
                </span>
              </div>

              {/* Sample Action Buttons & Clock */}
              <div className="flex items-center gap-2">
                <button
                  style={{
                    background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                    boxShadow: `0 4px 14px ${hexToRgba(primaryColor, 0.4)}`
                  }}
                  className="flex-1 py-1.5 px-3 rounded-xl text-white text-xs font-bold text-center border border-white/20"
                >
                  Action Button
                </button>
                <div 
                  className="px-3 py-1.5 rounded-xl border text-xs font-mono font-bold text-white/90"
                  style={{
                    backgroundColor: hexToRgba('#ffffff', 0.08),
                    borderColor: hexToRgba(secondaryColor, 0.3)
                  }}
                >
                  10:00
                </div>
              </div>

              {/* Sample Move Notation Badge */}
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-white/50 font-mono">1.</span>
                <span 
                  className="px-1.5 py-0.5 rounded border text-white font-mono font-semibold"
                  style={{
                    backgroundColor: hexToRgba(primaryColor, 0.15),
                    borderColor: hexToRgba(primaryColor, 0.3)
                  }}
                >
                  e4
                </span>
                <span className="text-white/80 font-mono">e5</span>
                <span className="text-white/50 font-mono">2.</span>
                <span className="text-white/80 font-mono">Nf3</span>
              </div>
            </div>
          </div>
        </div>

        {/* Theme Name Input */}
        <div className="mb-5">
          <label className="text-xs font-bold text-white/80 uppercase tracking-wider block mb-1.5">
            Theme Name
          </label>
          <input
            type="text"
            value={themeName}
            onChange={e => setThemeName(e.target.value)}
            placeholder="e.g., Cyberpunk Azure, Tokyo Night..."
            maxLength={30}
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white/[0.05] border border-white/10 text-white text-sm focus:outline-none focus:border-blue-400 backdrop-blur-md transition-colors"
          />
        </div>

        {/* Color Customization Grid */}
        <div className="space-y-4 mb-6">
          {/* 1. Primary Accent Color */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-white block">Primary Accent</span>
                <span className="text-[11px] text-white/50">Used for main buttons, glows, highlights</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={e => setPrimaryColor(e.target.value)}
                  className="w-20 px-2 py-1 rounded-lg bg-black/40 border border-white/15 text-xs font-mono text-white text-center"
                />
              </div>
            </div>
            {/* Quick Palette Swatches */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {QUICK_ACCENT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setPrimaryColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    primaryColor.toLowerCase() === c.toLowerCase()
                      ? 'scale-125 ring-2 ring-white shadow-md'
                      : 'hover:scale-110 opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 2. Secondary / Gradient Color */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-white block">Secondary Accent</span>
                <span className="text-[11px] text-white/50">Used for gradient transitions & secondary glows</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={e => setSecondaryColor(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={e => setSecondaryColor(e.target.value)}
                  className="w-20 px-2 py-1 rounded-lg bg-black/40 border border-white/15 text-xs font-mono text-white text-center"
                />
              </div>
            </div>
            {/* Quick Palette Swatches */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {QUICK_ACCENT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setSecondaryColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    secondaryColor.toLowerCase() === c.toLowerCase()
                      ? 'scale-125 ring-2 ring-white shadow-md'
                      : 'hover:scale-110 opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 3. Background Color */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-white block">App Background Base</span>
                <span className="text-[11px] text-white/50">Deep dark canvas background</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  className="w-7 h-7 rounded-lg cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={e => setBgColor(e.target.value)}
                  className="w-20 px-2 py-1 rounded-lg bg-black/40 border border-white/15 text-xs font-mono text-white text-center"
                />
              </div>
            </div>
            {/* Quick BG Swatches */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              {QUICK_BG_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setBgColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-6 h-6 rounded-full border border-white/20 transition-transform ${
                    bgColor.toLowerCase() === c.toLowerCase()
                      ? 'scale-125 ring-2 ring-white shadow-md'
                      : 'hover:scale-110 opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* 4. Chessboard Customization */}
          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-xs font-bold text-white block">Chessboard Squares & Border</span>
                <span className="text-[11px] text-white/50">Coordinate board tones with your theme</span>
              </div>
            </div>

            {/* Quick Board Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
              {BOARD_PRESETS.map(bp => (
                <button
                  key={bp.name}
                  onClick={() => {
                    setBoardLight(bp.light);
                    setBoardDark(bp.dark);
                    setBoardBorder(bp.border);
                  }}
                  className="flex items-center gap-2 p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-left transition-all"
                >
                  <div 
                    className="w-5 h-5 rounded overflow-hidden grid grid-cols-2 grid-rows-2 border shrink-0"
                    style={{ borderColor: bp.border }}
                  >
                    <div style={{ backgroundColor: bp.light }} />
                    <div style={{ backgroundColor: bp.dark }} />
                    <div style={{ backgroundColor: bp.dark }} />
                    <div style={{ backgroundColor: bp.light }} />
                  </div>
                  <span className="text-[11px] font-medium text-white/80 truncate">
                    {bp.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Detailed Square Pickers */}
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-white/60 font-medium">Light Squares</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={boardLight}
                    onChange={e => setBoardLight(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={boardLight}
                    onChange={e => setBoardLight(e.target.value)}
                    className="w-full px-1.5 py-1 rounded bg-black/40 border border-white/15 text-[10px] font-mono text-white text-center"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-white/60 font-medium">Dark Squares</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={boardDark}
                    onChange={e => setBoardDark(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={boardDark}
                    onChange={e => setBoardDark(e.target.value)}
                    className="w-full px-1.5 py-1 rounded bg-black/40 border border-white/15 text-[10px] font-mono text-white text-center"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-white/60 font-medium">Board Border</span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="color"
                    value={boardBorder}
                    onChange={e => setBoardBorder(e.target.value)}
                    className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    type="text"
                    value={boardBorder}
                    onChange={e => setBoardBorder(e.target.value)}
                    className="w-full px-1.5 py-1 rounded bg-black/40 border border-white/15 text-[10px] font-mono text-white text-center"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* JSON Import/Export Drawer (optional) */}
        {showJsonMode && (
          <div className="mb-5 p-3.5 rounded-2xl bg-black/50 border border-white/15 animate-in fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white/90">Theme JSON Data</span>
              {copySuccess && (
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Copied to clipboard!
                </span>
              )}
            </div>
            <textarea
              value={importExportJson}
              onChange={e => setImportExportJson(e.target.value)}
              placeholder="Paste Theme JSON configuration here..."
              rows={4}
              className="w-full p-2.5 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-white/90 focus:outline-none focus:border-blue-400 mb-2"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowJsonMode(false)}
                className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-xs font-semibold text-white/80"
              >
                Close
              </button>
              <button
                onClick={handleImportJson}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white"
              >
                Apply Imported JSON
              </button>
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportJson}
              className="py-2.5 px-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white/80 hover:text-white flex items-center gap-1.5 transition-all"
              title="Export theme configuration as JSON"
            >
              <Download className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Export / Import</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-xs font-semibold text-white/80 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndApply}
              style={{
                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                boxShadow: `0 4px 18px ${hexToRgba(primaryColor, 0.4)}`
              }}
              className="py-2.5 px-5 rounded-2xl text-white font-bold text-xs flex items-center gap-1.5 hover:opacity-95 transition-all border border-white/20 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>Save & Apply Theme</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
