// FILE: frontend/src/components/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading...',
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-3 text-slate-400">
      <div
        className={`${sizeClasses[size]} border-amber-500/20 border-t-amber-500 rounded-full animate-spin`}
      />
      {label && <p className="text-xs font-medium tracking-wide">{label}</p>}
    </div>
  );
};
