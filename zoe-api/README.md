# Z1 OpenAI API

FastAPI service connecting the Z1 platform to the OpenAI Responses API and PostgreSQL.

## Environment

```env
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini
DATABASE_URL=postgresql://z1:password@postgres:5432/z1
```

Never expose `OPENAI_API_KEY` to Android, web, or other clients. Clients call this service; the service calls OpenAI.

## Endpoints

- `GET /health` — API + PostgreSQL health check
- `GET /v1/agents` — registered specialist agents
- `POST /v1/chat` — routed chat request

Example request:

```json
{
  "user_id": "00000000-0000-0000-0000-000000000000",
  "message": "Analysiere den Cashflow unseres Immobilienportfolios",
  "agent": null
}
```

The router selects `midas` for finance-related prompts and persists the task in `agent_tasks` before and after the OpenAI call.

## Architecture

```text
Android / Web
    -> Z1 OpenAI API (FastAPI)
       -> Agent Router
       -> PostgreSQL / agent_tasks
       -> OpenAI Responses API
       -> PostgreSQL audit result
```

This is the first production-oriented adapter. Conversation memory, permission checks, tool registry execution and pgvector retrieval should be layered into the existing Zoë Core rather than bypassed in this API.
