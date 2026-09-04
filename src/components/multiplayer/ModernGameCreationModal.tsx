import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Clock, 
  Zap, 
  ShieldCheck, 
  Flame, 
  Copy, 
  Check, 
  RefreshCw, 
  QrCode, 
  Swords, 
  Play 
} from 'lucide-react';
import { TimeControl } from '../../types/chess';
import { TIME_CONTROLS } from '../../utils/chessEngine';
import { soundManager } from '../../utils/audio';
import confetti from 'canvas-confetti';
import { ModernWaitingRoom } from './ModernWaitingRoom';

interface ModernGameCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGame: (config: {
    timeControl: TimeControl;
    isRated: boolean;
    colorPreference: 'w' | 'b' | 'random';
    roomCode: string;
  }) => Promise<string>;
  onStartMatch: (matchId: string) => void;
}

export const ModernGameCreationModal: React.FC<ModernGameCreationModalProps> = ({
  isOpen,
  onClose,
  onCreateGame,
  onStartMatch
}) => {
  const [selectedTc, setSelectedTc] = useState<TimeControl>(TIME_CONTROLS[5]); // Rapid 10m
  const [isRated, setIsRated] = useState(true);
  const [colorPref, setColorPref] = useState<'w' | 'b' | 'random'>('random');
  const [isCreating, setIsCreating] = useState(false);
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);

  // Generate clean 6-character room code excluding 0, O, 1, I, L
  const generateCleanCode = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let res = '';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return res;
  };

  const [pregeneratedCode, setPregeneratedCode] = useState(generateCleanCode);

  if (!isOpen) return null;

  const handleCreate = async () => {
    setIsCreating(true);
    try {
      soundManager.playCapture();
      const matchId = await onCreateGame({
        timeControl: selectedTc,
        isRated,
        colorPreference: colorPref,
        roomCode: pregeneratedCode
      });
      setCreatedRoomCode(matchId || pregeneratedCode);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl relative"
      >
        {!createdRoomCode ? (
          <div className="w-full rounded-3xl bg-[#0d1117]/95 border border-white/15 backdrop-blur-2xl shadow-[0_0_60px_rgba(0,0,0,0.8)] p-6 sm:p-8 select-none">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[var(--primary-accent)] to-[var(--secondary-accent)] p-0.5 shadow-lg">
                  <div className="w-full h-full bg-[#0d1117] rounded-[14px] flex items-center justify-center text-[var(--secondary-accent)]">
                    <Swords className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                    <span>Create Custom Game</span>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </h2>
                  <p className="text-xs text-white/60">Choose your time control, mode, and piece color</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white flex items-center justify-center transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Room Code Banner */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between mb-5">
              <div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-white/50 block">Room Code</span>
                <span className="font-mono text-xl font-black text-white tracking-[0.2em]">{pregeneratedCode}</span>
              </div>
              <button
                type="button"
                onClick={() => setPregeneratedCode(generateCleanCode())}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all"
                title="Generate new code"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            {/* Time Control Cards with Animated Hover */}
            <div className="space-y-2 mb-5">
              <label className="text-xs font-bold uppercase tracking-wider text-white/70 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--secondary-accent)]" />
                <span>Select Time Control</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {TIME_CONTROLS.slice(0, 8).map(tc => {
                  const isSelected = selectedTc.id === tc.id;
                  return (
                    <button
                      key={tc.id}
                      type="button"
                      onClick={() => setSelectedTc(tc)}
                      className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden group ${
                        isSelected
                          ? 'bg-gradient-to-tr from-[var(--primary-accent)]/20 to-[var(--secondary-accent)]/20 border-[var(--secondary-accent)] shadow-[0_0_20px_rgba(108,99,255,0.3)]'
                          : 'bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-white">{tc.name}</span>
                        {isSelected && <span className="w-2 h-2 rounded-full bg-[var(--secondary-accent)] animate-ping" />}
                      </div>
                      <span className="text-[10px] text-white/50 capitalize font-mono block">
                        {tc.category}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Rated Toggle with Spring Animation */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Rated Match</span>
                  <span className="text-[10px] text-white/50 block">Results count toward global ELO & Respect points</span>
                </div>
              </div>

              {/* Spring Switch */}
              <button
                type="button"
                onClick={() => setIsRated(!isRated)}
                className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${
                  isRated ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-white/15'
                }`}
              >
                <motion.div
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className={`w-5 h-5 rounded-full bg-white shadow-md ${isRated ? 'ml-auto' : 'mr-auto'}`}
                />
              </button>
            </div>

            {/* Color Preference 3D rotating pieces */}
            <div className="space-y-2 mb-6">
              <label className="text-xs font-bold uppercase tracking-wider text-white/70 block">
                Color Preference
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setColorPref('w')}
                  className={`p-3 rounded-2xl border text-center transition-all group ${
                    colorPref === 'w'
                      ? 'bg-white/20 border-white text-white shadow-lg'
                      : 'bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <motion.div 
                    animate={colorPref === 'w' ? { rotateY: [0, 360] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                    className="text-3xl mb-1"
                  >
                    ♔
                  </motion.div>
                  <span className="text-xs font-bold block">White</span>
                </button>

                <button
                  type="button"
                  onClick={() => setColorPref('random')}
                  className={`p-3 rounded-2xl border text-center transition-all group ${
                    colorPref === 'random'
                      ? 'bg-gradient-to-tr from-purple-500/20 to-pink-500/20 border-purple-400 text-white shadow-lg'
                      : 'bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <motion.div 
                    animate={colorPref === 'random' ? { rotate: [0, 180, 360] } : {}}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 }}
                    className="text-3xl mb-1"
                  >
                    🎲
                  </motion.div>
                  <span className="text-xs font-bold block">Random</span>
                </button>

                <button
                  type="button"
                  onClick={() => setColorPref('b')}
                  className={`p-3 rounded-2xl border text-center transition-all group ${
                    colorPref === 'b'
                      ? 'bg-black/60 border-white/40 text-white shadow-lg'
                      : 'bg-white/[0.03] border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  <motion.div 
                    animate={colorPref === 'b' ? { rotateY: [0, 360] } : {}}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                    className="text-3xl mb-1"
                  >
                    ♚
                  </motion.div>
                  <span className="text-xs font-bold block">Black</span>
                </button>
              </div>
            </div>

            {/* Create Button with Loading & Confetti */}
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-[var(--primary-accent)] via-purple-500 to-[var(--secondary-accent)] hover:brightness-110 active:scale-95 text-white font-black text-base shadow-[0_0_30px_rgba(108,99,255,0.4)] flex items-center justify-center gap-2.5 transition-all"
            >
              {isCreating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Provisioning Game Room...</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  <span>Create Game ({pregeneratedCode})</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <ModernWaitingRoom
            gameCode={createdRoomCode}
            timeControlName={selectedTc.name}
            isRated={isRated}
            playerSide={colorPref}
            onCancel={() => {
              setCreatedRoomCode(null);
              setPregeneratedCode(generateCleanCode());
            }}
            onEnterBoard={() => {
              onStartMatch(createdRoomCode);
              onClose();
            }}
          />
        )}
      </motion.div>
    </div>
  );
};
