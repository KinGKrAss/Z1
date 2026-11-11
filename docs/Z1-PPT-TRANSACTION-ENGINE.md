# Z1 + PPT Transaction Engine

## Objective

Create the first executable economic layer of Z1: any authorized AI model can request a Z1 transaction, while **Z1 remains the authority** for authorization, accounting and settlement state.

PPT is the settlement asset represented by this MVP. The current implementation is explicitly **SANDBOX** and does not move real funds.

## Architecture

```text
AI model (Zoë / GPT / Gemini / local model)
                    |
                    v
             Z1 Authority API
                    |
             Policy / RBAC / Audit
                    |
                    v
          PPT Transaction Engine
                    |
          +---------+---------+
          |                   |
       Z1 Ledger          Settlement Adapter
                              |
                    Base Sepolia / future
                    production settlement
```

## Transaction lifecycle

1. `PENDING_AUTHORIZATION`
2. `AUTHORIZED` or `DENIED`
3. `SETTLED_SANDBOX`
4. Future production state: `SETTLED_ONCHAIN`

Every transaction records the model identity, actor, action, PPT amount, fee, destination, policy and timestamps.

## Economic model

The initial sandbox policy uses a configurable basis-point fee. Example: 100 bps = 1.00%.

The engine separates:

- transaction amount;
- Z1 platform fee;
- net settlement amount;
- settlement destination.

This allows Z1 to monetize completed workflows without coupling the core to a particular AI provider.

## Security rule

A model does **not** receive unrestricted authority merely because it is connected to Z1. It receives capabilities through Z1 policies. Z1 owns the authoritative state and decides whether a requested transaction can execute.

## Production gate

Before production settlement is enabled, implement and independently review:

- authenticated identities and signing;
- persistent ledger/database;
- replay/idempotency protection;
- role and policy engine;
- treasury accounting;
- on-chain settlement adapter for PPT;
- smart-contract verification and testnet deployment;
- compliance/legal classification of PPT and each offered crypto service;
- monitoring, incident response and key management.

EU crypto-asset issuance and services can fall under MiCA. ESMA describes MiCA as the EU framework covering crypto-assets and relevant issuance/service activities, including transparency, authorisation and supervision requirements. citeturn0search0
