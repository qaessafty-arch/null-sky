import { McpServer } from '@modelcontextprotocol/server';
import { NodeStreamableHTTPServerTransport, localhostOriginValidation } from '@modelcontextprotocol/node';
import * as z from 'zod/v4';
import type { ToolAnnotations } from '@modelcontextprotocol/server';
import type { Application } from 'express';

// ---------------------------------------------------------------------------
// Chesskys PRO MCP server
// Wraps the existing Express backend with typed MCP tools over Streamable HTTP.
// ---------------------------------------------------------------------------

const BACKEND_URL = (() => {
  const p = process.env.CHESSKYS_BACKEND_URL;
  if (p) return p.replace(/\/+$/, '');
  const port = process.env.PORT || '3000';
  return `http://127.0.0.1:${port}`;
})();

const TENANT = process.env.CHESSKYS_TENANT || 'chesskys-pro';

const server = new McpServer({
  name: 'chesskys-pro',
  version: process.env.npm_package_version || '0.0.0',
});

async function backendFetch(path_: string, opts: { method?: string; body?: unknown; extraHeaders?: Record<string, string> } = {}) {
  const url = new URL(path_, BACKEND_URL);
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(opts.extraHeaders || {}),
  };
  const cookie = process.env.CHESSKYS_SESSION_COOKIE;
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(url.toString(), {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let json: unknown;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (!res.ok) {
    throw new Error(`Backend ${res.status} ${path_}: ${JSON.stringify(json)}`);
  }
  return { status: res.status, json, raw: text };
}

// ---- Tools ----

const healthTool = server.registerTool(
  'chesskys_health',
  {
    description: 'Return the Chesskys PRO backend health and security posture (status, edition, security features, timestamp).',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: z.object({}),
  },
  async () => {
    const { json } = await backendFetch('/api/health');
    return {
      content: [{ type: 'text', text: `Chesskys PRO health check:\n${JSON.stringify(json, null, 2)}` }],
      structuredContent: json as Record<string, unknown>,
    };
  },
);
const leaderboardTool = server.registerTool(
  'chesskys_leaderboard',
  {
    description: 'Query the worldwide leaderboard for a given mode (blitz/rapid/bullet) and optional scope, period, page, search, and country filters.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: z.object({
      mode: z.enum(['blitz', 'rapid', 'bullet']).default('blitz'),
      scope: z.enum(['global', 'country']).default('global'),
      period: z.enum(['all', 'month', 'week']).default('all'),
      page: z.number().int().min(1).default(1),
      limit: z.number().int().min(1).max(100).default(50),
      search: z.string().optional(),
      country: z.string().optional(),
    }),
  },
  async (args: Record<string, unknown>) => {
    const q = new URLSearchParams();
    q.set('mode', (args.mode as string) || 'blitz');
    q.set('scope', (args.scope as string) || 'global');
    q.set('period', (args.period as string) || 'all');
    q.set('page', String(args.page ?? 1));
    q.set('limit', String(args.limit ?? 50));
    if (args.search) q.set('search', String(args.search));
    if (args.country) q.set('country', String(args.country));
    const { json } = await backendFetch(`/api/leaderboard?${q.toString()}`);
    return {
      content: [{ type: 'text', text: `Leaderboard (${(args.mode as string) || 'blitz'}, ${(args.scope as string) || 'global'}, ${(args.period as string) || 'all'}, page ${args.page ?? 1}):\n${JSON.stringify(json, null, 2)}` }],
      structuredContent: json as Record<string, unknown>,
    };
  },
);

server.registerTool(
  'chesskys_leaderboard_rank',
  {
    description: 'Get a specific user rank and their leaderboard neighbors by user id and mode.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: z.object({
      userId: z.string().min(1),
      mode: z.enum(['blitz', 'rapid', 'bullet']).default('blitz'),
    }),
  },
  async (args: Record<string, unknown>) => {
    const { json } = await backendFetch(`/api/leaderboard/rank/${encodeURIComponent(args.userId as string)}?mode=${(args.mode as string) || 'blitz'}`);
    return {
      content: [{ type: 'text', text: `Rank for ${args.userId} (${(args.mode as string) || 'blitz'}):\n${JSON.stringify(json, null, 2)}` }],
      structuredContent: json as Record<string, unknown>,
    };
  },
);

server.registerTool(
  'chesskys_leaderboard_distribution',
  {
    description: 'Return Elo distribution histogram buckets for a given mode.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: z.object({
      mode: z.enum(['blitz', 'rapid', 'bullet']).default('blitz'),
    }),
  },
  async (args: Record<string, unknown>) => {
    const { json } = await backendFetch(`/api/leaderboard/distribution?mode=${(args.mode as string) || 'blitz'}`);
    return {
      content: [{ type: 'text', text: `Elo distribution for ${(args.mode as string) || 'blitz'}:\n${JSON.stringify(json, null, 2)}` }],
      structuredContent: json as Record<string, unknown>,
    };
  },
);

