import React from 'react';

interface WatermarkProps {
  className?: string;
  onClick?: () => void;
}

export const Watermark: React.FC<WatermarkProps> = ({ className = '', onClick }) => {
  return (
    <div
      onClick={onClick}
      className={`fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-40 watermark-glass-panel px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl flex items-center gap-2 select-none cursor-pointer group pointer-events-auto ${className}`}
      title="Chesskys PRO - Built with reverence & precision"
    >
      <span className="w-2 h-2 rounded-full bg-amber-400/80 animate-pulse shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
      <p className="text-[11px] sm:text-xs tracking-wide text-white/50 watermark-font-body font-medium flex items-center gap-1">
        developed with{' '}
        <span className="text-[#FFD700] opacity-90 font-semibold drop-shadow-[0_0_6px_rgba(255,215,0,0.4)]">
          respect
        </span>{' '}
        and{' '}
        <span className="text-[#FF4444] opacity-90 font-semibold drop-shadow-[0_0_6px_rgba(255,68,68,0.4)]">
          passion
        </span>{' '}
        by{' '}
        <span className="text-[#FFD700] opacity-100 font-bold text-sm sm:text-base watermark-font-script drop-shadow-[0_0_10px_rgba(255,215,0,0.6)] ml-0.5 group-hover:scale-105 transition-transform inline-block">
          null
        </span>
      </p>
    </div>
  );
};
