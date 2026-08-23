/// <reference lib="webworker" />
/**
 * Engine worker — keeps the search off the UI thread so the board never freezes
 * while a bot is thinking.
 */
import { handleEngineRequest } from './handler';
import type { EngineRequest } from './protocol';

self.onmessage = (event: MessageEvent<EngineRequest>) => {
  const response = handleEngineRequest(event.data);
  (self as unknown as Worker).postMessage(response);
};