server.registerTool(
  'chesskys_validate_move',
  {
    description: 'Ask the server-authoritative chess engine whether a move is legal from a FEN and get back the resulting FEN/PGN, turn, flags, check/checkmate/draw status, and anti-cheat flags. Requires fen, from, to.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: z.object({
      fen: z.string().min(1),
      from: z.string().min(2).max(2),
      to: z.string().min(2).max(2),
      promotion: z.string().length(1).optional(),
      playerColor: z.enum(['w', 'b']).optional(),
      moveTimeMs: z.number().int().min(0).optional(),
    }),
  },
  async (args: Record<string, unknown>) => {
    const body = {
      fen: args.fen as string,
      from: args.from as string,
      to: args.to as string,
      promotion: (args.promotion as string) || 'q',
      playerColor: args.playerColor as string | undefined,
      moveTimeMs: args.moveTimeMs != null ? args.moveTimeMs : undefined,
    };
    const { json } = await backendFetch('/api/chess/validate-move', { method: 'POST', body });
    return {
      content: [{ type: 'text', text: `Move validation (${body.from}->${body.to}):\n${JSON.stringify(json, null, 2)}` }],
      structuredContent: json as Record<string, unknown>,
    };
  },
);

server.registerTool(
  'chesskys_game_state',
  {
    description: 'Return full state for a running match by game id or 6-character room code: FEN, PGN, turn, status, clocks, players, move list, check/checkmate/stalemate/draw flags.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: z.object({ id: z.string().min(1) }),
  },
  async (args: Record<string, unknown>) => {
    const { json } = await backendFetch(`/api/games/${encodeURIComponent(args.id as string)}/state`);
    return {
      content: [{ type: 'text', text: `Game state for ${args.id}:\n${JSON.stringify(json, null, 2)}` }],
      structuredContent: json as Record<string, unknown>,
    };
  },
);

server.registerTool(
  'chesskys_game_pgn',
  {
    description: 'Export a match as PGN text by game id or 6-character room code.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: z.object({ id: z.string().min(1) }),
  },
  async (args: Record<string, unknown>) => {
    const { json, raw } = await backendFetch(`/api/games/${encodeURIComponent(args.id as string)}/pgn`, {
      extraHeaders: { Accept: 'application/json' },
    });
    const pgn = json && typeof json === 'object' && 'pgn' in json ? json.pgn : raw;
    return {
      content: [{ type: 'text', text: `PGN for ${args.id}:\n\n${pgn}` }],
      structuredContent: { id: args.id, pgn },
    };
  },
);

server.registerTool(
  'chesskys_game_fen',
  {
    description: 'Return the current FEN string for a match by game id or 6-character room code.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: z.object({ id: z.string().min(1) }),
  },
  async (args: Record<string, unknown>) => {
    const { json } = await backendFetch(`/api/games/${encodeURIComponent(args.id as string)}/fen`);
    return {
      content: [{ type: 'text', text: `FEN for ${args.id}: ${json && typeof json === 'object' && 'fen' in json ? json.fen : JSON.stringify(json)}` }],
      structuredContent: json && typeof json === 'object' ? (json as Record<string, unknown>) : { fen: null },
    };
  },
);

server.registerTool(
  'chesskys_game_moves',
  {
    description: 'List all moves for a match by game id or 6-character room code.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: z.object({ id: z.string().min(1) }),
  },
  async (args: Record<string, unknown>) => {
    const { json } = await backendFetch(`/api/games/${encodeURIComponent(args.id as string)}/moves`);
    const movesLen = json && typeof json === 'object' && 'moves' in json && Array.isArray(json.moves) ? (json.moves as unknown[]).length : 0;
    return {
      content: [{ type: 'text', text: `Moves for ${args.id} (${movesLen}):\n${JSON.stringify(json, null, 2)}` }],
      structuredContent: json && typeof json === 'object' ? (json as Record<string, unknown>) : { moves: [] },
    };
  },
);

server.registerTool(
  'chesskys_create_game',
  {
    description: 'Create a new multiplayer match room via the server matchmaking engine with optional custom 6-character code and time control. Returns gameId, gameCode, status, FEN, PGN.',
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    inputSchema: z.object({
      timeControl: z.any().optional(),
      side: z.enum(['w', 'b', 'random']).default('random'),
      playerInfo: z.object({
        uid: z.string().optional(),
        displayName: z.string().optional(),
        name: z.string().optional(),
        elo: z.number().optional(),
        rating: z.number().optional(),
      }).optional(),
      customCode: z.string().min(1).optional(),
    }),
  },
  async (args: Record<string, unknown>) => {
    const body = {
      timeControl: args.timeControl,
      side: args.side,
      playerInfo: args.playerInfo as object | undefined,
      customCode: args.customCode != null ? args.customCode : undefined,
    };
    const { json } = await backendFetch('/api/games', { method: 'POST', body });
    return {
      content: [{ type: 'text', text: `Created match:\n${JSON.stringify(json, null, 2)}` }],
      structuredContent: json as Record<string, unknown>,
    };
  },
);

