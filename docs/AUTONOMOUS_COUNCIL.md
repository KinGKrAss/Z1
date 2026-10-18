# Autonomous Council runtime

The Z1 API includes an opt-in worker and durable task queue for the 33 governed
Council roles. Each task runs through the existing model allowlist and routing
policy. The worker can analyze, summarize, plan, review quality, organize
knowledge, and prepare drafts. It has no tools for browsing, messaging, account
changes, payments, or other external actions.

## Enable and configure

The worker is disabled unless `Z1_AGENTS_ENABLED=true`. Configure:

- `Z1_MODEL_GATEWAY_TOKEN` for the authenticated agent API.
- `Z1_AGENT_OWNER_ID` to isolate a single account's tasks and memories.
- One approved provider key and `Z1_<PROVIDER>_MODELS` allowlist.
- `Z1_MODEL_ROUTING_PROFILES` with a current `neutral_analysis` profile and
  `allowConfidential:true`, as required by the existing model router.
- `Z1_AGENT_STORE_PATH` and `Z1_AGENT_AUDIT_PATH` for data and append-only
  audit files.

Do not enable the worker until the owner, provider credentials, model allowlist,
routing evaluation, and storage location are configured.

## API

All endpoints require `Authorization: Bearer <Z1_MODEL_GATEWAY_TOKEN>`.

- `GET /api/z1/agents/status`
- `GET /api/z1/agents/tasks`
- `POST /api/z1/agents/tasks` with `roleId`, `taskType`, `instructions`,
  optional `context`, `runAt` (ISO time), and optional
  `repeatEveryMinutes` (60 through 525600).
- `GET /api/z1/agents/memories`
- `POST /api/z1/agents/memories/:id/feedback` with `{"helpful":true}` or
  `{"helpful":false}`.

Successful task outputs begin as pending memories. Only memories explicitly
accepted by the owner are included as context in later tasks for that same role.
This is feedback-based learning; it does not train model weights or create
independent goals. Every task is bounded by an explicit owner-supplied request.
The runtime does not automatically import ChatGPT conversations or synchronize
other AI chats. The owner must supply context through a task. Task context and
results are stored as plaintext JSON with restrictive file permissions; this is
not encryption at rest. Do not include credentials, and protect the data volume
and its backups. Task content is sent to the configured model provider under
that provider's terms.

## Persistence boundary

The default backend is an atomic JSON file, suitable for local development or a
single server with a persistent mounted disk. It survives process restarts when
that disk survives. Cloud Run's container filesystem is ephemeral and instances
may scale horizontally; this JSON backend therefore does not provide durable,
cross-instance production storage there. Keep the worker disabled on Cloud Run
until a persistent transactional store (and single-worker coordination) is
configured. No claim of a live autonomous deployment is made by this code change.
