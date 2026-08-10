# Z1 Security Baseline V1

## Secrets

- `.env`, API keys, OAuth tokens, banking credentials and private keys are never committed.
- Production secrets belong in a secret manager or protected deployment environment.
- Existing example files must contain placeholders only.

## Authorization

Use RBAC at the API boundary and enforce authorization again in the service layer. Never trust UI-only guards.

Suggested roles:

- `owner`
- `admin`
- `property_manager`
- `finance_manager`
- `document_manager`
- `viewer`
- `zoe_operator`

## Auditability

Sensitive mutations create an `audit_event` with actor, action, target entity, timestamp and structured metadata.

## Zoë isolation

Zoë receives scoped tools, not database credentials. Tool definitions specify allowed arguments and whether confirmation is required.

## Data integrity

- Use database transactions for multi-record mutations.
- Prefer idempotency keys for imports and financial writes.
- Store source and source timestamps for externally derived values.
- Use SHA-256 hashes for uploaded document integrity checks.

## Deployment gates

Before production:

1. Typecheck
2. Unit/integration tests
3. Dependency audit
4. Secret scan
5. Database migration test
6. API authorization tests
7. Backup/restore test
8. CI green
