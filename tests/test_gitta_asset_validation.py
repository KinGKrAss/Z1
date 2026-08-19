import unittest

from modules.gitta_asset_validation import (
    ExtractionResult,
    STATUS_INVALID,
    STATUS_UNVERIFIED,
    STATUS_VALID,
    validate_asset_evidence,
)


class GittaAssetValidationTests(unittest.TestCase):
    def extraction(self, text: str) -> ExtractionResult:
        return ExtractionResult(
            file_name="fixture.html",
            mime_type="text/html",
            sha256="fixture-sha256",
            extraction_status="SUCCESS",
            text=text,
            method="test",
        )

    def test_google_login_export_is_not_an_asset_document(self):
        result = validate_asset_evidence(
            self.extraction(
                "Google Accounts\nSign in with Google\nEmail or phone\nPassword\nLogin"
            )
        )
        self.assertEqual(result.validation_status, STATUS_INVALID)
        self.assertFalse(result.asset_evidence)
        self.assertIn("login/account content detected", result.reasons)

    def test_asset_id_without_verified_source_is_unverified(self):
        result = validate_asset_evidence(
            self.extraction(
                "Delta Asset ID: 73014444142\nAsset Type: GOLD\nQuantity: 1000 g"
            )
        )
        self.assertEqual(result.validation_status, STATUS_UNVERIFIED)
        self.assertTrue(result.asset_evidence)
        self.assertFalse(result.source_verified)

    def test_complete_verified_gold_evidence_is_valid(self):
        result = validate_asset_evidence(
            self.extraction(
                "Delta Asset ID: 73014444142\nAsset Type: GOLD\nQuantity: 1000 g"
            ),
            source_verified=True,
            expected_asset_id="73014444142",
        )
        self.assertEqual(result.validation_status, STATUS_VALID)
        self.assertTrue(result.asset_evidence)
        self.assertEqual(result.asset_id, "73014444142")
        self.assertEqual(result.asset_type, "GOLD")
        self.assertEqual(result.quantity, "1000")
        self.assertEqual(result.unit, "g")

    def test_mismatched_asset_id_cannot_be_valid(self):
        result = validate_asset_evidence(
            self.extraction(
                "Delta Asset ID: 999999999\nAsset Type: GOLD\nQuantity: 1000 g"
            ),
            source_verified=True,
            expected_asset_id="73014444142",
        )
        self.assertNotEqual(result.validation_status, STATUS_VALID)
        self.assertIn("asset ID does not match expected asset", result.reasons)


if __name__ == "__main__":
    unittest.main()
