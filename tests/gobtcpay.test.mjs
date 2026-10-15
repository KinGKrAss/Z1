import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { GoBtcPayClient, handleGoBtcPayApi, signGoBtcPayParams, verifyGoBtcPayWebhook } from "../runtime/gobtcpay.mjs";

test("signs parameters using key-sorted canonical JSON", () => {
  const params = { z: 2, a: "one", ts: 123 };
  const expected = createHmac("sha256", "secret").update('{"a":"one","ts":123,"z":2}').digest("hex");
  assert.equal(signGoBtcPayParams(params, "secret"), expected);
});

test("createPayment sends signed request with stable external reference", async () => {
  let request;
  const client = new GoBtcPayClient({
    apiKey: "secret",
    terminalId: "terminal-1",
    baseUrl: "https://example.test/v1",
    clock: () => 1718012345000,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return { ok: true, json: async () => ({ paymentId: "pay-1", status: "initiated" }) };
    },
  });
  const result = await client.createPayment({ amount: 12.5, currency: "EUR", externalId: "invoice-7", description: "Invoice 7" });
  const params = JSON.parse(request.options.body);
  const { signature, ...unsigned } = params;
  assert.equal(request.url, "https://example.test/v1/pos/transaction/create-payment");
  assert.equal(signature, signGoBtcPayParams(unsigned, "secret"));
  assert.equal(params.posTerminalId, "terminal-1");
  assert.equal(params.externalId, "invoice-7");
  assert.deepEqual(result, { paymentId: "pay-1", status: "initiated" });
});

test("rejects duplicate-prone create requests without externalId", async () => {
  const client = new GoBtcPayClient({ apiKey: "secret", terminalId: "terminal-1" });
  await assert.rejects(client.createPayment({ amount: 5, currency: "EUR" }), /externalId is required/);
});

test("verifies webhook signature and rejects stale timestamp", () => {
  const body = '{"eventId":"event-1"}';
  const timestamp = 1718012345;
  const signature = createHmac("sha256", "webhook-secret").update(`${timestamp}.${body}`).digest("hex");
  assert.equal(verifyGoBtcPayWebhook(body, `t=${timestamp},v1=${signature}`, "webhook-secret", timestamp), true);
  assert.equal(verifyGoBtcPayWebhook(body, `t=${timestamp},v1=${signature}`, "webhook-secret", timestamp + 301), false);
});

test("GoBTC routes require the Z1 gateway bearer token", async () => {
  let result;
  const handled = await handleGoBtcPayApi(
    { method: "GET", headers: {} },
    {},
    new URL("http://localhost/api/z1/gobtcpay/status"),
    { json: (_res, status, body) => { result = { status, body }; }, env: { Z1_GOBTCPAY_GATEWAY_TOKEN: "a".repeat(32) } },
  );
  assert.equal(handled, true);
  assert.equal(result.status, 401);
});

test("status endpoint reports configuration without exposing credentials", async () => {
  let result;
  await handleGoBtcPayApi(
    { method: "GET", headers: { authorization: `Bearer ${"a".repeat(32)}` } },
    {},
    new URL("http://localhost/api/z1/gobtcpay/status"),
    { json: (_res, status, body) => { result = { status, body }; }, env: { Z1_GOBTCPAY_GATEWAY_TOKEN: "a".repeat(32), GOBTCPAY_API_KEY: "must-not-leak" } },
  );
  assert.equal(result.status, 200);
  assert.equal(result.body.configured, false);
  assert.equal(JSON.stringify(result.body).includes("must-not-leak"), false);
});
