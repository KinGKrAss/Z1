# Z1 Digital Mietvertrag v1

## Zweck

Erster digitaler Mietvertrags-Workflow für Z1. Das Modul verwaltet Vertragsentwürfe, Parteien, Mietobjekte, wirtschaftliche Konditionen, Freigaben, Signaturstatus und revisionssichere Ereignisse.

## Grundprinzip

Z1 owns the authoritative contract state. KI-Modelle may draft, extract, explain or validate data, but cannot silently alter a signed contract.

## Contract lifecycle

1. `DRAFT`
2. `REVIEW`
3. `APPROVED`
4. `SIGNATURE_PENDING`
5. `SIGNED`
6. `ACTIVE`
7. `TERMINATED`
8. `ARCHIVED`

## Minimum data model

- `contract_id`
- landlord identity
- tenant identity
- property/asset identity
- address and unit identifier
- start date
- end date / indefinite flag
- base rent
- operating-cost advance
- deposit
- payment interval
- due date
- indexation / rent-adjustment terms
- permitted use
- attachments
- signature evidence
- audit events
- version hash

## AI integration

Supported models are interchangeable. A model can create a draft or propose changes through Z1 APIs. Z1 validates permissions and writes the authoritative version. Signed versions are immutable; amendments create a new version linked to the prior contract.

## Digital-signature boundary

V1 stores signature status and evidence metadata. It does not claim that a stored click/signature is automatically a qualified electronic signature. For production use, integrate a compliant e-signature provider or qualified trust-service workflow where legally required.

## Rental law boundary

The system is a workflow and record-keeping layer, not a substitute for legal review. Contract templates must be jurisdiction-specific. For German residential leases, mandatory statutory requirements and tenant-protection rules must be validated before production use.

## PPT integration

A signed/active contract may generate authorized payment instructions or Z1 service-fee transactions. No real PPT movement occurs in V1. The payment/settlement layer remains behind Z1 authorization and the existing PPT transaction engine.

## Security requirements

- authenticated parties and agents
- least-privilege capabilities
- immutable signed-version records
- audit trail for every material change
- idempotency keys for payment instructions
- encryption at rest and in transit
- tenant data access isolation
- retention/deletion policy
- explicit production gate for external settlement
