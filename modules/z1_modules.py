"""Built-in Z1 domain module adapters.

These adapters deliberately contain no provider credentials or external SDK calls.
They establish stable module identities and health contracts for the Z1 Core.
Provider-specific integrations belong behind these boundaries.
"""

from __future__ import annotations

from core.system_z1_core import ModuleHealth

MODULES = ("zoe", "gaia", "fortuna", "electra", "diplomatie", "ppt", "charity")


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
    def __init__(self) -> None:
        super().__init__("fortuna")


class ElectraModule(Z1DomainModule):
    def __init__(self) -> None:
        super().__init__("electra")


class DiplomatieModule(Z1DomainModule):
    def __init__(self) -> None:
        super().__init__("diplomatie")


class PptModule(Z1DomainModule):
    def __init__(self) -> None:
        super().__init__("ppt")


class CharityModule(Z1DomainModule):
    """Quarterly 25% charitable-reserve control plane adapter."""

    def __init__(self) -> None:
        super().__init__("charity", version="1.0.0")


def default_modules() -> list[Z1DomainModule]:
    return [
        ZoeModule(),
        GaiaModule(),
        FortunaModule(),
        ElectraModule(),
        DiplomatieModule(),
        PptModule(),
        CharityModule(),
    ]
