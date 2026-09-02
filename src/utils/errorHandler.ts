// src/utils/errorHandler.ts - Centralized Error Handling & WebSocket Suppression
export interface AppError {
  message: string;
  code?: string;
  source?: string;
  timestamp: number;
}

export class ErrorHandler {
  private static listeners: ((error: AppError) => void)[] = [];

  public static setupGlobalHandlers() {
    if (typeof window === 'undefined') return;

    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      const msg = reason?.message || String(reason);

      // Gracefully suppress expected benign dev server WebSocket closure events
      if (
        msg.includes('WebSocket') ||
        msg.includes('closed without opened') ||
        msg.includes('vite') ||
        (reason?.stack && reason.stack.includes('vite'))
      ) {
        event.preventDefault();
        event.stopPropagation();
        console.debug('[HMR Bypass] Ignored expected Vite HMR disconnection:', msg);
        return;
      }

      ErrorHandler.notify({
        message: msg,
        source: 'unhandledrejection',
        timestamp: Date.now()
      });
    });

    window.addEventListener('error', (event) => {
      const msg = event.message || '';
      if (
        msg.includes('WebSocket') ||
        msg.includes('closed without opened') ||
        msg.includes('vite')
      ) {
        event.preventDefault();
        event.stopPropagation();
        console.debug('[HMR Bypass] Ignored expected Vite error event:', msg);
        return;
      }

      ErrorHandler.notify({
        message: msg,
        source: 'window.error',
        timestamp: Date.now()
      });
    }, true);
  }

  public static subscribe(listener: (error: AppError) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public static notify(err: AppError) {
    console.error(`[AppError] (${err.source}): ${err.message}`);
    this.listeners.forEach((listener) => {
      try {
        listener(err);
      } catch (e) {
        console.error('Error in error listener', e);
      }
    });
  }
}
