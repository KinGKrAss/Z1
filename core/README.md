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
