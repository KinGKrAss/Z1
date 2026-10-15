# GoBTC Pay POS integration

Z1 exposes an authenticated server-side adapter for GoBTC Pay POS API v1.2. It can create a BTC payment request, retrieve a payment by ID, and list payments. Creating a payment returns the provider's QR payload; it does not send Bitcoin from a Z1 wallet. The POS provider handles settlement and exposes status values such as `initiated`, `paid`, and `cleared`.

## Server configuration

Set these values in the deployment's secret store, never in a committed file:

- `GOBTCPAY_API_KEY`: API key for the POS terminal.
- `GOBTCPAY_TERMINAL_ID`: POS terminal identifier.
- `Z1_GOBTCPAY_GATEWAY_TOKEN`: random Z1-side bearer token with at least 32 characters. Keep it separate from the provider key.

The adapter does not log credentials or return them from its status endpoint. It uses the provider's fixed HTTPS API origin and signs every request with HMAC-SHA256 over key-sorted JSON parameters. Create-payment calls require `externalId` so retries can use the provider's idempotency behavior.

## Routes

Every route requires `Authorization: Bearer <Z1_GOBTCPAY_GATEWAY_TOKEN>`.

- `GET /api/z1/gobtcpay/status` reports whether the provider key and terminal ID are configured.
- `POST /api/z1/gobtcpay/payments` creates a POS payment request. JSON fields: `amount`, `currency`, `externalId`, optional `description`, and optional `ttlSeconds`.
- `GET /api/z1/gobtcpay/payments/:paymentId` retrieves the current provider status.
- `GET /api/z1/gobtcpay/payments?limit=20&skip=0&status=cleared` lists provider payments. Optional `start` and `end` are Unix timestamps in seconds; `status` may be repeated.

This adapter does not automatically create a FORTUNA accounting entry. Reconcile provider payments first and book only confirmed incoming transactions through the separate FORTUNA ledger workflow. The provider webhook can be added after its signing secret and a durable event-deduplication store are configured; until then, use the authenticated status/list routes to poll.
