"""FORTUNA asset registry for verified, source-backed financial positions."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum


class VerificationStatus(str, Enum):
    VERIFIED = "verified"
    PARTIAL = "partial"
    UNVERIFIED = "unverified"
    CONFLICTING = "conflicting"
    MISSING = "missing"
    REJECTED = "rejected"


@dataclass(frozen=True, slots=True)
class AssetEvidence:
    source_type: str
    source_reference: str | None
    document_id: str | None
    verification_status: VerificationStatus
    verified_at: str | None = None
    verified_by: str | None = None
    confidence: float | None = None
    notes: str | None = None


@dataclass(frozen=True, slots=True)
class FortunaAsset:
    asset_id: str
    symbol: str
    issuer: str
    asset_type: str
    currency: str
    evidence: AssetEvidence
    quantity: float | None = None
    market_value: float | None = None


# Registry entry only: no holding, price, or market value is asserted here.
# Those values must be populated from source-backed evidence before FORTUNA
# treats the position as verified.
ASSETS: tuple[FortunaAsset, ...] = (
    FortunaAsset(
        asset_id="equity-nvda-001",
        symbol="NVDA",
        issuer="NVIDIA Corporation",
        asset_type="equity",
        currency="USD",
        evidence=AssetEvidence(
            source_type="pending-source",
            source_reference=None,
            document_id=None,
            verification_status=VerificationStatus.MISSING,
            notes="NVIDIA asset registered; holding and valuation evidence still required.",
        ),
    ),
)


def get_asset(asset_id: str) -> FortunaAsset:
    for asset in ASSETS:
        if asset.asset_id == asset_id:
            return asset
    raise KeyError(f"Unknown FORTUNA asset: {asset_id}")
