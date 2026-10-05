from datetime import date
from decimal import Decimal

from z1.finance.charity_policy import calculate_quarterly_donation


def test_quarterly_donation_is_25_percent_and_split_equally() -> None:
    result = calculate_quarterly_donation(
        Decimal("100000.00"),
        date(2026, 9, 30),
    )

    assert result.quarter == "2026-Q3"
    assert result.total_contribution == Decimal("25000.00")
    assert result.allocations["DRK"] == Decimal("12500.00")
    assert result.allocations["Malteser"] == Decimal("12500.00")
    assert result.status == "PENDING_APPROVAL"


def test_negative_cashflow_creates_no_donation_obligation() -> None:
    result = calculate_quarterly_donation(
        Decimal("-1000.00"),
        date(2026, 9, 30),
    )

    assert result.total_contribution == Decimal("0.00")
