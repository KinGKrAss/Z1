import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { createHttpHandler } from "./server.mjs";

async function start(token) {
  const server = createServer(createHttpHandler({ token }));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  return { server, url: `http://127.0.0.1:${server.address().port}/mcp` };
}

function parseMcpResponse(text) {
  const line = text.split("\n").find(item => item.startsWith("data: "));
  return JSON.parse(line ? line.slice(6) : text);
}

test("rejects missing or incorrect bearer tokens before MCP processing", async () => {
  const token = "a".repeat(40);
  const { server, url } = await start(token);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    });
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("cache-control"), "no-store");
  } finally {
    server.close();
  }
});

test("allows only authenticated POST requests at the MCP route", async () => {
  const token = "b".repeat(40);
  const { server, url } = await start(token);
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { authorization: `Bearer ${token}` }
    });
    assert.equal(response.status, 405);
    assert.equal(response.headers.get("allow"), "POST");
  } finally {
    server.close();
  }
});

test("serves an authenticated MCP initialize request", async () => {
  const token = "c".repeat(40);
  const { server, url } = await start(token);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        accept: "application/json, text/event-stream"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "test-client", version: "1.0.0" }
        }
      })
    });
    assert.equal(response.status, 200);
    const payload = parseMcpResponse(await response.text());
    assert.equal(payload.jsonrpc, "2.0");
    assert.equal(payload.id, 1);
    assert.equal(payload.result.serverInfo.name, "z1_readonly");
  } finally {
    server.close();
  }
});

test("does not return sensitive text from a malformed upstream JSON response", async () => {
  const token = "d".repeat(40);
  const previousFetch = globalThis.fetch;
  const previousBaseUrl = process.env.Z1_API_BASE_URL;
  globalThis.fetch = async (input, init) => {
    const target = new URL(input);
    if (target.hostname === "localhost") {
      return new Response("SECRET-UPSTREAM-BODY", {
        status: 200,
        headers: { "content-type": "application/json" }
      });
    }
    return previousFetch(input, init);
  };
  process.env.Z1_API_BASE_URL = "http://localhost:3001";
  const { server, url } = await start(token);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        accept: "application/json, text/event-stream"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "z1_status", arguments: {} }
      })
    });
    const text = await response.text();
    assert.equal(response.status, 200);
    assert.equal(text.includes("SECRET-UPSTREAM-BODY"), false);
    assert.equal(text.includes("Z1 read failed."), true);
  } finally {
    server.close();
    globalThis.fetch = previousFetch;
    if (previousBaseUrl === undefined) delete process.env.Z1_API_BASE_URL;
    else process.env.Z1_API_BASE_URL = previousBaseUrl;
  }
});