server.registerTool(
  'chesskys_join_game',
  {
    description: 'Join a waiting match room by game id or 6-character code as a guest, with optional player info. Returns success, playerColor, gameId, gameCode, and full game state.',
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    inputSchema: z.object({
      id: z.string().min(1),
      playerInfo: z.object({
        uid: z.string().optional(),
        displayName: z.string().optional(),
        name: z.string().optional(),
        elo: z.number().optional(),
        rating: z.number().optional(),
      }).optional(),
    }),
  },
  async (args: Record<string, unknown>) => {
    const body = { playerInfo: args.playerInfo as object | undefined };
    const { json } = await backendFetch(`/api/games/${encodeURIComponent(args.id as string)}/join`, { method: 'POST', body });
    return {
      content: [{ type: 'text', text: `Joined match ${args.id}:\n${JSON.stringify(json, null, 2)}` }],
      structuredContent: json as Record<string, unknown>,
    };
  },
);

server.registerTool(
  'chesskys_cancel_game',
  {
    description: 'Cancel a waiting match room by game id or 6-character code. Only the host can cancel a room that is still waiting.',
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    inputSchema: z.object({ id: z.string().min(1) }),
  },
  async (args: Record<string, unknown>) => {
    const { json } = await backendFetch(`/api/games/${encodeURIComponent(args.id as string)}/cancel`, { method: 'POST' });
    return {
      content: [{ type: 'text', text: `Cancelled match ${args.id}:\n${JSON.stringify(json, null, 2)}` }],
      structuredContent: json as Record<string, unknown>,
    };
  },
);

server.registerTool(
  'chesskys_session_verify',
  {
    description: 'Check whether there is a valid signed session cookie for the backend and return the session payload if authenticated.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: z.object({}),
  },
  async () => {
    const { json } = await backendFetch('/api/auth/session-verify');
    return {
      content: [{ type: 'text', text: `Session verify:\n${JSON.stringify(json, null, 2)}` }],
      structuredContent: json as Record<string, unknown>,
    };
  },
);

server.registerTool(
  'chesskys_sanitize_text',
  {
    description: 'Run a string through the backend XSS sanitizer and return the safe text, sender name, and whether sanitization changed the text.',
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: z.object({
      text: z.string().min(1),
      senderName: z.string().optional(),
    }),
  },
  async (args: Record<string, unknown>) => {
    const { json } = await backendFetch('/api/chat/sanitize', {
      method: 'POST',
      body: { text: args.text, senderName: args.senderName },
    });
    return {
      content: [{ type: 'text', text: `Sanitized text:\n${JSON.stringify(json, null, 2)}` }],
      structuredContent: json as Record<string, unknown>,
    };
  },
);

