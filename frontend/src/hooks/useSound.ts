// FILE: frontend/src/hooks/useSound.ts
import { useCallback, useRef } from 'react';

export function useSound(enabled: boolean = true) {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.1) => {
    if (!enabled) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch {}
  }, [enabled, getAudioContext]);

  const playMove = useCallback(() => {
    playTone(480, 0.08, 'triangle', 0.15);
  }, [playTone]);

  const playCapture = useCallback(() => {
    playTone(320, 0.12, 'sawtooth', 0.2);
  }, [playTone]);

  const playCheck = useCallback(() => {
    playTone(880, 0.18, 'sine', 0.25);
  }, [playTone]);

  const playGameOver = useCallback(() => {
    if (!enabled) return;
    playTone(440, 0.15, 'sine', 0.2);
    setTimeout(() => playTone(330, 0.25, 'sine', 0.2), 150);
  }, [enabled, playTone]);

  return {
    playMove,
    playCapture,
    playCheck,
    playGameOver
  };
}
