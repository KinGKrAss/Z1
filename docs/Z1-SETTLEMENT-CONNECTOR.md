# Z1 Settlement Connector Architecture

## Purpose

Define the production boundary between the Z1/PPT transaction engine and external payment/settlement infrastructure.

## Rule

Z1 owns transaction intent, authorization, accounting state and audit history. An external settlement connector only executes an already-authorized settlement through an independently authenticated participant connection.

## Bundesbank / TARGET compatibility

Deutsche Bundesbank documentation states that T2 and TIPS provide settlement infrastructure and that participant application-to-application connections use published functional specifications and ISO 20022 messages. This document therefore treats Bundesbank/TARGET/TIPS as a possible settlement rail, not as an assumed existing Z1 connection.

Before enabling a live connector, Z1 must verify:

1. the legal entity participating in the relevant service;
2. the exact participant/technical access path;
3. credentials, certificates and signing keys;
4. the permitted message types and settlement account structure;
5. reconciliation and idempotency requirements;
6. operational controls and incident procedures;
7. whether the PPT transaction is legally permitted to settle through the selected rail;
8. any required CASP/payment/e-money authorization or regulated partner arrangement.

## Adapter interface

The production adapter should expose only:

- `prepareSettlement(transaction)`
- `submitSettlement(authorizedTransaction)`
- `getSettlementStatus(reference)`
- `reconcile(reference)`
- `cancelOrCompensate(reference)` where supported

The adapter must reject any transaction that is not `AUTHORIZED` by Z1.

## PPT boundary

PPT on-chain settlement remains a separate adapter. It must not be represented as Bundesbank money or central-bank money. If a conversion or redemption path is ever introduced, it must be explicitly documented and legally structured.

## Production gate

No live credentials, private keys, payment credentials or central-bank credentials belong in source control. Production activation requires independent security review, key management, compliance sign-off and end-to-end reconciliation tests.
