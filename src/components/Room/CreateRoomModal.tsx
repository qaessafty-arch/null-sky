import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Swords, ShieldCheck, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { useRoom, RoomSettings as IRoomSettings } from '../../context/RoomContext';
import { RoomSettings, RoomSettingsData } from './RoomSettings';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated?: (roomCode: string) => void;
}

const generateRandomCode = (): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onRoomCreated,
}) => {
  const room = useRoom();
  const [code, setCode] = useState<string>(generateRandomCode);
  const [settings, setSettings] = useState<RoomSettingsData>({
    timeControlId: 'rapid',
    timeControlName: 'Rapid 10+0',
    initialSeconds: 600,
    incrementSeconds: 0,
    color: 'white',
    rated: true,
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegenerateCode = () => {
    setCode(generateRandomCode());
  };

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    try {
      await room.createRoom(code, settings as IRoomSettings);
      onRoomCreated?.(code);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create room.');
    } finally {
      setCreating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-lg room-glass-card p-6 sm:p-8 flex flex-col gap-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F5C453]/15 border border-[#F5C453]/30 flex items-center justify-center text-[#F5C453]">
              <Swords className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-wider text-white">
                Create Private Room
              </h3>
              <p className="text-xs text-white/50">Host a private match with a friend</p>
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

        {/* Room Code Preview */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-black/40 border border-[#F5C453]/30">
          <div>
            <div className="text-[10px] font-black uppercase tracking-widest text-[#F5C453]">
              Generated Room Code
            </div>
            <div className="font-mono text-2xl font-black tracking-widest text-white mt-0.5">
              {code}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRegenerateCode}
            title="Generate new code"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Shuffle</span>
          </button>
        </div>

        {/* Settings Component */}
        <RoomSettings value={settings} onChange={setSettings} />

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
            {error}
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
            onClick={handleCreate}
            disabled={creating}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#F5C453] via-[#E5B543] to-[#D4A843] text-black text-xs font-black uppercase tracking-widest shadow-lg shadow-[#F5C453]/20 hover:brightness-110 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {creating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Arena...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Create Waiting Room</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
