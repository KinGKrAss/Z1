from datetime import date
from decimal import Decimal
import json
import sqlite3
import tempfile
import unittest

from modules.bootstrap import build_core
from core.system_z1_core import Z1Config
from z1.finance.charity_policy import calculate_quarterly_donation as calculate
from z1.finance.quarter_close import QuarterlyObligationStore


class CharityPolicyTests(unittest.TestCase):
    def test_reserve_without_fixed_split(self):
        result = calculate(Decimal('1.00'), date(2026, 9, 30))
        self.assertEqual(result.total_contribution, Decimal('.25'))
        self.assertEqual(result.allocations, {})
        self.assertEqual(result.status, 'PENDING_APPROVAL')
        self.assertEqual(result.quarter, '2026-Q3')

    def test_need_based_exact_allocation(self):
        result = calculate(Decimal('100000'), date(2026, 9, 30),
                           allocations={'DRK': Decimal('20000'), 'Malteser': Decimal('5000')})
        self.assertEqual(sum(result.allocations.values()), result.total_contribution)
        self.assertEqual(result.total_contribution, Decimal('25000'))

    def test_nonpositive_cashflow(self):
        for value in ['0', '-1000']:
            self.assertEqual(calculate(Decimal(value), date(2026, 9, 30)).total_contribution, 0)

    def test_calendar_ends(self):
        for month, day in [(3,31), (6,30), (9,30), (12,31)]:
            calculate(Decimal('1'), date(2026, month, day))
        for value in [date(2026,7,1), date(2026,9,29), date(2026,2,28)]:
            with self.assertRaises(ValueError):
                calculate(Decimal('1'), value)

    def test_invalid_amounts_and_allocations(self):
        for value in ['NaN', 'Infinity', '-Infinity']:
            with self.assertRaises(ValueError):
                calculate(Decimal(value), date(2026,9,30))
        for amounts in [{'DRK': Decimal('.25')}, {'DRK': Decimal('.125'), 'Malteser': Decimal('.125')},
                        {'DRK': Decimal('-.01'), 'Malteser': Decimal('.26')},
                        {'DRK': Decimal('.12'), 'Malteser': Decimal('.12')}]:
            with self.assertRaises(ValueError):
                calculate(Decimal('1'), date(2026,9,30), allocations=amounts)


class QuarterCloseTests(unittest.IsolatedAsyncioTestCase):
    async def test_event_persistence_restart_and_conflict(self):
        with tempfile.TemporaryDirectory() as tmp:
            config = Z1Config(audit_path=f'{tmp}/audit.jsonl')
            payload = dict(scope='group', realized_cashflow='1.00',
                           period_end='2026-09-30', source_refs=['ledger:2026-Q3'])
            for _ in range(2):
                core = build_core(config)
                await core.start()
                try:
                    await core.dispatch('finance.quarter.closed', payload)
                finally:
                    await core.stop()
            with sqlite3.connect(f'{tmp}/charity.sqlite3') as db:
                self.assertEqual(db.execute('SELECT count(*) FROM obligations').fetchone()[0], 1)
                audit = db.execute('SELECT payload FROM charity_audit').fetchall()
                self.assertEqual(len(audit), 1)
                self.assertEqual(json.loads(audit[0][0])['status'], 'PENDING_APPROVAL')
            core = build_core(config)
            await core.start()
            try:
                with self.assertRaises(ValueError):
                    await core.dispatch('finance.quarter.closed', {**payload, 'realized_cashflow':'2'})
            finally:
                await core.stop()

    async def test_reject_incomplete_or_unproven_close(self):
        with tempfile.TemporaryDirectory() as tmp:
            store = QuarterlyObligationStore(f'{tmp}/charity.sqlite3')
            args = dict(scope='group', realized_cashflow='1', period_end=date(2026,9,30),
                        source_refs=['ledger:q3'], today=date(2026,10,1))
            for changes in [dict(source_refs=[]), dict(today=date(2026,9,30)),
                            dict(scope=''), dict(allocations={'DRK':Decimal('.25'), 'Malteser':Decimal('0')})]:
                with self.assertRaises(ValueError):
                    store.close(**{**args, **changes})
