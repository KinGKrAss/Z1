# Z1 Memory Importer

`z1_memory_importer.py` imports ChatGPT-style JSON or JSONL exports through the Z1 API endpoint `/memory/conversations/import`.

## Install

```bash
pip install requests
```

## Dry run

```bash
python scripts/z1_memory_importer.py conversations.json --api http://localhost:8000 --dry-run
```

## Import

```bash
export Z1_API_URL=https://YOUR-Z1-CLOUD-RUN-URL
export Z1_API_TOKEN=YOUR_TOKEN
python scripts/z1_memory_importer.py conversations.json
```

The importer preserves external conversation and message IDs and does not write to PostgreSQL directly. Use a dry run before a large import.
