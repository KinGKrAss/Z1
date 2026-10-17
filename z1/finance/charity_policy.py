"""Quarterly charitable contribution policy for Z1.

The policy reserves 25% of realized positive operating cashflow for charity
at the end of each calendar quarter. The reserve is split equally between
Deutsches Rotes Kreuz (DRK) and Malteser.

This module calculates and records a donation obligation. It does not move
money or call a payment provider; an authorized human/financial control must
approve and execute the transfer.
"""

from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from datetime import date
from typing import Literal

Organization = Literal["DRK", "Malteser"]

CENT = Decimal("0.01")
CONTRIBUTION_RATE = Decimal("0.25")


@dataclass(frozen=True, slots=True)
class QuarterlyDonation:
    quarter: str
    realized_cashflow: Decimal
    contribution_rate: Decimal
    total_contribution: Decimal
    allocations: dict[Organization, Decimal]
    currency: str = "EUR"
    status: str = "PENDING_APPROVAL"


def quarter_for(value: date) -> str:
    return f"{value.year}-Q{((value.month - 1) // 3) + 1}"


def _money(value: Decimal) -> Decimal:
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def calculate_quarterly_donation(
    realized_cashflow: Decimal,
    period_end: date,
    currency: str = "EUR",
) -> QuarterlyDonation:
    """Calculate the 25% quarterly charitable reserve.

    Only positive realized cashflow is eligible. Unrealized asset gains,
    portfolio valuation changes and already-spent funds are not treated as
    cashflow by this policy.
    """
    cashflow = _money(Decimal(realized_cashflow))
    total = _money(max(cashflow, Decimal("0")) * CONTRIBUTION_RATE)
    drk = _money(total / Decimal("2"))
    malteser = _money(total - drk)
    return QuarterlyDonation(
        quarter=quarter_for(period_end),
        realized_cashflow=cashflow,
        contribution_rate=CONTRIBUTION_RATE,
        total_contribution=total,
        allocations={"DRK": drk, "Malteser": malteser},
        currency=currency,
    )
