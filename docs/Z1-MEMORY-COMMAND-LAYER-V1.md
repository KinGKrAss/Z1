# Z1 Memory Command Layer v1

## Purpose
A model-independent command layer for staging, committing, recalling and administratively requesting actions against Z1.

## Principle
Models propose. Z1 authorizes, persists and audits.

## Commands
- Z1.MEMORY.STORE
- Z1.MEMORY.COMMIT
- Z1.MEMORY.RECALL
- Z1.MEMORY.REJECT
- Z1.ADMIN.REQUEST

## Memory lifecycle
STAGED -> COMMITTED
STAGED -> REJECTED

Committed memory is append-only in this v1 implementation. Corrections are represented as new linked entries rather than silent mutation.

## Required controls
Every command carries actor identity and an optional idempotency key. Administrative requests are created as pending requests; no command grants itself authority.

## Future persistence
The in-memory repository is a development adapter. Production should use a database, tenant/user isolation, encryption, retention policy and vector retrieval where appropriate.
