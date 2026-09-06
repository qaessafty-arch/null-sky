import React from 'react';
import { motion } from 'motion/react';
import { Users, LogIn, Copy, Share2, Check, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { useRoom } from '../hooks/useRoom';
import { WaitingRoom } from './Room/WaitingRoom';
import { GlassCard } from './GlassUI';
import { TIME_CONTROLS, RoomSettings } from './Room/RoomSettings';

const createDefaultSettings = () => ({
  timeControlId: 'rapid',
  timeControlName: 'Rapid',
  initialSeconds: 600,
  incrementSeconds: 0,
  color: 'white' as const,
  rated: false,
});

export const PrivateRoom: React.FC = () => {
  const room = useRoom();
  const [phase, setPhase] = React.useState<'choose' | 'create' | 'join' | 'waiting'>('choose');
  const [inputCode, setInputCode] = React.useState('');
  const [copyCopied, setCopyCopied] = React.useState(false);
  const [shareDone, setShareDone] = React.useState(false);
  const [settings, setSettings] = React.useState<{
    timeControlId: string;
    timeControlName: string;
    initialSeconds: number;
    incrementSeconds: number;
    color: 'white' | 'black' | 'random';
    rated: boolean;
  }>({
    ...createDefaultSettings(),
    color: 'white',
  });
  const [creating, setCreating] = React.useState(false);
  const [joining, setJoining] = React.useState(false);
  const [showInvitePicker, setShowInvitePicker] = React.useState(false);
  const codeInputRef = React.useRef<HTMLInputElement>(null);

  const generateRoomCode = (): string => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const handleCreate = async () => {
    setCreating(true);
    room.setJoinError(null);
    try {
      await room.hostRoom(generateRoomCode(), settings);
      setPhase('waiting');
    } catch (e: any) {
      room.setJoinError(e?.message || 'Could not create room.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    const code = inputCode.trim().toUpperCase();
    if (code.length !== 6) {
      room.setJoinError('Enter the 6-character room code.');
      return;
    }
    setJoining(true);
    room.setJoinError(null);
    const ok = await room.joinAsOpponent(code);
    if (ok) setPhase('waiting');
    setJoining(false);
  };

  const sharedCode = room.currentRoom?.roomCode;

  return (
    <div className="flex flex-col gap-6">
      {phase === 'choose' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <GlassCard intensity="medium" className="flex flex-col gap-6 p-8">
            <div className="p-3 w-12 h-12 rounded-2xl bg-[#FFD700]/10 flex items-center justify-center">
              <Users className="text-[#FFD700]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase text-white">Create Arena</h3>
              <p className="text-xs text-white/50 font-bold">HOST A PRIVATE BATTLE WITH A FRIEND</p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setPhase('create')}
                className="w-full py-4 glass-button-gold rounded-xl font-black uppercase tracking-widest text-xs"
              >
                Generate Room Code
              </button>
              <button
                onClick={() => setPhase('join')}
                className="w-full py-4 rounded-xl font-black uppercase tracking-widest text-xs border border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
              >
                Or join a friend's room
              </button>
            </div>
          </GlassCard>

          <GlassCard intensity="medium" className="flex flex-col gap-6 p-8">
            <div className="p-3 w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
              <LogIn className="text-white" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase text-white">Join Arena</h3>
              <p className="text-xs text-white/50 font-bold">ENTER CODE TO CHALLENGE HOST</p>
            </div>

            <div className="flex gap-2">
              <input
                ref={codeInputRef}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                placeholder="6-DIGIT CODE"
                className="flex-1 glass-input font-mono text-center tracking-[0.5em] uppercase"
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
              <button
                onClick={handleJoin}
                disabled={joining || inputCode.length !== 6}
                className="px-6 rounded-xl font-black uppercase text-xs border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  joining
                    ? 'bg-white/5 text-white/30 border-white/10'
                    : 'glass-button-gold'
                }"
              >
                {joining ? (
                  <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                ) : (
                  'JOIN'
                )}
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {phase === 'create' && (
        <GlassCard intensity="high" className="max-w-lg mx-auto w-full p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black uppercase text-white">Room Settings</h3>
            <p className="text-xs text-white/50 font-bold">Choose how this battle will be fought.</p>
          </div>

          <RoomSettings value={settings} onChange={setSettings} />

          <div className="flex gap-3">
            <button
              onClick={() => setPhase('choose')}
              className="flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs border border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08] transition-all cursor-pointer"
            >
              Back
            </button>
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-black uppercase tracking-widest text-xs bg-gradient-to-r from-[#52673A] to-[#8C2425] hover:brightness-110 text-white border border-[#F5C453]/40 shadow-lg shadow-[#F5C453]/20 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  Create Room
                </>
              )}
            </button>
          </div>
        </GlassCard>
      )}

      {phase === 'join' && (
        <GlassCard intensity="high" className="max-w-md mx-auto w-full p-8 space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-black uppercase text-white">Join a Room</h3>
            <p className="text-xs text-white/50 font-bold">Enter the 6-character code your friend shared.</p>
          </div>

          <div className="flex gap-2">
            <input
              ref={codeInputRef}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              placeholder="6-DIGIT CODE"
              className="flex-1 glass-input font-mono text-center tracking-[0.5em] uppercase"
              maxLength={6}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            <button
              onClick={handleJoin}
              disabled={joining || inputCode.length !== 6}
              className="px-6 rounded-xl font-black uppercase text-xs border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                joining
                  ? 'bg-white/5 text-white/30 border-white/10'
                  : 'glass-button-gold'
              }"
            >
              {joining ? (
                <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
              ) : (
                'JOIN'
              )}
            </button>
          </div>

          {inputCode.length > 0 && inputCode.length !== 6 && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-rose-300">
              <AlertCircle className="w-3.5 h-3.5" />
              Code must be exactly 6 characters (letters and numbers only).
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setPhase('choose')}
              className="flex-1 py-4 rounded-xl font-black uppercase tracking-widest text-xs border border-white/10 bg-white/[0.04] text-white/60 hover:bg-white/[0.08] transition-all cursor-pointer"
            >
              Back
            </button>
          </div>
        </GlassCard>
      )}

      {phase === 'waiting' && sharedCode && (
        <>
          <GlassCard intensity="high" className="max-w-md mx-auto w-full p-10 text-center space-y-8">
            <div className="relative inline-block">
              <div className="text-xs font-black text-[#FFD700] uppercase tracking-[0.3em] mb-4">
                Room Secure
              </div>
              <div className="text-5xl font-mono font-black text-white tracking-[0.2em] py-4 border-y border-white/10">
                {sharedCode}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-bold text-white uppercase tracking-widest animate-pulse">
                Waiting for Challenger...
              </p>
              <p className="text-xs text-white/40">
                Share this code with your opponent to start the battle.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  navigator.clipboard
                    .writeText(sharedCode)
                    .then(() => setCopyCopied(true))
                    .catch(() => {});
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 glass-frost hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer"
              >
                {copyCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy Code
                  </>
                )}
              </button>
              <button
                onClick={async () => {
                  const text = `Play chess with me! Room code: ${sharedCode}`;
                  if (navigator.share) {
                    try {
                      await navigator.share({ title: 'Private Chess Room', text });
                      setShareDone(true);
                      return;
                    } catch {
                      // fall through
                    }
                  }
                  setCopyCopied(true);
                  try {
                    await navigator.clipboard.writeText(text);
                  } catch {}
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 glass-frost hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer"
              >
                {shareDone ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    Shared
                  </>
                ) : (
                  <>
                    <Share2 size={14} />
                    Share Link
                  </>
                )}
              </button>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setPhase('choose')}
                className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white/70 transition-colors cursor-pointer"
              >
                Create another room
              </button>
            </div>
          </GlassCard>

          <WaitingRoom
            showInvitePicker={showInvitePicker}
            onShowInvitePickerChange={setShowInvitePicker}
          />
        </>
      )}

      {room.joinError && phase !== 'waiting' && (
        <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-500/10 text-rose-300 text-xs font-bold border border-rose-500/30">
          <AlertCircle className="w-4 h-4" />
          {room.joinError}
        </div>
      )}
    </div>
  );
};
