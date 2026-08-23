import unittest

from core.gaia_project_registry import (
    FRANKFURT_PROJECTS,
    VerificationStatus,
    get_frankfurt_project,
    validate_registry,
)


class GaiaProjectRegistryTests(unittest.TestCase):
    def test_frankfurt_registry_is_valid(self):
        validate_registry()
        self.assertGreaterEqual(len(FRANKFURT_PROJECTS), 1)

    def test_mainzer_landstrasse_is_explicitly_unverified(self):
        project = get_frankfurt_project("fra-mainzer-landstrasse-001")
        self.assertEqual(project.city, "Frankfurt am Main")
        self.assertEqual(project.verification_status, VerificationStatus.UNVERIFIED)
        self.assertEqual(project.area_m2, 37_000)
        self.assertEqual(project.floors, 11)
        self.assertEqual(project.target_completion_year, 2028)
        self.assertEqual(project.planned_monthly_rent_eur, 1_800_000)

    def test_record_is_serializable(self):
        project = get_frankfurt_project("fra-mainzer-landstrasse-001")
        record = project.to_record()
        self.assertEqual(record["verification_status"], "unverified")
        self.assertEqual(record["value_status"], "plan")


if __name__ == "__main__":
    unittest.main()
