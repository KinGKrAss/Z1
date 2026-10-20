# Internal equity ledger

This module is a software journal for documenting capital and accounting entries.
It is not a bank, payment service, custody service, proof of ownership, or source
of verified account balances. The `asset_bank` account is only a chart-of-accounts
label. It does not connect to a bank.

## Controls

- Entries use integer minor units and one ISO 4217 currency per entry.
- Every journal entry must balance debits and credits.
- Each entry requires a source or evidence reference. This reference is recorded,
  not independently validated.
- Entries are append-only. Reusing an entry ID with changed contents is rejected.
- A SHA-256 hash chain detects changes to the recorded sequence. It is not a
  cryptographic signature and does not replace access control, backups, or an
  independently held audit copy.
- Trial balances are calculated separately for each currency.
- No API endpoint, bank credential, payment initiation, transfer, lending,
  deposit-taking, or client-money function is added.

## Capital recording

Only record an amount after the user supplies a specific amount, currency, date,
and evidence reference. Keep user-reported claims distinct from documentary
evidence and independent verification. This module stores amounts only; it does
not decide whether capital legally exists or is available.

## Production boundary

The class is an in-process prototype with no durable database or API binding.
Do not use it as the system of record for production funds. Before production,
add authenticated tenant isolation, transactional durable storage, backups,
key management, reconciliation, accounting review, and security testing.
Any regulated banking or payment activity requires a qualified legal and
regulatory assessment and the appropriate licensed provider or authorization.
