// FILE: frontend/src/utils/timeHelpers.ts
export function formatClockTime(seconds: number): string {
  const safeSecs = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safeSecs / 60);
  const secs = safeSecs % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function parseTimeControl(tc: string): { baseSeconds: number; incrementSeconds: number } {
  const parts = tc.split('+');
  const baseMinutes = parseInt(parts[0], 10) || 10;
  const incrementSeconds = parseInt(parts[1], 10) || 0;
  return {
    baseSeconds: baseMinutes * 60,
    incrementSeconds
  };
}

export function getTimeControlCategory(tc: string): 'bullet' | 'blitz' | 'rapid' | 'classical' {
  const { baseSeconds, incrementSeconds } = parseTimeControl(tc);
  const totalEstimatedSeconds = baseSeconds + 40 * incrementSeconds;

  if (totalEstimatedSeconds < 180) return 'bullet';
  if (totalEstimatedSeconds < 600) return 'blitz';
  if (totalEstimatedSeconds < 3600) return 'rapid';
  return 'classical';
}
