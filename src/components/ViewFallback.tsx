import React from 'react';

interface ViewFallbackProps {
  label?: string;
}

/** Placeholder shown while a lazily loaded view or modal chunk is fetched. */
export const ViewFallback: React.FC<ViewFallbackProps> = ({ label = 'Loading' }) => (
  <div
    role="status"
    aria-live="polite"
    className="w-full flex-1 min-h-[240px] flex flex-col items-center justify-center gap-3 py-16 text-[#94A3B8]"
  >
    <span className="w-8 h-8 rounded-full border-2 border-[#1F293D] border-t-[#F59E0B] animate-spin motion-reduce:animate-none" />
    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{label}</span>
  </div>
);
