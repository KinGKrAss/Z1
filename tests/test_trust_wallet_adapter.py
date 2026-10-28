import os
import unittest
from unittest import mock

from core.trust_wallet_adapter import TrustWalletAdapter, TrustWalletConfigurationError

CREDS = {"TW_ACCESS_ID": "access-test", "TW_HMAC_SECRET": "secret-test"}


class TrustWalletAdapterTests(unittest.TestCase):
    def test_reads_only_required_environment_variables(self):
        with mock.patch.dict(os.environ, CREDS):
            credentials = TrustWalletAdapter().credentials()

        self.assertEqual(credentials.access_id, "access-test")
        self.assertEqual(credentials.hmac_secret, "secret-test")
        for text in (repr(credentials), str(credentials)):
            self.assertNotIn("access-test", text)
            self.assertNotIn("secret-test", text)

    def test_missing_credentials_fail_closed(self):
        with mock.patch.dict(os.environ, clear=False):
            os.environ.pop("TW_ACCESS_ID", None)
            os.environ.pop("TW_HMAC_SECRET", None)
            with self.assertRaises(TrustWalletConfigurationError):
                TrustWalletAdapter().credentials()

    def test_health_never_exposes_credentials(self):
        with mock.patch.dict(os.environ, CREDS):
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
        self.assertTrue(all(v not in str(health) for v in ("access-test", "secret-test")))


if __name__ == "__main__":
    unittest.main()
