import React from 'react';
import { PieceType, PieceColor } from '../../types/chess';

interface OnePiecePieceProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
}

export const OnePiecePiece: React.FC<OnePiecePieceProps> = ({
  type,
  color,
  className = 'w-full h-full'
}) => {
  const isWhite = color === 'w'; // White = Straw Hats, Black = Marines

  // White: Straw Hats (Warm Reds, Golds, Sunny Wood)
  const heroPrimary = '#ef4444'; 
  const heroSecondary = '#b91c1c';
  const heroAccent = '#facc15';

  // Black: Marines / World Government (Deep Navy, Justice White, Gold)
  const villainPrimary = '#0b1d3a';
  const villainSecondary = '#1e3a8a';
  const villainAccent = '#facc15';

  const strokeColor = isWhite ? heroAccent : '#3b82f6';
  const fillColor = isWhite ? `url(#strawhat-grad-${type})` : `url(#marine-grad-${type})`;

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-none drop-shadow-lg">
      <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`strawhat-grad-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={heroPrimary} />
            <stop offset="100%" stopColor={heroSecondary} />
          </linearGradient>

          <linearGradient id={`marine-grad-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={villainPrimary} />
            <stop offset="100%" stopColor={villainSecondary} />
          </linearGradient>

          <filter id={`haki-glow-${color}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor={isWhite ? '#facc15' : '#a855f7'} floodOpacity="0.8" />
          </filter>
        </defs>

        {isWhite && (
          <g stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {type === 'k' && (
              <g>
                {/* King: Luffy (Gear 5 vibe) */}
                <path d="M 10 39 L 35 39 C 33 33 31 29 28 26 L 17 26 C 14 29 12 33 10 39 Z" fill={fillColor} />
                <path d="M 12 35 L 33 35" stroke={heroAccent} strokeWidth="2" />
                <circle cx="22.5" cy="18" r="7" fill={fillColor} />
                {/* Straw Hat Brim */}
                <ellipse cx="22.5" cy="15" rx="14" ry="3" fill="#facc15" stroke="#b45309" strokeWidth="2" />
                {/* Hat Top */}
                <path d="M 15 14 C 15 7 30 7 30 14 Z" fill="#facc15" stroke="#b45309" strokeWidth="2" />
                {/* Red Ribbon */}
                <path d="M 16 13 C 20 15 25 15 29 13 C 29 14 29 14.5 28.5 15 C 24 16.5 21 16.5 16.5 15 Z" fill="#ef4444" stroke="none" />
                {/* Cross */}
                <line x1="22.5" y1="2" x2="22.5" y2="7" stroke={heroAccent} strokeWidth="2" />
                <line x1="20" y1="4.5" x2="25" y2="4.5" stroke={heroAccent} strokeWidth="2" />
              </g>
            )}
            {type === 'q' && (
              <g>
                {/* Queen: Nami (Clima-Tact / Crown) */}
                <path d="M 11 39 L 34 39 C 32 32 30 29 27 26 L 18 26 C 15 29 13 32 11 39 Z" fill={fillColor} />
                <path d="M 13 35 L 32 35" stroke={heroAccent} strokeWidth="2" />
                <path d="M 12 16 L 17 26 L 22.5 18 L 28 26 L 33 16 L 27 21 L 22.5 11 L 18 21 Z" fill={fillColor} />
                <circle cx="12" cy="15" r="2" fill="#60a5fa" stroke="none" />
                <circle cx="22.5" cy="10" r="2.5" fill={heroAccent} stroke="none" />
                <circle cx="33" cy="15" r="2" fill="#60a5fa" stroke="none" />
              </g>
            )}
            {type === 'b' && (
              <g>
                {/* Bishop: Zoro (Swords) */}
                <path d="M 12 39 L 33 39 L 31 35 L 14 35 Z" fill={fillColor} />
                <path d="M 15 35 C 15 30 17 27 19 25 C 19 25 16 25 16 20 C 16 15 20 11 22.5 9 C 25 11 29 15 29 20 C 29 25 26 25 26 25 C 28 27 30 30 30 35 Z" fill={fillColor} />
                <line x1="16" y1="20" x2="29" y2="28" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="16" y1="28" x2="29" y2="20" stroke="#cbd5e1" strokeWidth="2" />
                <line x1="22.5" y1="12" x2="22.5" y2="28" stroke="#cbd5e1" strokeWidth="2" />
                <circle cx="22.5" cy="7" r="2" fill={heroAccent} />
              </g>
            )}
            {type === 'n' && (
              <g>
                {/* Knight: Chopper/Thousand Sunny (Figurehead) */}
                <path d="M 12 39 L 33 39 C 33 33 30 30 28 28 L 17 28 C 15 30 12 33 12 39 Z" fill={fillColor} />
                {/* Lion Mane (Sunny) */}
                <circle cx="22.5" cy="18" r="10" fill="#facc15" stroke="#ea580c" strokeWidth="2" strokeDasharray="3 3" />
                {/* Face */}
                <circle cx="22.5" cy="18" r="6" fill="#fef08a" stroke="none" />
                {/* Nose/Mouth */}
                <circle cx="22.5" cy="20" r="1.5" fill="#ef4444" stroke="none" />
                <path d="M 20 21 Q 22.5 23 25 21" stroke="#000" strokeWidth="1" fill="none" />
              </g>
            )}
            {type === 'r' && (
              <g>
                {/* Rook: Wano Castle */}
                <path d="M 11 39 L 34 39 L 32 30 L 13 30 Z" fill={fillColor} />
                <path d="M 14 30 L 31 30 L 29 22 L 16 22 Z" fill={fillColor} />
                <path d="M 12 22 L 33 22 L 33 18 L 29 18 L 29 15 L 25 15 L 25 18 L 20 18 L 20 15 L 16 15 L 16 18 L 12 18 Z" fill={fillColor} />
                <path d="M 10 22 C 15 20 20 19 22.5 19 C 25 19 30 20 35 22" stroke={heroAccent} strokeWidth="2" fill="none" />
              </g>
            )}
            {type === 'p' && (
              <g>
                {/* Pawn: Grand Fleet */}
                <path d="M 13 39 L 32 39 C 31 32 28 28 25 26 L 20 26 C 17 28 14 32 13 39 Z" fill={fillColor} />
                <circle cx="22.5" cy="18" r="6" fill={fillColor} />
                {/* Crossbones on head */}
                <path d="M 19 15 L 26 21 M 19 21 L 26 15" stroke="#facc15" strokeWidth="1.5" />
              </g>
            )}
          </g>
        )}

        {/* ========================================================================= */}
        {/* VILLAINS (BLACK) : MARINES                                                */}
        {/* ========================================================================= */}
        {!isWhite && (
          <g stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {type === 'k' && (
              <g>
                {/* King: Akainu (Magma/Marine Cap) */}
                <path d="M 10 39 L 35 39 C 33 33 31 29 28 26 L 17 26 C 14 29 12 33 10 39 Z" fill={fillColor} />
                <path d="M 12 35 L 33 35" stroke={villainAccent} strokeWidth="2" />
                <circle cx="22.5" cy="18" r="7" fill={fillColor} />
                {/* Marine Cap */}
                <path d="M 13 15 Q 22.5 10 32 15 L 29 20 L 16 20 Z" fill="#ffffff" stroke={villainSecondary} />
                {/* JUSTICE Kanji (simplified) */}
                <path d="M 21 16 L 24 16 M 22.5 14 L 22.5 18" stroke={villainSecondary} strokeWidth="1.2" />
                {/* Cross */}
                <line x1="22.5" y1="2" x2="22.5" y2="7" stroke={villainAccent} strokeWidth="2" />
                <line x1="20" y1="4.5" x2="25" y2="4.5" stroke={villainAccent} strokeWidth="2" />
              </g>
            )}
            {type === 'q' && (
              <g>
                {/* Queen: Kizaru / Admiral */}
                <path d="M 11 39 L 34 39 C 32 32 30 29 27 26 L 18 26 C 15 29 13 32 11 39 Z" fill={fillColor} />
                <path d="M 13 35 L 32 35" stroke={villainAccent} strokeWidth="2" />
                <path d="M 12 16 L 17 26 L 22.5 18 L 28 26 L 33 16 L 27 21 L 22.5 11 L 18 21 Z" fill={fillColor} />
                <circle cx="12" cy="15" r="2" fill="#eab308" stroke="none" />
                <circle cx="22.5" cy="10" r="2.5" fill={villainAccent} stroke="none" />
                <circle cx="33" cy="15" r="2" fill="#eab308" stroke="none" />
              </g>
            )}
            {type === 'b' && (
              <g>
                {/* Bishop: Fujitora / Aokiji */}
                <path d="M 12 39 L 33 39 L 31 35 L 14 35 Z" fill={fillColor} />
                <path d="M 15 35 C 15 30 17 27 19 25 C 19 25 16 25 16 20 C 16 15 20 11 22.5 9 C 25 11 29 15 29 20 C 29 25 26 25 26 25 C 28 27 30 30 30 35 Z" fill={fillColor} />
                <circle cx="22.5" cy="7" r="2" fill={villainAccent} />
                <path d="M 19 15 L 26 21" stroke="#38bdf8" strokeWidth="2" /> {/* Ice slash */}
                <path d="M 16 18 L 29 18" stroke="#a855f7" strokeWidth="2" /> {/* Gravity slash */}
              </g>
            )}
            {type === 'n' && (
              <g>
                {/* Knight: Pacifista */}
                <path d="M 12 39 L 33 39 C 33 33 30 30 28 28 L 17 28 C 15 30 12 33 12 39 Z" fill={fillColor} />
                {/* Robot Head */}
                <rect x="16" y="12" width="13" height="15" rx="3" fill="#94a3b8" stroke={villainSecondary} strokeWidth="1.5" />
                <line x1="16" y1="18" x2="29" y2="18" stroke={villainSecondary} strokeWidth="1.5" />
                {/* Glowing Laser Eye */}
                <circle cx="22.5" cy="15" r="2" fill="#ef4444" stroke="none" filter="url(#haki-glow-b)" />
              </g>
            )}
            {type === 'r' && (
              <g>
                {/* Rook: Marineford Fortress */}
                <path d="M 11 39 L 34 39 L 32 30 L 13 30 Z" fill={fillColor} />
                <path d="M 14 30 L 31 30 L 29 22 L 16 22 Z" fill="#ffffff" stroke={villainSecondary} />
                <path d="M 12 22 L 33 22 L 33 18 L 29 18 L 29 15 L 25 15 L 25 18 L 20 18 L 20 15 L 16 15 L 16 18 L 12 18 Z" fill={fillColor} />
                {/* Marine Seagull Logo Simple */}
                <path d="M 18 26 C 21 24 24 24 27 26" stroke={villainSecondary} strokeWidth="1.5" fill="none" />
              </g>
            )}
            {type === 'p' && (
              <g>
                {/* Pawn: Marine Soldier */}
                <path d="M 13 39 L 32 39 C 31 32 28 28 25 26 L 20 26 C 17 28 14 32 13 39 Z" fill={fillColor} />
                <circle cx="22.5" cy="18" r="6" fill={fillColor} />
                <path d="M 16 15 C 20 12 25 12 29 15" stroke="#ffffff" strokeWidth="2" fill="none" /> {/* Sailor Cap */}
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};
