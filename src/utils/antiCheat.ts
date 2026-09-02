// src/utils/antiCheat.ts - Anti-Cheat Singleton Telemetry Engine
export class AntiCheatEngine {
  private static instance: AntiCheatEngine | null = null;
  private static isInitialized = false;
  private static tabBlurCount = 0;
  private static lastMoveTime = 0;
  private static moveTimeVariances: number[] = [];
  private static blurListener: (() => void) | null = null;

  public static getInstance(): AntiCheatEngine {
    if (!this.instance) {
      this.instance = new AntiCheatEngine();
    }
    return this.instance;
  }

  public static initializeTelemetry(): () => void {
    if (this.isInitialized) {
      return () => {};
    }

    if (typeof window !== 'undefined') {
      this.isInitialized = true;
      this.blurListener = () => {
        this.tabBlurCount++;
        if (this.tabBlurCount > 3) {
          console.warn('[Anti-Cheat] Suspicious Activity: Frequent tab switching detected.');
          this.reportSuspiciousActivity('FREQUENT_BLUR');
        }
      };

      window.addEventListener('blur', this.blurListener);
      console.log('[Anti-Cheat] Telemetry initialized.');
    }

    // Cleanup hook preventing duplicate event listeners on unmount/remount
    return () => {
      if (this.blurListener && typeof window !== 'undefined') {
        window.removeEventListener('blur', this.blurListener);
        this.blurListener = null;
        this.isInitialized = false;
      }
    };
  }

  public static recordMoveTiming() {
    const now = Date.now();
    if (this.lastMoveTime > 0) {
      const variance = now - this.lastMoveTime;
      this.moveTimeVariances.push(variance);
      if (this.moveTimeVariances.length > 5) {
        const standardDeviation = this.calculateStandardDeviation(this.moveTimeVariances);
        if (standardDeviation < 50) {
          console.warn('[Anti-Cheat] Suspicious Activity: Unnatural move timing consistency.');
          this.reportSuspiciousActivity('BOT_TIMING');
        }
      }
    }
    this.lastMoveTime = now;
  }

  private static calculateStandardDeviation(arr: number[]) {
    const n = arr.length;
    const mean = arr.reduce((a, b) => a + b) / n;
    return Math.sqrt(arr.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
  }

  private static async reportSuspiciousActivity(reason: string) {
    try {
      if (typeof window !== 'undefined' && 'fetch' in window) {
        await fetch('/api/security/telemetry-report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason, timestamp: Date.now() })
        });
      }
    } catch {
      // Telemetry fail-safe
    }
  }
}

export default AntiCheatEngine;
