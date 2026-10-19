# Crypto payments and gold reserves: implementation boundary

The requested direction has two separate parts:

1. Accepting Bitcoin and other existing crypto-assets as payment uses each asset's
   own network. Bitcoin is not made gold-backed by recording gold in Z1.
2. Issuing a Z1 token redeemable for or priced by reference to gold is a separate
   token product. It requires verified custody, enforceable holder rights,
   redemption and liquidity arrangements, and a regulatory classification before
   any public offer or live redemption.

The CoinMarketCap-style interface supplied for Z1 is a public market-data
interface. It can support price displays and valuation snapshots; it does not
create wallets, sign transactions, broadcast payments, or provide proof that
gold is held.

## What this branch implements

- An append-only gold bar register with bar identifier, gross weight, fineness,
  named title holder, named custodian, and evidence reference.
- SHA-256 chaining for tamper evidence.
- A review record that changes the displayed status to unverified, verified,
  disputed, or rejected. Only entries with a recorded verified review count
  toward `verifiedFineGrams`.
- A separate internal double-entry equity journal prototype.

The register stores claims and review references. It does not independently
prove ownership, custody, authenticity, audit independence, or physical access.
Gold enters a legally meaningful reserve calculation only after external
evidence is independently checked and its legal availability is established.
The code does not create a gold token or a payment transaction.

## Next integration boundary

A network adapter can prepare and monitor payments on selected public chains
without a commercial bank account. It must use a wallet under the user's control
or a separately approved custodian. Private keys must not be stored in Z1.
Signing or broadcasting must be explicitly configured and tested per network;
this branch does neither. A fiat on-ramp, off-ramp, token issuance, or custody
service may still depend on regulated providers.

For a public token referencing gold, obtain a written EU/German regulatory
classification before issuance. MiCA governs issuers of asset-referenced and
e-money tokens, and BaFin publishes issuer and crypto-institution guidance.
The production system also needs an independent reserve audit, segregation of
assets, redemption operations, transaction monitoring, access controls,
incident recovery, and legal review. A hash chain in application code is not a
substitute for those controls.
