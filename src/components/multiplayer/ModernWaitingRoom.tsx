import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Copy, 
  Check, 
  Clock, 
  X, 
  Share2, 
  Users, 
  ExternalLink, 
  QrCode, 
  Play, 
  Sparkles,
  RefreshCw,
  MessageCircle,
  Twitter
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundManager } from '../../utils/audio';

interface ModernWaitingRoomProps {
  gameCode: string;
  timeControlName: string;
  isRated: boolean;
  playerSide: 'w' | 'b' | 'random';
  onCancel: () => void;
  onEnterBoard: () => void;
}

export const ModernWaitingRoom: React.FC<ModernWaitingRoomProps> = ({
  gameCode,
  timeControlName,
  isRated,
  playerSide,
  onCancel,
  onEnterBoard
}) => {
  const [copied, setCopied] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [showQr, setShowQr] = useState(false);
  const [estimatedWait, setEstimatedWait] = useState(24);

  // Trigger celebration confetti on creation
  useEffect(() => {
    try {
      soundManager.playCapture();
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#6C63FF', '#FF6B6B', '#4ECDC4', '#FFD93D']
      });
    } catch {}
  }, []);

  // Animated ticking seconds clock
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}?join=${gameCode}` 
    : `https://chesskys.pro?join=${gameCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(gameCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`Play chess with me on Chesskys PRO! Join my game with room code: ${gameCode}\n${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`Play chess with me on Chesskys PRO! Join room code: ${gameCode} - ${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleShareDiscord = () => {
    navigator.clipboard.writeText(`⚔️ Challenge: Play chess on Chesskys PRO! Room Code: **${gameCode}** -> ${shareUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full max-w-lg mx-auto rounded-3xl overflow-hidden bg-white/[0.04] border border-white/15 backdrop-blur-2xl shadow-2xl p-6 sm:p-8 text-center select-none">
      
      {/* Background Animated Chess Grid Pattern */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: `
            linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(255,255,255,0.1) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.1) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.1) 75%)
          `,
          backgroundSize: '40px 40px',
          backgroundPosition: '0 0, 0 20px, 20px -20px, -20px 0px'
        }}
      />

      {/* Pulsing Chess Knight Animation */}
      <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
        <motion.div 
          animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-gradient-to-tr from-[var(--primary-accent)] to-[var(--secondary-accent)] blur-xl"
        />
        <motion.div 
          animate={{ rotateY: [0, 180, 360], y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative w-16 h-16 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-4xl shadow-xl backdrop-blur-md"
        >
          ♞
        </motion.div>
      </div>

      {/* Header Info */}
      <div className="space-y-1.5 mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold text-white/90">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Waiting For Opponent...</span>
        </div>
        <h3 className="text-2xl font-black tracking-tight text-white">
          Game Room Active
        </h3>
        <p className="text-xs text-white/60 max-w-sm mx-auto">
          {timeControlName} • {isRated ? 'Rated Match' : 'Casual Match'} • Playing as {playerSide === 'w' ? 'White ⚪' : playerSide === 'b' ? 'Black ⚫' : 'Random 🎲'}
        </p>
      </div>

      {/* GIANT GAME CODE DISPLAY WITH GRADIENT */}
      <div className="p-5 rounded-2xl bg-black/40 border border-white/15 shadow-inner mb-6 relative group">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/50 block mb-1">
          Shareable 6-Character Code
        </span>
        <div className="font-mono text-4xl sm:text-5xl font-black tracking-[0.25em] bg-gradient-to-r from-[var(--secondary-accent)] via-purple-300 to-[var(--primary-accent)] bg-clip-text text-transparent my-2 select-all">
          {gameCode}
        </div>
        <div className="flex items-center justify-center gap-2 mt-3">
          <button
            onClick={handleCopyCode}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-bold text-white flex items-center gap-2 border border-white/15 shadow-md"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-300" />}
            <span>{copied ? 'Code Copied!' : 'Copy Code'}</span>
          </button>
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-bold text-white flex items-center gap-2 border border-white/15 shadow-md"
          >
            <Share2 className="w-4 h-4 text-cyan-300" />
            <span>Copy Join Link</span>
          </button>
          <button
            onClick={() => setShowQr(!showQr)}
            className={`p-2 rounded-xl border text-xs font-bold transition-all ${
              showQr ? 'bg-white/25 border-white/40 text-white' : 'bg-white/10 hover:bg-white/20 border-white/15 text-white/80'
            }`}
            title="Toggle QR Code"
          >
            <QrCode className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QR Code Popover if enabled */}
      <AnimatePresence>
        {showQr && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden"
          >
            <div className="p-4 rounded-2xl bg-white text-black max-w-[200px] mx-auto shadow-2xl flex flex-col items-center">
              {/* Clean SVG QR Matrix */}
              <div className="w-36 h-36 border-4 border-black p-1 bg-white flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 29 29" fill="black">
                  {/* Outer corner squares */}
                  <rect x="0" y="0" width="7" height="7" />
                  <rect x="1" y="1" width="5" height="5" fill="white" />
                  <rect x="2" y="2" width="3" height="3" fill="black" />
                  <rect x="22" y="0" width="7" height="7" />
                  <rect x="23" y="1" width="5" height="5" fill="white" />
                  <rect x="24" y="2" width="3" height="3" fill="black" />
                  <rect x="0" y="22" width="7" height="7" />
                  <rect x="1" y="23" width="5" height="5" fill="white" />
                  <rect x="2" y="24" width="3" height="3" fill="black" />
                  {/* Pattern data dots simulating game code link */}
                  <rect x="9" y="3" width="2" height="2" />
                  <rect x="13" y="3" width="3" height="2" />
                  <rect x="18" y="3" width="2" height="2" />
                  <rect x="10" y="7" width="2" height="2" />
                  <rect x="15" y="7" width="2" height="2" />
                  <rect x="8" y="10" width="3" height="3" />
                  <rect x="14" y="10" width="4" height="2" />
                  <rect x="20" y="11" width="3" height="3" />
                  <rect x="11" y="15" width="2" height="4" />
                  <rect x="16" y="14" width="3" height="2" />
                  <rect x="15" y="18" width="4" height="3" />
                  <rect x="9" y="23" width="3" height="2" />
                  <rect x="14" y="24" width="2" height="2" />
                  <rect x="18" y="22" width="3" height="3" />
                </svg>
              </div>
              <span className="text-[10px] font-mono font-bold mt-2 text-neutral-800">
                Scan with phone camera
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TICKING CLOCK & ESTIMATED TIME */}
      <div className="flex items-center justify-around py-3 px-4 rounded-xl bg-white/[0.03] border border-white/10 mb-6 text-xs font-mono">
        <div className="flex items-center gap-2 text-white/80">
          <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span>Waiting: <strong>{Math.floor(secondsElapsed / 60)}:{(secondsElapsed % 60).toString().padStart(2, '0')}</strong></span>
        </div>
        <div className="w-[1px] h-4 bg-white/10" />
        <div className="text-white/60">
          Est. Wait: <strong className="text-emerald-400">~{estimatedWait}s</strong>
        </div>
      </div>

      {/* SOCIAL SHARE BUTTONS */}
      <div className="space-y-2 mb-6">
        <span className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">
          Invite Opponent Via
        </span>
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={handleShareTwitter}
            className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/90 flex items-center justify-center gap-1.5 transition-all"
          >
            <Twitter className="w-3.5 h-3.5 text-sky-400" />
            <span>X / Twitter</span>
          </button>
          <button
            onClick={handleShareWhatsApp}
            className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/90 flex items-center justify-center gap-1.5 transition-all"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>WhatsApp</span>
          </button>
          <button
            onClick={handleShareDiscord}
            className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/90 flex items-center justify-center gap-1.5 transition-all"
          >
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Discord</span>
          </button>
        </div>
      </div>

      {/* ACTION CONTROLS */}
      <div className="flex items-center justify-between gap-3 pt-2 border-t border-white/10">
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
        >
          <X className="w-4 h-4" />
          <span>Cancel Room</span>
        </button>

        <button
          onClick={onEnterBoard}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[var(--primary-accent)] to-[var(--secondary-accent)] hover:brightness-110 text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg active:scale-95"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Enter Board View</span>
        </button>
      </div>

    </div>
  );
};
