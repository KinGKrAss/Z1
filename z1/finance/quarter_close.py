"""Durable, idempotent quarter close with an atomic audit record. No payments."""
from dataclasses import asdict
from datetime import date, datetime, timezone
import json
from pathlib import Path
import sqlite3

from z1.finance.charity_policy import calculate_quarterly_donation


class QuarterlyObligationStore:
    def __init__(self, path):
        self.path = Path(path)

    def close(self, *, scope, realized_cashflow, period_end, source_refs,
              allocations=None, allocation_reason='', currency='EUR', today=None):
        today = today or datetime.now(timezone.utc).date()
        if period_end >= today:
            raise ValueError('Quarter must have fully ended')
        if not isinstance(scope, str) or not scope.strip():
            raise ValueError('Scope is required')
        if not isinstance(source_refs, (list, tuple)) or not source_refs or any(
                not isinstance(ref, str) or not ref.strip() for ref in source_refs):
            raise ValueError('Cashflow evidence references are required')
        if allocations is not None and not allocation_reason.strip():
            raise ValueError('Need-based allocation requires a reason')
        result = calculate_quarterly_donation(realized_cashflow, period_end, currency,
                                               allocations=allocations)
        record = asdict(result)
        record.update(scope=scope, period_end=period_end.isoformat(),
                      source_refs=sorted(set(source_refs)), allocation_reason=allocation_reason)
        # Decimal strings preserve exact cents; no binary floats enter storage.
        payload = json.dumps(record, default=str, sort_keys=True)
        key = json.dumps([scope, result.quarter, currency])
        self.path.parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.path) as db:
            db.execute('CREATE TABLE IF NOT EXISTS obligations (id TEXT PRIMARY KEY, payload TEXT NOT NULL)')
            db.execute('CREATE TABLE IF NOT EXISTS charity_audit (id INTEGER PRIMARY KEY, obligation_id TEXT NOT NULL UNIQUE, action TEXT NOT NULL, timestamp TEXT NOT NULL, payload TEXT NOT NULL)')
            db.execute('BEGIN IMMEDIATE')
            existing = db.execute('SELECT payload FROM obligations WHERE id=?', (key,)).fetchone()
            if existing:
                if existing[0] != payload:
                    raise ValueError('Quarter already closed with different inputs; reconciliation required')
                return json.loads(existing[0])
            db.execute('INSERT INTO obligations VALUES (?, ?)', (key, payload))
            db.execute('INSERT INTO charity_audit (obligation_id, action, timestamp, payload) VALUES (?, ?, ?, ?)',
                       (key, 'charity.obligation.created', datetime.now(timezone.utc).isoformat(), payload))
        return json.loads(payload)


def bind_quarter_close(core):
    store = QuarterlyObligationStore(core.audit.path.parent / 'charity.sqlite3')

    def on_close(event):
        payload = dict(event.payload)
        if set(payload) - {'scope', 'realized_cashflow', 'period_end', 'source_refs',
                           'allocations', 'allocation_reason', 'currency'}:
            raise ValueError('Unsupported quarter-close fields')
        payload['period_end'] = date.fromisoformat(payload['period_end'])
        store.close(**payload)

    core.events.subscribe('finance.quarter.closed', on_close)
