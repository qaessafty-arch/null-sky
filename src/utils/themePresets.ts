import { UITheme } from '../types/theme';

export const PRESET_THEMES: UITheme[] = [
  {
    id: 'one-piece',
    name: '🏴‍☠️ One Piece (Straw Hats vs World Government)',
    description: 'Thousand Sunny Wood (#d4a359), Deep Ocean Navy (#0b1d3a), and Purple Conquerors Haki lightning (#a855f7)',
    category: 'vibrant',
    colors: {
      primary: '#0b1d3a', // Deep Ocean Navy
      primaryHover: '#1e3a8a',
      secondary: '#ef4444', // Red Flame / Gear 5
      accentGlow: 'rgba(168, 85, 247, 0.40)', // Purple Haki glow
      appBg: '#050c18', // Deepest Navy
      mesh1: 'rgba(168, 85, 247, 0.22)', // Haki ambient
      mesh2: 'rgba(239, 68, 68, 0.18)', // Flame ambient
      mesh3: 'rgba(212, 163, 89, 0.15)', // Wood ambient
      cardBg: 'rgba(212, 163, 89, 0.05)',
      cardBorder: 'rgba(168, 85, 247, 0.28)',
      cardHoverBg: 'rgba(212, 163, 89, 0.12)',
      cardHoverBorder: 'rgba(168, 85, 247, 0.55)',
      panelBg: 'rgba(5, 12, 24, 0.92)',
      textMain: '#FDFCF7',
      textMuted: 'rgba(212, 163, 89, 0.70)',
      boardLight: '#d4a359',
      boardDark: '#0b1d3a',
      boardBorder: '#a855f7'
    },
    backgroundImage: 'https://images3.alphacoders.com/217/217311.jpg'
  },
  {
    id: 'aot',
    name: '⚔️ Attack on Titan (Wall Maria & Titans)',
    description: 'Survey Corps Green (#5d6f54), Weathered Wall Maria Dark Stone (#1f232b), ODM Gas Emerald Glow (#22c55e), and Colossal Steam Crimson (#ef4444)',
    category: 'vibrant',
    colors: {
      primary: '#5d6f54', // Survey Corps Green
      primaryHover: '#4b5b44',
      secondary: '#ef4444', // Titan Steam Crimson
      accentGlow: 'rgba(34, 197, 94, 0.40)', // ODM Gas Glow
      appBg: '#0d0f14', // Wall Maria Night
      mesh1: 'rgba(93, 111, 84, 0.32)', // Survey Corps ambient
      mesh2: 'rgba(239, 68, 68, 0.22)', // Colossal steam ambient
      mesh3: 'rgba(34, 197, 94, 0.18)', // ODM gas ambient
      cardBg: 'rgba(93, 111, 84, 0.08)',
      cardBorder: 'rgba(74, 222, 128, 0.28)',
      cardHoverBg: 'rgba(93, 111, 84, 0.18)',
      cardHoverBorder: 'rgba(74, 222, 128, 0.55)',
      panelBg: 'rgba(15, 18, 24, 0.92)',
      textMain: '#F8FAFC',
      textMuted: 'rgba(226, 232, 240, 0.72)',
      boardLight: '#5d6f54', // Survey Corps Green
      boardDark: '#1f232b',  // Weathered Dark Stone
      boardBorder: '#3f4a38' // Wall Iron Rim
    }
  },
  {
    id: 'peshmerga',
    name: '☀️ Peshmerga Royal (Kurdish)',
    description: 'Authentic Kurdish military attire with Tactical Olive (#435433), Sandstone Khaki (#DFD0B0), Jamadani Crimson (#8C2425), and 21-ray Sun Gold (#F5C453)',
    category: 'luxury',
    colors: {
      primary: '#52673A', // Tactical Olive Green
      primaryHover: '#435433',
      secondary: '#F5C453', // Kurdish Sun Gold
      accentGlow: 'rgba(245, 196, 83, 0.40)',
      appBg: '#05070a', // Pure Obsidian
      mesh1: 'rgba(74, 18, 18, 0.35)', // Subdued Deep Red
      mesh2: 'rgba(35, 45, 27, 0.28)', // Subdued Tactical Green
      mesh3: 'rgba(74, 59, 25, 0.20)', // Subdued Gold
      cardBg: 'rgba(223, 208, 176, 0.05)',
      cardBorder: 'rgba(245, 196, 83, 0.24)',
      cardHoverBg: 'rgba(82, 103, 58, 0.14)',
      cardHoverBorder: 'rgba(245, 196, 83, 0.48)',
      panelBg: 'rgba(11, 15, 25, 0.85)',
      textMain: '#FDFCF7',
      textMuted: 'rgba(223, 208, 176, 0.70)',
      boardLight: '#DFD0B0', // Sandstone Khaki
      boardDark: '#435433',  // Tactical Olive Green
      boardBorder: '#8C2425' // Jamadani Crimson Red
    }
  },
  {
    id: 'ukh',
    name: '🎓 UKH Chancellor (University of Kurdistan Hewlêr)',
    description: 'Prestigious UKH academic identity: Chancellor Navy Blue (#1A3B5C), Academic Gold (#E5A93B), and Parchment White (#E8EEF5)',
    category: 'luxury',
    colors: {
      primary: '#1A3B5C', // UKH Navy Blue
      primaryHover: '#132C47',
      secondary: '#E5A93B', // UKH Academic Gold
      accentGlow: 'rgba(229, 169, 59, 0.38)',
      appBg: '#0B1726', // UKH Deep Night Navy
      mesh1: 'rgba(26, 59, 92, 0.35)', // Navy ambient
      mesh2: 'rgba(229, 169, 59, 0.25)', // Gold ambient
      mesh3: 'rgba(14, 33, 54, 0.30)',
      cardBg: 'rgba(232, 238, 245, 0.06)',
      cardBorder: 'rgba(229, 169, 59, 0.30)',
      cardHoverBg: 'rgba(26, 59, 92, 0.20)',
      cardHoverBorder: 'rgba(229, 169, 59, 0.55)',
      panelBg: 'rgba(11, 23, 38, 0.90)',
      textMain: '#F8FAFC',
      textMuted: 'rgba(232, 238, 245, 0.75)',
      boardLight: '#E8EEF5', // UKH Parchment White
      boardDark: '#1A3B5C',  // UKH Navy Blue
      boardBorder: '#D4AF37' // UKH Gold Border
    }
  },
  {
    id: 'midnight-cyber',
    name: 'Midnight Cyber',
    description: 'Electric azure & violet accents over a deep obsidian frosted canvas',
    category: 'vibrant',
    colors: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      secondary: '#a855f7',
      accentGlow: 'rgba(59, 130, 246, 0.35)',
      appBg: '#0a0a0c',
      mesh1: 'rgba(59, 130, 246, 0.22)',
      mesh2: 'rgba(139, 92, 246, 0.20)',
      mesh3: 'rgba(236, 72, 153, 0.15)',
      cardBg: 'rgba(255, 255, 255, 0.06)',
      cardBorder: 'rgba(255, 255, 255, 0.12)',
      cardHoverBg: 'rgba(255, 255, 255, 0.10)',
      cardHoverBorder: 'rgba(96, 165, 250, 0.35)',
      panelBg: 'rgba(15, 18, 28, 0.75)',
      textMain: '#f8fafc',
      textMuted: 'rgba(255, 255, 255, 0.6)',
      boardLight: '#eeeed2',
      boardDark: '#769656',
      boardBorder: '#4a6333'
    }
  },
  {
    id: 'emerald-grandmaster',
    name: 'Emerald Grandmaster',
    description: 'Classic tournament jade & luminous lime with deep forest dark glass',
    category: 'nature',
    colors: {
      primary: '#10b981',
      primaryHover: '#059669',
      secondary: '#84cc16',
      accentGlow: 'rgba(16, 185, 129, 0.35)',
      appBg: '#06140e',
      mesh1: 'rgba(16, 185, 129, 0.22)',
      mesh2: 'rgba(132, 204, 22, 0.18)',
      mesh3: 'rgba(20, 184, 166, 0.14)',
      cardBg: 'rgba(16, 185, 129, 0.05)',
      cardBorder: 'rgba(52, 211, 153, 0.16)',
      cardHoverBg: 'rgba(16, 185, 129, 0.10)',
      cardHoverBorder: 'rgba(52, 211, 153, 0.38)',
      panelBg: 'rgba(10, 26, 18, 0.8)',
      textMain: '#ecfdf5',
      textMuted: 'rgba(209, 250, 229, 0.65)',
      boardLight: '#eeeed2',
      boardDark: '#769656',
      boardBorder: '#365314'
    }
  },
  {
    id: 'obsidian-amber',
    name: 'Obsidian & Gold',
    description: 'Opulent warm gold & radiant amber over a luxury charcoal velvet backdrop',
    category: 'luxury',
    colors: {
      primary: '#f59e0b',
      primaryHover: '#d97706',
      secondary: '#fbbf24',
      accentGlow: 'rgba(245, 158, 11, 0.35)',
      appBg: '#09090b', // Deep Obsidian
      mesh1: 'rgba(31, 18, 6, 0.20)', // Subtle Amber Glow
      mesh2: 'rgba(15, 23, 42, 0.16)', // Slate Depth
      mesh3: 'rgba(2, 6, 23, 0.12)', // Deepest Black
      cardBg: 'rgba(255, 245, 230, 0.05)',
      cardBorder: 'rgba(245, 158, 11, 0.18)',
      cardHoverBg: 'rgba(245, 158, 11, 0.09)',
      cardHoverBorder: 'rgba(251, 191, 36, 0.40)',
      panelBg: 'rgba(9, 9, 11, 0.9)',
      textMain: '#fffbeb',
      textMuted: 'rgba(254, 243, 199, 0.65)',
      boardLight: '#fef3c7',
      boardDark: '#b45309',
      boardBorder: '#78350f'
    }
  },
  {
    id: 'royal-amethyst',
    name: 'Royal Amethyst',
    description: 'Cosmic purple, luminous magenta, and twilight mystic dark glass',
    category: 'vibrant',
    colors: {
      primary: '#a855f7',
      primaryHover: '#9333ea',
      secondary: '#ec4899',
      accentGlow: 'rgba(168, 85, 247, 0.35)',
      appBg: '#0e0b1a',
      mesh1: 'rgba(168, 85, 247, 0.22)',
      mesh2: 'rgba(236, 72, 153, 0.18)',
      mesh3: 'rgba(126, 34, 206, 0.18)',
      cardBg: 'rgba(168, 85, 247, 0.06)',
      cardBorder: 'rgba(192, 132, 252, 0.18)',
      cardHoverBg: 'rgba(168, 85, 247, 0.12)',
      cardHoverBorder: 'rgba(236, 72, 153, 0.4)',
      panelBg: 'rgba(20, 14, 38, 0.8)',
      textMain: '#faf5ff',
      textMuted: 'rgba(243, 232, 255, 0.65)',
      boardLight: '#f3e8ff',
      boardDark: '#7e22ce',
      boardBorder: '#581c87'
    }
  },
  {
    id: 'sunset-crimson',
    name: 'Sunset Crimson',
    description: 'Vibrant sunset coral, ruby glow, and blazing tangerine gradients',
    category: 'vibrant',
    colors: {
      primary: '#f43f5e',
      primaryHover: '#e11d48',
      secondary: '#f97316',
      accentGlow: 'rgba(244, 63, 94, 0.35)',
      appBg: '#150a0f',
      mesh1: 'rgba(244, 63, 94, 0.22)',
      mesh2: 'rgba(249, 115, 22, 0.18)',
      mesh3: 'rgba(225, 29, 72, 0.15)',
      cardBg: 'rgba(255, 255, 255, 0.05)',
      cardBorder: 'rgba(244, 63, 94, 0.18)',
      cardHoverBg: 'rgba(244, 63, 94, 0.10)',
      cardHoverBorder: 'rgba(244, 63, 94, 0.40)',
      panelBg: 'rgba(28, 12, 18, 0.82)',
      textMain: '#fff1f2',
      textMuted: 'rgba(255, 228, 230, 0.65)',
      boardLight: '#ffe4e6',
      boardDark: '#be123c',
      boardBorder: '#881337'
    }
  },
  {
    id: 'arctic-glacier',
    name: 'Arctic Glacier',
    description: 'Crisp electric cyan, glacial ice blues, and polar navy glass',
    category: 'nature',
    colors: {
      primary: '#06b6d4',
      primaryHover: '#0891b2',
      secondary: '#38bdf8',
      accentGlow: 'rgba(6, 182, 212, 0.35)',
      appBg: '#07121b',
      mesh1: 'rgba(6, 182, 212, 0.22)',
      mesh2: 'rgba(56, 189, 248, 0.18)',
      mesh3: 'rgba(14, 165, 233, 0.14)',
      cardBg: 'rgba(6, 182, 212, 0.05)',
      cardBorder: 'rgba(103, 232, 249, 0.16)',
      cardHoverBg: 'rgba(6, 182, 212, 0.10)',
      cardHoverBorder: 'rgba(56, 189, 248, 0.38)',
      panelBg: 'rgba(10, 24, 38, 0.8)',
      textMain: '#ecfeff',
      textMuted: 'rgba(207, 250, 254, 0.65)',
      boardLight: '#e0f2fe',
      boardDark: '#0369a1',
      boardBorder: '#075985'
    }
  },
  {
    id: 'cyberpunk-matrix',
    name: 'Cyberpunk Neon',
    description: 'High-contrast neon green, electric cyber yellow, and matrix dark space',
    category: 'vibrant',
    colors: {
      primary: '#22c55e',
      primaryHover: '#16a34a',
      secondary: '#eab308',
      accentGlow: 'rgba(34, 197, 94, 0.40)',
      appBg: '#050a07',
      mesh1: 'rgba(34, 197, 94, 0.25)',
      mesh2: 'rgba(234, 179, 8, 0.18)',
      mesh3: 'rgba(6, 182, 212, 0.14)',
      cardBg: 'rgba(34, 197, 94, 0.05)',
      cardBorder: 'rgba(34, 197, 94, 0.22)',
      cardHoverBg: 'rgba(34, 197, 94, 0.12)',
      cardHoverBorder: 'rgba(234, 179, 8, 0.45)',
      panelBg: 'rgba(8, 18, 12, 0.85)',
      textMain: '#f0fdf4',
      textMuted: 'rgba(220, 252, 231, 0.65)',
      boardLight: '#dcfce7',
      boardDark: '#15803d',
      boardBorder: '#14532d'
    }
  },
  {
    id: 'monochrome-slate',
    name: 'Monochrome Slate',
    description: 'Minimalist frosted graphite, cool ice silver, and pure dark matte elegance',
    category: 'dark',
    colors: {
      primary: '#e2e8f0',
      primaryHover: '#cbd5e1',
      secondary: '#94a3b8',
      accentGlow: 'rgba(226, 232, 240, 0.25)',
      appBg: '#09090b',
      mesh1: 'rgba(255, 255, 255, 0.08)',
      mesh2: 'rgba(148, 163, 184, 0.10)',
      mesh3: 'rgba(71, 85, 105, 0.12)',
      cardBg: 'rgba(255, 255, 255, 0.04)',
      cardBorder: 'rgba(255, 255, 255, 0.14)',
      cardHoverBg: 'rgba(255, 255, 255, 0.08)',
      cardHoverBorder: 'rgba(255, 255, 255, 0.3)',
      panelBg: 'rgba(18, 18, 22, 0.85)',
      textMain: '#f8fafc',
      textMuted: 'rgba(255, 255, 255, 0.55)',
      boardLight: '#e2e8f0',
      boardDark: '#475569',
      boardBorder: '#1e293b'
    }
  },
  {
    id: 'midnight',
    name: '🌌 Midnight',
    description: 'Deep cosmic obsidian with glowing electric violet and cyber cyan neon accents',
    category: 'dark',
    colors: {
      primary: '#6C63FF',
      primaryHover: '#584ee8',
      secondary: '#00E676',
      accentGlow: 'rgba(108, 99, 255, 0.40)',
      appBg: '#090a16',
      mesh1: 'rgba(108, 99, 255, 0.25)',
      mesh2: 'rgba(0, 230, 118, 0.18)',
      mesh3: 'rgba(78, 205, 196, 0.16)',
      cardBg: 'rgba(255, 255, 255, 0.05)',
      cardBorder: 'rgba(108, 99, 255, 0.22)',
      cardHoverBg: 'rgba(108, 99, 255, 0.12)',
      cardHoverBorder: 'rgba(108, 99, 255, 0.50)',
      panelBg: 'rgba(10, 12, 26, 0.88)',
      textMain: '#f8fafc',
      textMuted: 'rgba(248, 250, 252, 0.65)',
      boardLight: '#d1d5db',
      boardDark: '#1f2937',
      boardBorder: '#6C63FF'
    }
  },
  {
    id: 'aurora',
    name: '✨ Aurora Borealis',
    description: 'Ethereal northern lights with emerald ribbons, neon cyan waves, and deep astral glass',
    category: 'nature',
    colors: {
      primary: '#4ECDC4',
      primaryHover: '#3bb7ae',
      secondary: '#A78BFA',
      accentGlow: 'rgba(78, 205, 196, 0.45)',
      appBg: '#041118',
      mesh1: 'rgba(78, 205, 196, 0.28)',
      mesh2: 'rgba(167, 139, 250, 0.22)',
      mesh3: 'rgba(16, 185, 129, 0.20)',
      cardBg: 'rgba(78, 205, 196, 0.06)',
      cardBorder: 'rgba(78, 205, 196, 0.24)',
      cardHoverBg: 'rgba(78, 205, 196, 0.14)',
      cardHoverBorder: 'rgba(78, 205, 196, 0.55)',
      panelBg: 'rgba(5, 20, 28, 0.88)',
      textMain: '#f0fdfa',
      textMuted: 'rgba(204, 251, 241, 0.70)',
      boardLight: '#ccfbf1',
      boardDark: '#0f766e',
      boardBorder: '#14b8a6'
    }
  },
  {
    id: 'sunset',
    name: '🌅 Sunset Horizon',
    description: 'Warm dusk gradient with radiant coral, blazing ruby, and twilight gold highlights',
    category: 'vibrant',
    colors: {
      primary: '#FF6B6B',
      primaryHover: '#fa5252',
      secondary: '#FFD93D',
      accentGlow: 'rgba(255, 107, 107, 0.45)',
      appBg: '#180a0f',
      mesh1: 'rgba(255, 107, 107, 0.28)',
      mesh2: 'rgba(255, 217, 61, 0.22)',
      mesh3: 'rgba(244, 63, 94, 0.20)',
      cardBg: 'rgba(255, 107, 107, 0.06)',
      cardBorder: 'rgba(255, 107, 107, 0.25)',
      cardHoverBg: 'rgba(255, 107, 107, 0.14)',
      cardHoverBorder: 'rgba(255, 107, 107, 0.55)',
      panelBg: 'rgba(28, 10, 18, 0.88)',
      textMain: '#fff5f5',
      textMuted: 'rgba(255, 227, 227, 0.70)',
      boardLight: '#fed7aa',
      boardDark: '#c2410c',
      boardBorder: '#ea580c'
    }
  },
  {
    id: 'ocean',
    name: '🌊 Ocean Abyss',
    description: 'Deep oceanic trench blues with bioluminescent turquoise and marine sapphire glass',
    category: 'nature',
    colors: {
      primary: '#0284c7',
      primaryHover: '#0369a1',
      secondary: '#38bdf8',
      accentGlow: 'rgba(2, 132, 199, 0.45)',
      appBg: '#030d1a',
      mesh1: 'rgba(2, 132, 199, 0.26)',
      mesh2: 'rgba(56, 189, 248, 0.20)',
      mesh3: 'rgba(14, 165, 233, 0.18)',
      cardBg: 'rgba(2, 132, 199, 0.06)',
      cardBorder: 'rgba(56, 189, 248, 0.22)',
      cardHoverBg: 'rgba(2, 132, 199, 0.12)',
      cardHoverBorder: 'rgba(56, 189, 248, 0.50)',
      panelBg: 'rgba(4, 18, 36, 0.90)',
      textMain: '#f0f9ff',
      textMuted: 'rgba(224, 242, 254, 0.70)',
      boardLight: '#bae6fd',
      boardDark: '#0369a1',
      boardBorder: '#0284c7'
    }
  },
  {
    id: 'forest',
    name: '🌲 Ancient Forest',
    description: 'Emerald moss canopy with deep woodland dark hues and warm sunbeam amber accents',
    category: 'nature',
    colors: {
      primary: '#15803d',
      primaryHover: '#166534',
      secondary: '#eab308',
      accentGlow: 'rgba(21, 128, 61, 0.45)',
      appBg: '#05120a',
      mesh1: 'rgba(21, 128, 61, 0.26)',
      mesh2: 'rgba(234, 179, 8, 0.18)',
      mesh3: 'rgba(34, 197, 94, 0.18)',
      cardBg: 'rgba(21, 128, 61, 0.06)',
      cardBorder: 'rgba(34, 197, 94, 0.22)',
      cardHoverBg: 'rgba(21, 128, 61, 0.12)',
      cardHoverBorder: 'rgba(34, 197, 94, 0.50)',
      panelBg: 'rgba(7, 24, 14, 0.90)',
      textMain: '#f0fdf4',
      textMuted: 'rgba(220, 252, 231, 0.70)',
      boardLight: '#dcfce7',
      boardDark: '#166534',
      boardBorder: '#15803d'
    }
  }
];

