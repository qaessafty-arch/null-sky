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
      className="relative w-4 sm:w-6 md:w-7 shrink-0 self-stretch my-2 sm:my-4 min-h-[220px] bg-black/60 rounded-xl overflow-hidden border border-white/15 shadow-xl flex flex-col justify-between select-none backdrop-blur-md"
    >
      {/* Black's territory (top or bottom depending on flip) */}
      <div
        className="w-full bg-[#12141c]/95 transition-all duration-300 ease-out flex items-start justify-center pt-2"
        style={{ height: `${100 - whiteBarHeight}%` }}
      >
        <span className="hidden md:block w-full text-center px-0.5 text-[9px] leading-none font-mono font-extrabold text-white/80 tracking-tighter">
          {!isFlipped && score < -0.1 ? displayScore : isFlipped && score > 0.1 ? displayScore : ''}
        </span>
      </div>

      {/* White's territory */}
      <div
        className="w-full bg-white/95 transition-all duration-300 ease-out flex items-end justify-center pb-2"
        style={{ height: `${whiteBarHeight}%` }}
      >
        <span className="hidden md:block w-full text-center px-0.5 text-[9px] leading-none font-mono font-extrabold text-slate-900 tracking-tighter">
          {!isFlipped && score > 0.1 ? displayScore : isFlipped && score < -0.1 ? displayScore : ''}
        </span>
      </div>

      {/* Center 0.0 line indicator */}
      <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-400 to-purple-400 transform -translate-y-1/2 pointer-events-none z-10 opacity-80 shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
    </div>
  );
};
