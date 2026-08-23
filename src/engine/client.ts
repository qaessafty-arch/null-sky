/**
 * Promise-based client for the engine worker.
 *
 * Every request is answered on the worker thread; if `Worker` is unavailable
 * (older browsers, SSR, unit tests) the same handler runs synchronously so the
 * app degrades instead of breaking.
 */

import type {
  EngineEvaluateResponse,
  EngineLimits,
  EnginePositionInput,
  EngineRequest,
  EngineResponse,
  EngineSearchResponse
} from './protocol';

/** `Omit` over a union must distribute, otherwise the variants collapse. */
type DistributiveOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;
type EngineRequestBody = DistributiveOmit<EngineRequest, 'id'>;

type Pending = {
  resolve: (value: never) => void;
  reject: (reason: Error) => void;
};

class EngineClient {
  private worker: Worker | null = null;
  private pending = new Map<number, Pending>();
  private nextId = 1;
  private workerFailed = false;

  private ensureWorker(): Worker | null {
    if (this.workerFailed) return null;
    if (this.worker) return this.worker;
    if (typeof Worker === 'undefined') {
      this.workerFailed = true;
      return null;
    }
    try {
      this.worker = new Worker(new URL('./engine.worker.ts', import.meta.url), { type: 'module' });
      this.worker.onmessage = (event: MessageEvent<EngineResponse>) => {
        const message = event.data;
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.type === 'error') pending.reject(new Error(message.error));
        else pending.resolve(message.result as never);
      };
      this.worker.onerror = () => {
        // Fall back to in-thread execution for every subsequent request.
        this.workerFailed = true;
        for (const [, pending] of this.pending) pending.reject(new Error('Engine worker crashed'));
        this.pending.clear();
        this.worker?.terminate();
        this.worker = null;
      };
      return this.worker;
    } catch {
      this.workerFailed = true;
      return null;
    }
  }

  private async send<T>(request: EngineRequestBody): Promise<T> {
    const id = this.nextId++;
    const message = { ...request, id } as EngineRequest;
    const worker = this.ensureWorker();

    if (!worker) {
      // Synchronous fallback — imported lazily so the heavy engine is not part
      // of the initial bundle when the worker path is available.
      const { handleEngineRequest } = await import('./handler');
      const response = handleEngineRequest(message);
      if (response.type === 'error') throw new Error(response.error);
      return response.result as T;
    }

    return new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (value: never) => void, reject });
      worker.postMessage(message);
    });
  }

  /** Full-strength search. */
  search(position: EnginePositionInput, limits: EngineLimits = {}): Promise<EngineSearchResponse> {
    return this.send<EngineSearchResponse>({ type: 'search', ...position, limits });
  }

  /** A move chosen by a bot personality (includes its deliberate-error model). */
  botMove(position: EnginePositionInput, botId: string): Promise<EngineSearchResponse> {
    return this.send<EngineSearchResponse>({ type: 'bot', ...position, botId });
  }

  /** Top-N root moves with scores. */
  analyze(position: EnginePositionInput, limits: EngineLimits = {}, multiPv = 3): Promise<EngineSearchResponse> {
    return this.send<EngineSearchResponse>({ type: 'analyze', ...position, limits, multiPv });
  }

  /** Static (search-free) evaluation. */
  evaluate(position: EnginePositionInput): Promise<EngineEvaluateResponse> {
    return this.send<EngineEvaluateResponse>({ type: 'evaluate', ...position });
  }

  clearHash(): Promise<unknown> {
    return this.send({ type: 'clearHash' });
  }

  /** Drops the worker; the next request spins up a fresh one. */
  terminate() {
    this.worker?.terminate();
    this.worker = null;
    this.pending.clear();
  }
}

export const engine = new EngineClient();
