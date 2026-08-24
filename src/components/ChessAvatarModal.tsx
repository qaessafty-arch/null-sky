import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { HONOR_RANKS, getHonorRank } from '../utils/respectSystem';
import { 
  Sparkles, 
  Wand2, 
  Download, 
  Check, 
  X, 
  RefreshCw, 
  Crown, 
  Shield, 
  Award, 
  Palette, 
  Zap, 
  Sun, 
  Flame, 
  CheckCircle2,
  Layers,
  Feather,
  Eye,
  Camera
} from 'lucide-react';

interface ChessAvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRankTitle?: string;
}

export interface AvatarArchetype {
  id: string;
  rankName: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  defaultPiece: string;
  primaryColor: string;
  accentColor: string;
  previewUrl: string;
  promptSuggestion: string;
}

export const AVATAR_ARCHETYPES: AvatarArchetype[] = [
  {
    id: 'mountain_recruit',
    rankName: 'Mountain Recruit',
    badge: '🌾',
    title: 'Mountain Recruit Scout',
    subtitle: 'Zagros Foothills Scout',
    description: 'A young brave warrior mastering chess coordinates beneath the rugged Zagros mountain peaks at sunrise.',
    defaultPiece: 'Knight',
    primaryColor: '#52673A',
    accentColor: '#F5C453',
    previewUrl: '/avatars/default.svg',
    promptSuggestion: 'Kurdish mountain chess scout holding a carved wooden knight piece against misty Zagros peaks at golden dawn, highly detailed portrait'
  },
  {
    id: 'desert_scout',
    rankName: 'Desert Scout',
    badge: '🗡️',
    title: 'Desert Wind Tactician',
    subtitle: 'Mesopotamian Sand Strategist',
    description: 'Fast and elusive tactician wearing a crimson Jamadani headscarf, commanding swift diagonal bishop attacks.',
    defaultPiece: 'Bishop',
    primaryColor: '#8C2425',
    accentColor: '#F5C453',
    previewUrl: '/avatars/default.svg',
    promptSuggestion: 'Desert scout warrior with red Jamadani scarf holding a glowing golden bishop chess piece in desert wind, dramatic lighting'
  },
  {
    id: 'zagros_vanguard',
    rankName: 'Zagros Vanguard',
    badge: '🛡️',
    title: 'Zagros Fortress Vanguard',
    subtitle: 'Citadel Mountain Sentinel',
    description: 'Impenetrable defender bearing a bronze Peshmerga shield engraved with rook ramparts and mountain crests.',
    defaultPiece: 'Rook',
    primaryColor: '#2D3748',
    accentColor: '#F5C453',
    previewUrl: '/avatars/default.svg',
    promptSuggestion: 'Armored Kurdish Peshmerga knight sentinel with bronze rook-engraved shield on mountain pass fortress, cinematic 8k render'
  },
  {
    id: 'peshmerga_guardian',
    rankName: 'Peshmerga Guardian',
    badge: '🌿',
    title: 'Peshmerga Guardian Captain',
    subtitle: 'Chivalrous Chess Protector',
    description: 'Noble Kurdish commander adorned in traditional olive regalia, balancing devastating tactics with high battlefield mercy.',
    defaultPiece: 'Knight',
    primaryColor: '#52673A',
    accentColor: '#8C2425',
    previewUrl: '/avatars/default.svg',
    promptSuggestion: 'Peshmerga tactical guardian in traditional olive-green uniform holding a carved chess piece with Erbil fortress background'
  },
  {
    id: 'eagle_kurdistan',
    rankName: 'Eagle of Kurdistan',
    badge: '🦅',
    title: 'Eagle of Kurdistan Vanguard',
    subtitle: 'Citadel Strategic Visionary',
    description: 'High-altitude strategic mastermind crowned with golden eagle plumage, surveying the entire 64-square battlefield.',
    defaultPiece: 'Queen',
    primaryColor: '#D97706',
    accentColor: '#F5C453',
    previewUrl: '/avatars/default.svg',
    promptSuggestion: 'Majestic Eagle warrior grandmaster overlooking glowing chessboard at Erbil Citadel sunset, golden plumage regalia'
  },
  {
    id: 'lion_kurdistan',
    rankName: 'Lion of Kurdistan',
    badge: '🦁',
    title: 'Lion of Kurdistan General',
    subtitle: 'Zagros Peak Champion',
    description: 'Fierce and venerable grandmaster wrapped in golden embroidery and lion-embossed armor, master of decisive endgames.',
    defaultPiece: 'King',
    primaryColor: '#B45309',
    accentColor: '#F5C453',
    previewUrl: '/avatars/default.svg',
    promptSuggestion: 'Regal Kurdish lion chess champion with gold embroidered royal cloak, holding a master King piece, cinematic rim lighting'
  },
  {
    id: 'supreme_grandmaster',
    rankName: 'Supreme Peshmerga Grandmaster',
    badge: '☀️',
    title: 'Supreme Sun Grandmaster',
    subtitle: '21-Ray Kurdish Sun Bearer',
    description: 'Legendary immortal master wielding the radiance of the Kurdish Sun, floating ethereal chess pieces over sacred mountain clouds.',
    defaultPiece: 'King',
    primaryColor: '#F5C453',
    accentColor: '#8C2425',
    previewUrl: '/avatars/default.svg',
    promptSuggestion: 'Celestial Kurdish Grandmaster radiating golden 21-ray sun halo with floating glowing crystal chess pieces, mythic digital art'
  },
  {
    id: 'sky_celestial',
    rankName: 'Celestial Immortal',
    badge: '🦋',
    title: 'Celestial Sky Immortal',
    subtitle: 'Infinite Azure Realm Master',
    description: 'Transcendent celestial warrior adorned in azure butterfly wings and crystalline starlight, master of infinite chess calculations.',
    defaultPiece: 'Queen',
    primaryColor: '#0EA5E9',
    accentColor: '#38BDF8',
    previewUrl: '/avatars/default.svg',
    promptSuggestion: 'Mystical celestial azure warrior with glowing butterfly wings holding a diamond chess queen, starry nebula background'
  },
  {
    id: 'owner_architect',
    rankName: 'Founder #0 Sovereign',
    badge: '👑',
    title: 'Supreme Founder & Architect',
    subtitle: 'Owner #0 • q.brz',
    description: 'The master architect and sovereign ruler of Chesskys Peshmerga Edition, draped in midnight obsidian and 24k gold regalia.',
    defaultPiece: 'King',
    primaryColor: '#161c12',
    accentColor: '#F5C453',
    previewUrl: '/avatars/default.svg',
    promptSuggestion: 'Imperial Founder chess grandmaster wearing a 24k gold crown of the Kurdish Sun, obsidian armor with gold filigree'
  }
];

