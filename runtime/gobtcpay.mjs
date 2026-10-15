import { createHmac, timingSafeEqual } from "node:crypto";

const API_BASE = "https://api.gobtcpay.com/public/api/v1.2";
const ALLOWED_STATUSES = new Set(["initiated", "paid", "failed", "expired", "canceled", "cleared"]);

function sortedObject(value) {
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, value[key]]));
}

export function signGoBtcPayParams(params, apiKey) {
  if (!apiKey) throw new Error("GoBTC Pay API key is not configured");
  const canonical = JSON.stringify(sortedObject(params));
  return createHmac("sha256", apiKey).update(canonical).digest("hex");
}

export function verifyGoBtcPayWebhook(rawBody, header, signingSecret, nowSeconds = Math.floor(Date.now() / 1000)) {
  if (!signingSecret || typeof header !== "string") return false;
  const match = /^t=(\d+),v1=([a-f0-9]{64})$/.exec(header.trim());
  if (!match) return false;
  const timestamp = Number(match[1]);
  if (!Number.isSafeInteger(timestamp) || Math.abs(nowSeconds - timestamp) > 300) return false;
  const expected = createHmac("sha256", signingSecret).update(`${timestamp}.${rawBody}`).digest();
  const supplied = Buffer.from(match[2], "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export class GoBtcPayClient {
  constructor({ apiKey, terminalId, fetchImpl = globalThis.fetch, baseUrl = API_BASE, clock = Date.now }) {
    this.apiKey = apiKey;
    this.terminalId = terminalId;
    this.fetchImpl = fetchImpl;
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.clock = clock;
  }

  get configured() {
    return Boolean(this.apiKey && this.terminalId && typeof this.fetchImpl === "function");
  }

  async createPayment({ amount, currency, description, ttlSeconds, externalId }) {
    if (!Number.isFinite(amount) || amount <= 0) throw new TypeError("amount must be a positive number");
    if (typeof currency !== "string" || !/^[A-Z]{3}$/.test(currency)) throw new TypeError("currency must be a three-letter uppercase code");
    if (typeof externalId !== "string" || !externalId.trim() || externalId.length > 128) throw new TypeError("externalId is required and must be at most 128 characters");
    if (description !== undefined && (typeof description !== "string" || description.length > 500)) throw new TypeError("description must be a string of at most 500 characters");
    if (ttlSeconds !== undefined && (!Number.isInteger(ttlSeconds) || ttlSeconds <= 0)) throw new TypeError("ttlSeconds must be a positive integer");

    const params = {
      posTerminalId: this.terminalId,
      amount,
      currency,
      externalId: externalId.trim(),
      ts: this.clock(),
    };
    if (description !== undefined) params.description = description;
    if (ttlSeconds !== undefined) params.ttlSeconds = ttlSeconds;
    return this.#post("/pos/transaction/create-payment", params);
  }

  async getPayment(paymentId) {
    if (typeof paymentId !== "string" || !paymentId.trim()) throw new TypeError("paymentId is required");
    return this.#post("/pos/transaction/get-payment", { paymentId: paymentId.trim(), ts: this.clock() });
  }

  async listPayments({ limit = 20, skip = 0, start, end, status } = {}) {
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new TypeError("limit must be an integer from 1 to 100");
    if (!Number.isInteger(skip) || skip < 0) throw new TypeError("skip must be a non-negative integer");
    const params = { posTerminalId: this.terminalId, pagination: { limit, skip }, ts: this.clock() };
    if (start !== undefined || end !== undefined) {
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start) throw new TypeError("start and end must be valid Unix timestamps in seconds");
      params.filters = { ...(params.filters ?? {}), dateRange: { start, end } };
    }
    if (status !== undefined) {
      const statuses = Array.isArray(status) ? status : [status];
      if (!statuses.length || statuses.some((item) => !ALLOWED_STATUSES.has(item))) throw new TypeError("status contains an unsupported payment status");
      params.filters = { ...(params.filters ?? {}), status: statuses };
    }
    return this.#post("/pos/transaction/list", params);
  }

  async #post(path, unsignedParams) {
    if (!this.configured) throw new Error("GoBTC Pay is not configured");
    const params = { ...unsignedParams };
    params.signature = signGoBtcPayParams(params, this.apiKey);
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) throw new Error(`GoBTC Pay returned HTTP ${response.status}`);
    return response.json();
  }
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

function authorized(req, token) {
  const supplied = req.headers?.authorization;
  return Boolean(token && token.length >= 32 && typeof supplied === "string" && supplied.startsWith("Bearer ") && safeEqual(supplied.slice(7), token));
}

function sendJson(json, res, status, body) {
  json(res, status, body);
}

export async function handleGoBtcPayApi(req, res, url, { json, readJson, env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const prefix = "/api/z1/gobtcpay";
  if (!url.pathname.startsWith(prefix)) return false;
  if (!authorized(req, env.Z1_GOBTCPAY_GATEWAY_TOKEN)) {
    sendJson(json, res, 401, { error: "unauthorized" });
    return true;
  }

  const client = new GoBtcPayClient({
    apiKey: env.GOBTCPAY_API_KEY,
    terminalId: env.GOBTCPAY_TERMINAL_ID,
    fetchImpl,
  });

  if (req.method === "GET" && url.pathname === `${prefix}/status`) {
    sendJson(json, res, 200, { provider: "GoBTC Pay POS", apiVersion: "v1.2", configured: client.configured, capabilities: ["create_payment", "get_payment", "list_payments"] });
    return true;
  }
  if (!client.configured) {
    sendJson(json, res, 503, { error: "gobtcpay_not_configured", message: "GoBTC Pay credentials are not configured in the server secret store." });
    return true;
  }

  try {
    if (req.method === "POST" && url.pathname === `${prefix}/payments`) {
      const body = await readJson(req);
      const result = await client.createPayment(body);
      sendJson(json, res, 201, result);
      return true;
    }
    if (req.method === "GET" && url.pathname === `${prefix}/payments`) {
      const params = url.searchParams;
      const status = params.getAll("status");
      const result = await client.listPayments({
        limit: params.has("limit") ? Number(params.get("limit")) : undefined,
        skip: params.has("skip") ? Number(params.get("skip")) : undefined,
        start: params.has("start") ? Number(params.get("start")) : undefined,
        end: params.has("end") ? Number(params.get("end")) : undefined,
        status: status.length ? status : undefined,
      });
      sendJson(json, res, 200, result);
      return true;
    }
    const paymentMatch = new RegExp(`^${prefix}/payments/([^/]+)$`).exec(url.pathname);
    if (req.method === "GET" && paymentMatch) {
      const result = await client.getPayment(decodeURIComponent(paymentMatch[1]));
      sendJson(json, res, 200, result);
      return true;
    }
    sendJson(json, res, 404, { error: "not_found" });
    return true;
  } catch (error) {
    const message = String(error?.message ?? error);
    const isInputError = error instanceof TypeError;
    sendJson(json, res, isInputError ? 400 : 502, { error: isInputError ? "invalid_request" : "gobtcpay_upstream_error", message: isInputError ? message : "GoBTC Pay request failed." });
    return true;
  }
}
