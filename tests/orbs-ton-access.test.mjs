import test from "node:test";
import assert from "node:assert/strict";
import { discoverOrbsTonNodes, readTonBalance } from "../runtime/orbs-ton-access.mjs";

const address = "EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N";
const now = 1_800_000_000_000;
const response = (data) => ({ ok: true, status: 200, json: async () => data });

test("filters Orbs nodes by health, protocol, weight and freshness", async () => {
  const nodes = [
    { NodeId: "healthy", Weight: 3, Healthy: "1", Mngr: { successTS: now - 1000, health: { "v2-mainnet": true } } },
    { NodeId: "unhealthy", Weight: 3, Healthy: "0", Mngr: { successTS: now - 1000, health: { "v2-mainnet": true } } },
    { NodeId: "stale", Weight: 3, Healthy: "1", Mngr: { successTS: now - 700_000, health: { "v2-mainnet": true } } },
  ];
  const result = await discoverOrbsTonNodes({ fetchImpl: async () => response(nodes), now });
  assert.deepEqual(result.map((node) => node.NodeId), ["healthy"]);
});

test("reads TON balance through a healthy Orbs endpoint and preserves nano precision", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (url.includes("/mngr/nodes")) {
      return response([{ NodeId: "node-1", Weight: 1, Healthy: "1", Mngr: { successTS: now, health: { "v2-mainnet": true } } }]);
    }
    return response({ ok: true, result: "1234567890" });
  };
  const balance = await readTonBalance(address, { fetchImpl, now, random: () => 0 });
  assert.equal(balance.balanceNanoTon, "1234567890");
  assert.equal(balance.balanceTon, "1.23456789");
  assert.match(calls[1], /getAddressBalance\?address=/);
});

test("rejects malformed addresses before making provider requests", async () => {
  let requests = 0;
  await assert.rejects(readTonBalance("https://attacker.invalid/", {
    fetchImpl: async () => { requests += 1; return response([]); },
  }), /valid raw or user-friendly TON address/);
  assert.equal(requests, 0);
});
