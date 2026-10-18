import { timingSafeEqual } from "node:crypto";

const API_BASE = "https://api.github.com";
const API_VERSION = "2022-11-28";
const TIMEOUT_MS = 8_000;
const STATUS_PATH = "/api/z1/github/status";
const RUNS_PATH = "/api/z1/github/runs";

function bearerMatches(header, expected) {
  if (!expected || !header?.startsWith("Bearer ")) return false;
  const actual = Buffer.from(header.slice(7), "utf8");
  const wanted = Buffer.from(expected, "utf8");
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}

function allowedRepositories(raw) {
  return new Set(String(raw || "").split(",").map(value => value.trim()).filter(Boolean));
}

function validRepository(value) {
  return typeof value === "string" && /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value);
}

function statusCodeForGitHub(error) {
  if (error.kind === "rate_limit") return "github_rate_limited";
  if (error.kind === "forbidden") return "github_forbidden";
  if (error.kind === "not_found") return "github_not_found";
  if (error.kind === "unauthorized") return "github_token_invalid";
  return "github_upstream_error";
}

async function githubJson(path, token, fetchImpl) {
  const response = await fetchImpl(new URL(path, API_BASE), {
    method: "GET",
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${token}`,
      "x-github-api-version": API_VERSION,
      "user-agent": "Z1-read-only-GitHub-tools"
    },
    redirect: "error",
    signal: AbortSignal.timeout(TIMEOUT_MS)
  });
  if (!response.ok) {
    const remaining = response.headers?.get?.("x-ratelimit-remaining");
    const retryAfter = response.headers?.get?.("retry-after");
    const kind = response.status === 429 || (response.status === 403 && (remaining === "0" || retryAfter))
      ? "rate_limit"
      : response.status === 403 ? "forbidden"
      : response.status === 401 ? "unauthorized"
      : response.status === 404 ? "not_found"
      : "upstream";
    throw Object.assign(new Error("GitHub request failed"), { kind });
  }
  return response.json();
}

function publicError(error) {
  const code = statusCodeForGitHub(error);
  const messages = {
    github_rate_limited: "GitHub rate limit reached; retry after the reset window.",
    github_forbidden: "GitHub denied access; check token permissions and repository access.",
    github_not_found: "Repository or requested GitHub resource was not found.",
    github_token_invalid: "GitHub token was rejected.",
    github_upstream_error: "GitHub could not complete the read request."
  };
  return { error: code, message: messages[code] };
}

function aggregateState(status, runs, {runsTruncated = false} = {}) {
  const statusContexts = Array.isArray(status?.statuses) ? status.statuses : [];
  const statePresent = statusContexts.length > 0 || (status?.total_count ?? 0) > 0;
  const statusFailed = status?.state === "failure" || status?.state === "error"
    || statusContexts.some(item => item.state === "failure" || item.state === "error");
  const statusPending = ((status?.total_count ?? statusContexts.length) > 0 && status?.state === "pending")
    || statusContexts.some(item => item.state === "pending");
  const runList = Array.isArray(runs?.workflow_runs) ? runs.workflow_runs : [];
  const runFailed = runList.some(run => run.status === "completed"
    && !["success", "neutral", "skipped"].includes(run.conclusion));
  const runPending = runList.some(run => run.status !== "completed");
  if (statusFailed || runFailed) return "red";
  if (statusPending || runPending) return "pending";
  if (runsTruncated || (!statePresent && runList.length === 0)) return "unknown";
  return "green";
}

function runSummary(run) {
  return {
    id: run.id,
    name: run.name ?? run.display_title ?? "GitHub Actions",
    event: run.event,
    branch: run.head_branch,
    head_sha: run.head_sha,
    status: run.status,
    conclusion: run.conclusion,
    created_at: run.created_at,
    updated_at: run.updated_at,
    html_url: run.html_url
  };
}

async function requireGitHubConfig(req, res, url, env, json, fetchImpl) {
  const toolToken = env.Z1_GITHUB_TOOL_TOKEN;
  if (!toolToken) {
    json(res, 503, { error: "github_tools_not_configured", message: "Configure the private Z1_GITHUB_TOOL_TOKEN secret." });
    return null;
  }
  if (!bearerMatches(req.headers?.authorization, toolToken)) {
    json(res, 401, { error: "unauthorized" });
    return null;
  }
  const githubToken = env.Z1_GITHUB_TOKEN;
  if (!githubToken) {
    json(res, 503, { error: "github_token_not_configured", message: "Configure a read-only GitHub token in the server secret store." });
    return null;
  }
  const repo = url.searchParams.get("repo") || "";
  if (!validRepository(repo)) {
    json(res, 400, { error: "invalid_repository", message: "Provide repo as owner/name." });
    return null;
  }
  const allowlist = allowedRepositories(env.Z1_GITHUB_REPOSITORIES);
  if (allowlist.size === 0) {
    json(res, 503, { error: "github_repository_allowlist_not_configured", message: "Configure at least one repository in Z1_GITHUB_REPOSITORIES." });
    return null;
  }
  if (!allowlist.has(repo)) {
    json(res, 403, { error: "repository_not_allowed" });
    return null;
  }
  return { repo, githubToken, fetchImpl };
}

export async function handleZ1GitHubApi(req, res, url, {
  json,
  fetchImpl = globalThis.fetch,
  env = process.env
} = {}) {
  if (![STATUS_PATH, RUNS_PATH].includes(url.pathname)) return false;
  if (req.method !== "GET") {
    json(res, 405, { error: "method_not_allowed", allow: "GET" });
    return true;
  }
  const config = await requireGitHubConfig(req, res, url, env, json, fetchImpl);
  if (!config) return true;
  const { repo, githubToken } = config;
  const repoPath = `/repos/${repo}`;

  try {
    if (url.pathname === STATUS_PATH) {
      const repository = await githubJson(repoPath, githubToken, fetchImpl);
      const branch = repository.default_branch;
      if (!branch) {
        json(res, 502, { error: "default_branch_missing" });
        return true;
      }
      const commits = await githubJson(
        `${repoPath}/commits?sha=${encodeURIComponent(branch)}&per_page=1`,
        githubToken,
        fetchImpl
      );
      const commit = Array.isArray(commits) ? commits[0] : null;
      if (!commit?.sha) {
        json(res, 502, { error: "latest_commit_missing" });
        return true;
      }
      const [combined, actions] = await Promise.all([
        githubJson(`${repoPath}/commits/${commit.sha}/status`, githubToken, fetchImpl),
        githubJson(`${repoPath}/actions/runs?head_sha=${commit.sha}&per_page=20`, githubToken, fetchImpl)
      ]);
      const actionRuns = Array.isArray(actions.workflow_runs) ? actions.workflow_runs : [];
      const runs = actionRuns.map(runSummary);
      const totalRuns = Number.isInteger(actions.total_count) ? actions.total_count : runs.length;
      const runsTruncated = totalRuns > runs.length;
      json(res, 200, {
        repository: repo,
        branch,
        commit: { sha: commit.sha, message: (commit.commit?.message || "").split("\n")[0], html_url: commit.html_url },
        overall: aggregateState(combined, actions, {runsTruncated}),
        checks: { state: combined.state || "none", total: combined.total_count ?? 0, workflow_runs: runs.length, total_workflow_runs: totalRuns, workflow_runs_truncated: runsTruncated },
        workflow_runs: runs,
        checked_at: new Date().toISOString()
      });
      return true;
    }

    const repository = await githubJson(repoPath, githubToken, fetchImpl);
    const branch = url.searchParams.get("branch") || repository.default_branch;
    if (!branch || branch.length > 255 || /[\r\n]/.test(branch)) {
      json(res, 400, { error: "invalid_branch" });
      return true;
    }
    const requested = Number(url.searchParams.get("per_page") || "10");
    const perPage = Number.isInteger(requested) ? Math.min(20, Math.max(1, requested)) : 10;
    const actions = await githubJson(
      `${repoPath}/actions/runs?branch=${encodeURIComponent(branch)}&per_page=${perPage}`,
      githubToken,
      fetchImpl
    );
    json(res, 200, {
      repository: repo,
      branch,
      total_count: actions.total_count ?? 0,
      workflow_runs: (actions.workflow_runs || []).map(runSummary),
      checked_at: new Date().toISOString()
    });
    return true;
  } catch (error) {
    const mapped = publicError(error);
    json(res, 502, mapped);
    return true;
  }
}
