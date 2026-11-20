"""Calculate quarterly reserves; allocation follows documented need, never a fixed split."""
from dataclasses import dataclass
from datetime import date
from decimal import Decimal, ROUND_HALF_UP
from typing import Mapping

CENT = Decimal('0.01')
CONTRIBUTION_RATE = Decimal('0.25')

@dataclass(frozen=True, slots=True)
class QuarterlyDonation:
    quarter: str
    realized_cashflow: Decimal
    contribution_rate: Decimal
    total_contribution: Decimal
    allocations: dict[str, Decimal]
    currency: str = 'EUR'
    status: str = 'PENDING_APPROVAL'


def quarter_for(value: date) -> str:
    return f'{value.year}-Q{((value.month - 1) // 3) + 1}'


def money(value: Decimal) -> Decimal:
    result = Decimal(value)
    if not result.is_finite():
        raise ValueError('Amount must be finite')
    return result.quantize(CENT, rounding=ROUND_HALF_UP)


def calculate_quarterly_donation(realized_cashflow: Decimal, period_end: date,
                                  currency: str = 'EUR', *,
                                  allocations: Mapping[str, Decimal] | None = None) -> QuarterlyDonation:
    if (period_end.month, period_end.day) not in {(3, 31), (6, 30), (9, 30), (12, 31)}:
        raise ValueError('A calendar-quarter end is required')
    if currency != 'EUR':
        raise ValueError('Only EUR settlement is supported')
    cashflow = money(realized_cashflow)
    total = money(max(cashflow, Decimal('0')) * CONTRIBUTION_RATE)
    amounts = {}
    if allocations is not None:
        if set(allocations) != {'DRK', 'Malteser'}:
            raise ValueError('Only DRK and Malteser are permitted')
        for name, value in allocations.items():
            amount = Decimal(value)
            rounded = money(amount)
            if amount < 0 or amount != rounded:
                raise ValueError('Allocations must be nonnegative exact cents')
            amounts[name] = rounded
        if sum(amounts.values()) != total:
            raise ValueError('Allocations must equal the reserve')
    return QuarterlyDonation(quarter_for(period_end), cashflow, CONTRIBUTION_RATE,
                             total, amounts, currency)
