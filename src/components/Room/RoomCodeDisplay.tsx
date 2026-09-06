import React from 'react';
import { Copy, Check, Share2, Link } from 'lucide-react';

interface RoomCodeDisplayProps {
  code: string;
  onCopy?: () => void;
  onShare?: () => void;
}

export const RoomCodeDisplay: React.FC<RoomCodeDisplayProps> = ({
  code,
  onCopy,
  onShare,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // fallback: select from an input
      const i = document.createElement('input');
      i.value = code;
      document.body.appendChild(i);
      i.select();
      try {
        document.execCommand('copy');
      } catch {}
      document.body.removeChild(i);
    }
    setCopied(true);
    onCopy?.();
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const text = `Play chess with me! Room code: ${code}`;
    if (navigator.share && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent || '')) {
      try {
        await navigator.share({ title: 'Private Chess Room', text });
        onShare?.();
        return;
      } catch {
        // fall through to copy
      }
    }
    handleCopy();
    onShare?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#F5C453]">
            Room Code
          </span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 bg-white/[0.05] hover:bg-white/[0.12] text-white/70 hover:text-white transition-all cursor-pointer"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 bg-white/[0.05] hover:bg-white/[0.12] text-white/70 hover:text-white transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            Share
          </button>
        </div>
      </div>

      <div className="text-center">
        <div className="text-5xl sm:text-6xl font-mono font-black text-white tracking-[0.25em] select-all">
          {code}
        </div>
        <div className="mt-3 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      </div>
    </div>
  );
};
