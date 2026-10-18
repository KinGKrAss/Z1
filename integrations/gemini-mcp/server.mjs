import { timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { McpServer } from "@modelcontextprotocol/server";
import { NodeStreamableHTTPServerTransport } from "@modelcontextprotocol/node";
import { z } from "zod";

const NAME = "z1_readonly";
const VERSION = "0.1.0";
const MAX_BODY_BYTES = 64 * 1024;
const REQUEST_TIMEOUT_MS = 5_000;

function constantTimeTokenMatch(actualHeader, expected) {
  if (!expected || !actualHeader?.startsWith("Bearer ")) return false;
  const actual = Buffer.from(actualHeader.slice(7), "utf8");
  const wanted = Buffer.from(expected, "utf8");
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}

function checkedBaseUrl(raw) {
  const base = new URL(raw);
  const local = ["localhost", "127.0.0.1", "::1", "[::1]"].includes(base.hostname);
  if (base.protocol !== "https:" && !local) {
    throw new Error("Z1_API_BASE_URL must use HTTPS unless it points to loopback.");
  }
  if (base.username || base.password || base.search || base.hash) {
    throw new Error("Z1_API_BASE_URL must not contain credentials, query, or fragment.");
  }
  return base;
}

async function fetchZ1Json(pathname) {
  const base = checkedBaseUrl(process.env.Z1_API_BASE_URL || "");
  const url = new URL(pathname, base);
  const response = await fetch(url, {
    method: "GET",
    headers: { accept: "application/json" },
    redirect: "error",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  });
  if (!response.ok) throw new Error("upstream_error");
  const type = response.headers.get("content-type") || "";
  if (!type.includes("application/json")) throw new Error("upstream_error");
  return response.json();
}

function createMcpServer() {
  const server = new McpServer({ name: NAME, version: VERSION });
  const emptyInput = z.object({}).strict();

  for (const [name, description, route] of [
    ["z1_status", "Check whether the Z1 API is online. This is a passive health check.", "/health"],
    ["z1_modules", "List the modules exposed by the Z1 runtime.", "/api/z1/modules"],
    ["z1_policy", "Read the public Z1 peace and humanitarian policy.", "/api/z1/peace-policy"]
  ]) {
    server.registerTool(name, { description, inputSchema: emptyInput }, async () => {
      try {
        const data = await fetchZ1Json(route);
        return { content: [{ type: "text", text: JSON.stringify(data) }] };
      } catch {
        return {
          isError: true,
          content: [{ type: "text", text: "Z1 read failed. Check the private server logs." }]
        };
      }
    });
  }
  return server;
}

async function readJsonBody(req) {
  const chunks = [];
  let bytes = 0;
  for await (const chunk of req) {
    bytes += chunk.length;
    if (bytes > MAX_BODY_BYTES) throw new Error("request_too_large");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function createHttpHandler({ token = process.env.Z1_MCP_ACCESS_TOKEN } = {}) {
  return async (req, res) => {
    if (req.url !== "/mcp") {
      res.writeHead(404).end();
      return;
    }
    if (!constantTimeTokenMatch(req.headers.authorization, token)) {
      res.writeHead(401, { "www-authenticate": "Bearer", "cache-control": "no-store" }).end();
      return;
    }
    if (req.method !== "POST") {
      res.writeHead(405, { allow: "POST", "cache-control": "no-store" }).end();
      return;
    }
    const contentType = req.headers["content-type"] || "";
    if (!contentType.toLowerCase().startsWith("application/json")) {
      res.writeHead(415, { "cache-control": "no-store" }).end();
      return;
    }

    try {
      const body = await readJsonBody(req);
      const mcp = createMcpServer();
      const transport = new NodeStreamableHTTPServerTransport({ sessionIdGenerator: undefined });
      await mcp.connect(transport);
      await transport.handleRequest(req, res, body);
    } catch (error) {
      if (!res.headersSent) {
        res.writeHead(error.message === "request_too_large" ? 413 : 400, {
          "content-type": "application/json; charset=utf-8",
          "cache-control": "no-store"
        });
        res.end(JSON.stringify({ error: "invalid_mcp_request" }));
      }
    }
  };
}

if (process.argv[1] && new URL(import.meta.url).pathname === new URL(`file://${process.argv[1]}`).pathname) {
  const token = process.env.Z1_MCP_ACCESS_TOKEN;
  if (!token || token.length < 32) {
    throw new Error("Set Z1_MCP_ACCESS_TOKEN to a random secret of at least 32 characters.");
  }
  checkedBaseUrl(process.env.Z1_API_BASE_URL || "");
  const host = process.env.HOST || "127.0.0.1";
  const port = Number(process.env.PORT || 8787);
  createServer(createHttpHandler({ token })).listen(port, host, () => {
    console.log(`[Z1 MCP] listening on http://${host}:${port}/mcp`);
  });
}
