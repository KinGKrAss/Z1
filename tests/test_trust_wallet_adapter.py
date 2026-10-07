import os
import unittest
from unittest.mock import patch

from core.trust_wallet_adapter import TrustWalletAdapter, TrustWalletConfigurationError


class TrustWalletAdapterTests(unittest.TestCase):
    def test_reads_only_required_environment_variables(self) -> None:
        with patch.dict(
            os.environ,
            {"TW_ACCESS_ID": "access-test", "TW_HMAC_SECRET": "secret-test"},
            clear=False,
        ):
            credentials = TrustWalletAdapter().credentials()

        self.assertEqual(credentials.access_id, "access-test")
        self.assertEqual(credentials.hmac_secret, "secret-test")
        self.assertNotIn("access-test", repr(credentials))
        self.assertNotIn("secret-test", repr(credentials))
        self.assertNotIn("access-test", str(credentials))
        self.assertNotIn("secret-test", str(credentials))

    def test_missing_credentials_fail_closed(self) -> None:
        with patch.dict(
            os.environ,
            {"TW_ACCESS_ID": "", "TW_HMAC_SECRET": ""},
            clear=False,
        ):
            with self.assertRaises(TrustWalletConfigurationError):
                TrustWalletAdapter().credentials()

    def test_health_never_exposes_credentials(self) -> None:
        with patch.dict(
            os.environ,
            {"TW_ACCESS_ID": "access-test", "TW_HMAC_SECRET": "secret-test"},
            clear=False,
        ):
            health = TrustWalletAdapter().health()

        self.assertEqual(
            health,
            {
                "provider": "trust_wallet",
                "configured": True,
                "credential_source": "environment",
                "credentials_persisted": False,
            },
        )
        self.assertTrue(all(value not in str(health) for value in ("access-test", "secret-test")))


if __name__ == "__main__":
    unittest.main()
