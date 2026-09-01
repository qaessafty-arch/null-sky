import React from 'react';

interface PanelContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PanelContainer: React.FC<PanelContainerProps> = ({ children, className = '' }) => {
  return (
    <div className={`w-full max-w-7xl mx-auto p-4 sm:p-6 md:p-8 bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl rounded-3xl flex flex-col gap-6 animate-in fade-in zoom-in-95 ${className}`}>
      {children}
    </div>
  );
};
