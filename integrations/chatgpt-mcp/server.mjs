import { timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { McpServer } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { z } from "zod";

const NAME = "z1_zoe_bridge";
const VERSION = "0.1.0";
const MAX_BODY_BYTES = 64 * 1024;
const TIMEOUT_MS = 10_000;

function tokenMatches(header, expected) {
  if (!expected || !header?.startsWith("Bearer ")) return false;
  const actual = Buffer.from(header.slice(7), "utf8");
  const wanted = Buffer.from(expected, "utf8");
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}
function checkedBaseUrl(raw) {
  const base = new URL(raw);
  const loopback = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(base.hostname);
  if (base.protocol !== "https:" && !loopback) throw new Error("Z1_API_BASE_URL must use HTTPS.");
  if (base.username || base.password || base.search || base.hash) throw new Error("Invalid Z1 API URL.");
  return base;
}
async function z1Request(path, method = "GET", body) {
  const base = checkedBaseUrl(process.env.Z1_API_BASE_URL || "");
  const token = process.env.Z1_MODEL_GATEWAY_TOKEN;
  if (!token || token.length < 32) throw new Error("Z1 backend credentials are not configured.");
  const response = await fetch(new URL(path, base), {
    method,
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/json",
      ...(body === undefined ? {} : { "content-type": "application/json" })
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json")) throw new Error("Unexpected Z1 response.");
  const data = await response.json();
  if (!response.ok) throw new Error(`Z1 request failed with status ${response.status}.`);
  return data;
}
function result(data) {
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
}
function failure() {
  return { isError: true, content: [{ type: "text", text: "Z1 request failed. Check the private server logs; credentials and upstream details are not exposed." }] };
}
function createMcpServer() {
  const mcp = new McpServer({ name: NAME, version: VERSION });
  const empty = z.object({}).strict();

  for (const [name, description, path] of [
    ["z1_status", "Read the Z1 API health status.", "/health"],
    ["z1_modules", "List modules exposed by the Z1 runtime.", "/api/z1/modules"],
    ["z1_policy", "Read the public Z1 humanitarian policy.", "/api/z1/peace-policy"],
    ["zoe_agent_status", "Read the autonomous Council worker status and queue counts.", "/api/z1/agents/status"],
    ["zoe_list_tasks", "Read tasks belonging to the configured Z1 owner.", "/api/z1/agents/tasks"],
    ["zoe_list_memories", "Read stored provisional Council role memories.", "/api/z1/agents/memories"]
  ]) {
    mcp.registerTool(name, {
      description,
      inputSchema: empty,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
    }, async () => {
      try { return result(await z1Request(path)); } catch { return failure(); }
    });
  }

  mcp.registerTool("zoe_queue_task", {
    description: "Queue a bounded task for the configured Z1 Council worker. A 202 response means queued, not completed. The worker must be enabled and configured by the server operator.",
    inputSchema: z.object({
      roleId: z.string().trim().min(1).max(80),
      taskType: z.enum(["analysis", "summary", "planning", "quality_review", "knowledge_organization", "draft"]),
      instructions: z.string().trim().min(1).max(8000),
      context: z.record(z.string(), z.unknown()).optional(),
      runAt: z.string().datetime().optional(),
      repeatEveryMinutes: z.number().int().min(60).max(525600).optional()
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false }
  }, async (args) => {
    try { return result(await z1Request("/api/z1/agents/tasks", "POST", args)); } catch { return failure(); }
  });

  mcp.registerTool("zoe_feedback_memory", {
    description: "Mark a Council memory as helpful or reject it. This changes Z1 memory feedback and is recorded by the Z1 service.",
    inputSchema: z.object({
      memory_id: z.string().trim().min(1).max(200),
      feedback: z.enum(["helpful", "reject"])
    }),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }, async ({ memory_id, feedback }) => {
    try {
      return result(await z1Request(`/api/z1/agents/memories/${encodeURIComponent(memory_id)}/feedback`, "POST", { feedback }));
    } catch { return failure(); }
  });

  return mcp;
}
async function readBody(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new Error("too_large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
export function createHttpHandler({ token = process.env.Z1_CHATGPT_MCP_ACCESS_TOKEN } = {}) {
  return async (req, res) => {
    if (req.url !== "/mcp") { res.writeHead(404).end(); return; }
    if (!tokenMatches(req.headers.authorization, token)) {
      res.writeHead(401, { "www-authenticate": "Bearer", "cache-control": "no-store" }).end(); return;
    }
    if (req.method !== "POST") { res.writeHead(405, { allow: "POST", "cache-control": "no-store" }).end(); return; }
    if (!(req.headers["content-type"] || "").toLowerCase().startsWith("application/json")) {
      res.writeHead(415, { "cache-control": "no-store" }).end(); return;
    }
    try {
      const body = await readBody(req);
      const mcp = createMcpServer();
      const transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await mcp.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (error) {
      if (!res.headersSent) {
        res.writeHead(error.message === "too_large" ? 413 : 400, {
          "content-type": "application/json; charset=utf-8", "cache-control": "no-store"
        });
        res.end(JSON.stringify({ error: "invalid_mcp_request" }));
      }
    }
  };
}
if (process.argv[1] && new URL(import.meta.url).pathname === new URL(`file://${process.argv[1]}`).pathname) {
  const access = process.env.Z1_CHATGPT_MCP_ACCESS_TOKEN;
  if (!access || access.length < 32) throw new Error("Set Z1_CHATGPT_MCP_ACCESS_TOKEN to a random secret of at least 32 characters.");
  if (!process.env.Z1_MODEL_GATEWAY_TOKEN || process.env.Z1_MODEL_GATEWAY_TOKEN.length < 32) throw new Error("Set Z1_MODEL_GATEWAY_TOKEN in the private backend secret manager.");
  checkedBaseUrl(process.env.Z1_API_BASE_URL || "");
  const host = process.env.HOST || "127.0.0.1";
  const port = Number(process.env.PORT || 8788);
  createServer(createHttpHandler({ token: access })).listen(port, host, () => {
    console.log(`[Z1 ChatGPT MCP] listening on http://${host}:${port}/mcp`);
  });
}
