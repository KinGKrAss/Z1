# Governed model selection

The three existing authenticated humanitarian AI workflows accept `provider: "auto"`
with no `model`. Explicit provider/model requests retain their existing behavior.
The router selects one model; it does not make parallel calls, retry failed requests,
or send a request to another provider as a fallback.

## Selection algorithm

The operator supplies `Z1_MODEL_ROUTING_PROFILES` as a JSON array. Every entry needs:

- `provider`, `model`: an existing provider and an independently allowlisted model.
- `action`: the exact trusted action assigned by the server route.
- `quality`: a comparable evaluation score from 0 to 1, higher is better.
- `costPerRequest`: measured or estimated cost using the same currency/workload across candidates.
- `latencyMs`: measured latency using the same workload across candidates.
- `evaluationId`: a non-sensitive identifier for the operator's evaluation record.
- `validUntil`: an ISO 8601 expiry timestamp; expired profiles are ineligible.
- `allowConfidential`: explicit operator approval for this provider/model to receive
  potentially confidential workflow parameters. Only `true` is eligible.

First filter by action, expiry, confidentiality approval, configured credential and
model allowlist. Rank by quality descending, cost ascending, latency ascending,
then provider and model identifier for deterministic ties. This is a transparent
lexicographic algorithm, not a claim of measured superiority over other platforms.
Quality/cost/latency are operator-supplied evidence; the router does not verify the
underlying benchmark. Use a consistent task-specific evaluation set. Do not invent
performance values to activate routing. No routing profiles are enabled by default.
Malformed or duplicate configuration fails closed, as does an empty eligible set.

## ModelScope

ModelScope is available as provider `modelscope` through its OpenAI-compatible
text-generation inference endpoint. Configure the server secret `MODELSCOPE_TOKEN`
and the explicit comma-separated model allowlist `Z1_MODELSCOPE_MODELS`, using
namespaced IDs such as `Qwen/Qwen3.5-35B-A3B`. ModelScope IDs are validated as
`namespace/model`; requests go only to the fixed official inference endpoint.

A collection is a catalog grouping, not a single runnable model. Z1 does not
bulk-download every collection entry or execute repository code. Only models
that support ModelScope's compatible text-generation API, are explicitly
allowlisted by the operator, and have a valid routing profile can be selected.
Vision, speech, embedding, dataset, and local-weight entries need task-specific
adapters and are not silently treated as chat models. No ModelScope account or
API token is enabled by default.

Client-provided profiles, quality scores and confidentiality labels cannot change
the server configuration. The route controls the action and prompt template.
A supplied model with `provider: "auto"` is rejected. The router returns the selected
model and evaluation identifier so the choice can be traced.

## Privacy boundary

Selection is audited before model dispatch. The audit records identifiers and the
selection reason, not region/prompt contents or API credentials. The existing model
policy audit and authorization checks still run. An audit write failure prevents
outbound calls. HTTP redirects are refused so credentials and request bodies are
not automatically forwarded to a redirect destination.

Provider credentials belong on the server. Vite no longer substitutes a Gemini
API key into browser JavaScript. Never use a `VITE_` prefix for secrets. The ignored
`.env.local` is not a deployment secret manager and is not automatically loaded by
`node runtime/z1-api.mjs`; production must inject secrets through its deployment
configuration. Local Node 22+ can explicitly load the ignored environment file.
Do not package or upload this file with source or browser assets.

The confidentiality flag is an operator approval, not proof of a provider's retention,
training or legal guarantees. Those require account-level provider configuration and
review. This change protects the AI workflow boundary only; it is not a full security
audit of the rest of Z1 or of third-party AI systems. No private production data was
used for testing. No live model request was made as part of these tests.

## Validation

Run `node --test tests/model-router.test.mjs tests/model_policy_gateway.test.mjs tests/z1-ai-api.test.mjs tests/humanitarian_policy.test.mjs`.
Tests cover stable ranking, missing/expired approvals, invalid configuration,
authenticated routing, redacted audit, audit failure, no automatic fallback,
and ModelScope namespaced model allowlisting and response normalization.
