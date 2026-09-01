import React from 'react';
import { RotateCw, Undo2, Redo2, Flag, Volume2, VolumeX, Sparkles, PlusCircle, Compass } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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

  return (
    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 p-3 obsidian-panel shadow-2xl border-[#1F293D]">
      <button
        id="btn-new-game"
        onClick={onNewGame}
        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#F59E0B] text-[#0B0F19] hover:brightness-110 transition-all interactive-btn shadow-[0_0_15px_rgba(245,158,11,0.3)]"
        title="Start a new chess match"
      >
        <PlusCircle className="w-4 h-4 mb-1" />
        <span className="text-[10px] font-black uppercase tracking-tighter">New</span>
      </button>

      <button
        id="btn-flip-board"
        onClick={onFlipBoard}
        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#111827] text-[#94A3B8] hover:text-[#F59E0B] border border-[#1F293D] hover:border-[#F59E0B]/30 transition-all interactive-btn"
        title="Flip board orientation"
      >
        <RotateCw className="w-4 h-4 mb-1" />
        <span className="text-[10px] font-black uppercase tracking-tighter">Flip</span>
      </button>

      <button
        id="btn-undo-move"
        onClick={onUndo}
        disabled={!canUndo}
        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all interactive-btn ${
          canUndo
            ? 'bg-[#111827] text-[#94A3B8] hover:text-[#F59E0B] border-[#1F293D] hover:border-[#F59E0B]/30'
            : 'bg-[#0B0F19] text-[#94A3B8]/20 border-[#1F293D]/50 opacity-40 grayscale pointer-events-none'
        }`}
        title="Take back last move"
      >
        <Undo2 className="w-4 h-4 mb-1" />
        <span className="text-[10px] font-black uppercase tracking-tighter">Undo</span>
      </button>

      <button
        id="btn-redo-move"
        onClick={onRedo}
        disabled={!canRedo}
        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all interactive-btn ${
          canRedo
            ? 'bg-[#111827] text-[#94A3B8] hover:text-[#F59E0B] border-[#1F293D] hover:border-[#F59E0B]/30'
            : 'bg-[#0B0F19] text-[#94A3B8]/20 border-[#1F293D]/50 opacity-40 grayscale pointer-events-none'
        }`}
        title="Redo move"
      >
        <Redo2 className="w-4 h-4 mb-1" />
        <span className="text-[10px] font-black uppercase tracking-tighter">Redo</span>
      </button>

      <button
        id="btn-get-hint"
        onClick={onHint}
        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#111827] text-[#F59E0B] border border-[#F59E0B]/20 hover:border-[#F59E0B]/60 transition-all interactive-btn shadow-lg"
        title="Request engine tactical hint"
      >
        <Sparkles className="w-4 h-4 mb-1" />
        <span className="text-[10px] font-black uppercase tracking-tighter">Hint</span>
      </button>

      <button
        id="btn-toggle-sound"
        onClick={onToggleSound}
        className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all interactive-btn ${
          soundEnabled
            ? 'bg-[#111827] text-[#F59E0B] border-[#F59E0B]/20'
            : 'bg-[#0B0F19] text-[#94A3B8] border-[#1F293D]'
        }`}
        title={soundEnabled ? 'Mute audio' : 'Enable audio'}
      >
        {soundEnabled ? <Volume2 className="w-4 h-4 mb-1" /> : <VolumeX className="w-4 h-4 mb-1 opacity-40" />}
        <span className="text-[10px] font-black uppercase tracking-tighter">{soundEnabled ? 'On' : 'Off'}</span>
      </button>

      <button
        id="btn-resign-game"
        onClick={onResign}
        className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#EF4444]/10 text-[#EF4444] hover:bg-[#EF4444]/20 border border-[#EF4444]/30 transition-all interactive-btn"
        title="Resign current match"
      >
        <Flag className="w-4 h-4 mb-1" />
        <span className="text-[10px] font-black uppercase tracking-tighter">Resign</span>
      </button>
    </div>
  );
};