const LOCAL_STORAGE_KEY_THEME = 'chesskys_active_theme_id';
const LOCAL_STORAGE_KEY_CUSTOM_THEMES = 'chesskys_custom_themes_list';

// Helper: Convert HEX to RGBA string
export function hexToRgba(hex: string, alpha: number): string {
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const PROTECTED_PRESET_IDS = ['peshmerga', 'ukh'];

export function isProtectedTheme(themeId: string): boolean {
  return PROTECTED_PRESET_IDS.includes(themeId) || PRESET_THEMES.some(t => t.id === themeId);
}

// Generate full UITheme color set from basic primary, secondary, and background
export function generateThemePalette(
  name: string,
  primaryHex: string,
  secondaryHex: string,
  bgHex: string,
  boardLightHex: string = '#eeeed2',
  boardDarkHex: string = '#769656',
  boardBorderHex: string = '#4a6333'
): UITheme {
  const id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  
  return {
    id,
    name,
    description: 'Custom tailored theme with bespoke color palette',
    isCustom: true,
    category: 'custom',
    colors: {
      primary: primaryHex,
      primaryHover: primaryHex,
      secondary: secondaryHex,
      accentGlow: hexToRgba(primaryHex, 0.35),
      appBg: bgHex,
      mesh1: hexToRgba(primaryHex, 0.22),
      mesh2: hexToRgba(secondaryHex, 0.18),
      mesh3: hexToRgba(primaryHex, 0.12),
      cardBg: hexToRgba('#ffffff', 0.05),
      cardBorder: hexToRgba(primaryHex, 0.18),
      cardHoverBg: hexToRgba(primaryHex, 0.10),
      cardHoverBorder: hexToRgba(primaryHex, 0.40),
      panelBg: hexToRgba(bgHex, 0.85),
      textMain: '#ffffff',
      textMuted: 'rgba(255, 255, 255, 0.65)',
      boardLight: boardLightHex,
      boardDark: boardDarkHex,
      boardBorder: boardBorderHex
    }
  };
}

// Apply theme to document element :root
export function applyThemeToDOM(theme: UITheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  const c = theme.colors;

  root.style.setProperty('--app-bg', c.appBg);
  root.style.setProperty('--primary-accent', c.primary);
  root.style.setProperty('--primary-accent-hover', c.primaryHover || c.primary);
  root.style.setProperty('--secondary-accent', c.secondary);
  root.style.setProperty('--accent-glow', c.accentGlow);
  root.style.setProperty('--mesh-1', c.mesh1);
  root.style.setProperty('--mesh-2', c.mesh2);
  root.style.setProperty('--mesh-3', c.mesh3);
  root.style.setProperty('--glass-bg', c.cardBg);
  root.style.setProperty('--glass-border', c.cardBorder);
  root.style.setProperty('--glass-bg-hover', c.cardHoverBg);
  root.style.setProperty('--glass-border-hover', c.cardHoverBorder);
  root.style.setProperty('--glass-panel', c.panelBg);
  root.style.setProperty('--text-main', c.textMain);
  root.style.setProperty('--text-muted', c.textMuted);

  if (c.boardLight) root.style.setProperty('--board-light', c.boardLight);
  if (c.boardDark) root.style.setProperty('--board-dark', c.boardDark);
  if (c.boardBorder) root.style.setProperty('--board-border', c.boardBorder);

  if (theme.backgroundImage) {
    root.style.setProperty('--app-bg-image', `url(${theme.backgroundImage})`);
  } else {
    root.style.removeProperty('--app-bg-image');
  }
}

// LocalStorage helpers
export function getSavedCustomThemes(): UITheme[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_CUSTOM_THEMES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load custom themes from localStorage', e);
    return [];
  }
}

