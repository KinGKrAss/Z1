import os

import pytest

from core.trust_wallet_adapter import TrustWalletAdapter, TrustWalletConfigurationError


def test_reads_only_required_environment_variables(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TW_ACCESS_ID", "access-test")
    monkeypatch.setenv("TW_HMAC_SECRET", "secret-test")

    credentials = TrustWalletAdapter().credentials()

    assert credentials.access_id == "access-test"
    assert credentials.hmac_secret == "secret-test"
    assert "access-test" not in repr(credentials)
    assert "secret-test" not in repr(credentials)
    assert "access-test" not in str(credentials)
    assert "secret-test" not in str(credentials)


def test_missing_credentials_fail_closed(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("TW_ACCESS_ID", raising=False)
    monkeypatch.delenv("TW_HMAC_SECRET", raising=False)

    with pytest.raises(TrustWalletConfigurationError):
        TrustWalletAdapter().credentials()


def test_health_never_exposes_credentials(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TW_ACCESS_ID", "access-test")
    monkeypatch.setenv("TW_HMAC_SECRET", "secret-test")

    health = TrustWalletAdapter().health()

    assert health == {
        "provider": "trust_wallet",
        "configured": True,
        "credential_source": "environment",
        "credentials_persisted": False,
    }
    assert all(value not in str(health) for value in ("access-test", "secret-test"))
