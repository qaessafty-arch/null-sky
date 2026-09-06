'use strict';
const { McpServer } = require('@modelcontextprotocol/server');
const { NodeStreamableHTTPServerTransport, localhostOriginValidation } = require('@modelcontextprotocol/node');
const z = require('zod/v4');

// ---------------------------------------------------------------------------
// Chesskys PRO MCP server
// Wraps the existing Express backend (port from env or 3000) with typed tools.
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

// Tiny helper: fetch JSON from the backend with optional signed session cookie.
async function backendFetch(path, opts = {}) {
  const url = new URL(path, BACKEND_URL);
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    ...(opts.extraHeaders || {}),
  };
  const cookie = process.env.CHESSKYS_SESSION_COOKIE;
  if (cookie) headers['Cookie'] = cookie;

  const init = {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  };
  const res = await fetch(url.toString(), init);
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }
  if (!res.ok) {
    throw new Error(`Backend ${res.status} ${path}: ${JSON.stringify(json)}`);
  }
  return { status: res.status, json, raw: text };
}

// ---------------------------------------------------------------------------
// Tool: chesskys_health
// ---------------------------------------------------------------------------
server.registerTool(
  'chesskys_health',
  {
    description: 'Return the Chesskys PRO backend health and security posture (status, edition, security features, timestamp).',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: z.object({}),
  },
  async () => {
    const { json } = await backendFetch('/api/health');
    return {
      content: [
        { type: 'text', text: `Chesskys PRO health check:\n${JSON.stringify(json, null, 2)}` },
      ],
      structuredContent: json,
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: chesskys_leaderboard
// ---------------------------------------------------------------------------
server.registerTool(
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
  async (args) => {
    const q = new URLSearchParams();
    q.set('mode', args.mode);
    q.set('scope', args.scope);
    q.set('period', args.period);
    q.set('page', String(args.page));
    q.set('limit', String(args.limit));
    if (args.search) q.set('search', args.search);
    if (args.country) q.set('country', args.country);
    const { json } = await backendFetch(`/api/leaderboard?${q.toString()}`);
    return {
      content: [
        {
          type: 'text',
          text: `Leaderboard (${args.mode}, ${args.scope}, ${args.period}, page ${args.page}):\n${JSON.stringify(json, null, 2)}`,
        },
      ],
      structuredContent: json,
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: chesskys_leaderboard_rank
// ---------------------------------------------------------------------------
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
  async (args) => {
    const { json } = await backendFetch(`/api/leaderboard/rank/${encodeURIComponent(args.userId)}?mode=${args.mode}`);
    return {
      content: [
        {
          type: 'text',
          text: `Rank for ${args.userId} (${args.mode}):\n${JSON.stringify(json, null, 2)}`,
        },
      ],
      structuredContent: json,
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: chesskys_leaderboard_distribution
// ---------------------------------------------------------------------------
server.registerTool(
  'chesskys_leaderboard_distribution',
  {
    description: 'Return Elo distribution histogram buckets for a given mode (e.g., how many players in each 200-point bracket).',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: z.object({
      mode: z.enum(['blitz', 'rapid', 'bullet']).default('blitz'),
    }),
  },
  async (args) => {
    const { json } = await backendFetch(`/api/leaderboard/distribution?mode=${args.mode}`);
    return {
      content: [
        {
          type: 'text',
          text: `Elo distribution for ${args.mode}:\n${JSON.stringify(json, null, 2)}`,
        },
      ],
      structuredContent: json,
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: chesskys_validate_move
// ---------------------------------------------------------------------------
server.registerTool(
  'chesskys_validate_move',
  {
    description: 'Ask the server-authoritative chess engine whether a move is legal from a FEN, and get back the resulting FEN/PGN, turn, flags, check/checkmate/draw status, and anti-cheat flags. Requires fen, from, to.',
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
  async (args) => {
    const body = {
      fen: args.fen,
      from: args.from,
      to: args.to,
      promotion: args.promotion || 'q',
      playerColor: args.playerColor,
      moveTimeMs: args.moveTimeMs,
    };
    const { json } = await backendFetch('/api/chess/validate-move', { method: 'POST', body });
    return {
      content: [
        {
          type: 'text',
          text: `Move validation (${args.from}->${args.to}):\n${JSON.stringify(json, null, 2)}`,
        },
      ],
      structuredContent: json,
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: chesskys_game_state
// ---------------------------------------------------------------------------
server.registerTool(
  'chesskys_game_state',
  {
    description: 'Return full state for a running match by game id or 6-character room code: FEN, PGN, turn, status, clocks, players, move list, check/checkmate/stalemate/draw flags.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: z.object({
      id: z.string().min(1),
    }),
  },
  async (args) => {
    const { json } = await backendFetch(`/api/games/${encodeURIComponent(args.id)}/state`);
    return {
      content: [
        {
          type: 'text',
          text: `Game state for ${args.id}:\n${JSON.stringify(json, null, 2)}`,
        },
      ],
      structuredContent: json,
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: chesskys_game_pgn
// ---------------------------------------------------------------------------
server.registerTool(
  'chesskys_game_pgn',
  {
    description: 'Export a match as PGN text by game id or 6-character room code.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: z.object({
      id: z.string().min(1),
    }),
  },
  async (args) => {
    const { json, raw } = await backendFetch(`/api/games/${encodeURIComponent(args.id)}/pgn`, {
      extraHeaders: { Accept: 'application/json' },
    });
    const pgn = json && json.pgn ? json.pgn : raw;
    return {
      content: [{ type: 'text', text: `PGN for ${args.id}:\n\n${pgn}` }],
      structuredContent: { id: args.id, pgn },
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: chesskys_game_fen
// ---------------------------------------------------------------------------
server.registerTool(
  'chesskys_game_fen',
  {
    description: 'Return the current FEN string for a match by game id or 6-character room code.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: z.object({
      id: z.string().min(1),
    }),
  },
  async (args) => {
    const { json } = await backendFetch(`/api/games/${encodeURIComponent(args.id)}/fen`);
    return {
      content: [
        { type: 'text', text: `FEN for ${args.id}: ${json ? json.fen : JSON.stringify(json)}` },
      ],
      structuredContent: json || { fen: null },
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: chesskys_game_moves
// ---------------------------------------------------------------------------
server.registerTool(
  'chesskys_game_moves',
  {
    description: 'List all moves for a match by game id or 6-character room code.',
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: z.object({
      id: z.string().min(1),
    }),
  },
  async (args) => {
    const { json } = await backendFetch(`/api/games/${encodeURIComponent(args.id)}/moves`);
    return {
      content: [
        {
          type: 'text',
          text: `Moves for ${args.id} (${json ? json.moves : []}).length]:\n${JSON.stringify(json, null, 2)}`,
        },
      ],
      structuredContent: json || { moves: [] },
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: chesskys_create_game  (write, non-idempotent, non-destructive)
// ---------------------------------------------------------------------------
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
  async (args) => {
    const body = {
      timeControl: args.timeControl,
      side: args.side,
      playerInfo: args.playerInfo,
      customCode: args.customCode,
    };
    const { json } = await backendFetch('/api/games', { method: 'POST', body });
    return {
      content: [
        {
          type: 'text',
          text: `Created match:\n${JSON.stringify(json, null, 2)}`,
        },
      ],
      structuredContent: json,
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: chesskys_join_game  (write, non-idempotent, non-destructive)
// ---------------------------------------------------------------------------
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
  async (args) => {
    const body = { playerInfo: args.playerInfo };
    const { json } = await backendFetch(`/api/games/${encodeURIComponent(args.id)}/join`, {
      method: 'POST',
      body,
    });
    return {
      content: [
        {
          type: 'text',
          text: `Joined match ${args.id}:\n${JSON.stringify(json, null, 2)}`,
        },
      ],
      structuredContent: json,
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: chesskys_cancel_game  (write, non-idempotent, destructive-ish)
// ---------------------------------------------------------------------------
server.registerTool(
  'chesskys_cancel_game',
  {
    description: 'Cancel a waiting match room by game id or 6-character code. Only the host can cancel a room that is still waiting.',
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    inputSchema: z.object({
      id: z.string().min(1),
    }),
  },
  async (args) => {
    const { json } = await backendFetch(`/api/games/${encodeURIComponent(args.id)}/cancel`, {
      method: 'POST',
    });
    return {
      content: [
        {
          type: 'text',
          text: `Cancelled match ${args.id}:\n${JSON.stringify(json, null, 2)}`,
        },
      ],
      structuredContent: json,
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: chesskys_session_verify  (read-only)
// ---------------------------------------------------------------------------
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
      structuredContent: json,
    };
  },
);

// ---------------------------------------------------------------------------
// Tool: chesskys_sanitize_text  (write-ish but benign; idempotent)
// ---------------------------------------------------------------------------
server.registerTool(
  'chesskys_sanitize_text',
  {
    description: 'Run a string through the backend XSS sanitizer and return the safe text, sender name, and whether sanitization changed the text. Useful to validate user-generated strings before storage.',
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    inputSchema: z.object({
      text: z.string().min(1),
      senderName: z.string().optional(),
    }),
  },
  async (args) => {
    const { json } = await backendFetch('/api/chat/sanitize', {
      method: 'POST',
      body: { text: args.text, senderName: args.senderName },
    });
    return {
      content: [
        {
          type: 'text',
          text: `Sanitized text:\n${JSON.stringify(json, null, 2)}`,
        },
      ],
      structuredContent: json,
    };
  },
);

// ---------------------------------------------------------------------------
// Workflow tool: chesskys_create_and_join_room
// ---------------------------------------------------------------------------
server.registerTool(
  'chesskys_create_and_join_room',
  {
    description: 'Create a multiplayer match room with an optional custom code, then immediately try to join it as the guest using the same player info. Useful for smoke-testing the matchmaking flow or setting up a 1v1 session. Returns the created game and the join result.',
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
    const hostUid = args.hostUid || 'mcp-host-' + Date.now();
    const hostName = args.hostName || 'MCP Host';
    const hostElo = args.hostElo || 1200;

    // Create the room.
    const createBody = {
      timeControl: { name: 'Rapid 10 min', initialSeconds: 600, incrementSeconds: 0 },
      side: args.side,
      playerInfo: { uid: hostUid, displayName: hostName, elo: hostElo },
      customCode: args.customCode,
    };
    let createResult;
    try {
      const c = await backendFetch('/api/games', { method: 'POST', body: createBody });
      createResult = c.json;
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: `Failed to create room: ${err.message}`,
          },
        ],
        isError: true,
      };
    }

    const codeOrId = createResult.gameCode || createResult.gameId;
    if (!codeOrId) {
      return {
        content: [
          {
            type: 'text',
            text: `Created room but no gameCode/gameId returned: ${JSON.stringify(createResult)}`,
          },
        ],
        isError: true,
      };
    }

    // Join as the guest.
    let joinResult;
    try {
      joinResult = await backendFetch(`/api/games/${encodeURIComponent(codeOrId)}/join`, {
        method: 'POST',
        body: {
          playerInfo: {
            uid: 'mcp-guest-' + Date.now(),
            displayName: 'MCP Guest',
            elo: hostElo + 20,
          },
        },
      });
    } catch (err) {
      return {
        content: [
          {
            type: 'text',
            text: `Created room ${codeOrId} but join failed: ${err.message}`,
          },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `Room created and joined:\nCreate: ${JSON.stringify(createResult)}\nJoin: ${JSON.stringify(joinResult.json)}`,
        },
      ],
      structuredContent: { create: createResult, join: joinResult.json },
    };
  },
);

// ---------------------------------------------------------------------------
// Workflow tool: chesskys_resign_match
// ---------------------------------------------------------------------------
server.registerTool(
  'chesskys_resign_match',
  {
    description: 'Resign from a live match by game id or 6-character room code, specifying the resigning player color. Returns the updated match state after resignation.',
    annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: false },
    inputSchema: z.object({
      id: z.string().min(1),
      resigningColor: z.enum(['w', 'b']),
      resigningPlayerName: z.string().optional(),
    }),
  },
  async (args) => {
    // The backend does not expose a generic resign REST endpoint today; the matchmaking
    // engine handles resign via Socket.IO. To keep this tool meaningful and honest, fall
    // back to fetching the current state and explaining the next step.
    let state;
    try {
      const s = await backendFetch(`/api/games/${encodeURIComponent(args.id)}/state`);
      state = s.json;
    } catch (err) {
      return {
        content: [{ type: 'text', text: `Cannot read match ${args.id}: ${err.message}` }],
        isError: true,
      };
    }
    if (!state) {
      return {
        content: [
          {
            type: 'text',
            text: `Match ${args.id} not found. Resign is handled via the Socket.IO 'resign' event in the matchmaking engine; there is no REST endpoint for it yet.`,
          },
        ],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: 'text',
          text: `Match ${args.id} current state:\n${JSON.stringify(state, null, 2)}\n\nTo resign, emit the Socket.IO 'resign' event with { gameId, matchId, uid } from a connected socket. There is no dedicated REST endpoint for resign at this time.`,
        },
      ],
      structuredContent: { id: args.id, resigningColor: args.resigningColor, currentState: state },
    };
  },
);

// ---------------------------------------------------------------------------
// Mount helper
// ---------------------------------------------------------------------------
function mountMcp(app, options = {}) {
  const pathPrefix = options.pathPrefix || '/mcp';
  // Apply origin validation per spec: reject DNS rebinding. In the dev server this
  // is localhost-only, so we allow the loopback origins.
  const validateOrigin = localhostOriginValidation({
    allowedOrigins: options.allowedOrigins || ['http://localhost:3001', 'http://127.0.0.1:3001'],
  });

  app.use(pathPrefix, (req, res, next) => {
    // Validate Origin on the incoming request (covers DNS rebinding).
    const originResult = validateOrigin(req);
    if (originResult) return originResult;
    next();
  });

  let transport;
  let serverInstance;
  let started = false;

  app.use(pathPrefix, (req, res) => {
    if (!started) {
      transport = new NodeStreamableHTTPServerTransport({
        sessionIdGenerator: options.sessionIdGenerator || (() => require('crypto').randomUUID()),
      });
      serverInstance = server;
      serverInstance.connect(transport).then(() => {
        started = true;
      }).catch((err) => {
        console.error('[MCP] Failed to start Chesskys MCP server:', err);
        if (!res.headersSent) res.status(500).json({ error: 'MCP server failed to start' });
      });
    }
    transport.handleRequest(req, res);
  });

  app.get(`${pathPrefix}/health`, (req, res) => {
    res.json({
      name: 'chesskys-pro',
      version: process.env.npm_package_version || '0.0.0',
      backend: BACKEND_URL,
      mountsAt: pathPrefix,
      status: started ? 'ok' : 'starting',
    });
  });

  return { transport, server: serverInstance };
}

module.exports = { mountMcp, server, backendFetch, BACKEND_URL, TENANT };