export function saveCustomTheme(theme: UITheme): UITheme[] {
  if (typeof window === 'undefined') return [];
  try {
    // If attempting to save over a protected preset or missing custom flag, assign a custom clone ID
    let themeToSave = { ...theme };
    if (isProtectedTheme(themeToSave.id) || !themeToSave.isCustom) {
      themeToSave.id = `custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      themeToSave.isCustom = true;
      if (!themeToSave.name.includes('(Custom)')) {
        themeToSave.name = `${themeToSave.name} (Custom)`;
      }
    }

    const existing = getSavedCustomThemes();
    const index = existing.findIndex(t => t.id === themeToSave.id);
    let updated: UITheme[];
    if (index >= 0) {
      updated = [...existing];
      updated[index] = themeToSave;
    } else {
      updated = [themeToSave, ...existing];
    }
    localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOM_THEMES, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save custom theme', e);
    return [];
  }
}

export function deleteCustomTheme(themeId: string): UITheme[] {
  if (typeof window === 'undefined') return [];
  // Cannot delete protected presets
  if (isProtectedTheme(themeId)) {
    return getSavedCustomThemes();
  }
  try {
    const existing = getSavedCustomThemes();
    const filtered = existing.filter(t => t.id !== themeId);
    localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOM_THEMES, JSON.stringify(filtered));
    return filtered;
  } catch (e) {
    console.error('Failed to delete custom theme', e);
    return [];
  }
}

export function getActiveThemeId(): string {
  if (typeof window === 'undefined') return 'peshmerga';
  return localStorage.getItem(LOCAL_STORAGE_KEY_THEME) || 'peshmerga';
}

export function getActiveTheme(): UITheme {
  const activeId = getActiveThemeId();
  const custom = getSavedCustomThemes().find(t => t.id === activeId);
  if (custom) return custom;
  const preset = PRESET_THEMES.find(t => t.id === activeId);
  return preset || PRESET_THEMES[0];
}

export function setActiveThemeId(themeId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY_THEME, themeId);
}

// Random Palette Generator for instant creative inspiration
export function generateRandomHarmoniousPalette(): {
  name: string;
  primary: string;
  secondary: string;
  bg: string;
  boardLight: string;
  boardDark: string;
  boardBorder: string;
} {
  const palettes = [
    {
      name: 'Electric Synthwave',
      primary: '#ec4899',
      secondary: '#06b6d4',
      bg: '#0f0c1b',
      boardLight: '#fce7f3',
      boardDark: '#9d174d',
      boardBorder: '#700732'
    },
    {
      name: 'Deep Sea Trench',
      primary: '#0ea5e9',
      secondary: '#14b8a6',
      bg: '#041018',
      boardLight: '#e0f2fe',
      boardDark: '#075985',
      boardBorder: '#0c4a6e'
    },
    {
      name: 'Crimson Dragon',
      primary: '#ef4444',
      secondary: '#eab308',
      bg: '#160809',
      boardLight: '#fee2e2',
      boardDark: '#991b1b',
      boardBorder: '#7f1d1d'
    },
    {
      name: 'Forest Meadow',
      primary: '#10b981',
      secondary: '#84cc16',
      bg: '#08170e',
      boardLight: '#dcfce7',
      boardDark: '#166534',
      boardBorder: '#14532d'
    },
    {
      name: 'Velvet Starlight',
      primary: '#8b5cf6',
      secondary: '#f43f5e',
      bg: '#0d0918',
      boardLight: '#f3e8ff',
      boardDark: '#6b21a8',
      boardBorder: '#581c87'
    },
    {
      name: 'Golden Phoenix',
      primary: '#f59e0b',
      secondary: '#f97316',
      bg: '#140f09',
      boardLight: '#fef3c7',
      boardDark: '#b45309',
      boardBorder: '#78350f'
    }
  ];

  return palettes[Math.floor(Math.random() * palettes.length)];
}
