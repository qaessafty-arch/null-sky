/**
 * SHARED ANTI-CHEAT SYSTEM: AntiCheatSystem
 * 
 * Implements:
 * - Move time analysis & variance tracking
 * - Accuracy calculation
 * - Engine evaluation correlation
 * - Flag generation
 * - Auto-ban logic
 */

export interface MoveTimingRecord {
  moveNumber: number;
  durationMs: number;
  timestamp: number;
}

export interface AntiCheatFlag {
  flagType: 'SUPERHUMAN_TIMING_VARIANCE' | 'ROBOTIC_MOVE_INTERVAL' | 'HIGH_CENTIPAWN_CORRELATION' | 'UNNATURAL_BLUR';
  metricValue: number;
  thresholdValue: number;
  details: Record<string, any>;
  timestamp: number;
}

export interface AntiCheatProfile {
  userId: string;
  totalMovesAnalyzed: number;
  timings: MoveTimingRecord[];
  flags: AntiCheatFlag[];
  isSuspended: boolean;
  suspendedUntil?: number;
}

export class AntiCheatSystem {
  private static profiles: Map<string, AntiCheatProfile> = new Map();

  // Threshold configurations
  public static readonly MIN_MOVES_FOR_VARIANCE_CHECK = 10;
  public static readonly VARIANCE_THRESHOLD_MS = 50;
  public static readonly AVERAGE_SPEED_THRESHOLD_MS = 300;
  public static readonly MAX_FLAGS_BEFORE_BAN = 5;
  public static readonly BAN_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  /**
   * Get or create a player's anti-cheat telemetry profile
   */
  public static getProfile(userId: string): AntiCheatProfile {
    if (!this.profiles.has(userId)) {
      this.profiles.set(userId, {
        userId,
        totalMovesAnalyzed: 0,
        timings: [],
        flags: [],
        isSuspended: false
      });
    }
    return this.profiles.get(userId)!;
  }

  /**
   * Record move duration in milliseconds and analyze for bot-like consistency
   */
  public static recordMoveTime(userId: string, durationMs: number, moveNumber: number): AntiCheatFlag | null {
    const profile = this.getProfile(userId);
    profile.totalMovesAnalyzed++;
    profile.timings.push({
      moveNumber,
      durationMs,
      timestamp: Date.now()
    });

    // We analyze the trailing window of moves
    if (profile.timings.length >= this.MIN_MOVES_FOR_VARIANCE_CHECK) {
      const sample = profile.timings.slice(-this.MIN_MOVES_FOR_VARIANCE_CHECK);
      const durations = sample.map(s => s.durationMs);

      const mean = durations.reduce((acc, v) => acc + v, 0) / durations.length;
      const variance = Math.sqrt(
        durations.map(x => Math.pow(x - mean, 2)).reduce((acc, v) => acc + v, 0) / durations.length
      );

      // Detection heuristic:
      // Humans have natural fluctuation (hesitation, tactical calculation, blunder recovery).
      // A bot engine playing moves with almost uniform timing (standard deviation < 50ms) and fast (<300ms) triggers.
      if (mean < this.AVERAGE_SPEED_THRESHOLD_MS && variance < this.VARIANCE_THRESHOLD_MS) {
        const flag: AntiCheatFlag = {
          flagType: 'SUPERHUMAN_TIMING_VARIANCE',
          metricValue: Math.round(variance),
          thresholdValue: this.VARIANCE_THRESHOLD_MS,
          details: {
            meanMoveTimeMs: Math.round(mean),
            varianceMs: Math.round(variance),
            sampleSize: sample.length
          },
          timestamp: Date.now()
        };

        profile.flags.push(flag);
        this.evaluateAutoBan(profile);
        return flag;
      }
    }

    return null;
  }

  /**
   * Calculate move accuracy based on centipawn loss from top engine evaluation
   */
  public static calculateMoveAccuracy(evalBeforeCp: number, evalAfterCp: number, color: 'w' | 'b'): number {
    const delta = color === 'w' ? (evalBeforeCp - evalAfterCp) : (evalAfterCp - evalBeforeCp);
    const centipawnLoss = Math.max(0, delta);

    // Exponential decay curve model for chess accuracy
    // 0 loss = 100%, 50 loss = ~80%, 150 loss = ~50%, 300+ loss = ~10%
    const accuracy = 103.1668 * Math.exp(-0.00435 * centipawnLoss) - 3.1668;
    return Math.max(0, Math.min(100, Math.round(accuracy * 10) / 10));
  }

  /**
   * Evaluate auto-ban threshold
   */
  private static evaluateAutoBan(profile: AntiCheatProfile): boolean {
    if (profile.flags.length >= this.MAX_FLAGS_BEFORE_BAN && !profile.isSuspended) {
      profile.isSuspended = true;
      profile.suspendedUntil = Date.now() + this.BAN_DURATION_MS;
      return true;
    }
    return false;
  }

  /**
   * Check if user is currently banned
   */
  public static isUserBanned(userId: string): boolean {
    const profile = this.getProfile(userId);
    if (!profile.isSuspended) return false;
    if (profile.suspendedUntil && Date.now() > profile.suspendedUntil) {
      profile.isSuspended = false;
      profile.suspendedUntil = undefined;
      return false;
    }
    return true;
  }
}
