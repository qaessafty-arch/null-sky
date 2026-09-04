import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Flag, 
  Handshake, 
  RotateCcw, 
  Pause, 
  Play, 
  Gavel, 
  Box, 
  RotateCw, 
  X, 
  AlertTriangle,
  Sparkles,
  Command
} from 'lucide-react';

interface ModernFloatingControlsProps {
  onResign: () => void;
  onOfferDraw: () => void;
  onRequestTakeback?: () => void;
  onClaimDraw?: () => void;
  canClaimDraw?: boolean;
  is3dPerspective: boolean;
  onToggle3dPerspective: () => void;
  onFlipBoard: () => void;
  disabled?: boolean;
}

export const ModernFloatingControls: React.FC<ModernFloatingControlsProps> = ({
  onResign,
  onOfferDraw,
  onRequestTakeback,
  onClaimDraw,
  canClaimDraw = false,
  is3dPerspective,
  onToggle3dPerspective,
  onFlipBoard,
  disabled = false
}) => {
  const [showResignModal, setShowResignModal] = useState(false);
  const [isHandshakeAnimated, setIsHandshakeAnimated] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key.toLowerCase() === 'd' && !e.ctrlKey && !e.metaKey) {
        handleDrawClick();
      } else if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
        setShowResignModal(true);
      } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey) {
        onFlipBoard();
      } else if (e.key === '3') {
        onToggle3dPerspective();
      } else if (e.key === '?') {
        setShowShortcuts(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onFlipBoard, onToggle3dPerspective]);

  const handleDrawClick = () => {
    setIsHandshakeAnimated(true);
    setTimeout(() => setIsHandshakeAnimated(false), 1200);
    onOfferDraw();
  };

  return (
    <>
      {/* Floating Action Controls Bar (FAB) */}
      <div className="flex items-center justify-center gap-2 p-2 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/15 shadow-2xl flex-wrap">
        
        {/* Flip Board */}
        <button
          onClick={onFlipBoard}
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all active:scale-95 group relative"
          title="Flip Board Orientation (Shortcut: F)"
        >
          <RotateCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
          <span className="sr-only">Flip Board</span>
        </button>

        {/* 3D Perspective Tilt Toggle */}
        <button
          onClick={onToggle3dPerspective}
          className={`p-2.5 rounded-xl transition-all active:scale-95 relative group ${
            is3dPerspective 
              ? 'bg-[var(--secondary-accent)]/20 text-[var(--secondary-accent)] border border-[var(--secondary-accent)]/50 shadow-sm' 
              : 'bg-white/5 hover:bg-white/15 text-white/80 hover:text-white'
          }`}
          title="Toggle 3D Board Tilt (Shortcut: 3)"
        >
          <Box className="w-4 h-4" />
          <span className="sr-only">Toggle 3D View</span>
        </button>

        {/* Offer Draw with Handshake Animation */}
        <button
          onClick={handleDrawClick}
          disabled={disabled}
          className="px-3 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40"
          title="Offer Draw (Shortcut: D)"
        >
          <motion.div
            animate={isHandshakeAnimated ? { scale: [1, 1.4, 1], rotate: [0, -15, 15, 0] } : {}}
            transition={{ duration: 0.8 }}
          >
            <Handshake className="w-4 h-4 text-amber-400" />
          </motion.div>
          <span className="hidden sm:inline">Offer Draw</span>
        </button>

        {/* Claim Draw with Gavel (when condition met) */}
        {canClaimDraw && (
          <button
            onClick={onClaimDraw}
            className="px-3 py-2 rounded-xl bg-emerald-500/25 border border-emerald-400/60 text-emerald-300 text-xs font-black flex items-center gap-1.5 animate-pulse shadow-md active:scale-95"
            title="Claim Draw (Threefold Repetition / 50-Move Rule)"
          >
            <Gavel className="w-4 h-4 text-emerald-400" />
            <span>Claim Draw</span>
          </button>
        )}

        {/* Takeback Request */}
        {onRequestTakeback && (
          <button
            onClick={onRequestTakeback}
            disabled={disabled}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white transition-all active:scale-95 disabled:opacity-40"
            title="Request Move Takeback"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Resign (Red Button with Confirmation Modal) */}
        <button
          onClick={() => setShowResignModal(true)}
          disabled={disabled}
          className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/40 text-red-400 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-40"
          title="Resign Match (Shortcut: R)"
        >
          <Flag className="w-4 h-4 text-red-400" />
          <span className="hidden sm:inline">Resign</span>
        </button>

        {/* Shortcuts Info Toggle */}
        <button
          onClick={() => setShowShortcuts(prev => !prev)}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white text-xs font-mono"
          title="Keyboard Shortcuts (?)"
        >
          <Command className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Resign Warning Modal */}
      <AnimatePresence>
        {showResignModal && (
          <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-[#141416] border border-red-500/40 p-6 shadow-2xl text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-white">Resign Match?</h3>
                <p className="text-xs text-white/60">
                  Are you sure you want to forfeit? This will count as a loss and deduct rating points.
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setShowResignModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                >
                  Continue Match
                </button>
                <button
                  onClick={() => {
                    setShowResignModal(false);
                    onResign();
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-lg shadow-red-600/30 transition-all"
                >
                  Yes, Resign
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Keyboard Shortcuts Dialog */}
      <AnimatePresence>
        {showShortcuts && (
          <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowShortcuts(false)}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={e => e.stopPropagation()}
              className="w-full max-w-xs rounded-3xl bg-[#141416] border border-white/15 p-5 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-black text-white flex items-center gap-1.5">
                  <Command className="w-4 h-4 text-amber-400" />
                  <span>Keyboard Shortcuts</span>
                </span>
                <button onClick={() => setShowShortcuts(false)} className="text-white/50 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-white/60">Flip Board</span>
                  <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-bold">F</kbd>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-white/60">3D Board Tilt</span>
                  <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-bold">3</kbd>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-white/60">Offer Draw</span>
                  <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-bold">D</kbd>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-white/60">Resign Match</span>
                  <kbd className="px-2 py-0.5 rounded bg-white/10 text-white font-bold">R</kbd>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
