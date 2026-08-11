# Z1 Architecture V1

```text
Clients
  ├─ Web / Android Command Center
  └─ Zoë conversational interface
          │
          ▼
     API / Auth Gateway
          │
   ┌──────┼───────────┐
   ▼      ▼           ▼
Property Finance   Documents
Service  Service     Service
   │      │           │
   └──────┼───────────┘
          ▼
      PostgreSQL
          │
   Object / File Storage
          │
   Search / Vector Index
```

## Domain modules

### Property
`property` → `unit` → `lease` → `tenant`

A property is the canonical real-estate object. Units hold rentable inventory; leases connect units to tenants and financial terms.

### Finance
`account` → `transaction` → `asset_position`

Financial records are append-oriented. Derived balances and KPIs are calculated from transactions rather than stored as arbitrary UI state.

### Documents
`document` → `document_link`

Documents are stored outside the relational database when binary storage is required. PostgreSQL stores metadata, ownership, hashes, classification and links to domain objects.

### Zoë
Zoë is an orchestration layer. The model receives structured context and invokes allowlisted tools. It does not receive unrestricted SQL/database credentials.

## API conventions

- `/api/v1/...`
- JSON request/response bodies
- UUID identifiers
- ISO-8601 timestamps
- explicit pagination for collections
- structured error responses
- authenticated user context on every protected request
- audit event for sensitive mutations

## Security boundaries

1. Authentication at the gateway.
2. Authorization in the service layer.
3. Database credentials are server-side only.
4. Secrets are environment/secret-manager values, never source files.
5. Zoë tools are allowlisted and parameter validated.
6. High-impact actions require explicit confirmation.
