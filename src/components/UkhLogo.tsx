import React from 'react';

interface UkhLogoProps {
  className?: string;
  showText?: boolean;
  textColor?: string;
}

export const UkhLogo: React.FC<UkhLogoProps> = ({
  className = 'w-full h-full',
  showText = true,
  textColor = '#165BAA'
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 400 480"
        className="w-full h-full drop-shadow-sm select-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Clip path for the rounded square emblem with bottom right sweeping tail */}
          <clipPath id="ukh-badge-clip">
            <path d="M 40,40 C 40,25 55,10 75,10 L 325,10 C 345,10 360,25 360,45 L 360,280 C 360,300 350,315 330,325 C 290,345 270,355 240,355 C 265,340 280,310 270,290 C 230,290 100,320 40,320 Z" />
          </clipPath>

          <clipPath id="ukh-tile-rounded">
            <rect x="50" y="20" width="300" height="300" rx="36" />
          </clipPath>
        </defs>

        {/* --- MAIN EMBLEM BADGE --- */}
        <g id="ukh-emblem-badge">
          {/* Background Badge: Soft Sky Blue Rounded Square with curved bottom-right */}
          <path
            d="M 85,20 L 315,20 C 335,20 350,35 350,55 L 350,265 C 350,295 330,315 300,320 C 260,326 240,340 240,348 C 260,332 278,312 280,292 C 240,296 110,320 70,320 C 58,320 50,310 50,298 L 50,55 C 50,35 65,20 85,20 Z"
            fill="#5EADE8"
          />

          {/* Sunburst Beaming Rays (White) */}
          <g fill="#FFFFFF" opacity="0.95">
            {/* Ray 1 */}
            <polygon points="200,240 70,30 88,24" />
            {/* Ray 2 */}
            <polygon points="200,240 105,20 125,20" />
            {/* Ray 3 */}
            <polygon points="200,240 142,20 162,20" />
            {/* Ray 4 */}
            <polygon points="200,240 180,20 200,20" />
            {/* Ray 5 */}
            <polygon points="200,240 218,20 238,20" />
            {/* Ray 6 */}
            <polygon points="200,240 255,20 275,20" />
            {/* Ray 7 */}
            <polygon points="200,240 292,20 312,24" />
            {/* Ray 8 */}
            <polygon points="200,240 330,32 346,46" />
            {/* Ray 9 */}
            <polygon points="200,240 348,65 350,85" />
            {/* Ray 10 */}
            <polygon points="200,240 350,105 350,125" />
            {/* Ray 11 */}
            <polygon points="200,240 350,145 350,165" />
            {/* Ray 12 */}
            <polygon points="200,240 350,185 350,205" />
            {/* Left side rays */}
            <polygon points="200,240 50,60 50,80" />
            <polygon points="200,240 50,100 50,120" />
            <polygon points="200,240 50,140 50,160" />
            <polygon points="200,240 50,180 50,200" />
            <polygon points="200,240 50,220 50,235" />
          </g>

          {/* Radiant Sun Semi-Circle Base Behind Citadel */}
          <circle cx="200" cy="245" r="95" fill="#FFFFFF" opacity="0.9" />

          {/* The Erbil Citadel (Qalat) Historic Fortification Silhouette (Royal Navy Blue #155FA0) */}
          <g fill="#185E9F">
            {/* Building 1 (Leftmost Tower) */}
            <polygon points="50,265 65,255 100,245 100,305 50,305" />
            {/* Building 2 (Mid-Left Citadel House) */}
            <polygon points="100,245 150,232 150,295 100,305" />
            {/* Building 3 (Central Grand Quarters) */}
            <polygon points="150,232 195,220 195,290 150,295" />
            {/* Building 4 (Main Citadel Gatehouse / Watchtower - Highest Peak) */}
            <polygon points="195,220 275,200 275,280 195,290" />
            {/* Building 5 (East Citadel Wing) */}
            <polygon points="275,200 330,205 330,280 275,280" />
            {/* Building 6 (East Edge) */}
            <polygon points="330,205 350,215 350,280 330,280" />

            {/* Base Citadel Mound Slope and Bottom Swoop */}
            <path
              d="M 50,280 Q 180,260 350,240 L 350,265 C 350,295 330,315 300,320 C 260,326 240,340 240,348 C 260,332 278,312 280,292 C 240,296 110,320 70,320 C 58,320 50,310 50,298 Z"
            />
          </g>

          {/* Thin White Citadel Wall Dividers & Rampart Architectural Lines */}
          <g stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" fill="none">
            <line x1="100" y1="245" x2="100" y2="295" />
            <line x1="150" y1="232" x2="150" y2="285" />
            <line x1="195" y1="220" x2="195" y2="280" />
            <line x1="275" y1="200" x2="275" y2="270" />
            <line x1="330" y1="205" x2="330" y2="265" />

            {/* Upper parapet continuous outline */}
            <path d="M 50,280 L 100,265 L 150,250 L 195,240 L 275,220 L 350,230" strokeWidth="3" />
          </g>

          {/* Arched Windows and Citadel Gate Openings (White) */}
          <g fill="#FFFFFF">
            {/* Left tower arched portals */}
            <path d="M 58,285 A 3 3 0 0 1 64,285 L 64,295 L 58,295 Z" />
            <path d="M 72,280 A 3 3 0 0 1 78,280 L 78,290 L 72,290 Z" />
            <path d="M 86,275 A 3 3 0 0 1 92,275 L 92,285 L 86,285 Z" />

            {/* Mid-Left block double rows of windows */}
            <rect x="110" y="260" width="4.5" height="9" rx="2" />
            <rect x="122" y="256" width="4.5" height="9" rx="2" />
            <rect x="134" y="252" width="4.5" height="9" rx="2" />
            <rect x="110" y="275" width="4.5" height="8" rx="1.5" />
            <rect x="122" y="271" width="4.5" height="8" rx="1.5" />
            <rect x="134" y="267" width="4.5" height="8" rx="1.5" />

            {/* Central block double rows */}
            <rect x="160" y="248" width="4.5" height="10" rx="2" />
            <rect x="172" y="244" width="4.5" height="10" rx="2" />
            <rect x="184" y="240" width="4.5" height="10" rx="2" />
            <rect x="160" y="264" width="4.5" height="8" rx="1.5" />
            <rect x="172" y="260" width="4.5" height="8" rx="1.5" />
            <rect x="184" y="256" width="4.5" height="8" rx="1.5" />

            {/* Gatehouse Archway Portals */}
            <path d="M 210,240 A 6 6 0 0 1 222,240 L 222,255 L 210,255 Z" />
            <path d="M 226,236 A 6 6 0 0 1 238,236 L 238,251 L 226,251 Z" />
            <path d="M 242,232 A 6 6 0 0 1 254,232 L 254,247 L 242,247 Z" />
            <rect x="212" y="222" width="3" height="6" rx="1" />
            <rect x="228" y="218" width="3" height="6" rx="1" />
            <rect x="244" y="214" width="3" height="6" rx="1" />
            <rect x="260" y="210" width="3" height="6" rx="1" />

            {/* East Wing windows */}
            <rect x="290" y="222" width="5" height="7" rx="1" />
            <rect x="306" y="220" width="5" height="7" rx="1" />
            <rect x="290" y="238" width="5" height="7" rx="1" />
            <rect x="306" y="236" width="5" height="7" rx="1" />
          </g>
        </g>

        {/* --- OFFICIAL TYPOGRAPHY --- */}
        {showText && (
          <g id="ukh-typography" textAnchor="middle">
            {/* "University of" */}
            <text
              x="200"
              y="390"
              fill={textColor}
              fontSize="28"
              fontFamily="'Times New Roman', Times, 'Cinzel', Georgia, serif"
              letterSpacing="3.5"
              fontWeight="400"
            >
              University of
            </text>

            {/* "KURDISTAN" */}
            <text
              x="200"
              y="435"
              fill={textColor}
              fontSize="44"
              fontFamily="'Times New Roman', Times, 'Cinzel', Georgia, serif"
              fontWeight="900"
              letterSpacing="5"
            >
              KURDISTAN
            </text>

            {/* "H e w l ê r" */}
            <text
              x="200"
              y="472"
              fill={textColor}
              fontSize="26"
              fontFamily="'Times New Roman', Times, 'Cinzel', Georgia, serif"
              fontWeight="500"
              letterSpacing="8"
            >
              Hewlêr
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
