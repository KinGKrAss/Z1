import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { createHttpHandler } from "./server.mjs";

test("rejects missing or incorrect bearer tokens before MCP processing", async () => {
  const server = createServer(createHttpHandler({ token: "a".repeat(40) }));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
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
  const server = createServer(createHttpHandler({ token }));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
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
  const server = createServer(createHttpHandler({ token }));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const { port } = server.address();
  try {
    const response = await fetch(`http://127.0.0.1:${port}/mcp`, {
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
    const payloadText = await response.text();
    const jsonLine = payloadText.split("\n").find(line => line.startsWith("data: "));
    const payload = jsonLine ? JSON.parse(jsonLine.slice(6)) : JSON.parse(payloadText);
    assert.equal(payload.jsonrpc, "2.0");
    assert.equal(payload.id, 1);
    assert.equal(payload.result.serverInfo.name, "z1_readonly");
  } finally {
    server.close();
  }
});
