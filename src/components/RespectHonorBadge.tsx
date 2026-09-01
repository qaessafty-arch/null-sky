import React, { useState, useEffect, useRef } from 'react';
import { Crown, Shield, Sparkles, Award } from 'lucide-react';
import { getHonorRank } from '../utils/respectSystem';

interface RespectHonorBadgeProps {
  respectPoints: number | string;
  honorRank?: string;
  rankBadge?: string;
  variant?: 'header-rank' | 'points-pill' | 'compact-pill' | 'drawer-row';
  showIcon?: boolean;
  interactive?: boolean;
  onClick?: () => void;
  className?: string;
}

export const RespectHonorBadge: React.FC<RespectHonorBadgeProps> = ({
  respectPoints,
  honorRank,
  rankBadge,
  variant = 'points-pill',
  showIcon = true,
  interactive = false,
  onClick,
  className = ''
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [pointDelta, setPointDelta] = useState<number | null>(null);
  const [displayPoints, setDisplayPoints] = useState<number | string>(respectPoints);
  const prevPointsRef = useRef<number | string>(respectPoints);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const numPoints = typeof respectPoints === 'number' 
    ? respectPoints 
    : parseInt(String(respectPoints)) || 0;

  const derivedRank = getHonorRank(respectPoints);
  const activeHonorTitle = honorRank || derivedRank.title;
  const activeBadgeIcon = rankBadge || derivedRank.badge;

  // Reactively track point updates and trigger rewarding animation
  useEffect(() => {
    const prev = prevPointsRef.current;
    if (prev !== respectPoints) {
      const prevNum = typeof prev === 'number' ? prev : parseInt(String(prev)) || 0;
      const currentNum = typeof respectPoints === 'number' ? respectPoints : parseInt(String(respectPoints)) || 0;

      if (currentNum > prevNum && prevNum > 0) {
        setPointDelta(currentNum - prevNum);
      }

      setIsUpdating(true);
      setDisplayPoints(respectPoints);
      prevPointsRef.current = respectPoints;

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsUpdating(false);
        setPointDelta(null);
      }, 1300);
    }
  }, [respectPoints]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // 1. Variant: Header Rank (Used next to username in Profile Header)
  if (variant === 'header-rank') {
    return (
      <div
        className={`respect-badge-entry inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/15 via-[#F5C453]/10 to-transparent border border-[#F5C453]/40 text-[#F5C453] font-bold text-xs sm:text-sm shadow-sm hover:border-[#F5C453]/70 transition-all duration-300 relative overflow-hidden group ${
          isUpdating ? 'respect-bloom-active' : ''
        } ${className}`}
        title={`Honor Title: ${activeHonorTitle}`}
      >
        <div className="absolute inset-0 respect-shimmer-sheen pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity" />
        <span className="text-base select-none group-hover:scale-110 transition-transform duration-200">
          {activeBadgeIcon}
        </span>
        <span className="font-heading tracking-tight font-extrabold text-[#F5C453] drop-shadow-sm truncate">
          {activeHonorTitle}
        </span>
        <Sparkles className="w-3.5 h-3.5 text-[#F5C453]/70 group-hover:text-[#F5C453] transition-colors shrink-0" />
      </div>
    );
  }

  // 2. Variant: Drawer Row (Used in Mobile Profile Drawer)
  if (variant === 'drawer-row') {
    return (
      <div 
        className={`respect-badge-entry flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900/90 to-amber-950/20 border border-[#F5C453]/30 relative overflow-hidden transition-all duration-300 shadow-md ${
          isUpdating ? 'respect-bloom-active border-[#F5C453]' : ''
        } ${className}`}
      >
        <div className="absolute inset-0 respect-shimmer-sheen pointer-events-none opacity-30" />
        
        <div className="flex items-center gap-2 relative z-10">
          <div className="w-8 h-8 rounded-xl bg-[#F5C453]/15 border border-[#F5C453]/30 flex items-center justify-center text-sm shadow-inner">
            {activeBadgeIcon}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-200 flex items-center gap-1">
              <span>Honor & Respect Score</span>
            </div>
            <div className="text-[11px] text-[#F5C453] font-medium font-mono">
              {activeHonorTitle}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-1.5">
          {pointDelta && (
            <span className="respect-delta-pill absolute -top-5 right-0 text-[11px] font-black font-mono text-emerald-400 bg-emerald-950/90 border border-emerald-500/40 px-1.5 py-0.5 rounded-full shadow-lg">
              +{pointDelta}
            </span>
          )}
          <span 
            className={`text-sm sm:text-base font-mono font-black tracking-tight text-[#F5C453] ${
              isUpdating ? 'respect-points-bump' : ''
            }`}
          >
            {displayPoints} pts
          </span>
        </div>
      </div>
    );
  }

  // 3. Variant: Compact Pill (Used in Global Header bar)
  if (variant === 'compact-pill') {
    return (
      <div
        onClick={onClick}
        className={`respect-badge-entry inline-flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl bg-gradient-to-r from-[#52673A]/40 to-[#8C2425]/40 hover:from-[#52673A]/60 hover:to-[#8C2425]/60 border border-[#F5C453]/40 text-[#F5C453] text-xs font-black transition-all hover:scale-[1.02] shadow-sm shadow-[#F5C453]/10 relative overflow-hidden select-none ${
          interactive ? 'cursor-pointer' : ''
        } ${isUpdating ? 'respect-bloom-active ring-1 ring-[#F5C453]' : ''} ${className}`}
      >
        <div className="absolute inset-0 respect-shimmer-sheen pointer-events-none opacity-30" />
        
        {pointDelta && (
          <span className="respect-delta-pill absolute -top-4 right-2 text-[10px] font-black font-mono text-emerald-300 bg-emerald-950 border border-emerald-500/50 px-1.5 py-0.2 rounded-full shadow-md z-20">
            +{pointDelta}
          </span>
        )}

        <span className="text-sm select-none relative z-10">{activeBadgeIcon}</span>
        <span 
          className={`font-mono relative z-10 transition-all ${
            isUpdating ? 'respect-points-bump text-white font-extrabold' : 'text-[#F5C453]'
          }`}
        >
          {displayPoints}
        </span>
        <span className="hidden lg:inline text-[10px] text-[#DFD0B0]/80 uppercase font-semibold relative z-10">
          Respect
        </span>
      </div>
    );
  }

  // 4. Default: Points Pill (Used in Tab Row / Desktop Profile Section)
  return (
    <div
      onClick={onClick}
      className={`respect-badge-entry relative inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-slate-900/95 via-slate-900/80 to-[#F5C453]/10 border border-[#F5C453]/35 hover:border-[#F5C453]/60 text-sm font-mono shadow-md backdrop-blur-md transition-all duration-300 overflow-hidden group select-none ${
        interactive ? 'cursor-pointer hover:scale-[1.02]' : ''
      } ${isUpdating ? 'respect-bloom-active ring-2 ring-[#F5C453]/50' : ''} ${className}`}
      title={`${activeHonorTitle} • ${numPoints} Total Respect Points`}
    >
      {/* Background ambient shimmer */}
      <div className="absolute inset-0 respect-shimmer-sheen pointer-events-none opacity-40 group-hover:opacity-75 transition-opacity" />

      {/* Floating delta pill */}
      {pointDelta && (
        <div className="respect-delta-pill absolute -top-3.5 right-4 z-20 text-[11px] font-black font-mono text-emerald-300 bg-emerald-950/90 border border-emerald-400/50 px-2 py-0.5 rounded-full shadow-xl">
          +{pointDelta} pts
        </div>
      )}

      {/* Badge Icon & Label */}
      <div className="flex items-center gap-1.5 relative z-10">
        <span className="text-base select-none group-hover:scale-110 transition-transform duration-200">
          {activeBadgeIcon}
        </span>
        <span className="text-[#F5C453] font-bold text-xs sm:text-sm tracking-wide">
          Respect:
        </span>
      </div>

      {/* Animated Numerical Points Display */}
      <div className="relative z-10 flex items-center gap-1">
        <span
          className={`font-black tracking-tight text-white transition-all text-xs sm:text-sm ${
            isUpdating ? 'respect-points-bump text-amber-200' : ''
          }`}
        >
          {displayPoints}
        </span>
        <span className="text-[11px] font-semibold text-[#DFD0B0]/75">pts</span>
      </div>

      {/* Subtle rank trophy hint */}
      <div className="relative z-10 pl-1 border-l border-white/10 hidden sm:flex items-center text-[10px] font-sans font-bold text-[#F5C453]/90 truncate max-w-[110px]">
        {activeHonorTitle}
      </div>
    </div>
  );
};
