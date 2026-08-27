"""Trust Wallet credential adapter for Z1.

This module deliberately does not persist credentials and does not implement
transaction signing. Trust Wallet credentials are read only from the process
environment at call time. No credential value is returned by repr/str or
included in logs/audit payloads.

The public Trust Wallet developer documentation describes Wallet Core,
WalletConnect and deep-link integrations rather than a generic server-side
HTTP API. Therefore this adapter is intentionally a credential boundary;
provider-specific API calls should be added only when the exact supported
endpoint and signing scheme are verified.
"""
from __future__ import annotations

import os
from dataclasses import dataclass


class TrustWalletConfigurationError(RuntimeError):
    """Raised when the Trust Wallet integration is not configured safely."""


@dataclass(frozen=True, slots=True)
class TrustWalletCredentials:
    access_id: str
    hmac_secret: str

    def __repr__(self) -> str:  # pragma: no cover - defensive representation
        return "TrustWalletCredentials(access_id=<redacted>, hmac_secret=<redacted>)"

    def __str__(self) -> str:
        return "TrustWalletCredentials(<redacted>)"


class TrustWalletAdapter:
    """Environment-only Trust Wallet credential boundary for Z1."""

    provider_id = "trust_wallet"

    @staticmethod
    def _required_env(name: str) -> str:
        value = os.getenv(name)
        if not value or not value.strip():
            raise TrustWalletConfigurationError(f"Missing required environment variable: {name}")
        return value.strip()

    def credentials(self) -> TrustWalletCredentials:
        """Read credentials from the environment without persisting them."""
        return TrustWalletCredentials(
            access_id=self._required_env("TW_ACCESS_ID"),
            hmac_secret=self._required_env("TW_HMAC_SECRET"),
        )

    def configured(self) -> bool:
        """Return whether both required variables are present and non-empty."""
        return bool(os.getenv("TW_ACCESS_ID", "").strip()) and bool(
            os.getenv("TW_HMAC_SECRET", "").strip()
        )

    def health(self) -> dict[str, object]:
        """Return safe configuration health; never expose credential values."""
        return {
            "provider": self.provider_id,
            "configured": self.configured(),
            "credential_source": "environment",
            "credentials_persisted": False,
        }