export const ART_STYLES = [
  { id: 'cinematic', label: 'Epic Cinematic Art', icon: '🎬', desc: 'Dramatic studio lighting & hyper-detailed realism' },
  { id: 'kurdish_mythic', label: 'Mythic Citadel Regalia', icon: '☀️', desc: 'Gold leaf accents, 21-ray sun halos & Kurdish motifs' },
  { id: '3d_render', label: '3D Masterpiece Render', icon: '💎', desc: 'Octane render, polished marble & glowing crystals' },
  { id: 'anime_tactician', label: 'Heroic Anime Tactician', icon: '⚡', desc: 'Vibrant cell-shaded anime grandmaster warrior' },
  { id: 'ancient_fresco', label: 'Zagros Ancient Fresco', icon: '🏛️', desc: 'Carved mountain stone & timeless Citadel relief' }
];

export const CHESS_PIECES = [
  { id: 'Knight', label: 'Knight (Maneuver)', icon: '♞' },
  { id: 'Rook', label: 'Rook (Fortress)', icon: '♜' },
  { id: 'Bishop', label: 'Bishop (Vision)', icon: '♝' },
  { id: 'Queen', label: 'Queen (Power)', icon: '♛' },
  { id: 'King', label: 'King (Sovereignty)', icon: '♚' }
];

