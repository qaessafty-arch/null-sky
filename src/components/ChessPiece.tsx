import React from 'react';
import { PieceType, PieceColor, PieceThemeId } from '../types/chess';

interface ChessPieceProps {
  type: PieceType;
  color: PieceColor;
  theme?: PieceThemeId;
  className?: string;
}

export const ChessPiece: React.FC<ChessPieceProps> = ({
  type,
  color,
  theme = 'peshmerga',
  className = 'w-full h-full'
}) => {
  const isWhite = color === 'w';

  // --- Theme 1: ☀️ Peshmerga Royal (Kurdish) ---
  if (theme === 'peshmerga') {
    const mainBody = isWhite ? '#FDFCF7' : '#1E2818';
    const borderStroke = isWhite ? '#435433' : '#F5C453';
    const goldAccent = '#F5C453';
    const crimsonAccent = '#8C2425';
    const oliveAccent = '#52673A';
    const sandstoneAccent = '#DFD0B0';

    return (
      <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-none drop-shadow-md">
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`pesh-grad-${color}-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isWhite ? '#FFFFFF' : '#2D3B23'} />
              <stop offset="100%" stopColor={isWhite ? '#DFD0B0' : '#141A10'} />
            </linearGradient>
            <radialGradient id={`sun-glow-${color}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFE082" />
              <stop offset="100%" stopColor="#F5C453" />
            </radialGradient>
          </defs>

          {/* PAWN */}
          {type === 'p' && (
            <g stroke={borderStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M 22.5 8 C 20 8 18 10 18 12.5 C 18 14.5 19.5 16 21 16.8 C 17.5 18 16 20.5 16 23 C 16 25 17 26.5 18.5 27.5 C 15.5 28.5 11 32 11 39.5 L 34 39.5 C 34 32 29.5 28.5 26.5 27.5 C 28 26.5 29 25 29 23 C 29 20.5 27.5 18 24 16.8 C 25.5 16 27 14.5 27 12.5 C 27 10 25 8 22.5 8 Z"
                fill={`url(#pesh-grad-${color}-${type})`}
              />
              {/* Jamadani Sash Motif */}
              <path d="M 14.5 35.5 L 30.5 35.5" stroke={crimsonAccent} strokeWidth="2.2" />
              <path d="M 17 32.5 L 28 32.5" stroke={goldAccent} strokeWidth="1.4" />
              {/* Kurdish Sun Head Ring */}
              <circle cx="22.5" cy="12.5" r="2.2" fill={goldAccent} stroke={crimsonAccent} strokeWidth="0.8" />
            </g>
          )}

          {/* KNIGHT - Kurdish Steed with Khanjar Crest */}
          {type === 'n' && (
            <g stroke={borderStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M 22 8 C 33 9 39 16 38 39 L 14 39 C 14 30 24 32 22 17 C 23 20 18 24 16 26 C 13 28 13 31 10.5 30.5 C 9 29.5 11.5 27.5 10 27.5 C 8.5 27.5 10 29 8.5 29.5 C 7 29.5 5 28 5.5 24 C 6 22 11.5 13 11.5 13 C 11.5 13 13.5 11 13.5 9 C 13 8 13 7 13 6 C 14 5 16 8.5 16 8.5 L 18 8.5 C 18 8.5 18.8 6.5 20.5 5.5 C 21.5 5.5 22 8 22 8 Z"
                fill={`url(#pesh-grad-${color}-${type})`}
              />
              {/* Khanjar / Dagger Ear Curve & Kurdish Mane */}
              <path d="M 20 11 C 25 13 29 18 28 26" stroke={goldAccent} strokeWidth="1.8" fill="none" />
              <path d="M 14 35.5 L 35 35.5" stroke={crimsonAccent} strokeWidth="2.2" />
              {/* Golden Harness Star */}
              <circle cx="21" cy="19" r="1.8" fill={goldAccent} stroke={crimsonAccent} strokeWidth="0.8" />
              <circle cx="9" cy="24" r="1" fill={goldAccent} stroke="none" />
            </g>
          )}

          {/* BISHOP - Kurdish Mountain Mitre */}
          {type === 'b' && (
            <g stroke={borderStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {/* Base */}
              <path d="M 10 39.5 L 35 39.5 L 34 36 L 11 36 Z" fill={`url(#pesh-grad-${color}-${type})`} />
              {/* Mitre Body */}
              <path
                d="M 14 36 C 13 31 15 28 17 26 C 17 26 14 26 14 22 C 14 18 19 11 22.5 8 C 26 11 31 18 31 22 C 31 26 28 26 28 26 C 30 28 32 31 31 36 Z"
                fill={`url(#pesh-grad-${color}-${type})`}
              />
              {/* Mitre Slash */}
              <path d="M 20 14 L 25 21" stroke={crimsonAccent} strokeWidth="2" />
              <path d="M 13 36 L 32 36" stroke={crimsonAccent} strokeWidth="2.2" />
              <path d="M 16 33 L 29 33" stroke={goldAccent} strokeWidth="1.4" />
              {/* Kurdish 21-Ray Sun Crown Orb */}
              <circle cx="22.5" cy="7" r="2.5" fill={goldAccent} stroke={borderStroke} strokeWidth="1.2" />
              <path d="M 22.5 3 L 22.5 5 M 20 4.5 L 21 6 M 25 4.5 L 24 6" stroke={goldAccent} strokeWidth="1.2" />
            </g>
          )}

          {/* ROOK - Citadel Fortress of Hewlêr & Zagros */}
          {type === 'r' && (
            <g stroke={borderStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {/* Base */}
              <path d="M 9 39.5 L 36 39.5 L 35 35 L 10 35 Z" fill={`url(#pesh-grad-${color}-${type})`} />
              {/* Column Tower */}
              <path d="M 13.5 35 L 14.5 17 L 30.5 17 L 31.5 35 Z" fill={`url(#pesh-grad-${color}-${type})`} />
              {/* Fortress Crenellations (Citadel battlements) */}
              <path
                d="M 11 17 L 11 9 L 15 9 L 15 12 L 20 12 L 20 9 L 25 9 L 25 12 L 30 12 L 30 9 L 34 9 L 34 17 Z"
                fill={`url(#pesh-grad-${color}-${type})`}
              />
              {/* Jamadani Sash & Fortress Arrow Slit */}
              <path d="M 12 36 L 33 36" stroke={crimsonAccent} strokeWidth="2.2" />
              <path d="M 22.5 20 L 22.5 28" stroke={goldAccent} strokeWidth="2.2" />
              <path d="M 19 23 L 26 23" stroke={goldAccent} strokeWidth="1.5" />
            </g>
          )}

          {/* QUEEN - Peshmerga Royal Crown with 21-Ray Kurdish Sun */}
          {type === 'q' && (
            <g stroke={borderStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {/* Royal Base */}
              <path d="M 10 39.5 L 35 39.5 C 35 36 33 34 32 32 C 30 31 15 31 13 32 C 12 34 10 36 10 39.5 Z" fill={`url(#pesh-grad-${color}-${type})`} />
              {/* Queen Body */}
              <path
                d="M 9 26 C 17 24 28 24 36 26 L 38.5 13 L 31 23 L 29.5 10 L 24.5 22 L 22.5 9 L 20.5 22 L 15.5 10 L 14 23 L 6.5 13 Z"
                fill={`url(#pesh-grad-${color}-${type})`}
              />
              {/* Crown Jewels (Kurdish Sun Orbs) */}
              <circle cx="6.5" cy="12" r="1.8" fill={goldAccent} stroke={crimsonAccent} strokeWidth="0.8" />
              <circle cx="15.5" cy="9" r="1.8" fill={goldAccent} stroke={crimsonAccent} strokeWidth="0.8" />
              <circle cx="22.5" cy="7.5" r="2.4" fill={goldAccent} stroke={crimsonAccent} strokeWidth="1" />
              <circle cx="29.5" cy="9" r="1.8" fill={goldAccent} stroke={crimsonAccent} strokeWidth="0.8" />
              <circle cx="38.5" cy="12" r="1.8" fill={goldAccent} stroke={crimsonAccent} strokeWidth="0.8" />
              {/* Waist Band */}
              <path d="M 12 35.5 L 33 35.5" stroke={crimsonAccent} strokeWidth="2.2" />
              <path d="M 14 32 L 31 32" stroke={goldAccent} strokeWidth="1.6" />
              {/* Central Emblem */}
              <circle cx="22.5" cy="27" r="2.2" fill={crimsonAccent} stroke={goldAccent} strokeWidth="1" />
            </g>
          )}

          {/* KING - Supreme Peshmerga Sovereign with Golden Kurdish Sun */}
          {type === 'k' && (
            <g stroke={borderStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              {/* Base */}
              <path d="M 11 39.5 L 34 39.5 C 34 36 33 34 31.5 32 C 29 30 16 30 13.5 32 C 12 34 11 36 11 39.5 Z" fill={`url(#pesh-grad-${color}-${type})`} />
              {/* Royal Mantle Body */}
              <path
                d="M 12.5 32 C 11 26 7 21 7 18 C 7 14 13 14 17 18 C 19 14 26 14 28 18 C 32 14 38 14 38 18 C 38 21 34 26 32.5 32 Z"
                fill={`url(#pesh-grad-${color}-${type})`}
              />
              {/* Central Chest Vestment */}
              <path d="M 22.5 16 L 22.5 31" stroke={goldAccent} strokeWidth="2" />
              <path d="M 13 36 L 32 36" stroke={crimsonAccent} strokeWidth="2.2" />
              <path d="M 15 33 L 30 33" stroke={goldAccent} strokeWidth="1.5" />
              {/* The Glorious 21-Ray Kurdish Sun Finial */}
              <circle cx="22.5" cy="9.5" r="3.2" fill={goldAccent} stroke={borderStroke} strokeWidth="1.2" />
              <circle cx="22.5" cy="9.5" r="1.5" fill={crimsonAccent} stroke="none" />
              {/* Radiating Sun Rays */}
              <path
                d="M 22.5 4.5 L 22.5 6 M 22.5 13 L 22.5 14.5 M 17.5 9.5 L 19 9.5 M 26 9.5 L 27.5 9.5 M 19 6 L 20 7 M 25 12 L 26 13 M 19 13 L 20 12 M 25 7 L 26 6"
                stroke={goldAccent}
                strokeWidth="1.2"
              />
            </g>
          )}
        </svg>
      </div>
    );
  }

  // --- Theme 2: 🎓 UKH Chancellor (University of Kurdistan Hewlêr) ---
  if (theme === 'ukh') {
    const mainBody = isWhite ? '#F8FAFC' : '#1A3B5C';
    const borderStroke = isWhite ? '#1A3B5C' : '#E5A93B';
    const goldAccent = '#E5A93B';
    const navyAccent = '#0F2B48';
    const parchmentAccent = '#E8EEF5';

    return (
      <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-none drop-shadow-[0_2px_8px_rgba(26,59,92,0.4)]">
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={`ukh-grad-${color}-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={isWhite ? '#FFFFFF' : '#234E78'} />
              <stop offset="100%" stopColor={isWhite ? '#E2E8F0' : '#10273F'} />
            </linearGradient>
            <radialGradient id={`ukh-gold-grad-${color}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FDE68A" />
              <stop offset="100%" stopColor="#D97706" />
            </radialGradient>
          </defs>

          {/* PAWN - UKH Scholar's Flame & Cap */}
          {type === 'p' && (
            <g stroke={borderStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M 22.5 8 C 20 8 18 10 18 12.5 C 18 14.5 19.5 16 21 16.8 C 17.5 18 16 20.5 16 23 C 16 25 17 26.5 18.5 27.5 C 15.5 28.5 11 32 11 39.5 L 34 39.5 C 34 32 29.5 28.5 26.5 27.5 C 28 26.5 29 25 29 23 C 29 20.5 27.5 18 24 16.8 C 25.5 16 27 14.5 27 12.5 C 27 10 25 8 22.5 8 Z"
                fill={`url(#ukh-grad-${color}-${type})`}
              />
              <path d="M 14.5 35.5 L 30.5 35.5" stroke={goldAccent} strokeWidth="2.2" />
              <path d="M 17 32.5 L 28 32.5" stroke={navyAccent} strokeWidth="1.4" />
              <circle cx="22.5" cy="12.5" r="2.4" fill={goldAccent} stroke={borderStroke} strokeWidth="0.8" />
            </g>
          )}

          {/* KNIGHT - UKH Golden Steed & Laurels */}
          {type === 'n' && (
            <g stroke={borderStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M 22 8 C 33 9 39 16 38 39 L 14 39 C 14 30 24 32 22 17 C 23 20 18 24 16 26 C 13 28 13 31 10.5 30.5 C 9 29.5 11.5 27.5 10 27.5 C 8.5 27.5 10 29 8.5 29.5 C 7 29.5 5 28 5.5 24 C 6 22 11.5 13 11.5 13 C 11.5 13 13.5 11 13.5 9 C 13 8 13 7 13 6 C 14 5 16 8.5 16 8.5 L 18 8.5 C 18 8.5 18.8 6.5 20.5 5.5 C 21.5 5.5 22 8 22 8 Z"
                fill={`url(#ukh-grad-${color}-${type})`}
              />
              <path d="M 20 11 C 25 13 29 18 28 26" stroke={goldAccent} strokeWidth="2" fill="none" />
              <path d="M 14 35.5 L 35 35.5" stroke={goldAccent} strokeWidth="2.2" />
              <circle cx="21" cy="19" r="1.8" fill={goldAccent} stroke={borderStroke} strokeWidth="0.8" />
            </g>
          )}

          {/* BISHOP - UKH Chancellor Laurels */}
          {type === 'b' && (
            <g stroke={borderStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 10 39.5 L 35 39.5 L 34 36 L 11 36 Z" fill={`url(#ukh-grad-${color}-${type})`} />
              <path
                d="M 14 36 C 13 31 15 28 17 26 C 17 26 14 26 14 22 C 14 18 19 11 22.5 8 C 26 11 31 18 31 22 C 31 26 28 26 28 26 C 30 28 32 31 31 36 Z"
                fill={`url(#ukh-grad-${color}-${type})`}
              />
              <path d="M 20 14 L 25 21" stroke={goldAccent} strokeWidth="2" />
              <path d="M 13 36 L 32 36" stroke={goldAccent} strokeWidth="2.2" />
              <circle cx="22.5" cy="7" r="2.6" fill={goldAccent} stroke={borderStroke} strokeWidth="1.2" />
            </g>
          )}

          {/* ROOK - UKH University Library & Clock Tower */}
          {type === 'r' && (
            <g stroke={borderStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 9 39.5 L 36 39.5 L 35 35 L 10 35 Z" fill={`url(#ukh-grad-${color}-${type})`} />
              <path d="M 13.5 35 L 14.5 17 L 30.5 17 L 31.5 35 Z" fill={`url(#ukh-grad-${color}-${type})`} />
              <path
                d="M 11 17 L 11 9 L 15 9 L 15 12 L 20 12 L 20 9 L 25 9 L 25 12 L 30 12 L 30 9 L 34 9 L 34 17 Z"
                fill={`url(#ukh-grad-${color}-${type})`}
              />
              <path d="M 12 36 L 33 36" stroke={goldAccent} strokeWidth="2.2" />
              <path d="M 22.5 20 L 22.5 28" stroke={goldAccent} strokeWidth="2.2" />
              <path d="M 19 23 L 26 23" stroke={goldAccent} strokeWidth="1.5" />
            </g>
          )}

          {/* QUEEN - UKH Chancellor Empress Crown */}
          {type === 'q' && (
            <g stroke={borderStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 10 39.5 L 35 39.5 C 35 36 33 34 32 32 C 30 31 15 31 13 32 C 12 34 10 36 10 39.5 Z" fill={`url(#ukh-grad-${color}-${type})`} />
              <path
                d="M 9 26 C 17 24 28 24 36 26 L 38.5 13 L 31 23 L 29.5 10 L 24.5 22 L 22.5 9 L 20.5 22 L 15.5 10 L 14 23 L 6.5 13 Z"
                fill={`url(#ukh-grad-${color}-${type})`}
              />
              <circle cx="6.5" cy="12" r="1.8" fill={goldAccent} stroke={borderStroke} strokeWidth="0.8" />
              <circle cx="15.5" cy="9" r="1.8" fill={goldAccent} stroke={borderStroke} strokeWidth="0.8" />
              <circle cx="22.5" cy="7.5" r="2.5" fill={goldAccent} stroke={borderStroke} strokeWidth="1" />
              <circle cx="29.5" cy="9" r="1.8" fill={goldAccent} stroke={borderStroke} strokeWidth="0.8" />
              <circle cx="38.5" cy="12" r="1.8" fill={goldAccent} stroke={borderStroke} strokeWidth="0.8" />
              <path d="M 12 35.5 L 33 35.5" stroke={goldAccent} strokeWidth="2.2" />
              <circle cx="22.5" cy="27" r="2.2" fill={goldAccent} stroke={navyAccent} strokeWidth="1" />
            </g>
          )}

          {/* KING - UKH Chancellor President Sovereign Crown */}
          {type === 'k' && (
            <g stroke={borderStroke} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 11 39.5 L 34 39.5 C 34 36 33 34 31.5 32 C 29 30 16 30 13.5 32 C 12 34 11 36 11 39.5 Z" fill={`url(#ukh-grad-${color}-${type})`} />
              <path
                d="M 12.5 32 C 11 26 7 21 7 18 C 7 14 13 14 17 18 C 19 14 26 14 28 18 C 32 14 38 14 38 18 C 38 21 34 26 32.5 32 Z"
                fill={`url(#ukh-grad-${color}-${type})`}
              />
              <path d="M 22.5 16 L 22.5 31" stroke={goldAccent} strokeWidth="2" />
              <path d="M 13 36 L 32 36" stroke={goldAccent} strokeWidth="2.2" />
              <circle cx="22.5" cy="9.5" r="3.4" fill={goldAccent} stroke={borderStroke} strokeWidth="1.2" />
              <path d="M 22.5 4.5 L 22.5 6 M 22.5 13 L 22.5 14.5 M 17.5 9.5 L 19 9.5 M 26 9.5 L 27.5 9.5" stroke={goldAccent} strokeWidth="1.4" />
            </g>
          )}
        </svg>
      </div>
    );
  }

  // --- Theme 2: 💎 Crystal Glass & Neon ---
  if (theme === 'crystal_neon') {
    const neonStroke = isWhite ? '#38BDF8' : '#EC4899';
    const neonFill = isWhite ? 'rgba(56, 189, 248, 0.22)' : 'rgba(236, 72, 153, 0.22)';
    const neonGlow = isWhite ? '#0284C7' : '#BE185D';
    const coreHighlight = isWhite ? '#E0F2FE' : '#FCE7F3';

    return (
      <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-none drop-shadow-[0_0_12px_rgba(56,189,248,0.4)]">
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id={`neon-bloom-${color}`} x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="1.2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {type === 'p' && (
            <g stroke={neonStroke} strokeWidth="1.8" fill={neonFill} filter={`url(#neon-bloom-${color})`}>
              <path d="M 22.5 9 C 20 9 18.5 10.5 18.5 13 C 18.5 15 20 16.5 21 17 C 17 18.5 15.5 21.5 15.5 24 C 15.5 26.5 17 28 18.5 29 C 15.5 30 11 33 11 39.5 L 34 39.5 C 34 33 29.5 30 26.5 29 C 28 28 29.5 26.5 29.5 24 C 29.5 21.5 28 18.5 24 17 C 25 16.5 26.5 15 26.5 13 C 26.5 10.5 25 9 22.5 9 Z" />
              <circle cx="22.5" cy="13" r="2" fill={coreHighlight} stroke="none" />
              <path d="M 14 36 L 31 36" stroke={coreHighlight} strokeWidth="1.2" />
            </g>
          )}

          {type === 'n' && (
            <g stroke={neonStroke} strokeWidth="1.8" fill={neonFill} filter={`url(#neon-bloom-${color})`}>
              <path d="M 22 9 C 32.5 10 38.5 17 38 39 L 14 39 C 14 30 24 32.5 22 17 C 23 20 18 24 16 26 C 13 28 13 31 10.5 30.5 C 9.5 29.5 12 27.5 10.5 27.5 C 9.5 27.5 10.5 29 9.5 29.5 C 8 29.5 6 28.5 6.5 24 C 7 22 12 13 12 13 L 16 9 L 18 9 L 22 9 Z" />
              <circle cx="10" cy="24" r="1.5" fill={coreHighlight} stroke="none" />
              <path d="M 19 13 C 24 16 28 22 27 30" stroke={coreHighlight} strokeWidth="1.4" fill="none" />
            </g>
          )}

          {type === 'b' && (
            <g stroke={neonStroke} strokeWidth="1.8" fill={neonFill} filter={`url(#neon-bloom-${color})`}>
              <path d="M 10 39.5 L 35 39.5 L 34 35 L 11 35 Z" />
              <path d="M 14 35 C 13 30 15 27 17 25 C 17 25 14 25 14 21 C 14 17 19 11 22.5 8 C 26 11 31 17 31 21 C 31 25 28 25 28 25 C 30 27 32 30 31 35 Z" />
              <circle cx="22.5" cy="7" r="2.5" fill={coreHighlight} />
              <path d="M 19 16 L 26 23" stroke={coreHighlight} strokeWidth="1.5" />
            </g>
          )}

          {type === 'r' && (
            <g stroke={neonStroke} strokeWidth="1.8" fill={neonFill} filter={`url(#neon-bloom-${color})`}>
              <path d="M 9 39.5 L 36 39.5 L 35 34 L 10 34 Z" />
              <path d="M 13.5 34 L 14.5 16 L 30.5 16 L 31.5 34 Z" />
              <path d="M 11 16 L 11 9 L 15 9 L 15 12 L 20 12 L 20 9 L 25 9 L 25 12 L 30 12 L 30 9 L 34 9 L 34 16 Z" />
              <path d="M 22.5 19 L 22.5 30" stroke={coreHighlight} strokeWidth="1.5" />
            </g>
          )}

          {type === 'q' && (
            <g stroke={neonStroke} strokeWidth="1.8" fill={neonFill} filter={`url(#neon-bloom-${color})`}>
              <path d="M 10 39.5 L 35 39.5 L 33 34 L 12 34 Z" />
              <path d="M 9 26 C 17 24 28 24 36 26 L 38.5 13 L 31 23 L 29.5 10 L 24.5 22 L 22.5 9 L 20.5 22 L 15.5 10 L 14 23 L 6.5 13 Z" />
              <circle cx="6.5" cy="12" r="1.5" fill={coreHighlight} />
              <circle cx="15.5" cy="9" r="1.5" fill={coreHighlight} />
              <circle cx="22.5" cy="7.5" r="2" fill={coreHighlight} />
              <circle cx="29.5" cy="9" r="1.5" fill={coreHighlight} />
              <circle cx="38.5" cy="12" r="1.5" fill={coreHighlight} />
            </g>
          )}

          {type === 'k' && (
            <g stroke={neonStroke} strokeWidth="1.8" fill={neonFill} filter={`url(#neon-bloom-${color})`}>
              <path d="M 11 39.5 L 34 39.5 L 32 34 L 13 34 Z" />
              <path d="M 12.5 32 C 11 26 7 21 7 18 C 7 14 13 14 17 18 C 19 14 26 14 28 18 C 32 14 38 14 38 18 C 38 21 34 26 32.5 32 Z" />
              <path d="M 22.5 6 L 22.5 13 M 19 9 L 26 9" stroke={coreHighlight} strokeWidth="2.2" strokeLinecap="round" />
            </g>
          )}
        </svg>
      </div>
    );
  }

  // --- Theme 3: 👑 Classic FIDE Staunton 3D ---
  if (theme === 'fide_3d') {
    const baseGradientId = `fide-grad-${color}-${type}`;
    const lightColor = isWhite ? '#FFFFFF' : '#475569';
    const darkColor = isWhite ? '#CBD5E1' : '#0F172A';
    const outlineColor = isWhite ? '#334155' : '#020617';

    return (
      <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id={baseGradientId} x1="20%" y1="0%" x2="80%" y2="100%">
              <stop offset="0%" stopColor={lightColor} />
              <stop offset="70%" stopColor={darkColor} />
              <stop offset="100%" stopColor={outlineColor} />
            </linearGradient>
          </defs>

          {type === 'p' && (
            <g stroke={outlineColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M 22.5 9 C 20.3 9 18.5 10.8 18.5 13 C 18.5 13.9 18.8 14.7 19.3 15.4 C 17.3 16.5 16 18.6 16 21 C 16 23 16.9 24.8 18.4 26 C 15.4 27.1 11 31.6 11 39.5 L 34 39.5 C 34 31.6 29.6 27.1 26.6 26 C 28.1 24.8 29 23 29 21 C 29 18.6 27.7 16.5 25.7 15.4 C 26.2 14.7 26.5 13.9 26.5 13 C 26.5 10.8 24.7 9 22.5 9 Z"
                fill={`url(#${baseGradientId})`}
              />
              <path d="M 13 37 L 32 37" stroke={isWhite ? '#F8FAFC' : '#64748B'} strokeWidth="1.2" />
            </g>
          )}

          {type === 'n' && (
            <g stroke={outlineColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M 22 10 C 32.5 11 38.5 18 38 39 L 15 39 C 15 30 25 32.5 23 18 C 24.3 20.9 18.4 25.3 16 27 C 13 29 13.1 31.3 11 31 C 9.9 30 12.4 27.9 11 28 C 10 28 11.1 29.2 10 30 C 9 30 6 31 6 26 C 6 24 12 14 12 14 C 12 14 13.8 12.1 14 10.5 C 13.2 9.5 13.5 8.5 13.5 7.5 C 14.5 6.5 16.5 10 16.5 10 L 18.5 10 C 18.5 10 19.2 8 21 7 C 22 7 22 10 22 10 Z"
                fill={`url(#${baseGradientId})`}
              />
              <circle cx="9.5" cy="25.5" r="1.2" fill={isWhite ? '#0F172A' : '#F8FAFC'} stroke="none" />
            </g>
          )}

          {type === 'b' && (
            <g stroke={outlineColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path
                d="M 9 36 C 12.3 35 19.1 36.4 22.5 34 C 25.8 36.4 32.6 35 36 36 C 36 36 37.6 36.5 39 38 C 38.3 39 37.3 39 36 38.5 C 32.6 37.5 25.8 39 22.5 37.5 C 19.1 39 12.3 37.5 9 38.5 C 7.6 39 6.6 39 6 38 C 7.3 36.5 9 36 9 36 Z"
                fill={`url(#${baseGradientId})`}
              />
              <path
                d="M 15 32 C 17.5 34.5 27.5 34.5 30 32 C 30.5 30.5 30 30 30 30 C 30 27.5 27.5 26 27.5 26 C 33 24.5 33.5 14.5 22.5 10.5 C 11.5 14.5 12 24.5 17.5 26 C 17.5 26 15 27.5 15 30 C 15 30 14.5 30.5 15 32 Z"
                fill={`url(#${baseGradientId})`}
              />
              <circle cx="22.5" cy="8" r="2.5" fill={`url(#${baseGradientId})`} />
              <path d="M 20 18 L 25 18 M 22.5 15.5 L 22.5 20.5" stroke={outlineColor} />
            </g>
          )}

          {type === 'r' && (
            <g stroke={outlineColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 9 39 L 36 39 L 36 36 L 9 36 Z" fill={`url(#${baseGradientId})`} />
              <path d="M 12 36 L 12 32 L 33 32 L 33 36 Z" fill={`url(#${baseGradientId})`} />
              <path d="M 14 32 L 14 17 L 31 17 L 31 32 Z" fill={`url(#${baseGradientId})`} />
              <path d="M 11 17 L 11 9 L 15 9 L 15 11 L 20 11 L 20 9 L 25 9 L 25 11 L 30 11 L 30 9 L 34 9 L 34 17 Z" fill={`url(#${baseGradientId})`} />
            </g>
          )}

          {type === 'q' && (
            <g stroke={outlineColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 9 26 C 17.5 24.5 30 24.5 36 26 L 38.5 13.5 L 31 25 L 30.7 10.5 L 25.5 24.5 L 22.5 10 L 19.5 24.5 L 14.3 10.5 L 14 25 L 6.5 13.5 Z" fill={`url(#${baseGradientId})`} />
              <path d="M 9 26 C 9 28 10.5 28 11.5 30 C 12.5 31.5 12.5 31 12 33.5 C 10.5 34.5 11 36 11 36 L 34 36 C 34 36 34.5 34.5 33 33.5 C 32.5 31 32.5 31.5 33.5 30 C 34.5 28 36 28 36 26" fill={`url(#${baseGradientId})`} />
              <circle cx="6" cy="12" r="1.5" fill={`url(#${baseGradientId})`} />
              <circle cx="14" cy="9" r="1.5" fill={`url(#${baseGradientId})`} />
              <circle cx="22.5" cy="8" r="1.8" fill={`url(#${baseGradientId})`} />
              <circle cx="31" cy="9" r="1.5" fill={`url(#${baseGradientId})`} />
              <circle cx="39" cy="12" r="1.5" fill={`url(#${baseGradientId})`} />
            </g>
          )}

          {type === 'k' && (
            <g stroke={outlineColor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M 22.5 11.6 L 22.5 6 M 20 8 L 25 8" stroke={outlineColor} strokeWidth="1.8" />
              <path d="M 22.5 25 C 22.5 25 27 17.5 25.5 14.5 C 24 11.5 21 11.5 22.5 25 Z" fill={`url(#${baseGradientId})`} />
              <path d="M 12.5 37 C 15 40.5 30 40.5 32.5 37 L 32.5 30 C 32.5 30 41.5 25.5 38.5 19.5 C 34.5 13 25 16 22.5 23.5 L 22.5 27 L 22.5 23.5 C 20 16 10.5 13 6.5 19.5 C 3.5 25.5 12.5 30 12.5 30 L 12.5 37 Z" fill={`url(#${baseGradientId})`} />
            </g>
          )}
        </svg>
      </div>
    );
  }

  // --- Fallback Standard Themes (classic, neo, alpha, vintage) ---
  let whiteFill = '#FFFFFF';
  let whiteStroke = '#1E293B';
  let blackFill = '#0F172A';
  let blackStroke = '#94A3B8';

  if (theme === 'vintage') {
    whiteFill = '#F5E6C8';
    whiteStroke = '#5C381E';
    blackFill = '#3B2212';
    blackStroke = '#D2A679';
  } else if (theme === 'neo') {
    whiteFill = '#E2E8F0';
    whiteStroke = '#0EA5E9';
    blackFill = '#020617';
    blackStroke = '#38BDF8';
  } else if (theme === 'alpha') {
    whiteFill = '#F8FAFC';
    whiteStroke = '#334155';
    blackFill = '#1E293B';
    blackStroke = '#CBD5E1';
  }

  const fill = isWhite ? whiteFill : blackFill;
  const stroke = isWhite ? whiteStroke : blackStroke;
  const highlight = isWhite ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)';

  const renderPieceSvg = () => {
    switch (type) {
      case 'p':
        return (
          <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
            <g style={{ fill, stroke, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'miter' }}>
              <path d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z" />
              {isWhite && <ellipse cx="22.5" cy="13" rx="1.5" ry="1.5" fill={highlight} stroke="none" />}
            </g>
          </svg>
        );

      case 'n':
        return (
          <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
            <g style={{ fill, stroke, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
              <path d="M 22,10 C 32.5,11 38.5,18 38,39 L 15,39 C 15,30 25,32.5 23,18" />
              <path d="M 24,18 C 24.38,20.91 18.45,25.37 16,27 C 13,29 13.18,31.34 11,31 C 9.958,30.06 12.41,27.96 11,28 C 10,28 11.19,29.23 10,30 C 9,30 5.997,31 6,26 C 6,24 12,14 12,14 C 12,14 13.89,12.1 14,10.5 C 13.27,9.506 13.5,8.5 13.5,7.5 C 14.5,6.5 16.5,10 16.5,10 L 18.5,10 C 18.5,10 19.28,8.008 21,7 C 22,7 22,10 22,10 z" />
              <circle cx="9.5" cy="25.5" r="1" fill={isWhite ? '#000' : '#FFF'} stroke="none" />
            </g>
          </svg>
        );

      case 'b':
        return (
          <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
            <g style={{ fill, stroke, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
              <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z" />
              <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,26 C 33,24.5 33.5,14.5 22.5,10.5 C 11.5,14.5 12,24.5 17.5,26 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
              <path d="m 25 8 a 2.5 2.5 0 1 1 -5,0 a 2.5 2.5 0 1 1 5,0 z" />
              <path d="M 17.5,26 L 27.5,26 M 15,30 L 30,30 M 22.5,15.5 L 22.5,20.5 M 20,18 L 25,18" fill="none" stroke={stroke} strokeLinejoin="miter" />
            </g>
          </svg>
        );

      case 'r':
        return (
          <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
            <g style={{ fill, stroke, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
              <path d="M 9,39 L 36,39 L 36,36 L 9,36 L 9,39 z" />
              <path d="M 12,36 L 12,32 L 33,32 L 33,36 L 12,36 z" />
              <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14" />
              <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
              <path d="M 14,17 L 14,29.5 L 31,29.5 L 31,17" />
            </g>
          </svg>
        );

      case 'q':
        return (
          <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
            <g style={{ fill, stroke, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
              <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 30.7,10.5 L 25.5,24.5 L 22.5,10 L 19.5,24.5 L 14.3,10.5 L 14,25 L 6.5,13.5 L 9,26 z" />
              <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 L 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26" />
              <circle cx="6" cy="12" r="1.5" />
              <circle cx="14" cy="9" r="1.5" />
              <circle cx="22.5" cy="8" r="1.8" />
              <circle cx="31" cy="9" r="1.5" />
              <circle cx="39" cy="12" r="1.5" />
            </g>
          </svg>
        );

      case 'k':
        return (
          <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
            <g style={{ fill, stroke, strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
              <path d="M 22.5,11.63 L 22.5,6 M 20,8 L 25,8" stroke={stroke} strokeLinejoin="miter" />
              <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 22.5,25 z" />
              <path d="M 12.5,37 C 15,40.5 30,40.5 32.5,37 L 32.5,30 C 32.5,30 41.5,25.5 38.5,19.5 C 34.5,13 25,16 22.5,23.5 L 22.5,27 L 22.5,23.5 C 20,16 10.5,13 6.5,19.5 C 3.5,25.5 12.5,30 12.5,30 L 12.5,37 z" />
            </g>
          </svg>
        );
    }
  };

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-none drop-shadow-md">
      {renderPieceSvg()}
    </div>
  );
};
