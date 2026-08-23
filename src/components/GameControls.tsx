import React from 'react';
import { RotateCw, Undo2, Flag, Volume2, VolumeX, Sparkles, PlusCircle, Compass } from 'lucide-react';

interface GameControlsProps {
  onNewGame: () => void;
  onFlipBoard: () => void;
  onUndo: () => void;
  onResign: () => void;
  onHint: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  canUndo: boolean;
  isAiMode: boolean;
  onOpenAnalysis?: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onNewGame,
  onFlipBoard,
  onUndo,
  onResign,
  onHint,
  soundEnabled,
  onToggleSound,
  canUndo,
  isAiMode,
  onOpenAnalysis
}) => {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 p-2.5 glass-card shadow-xl border border-[#F5C453]/20">
      <button
        id="btn-new-game"
        onClick={onNewGame}
        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#52673A]/40 text-[#FDFCF7] hover:bg-[#52673A]/80 border border-[#F5C453]/30 transition-all hover:scale-105 active:scale-95 text-xs font-semibold backdrop-blur-md shadow-sm cursor-pointer"
        title="Start a new chess match"
      >
        <PlusCircle className="w-4 h-4 mb-1 text-[#F5C453]" />
        <span>New</span>
      </button>

      <button
        id="btn-flip-board"
        onClick={onFlipBoard}
        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#161c12]/60 text-[#DFD0B0]/80 hover:bg-[#161c12] hover:text-white border border-[#F5C453]/20 transition-all hover:scale-105 active:scale-95 text-xs font-medium backdrop-blur-md shadow-sm cursor-pointer"
        title="Flip board orientation"
      >
        <RotateCw className="w-4 h-4 mb-1 text-[#DFD0B0]" />
        <span>Flip</span>
      </button>

      <button
        id="btn-undo-move"
        onClick={onUndo}
        disabled={!canUndo}
        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-xs font-medium backdrop-blur-md shadow-sm cursor-pointer ${
          canUndo
            ? 'bg-[#161c12]/60 text-[#DFD0B0]/80 hover:bg-[#161c12] hover:text-white border-[#F5C453]/20 hover:scale-105 active:scale-95'
            : 'bg-white/[0.02] text-white/20 border-white/5 cursor-not-allowed opacity-50'
        }`}
        title="Take back last move"
      >
        <Undo2 className="w-4 h-4 mb-1" />
        <span>Undo</span>
      </button>

      <button
        id="btn-get-hint"
        onClick={onHint}
        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#52673A]/25 text-[#F5C453] hover:bg-[#52673A]/50 border border-[#F5C453]/30 transition-all hover:scale-105 active:scale-95 text-xs font-medium backdrop-blur-md shadow-sm cursor-pointer"
        title="Request engine tactical hint"
      >
        <Sparkles className="w-4 h-4 mb-1 text-[#F5C453]" />
        <span>Hint</span>
      </button>

      <button
        id="btn-toggle-sound"
        onClick={onToggleSound}
        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all hover:scale-105 active:scale-95 text-xs font-medium backdrop-blur-md shadow-sm cursor-pointer ${
          soundEnabled
            ? 'bg-[#161c12]/60 text-[#DFD0B0]/80 hover:bg-[#161c12] hover:text-white border-[#F5C453]/20'
            : 'bg-white/[0.03] text-white/40 border-white/5'
        }`}
        title={soundEnabled ? 'Mute audio' : 'Enable audio'}
      >
        {soundEnabled ? <Volume2 className="w-4 h-4 mb-1 text-emerald-400" /> : <VolumeX className="w-4 h-4 mb-1 text-rose-400" />}
        <span>{soundEnabled ? 'Audio' : 'Muted'}</span>
      </button>

      <button
        id="btn-resign-game"
        onClick={onResign}
        className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-[#8C2425]/30 text-rose-200 hover:bg-[#8C2425]/60 border border-[#8C2425]/50 transition-all hover:scale-105 active:scale-95 text-xs font-medium backdrop-blur-md shadow-sm cursor-pointer"
        title="Resign current match"
      >
        <Flag className="w-4 h-4 mb-1 text-rose-300" />
        <span>Resign</span>
      </button>
    </div>
  );
};
