import React, { useState, useEffect } from 'react';
import { Glasses, Share2 } from 'lucide-react';

interface AiMangaRecapProps {
  pgn: string;
}

export const AiMangaRecap: React.FC<AiMangaRecapProps> = ({ pgn }) => {
  const [recap, setRecap] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchRecap = async () => {
    if (!pgn) return;
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/recap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pgn })
      });
      const data = await res.json();
      if (data.recap) {
        setRecap(data.recap);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (!recap && !loading) {
    return (
      <button 
        onClick={fetchRecap}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 mt-2 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-600 text-white font-black uppercase text-xs hover:opacity-95 transition-all shadow-[0_0_15px_rgba(249,115,22,0.4)]"
      >
        <Glasses className="w-4 h-4" />
        Generate AI Manga Recap
      </button>
    );
  }

  if (loading) {
    return (
      <div className="w-full p-4 mt-2 rounded-2xl bg-black/40 border border-orange-500/30 flex items-center justify-center">
        <span className="text-orange-400 text-xs font-bold animate-pulse">Gemini is writing the manga chapter...</span>
      </div>
    );
  }

  return (
    <div className="w-full mt-3 p-4 rounded-3xl bg-gradient-to-b from-black/80 to-slate-900/90 border-2 border-orange-500/40 relative overflow-hidden group">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none" />
      <h3 className="text-sm font-black text-orange-400 uppercase tracking-widest mb-3 flex items-center gap-2">
        <Glasses className="w-4 h-4" /> 
        Match Chronicle
      </h3>
      <div className="text-left space-y-2 text-xs text-slate-300 leading-relaxed font-medium italic relative z-10 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
        {recap?.split('\n\n').map((paragraph, i) => (
          <p key={i}>{paragraph}</p>
        ))}
      </div>
      <button 
        onClick={() => navigator.clipboard.writeText(recap || '')}
        className="absolute top-3 right-3 p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
      >
        <Share2 className="w-4 h-4" />
      </button>
    </div>
  );
};
