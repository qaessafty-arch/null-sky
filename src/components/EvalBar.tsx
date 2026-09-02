import React from 'react';

interface EvalBarProps {
  score: number; // in pawns (positive = White ahead, negative = Black ahead)
  isFlipped: boolean;
}

export const EvalBar: React.FC<EvalBarProps> = ({ score, isFlipped }) => {
  // Convert evaluation score to percentage using a smooth sigmoid compression
  // A score of +5 pawns is ~85% white, +10 pawns is ~96% white
  const isMate = Math.abs(score) > 900;
  const isWhiteMate = score > 900;

  let whitePercentage = 50;
  let displayScore = '0.0';

  if (isMate) {
    whitePercentage = isWhiteMate ? 100 : 0;
    displayScore = isWhiteMate ? 'M' : '-M';
  } else {
    // Sigmoid mapping centered at 0 with soft saturation
    const clampedScore = Math.max(-15, Math.min(15, score));
    whitePercentage = 50 + (2 / (1 + Math.exp(-clampedScore * 0.35)) - 1) * 50;
    displayScore = (score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1));
    if (Math.abs(score) < 0.05) displayScore = '0.0';
  }

  // Adjust for flipped perspective
  const whiteBarHeight = isFlipped ? 100 - whitePercentage : whitePercentage;
  const topText = isFlipped
    ? (score > 0 ? `+${score.toFixed(1)}` : score.toFixed(1))
    : (score < 0 ? score.toFixed(1) : '');
  const bottomText = isFlipped
    ? (score < 0 ? score.toFixed(1) : '')
    : (score > 0 ? `+${score.toFixed(1)}` : '');

  return (
    <div
      id="eval-bar-container"
      className="relative w-full h-full glass-premium overflow-hidden border-white/10 flex flex-col justify-between select-none"
    >
      {/* Black's territory */}
      <div
        className="w-full bg-black/60 transition-all duration-700 ease-out flex items-start justify-center pt-3"
        style={{ height: `${100 - whiteBarHeight}%` }}
      >
        <span className="hidden md:block w-full text-center px-0.5 text-[10px] leading-none font-black text-white/90 tracking-tighter uppercase">
          {!isFlipped && score < -0.1 ? displayScore : isFlipped && score > 0.1 ? displayScore : ''}
        </span>
      </div>

      {/* White's territory */}
      <div
        className="w-full bg-white/80 transition-all duration-700 ease-out flex items-end justify-center pb-3"
        style={{ height: `${whiteBarHeight}%` }}
      >
        <span className="hidden md:block w-full text-center px-0.5 text-[10px] leading-none font-black text-black tracking-tighter uppercase">
          {!isFlipped && score > 0.1 ? displayScore : isFlipped && score < -0.1 ? displayScore : ''}
        </span>
      </div>

      {/* Center line indicator - Premium Gold/Red */}
      <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FFD700] to-[#D32F2F] transform -translate-y-1/2 pointer-events-none z-10 opacity-100 shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
    </div>
  );
};
