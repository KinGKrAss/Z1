# Z1 Command Center — Foundation V1

Z1 is being developed as a modular real-estate and asset command center rather than a static dashboard.

## Target architecture

- **Web / Android UI** — responsive command center, maps, dashboards and document workflows.
- **API layer** — typed REST endpoints with authentication, validation and audit logging.
- **Domain layer** — properties, units, leases, assets, financial accounts, transactions and documents.
- **Zoë AI layer** — controlled tool routing over approved Z1 APIs; no direct database writes from the model.
- **Data layer** — PostgreSQL as the system of record; object storage for documents; optional vector index for semantic retrieval.
- **Security** — least privilege, secrets outside Git, immutable audit events and explicit human approval for sensitive actions.

## First production milestones

1. Establish the canonical PostgreSQL schema.
2. Introduce typed domain models and API contracts.
3. Replace mock dashboard values with API-backed data.
4. Add authentication and role-based authorization.
5. Add document ingestion and searchable metadata.
6. Connect Zoë through a tool gateway with allowlisted operations.
7. Add automated tests and CI before production deployment.

## Non-negotiables

- No credentials, tokens or personal financial secrets in Git.
- No destructive operation without authorization and an audit event.
- UI state is never treated as the source of truth.
- Every financial/property figure carries a source and timestamp where available.
- Modules communicate through stable contracts, not hidden cross-module state.

This document is the foundation milestone for the Z1 Command Center repository.
