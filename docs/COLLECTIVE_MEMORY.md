# Z1 collective memory

The authenticated Z1 API now exposes a user-isolated shared knowledge store for
the governed Council roles. The store contains only records explicitly supplied
through this API; it does not connect to ChatGPT's private conversation archive
or import other AI chats.

## Routes

All routes require `Authorization: Bearer <Z1_MODEL_GATEWAY_TOKEN>` and a
configured `Z1_AGENT_OWNER_ID`. Requests fail closed if the owner ID is absent;
the previous implicit shared `default-owner` is not used.

- `GET /api/z1/memory/items` lists the configured owner's records.
- `POST /api/z1/memory/items` adds a record with `title`, `content`, and
  `sourceReference`. The source reference is required for provenance.
- `GET /api/z1/memory/search?q=...` searches the configured owner's records.
  An optional `limit` can be set from 1 to 20.

Records are limited to 8,000 characters and are tagged as user-provided.
Identical records are deduplicated. Each record is audit logged by content hash,
not by writing its text into the audit event. The search returns up to five
relevant matches by default. When the autonomous runtime is enabled, those
matches are added to delegated role prompts as fallible context with a reminder
to verify sources. Existing model routing and task opt-in controls still apply.

## Persistence and deployment

The default backend is an atomic JSON file at
`data/z1_collective_memory.json`, configurable with
`Z1_COLLECTIVE_MEMORY_PATH`. It is for local or single-server development.
Permissions restrict access to the service account, but the file is not
encrypted at rest. Protect the mounted disk and backups; do not store secrets.

This JSON backend is not safe as production shared storage across horizontally
scaled Cloud Run instances. A production deployment needs a persistent,
transactional database with access controls and a coordinated migration. The
API code being present on a branch does not deploy or activate it in the live
Z1 service. It does not create autonomous goals for the roles, connect bank
accounts, or authorize financial transactions.
