import test from "node:test";
import assert from "node:assert/strict";
import { handleZ1GitHubApi } from "../runtime/z1-github-api.mjs";

const env = {
  Z1_GITHUB_TOOL_TOKEN: "z".repeat(40),
  Z1_GITHUB_TOKEN: "github-read-token",
  Z1_GITHUB_REPOSITORIES: "KinGKrAss/Z1"
};

function route(path, {method = "GET", authorization = `Bearer ${env.Z1_GITHUB_TOOL_TOKEN}`, fetchImpl, env: routeEnv = env} = {}) {
  const response = {};
  const handled = handleZ1GitHubApi(
    {method, headers: {authorization}},
    response,
    new URL(`http://localhost${path}`),
    {json: (_res, status, body) => { response.status = status; response.body = body; }, fetchImpl, env: routeEnv}
  );
  return Promise.resolve(handled).then(handled => ({handled, ...response}));
}

function ok(body) {
  return new Response(JSON.stringify(body), {status: 200, headers: {"content-type": "application/json"}});
}

test("GitHub tool routes are read-only and unknown paths fall through", async () => {
  assert.equal(await handleZ1GitHubApi({method: "GET"}, {}, new URL("http://localhost/unrelated"), {}), false);
  assert.equal((await route("/api/z1/github/status?repo=KinGKrAss%2FZ1", {method: "POST"})).status, 405);
});

test("fails closed when private tool authorization is missing or wrong", async () => {
  assert.equal((await route("/api/z1/github/status?repo=KinGKrAss%2FZ1", {authorization: ""})).status, 401);
  assert.equal((await route("/api/z1/github/status?repo=KinGKrAss%2FZ1", {authorization: "Bearer wrong"})).status, 401);
  assert.equal((await route("/api/z1/github/status?repo=KinGKrAss%2FZ1", {env: {...env, Z1_GITHUB_TOOL_TOKEN: undefined}})).status, 503);
});

test("only configured repositories can be queried", async () => {
  let calls = 0;
  const result = await route("/api/z1/github/status?repo=SomeoneElse%2Fprivate", {fetchImpl: async () => { calls++; throw new Error("must not call GitHub"); }});
  assert.equal(result.status, 403);
  assert.equal(calls, 0);
});

test("reports green only when GitHub checks and workflow runs succeeded", async () => {
  const sha = "a".repeat(40);
  const calls = [];
  const fetchImpl = async input => {
    const url = new URL(input);
    calls.push(url.pathname + url.search);
    if (url.pathname === "/repos/KinGKrAss/Z1") return ok({default_branch: "main"});
    if (url.pathname === "/repos/KinGKrAss/Z1/commits") return ok([{sha, commit: {message: "checked commit"}, html_url: "https://github.com/KinGKrAss/Z1/commit/" + sha}]);
    if (url.pathname.endsWith("/status")) return ok({state: "success", total_count: 1, statuses: [{state: "success"}]});
    if (url.pathname.endsWith("/actions/runs")) return ok({workflow_runs: [{id: 7, name: "Z1 CI", event: "push", head_branch: "main", head_sha: sha, status: "completed", conclusion: "success", html_url: "https://github.com/KinGKrAss/Z1/actions/runs/7"}]});
    throw new Error("unexpected request " + url);
  };
  const result = await route("/api/z1/github/status?repo=KinGKrAss%2FZ1", {fetchImpl});
  assert.equal(result.status, 200);
  assert.equal(result.body.overall, "green");
  assert.equal(result.body.commit.sha, sha);
  assert.equal(result.body.workflow_runs[0].conclusion, "success");
  assert.equal(calls.length, 4);
});

test("reports unknown when GitHub has no checks", async () => {
  const sha = "b".repeat(40);
  const fetchImpl = async input => {
    const url = new URL(input);
    if (url.pathname === "/repos/KinGKrAss/Z1") return ok({default_branch: "main"});
    if (url.pathname === "/repos/KinGKrAss/Z1/commits") return ok([{sha, commit: {message: "no checks"}}]);
    if (url.pathname.endsWith("/status")) return ok({state: "pending", total_count: 0, statuses: []});
    if (url.pathname.endsWith("/actions/runs")) return ok({workflow_runs: []});
    throw new Error("unexpected request " + url);
  };
  const result = await route("/api/z1/github/status?repo=KinGKrAss%2FZ1", {fetchImpl});
  assert.equal(result.status, 200);
  assert.equal(result.body.overall, "unknown");
  assert.equal(result.body.checks.workflow_runs, 0);
});

test("classifies a GitHub 403 instead of repeating an anonymous rate-limited request", async () => {
  const fetchImpl = async () => new Response(JSON.stringify({message: "private upstream details"}), {
    status: 403,
    headers: {"x-ratelimit-remaining": "0", "content-type": "application/json"}
  });
  const result = await route("/api/z1/github/status?repo=KinGKrAss%2FZ1", {fetchImpl});
  assert.equal(result.status, 502);
  assert.equal(result.body.error, "github_rate_limited");
  assert.equal(JSON.stringify(result.body).includes("private upstream details"), false);
});
