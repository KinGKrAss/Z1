# Z1–Zoë Bridge for ChatGPT

A private Streamable HTTP MCP connector that exposes selected Z1 read operations and a bounded task queue to a ChatGPT-compatible MCP client.

## Tools

- Read-only: `z1_status`, `z1_modules`, `z1_policy`, `zoe_agent_status`, `zoe_list_tasks`, `zoe_list_memories`.
- Write/action: `zoe_queue_task` queues one bounded task for the existing Z1 Council worker; `zoe_feedback_memory` records helpful/reject feedback.

The connector does **not** provide arbitrary filesystem or GitHub writes, deploy itself, or bypass the Z1 worker's owner, model-routing, audit, and task policies. A queued task is not a completed task. Do not treat it as an autonomous general-purpose agent.

## Backend secrets

Set these only in the private hosting provider's secret manager:

- `Z1_API_BASE_URL`: deployed Z1 API base URL (HTTPS; loopback is allowed for local development).
- `Z1_MODEL_GATEWAY_TOKEN`: existing Z1 agent/model API bearer token (at least 32 characters).
- `Z1_CHATGPT_MCP_ACCESS_TOKEN`: a separate random bearer token (at least 32 characters) used by the ChatGPT MCP client.

Never commit or paste these values into chat, source files, Android, or browser bundles. This code cannot create or install credentials in the hosting account.

## Run locally

Node.js 22 or newer:

```sh
npm install
npm start
```

The server listens on loopback port 8788 by default and serves `/mcp`. Put it behind TLS and an authenticated private reverse proxy before remote access. Configure the ChatGPT MCP client with the HTTPS `/mcp` URL and the `Z1_CHATGPT_MCP_ACCESS_TOKEN` as its bearer credential.

## Enable the Z1 worker

The existing worker remains opt-in. Follow [Autonomous Council Worker](../../docs/AUTONOMOUS_COUNCIL_WORKER.md) to configure `Z1_AGENTS_ENABLED=true`, owner ID, provider/model allowlist, routing profile, private persistent storage, and audit paths. Exactly one worker process may use the current JSON queue store.

## Important limitations

This repository change creates connector code only. It does not deploy the connector, configure hosting secrets, create a public endpoint, install a connector in the ChatGPT account, or enable the Council worker. Those steps require the deployment operator and a supported ChatGPT MCP connection flow. The connector only exposes endpoints already documented by the Z1 API; arbitrary document editing and direct GitHub commits remain outside this first version.
