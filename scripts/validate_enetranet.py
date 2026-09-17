#!/usr/bin/env python3
"""Validate the repository's Entranet network configuration without touching the host network."""

from __future__ import annotations

import ipaddress
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
ARCH = ROOT / "docs" / "enetranet" / "ARCHITECTURE.md"
WG = ROOT / "infra" / "enetranet" / "wireguard" / "z1.conf.example"
FW = ROOT / "infra" / "enetranet" / "firewall" / "README.md"

REQUIRED_SUBNETS = {
    "10.42.0.0/24",
    "10.42.10.0/24",
    "10.42.20.0/24",
    "10.42.30.0/24",
}


def fail(message: str) -> None:
    print(f"[Entranet] FAIL: {message}")
    raise SystemExit(1)


def main() -> None:
    for path in (ARCH, WG, FW):
        if not path.is_file():
            fail(f"missing required file: {path.relative_to(ROOT)}")

    architecture = ARCH.read_text(encoding="utf-8")
    wireguard = WG.read_text(encoding="utf-8")
    firewall = FW.read_text(encoding="utf-8")

    for subnet in REQUIRED_SUBNETS:
        ipaddress.ip_network(subnet, strict=True)
        if subnet not in architecture:
            fail(f"required subnet is not documented: {subnet}")

    if "10.42.0.0/16" not in architecture:
        fail("Entranet supernet 10.42.0.0/16 is not documented")

    if "PrivateKey = <LOAD_FROM_SECRET_STORE>" not in wireguard:
        fail("WireGuard example must load the private key from a secret store")

    if re.search(r"(?im)^\s*PrivateKey\s*=\s*(?!<LOAD_FROM_SECRET_STORE>)[^#\n]+", wireguard):
        fail("WireGuard example contains a concrete private key")

    if "default DROP" not in firewall:
        fail("firewall baseline does not declare default DROP")
    if "no Internet default route" not in firewall:
        fail("firewall baseline does not require removal of the Internet default route")

    print("[Entranet] OK: repository configuration passes static validation")


if __name__ == "__main__":
    main()
