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
      <div className="w-full aspect-[5/3] relative overflow-hidden rounded-lg shadow-2xl">
        <svg
          viewBox="0 0 500 300"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Red stripe */}
          <rect width="500" height="100" fill="#E41E20" />
          {/* White stripe */}
          <rect y="100" width="500" height="100" fill="#FFFFFF" />
          {/* Green stripe */}
          <rect y="200" width="500" height="100" fill="#278E43" />
          
          {/* Sun */}
          <g transform="translate(250, 150)">
            <circle r="42" fill="#FFD100" />
            {Array.from({ length: 21 }).map((_, i) => (
              <path
                key={i}
                d="M 0 -60 L 6 -40 L -6 -40 Z"
                fill="#FFD100"
                transform={`rotate(${(i * 360) / 21})`}
              />
            ))}
          </g>
        </svg>
      </div>
      {showText && (
        <div className="mt-4 flex flex-col items-center">
          <span className="font-display font-black text-2xl tracking-[0.2em] uppercase text-white drop-shadow-lg">
            Kurdistan
          </span>
          <span className="text-sm font-medium tracking-[0.4em] uppercase opacity-60 text-white/80 mt-1">
            Heritage Arena
          </span>
        </div>
      )}
    </div>
  );
};
