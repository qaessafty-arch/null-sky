import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, LogIn, Loader2, Clipboard, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useRoom } from '../../context/RoomContext';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoined?: (roomCode: string) => void;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
  onJoined,
}) => {
  const room = useRoom();
  const [code, setCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      setCode('');
      setError(null);
    }
  }, [isOpen]);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const cleaned = text.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
      setCode(cleaned);
      if (cleaned.length === 6) {
        handleJoinCode(cleaned);
      }
    } catch {
      // Fallback
    }
  };

  const handleJoinCode = async (targetCode: string) => {
    const cleanCode = targetCode.trim().toUpperCase();
    if (cleanCode.length !== 6) {
      setError('Room code must be exactly 6 characters.');
      return;
    }

    setJoining(true);
    setError(null);
    try {
      await room.joinRoom(cleanCode);
      onJoined?.(cleanCode);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not join room. Make sure the code is correct and room is waiting.');
    } finally {
      setJoining(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md room-glass-card p-6 sm:p-8 flex flex-col gap-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-white">
              <LogIn className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider text-white">
                Join Private Room
              </h3>
              <p className="text-xs text-white/50">Enter the 6-character room code</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Area */}
        <div className="flex flex-col gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-white/70">
            Room Code
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={code}
              onChange={(e) => {
                const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
                setCode(val);
                if (error) setError(null);
              }}
              placeholder="e.g. ABC123"
              maxLength={6}
              className="w-full bg-black/50 border border-white/15 rounded-xl px-4 py-4 text-center font-mono text-3xl font-black tracking-[0.3em] uppercase text-white outline-none focus:border-[#F5C453] focus:ring-2 focus:ring-[#F5C453]/20 transition-all"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && code.length === 6) {
                  handleJoinCode(code);
                }
              }}
            />
            <button
              type="button"
              onClick={handlePaste}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-xs font-bold flex items-center gap-1 cursor-pointer"
              title="Paste from clipboard"
            >
              <Clipboard className="w-4 h-4" />
              <span className="hidden sm:inline">Paste</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleJoinCode(code)}
            disabled={joining || code.length !== 6}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#F5C453] via-[#E5B543] to-[#D4A843] text-black text-xs font-black uppercase tracking-widest shadow-lg shadow-[#F5C453]/20 hover:brightness-110 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {joining ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Enter Battle</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
