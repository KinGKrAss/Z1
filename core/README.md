# System Z1 Core

`core/system_z1_core.py` is the central, provider-agnostic runtime kernel for Z1.

## Responsibilities

- lifecycle: start / stop
- module registry for GAIA, FORTUNA, ELECTRA, DIPLOMATIE and ZOE
- asynchronous event bus with bounded history
- isolated module health checks with timeouts
- append-only JSONL audit log
- non-secret runtime status
- environment-based configuration
- safe detection of whether `OPENAI_API_KEY` is configured (the value is never logged or returned)

## Run

From the repository root:

```bash
python -m core.system_z1_core
```

## Test

```bash
python -m unittest discover -s tests -p 'test_*.py'
```

The core intentionally uses only the Python standard library. Provider-specific
clients and domain logic should be implemented behind module/provider adapters.

## FORTUNA balance engine

`core/fortuna_balance_engine.py` provides exact Decimal-based raw and verified
totals, grouped by currency. The `FortunaModule` exposes the engine through
`balance_engine`, `add_asset`, `verify_asset`, `exclude_asset`,
`raw_total`, `verified_total`, and `get_finance_report`.

New assets default to `UNVERIFIED` and are excluded from verified totals.
`verify_asset` requires an evidence reference and reviewer and records both
before enabling balance inclusion. This records an operator decision; it does
not independently validate documents, ownership, custody, or account balances.

The engine is currently in-memory only. It is not wired to durable storage or an
API and its contents reset when the process restarts. Do not treat its totals as
a persisted or reconciled financial statement.
