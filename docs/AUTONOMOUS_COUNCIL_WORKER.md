# Autonomous Council Worker

The repository already contains a durable, opt-in Council worker in
`runtime/autonomous-council-runtime.mjs`, authenticated routes in
`runtime/z1-agent-api.mjs`, and startup wiring in `runtime/z1-api.mjs`.
The worker is disabled unless the server environment explicitly sets
`Z1_AGENTS_ENABLED=true`. It does not make the hosted System Z1 plugin or its
status connector autonomous; it runs only in this repository's deployed Z1 API.

## What runs autonomously

The worker polls its task queue, selects one governed model for
`neutral_analysis`, invokes one assigned Council role, records an audit event,
and stores the result as provisional role memory. Tasks can run once or repeat
on an interval. The model gateway is text-only and gives the role no tools.
It cannot browse, send messages, change accounts, move money, or operate
external systems. Human review remains necessary for consequential decisions.

Task creation is explicit through the authenticated API. Autonomous execution
means that queued work is then performed by the server worker without a person
starting each run.

## Runtime configuration

Set these values in the server's secret/configuration manager. Do not commit
credentials or put them in chat.

- `Z1_AGENTS_ENABLED=true` starts the background worker.
- `Z1_AGENT_OWNER_ID` is the stable internal owner ID. Startup is skipped if
  it is missing.
- `Z1_MODEL_GATEWAY_TOKEN` is a high-entropy bearer token for the agent and
  model API routes.
- Set one provider API key, such as `OPENAI_API_KEY`, and allowlist the model
  in the matching variable, such as `Z1_OPENAI_MODELS`.
- `Z1_MODEL_ROUTING_PROFILES` must include an unexpired profile for
  `neutral_analysis` with `allowConfidential: true`, a configured provider
  and allowlisted model, quality from 0 to 1, nonnegative cost and latency,
  an `evaluationId`, and an ISO `validUntil` date. The routing profile is
  server-owned configuration.
- `Z1_AGENT_STORE_PATH` and `Z1_AGENT_AUDIT_PATH` can select private data
  paths. The defaults are under `data/`.

The sample environment file keeps the worker off by default. Enable it only in
the intended deployment after configuring the owner, provider, model allowlist,
routing profile, token, and persistent storage.

## Persistent deployment requirements

The queue and role memories are stored in a local JSON file. Run exactly one
worker process against that file and mount `data/` on persistent private
storage with restricted filesystem permissions and backups. Do not scale this
worker horizontally or run multiple replicas against the same JSON store:
the current file store has no distributed lock or multi-writer coordination.
For multi-replica production use, replace the file store with a transactional
database and a single-claim queue before scaling out.

The API currently binds to `127.0.0.1` by default. A production deployment
must deliberately configure its network binding and access controls; do not
expose the API publicly without authentication and an appropriate proxy or
private network. The existing Cloud Run workflow in this repository deploys
the GitHub tools service, not this Z1 API or its agent worker.

## Authenticated API

All these routes require `Authorization: Bearer <Z1_MODEL_GATEWAY_TOKEN>`
and the configured owner ID:

- `GET /api/z1/agents/status` — worker state and task counts.
- `GET /api/z1/agents/tasks` — tasks for the configured owner.
- `POST /api/z1/agents/tasks` — queue a bounded task.
- `GET /api/z1/agents/memories` — stored role memories.
- `POST /api/z1/agents/memories/{id}/feedback` — mark a memory helpful or
  reject it.

A task body contains `roleId`, `taskType`, and `instructions`, with optional
`context`, `runAt`, and `repeatEveryMinutes`. Allowed task types are
`analysis`, `summary`, `planning`, `quality_review`,
`knowledge_organization`, and `draft`. Repeat intervals are 60 to 525600
minutes. A successful enqueue returns HTTP 202; this means queued, not completed.