server.registerTool(
  'chesskys_create_and_join_room',
  {
    description: 'Create a multiplayer match room with an optional custom code, then immediately try to join it as a guest using a different player. Returns the created game and the join result.',
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
    inputSchema: z.object({
      customCode: z.string().min(1).optional(),
      side: z.enum(['w', 'b', 'random']).default('random'),
      hostName: z.string().optional(),
      hostUid: z.string().optional(),
      hostElo: z.number().optional(),
    }),
  },
  async (args) => {
    const hostUid = (args.hostUid as string | undefined) || 'mcp-host-' + Date.now();
    const hostName = args.hostName as string | undefined || 'MCP Host';
    const hostElo = args.hostElo != null ? args.hostElo : 1200;
    const createBody = {
      timeControl: { name: 'Rapid 10 min', initialSeconds: 600, incrementSeconds: 0 },
      side: args.side,
      playerInfo: { uid: hostUid, displayName: hostName, elo: hostElo },
      customCode: args.customCode != null ? args.customCode : undefined,
    };

    let createResult: Record<string, unknown>;
    try {
      const c = await backendFetch('/api/games', { method: 'POST', body: createBody });
      createResult = c.json as Record<string, unknown>;
    } catch (err) {
      return { content: [{ type: 'text', text: `Failed to create room: ${err instanceof Error ? err.message : String(err)}` }], isError: true };
    }

    const codeOrId = (createResult.gameCode ?? createResult.gameId) as string | undefined;
    if (!codeOrId) {
      return {
        content: [{ type: 'text', text: `Created room but no gameCode/gameId returned: ${JSON.stringify(createResult)}` }],
        isError: true,
      };
    }

    let joinResult: Record<string, unknown>;
    try {
      const j = await backendFetch(`/api/games/${encodeURIComponent(codeOrId)}/join`, {
        method: 'POST',
        body: { playerInfo: { uid: 'mcp-guest-' + Date.now(), displayName: 'MCP Guest', elo: hostElo + 20 } },
      });
      joinResult = j.json as Record<string, unknown>;
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Created room ${codeOrId} but join failed: ${err instanceof Error ? err.message : String(err)}` }],
        isError: true,
      };
    }

    return {
      content: [{ type: 'text', text: `Room created and joined:\nCreate: ${JSON.stringify(createResult)}\nJoin: ${JSON.stringify(joinResult)}` }],
      structuredContent: { create: createResult, join: joinResult },
    };
  },
);

server.registerTool(
  'chesskys_resign_match',
  {
    description: 'Inspect a live match by id/code and explain how to resign. Resign is handled via the Socket.IO "resign" event in the matchmaking engine; there is no dedicated REST endpoint yet. This tool returns the current match state and the next step.',
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    inputSchema: z.object({
      id: z.string().min(1),
      resigningColor: z.enum(['w', 'b']),
      resigningPlayerName: z.string().optional(),
    }),
  },
  async (_args: Record<string, unknown>) => {
    const id = (_args.id as string) || 'unknown';
    let state: Record<string, unknown> | null = null;
    try {
      const s = await backendFetch(`/api/games/${encodeURIComponent(id)}/state`);
      state = s.json as Record<string, unknown> | null;
    } catch (err) {
      return { content: [{ type: 'text', text: `Cannot read match ${id}: ${err instanceof Error ? err.message : String(err)}` }], isError: true };
    }
    if (!state) {
      return {
        content: [{
          type: 'text',
          text: `Match ${id} not found. Resign is handled via the Socket.IO 'resign' event in the matchmaking engine; there is no REST endpoint for it yet.`,
        }],
        isError: true,
      };
    }
    return {
      content: [{
        type: 'text',
        text: `Match ${id} current state:\n${JSON.stringify(state, null, 2)}\n\nTo resign, emit the Socket.IO 'resign' event with { gameId, matchId, uid } from a connected socket. There is no dedicated REST endpoint for resign at this time.`,
      }],
      structuredContent: { id, resigningColor: (_args.resigningColor as string) || 'unknown', currentState: state },
    };
  },
);

// ---------------------------------------------------------------------------
// Mount helper for Express
// ---------------------------------------------------------------------------

export function mountMcp(app: Application, options: { pathPrefix?: string; allowedOrigins?: string[]; sessionIdGenerator?: () => string } = {}) {
  const pathPrefix = options.pathPrefix || '/mcp';
  const allowedOrigins = options.allowedOrigins || ['http://localhost:3001', 'http://127.0.0.1:3001'];

  app.use(pathPrefix, (req, res, next) => {
    const origin = req.headers.origin || req.headers.referer || '';
    const originAllowed = allowedOrigins.some(o => origin.startsWith(o.split('/').slice(0, 3).join('/')));
    if (process.env.NODE_ENV !== 'production' || originAllowed) {
      next();
      return;
    }
    res.set('Access-Control-Allow-Origin', allowedOrigins[0]);
    res.set('Access-Control-Allow-Credentials', 'true');
    res.status(403).json({ error: 'Origin not allowed for MCP endpoint' });
  });

  let transport: NodeStreamableHTTPServerTransport | null = null;
  let started = false;

  app.use(pathPrefix, (req, res) => {
    if (!started) {
      transport = new NodeStreamableHTTPServerTransport({
        sessionIdGenerator: options.sessionIdGenerator || (() => require('crypto').randomUUID()),
      });
      server.connect(transport).then(() => { started = true; }).catch((err) => {
        console.error('[MCP] Failed to start Chesskys MCP server:', err);
        if (!res.headersSent) res.status(500).json({ error: 'MCP server failed to start' });
      });
    }
    if (!transport) {
      if (!res.headersSent) res.status(503).json({ error: 'MCP server still starting' });
      return;
    }
    transport.handleRequest(req, res as any);
  });

  app.get(`${pathPrefix}/health`, (_req, res) => {
    res.json({
      name: 'chesskys-pro',
      version: process.env.npm_package_version || '0.0.0',
      backend: BACKEND_URL,
      mountsAt: pathPrefix,
      status: started ? 'ok' : 'starting',
    });
  });

  return { transport, server };
}

// Note: mountMcp is also exported via server object
// (the named export below was duplicated — cleaned up)
export { server, backendFetch, BACKEND_URL, TENANT };
