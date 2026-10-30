# Z1 Operational Self-Model

The authenticated endpoint `GET /api/z1/self/state` returns a machine-readable snapshot of the Z1 Council runtime for the configured owner.

It reports:

- the declared Z1 runtime identity and schema version;
- whether the worker is enabled and running;
- current and recent task states;
- references to memories loaded into a task context;
- counts of owner-scoped shared and role memories;
- the input channels available to this runtime.

Memory references contain identifiers and source references, not memory contents. Task context loading is recorded in the audit stream without recording prompts or model responses.

## Configuration and access

The endpoint is served by the existing Z1 agent API. It requires the same `Z1_MODEL_GATEWAY_TOKEN` bearer token and configured `Z1_AGENT_OWNER_ID` as the memory and agent routes. It returns `503` if the gateway or owner is not configured, `401` for an invalid token, and `405` for methods other than GET.

## Interpretation

This is operational observability: the API reports the identity, stored records, and actions represented in Z1's software state. It does not inspect a model's private activations or prove subjective experience. The runtime has no ambient sensor input; it only receives authenticated API requests and owner-scoped stored memory.
