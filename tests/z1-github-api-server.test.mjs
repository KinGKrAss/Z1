import test from "node:test";
import assert from "node:assert/strict";
import { createZ1GitHubApiServer } from "../runtime/z1-github-api-server.mjs";

async function withServer(t, options = {}) {
  const server = createZ1GitHubApiServer(options);
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  t.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  return `http://127.0.0.1:${address.port}`;
}

test("isolated service exposes health and returns 404 for other paths", async t => {
  const base = await withServer(t);
  const health = await fetch(`${base}/health`);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), {status: "online", service: "z1-github-tools"});

  const other = await fetch(`${base}/`);
  assert.equal(other.status, 404);
});

test("status route fails closed until server secrets are configured", async t => {
  const base = await withServer(t, {env: {}});
  const response = await fetch(`${base}/api/z1/github/status?repo=KinGKrAss%2FZ1`);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).error, "github_tools_not_configured");
});

test("API remains read-only", async t => {
  const base = await withServer(t);
  const response = await fetch(`${base}/api/z1/github/status?repo=KinGKrAss%2FZ1`, {method: "POST"});
  assert.equal(response.status, 405);
  assert.equal(response.headers.get("allow"), "GET");
});
