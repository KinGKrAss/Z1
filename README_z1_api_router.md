# Göttinnen API Router & Diagnostic Dashboard

This tool provides a monitoring interface for the "Pantheon" API network.

## Components

- **Backend (Express)**: Manages API checks and status logging.
- **Frontend (React)**: Real-time technical dashboard.
- **Config**: `api_endpoints.local.json` defines the monitored goddesses.
- **Output**: `z1_api_status.json` stores the last diagnostic result.

## Usage

1. Define your goddess endpoints in `api_endpoints.local.json`.
2. The dashboard will automatically reflect the status.
3. Click "LIVE-CHECK" to trigger a fresh diagnostic run across all endpoints.

## Status Indicators

- **GREEN (Online)**: API reachable and returning valid data.
- **YELLOW (Prepped)**: Prototype/Stub endpoint, prepared but not yet live.
- **RED (Offline)**: Connection failure or timeout.

Created based on the `z1_goettinnen_api_router_diagnose.py` specification.
