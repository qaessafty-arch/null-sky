import React from 'react';

interface KurdishFlagProps {
  className?: string;
}

export const KurdishFlag: React.FC<KurdishFlagProps> = ({ className = 'w-full h-full' }) => {
  return (
    <div className={`relative overflow-hidden ${className}`}>
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
  );
};
