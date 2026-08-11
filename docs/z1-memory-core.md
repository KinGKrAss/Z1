# Z1 Memory Core

## Purpose

The Memory Core is an external, model-independent persistence layer for Z1. It separates raw conversation history from durable memories and keeps provenance for durable claims.

## Data flow

```text
chat/export -> ingest_conversation() -> memory_conversations + memory_messages
                                           |
                                           v
                                    memory extraction
                                           |
                                           v
memory_entries -> memory_versions -> source_references -> context package -> model/agent
```

## Memory rules

1. Raw messages are never replaced by summaries.
2. A reconstruction is labelled `REKONSTRUKTION`; it is not stored as an original statement.
3. Updates create a new memory version and mark the previous version non-current.
4. Durable memories should include provenance whenever a source is available.
5. `confidence` and `priority` are metadata for retrieval, not proof of truth.
6. The system does not silently ingest conversations from a third-party AI provider. A provider export, connector, or explicit ingestion call must supply the raw conversation data.

## MCP tools

- `save_memory`
- `search_memory`
- `build_memory_context`
- `ingest_conversation`
- existing property/document tools remain available through the same service layer.

## Important operational boundary

Z1 cannot directly read private chat history that is not supplied to it. To build a complete historical archive, export the conversations from the relevant provider or connect an authorized data connector, then call the conversation ingestion endpoint/MCP tool. This keeps the archive auditable and avoids invented history.