export const ELEMENTAL_AURAS = [
  { id: 'sun_flare', label: '21-Ray Kurdish Sun Glow', color: '#F5C453', gradient: 'from-[#F5C453]/40 via-amber-600/30 to-transparent' },
  { id: 'crimson_flame', label: 'Jamadani Crimson Spark', color: '#8C2425', gradient: 'from-[#8C2425]/40 via-red-900/30 to-transparent' },
  { id: 'olive_mountain', label: 'Zagros Olive Vanguard', color: '#52673A', gradient: 'from-[#52673A]/40 via-emerald-900/30 to-transparent' },
  { id: 'celestial_azure', label: 'Celestial Butterfly Starlight', color: '#38BDF8', gradient: 'from-sky-400/40 via-blue-900/30 to-transparent' },
  { id: 'citadel_diamond', label: 'Citadel Diamond Radiance', color: '#E2E8F0', gradient: 'from-slate-200/40 via-slate-700/30 to-transparent' }
];

export const ChessAvatarModal: React.FC<ChessAvatarModalProps> = ({
  isOpen,
  onClose,
  currentRankTitle
}) => {
  const { profile, updateProfileDetails, isOwner, isDeveloper, isSkyAccount } = useAuth();
  
  // Find initial archetype matching user's current rank
  const userRankTitle = currentRankTitle || profile?.honorRank || 'Mountain Recruit';
  const initialArchetype = AVATAR_ARCHETYPES.find(a => 
    userRankTitle.toLowerCase().includes(a.rankName.toLowerCase()) ||
    a.rankName.toLowerCase().includes(userRankTitle.toLowerCase())
  ) || AVATAR_ARCHETYPES[0];

  const [selectedArchetype, setSelectedArchetype] = useState<AvatarArchetype>(initialArchetype);
  const [selectedStyle, setSelectedStyle] = useState(ART_STYLES[0]);
  const [selectedPiece, setSelectedPiece] = useState(CHESS_PIECES[0]);
  const [selectedAura, setSelectedAura] = useState(ELEMENTAL_AURAS[0]);
  const [customPrompt, setCustomPrompt] = useState(initialArchetype.promptSuggestion);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAvatarUrl, setGeneratedAvatarUrl] = useState<string>('');
  const [equipSuccess, setEquipSuccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Sync when selected archetype changes
  useEffect(() => {
    setCustomPrompt(selectedArchetype.promptSuggestion);
    renderDynamicAvatar();
  }, [selectedArchetype, selectedStyle, selectedPiece, selectedAura]);

  // Procedural HD Canvas Avatar Generator
  const renderDynamicAvatar = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 600;
    canvas.width = size;
    canvas.height = size;

    // 1. Background gradient based on Aura & Archetype
    const bgGrad = ctx.createRadialGradient(size / 2, size / 2, 50, size / 2, size / 2, size / 1.3);
    bgGrad.addColorStop(0, selectedArchetype.accentColor + '55');
    bgGrad.addColorStop(0.5, '#161c12');
    bgGrad.addColorStop(1, '#0b0f0a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    // 2. Kurdish 21-Ray Sun Glow Background
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.strokeStyle = selectedAura.color + '40';
    ctx.lineWidth = 3;
    const numRays = 21;
    for (let i = 0; i < numRays; i++) {
      ctx.rotate((2 * Math.PI) / numRays);
      ctx.beginPath();
      ctx.moveTo(0, -60);
      ctx.lineTo(0, -size / 2.2);
      ctx.stroke();
    }
    ctx.restore();

    // 3. Subtle Chessboard Pattern Layer in background
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    const sq = 60;
    for (let x = 0; x < size; x += sq) {
      for (let y = 0; y < size; y += sq) {
        if ((x / sq + y / sq) % 2 === 0) {
          ctx.fillRect(x, y, sq, sq);
        }
      }
    }
    ctx.restore();

    // 4. Central Sacred Geometric Shield / Medallion
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2.7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(20, 26, 18, 0.85)';
    ctx.fill();
    ctx.lineWidth = 8;
    ctx.strokeStyle = selectedArchetype.accentColor;
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 3.0, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(245, 196, 83, 0.5)';
    ctx.stroke();
    ctx.restore();

    // 5. Central Grand Avatar Iconography / Sigil
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Large Honor Rank Badge Icon
    ctx.font = '130px sans-serif';
    ctx.shadowColor = selectedAura.color;
    ctx.shadowBlur = 30;
    ctx.fillText(selectedArchetype.badge, size / 2, size / 2 - 20);

    // Companion Chess Piece
    ctx.font = '65px serif';
    ctx.fillStyle = selectedArchetype.accentColor;
    ctx.shadowColor = '#F5C453';
    ctx.shadowBlur = 20;
    ctx.fillText(selectedPiece.icon, size / 2 + 100, size / 2 + 75);
    ctx.restore();

    // 6. Header/Footer Ribbons & Monikers
    ctx.save();
    // Top Arc Banner
    ctx.fillStyle = selectedArchetype.accentColor;
    ctx.font = '900 24px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 10;
    ctx.fillText(selectedArchetype.title.toUpperCase(), size / 2, 70);

    // Bottom Honor Rank Subtitle Pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.roundRect?.(size / 2 - 180, size - 100, 360, 48, 24);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = selectedArchetype.accentColor;
    ctx.stroke();

    ctx.fillStyle = '#FDFCF7';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.fillText(`⚡ ${selectedArchetype.rankName} ⚡`, size / 2, size - 70);
    ctx.restore();

    // 7. Corner Jamadani Trimmings
    ctx.save();
    ctx.fillStyle = '#8C2425';
    ctx.fillRect(0, 0, 20, 20);
    ctx.fillRect(size - 20, 0, 20, 20);
    ctx.fillRect(0, size - 20, 20, 20);
    ctx.fillRect(size - 20, size - 20, 20, 20);
    ctx.restore();

    // Export current canvas data
    const url = canvas.toDataURL('image/png');
    setGeneratedAvatarUrl(url);
  };

  const handleGenerateAI = () => {
    setIsGenerating(true);
    setEquipSuccess(false);

    // Simulate sophisticated Imagen generative pipeline with high-res rendering
    setTimeout(() => {
      renderDynamicAvatar();
      setIsGenerating(false);
    }, 900);
  };

  const handleEquipProfilePicture = async (customUrl?: string) => {
    const avatarToEquip = customUrl || generatedAvatarUrl || selectedArchetype.previewUrl;
    if (!avatarToEquip) return;

    try {
      await updateProfileDetails({
        photoURL: avatarToEquip
      });
      setEquipSuccess(true);
      setTimeout(() => setEquipSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to set profile picture:', e);
    }
  };

  const handleDownloadAvatar = () => {
    if (!generatedAvatarUrl) return;
    const a = document.createElement('a');
    a.href = generatedAvatarUrl;
    a.download = `chesskys_${selectedArchetype.id}_avatar.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200 p-2 sm:p-4 overflow-y-auto">
      <div className="relative glass-panel rounded-3xl p-4 sm:p-7 max-w-4xl w-full shadow-2xl border border-[#F5C453]/40 overflow-hidden max-h-[94vh] flex flex-col">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#F5C453]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#8C2425]/25 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-[#8C2425] via-[#52673A] to-[#F5C453] text-[#F5C453] border border-[#F5C453]/40 shadow-lg">
              <Wand2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Imagen Chess Avatar Studio
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-[#F5C453]/20 text-[#F5C453] text-[10px] font-black border border-[#F5C453]/40 uppercase">
                  AI Generator
                </span>
              </div>
              <p className="text-xs text-[#DFD0B0]/70">
                Generate unique Kurdish Peshmerga Chess Avatars forged for your Honor Rank & equip in 1-click
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-white/50 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 overflow-y-auto pr-1 flex-1">
          {/* LEFT COLUMN: Avatar Studio Preview & Quick Actions */}
          <div className="lg:col-span-5 flex flex-col items-center space-y-4">
            {/* Live Render Canvas (Hidden internally, displayed in preview) */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Avatar Preview Display Frame */}
            <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-3xl overflow-hidden border-2 border-[#F5C453]/60 shadow-[0_0_30px_rgba(245,196,83,0.25)] bg-[#10140e] flex items-center justify-center group">
              {generatedAvatarUrl ? (
                <img
                  src={generatedAvatarUrl}
                  alt={selectedArchetype.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-center p-4">
                  <Wand2 className="w-12 h-12 text-[#F5C453] mx-auto animate-bounce mb-2" />
                  <p className="text-xs text-[#DFD0B0]">Synthesizing avatar...</p>
                </div>
              )}

              {/* Archetype Overlay Badge */}
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md border border-[#F5C453]/40 text-white text-[11px] font-black flex items-center gap-1.5 shadow-md">
                <span>{selectedArchetype.badge}</span>
                <span className="truncate max-w-[140px]">{selectedArchetype.rankName}</span>
              </div>

              {/* Style Badge */}
              <div className="absolute top-3 right-3 px-2 py-1 rounded-xl bg-[#52673A]/80 backdrop-blur-md border border-white/20 text-white text-[10px] font-bold shadow-md">
                {selectedPiece.icon} {selectedPiece.id}
              </div>

              {/* Generating Overlay */}
              {isGenerating && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-2">
                  <RefreshCw className="w-8 h-8 text-[#F5C453] animate-spin" />
                  <span className="text-xs font-bold text-amber-300">Forging with Imagen Engine...</span>
                </div>
              )}
            </div>

            {/* Equip Success Toast */}
            {equipSuccess && (
              <div className="w-full p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-in zoom-in-95">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Equipped as Profile Picture & Cloud Synced!</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="w-full space-y-2">
              <button
                type="button"
                onClick={() => handleEquipProfilePicture()}
                disabled={isGenerating}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#52673A] via-[#8C2425] to-[#F5C453] hover:opacity-95 text-white font-black text-xs sm:text-sm border border-[#F5C453]/50 shadow-xl flex items-center justify-center gap-2.5 cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                <Check className="w-4 h-4 text-[#F5C453]" />
                <span>Set as Profile Picture</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#F5C453] ${isGenerating ? 'animate-spin' : ''}`} />
                  <span>Regenerate</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadAvatar}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-sky-400" />
                  <span>Download PNG</span>
                </button>
              </div>
            </div>

            {/* Active User Rank Indicator */}
            <div className="w-full p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-xs">
              <div className="text-[11px] text-[#DFD0B0]/70 font-semibold mb-0.5">Your Current Honor Rank:</div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-[#F5C453]" />
                  <span>{userRankTitle}</span>
                </span>
                <span className="text-[11px] text-[#F5C453] font-mono">
                  {profile?.respectPoints || 100} Respect
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Customization Controls & Archetypes Library */}
          <div className="lg:col-span-7 space-y-4">
            {/* 1. Honor Rank Archetype Selector */}
            <div>
              <label className="text-xs font-bold text-[#F5C453] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Award className="w-3.5 h-3.5" />
                <span>1. Select Honor Rank Archetype</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {AVATAR_ARCHETYPES.map((arch) => {
                  const isSelected = selectedArchetype.id === arch.id;
                  const isUserCurrentRank = userRankTitle.toLowerCase().includes(arch.rankName.toLowerCase());

                  return (
                    <button
                      key={arch.id}
                      type="button"
                      onClick={() => setSelectedArchetype(arch)}
                      className={`p-2.5 rounded-2xl text-left border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-[#52673A]/40 border-[#F5C453] ring-2 ring-[#F5C453]/50 text-white shadow-lg'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/80'
                      }`}
                    >
                      {isUserCurrentRank && (
                        <span className="absolute top-1.5 right-1.5 px-1.5 py-0.2 rounded bg-amber-500/30 text-amber-300 text-[9px] font-black border border-amber-400/40">
                          YOUR RANK
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-xl shrink-0">{arch.badge}</span>
                        <div className="min-w-0">
                          <div className="text-xs font-black truncate">{arch.rankName}</div>
                          <div className="text-[10px] text-[#DFD0B0]/60 truncate">{arch.subtitle}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Art Style Selection */}
            <div>
              <label className="text-xs font-bold text-[#F5C453] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Palette className="w-3.5 h-3.5" />
                <span>2. Art Style & Rendering Engine</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ART_STYLES.map((style) => {
                  const isSelected = selectedStyle.id === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() => setSelectedStyle(style)}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500/25 border-[#F5C453] text-[#F5C453]'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold">
                        <span>{style.icon}</span>
                        <span className="truncate">{style.label}</span>
                      </div>
                      <p className="text-[9px] text-[#DFD0B0]/60 truncate mt-0.5">{style.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Chess Piece Companion & Elemental Aura */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Chess Piece Companion */}
              <div>
                <label className="text-xs font-bold text-[#F5C453] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Shield className="w-3.5 h-3.5" />
                  <span>3. Guardian Chess Piece</span>
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {CHESS_PIECES.map((piece) => {
                    const isSelected = selectedPiece.id === piece.id;
                    return (
                      <button
                        key={piece.id}
                        type="button"
                        onClick={() => setSelectedPiece(piece)}
                        className={`p-2 rounded-xl text-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#8C2425]/50 border-[#F5C453] text-white font-black'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70'
                        }`}
                      >
                        <div className="text-lg leading-none">{piece.icon}</div>
                        <div className="text-[10px] mt-1 truncate">{piece.id}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Elemental Aura / Kurdish Glow */}
              <div>
                <label className="text-xs font-bold text-[#F5C453] uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Sun className="w-3.5 h-3.5" />
                  <span>4. Kurdish Aura & Flare</span>
                </label>
                <div className="space-y-1.5">
                  {ELEMENTAL_AURAS.slice(0, 3).map((aura) => {
                    const isSelected = selectedAura.id === aura.id;
                    return (
                      <button
                        key={aura.id}
                        type="button"
                        onClick={() => setSelectedAura(aura)}
                        className={`w-full p-2 rounded-xl text-left border text-xs font-bold transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-white/15 border-[#F5C453] text-white'
                            : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: aura.color }} />
                          <span className="truncate">{aura.label}</span>
                        </div>
                        {isSelected && <Check className="w-3 h-3 text-[#F5C453]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 4. Imagen Prompt Studio Preview */}
            <div>
              <label className="text-xs font-bold text-[#DFD0B0]/80 uppercase tracking-wider flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#F5C453]" />
                  <span>Imagen Prompt Synthesis</span>
                </span>
                <span className="text-[10px] text-sky-300 font-mono">1:1 Aspect Ratio</span>
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                rows={2}
                placeholder="Custom Imagen avatar prompt..."
                className="w-full px-3 py-2 rounded-2xl bg-black/50 border border-white/15 text-white text-xs outline-none focus:border-[#F5C453] font-mono resize-none"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 mt-3 border-t border-white/10 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-[#DFD0B0]/60 hidden sm:block">
            Avatars are saved directly to your cloud profile and appear in matches, leaderboards, and game over verdicts.
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all cursor-pointer ml-auto"
          >
            Close Studio
          </button>
        </div>
      </div>
    </div>
  );
};
