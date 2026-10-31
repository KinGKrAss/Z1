import os

import unittest
from unittest.mock import patch

from core.trust_wallet_adapter import TrustWalletAdapter, TrustWalletConfigurationError


class TrustWalletTests(unittest.TestCase):
    def test_reads_only_required_environment_variables(self) -> None:
        self.enterContext(patch.dict(os.environ, {"TW_ACCESS_ID": "access-test", "TW_HMAC_SECRET": "secret-test"}))

        credentials = TrustWalletAdapter().credentials()

        assert credentials.access_id == "access-test"
        assert credentials.hmac_secret == "secret-test"
        assert "access-test" not in repr(credentials)
        assert "secret-test" not in repr(credentials)
        assert "access-test" not in str(credentials)
        assert "secret-test" not in str(credentials)


    def test_missing_credentials_fail_closed(self) -> None:
        self.enterContext(patch.dict(os.environ, {}, clear=True))

        with self.assertRaises(TrustWalletConfigurationError):
            TrustWalletAdapter().credentials()


    def test_health_never_exposes_credentials(self) -> None:
        self.enterContext(patch.dict(os.environ, {"TW_ACCESS_ID": "access-test", "TW_HMAC_SECRET": "secret-test"}))

        health = TrustWalletAdapter().health()

        assert health == {
            "provider": "trust_wallet",
            "configured": True,
            "credential_source": "environment",
            "credentials_persisted": False,
        }
        assert all(value not in str(health) for value in ("access-test", "secret-test"))
