import React from 'react';
import { PieceType, PieceColor, PieceThemeId } from '../types/chess';
import { BatmanPiece } from './pieces/BatmanPiece';
import { OnePiecePiece } from './pieces/OnePiecePiece';

interface ChessPieceProps {
  type: PieceType;
  color: PieceColor;
  theme?: PieceThemeId;
  className?: string;
}

export const ChessPiece = React.memo<ChessPieceProps>(({
  type,
  color,
  theme = 'peshmerga',
  className = 'w-full h-full'
}) => {
  const isWhite = color === 'w';

  // --- Theme: 🏴‍☠️ One Piece (Straw Hats vs Marines) ---
  if (theme === 'one-piece') {
    return <OnePiecePiece type={type} color={color} className={className} />;
  }

  // --- Theme: 🦇 Batman Gotham City (Heroes vs Villains) ---
  if (theme === 'batman') {
    return <BatmanPiece type={type} color={color} className={className} />;
  }

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

  // --- Theme: ⚔️ Attack on Titan (Scouts vs Titans) ---
  if (theme === 'aot') {
    return (
      <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]">
        <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Scout Gradients */}
            <linearGradient id="scout-blade-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#CBD5E1" />
              <stop offset="100%" stopColor="#64748B" />
            </linearGradient>
            <linearGradient id="scout-cape-grad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4ADE80" />
              <stop offset="100%" stopColor="#15803D" />
            </linearGradient>
            <linearGradient id="scout-wing-blue" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#1D4ED8" />
            </linearGradient>
            <linearGradient id="scout-wing-white" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#E2E8F0" />
            </linearGradient>
            <linearGradient id="scout-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>

            {/* Titan Gradients */}
            <linearGradient id="titan-colossal-flesh" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="40%" stopColor="#B91C1C" />
              <stop offset="100%" stopColor="#450A0A" />
            </linearGradient>
            <linearGradient id="titan-crystal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E0F2FE" />
              <stop offset="50%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0369A1" />
            </linearGradient>
            <linearGradient id="titan-armor-plate" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FCD34D" />
              <stop offset="50%" stopColor="#B45309" />
              <stop offset="100%" stopColor="#451A03" />
            </linearGradient>
            <radialGradient id="titan-steam-cloud" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(254, 202, 202, 0.85)" />
              <stop offset="60%" stopColor="rgba(239, 68, 68, 0.4)" />
              <stop offset="100%" stopColor="rgba(239, 68, 68, 0)" />
            </radialGradient>
            <filter id="aot-glow-scout" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#22C55E" floodOpacity="0.6" />
            </filter>
            <filter id="aot-glow-titan" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#EF4444" floodOpacity="0.6" />
            </filter>
          </defs>

          {/* ================================================================= */}
          {/* WHITE PIECES: SCOUT REGIMENT / SURVEY CORPS (PARADIS ELDUR)       */}
          {/* ================================================================= */}
          {isWhite && (
            <g filter="url(#aot-glow-scout)">
              {/* WHITE PAWN: Wings of Freedom Shield Badge */}
              {type === 'p' && (
                <g strokeLinecap="round" strokeLinejoin="round">
                  {/* Shield Plate Base */}
                  <path
                    d="M 12 10 L 33 10 C 33 10 34 26 22.5 39 C 11 26 12 10 12 10 Z"
                    fill="#1E293B"
                    stroke="#F59E0B"
                    strokeWidth="1.8"
                  />
                  {/* Inner Shield Field */}
                  <path
                    d="M 14.5 12.5 L 30.5 12.5 C 30.5 12.5 31.5 24.5 22.5 35.5 C 13.5 24.5 14.5 12.5 14.5 12.5 Z"
                    fill="#0F172A"
                  />
                  {/* Blue Wing (Left/Back) */}
                  <path
                    d="M 17 26 C 16 23 15.5 19 16 15 C 17.5 16 19 18 19 20 C 19 17 19.5 15 20.5 14 C 21 16 21 19 20.5 22 C 21 19 22 17 22.5 15.5 C 23 18 22.5 22 21 27 L 17 26 Z"
                    fill="url(#scout-wing-blue)"
                    stroke="#1D4ED8"
                    strokeWidth="0.8"
                  />
                  {/* White Wing (Right/Front Overlapping) */}
                  <path
                    d="M 28 26 C 29 23 29.5 19 29 15 C 27.5 16 26 18 26 20 C 26 17 25.5 15 24.5 14 C 24 16 24 19 24.5 22 C 24 19 23 17 22.5 15.5 C 22 18 22.5 22 24 27 L 28 26 Z"
                    fill="url(#scout-wing-white)"
                    stroke="#CBD5E1"
                    strokeWidth="0.8"
                  />
                  {/* Shield Corner Rivets & Central Crest */}
                  <circle cx="22.5" cy="11.5" r="1" fill="#F59E0B" />
                  <path d="M 22.5 11.5 L 22.5 36" stroke="#F59E0B" strokeWidth="0.8" opacity="0.6" />
                </g>
              )}

              {/* WHITE KNIGHT: Scout Warhorse & ODM Gear Holster */}
              {type === 'n' && (
                <g strokeLinecap="round" strokeLinejoin="round">
                  {/* Base Platform */}
                  <path d="M 10 39 L 35 39 L 33 35 L 12 35 Z" fill="#334155" stroke="#22C55E" strokeWidth="1.2" />
                  {/* Scout Warhorse Silhouette */}
                  <path
                    d="M 21 8 C 30 9 37 15 36 36 L 14 36 C 14 28 23 30 22 17 C 23 19 18 23 16 25 C 13 27 12 30 9.5 29 C 8 28 10 26 9 25.5 C 7.5 25.5 9 27 7.5 27.5 C 6 27.5 4.5 26 5 23 C 5.5 21 10.5 13 10.5 13 C 10.5 13 12 11 12 9 C 11.5 8 11.5 7 12 6 C 13 5 15 8 15 8 L 17 8 C 17 8 18 6.5 19.5 5.5 C 20.5 5.5 21 8 21 8 Z"
                    fill="url(#scout-wing-white)"
                    stroke="#0F172A"
                    strokeWidth="1.4"
                  />
                  {/* Green Military Cape & Mane */}
                  <path d="M 19 11 C 24 13 28 18 27 27" stroke="#15803D" strokeWidth="2.2" fill="none" />
                  {/* Dual ODM Gas Canister Cylinders on Flank */}
                  <rect x="23" y="27" width="11" height="3" rx="1.5" fill="url(#scout-blade-grad)" stroke="#0F172A" strokeWidth="0.9" />
                  <rect x="22" y="31" width="12" height="3" rx="1.5" fill="url(#scout-blade-grad)" stroke="#0F172A" strokeWidth="0.9" />
                  {/* Gas Jet Exhaust Nozzle & Grapple Wire */}
                  <circle cx="34" cy="28.5" r="1" fill="#22C55E" />
                  <circle cx="34" cy="32.5" r="1" fill="#22C55E" />
                  <path d="M 23 28.5 L 17 25" stroke="#F59E0B" strokeWidth="1" />
                  {/* Glowing Emerald Eye */}
                  <circle cx="8" cy="23.5" r="1.2" fill="#22C55E" stroke="#0F172A" strokeWidth="0.5" />
                </g>
              )}

              {/* WHITE BISHOP: Levi & Hange Emblem (Special Ops Blades & Glasses Crest) */}
              {type === 'b' && (
                <g strokeLinecap="round" strokeLinejoin="round">
                  {/* Pedestal Base */}
                  <path d="M 10 39.5 L 35 39.5 L 33 36 L 12 36 Z" fill="#334155" stroke="#F59E0B" strokeWidth="1.4" />
                  {/* Survey Corps Cape Hood Mitre */}
                  <path
                    d="M 14 36 C 13 31 15 27 17 25 C 16 23 13 21 13 18 C 13 13 18 8 22.5 6 C 27 8 32 13 32 18 C 32 21 29 23 28 25 C 30 27 32 31 31 36 Z"
                    fill="url(#scout-cape-grad)"
                    stroke="#0F172A"
                    strokeWidth="1.5"
                  />
                  {/* Levi Spinning Reverse-Grip Dual Blades */}
                  <path d="M 12 18 L 33 28" stroke="url(#scout-blade-grad)" strokeWidth="2.2" />
                  <path d="M 33 18 L 12 28" stroke="url(#scout-blade-grad)" strokeWidth="2.2" />
                  <path d="M 11 16 L 14 20" stroke="#F59E0B" strokeWidth="2.5" />
                  <path d="M 34 16 L 31 20" stroke="#F59E0B" strokeWidth="2.5" />
                  {/* Hange Tactical Monocle / Research Crest */}
                  <circle cx="22.5" cy="18" r="3.2" fill="#0F172A" stroke="#F59E0B" strokeWidth="1.2" />
                  <circle cx="22.5" cy="18" r="1.5" fill="#38BDF8" />
                  {/* Survey Corps Wings Top Finial */}
                  <circle cx="22.5" cy="5" r="2.2" fill="#F59E0B" stroke="#0F172A" strokeWidth="1" />
                </g>
              )}

              {/* WHITE ROOK: Wall Maria Fortress Monolith Tower */}
              {type === 'r' && (
                <g strokeLinecap="round" strokeLinejoin="round">
                  {/* Wall Maria Stone Foundation */}
                  <path d="M 8 39.5 L 37 39.5 L 35 34 L 10 34 Z" fill="#1F232B" stroke="#64748B" strokeWidth="1.4" />
                  {/* 50-Meter Monolithic Stone Tower Shaft */}
                  <path d="M 12.5 34 L 13.5 15 L 31.5 15 L 32.5 34 Z" fill="url(#scout-wing-white)" stroke="#1E293B" strokeWidth="1.6" />
                  {/* Fortified Stone Battlements & Crenellations */}
                  <path
                    d="M 10 15 L 10 7 L 14 7 L 14 10 L 19 10 L 19 7 L 26 7 L 26 10 L 31 10 L 31 7 L 35 7 L 35 15 Z"
                    fill="#334155"
                    stroke="#1E293B"
                    strokeWidth="1.5"
                  />
                  {/* Wall Maria Stone Masonry Grooves */}
                  <path d="M 14 22 L 31 22 M 13.5 28 L 31.5 28" stroke="#64748B" strokeWidth="1" />
                  <path d="M 22.5 15 L 22.5 22 M 18 22 L 18 28 M 27 22 L 27 28 M 22.5 28 L 22.5 34" stroke="#64748B" strokeWidth="0.9" />
                  {/* Iron Cannon Embrasures & Green Banner */}
                  <circle cx="22.5" cy="19" r="1.8" fill="#15803D" stroke="#F59E0B" strokeWidth="0.8" />
                  <path d="M 11 34.5 L 34 34.5" stroke="#22C55E" strokeWidth="2.2" />
                </g>
              )}

              {/* WHITE QUEEN: Mikasa Scarf Symbol + Dual Swords */}
              {type === 'q' && (
                <g strokeLinecap="round" strokeLinejoin="round">
                  {/* Base Throne Pedestal */}
                  <path d="M 10 39.5 L 35 39.5 C 35 36 33 34 31 32 L 14 32 C 12 34 10 36 10 39.5 Z" fill="#1E293B" stroke="#DC2626" strokeWidth="1.5" />
                  {/* Vertical Slasher Blades */}
                  <path d="M 16 32 L 16 9 L 19 12 L 19 32 Z" fill="url(#scout-blade-grad)" stroke="#0F172A" strokeWidth="1.2" />
                  <path d="M 29 32 L 29 9 L 26 12 L 26 32 Z" fill="url(#scout-blade-grad)" stroke="#0F172A" strokeWidth="1.2" />
                  <path d="M 22.5 32 L 22.5 5 L 24 8 L 24 32 Z" fill="url(#scout-blade-grad)" stroke="#0F172A" strokeWidth="1.2" />
                  {/* Mikasa Signature Crimson Wrapped Scarf */}
                  <path
                    d="M 11 26 C 14 20 22.5 19 34 23 C 35 27 33 31 29 32 C 22.5 30 18 31 11 26 Z"
                    fill="#DC2626"
                    stroke="#991B1B"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 13 28 C 17 23 28 23 32 27"
                    stroke="#F87171"
                    strokeWidth="1.4"
                    fill="none"
                  />
                  {/* Scarf Tail Draping Down */}
                  <path d="M 28 26 C 31 28 32 34 30 38 L 27 34 Z" fill="#DC2626" stroke="#991B1B" strokeWidth="1" />
                  {/* Emerald Brooch Pin & Blade Tips */}
                  <circle cx="22.5" cy="24" r="2.2" fill="#22C55E" stroke="#F59E0B" strokeWidth="1" />
                  <circle cx="16" cy="7.5" r="1.5" fill="#F59E0B" stroke="#0F172A" strokeWidth="0.8" />
                  <circle cx="22.5" cy="4" r="2" fill="#F59E0B" stroke="#0F172A" strokeWidth="1" />
                  <circle cx="29" cy="7.5" r="1.5" fill="#F59E0B" stroke="#0F172A" strokeWidth="0.8" />
                </g>
              )}

              {/* WHITE KING: Erwin / Eren Crown with Crossed ODM Blades */}
              {type === 'k' && (
                <g strokeLinecap="round" strokeLinejoin="round">
                  {/* Royal Commander Mantle Base */}
                  <path d="M 10 39.5 L 35 39.5 C 35 35 33 33 31 31 L 14 31 C 12 33 10 35 10 39.5 Z" fill="#1E293B" stroke="#22C55E" strokeWidth="1.5" />
                  {/* Massive Crossed Ultrahard Steel ODM Blades */}
                  <path d="M 7 32 L 38 7 L 36 6 L 5 31 Z" fill="url(#scout-blade-grad)" stroke="#0F172A" strokeWidth="1.2" />
                  <path d="M 38 32 L 7 7 L 9 6 L 40 31 Z" fill="url(#scout-blade-grad)" stroke="#0F172A" strokeWidth="1.2" />
                  {/* Trigger Grips & Wire Coils */}
                  <rect x="5" y="30" width="4" height="6" rx="1" fill="#D97706" stroke="#0F172A" strokeWidth="1" />
                  <rect x="36" y="30" width="4" height="6" rx="1" fill="#D97706" stroke="#0F172A" strokeWidth="1" />
                  {/* Commander's Regal Armor Body */}
                  <path
                    d="M 14 31 C 13 25 15 20 22.5 19 C 30 20 32 25 31 31 Z"
                    fill="url(#scout-cape-grad)"
                    stroke="#0F172A"
                    strokeWidth="1.5"
                  />
                  {/* Wings of Freedom Chest Crest */}
                  <path d="M 19 25 L 22.5 29 L 26 25" stroke="#F59E0B" strokeWidth="1.8" fill="none" />
                  {/* Commander Erwin Golden Triple-Crown Finial */}
                  <path
                    d="M 14 17 L 16 11 L 19.5 15 L 22.5 8 L 25.5 15 L 29 11 L 31 17 Z"
                    fill="url(#scout-gold-grad)"
                    stroke="#0F172A"
                    strokeWidth="1.4"
                  />
                  {/* Central Emerald Star Jewel */}
                  <circle cx="22.5" cy="8" r="2.2" fill="#22C55E" stroke="#0F172A" strokeWidth="0.8" />
                  <circle cx="16" cy="11" r="1.3" fill="#38BDF8" stroke="#0F172A" strokeWidth="0.6" />
                  <circle cx="29" cy="11" r="1.3" fill="#38BDF8" stroke="#0F172A" strokeWidth="0.6" />
                </g>
              )}
            </g>
          )}

          {/* ================================================================= */}
          {/* BLACK PIECES: THE NINE TITANS / MARLEY EMPIRE                      */}
          {/* ================================================================= */}
          {!isWhite && (
            <g filter="url(#aot-glow-titan)">
              {/* BLACK PAWN: Pure Titan Silhouette with Menacing Grin */}
              {type === 'p' && (
                <g strokeLinecap="round" strokeLinejoin="round">
                  {/* Titan Ground Dust Base */}
                  <path d="M 11 39.5 L 34 39.5 L 32 35 L 13 35 Z" fill="#18181B" stroke="#EF4444" strokeWidth="1.2" />
                  {/* Pure Titan Muscular Torso */}
                  <path
                    d="M 13 35 C 13 28 17 26 18 22 C 16 21 14 19 14 16 C 14 10 18 7 22.5 7 C 27 7 31 10 31 16 C 31 19 29 21 27 22 C 28 26 32 28 32 35 Z"
                    fill="url(#titan-colossal-flesh)"
                    stroke="#18181B"
                    strokeWidth="1.5"
                  />
                  {/* Menacing Pure Titan Wide Grinning Mouth with Teeth */}
                  <path d="M 17 17 C 19 21 26 21 28 17 Z" fill="#450A0A" stroke="#EF4444" strokeWidth="1" />
                  <path d="M 18 18 L 27 18 M 19.5 17 L 19.5 19 M 22.5 17 L 22.5 20 M 25.5 17 L 25.5 19" stroke="#FEF08A" strokeWidth="1.2" />
                  {/* Glowing Amber Eyes */}
                  <circle cx="18.5" cy="13.5" r="1.4" fill="#FACC15" stroke="#18181B" strokeWidth="0.6" />
                  <circle cx="26.5" cy="13.5" r="1.4" fill="#FACC15" stroke="#18181B" strokeWidth="0.6" />
                  {/* Neck Muscle Sinew Lines */}
                  <path d="M 19 24 L 20 34 M 26 24 L 25 34 M 22.5 23 L 22.5 35" stroke="#7F1D1D" strokeWidth="1.2" />
                </g>
              )}

              {/* BLACK KNIGHT: Cart Titan / Sprinting Quadrupedal Titan */}
              {type === 'n' && (
                <g strokeLinecap="round" strokeLinejoin="round">
                  {/* Base Platform */}
                  <path d="M 9 39 L 36 39 L 34 35 L 11 35 Z" fill="#18181B" stroke="#B45309" strokeWidth="1.2" />
                  {/* Cart Titan Elongated Head & Quadrupedal Body Profile */}
                  <path
                    d="M 22 8 C 32 10 38 16 38 36 L 14 36 C 14 28 20 30 20 18 C 21 21 16 24 14 25 C 10 27 6 29 4 27 C 3.5 25 7 22 8 20 C 6 18 8 13 12 12 C 13 10 16 9 19 8 Z"
                    fill="url(#titan-colossal-flesh)"
                    stroke="#18181B"
                    strokeWidth="1.5"
                  />
                  {/* Cart Titan Reinforced Mechanical Faceplate & Muzzle */}
                  <path d="M 4 27 L 14 25 L 16 29 L 6 31 Z" fill="#475569" stroke="#94A3B8" strokeWidth="1" />
                  <path d="M 7 28 L 13 27" stroke="#F59E0B" strokeWidth="1.2" />
                  {/* Armored Back Artillery Mount Straps */}
                  <path d="M 20 15 C 26 18 30 24 29 32" stroke="#78350F" strokeWidth="2.4" fill="none" />
                  <rect x="25" y="19" width="9" height="5" rx="1" fill="#334155" stroke="#94A3B8" strokeWidth="1" />
                  {/* Glowing Amber Eye */}
                  <circle cx="11.5" cy="16.5" r="1.3" fill="#FACC15" stroke="#18181B" strokeWidth="0.6" />
                </g>
              )}

              {/* BLACK BISHOP: Beast Titan / Jaw Titan Armored Jawbones */}
              {type === 'b' && (
                <g strokeLinecap="round" strokeLinejoin="round">
                  {/* Pedestal Base */}
                  <path d="M 10 39.5 L 35 39.5 L 33 36 L 12 36 Z" fill="#18181B" stroke="#B45309" strokeWidth="1.4" />
                  {/* Beast Titan Fur-Covered Body Silhouette */}
                  <path
                    d="M 14 36 C 12 31 14 27 16 25 C 15 22 13 19 13 15 C 13 10 18 6 22.5 5 C 27 6 32 10 32 15 C 32 19 30 22 29 25 C 31 27 33 31 31 36 Z"
                    fill="#29140C"
                    stroke="#18181B"
                    strokeWidth="1.5"
                  />
                  {/* Jaw Titan Hardened Bone Armored Mask */}
                  <path
                    d="M 16 16 L 22.5 11 L 29 16 L 27 24 L 22.5 28 L 18 24 Z"
                    fill="url(#titan-armor-plate)"
                    stroke="#78350F"
                    strokeWidth="1.4"
                  />
                  {/* Serrated Razor Hardened Teeth */}
                  <path d="M 19 23 L 26 23" stroke="#FEF08A" strokeWidth="1.8" />
                  <path d="M 20 21 L 20 24 M 22.5 21 L 22.5 25 M 25 21 L 25 24" stroke="#451A03" strokeWidth="1" />
                  {/* Beast Titan Glowing Primal Amber Eyes */}
                  <circle cx="19.5" cy="16" r="1.3" fill="#EF4444" stroke="#18181B" strokeWidth="0.6" />
                  <circle cx="25.5" cy="16" r="1.3" fill="#EF4444" stroke="#18181B" strokeWidth="0.6" />
                  {/* Top Bone Spire Finial */}
                  <circle cx="22.5" cy="4" r="2.2" fill="#D97706" stroke="#18181B" strokeWidth="1" />
                </g>
              )}

              {/* BLACK ROOK: Armored Titan Interlocking Hardened Plate Armor */}
              {type === 'r' && (
                <g strokeLinecap="round" strokeLinejoin="round">
                  {/* Massive Hardened Base */}
                  <path d="M 8 39.5 L 37 39.5 L 35 34 L 10 34 Z" fill="#18181B" stroke="#B45309" strokeWidth="1.4" />
                  {/* Armored Fortress Torso */}
                  <path d="M 12 34 L 13 16 L 32 16 L 33 34 Z" fill="url(#titan-colossal-flesh)" stroke="#18181B" strokeWidth="1.6" />
                  {/* Heavy Interlocking Gold Armor Plates (Segmented) */}
                  <rect x="14" y="27" width="8" height="6" rx="1" fill="url(#titan-armor-plate)" stroke="#78350F" strokeWidth="1" />
                  <rect x="23" y="27" width="8" height="6" rx="1" fill="url(#titan-armor-plate)" stroke="#78350F" strokeWidth="1" />
                  <rect x="14.5" y="20" width="16" height="6" rx="1" fill="url(#titan-armor-plate)" stroke="#78350F" strokeWidth="1" />
                  {/* Fortified Heavy Shoulder Pauldrons & Castle Crenellations */}
                  <path
                    d="M 9 16 L 9 8 L 13 8 L 13 11 L 18 11 L 18 8 L 27 8 L 27 11 L 32 11 L 32 8 L 36 8 L 36 16 Z"
                    fill="url(#titan-armor-plate)"
                    stroke="#451A03"
                    strokeWidth="1.5"
                  />
                  {/* Thermal Exhaust Slits in Armor */}
                  <path d="M 17 23 L 20 23 M 25 23 L 28 23" stroke="#EF4444" strokeWidth="1.4" />
                  <path d="M 11 34.5 L 34 34.5" stroke="#EF4444" strokeWidth="2.2" />
                </g>
              )}

              {/* BLACK QUEEN: Female Titan Hardened Crystal Icon */}
              {type === 'q' && (
                <g strokeLinecap="round" strokeLinejoin="round">
                  {/* Base Throne Pedestal */}
                  <path d="M 10 39.5 L 35 39.5 C 35 36 33 34 31 32 L 14 32 C 12 34 10 36 10 39.5 Z" fill="#18181B" stroke="#0284C7" strokeWidth="1.5" />
                  {/* Hardened Diamond Crystal Shards (Spikes) */}
                  <polygon points="12,26 15,9 18,26" fill="url(#titan-crystal-grad)" stroke="#0369A1" strokeWidth="1" />
                  <polygon points="20,24 22.5,5 25,24" fill="url(#titan-crystal-grad)" stroke="#0369A1" strokeWidth="1.2" />
                  <polygon points="27,26 30,9 33,26" fill="url(#titan-crystal-grad)" stroke="#0369A1" strokeWidth="1" />
                  {/* Female Titan Muscle & Hardened Skin Silhouette */}
                  <path
                    d="M 11 32 C 13 25 15 22 22.5 21 C 30 22 32 25 34 32 Z"
                    fill="url(#titan-colossal-flesh)"
                    stroke="#18181B"
                    strokeWidth="1.5"
                  />
                  {/* Hardened Crystal Facets on Forearms & Chest */}
                  <polygon points="18,26 22.5,23 27,26 22.5,29" fill="url(#titan-crystal-grad)" stroke="#E0F2FE" strokeWidth="1" />
                  {/* Crystal Orb Jewels */}
                  <circle cx="15" cy="8" r="1.8" fill="#38BDF8" stroke="#0F172A" strokeWidth="0.8" />
                  <circle cx="22.5" cy="4" r="2.2" fill="#E0F2FE" stroke="#0284C7" strokeWidth="1" />
                  <circle cx="30" cy="8" r="1.8" fill="#38BDF8" stroke="#0F172A" strokeWidth="0.8" />
                  <path d="M 12 35.5 L 33 35.5" stroke="#38BDF8" strokeWidth="2" />
                </g>
              )}

              {/* BLACK KING: Colossal Titan Head Outline with Steam Aura */}
              {type === 'k' && (
                <g strokeLinecap="round" strokeLinejoin="round">
                  {/* Thermal Steam Aura Background Clouds */}
                  <circle cx="15" cy="11" r="5" fill="url(#titan-steam-cloud)" />
                  <circle cx="30" cy="11" r="5" fill="url(#titan-steam-cloud)" />
                  <circle cx="22.5" cy="6" r="6" fill="url(#titan-steam-cloud)" />

                  {/* King Base Stand */}
                  <path d="M 10 39.5 L 35 39.5 C 35 35 33 33 31 31 L 14 31 C 12 33 10 35 10 39.5 Z" fill="#18181B" stroke="#EF4444" strokeWidth="1.6" />

                  {/* Colossal Titan Exposed Striated Muscle Chest */}
                  <path
                    d="M 13 31 C 11 25 14 19 22.5 18 C 31 19 34 25 32 31 Z"
                    fill="url(#titan-colossal-flesh)"
                    stroke="#18181B"
                    strokeWidth="1.5"
                  />
                  {/* Striated Sinew Bands */}
                  <path d="M 17 24 L 20 31 M 28 24 L 25 31 M 22.5 21 L 22.5 31" stroke="#450A0A" strokeWidth="1.4" />

                  {/* Colossal Titan Exposed Muscle Skull */}
                  <path
                    d="M 16 18 C 15 13 17 8 22.5 8 C 28 8 30 13 29 18 C 29 23 27 25 22.5 25 C 18 25 16 23 16 18 Z"
                    fill="url(#titan-colossal-flesh)"
                    stroke="#18181B"
                    strokeWidth="1.6"
                  />

                  {/* Exposed Jaw & Teeth (Skinless) */}
                  <path d="M 18 20 C 19 23 26 23 27 20 Z" fill="#450A0A" stroke="#EF4444" strokeWidth="1" />
                  <path d="M 19 20.5 L 26 20.5 M 20.5 19.5 L 20.5 21.5 M 22.5 19.5 L 22.5 22 M 24.5 19.5 L 24.5 21.5" stroke="#FEF08A" strokeWidth="1.2" />

                  {/* Sunken Hollow Glowing Eyes */}
                  <circle cx="19" cy="14" r="1.4" fill="#FACC15" stroke="#450A0A" strokeWidth="0.8" />
                  <circle cx="26" cy="14" r="1.4" fill="#FACC15" stroke="#450A0A" strokeWidth="0.8" />

                  {/* Colossal Thermal Crown / Steam Vent Finial */}
                  <path d="M 22.5 3 L 22.5 7 M 19 4.5 L 20.5 6.5 M 26 4.5 L 24.5 6.5" stroke="#EF4444" strokeWidth="1.8" />
                  <circle cx="22.5" cy="3" r="1.8" fill="#FACC15" stroke="#EF4444" strokeWidth="0.8" />
                </g>
              )}
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
});
