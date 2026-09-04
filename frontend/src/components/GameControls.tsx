// FILE: frontend/src/components/GameControls.tsx
import React, { useState } from 'react';
import { Flag, Handshake, RotateCcw, Pause, Play, RefreshCw } from 'lucide-react';

interface GameControlsProps {
  onResign: () => void;
  onOfferDraw: () => void;
  onRequestTakeback: () => void;
  onFlipBoard: () => void;
  onTogglePause?: () => void;
  isPaused?: boolean;
  disabled?: boolean;
  isDrawOffered?: boolean;
  onAcceptDraw?: () => void;
  onDeclineDraw?: () => void;
  isTakebackRequested?: boolean;
  onAcceptTakeback?: () => void;
  onDeclineTakeback?: () => void;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onResign,
  onOfferDraw,
  onRequestTakeback,
  onFlipBoard,
  onTogglePause,
  isPaused = false,
  disabled = false,
  isDrawOffered = false,
  onAcceptDraw,
  onDeclineDraw,
  isTakebackRequested = false,
  onAcceptTakeback,
  onDeclineTakeback
}) => {
  const [confirmResign, setConfirmResign] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
      {/* Draw Offer Notification Banner */}
      {isDrawOffered && onAcceptDraw && onDeclineDraw && (
        <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-lg flex items-center justify-between animate-fade-in">
          <span className="text-xs text-amber-200 font-medium">Opponent offered a draw</span>
          <div className="flex gap-2">
            <button
              onClick={onAcceptDraw}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded"
            >
              Accept
            </button>
            <button
              onClick={onDeclineDraw}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded"
            >
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Takeback Notification Banner */}
      {isTakebackRequested && onAcceptTakeback && onDeclineTakeback && (
        <div className="p-3 bg-sky-950/60 border border-sky-500/40 rounded-lg flex items-center justify-between animate-fade-in">
          <span className="text-xs text-sky-200 font-medium">Opponent requested a takeback</span>
          <div className="flex gap-2">
            <button
              onClick={onAcceptTakeback}
              className="px-2.5 py-1 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold rounded"
            >
              Allow
            </button>
            <button
              onClick={onDeclineTakeback}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded"
            >
              Deny
            </button>
          </div>
        </div>
      )}

      {/* Standard Controls Grid */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={onFlipBoard}
          className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 transition-colors text-[11px] font-medium"
          title="Flip board orientation"
        >
          <RefreshCw className="w-4 h-4 mb-1 text-slate-400" />
          Flip
        </button>

        <button
          onClick={onOfferDraw}
          disabled={disabled}
          className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-850 hover:bg-slate-800 disabled:opacity-40 text-slate-300 transition-colors text-[11px] font-medium"
          title="Offer Draw"
        >
          <Handshake className="w-4 h-4 mb-1 text-amber-400" />
          Draw
        </button>

        <button
          onClick={onRequestTakeback}
          disabled={disabled}
          className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-850 hover:bg-slate-800 disabled:opacity-40 text-slate-300 transition-colors text-[11px] font-medium"
          title="Request Takeback"
        >
          <RotateCcw className="w-4 h-4 mb-1 text-sky-400" />
          Takeback
        </button>

        {confirmResign ? (
          <div className="flex flex-col gap-1">
            <button
              onClick={() => {
                onResign();
                setConfirmResign(false);
              }}
              className="p-1 rounded bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmResign(false)}
              className="p-1 rounded bg-slate-800 text-slate-400 text-[10px]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmResign(true)}
            disabled={disabled}
            className="flex flex-col items-center justify-center p-2 rounded-lg bg-slate-850 hover:bg-rose-950/40 hover:text-rose-400 disabled:opacity-40 text-slate-300 transition-colors text-[11px] font-medium"
            title="Resign Game"
          >
            <Flag className="w-4 h-4 mb-1 text-rose-500" />
            Resign
          </button>
        )}
      </div>

      {onTogglePause && (
        <button
          onClick={onTogglePause}
          className="w-full py-1.5 px-3 bg-slate-850 hover:bg-slate-800 text-xs text-slate-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors border border-slate-750"
        >
          {isPaused ? (
            <>
              <Play className="w-3.5 h-3.5 text-emerald-400" />
              Resume Match
            </>
          ) : (
            <>
              <Pause className="w-3.5 h-3.5 text-amber-400" />
              Pause Match
            </>
          )}
        </button>
      )}
    </div>
  );
};
