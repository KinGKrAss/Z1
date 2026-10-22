# Z1 Runtime

System Z1 uses a layered runtime:

`OS → nvm → Node.js → Z1 Services/API → Z1 Core (Python) → Zoë and domain modules`

## Node.js

Node.js is the service/runtime layer. It does not replace `core/system_z1_core.py`.

Use nvm to install the project's Node.js version:

```bash
nvm install
nvm use
node --version
npm --version
```

## Start

```bash
npm run z1:api
```

The API exposes:

- `GET /health`
- `GET /api/z1/status`
- `GET /api/z1/modules`

The Python core can be tested independently:

```bash
npm run test:core
```

No credentials are embedded in the runtime. Provider integrations must use environment configuration and dedicated adapters.

## Autonomous Council worker

The repository contains a durable, opt-in Council worker in `runtime/autonomous-council-runtime.mjs`. It accepts tasks for the 33 role profiles, calls the configured governed model, stores results and provisional role memories, and can reuse memories after review. The roles are software agent profiles that run on configured provider models; this repository does not train foundation model weights.

The worker is intentionally off until all required settings are supplied. Configure these only in a private deployment secret/environment store:

- `Z1_MODEL_GATEWAY_TOKEN`: long random bearer token required by agent API routes.
- `Z1_AGENT_OWNER_ID`: stable private owner identifier. Do not use a display name.
- `Z1_AGENTS_ENABLED=true`: starts the background queue worker.
- Provider API key and explicit model allowlist, for example `OPENAI_API_KEY` and `Z1_OPENAI_MODELS`.
- `Z1_MODEL_ROUTING_PROFILES`: evaluated routing profile matching the selected provider and model.

The worker routes its current tasks through the trusted `neutral_analysis` action. Example profile shape (replace the values with an actually evaluated model and validity period):

```json
[
  {
    "provider": "openai",
    "model": "YOUR_ALLOWLISTED_MODEL",
    "action": "neutral_analysis",
    "quality": 0.9,
    "costPerRequest": 0.01,
    "latencyMs": 1000,
    "evaluationId": "operator-approved-v1",
    "validUntil": "2027-12-31T23:59:59Z",
    "allowConfidential": true
  }
]
```

Set `allowConfidential` to true only after reviewing the selected provider, applicable data terms, and the information that tasks may contain. Keep secrets out of source control. The sample profile is illustrative and does not establish that a model has been evaluated or approved.

Authenticated routes include:

- `GET /api/z1/agents/status` and `GET /api/z1/agents/tasks`
- `POST /api/z1/agents/tasks` to enqueue a bounded task
- `GET /api/z1/agents/memories` and `POST /api/z1/agents/memories/:id/feedback`
- `GET /api/goddesses` and `POST /api/goddesses/execute` for role-based work

Send `Authorization: Bearer <Z1_MODEL_GATEWAY_TOKEN>`. The task queue and audit files must be on durable private storage; the default `data/` paths are local to the API process.

NVIDIA NIM API Catalog is supported through the official OpenAI-compatible `https://integrate.api.nvidia.com/v1/chat/completions` endpoint. Configure `NVIDIA_API_KEY` and an exact comma-separated `Z1_NVIDIA_MODELS` allowlist, such as `nvidia/nemotron-3-nano-30b-a3b`. Keep the key in the deployment secret store. NVIDIA documents this as an OpenAI-compatible chat-completions API.\n\nThe Council model gateway provides no tools to the model. Roles can autonomously analyze supplied context, create internal drafts, and save results. They cannot browse, send messages, move money, change accounts, or execute other external actions. High-impact decisions and irreversible actions stay with a human. A running worker also requires a reachable API deployment and valid provider credentials; code in the repository alone does not enable a live service.
