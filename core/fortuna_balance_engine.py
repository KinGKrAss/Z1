"""Source-gated, currency-safe FORTUNA balance calculations.

This in-memory engine separates raw reported values from balances that have
explicitly been verified and approved for balance inclusion. It does not store
records durably or independently validate evidence.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from decimal import Decimal
from enum import Enum
from typing import Optional


class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    DOCUMENTED = "DOCUMENTED"
    USER_CLAIM = "USER_CLAIM"
    UNVERIFIED = "UNVERIFIED"
    MISSING = "MISSING"


@dataclass
class Asset:
    name: str
    asset_class: str
    value: Optional[Decimal]
    currency: str = "EUR"
    verification: VerificationStatus = VerificationStatus.UNVERIFIED
    source: Optional[str] = None
    balance_eligible: bool = False

    def __post_init__(self) -> None:
        self.name = self.name.strip()
        self.asset_class = self.asset_class.strip()
        self.currency = self.currency.strip().upper()
        if not self.name:
            raise ValueError("Asset name is required")
        if not self.asset_class:
            raise ValueError("Asset class is required")
        if len(self.currency) != 3 or not self.currency.isalpha():
            raise ValueError("Currency must be a three-letter code")
        if self.value is not None:
            if not isinstance(self.value, Decimal):
                raise TypeError("Asset value must be Decimal or None")
            if not self.value.is_finite():
                raise ValueError("Asset value must be finite")

    def to_dict(self) -> dict[str, object]:
        data = asdict(self)
        data["value"] = str(self.value) if self.value is not None else None
        data["verification"] = self.verification.value
        return data


class Z1FinanceEngine:
    """In-memory FORTUNA calculator; evidence approval is explicit."""

    def __init__(self) -> None:
        self.assets: list[Asset] = []

    def add_asset(self, asset: Asset) -> None:
        if any(existing.name == asset.name for existing in self.assets):
            raise ValueError(f"Asset bereits vorhanden: {asset.name}")
        self.assets.append(asset)

    def verify_asset(
        self,
        asset_name: str,
        *,
        evidence_reference: str,
        verified_by: str,
    ) -> Asset:
        """Approve an asset only with a recorded evidence reference and reviewer.

        This records an operator's decision; it does not independently validate
        the referenced document or prove legal ownership.
        """
        reference = evidence_reference.strip()
        reviewer = verified_by.strip()
        if not reference or not reviewer:
            raise ValueError("Evidence reference and reviewer are required")
        asset = self._get_asset(asset_name)
        asset.source = reference
        asset.verification = VerificationStatus.VERIFIED
        asset.balance_eligible = True
        return asset

    def exclude_asset(self, asset_name: str) -> Asset:
        asset = self._get_asset(asset_name)
        asset.balance_eligible = False
        return asset

    def verified_total(self, currency: str = "EUR") -> Decimal:
        currency = currency.strip().upper()
        return sum(
            (
                asset.value
                for asset in self.assets
                if asset.balance_eligible
                and asset.verification is VerificationStatus.VERIFIED
                and asset.currency == currency
                and asset.value is not None
            ),
            Decimal("0"),
        )

    def raw_total(self, currency: str = "EUR") -> Decimal:
        currency = currency.strip().upper()
        return sum(
            (
                asset.value
                for asset in self.assets
                if asset.currency == currency and asset.value is not None
            ),
            Decimal("0"),
        )

    def get_report(self) -> dict[str, object]:
        return {
            "assets": [asset.to_dict() for asset in self.assets],
            "raw_total_eur": str(self.raw_total("EUR")),
            "verified_total_eur": str(self.verified_total("EUR")),
        }

    def _get_asset(self, asset_name: str) -> Asset:
        for asset in self.assets:
            if asset.name == asset_name:
                return asset
        raise ValueError(f"Asset nicht gefunden: {asset_name}")
