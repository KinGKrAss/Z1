"""Built-in Z1 domain module adapters.

These adapters deliberately contain no provider credentials or external SDK calls.
They establish stable module identities and health contracts for the Z1 Core.
Provider-specific integrations belong behind these boundaries.
"""

from __future__ import annotations

from decimal import Decimal

from core.fortuna_balance_engine import Asset, Z1FinanceEngine
from core.system_z1_core import ModuleHealth

MODULES = ("zoe", "gaia", "fortuna", "electra", "diplomatie", "ppt")


class Z1DomainModule:
    def __init__(self, name: str, version: str = "1.0.0") -> None:
        self.name = name
        self.version = version

    async def health(self) -> ModuleHealth:
        return ModuleHealth(self.name, "online", self.version, detail="adapter ready")


class ZoeModule(Z1DomainModule):
    def __init__(self) -> None:
        super().__init__("zoe")


class GaiaModule(Z1DomainModule):
    def __init__(self) -> None:
        super().__init__("gaia")


class FortunaModule(Z1DomainModule):
    """FORTUNA exposes source-gated balance calculations to the Z1 core."""

    def __init__(self) -> None:
        super().__init__("fortuna")
        self.balance_engine = Z1FinanceEngine()

    def add_asset(self, asset: Asset) -> None:
        self.balance_engine.add_asset(asset)

    def verify_asset(
        self,
        asset_name: str,
        *,
        evidence_reference: str,
        verified_by: str,
    ) -> Asset:
        return self.balance_engine.verify_asset(
            asset_name,
            evidence_reference=evidence_reference,
            verified_by=verified_by,
        )

    def exclude_asset(self, asset_name: str) -> Asset:
        return self.balance_engine.exclude_asset(asset_name)

    def raw_total(self, currency: str = "EUR") -> Decimal:
        return self.balance_engine.raw_total(currency)

    def verified_total(self, currency: str = "EUR") -> Decimal:
        return self.balance_engine.verified_total(currency)

    def get_finance_report(self) -> dict[str, object]:
        return self.balance_engine.get_report()


class ElectraModule(Z1DomainModule):
    def __init__(self) -> None:
        super().__init__("electra")


class DiplomatieModule(Z1DomainModule):
    def __init__(self) -> None:
        super().__init__("diplomatie")


class PptModule(Z1DomainModule):
    def __init__(self) -> None:
        super().__init__("ppt")


def default_modules() -> list[Z1DomainModule]:
    return [ZoeModule(), GaiaModule(), FortunaModule(), ElectraModule(), DiplomatieModule(), PptModule()]
