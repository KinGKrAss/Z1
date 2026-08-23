import unittest

from core.fortuna_asset_registry import (
    VerificationStatus,
    get_asset,
)


class FortunaAssetRegistryTests(unittest.TestCase):
    def test_nvidia_is_registered_without_inventing_holdings(self):
        asset = get_asset("equity-nvda-001")
        self.assertEqual(asset.symbol, "NVDA")
        self.assertEqual(asset.issuer, "NVIDIA Corporation")
        self.assertEqual(asset.asset_type, "equity")
        self.assertIsNone(asset.quantity)
        self.assertIsNone(asset.market_value)
        self.assertEqual(asset.evidence.verification_status, VerificationStatus.MISSING)

    def test_unknown_asset_is_rejected(self):
        with self.assertRaises(KeyError):
            get_asset("equity-unknown-001")


if __name__ == "__main__":
    unittest.main()
