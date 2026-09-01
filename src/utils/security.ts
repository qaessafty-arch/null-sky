import DOMPurify from 'dompurify';

/**
 * Client & Server Security Utilities for Chesskys PRO
 */

// 1. XSS Prevention: Strict DOMPurify Sanitizer for text & chat
export function sanitizeChatText(input: string): string {
  if (!input || typeof input !== 'string') return '';
  // Sanitize with DOMPurify removing any HTML tags or script injection
  const cleaned = DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No raw HTML allowed in user chat
    ALLOWED_ATTR: [],
  }).trim();

  // Enforce max length constraint
  return cleaned.slice(0, 250);
}

// 2. DOMPurify Sanitizer for formatted display
export function sanitizeSafeHtml(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'span'],
    ALLOWED_ATTR: ['class'],
  });
}

// 3. Server-Side Move Validation API Client
export interface ServerMoveValidationResult {
  valid: boolean;
  newFen?: string;
  pgn?: string;
  turn?: 'w' | 'b';
  san?: string;
  captured?: string | null;
  flags?: string;
  isCheck?: boolean;
  isCheckmate?: boolean;
  isDraw?: boolean;
  isStalemate?: boolean;
  error?: string;
  antiCheatTriggered?: boolean;
}

export async function validateMoveOnServer(params: {
  fen: string;
  from: string;
  to: string;
  promotion?: string;
  playerColor?: 'w' | 'b';
  moveTimeMs?: number;
}): Promise<ServerMoveValidationResult> {
  try {
    const response = await fetch('/api/chess/validate-move', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        valid: false,
        error: errData.error || `Server returned status ${response.status}`,
        antiCheatTriggered: errData.antiCheatTriggered || false,
      };
    }

    const data = await response.json();
    return data;
  } catch (err: any) {
    console.warn('[Security] Server validation fallback to local rules:', err);
    // Offline or network fallback
    return { valid: true };
  }
}

// 4. Secure Auth Session Management (HttpOnly Cookies)
export async function establishSecureSession(userData: {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
}): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/session-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    return res.ok;
  } catch (e) {
    console.warn('[Security] Failed to establish HttpOnly session:', e);
    return false;
  }
}

export async function destroySecureSession(): Promise<void> {
  try {
    await fetch('/api/auth/session-logout', { method: 'POST' });
  } catch (e) {
    console.warn('[Security] Failed to destroy session cookie:', e);
  }
}

// 5. Rate Limit Guard for Friend Requests
export async function checkFriendRequestRateLimit(): Promise<boolean> {
  try {
    const res = await fetch('/api/friends/rate-limit-check', { method: 'POST' });
    return res.ok;
  } catch {
    return true; // Soft fallback
  }
}

// 6. Enterprise Anti-Cheat & Telemetry Module
export class AntiCheatEngine {
  private static tabBlurCount = 0;
  private static lastMoveTime = 0;
  private static moveTimeVariances: number[] = [];

  public static initializeTelemetry() {
    if (typeof window !== 'undefined') {
      window.addEventListener('blur', () => {
        this.tabBlurCount++;
        if (this.tabBlurCount > 3) {
          console.warn('[Anti-Cheat] Suspicious Activity: Frequent tab switching detected.');
          this.reportSuspiciousActivity('FREQUENT_BLUR');
        }
      });
      console.log('[Anti-Cheat] Telemetry initialized.');
    }
  }

  public static recordMoveTiming() {
    const now = Date.now();
    if (this.lastMoveTime > 0) {
      const variance = now - this.lastMoveTime;
      this.moveTimeVariances.push(variance);
      // If move times are consistently exactly identical (e.g. 500ms bot), flag it
      if (this.moveTimeVariances.length > 5) {
        const standardDeviation = this.calculateStandardDeviation(this.moveTimeVariances);
        if (standardDeviation < 50) { // Unnaturally consistent
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
    return Math.sqrt(arr.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / n);
  }

  private static async reportSuspiciousActivity(reason: string) {
    try {
      await fetch('/api/security/telemetry-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, timestamp: Date.now() })
      });
    } catch {
      // Fail silently for telemetry
    }
  }
}
