import unittest

from core.office_registry import OFFICES, get_office, validate_registry


class OfficeRegistryTests(unittest.TestCase):
    def test_registry_contains_exactly_33_unique_offices(self):
        validate_registry()
        self.assertEqual(len(OFFICES), 33)
        self.assertEqual(len({office.agent_id for office in OFFICES}), 33)

    def test_every_office_has_mandate(self):
        self.assertTrue(all(office.mandate for office in OFFICES))

    def test_model_handover_preserves_office_identity(self):
        office = get_office("office-01")
        replacement = office.handover("model-v2")
        self.assertEqual(replacement.agent_id, office.agent_id)
        self.assertEqual(replacement.mandate, office.mandate)
        self.assertEqual(replacement.model_id, "model-v2")

    def test_unknown_office_is_rejected(self):
        with self.assertRaises(KeyError):
            get_office("office-99")


if __name__ == "__main__":
    unittest.main()
