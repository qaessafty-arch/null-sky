import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useGlassFloat } from '../hooks/useGlassFloat';
import { AppSettings, BoardThemeId, PieceThemeId } from '../types/chess';
import { ChessPiece } from './ChessPiece';
import { 
  Palette, 
  X, 
  Check, 
  Sparkles, 
  Swords, 
  Shield, 
  Crown, 
  Shuffle, 
  Eye,
  Sliders,
  CheckCircle2
} from 'lucide-react';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings
}) => {
  const [activeTab, setActiveTab] = useState<'presets' | 'crossover' | 'boards'>('presets');
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const showSuccessFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
  };

  // 4 Primary Master Themes
  const masterThemes = [
    {
      id: 'obsidian',
      name: 'Deep Obsidian',
      subtitle: 'Modern AAA Tactical Noir',
      boardTheme: 'obsidian' as BoardThemeId,
      pieceTheme: 'classic' as PieceThemeId,
      badge: 'PRO DEFAULT',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]',
      description: 'Ultra-sleek modern interface with Amber Gold accents (#F59E0B) on Deep Obsidian panels (#111827).',
      whiteRoster: 'Championship White Staunton set with golden glow focus.',
      blackRoster: 'Championship Black Staunton set with obsidian depth.',
      previewBg: 'from-[#0B0F19] via-[#111827] to-[#F59E0B]/20'
    },
    {
      id: 'one-piece',
      name: 'One Piece Anime',
      subtitle: 'Straw Hats vs. Marines',
      boardTheme: 'one-piece' as BoardThemeId,
      pieceTheme: 'one-piece' as PieceThemeId,
      badge: 'GRAND LINE',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
      description: 'Thousand Sunny wood planks (#d4a359) and Deep Ocean Navy (#0b1d3a) with purple Haki move highlights.',
      whiteRoster: 'Luffy (King), Nami (Queen), Zoro/Sanji (Bishops), Chopper (Knights), Wano Castle (Rooks), Grand Fleet (Pawns)',
      blackRoster: 'Akainu (King), Kizaru (Queen), Fujitora/Aokiji (Bishops), Pacifista (Knights), Marineford (Rooks), Marines (Pawns)',
      previewBg: 'from-[#0b1d3a] via-[#5c2a1a] to-[#d4a359]'
    },
    {
      id: 'aot',
      name: 'Attack on Titan (AoT)',
      subtitle: 'Scout Regiment vs. The Nine Titans',
      boardTheme: 'aot' as BoardThemeId,
      pieceTheme: 'aot' as PieceThemeId,
      badge: 'DARK FANTASY',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      description: 'Wall Maria weathered stone battlements (#1f232b dark / #5d6f54 green) with glowing ODM Gas green aura.',
      whiteRoster: 'Erwin (King), Mikasa (Queen), Levi (Bishops), Scout Horse (Knights), Wall Maria (Rooks), Recruits (Pawns)',
      blackRoster: 'Colossal Titan (King), Female Titan (Queen), Beast Titan (Bishops), Cart Titan (Knights), Armored Titan (Rooks), Pure Titans (Pawns)',
      previewBg: 'from-[#1f232b] via-[#2a3028] to-[#5d6f54]'
    },
    {
      id: 'batman',
      name: 'Batman Gotham City',
      subtitle: 'Bat-Family vs. Arkham Rogues',
      boardTheme: 'batman' as BoardThemeId,
      pieceTheme: 'batman' as PieceThemeId,
      badge: 'GOTHAM NOIR',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
      description: 'Wet Gotham asphalt (#111827 dark / #374151 slate) with high-intensity Bat-Signal yellow move highlights.',
      whiteRoster: 'Batman (King), Catwoman (Queen), Nightwing/Robin (Bishops), Batmobile (Knights), Wayne Tower (Rooks), GCPD (Pawns)',
      blackRoster: 'Joker (King), Harley Quinn (Queen), Riddler/Two-Face (Bishops), Bane (Knights), Arkham Asylum (Rooks), Goons (Pawns)',
      previewBg: 'from-[#0f172a] via-[#1e293b] to-[#ca8a04]'
    },
    {
      id: 'classic',
      name: 'Classic Tournament',
      subtitle: 'Official Staunton & Wooden Board',
      boardTheme: 'classic' as BoardThemeId,
      pieceTheme: 'classic' as PieceThemeId,
      badge: 'CHAMPIONSHIP',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      description: 'Championship tournament chess board with pristine Staunton vector piece set.',
      whiteRoster: 'Classic White King, Queen, Bishops, Knights, Rooks, and Pawns',
      blackRoster: 'Classic Black King, Queen, Bishops, Knights, Rooks, and Pawns',
      previewBg: 'from-[#3b2212] via-[#8b5a2b] to-[#f0d9b5]'
    },
    {
      id: 'peshmerga',
      name: 'Peshmerga Royal',
      subtitle: 'Kurdish Sun & Citadel Heritage',
      boardTheme: 'peshmerga' as BoardThemeId,
      pieceTheme: 'peshmerga' as PieceThemeId,
      badge: 'SIGNATURE',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
      description: 'Hewlêr Citadel sandstone & military olive board with Kurdish 21-ray sun crests.',
      whiteRoster: 'Peshmerga Commander, Royal Queen, Khanjar Steeds, Citadel Fortress Towers',
      blackRoster: 'Midnight Zagros Vanguard, Shadow Knights, Hewlêr Citadel Fortress',
      previewBg: 'from-[#1e2818] via-[#435433] to-[#dfd0b0]'
    }
  ];

  const factionOptions: { id: PieceThemeId; name: string; tag: string; icon: string }[] = [
    { id: 'one-piece', name: 'One Piece (Straw Hats / Marines)', tag: 'OnePiece', icon: '🏴‍☠️' },
    { id: 'aot', name: 'Attack on Titan (Scouts / Titans)', tag: 'AoT', icon: '⚔️' },
    { id: 'batman', name: 'Batman Gotham (Bat-Family / Arkham)', tag: 'Gotham', icon: '🦇' },
    { id: 'peshmerga', name: 'Peshmerga Royal (Kurdish)', tag: 'Peshmerga', icon: '☀️' },
    { id: 'classic', name: 'Classic Staunton', tag: 'Standard', icon: '♟️' },
    { id: 'crystal_neon', name: 'Crystal Glass & Neon', tag: 'Neon', icon: '💎' },
    { id: 'vintage', name: 'Vintage Carved Wood', tag: 'Vintage', icon: '🪵' }
  ];

  const boardOptions: { id: BoardThemeId; name: string; lightBg: string; darkBg: string }[] = [
    { id: 'obsidian', name: 'AAA Deep Obsidian', lightBg: '#1F293D', darkBg: '#111827' },
    { id: 'one-piece', name: 'Thousand Sunny & Deep Navy', lightBg: '#d4a359', darkBg: '#0b1d3a' },
    { id: 'aot', name: 'Wall Maria Weathered Stone', lightBg: '#5d6f54', darkBg: '#1f232b' },
    { id: 'batman', name: 'Wet Gotham Asphalt & Neon Yellow', lightBg: '#374151', darkBg: '#111827' },
    { id: 'classic', name: 'Classic Hardwood / Staunton', lightBg: '#f0d9b5', darkBg: '#b58863' },
    { id: 'peshmerga', name: 'Peshmerga Sandstone & Olive', lightBg: '#DFD0B0', darkBg: '#435433' },
    { id: 'emerald', name: 'Emerald Tournament', lightBg: '#eeeed2', darkBg: '#769656' },
    { id: 'ocean', name: 'Ocean Breeze Slate', lightBg: '#dee3e6', darkBg: '#678292' },
    { id: 'midnight', name: 'Deep Midnight Obsidian', lightBg: '#334155', darkBg: '#0f172a' }
  ];

  const applyMasterTheme = (theme: typeof masterThemes[0]) => {
    onUpdateSettings({
      boardTheme: theme.boardTheme,
      pieceTheme: theme.pieceTheme,
      whitePieceTheme: theme.pieceTheme,
      blackPieceTheme: theme.pieceTheme,
      crossoverEnabled: false
    });
    showSuccessFeedback(`Applied ${theme.name} theme!`);
  };

  const handleCrossoverChange = (side: 'white' | 'black', themeId: PieceThemeId) => {
    if (side === 'white') {
      onUpdateSettings({
        whitePieceTheme: themeId,
        crossoverEnabled: true
      });
    } else {
      onUpdateSettings({
        blackPieceTheme: themeId,
        crossoverEnabled: true
      });
    }
    showSuccessFeedback(`Updated ${side === 'white' ? 'White' : 'Black'} faction!`);
  };

  const isCurrentMasterActive = (theme: typeof masterThemes[0]) => {
    return (
      !settings.crossoverEnabled &&
      settings.boardTheme === theme.boardTheme &&
      settings.pieceTheme === theme.pieceTheme
    );
  };

  const floatVariants = useGlassFloat(1.1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in select-none">
      <motion.div
        id="theme-selector-modal"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={["visible", "float"]}
        variants={{
          visible: { opacity: 1, scale: 1, y: 0 },
          ...floatVariants
        }}
        className="w-full max-w-2xl max-h-[92vh] bg-[var(--glass-panel)] border border-[var(--glass-border)] rounded-[24px] flex flex-col overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--glass-border)] flex items-center justify-between bg-[var(--app-bg)]/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[var(--app-bg)] flex items-center justify-center shadow-lg border border-[var(--secondary-accent)]">
              <Palette className="w-5 h-5 text-[var(--secondary-accent)]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Theme Engine & Pieces</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--secondary-accent)] text-[var(--app-bg)] font-black">
                  PRO
                </span>
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Attack on Titan, Batman Gotham City, Classic, & Crossover Mode
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#0B0F19] hover:bg-[#1F293D] text-[#94A3B8] hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-[#1F293D]"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback && (
          <div className="px-4 py-2 bg-[#10B981]/20 border-b border-[#10B981]/30 text-[#10B981] text-xs font-bold flex items-center gap-2 animate-in slide-in-from-top-1">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedback}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-2 bg-black/60 border-b border-[var(--glass-border)] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'presets'
                ? 'bg-[var(--secondary-accent)] text-[var(--app-bg)] shadow-md border border-[var(--secondary-accent)]/50'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            <span>4 Master Themes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('crossover')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'crossover'
                ? 'bg-[var(--glass-bg)] text-white shadow-md border border-purple-400/50'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5 text-purple-300" />
            <span>Crossover Factions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('boards')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'boards'
                ? 'bg-[var(--glass-bg)] text-white shadow-md border border-[var(--secondary-accent)]/50'
                : 'text-[var(--text-muted)] hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Board Styles</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* TAB 1: 3 MASTER THEMES */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3.5">
                {masterThemes.map(theme => {
                  const isActive = isCurrentMasterActive(theme);
                  return (
                    <div
                      key={theme.id}
                      className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                        isActive
                          ? 'bg-gradient-to-r ' + theme.previewBg + ' border-[#F5C453] shadow-xl ring-2 ring-[#F5C453]/40'
                          : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/10'
                      }`}
                    >
                      {theme.id === 'aot' && (
                        <div
                          className="absolute inset-0 pointer-events-none opacity-20 bg-cover bg-center mix-blend-luminosity z-0"
                          style={{
                            backgroundImage: `url('https://wallpaperaccess.com/full/279002.jpg')`
                          }}
                        />
                      )}
                      {theme.id === 'batman' && (
                        <div
                          className="absolute inset-0 pointer-events-none opacity-20 bg-cover bg-center mix-blend-luminosity z-0"
                          style={{
                            backgroundImage: `url('https://www.highreshdwallpapers.com/wp-content/uploads/2015/02/Awesome-Batman-Bat-Symbol.jpg')`
                          }}
                        />
                      )}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base font-black text-white">{theme.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${theme.badgeColor}`}>
                              {theme.badge}
                            </span>
                            {isActive && (
                              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500 text-black flex items-center gap-1 shadow-sm">
                                <Check className="w-3 h-3" /> ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#DFD0B0]/80">{theme.subtitle}</p>
                          <p className="text-[11px] text-white/60">{theme.description}</p>
                        </div>

                        {/* Piece Preview Row */}
                        <div className="flex items-center gap-2 shrink-0 bg-black/40 p-2 rounded-xl border border-white/10">
                          <div className="w-8 h-8 flex items-center justify-center">
                            <ChessPiece type="k" color="w" theme={theme.pieceTheme} className="w-7 h-7" />
                          </div>
                          <div className="w-8 h-8 flex items-center justify-center">
                            <ChessPiece type="q" color="w" theme={theme.pieceTheme} className="w-7 h-7" />
                          </div>
                          <span className="text-xs text-white/40">VS</span>
                          <div className="w-8 h-8 flex items-center justify-center">
                            <ChessPiece type="k" color="b" theme={theme.pieceTheme} className="w-7 h-7" />
                          </div>
                          <div className="w-8 h-8 flex items-center justify-center">
                            <ChessPiece type="q" color="b" theme={theme.pieceTheme} className="w-7 h-7" />
                          </div>
                        </div>
                      </div>

                      {/* Army Breakdown */}
                      <div className="mt-3 pt-2.5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                        <div className="p-2 rounded-lg bg-black/30 text-white/80">
                          <span className="font-bold text-amber-300">White Army: </span>
                          <span>{theme.whiteRoster}</span>
                        </div>
                        <div className="p-2 rounded-lg bg-black/30 text-white/80">
                          <span className="font-bold text-rose-300">Black Army: </span>
                          <span>{theme.blackRoster}</span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <div className="mt-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() => applyMasterTheme(theme)}
                          disabled={isActive}
                          className={`min-h-[44px] px-5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                            isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                              : 'bg-[#52673A] hover:bg-[#52673A]/80 text-white shadow-md border border-[#F5C453]/40'
                          }`}
                        >
                          {isActive ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Theme Selected</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4 text-amber-300" />
                              <span>Apply {theme.name}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CROSSOVER MODE */}
          {activeTab === 'crossover' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-purple-900/20 border border-purple-500/30 text-purple-200 text-xs">
                <span className="font-bold">⚔️ Crossover Battle Mode: </span>
                <span>
                  Pit different factions against each other! For example, command the <strong>Scout Regiment (Attack on Titan)</strong> against the <strong>Arkham Rogues (Batman)</strong>, or pair the <strong>Bat-Family</strong> against the <strong>Nine Titans</strong>!
                </span>
              </div>

              {/* Faction Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* White Faction Selector */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/15 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>⚪ White Faction</span>
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white font-mono font-bold">
                      {settings.whitePieceTheme || settings.pieceTheme}
                    </span>
                  </div>

                  {/* Live Piece Preview */}
                  <div className="p-3 rounded-xl bg-[#2a3028] border border-white/10 flex items-center justify-around">
                    <ChessPiece type="k" color="w" theme={settings.whitePieceTheme || settings.pieceTheme} className="w-9 h-9" />
                    <ChessPiece type="q" color="w" theme={settings.whitePieceTheme || settings.pieceTheme} className="w-9 h-9" />
                    <ChessPiece type="b" color="w" theme={settings.whitePieceTheme || settings.pieceTheme} className="w-9 h-9" />
                    <ChessPiece type="n" color="w" theme={settings.whitePieceTheme || settings.pieceTheme} className="w-9 h-9" />
                  </div>

                  <div className="space-y-1.5">
                    {factionOptions.map(f => {
                      const isSelected = (settings.whitePieceTheme || settings.pieceTheme) === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => handleCrossoverChange('white', f.id)}
                          className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer border ${
                            isSelected
                              ? 'bg-[#52673A] text-white border-[#F5C453]'
                              : 'bg-white/5 hover:bg-white/10 text-[#DFD0B0]/80 border-white/5'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{f.icon}</span>
                            <span>{f.name}</span>
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-amber-300" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Black Faction Selector */}
                <div className="p-4 rounded-2xl bg-black/40 border border-white/15 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                      <span>⚫ Black Faction</span>
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-white/10 text-white font-mono font-bold">
                      {settings.blackPieceTheme || settings.pieceTheme}
                    </span>
                  </div>

                  {/* Live Piece Preview */}
                  <div className="p-3 rounded-xl bg-[#1f232b] border border-white/10 flex items-center justify-around">
                    <ChessPiece type="k" color="b" theme={settings.blackPieceTheme || settings.pieceTheme} className="w-9 h-9" />
                    <ChessPiece type="q" color="b" theme={settings.blackPieceTheme || settings.pieceTheme} className="w-9 h-9" />
                    <ChessPiece type="b" color="b" theme={settings.blackPieceTheme || settings.pieceTheme} className="w-9 h-9" />
                    <ChessPiece type="n" color="b" theme={settings.blackPieceTheme || settings.pieceTheme} className="w-9 h-9" />
                  </div>

                  <div className="space-y-1.5">
                    {factionOptions.map(f => {
                      const isSelected = (settings.blackPieceTheme || settings.pieceTheme) === f.id;
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => handleCrossoverChange('black', f.id)}
                          className={`w-full min-h-[44px] px-3 py-2 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer border ${
                            isSelected
                              ? 'bg-[#8C2425] text-white border-[#F5C453]'
                              : 'bg-white/5 hover:bg-white/10 text-[#DFD0B0]/80 border-white/5'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span>{f.icon}</span>
                            <span>{f.name}</span>
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-amber-300" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BOARD STYLES */}
          {activeTab === 'boards' && (
            <div className="space-y-3">
              <p className="text-xs text-[var(--text-muted)]">
                Choose the background surface and textures for the 64-square battlefield:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {boardOptions.map(b => {
                  const isSelected = settings.boardTheme === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => {
                        onUpdateSettings({ boardTheme: b.id });
                        showSuccessFeedback(`Applied ${b.name} board!`);
                      }}
                      className={`min-h-[50px] p-3 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-white/10 border-[var(--secondary-accent)] shadow-lg ring-1 ring-[var(--secondary-accent)]/40'
                          : 'bg-white/[0.03] hover:bg-white/[0.07] border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/20 grid grid-cols-2 grid-rows-2 shrink-0">
                          <div style={{ backgroundColor: b.lightBg }} />
                          <div style={{ backgroundColor: b.darkBg }} />
                          <div style={{ backgroundColor: b.darkBg }} />
                          <div style={{ backgroundColor: b.lightBg }} />
                        </div>
                        <span className="text-xs font-bold text-white">{b.name}</span>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-[var(--secondary-accent)] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[var(--app-bg)]/60 border-t border-[var(--glass-border)] flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
};
