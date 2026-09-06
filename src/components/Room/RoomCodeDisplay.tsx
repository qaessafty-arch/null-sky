import React from 'react';
import { Copy, Check, Share2 } from 'lucide-react';

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
      } catch {}
    }
    handleCopy();
    onShare?.();
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Label — sentence case, not ALL-CAPS */}
      <div className="flex items-center justify-between gap-3">
        <span className="room-label" style={{ color: 'var(--room-gold)' }}>
          Room code
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="room-btn-secondary flex items-center gap-1.5"
            style={{ padding: '6px 12px', fontSize: 12 }}
          >
            {copied ? (
              <Check style={{ width: 14, height: 14, color: 'var(--room-green)' }} />
            ) : (
              <Copy style={{ width: 14, height: 14 }} />
            )}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="room-btn-secondary flex items-center gap-1.5"
            style={{ padding: '6px 12px', fontSize: 12 }}
          >
            <Share2 style={{ width: 14, height: 14 }} />
            Share
          </button>
        </div>
      </div>

      {/* Code — distinctive, memorable */}
      <div className="room-code">
        <span className="room-code__digits">{code}</span>
      </div>
    </div>
  );
};
