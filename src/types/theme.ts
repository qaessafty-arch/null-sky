export interface UITheme {
  id: string;
  name: string;
  description: string;
  isCustom?: boolean;
  category?: 'vibrant' | 'nature' | 'luxury' | 'dark' | 'custom';
  colors: {
    primary: string; // e.g. '#3b82f6'
    primaryHover: string; // e.g. '#2563eb'
    secondary: string; // e.g. '#a855f7'
    accentGlow: string; // e.g. 'rgba(59, 130, 246, 0.35)'
    appBg: string; // e.g. '#0a0a0c'
    mesh1: string; // e.g. 'rgba(59, 130, 246, 0.18)'
    mesh2: string; // e.g. 'rgba(139, 92, 246, 0.18)'
    mesh3: string; // e.g. 'rgba(236, 72, 153, 0.14)'
    cardBg: string; // e.g. 'rgba(255, 255, 255, 0.06)'
    cardBorder: string; // e.g. 'rgba(255, 255, 255, 0.12)'
    cardHoverBg: string; // e.g. 'rgba(255, 255, 255, 0.1)'
    cardHoverBorder: string; // e.g. 'rgba(255, 255, 255, 0.22)'
    panelBg: string; // e.g. 'rgba(15, 18, 28, 0.75)'
    textMain: string; // e.g. '#f8fafc'
    textMuted: string; // e.g. 'rgba(255, 255, 255, 0.6)'
    boardLight?: string; // e.g. '#eeeed2'
    boardDark?: string; // e.g. '#769656'
    boardBorder?: string; // e.g. '#4a6333'
  };
  backgroundImage?: string;
}

export type CustomThemeInput = Omit<UITheme, 'id' | 'isCustom'>;
