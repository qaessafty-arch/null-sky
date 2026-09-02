import React from 'react';

export const FriendSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between gap-3 animate-pulse"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/10" />
            <div className="space-y-1.5">
              <div className="w-24 h-3 rounded bg-white/10" />
              <div className="w-16 h-2 rounded bg-white/5" />
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-8 h-8 rounded-xl bg-white/5" />
            <div className="w-8 h-8 rounded-xl bg-white/5" />
          </div>
        </div>
      ))}
    </div>
  );
};
