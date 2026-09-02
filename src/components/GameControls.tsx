import React from 'react';
import { motion } from 'motion/react';
import { RotateCw, Undo2, Redo2, Flag, Volume2, VolumeX, Sparkles, PlusCircle, Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { GlassButton } from './GlassButton';

interface GameControlsProps {
  onNewGame: () => void;
  onFlipBoard: () => void;
  onUndo: () => void;
  onRedo?: () => void;
  onResign: () => void;
  onHint: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  canUndo: boolean;
  canRedo?: boolean;
  isAiMode: boolean;
  onOpenAnalysis?: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onNewGame,
  onFlipBoard,
  onUndo,
  onRedo,
  onResign,
  onHint,
  soundEnabled,
  onToggleSound,
  canUndo,
  canRedo = false,
  isAiMode,
  onOpenAnalysis
}) => {
  const { t } = useTranslation();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="grid grid-cols-4 sm:grid-cols-7 gap-2 p-3 bg-[var(--glass-panel)] backdrop-blur-xl rounded-[2rem] border border-[var(--glass-border)] shadow-2xl"
    >
      <motion.div variants={itemVariants} className="h-full">
        <GlassButton
          id="btn-new-game"
          onClick={onNewGame}
          variant="primary"
          className="flex-col w-full h-full !rounded-2xl !p-3 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          ariaLabel="Start a new chess match"
        >
          <PlusCircle className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-tighter">New</span>
        </GlassButton>
      </motion.div>

      <motion.div variants={itemVariants} className="h-full">
        <GlassButton
          id="btn-flip-board"
          onClick={onFlipBoard}
          variant="default"
          className="flex-col w-full h-full !rounded-2xl !p-3"
          ariaLabel="Flip board orientation"
        >
          <RotateCw className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Flip</span>
        </GlassButton>
      </motion.div>

      <motion.div variants={itemVariants} className="h-full">
        <GlassButton
          id="btn-undo-move"
          onClick={onUndo}
          disabled={!canUndo}
          variant="default"
          className="flex-col w-full h-full !rounded-2xl !p-3"
          ariaLabel="Take back last move"
        >
          <Undo2 className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Undo</span>
        </GlassButton>
      </motion.div>

      <motion.div variants={itemVariants} className="h-full">
        <GlassButton
          id="btn-redo-move"
          onClick={onRedo}
          disabled={!canRedo}
          variant="default"
          className="flex-col w-full h-full !rounded-2xl !p-3"
          ariaLabel="Redo move"
        >
          <Redo2 className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Redo</span>
        </GlassButton>
      </motion.div>

      <motion.div variants={itemVariants} className="h-full">
        <GlassButton
          id="btn-get-hint"
          onClick={onHint}
          variant="secondary"
          className="flex-col w-full h-full !rounded-2xl !p-3 shadow-lg"
          ariaLabel="Request engine tactical hint"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Hint</span>
        </GlassButton>
      </motion.div>

      <motion.div variants={itemVariants} className="h-full">
        <GlassButton
          id="btn-toggle-sound"
          onClick={onToggleSound}
          variant={soundEnabled ? "secondary" : "default"}
          className="flex-col w-full h-full !rounded-2xl !p-3"
          ariaLabel={soundEnabled ? 'Mute audio' : 'Enable audio'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 opacity-40" />}
          <span className="text-[10px] font-black uppercase tracking-tighter">{soundEnabled ? 'On' : 'Off'}</span>
        </GlassButton>
      </motion.div>

      <motion.div variants={itemVariants} className="h-full">
        <GlassButton
          id="btn-resign-game"
          onClick={onResign}
          variant="red"
          className="flex-col w-full h-full !rounded-2xl !p-3"
          ariaLabel="Resign current match"
        >
          <Flag className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-tighter">Resign</span>
        </GlassButton>
      </motion.div>
    </motion.div>
  );
};
