import React from 'react';
import { PieceType, PieceColor } from '../../types/chess';

interface BatmanPieceProps {
  type: PieceType;
  color: PieceColor;
  className?: string;
}

export const BatmanPiece: React.FC<BatmanPieceProps> = ({
  type,
  color,
  className = 'w-full h-full'
}) => {
  const isHero = color === 'w'; // White = Bat-Family Heroes, Black = Arkham Villains

  // Color schemes
  // Heroes: Night Gotham Titanium / Midnight Charcoal & Neon Bat-Signal Yellow
  const heroPrimary = '#1E293B';
  const heroSecondary = '#334155';
  const heroAccent = '#EAB308'; // Neon Yellow
  const heroStroke = '#FACC15';

  // Villains: Arkham Joker Purple & Acid Green
  const villainPrimary = '#3B0764'; // Deep Joker Purple
  const villainSecondary = '#581C87';
  const villainAccent = '#22C55E'; // Acid Green / Neon Green
  const villainStroke = '#A855F7';

  const strokeColor = isHero ? heroStroke : '#4ADE80';
  const fillColor = isHero ? `url(#hero-grad-${type})` : `url(#villain-grad-${type})`;

  return (
    <div className="relative w-full h-full flex items-center justify-center select-none pointer-events-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
      <svg viewBox="0 0 45 45" className={className} xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Hero Gradients */}
          <linearGradient id={`hero-grad-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="60%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0B0F19" />
          </linearGradient>

          {/* Villain Gradients */}
          <linearGradient id={`villain-grad-${type}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6B21A8" />
            <stop offset="50%" stopColor="#4C1D95" />
            <stop offset="100%" stopColor="#1E1B4B" />
          </linearGradient>

          {/* Joker Face Pale Glow */}
          <radialGradient id="joker-face-grad" cx="50%" cy="40%" r="55%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#F1F5F9" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </radialGradient>

          {/* Joker Hair Toxic Green */}
          <linearGradient id="joker-hair-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4ADE80" />
            <stop offset="50%" stopColor="#16A34A" />
            <stop offset="100%" stopColor="#14532D" />
          </linearGradient>

          <filter id={`neon-glow-${color}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0" stdDeviation="1.5" floodColor={isHero ? '#EAB308' : '#22C55E'} floodOpacity="0.8" />
          </filter>
        </defs>

        {/* ========================================================================= */}
        {/* HEROES (WHITE) : BAT-FAMILY                                              */}
        {/* ========================================================================= */}
        {isHero && (
          <g stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* KING: THE DARK KNIGHT (BATMAN) */}
            {type === 'k' && (
              <g>
                {/* Armored Base */}
                <path d="M 9 39.5 L 36 39.5 C 34 35 30 31 27 28 L 18 28 C 15 31 11 35 9 39.5 Z" fill={fillColor} />
                {/* Base Trim */}
                <line x1="12" y1="36.5" x2="33" y2="36.5" stroke={heroAccent} strokeWidth="1.8" />
                {/* Bat-Suit Torso & Scalloped Cape */}
                <path d="M 18 28 L 13 18 L 17 21 L 22.5 18 L 28 21 L 32 18 L 27 28 Z" fill={fillColor} />
                {/* Cowl with Pointed Bat Ears & Head */}
                <path d="M 17 18 L 15 6 L 19.5 11 L 25.5 11 L 30 6 L 28 18 Z" fill={fillColor} />
                {/* King Cross Finial over Cowl */}
                <line x1="22.5" y1="3" x2="22.5" y2="7" stroke={heroAccent} strokeWidth="2" />
                <line x1="20.5" y1="4.5" x2="24.5" y2="4.5" stroke={heroAccent} strokeWidth="2" />
                {/* Neon Bat-Signal Chest Insignia */}
                <path
                  d="M 22.5 23 C 20 23 18 24.2 17 25.5 C 18.5 26.8 21 27.5 22.5 27.5 C 24 27.5 26.5 26.8 28 25.5 C 27 24.2 25 23 22.5 23 Z"
                  fill={heroAccent}
                  stroke="none"
                />
                {/* Glowing Slit Cowl Eyes */}
                <polygon points="19,13 21.5,14 19.5,14.5" fill="#FFFFFF" stroke="none" />
                <polygon points="26,13 23.5,14 25.5,14.5" fill="#FFFFFF" stroke="none" />
              </g>
            )}

            {/* QUEEN: CATWOMAN (SELINA KYLE) */}
            {type === 'q' && (
              <g>
                {/* Sleek Queen Base */}
                <path d="M 10 39.5 L 35 39.5 C 34 35 30 31 27 28 L 18 28 C 15 31 11 35 10 39.5 Z" fill={fillColor} />
                <line x1="13" y1="36.5" x2="32" y2="36.5" stroke={heroAccent} strokeWidth="1.6" />
                {/* Corset & Shoulders */}
                <path d="M 18 28 L 15 17 L 22.5 20 L 30 17 L 27 28 Z" fill={fillColor} />
                {/* Cat Mask Head with Pointed Ears */}
                <path d="M 18 20 L 16 11 L 18 6 L 21 11 L 24 11 L 27 6 L 29 11 L 27 20 Z" fill={fillColor} />
                {/* Ear Inner Accents */}
                <polygon points="18,7 17,11 20,10" fill={heroAccent} stroke="none" />
                <polygon points="27,7 28,11 25,10" fill={heroAccent} stroke="none" />
                {/* Night-Vision Cat Goggles */}
                <ellipse cx="19.5" cy="14" rx="2.5" ry="1.6" fill="#FACC15" stroke="#CA8A04" strokeWidth="0.8" />
                <ellipse cx="25.5" cy="14" rx="2.5" ry="1.6" fill="#FACC15" stroke="#CA8A04" strokeWidth="0.8" />
                {/* Queen Collar Jewel */}
                <circle cx="22.5" cy="24" r="1.8" fill={heroAccent} stroke="none" />
              </g>
            )}

            {/* BISHOP: NIGHTWING */}
            {type === 'b' && (
              <g>
                {/* Base */}
                <path d="M 11 39.5 L 34 39.5 C 32 35 29 31 26 28 L 19 28 C 16 31 13 35 11 39.5 Z" fill={fillColor} />
                <line x1="14" y1="36.5" x2="31" y2="36.5" stroke={heroAccent} strokeWidth="1.5" />
                {/* Body Mantle */}
                <path d="M 19 28 C 16 23 16 17 22.5 12 C 29 17 29 23 26 28 Z" fill={fillColor} />
                {/* Bishop Mitre Slit with Escrima Cross */}
                <line x1="20" y1="16" x2="25" y2="23" stroke={heroAccent} strokeWidth="1.8" />
                {/* Nightwing Chest Bird Crest */}
                <path d="M 16 27 L 22.5 25 L 29 27 L 22.5 30 Z" fill={heroAccent} stroke="none" />
                {/* Mask & Finial Orb */}
                <circle cx="22.5" cy="10" r="2.5" fill={heroAccent} stroke={strokeColor} strokeWidth="1" />
              </g>
            )}

            {/* KNIGHT: BATMOBILE TUMBLER */}
            {type === 'n' && (
              <g>
                {/* Armored Base */}
                <path d="M 9 39.5 L 36 39.5 L 37 33 L 8 33 Z" fill={fillColor} />
                {/* Tumbler / Steed Hull */}
                <path d="M 11 33 L 13 20 L 19 12 L 27 10 L 34 16 L 36 26 L 34 33 Z" fill={fillColor} />
                {/* Batmobile Aerodynamic Wing / Ears */}
                <polygon points="19,12 15,6 23,10" fill={heroAccent} />
                {/* Cockpit Canopy */}
                <polygon points="24,15 31,18 28,24 21,20" fill="#38BDF8" opacity="0.8" />
                {/* Turbine Wheel & Gold Striping */}
                <circle cx="30" cy="27" r="2.2" fill={heroAccent} stroke="none" />
                <line x1="14" y1="35" x2="31" y2="35" stroke={heroAccent} strokeWidth="1.8" />
              </g>
            )}

            {/* ROOK: WAYNE TOWER */}
            {type === 'r' && (
              <g>
                {/* Fortress Base */}
                <path d="M 10 39.5 L 35 39.5 L 33 18 L 12 18 Z" fill={fillColor} />
                {/* Castle Battlements */}
                <path d="M 10 18 L 10 10 L 14 10 L 14 13 L 19 13 L 19 8 L 26 8 L 26 13 L 31 13 L 31 10 L 35 10 L 35 18 Z" fill={fillColor} />
                {/* Illuminated "W" Crest */}
                <path d="M 16 26 L 19 33 L 22.5 28 L 26 33 L 29 26" stroke={heroAccent} strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                {/* Base & Arrow Slits */}
                <line x1="13" y1="36" x2="32" y2="36" stroke={heroAccent} strokeWidth="1.6" />
                <line x1="22.5" y1="18" x2="22.5" y2="24" stroke={heroAccent} strokeWidth="1.8" />
              </g>
            )}

            {/* PAWN: GCPD OFFICER */}
            {type === 'p' && (
              <g>
                {/* Coat Base */}
                <path d="M 12 39.5 L 33 39.5 C 31 34 28 30 25 27 L 20 27 C 17 30 14 34 12 39.5 Z" fill={fillColor} />
                <line x1="15" y1="36.5" x2="30" y2="36.5" stroke={heroAccent} strokeWidth="1.5" />
                {/* Torso & Police Cap */}
                <path d="M 19 27 C 17 23 18 18 22.5 16 C 27 18 28 23 26 27 Z" fill={fillColor} />
                <ellipse cx="22.5" cy="15" rx="5.5" ry="2.2" fill={heroSecondary} />
                {/* Officer Cap Visor */}
                <path d="M 17 15 Q 22.5 17 28 15" stroke={heroAccent} strokeWidth="1.5" fill="none" />
                {/* Pawn Crown Orb & Gold Shield Badge */}
                <circle cx="22.5" cy="9.5" r="2.5" fill={heroAccent} stroke={strokeColor} strokeWidth="1" />
                <polygon points="22.5,23 25,26 22.5,30 20,26" fill={heroAccent} stroke="none" />
              </g>
            )}
          </g>
        )}

        {/* ========================================================================= */}
        {/* VILLAINS (BLACK) : ARKHAM ROGUES                                         */}
        {/* ========================================================================= */}
        {!isHero && (
          <g stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* KING: THE JOKER (CLOWN PRINCE OF CRIME) */}
            {type === 'k' && (
              <g>
                {/* Dignified Royal King Suit Base */}
                <path
                  d="M 9 39.5 L 36 39.5 C 34 35 30 31 27 28 L 18 28 C 15 31 11 35 9 39.5 Z"
                  fill={fillColor}
                />
                {/* Base Trim Stripe */}
                <line x1="12" y1="36.5" x2="33" y2="36.5" stroke={villainAccent} strokeWidth="1.8" />

                {/* Purple Tuxedo Jacket & Acid-Green Silk Waistcoat */}
                <path d="M 17 28 L 14 19 L 22.5 22 L 31 19 L 28 28 Z" fill={fillColor} />
                <polygon points="18,28 22.5,21 27,28" fill="#15803D" stroke="none" />
                {/* Yellow Bowtie */}
                <polygon points="20.5,22 24.5,22 22.5,23.5" fill="#FACC15" stroke="none" />
                <polygon points="20.5,25 24.5,25 22.5,23.5" fill="#FACC15" stroke="none" />
                <circle cx="22.5" cy="23.5" r="0.9" fill="#EA580C" stroke="none" />

                {/* Acid Flower Corsage on Lapel */}
                <circle cx="16.5" cy="24" r="1.5" fill="#FACC15" stroke="none" />
                <circle cx="16.5" cy="24" r="0.7" fill="#22C55E" stroke="none" />

                {/* High White Stiff Collar & Pale Face Canvas */}
                <path d="M 18 20 L 16 13 L 22.5 16 L 29 13 L 27 20 Z" fill="#F8FAFC" stroke="#E2E8F0" strokeWidth="0.8" />
                <path
                  d="M 17 16 C 16.5 10.5 19 8.5 22.5 8.5 C 26 8.5 28.5 10.5 28 16 C 27.5 19.5 25.5 21 22.5 21 C 19.5 21 17.5 19.5 17 16 Z"
                  fill="url(#joker-face-grad)"
                  stroke="#CBD5E1"
                  strokeWidth="0.8"
                />

                {/* Slicked-Back Toxic Emerald Hair */}
                <path
                  d="M 16.5 12 C 16 6 18.5 4 22.5 4 C 26.5 4 29 6 28.5 12 C 27.5 9 25 8 22.5 8 C 20 8 17.5 9 16.5 12 Z"
                  fill="url(#joker-hair-grad)"
                  stroke="#16A34A"
                  strokeWidth="1"
                />
                {/* Wild Spikes at Crown */}
                <polygon points="19,5 20.5,2 22,5" fill="#22C55E" stroke="none" />
                <polygon points="23,5 24.5,2 26,5" fill="#22C55E" stroke="none" />

                {/* King Cross Finial (Twisted Jester Cross) */}
                <line x1="22.5" y1="0.5" x2="22.5" y2="4" stroke="#FACC15" strokeWidth="1.8" />
                <line x1="20.5" y1="2" x2="24.5" y2="2" stroke="#FACC15" strokeWidth="1.8" />
                <circle cx="22.5" cy="0.5" r="1" fill="#EF4444" stroke="none" />

                {/* Arched Eyes & Dark Eye Shadow */}
                <ellipse cx="19.5" cy="13.5" rx="1.2" ry="0.9" fill="#1E1B4B" stroke="none" />
                <ellipse cx="25.5" cy="13.5" rx="1.2" ry="0.9" fill="#1E1B4B" stroke="none" />
                <circle cx="19.5" cy="13.5" r="0.5" fill="#22C55E" stroke="none" />
                <circle cx="25.5" cy="13.5" r="0.5" fill="#22C55E" stroke="none" />

                {/* The Iconic Razor-Sharp Crimson Joker Grin */}
                <path
                  d="M 18 16.5 Q 22.5 21.5 27 16.5 Q 22.5 18 18 16.5 Z"
                  fill="#DC2626"
                  stroke="#991B1B"
                  strokeWidth="0.8"
                />
                {/* Pearly White Teeth Line inside grin */}
                <path d="M 19 17 Q 22.5 19.5 26 17" stroke="#FFFFFF" strokeWidth="0.8" fill="none" />
              </g>
            )}

            {/* QUEEN: HARLEY QUINN (QUEEN OF CHAOS) */}
            {type === 'q' && (
              <g>
                {/* Jester Corset Dress Base */}
                <path d="M 10 39.5 L 35 39.5 C 34 35 30 31 27 28 L 18 28 C 15 31 11 35 10 39.5 Z" fill={fillColor} />
                <line x1="13" y1="36.5" x2="32" y2="36.5" stroke="#EF4444" strokeWidth="1.6" />

                {/* Alternating Red / Black Queen Bodice */}
                <path d="M 18 28 L 15 18 L 22.5 21 L 22.5 28 Z" fill="#DC2626" stroke="none" />
                <path d="M 22.5 28 L 22.5 21 L 30 18 L 27 28 Z" fill="#1E1B4B" stroke="none" />

                {/* White Harlequin Collar */}
                <polygon points="15,18 18,22 21,18 22.5,23 24,18 27,22 30,18 22.5,19" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="0.8" />

                {/* Harlequin Face */}
                <circle cx="22.5" cy="15" r="4.2" fill="url(#joker-face-grad)" stroke="#CBD5E1" strokeWidth="0.8" />

                {/* Dual Curved Jester Horns / Pigtails with Golden Bells */}
                {/* Left Horn (Red) */}
                <path d="M 20 12 C 18 8 13 7 11 11 C 12 14 16 14 19 14 Z" fill="#DC2626" />
                <circle cx="10.5" cy="11" r="1.5" fill="#FACC15" stroke="#CA8A04" strokeWidth="0.6" />

                {/* Right Horn (Black / Blue) */}
                <path d="M 25 12 C 27 8 32 7 34 11 C 33 14 29 14 26 14 Z" fill="#1E1B4B" />
                <circle cx="34.5" cy="11" r="1.5" fill="#FACC15" stroke="#CA8A04" strokeWidth="0.6" />

                {/* Eye Domino Mask & Heart Tattoo */}
                <path d="M 19 14 Q 22.5 15.5 26 14" stroke="#0F172A" strokeWidth="1.2" fill="none" />
                <path d="M 20 18 Q 22.5 20 25 18" stroke="#DC2626" strokeWidth="1.2" fill="none" />
                {/* Diamond Crests on Skirt */}
                <polygon points="22.5,30 24.5,33 22.5,36 20.5,33" fill="#DC2626" stroke="none" />
                <polygon points="16,32 17.5,34.5 16,37 14.5,34.5" fill="#F8FAFC" stroke="none" />
                <polygon points="29,32 30.5,34.5 29,37 27.5,34.5" fill="#1E1B4B" stroke="none" />
              </g>
            )}

            {/* BISHOP: THE RIDDLER */}
            {type === 'b' && (
              <g>
                {/* Stately Base */}
                <path d="M 11 39.5 L 34 39.5 C 32 35 29 31 26 28 L 19 28 C 16 31 13 35 11 39.5 Z" fill={fillColor} />
                <line x1="14" y1="36.5" x2="31" y2="36.5" stroke={villainAccent} strokeWidth="1.5" />
                {/* Green Suit Body */}
                <path d="M 19 28 C 16 23 16 17 22.5 12 C 29 17 29 23 26 28 Z" fill="#15803D" />
                {/* Bowler Hat Brim & Crown */}
                <ellipse cx="22.5" cy="14" rx="7" ry="2.5" fill="#166534" stroke="#15803D" strokeWidth="0.8" />
                <path d="M 17.5 14 C 17.5 8 27.5 8 27.5 14 Z" fill="#15803D" />
                <line x1="17.5" y1="13.5" x2="27.5" y2="13.5" stroke="#4ADE80" strokeWidth="1.2" />
                {/* Bishop Mitre Finial Orb */}
                <circle cx="22.5" cy="7" r="2.2" fill="#FACC15" stroke={villainStroke} strokeWidth="0.8" />
                {/* Glowing Question Mark "?" */}
                <text
                  x="22.5"
                  y="32"
                  fontSize="13"
                  fontWeight="900"
                  fontFamily="system-ui, sans-serif"
                  textAnchor="middle"
                  fill="#4ADE80"
                  stroke="none"
                >
                  ?
                </text>
              </g>
            )}

            {/* KNIGHT: BANE (VENOM STEED) */}
            {type === 'n' && (
              <g>
                {/* Armored Base */}
                <path d="M 9 39.5 L 36 39.5 L 37 33 L 8 33 Z" fill={fillColor} />
                <line x1="12" y1="36" x2="33" y2="36" stroke={villainAccent} strokeWidth="1.6" />
                {/* Knight Mane & Venom Armor Mask */}
                <path
                  d="M 10 33 C 10 24 16 13 22 8 C 26 10 32 14 34 22 C 34 28 32 33 32 33 Z"
                  fill={fillColor}
                />
                {/* Venom Mask Tubes */}
                <path d="M 18 18 Q 24 22 29 18" stroke={villainAccent} strokeWidth="2.5" fill="none" />
                <path d="M 23 14 L 23 23" stroke={villainAccent} strokeWidth="2" />
                {/* Glowing Green Venom Injector Canisters */}
                <circle cx="15" cy="27" r="2.5" fill="#4ADE80" stroke="#16A34A" strokeWidth="0.8" filter={`url(#neon-glow-${color})`} />
                <circle cx="28" cy="27" r="2.5" fill="#4ADE80" stroke="#16A34A" strokeWidth="0.8" filter={`url(#neon-glow-${color})`} />
                <line x1="16" y1="27" x2="27" y2="27" stroke={villainAccent} strokeWidth="1.5" />
              </g>
            )}

            {/* ROOK: ARKHAM ASYLUM GOTHIC TOWER */}
            {type === 'r' && (
              <g>
                {/* Stone Castle Base */}
                <path d="M 10 39.5 L 35 39.5 L 33 18 L 12 18 Z" fill={fillColor} />
                {/* Gothic Spike Battlements */}
                <path d="M 10 18 L 9 9 L 13 13 L 18 7 L 22.5 13 L 27 7 L 32 13 L 36 9 L 35 18 Z" fill={fillColor} />
                {/* Wrought Iron Asylum Gate Bars */}
                <line x1="17" y1="22" x2="17" y2="36" stroke={villainAccent} strokeWidth="1.5" />
                <line x1="22.5" y1="20" x2="22.5" y2="36" stroke={villainAccent} strokeWidth="1.5" />
                <line x1="28" y1="22" x2="28" y2="36" stroke={villainAccent} strokeWidth="1.5" />
                <line x1="14" y1="36" x2="31" y2="36" stroke={villainAccent} strokeWidth="1.6" />
                {/* Arkham Red Neon "A" Monogram */}
                <text
                  x="22.5"
                  y="18"
                  fontSize="8"
                  fontWeight="900"
                  fontFamily="serif"
                  textAnchor="middle"
                  fill="#EF4444"
                  stroke="none"
                >
                  A
                </text>
              </g>
            )}

            {/* PAWN: JOKER PLAYING-CARD MINION / GOON */}
            {type === 'p' && (
              <g>
                {/* Purple Tailcoat Pawn Base */}
                <path d="M 12 39.5 L 33 39.5 C 31 34 28 30 25 27 L 20 27 C 17 30 14 34 12 39.5 Z" fill={fillColor} />
                <line x1="15" y1="36.5" x2="30" y2="36.5" stroke={villainAccent} strokeWidth="1.5" />

                {/* Striped Prisoner / Joker Goon Torso */}
                <path d="M 19 27 C 17 23 18 19 22.5 17 C 27 19 28 23 26 27 Z" fill={fillColor} />
                <line x1="19" y1="23" x2="26" y2="23" stroke="#4ADE80" strokeWidth="1.5" />
                <line x1="18.5" y1="26" x2="26.5" y2="26" stroke="#DC2626" strokeWidth="1.5" />

                {/* Jester Pawn Crown Orb (White Face with Green Jester Cap & Grin) */}
                <circle cx="22.5" cy="11.5" r="4" fill="url(#joker-face-grad)" stroke="#CBD5E1" strokeWidth="0.8" />
                {/* Jester Cap */}
                <path d="M 19 10 C 18 6 22.5 4 22.5 4 C 22.5 4 27 6 26 10 Z" fill="#15803D" />
                <circle cx="22.5" cy="4" r="1.2" fill="#FACC15" stroke="#CA8A04" strokeWidth="0.5" />

                {/* Pawn Grin & Eyes */}
                <circle cx="21" cy="11" r="0.6" fill="#1E1B4B" stroke="none" />
                <circle cx="24" cy="11" r="0.6" fill="#1E1B4B" stroke="none" />
                <path d="M 20.5 13.2 Q 22.5 15 24.5 13.2" stroke="#DC2626" strokeWidth="0.9" fill="none" />
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};

