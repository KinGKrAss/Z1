const DEFAULT_ENDPOINT = "https://arztbrief-api-vo2wjqr63a-ey.a.run.app/v1/mcp/";
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_DOCUMENT_ID_LENGTH = 200;

function endpointFrom(raw) {
  const endpoint = new URL(raw || DEFAULT_ENDPOINT);
  if (
    endpoint.protocol !== "https:" ||
    endpoint.hostname !== "arztbrief-api-vo2wjqr63a-ey.a.run.app" ||
    endpoint.pathname !== "/v1/mcp/" ||
    endpoint.username ||
    endpoint.password ||
    endpoint.search ||
    endpoint.hash
  ) {
    throw new Error("ARZTBRIEF_MCP_URL must be the approved HTTPS Arztbrief MCP endpoint.");
  }
  return endpoint;
}

function parseMcpBody(text) {
  const candidates = [];
  for (const block of text.split(/\r?\n\r?\n/)) {
    const data = block.split(/\r?\n/).filter(line => line.startsWith("data:"))
      .map(line => line.slice(5).trimStart()).join("\n");
    if (data) candidates.push(data);
  }
  if (!candidates.length && text.trim()) candidates.push(text.trim());
  for (const candidate of candidates) {
    try {
      const payload = JSON.parse(candidate);
      if (payload && typeof payload === "object") return payload;
    } catch {}
  }
  throw new Error("arztbrief_invalid_response");
}

export function createArztbriefClient({
  endpoint = process.env.ARZTBRIEF_MCP_URL || DEFAULT_ENDPOINT,
  token = process.env.ARZTBRIEF_MCP_TOKEN,
  fetchImpl = globalThis.fetch
} = {}) {
  const url = endpointFrom(endpoint);
  if (typeof token !== "string" || token.length < 32) {
    throw new Error("ARZTBRIEF_MCP_TOKEN must be configured in the server secret manager.");
  }
  if (typeof fetchImpl !== "function") throw new Error("fetch is unavailable.");

  let requestId = 0;
  let sessionId = null;

  async function send(method, params = {}, { expectsResult = true } = {}) {
    const id = expectsResult ? ++requestId : undefined;
    const payload = { jsonrpc: "2.0", ...(id === undefined ? {} : { id }), method, params };
    const headers = {
      authorization: `Bearer ${token}`,
      accept: "application/json, text/event-stream",
      "content-type": "application/json"
    };
    if (sessionId) headers["mcp-session-id"] = sessionId;
    const response = await fetchImpl(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      redirect: "error",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)
    });
    if (!response.ok) throw new Error("arztbrief_upstream_unavailable");
    const returnedSessionId = response.headers?.get?.("mcp-session-id");
    if (returnedSessionId) sessionId = returnedSessionId;
    if (!expectsResult || response.status === 202) return null;
    const message = parseMcpBody(await response.text());
    if (message.error) throw new Error("arztbrief_tool_failed");
    if (message.id !== id) throw new Error("arztbrief_invalid_response");
    return message.result;
  }

  async function callTool(name, args) {
    await send("initialize", {
      protocolVersion: "2025-03-26",
      capabilities: {},
      clientInfo: { name: "z1-arztbrief-connector", version: "0.1.0" }
    });
    await send("notifications/initialized", {}, { expectsResult: false });
    const result = await send("tools/call", { name, arguments: args });
    if (result?.isError) throw new Error("arztbrief_tool_failed");
    return result;
  }

  return Object.freeze({
    async listDocuments({ limit = 20, offset = 0 } = {}) {
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        throw new TypeError("limit must be an integer from 1 to 100.");
      }
      if (!Number.isInteger(offset) || offset < 0) {
        throw new TypeError("offset must be a non-negative integer.");
      }
      return callTool("list_documents", { limit, offset });
    },
    async getDocument(documentId) {
      if (typeof documentId !== "string" || !documentId.trim() || documentId.length > MAX_DOCUMENT_ID_LENGTH) {
        throw new TypeError("documentId must be a non-empty document identifier.");
      }
      return callTool("get_document", { document_id: documentId.trim() });
    }
  });
}
