import unittest

from core.ai_governance import AI_PROVIDERS, get_office, get_provider


class AIGovernanceTests(unittest.TestCase):
    def test_four_ai_pillars_are_registered(self):
        self.assertEqual(
            {provider.provider_id for provider in AI_PROVIDERS},
            {"zoe", "gemini", "siri", "perplexity"},
        )

    def test_office_identity_survives_model_handover(self):
        office = get_office("jurena")
        replacement = office.handover("replacement-model-v1")
        self.assertEqual(replacement.agent_id, "jurena")
        self.assertEqual(replacement.model_id, "replacement-model-v1")
        self.assertEqual(replacement.mandate, office.mandate)

    def test_external_provider_is_not_the_z1_state_owner(self):
        provider = get_provider("perplexity")
        self.assertTrue(provider.read_only_by_default)
        self.assertEqual(provider.role, "research")


if __name__ == "__main__":
    unittest.main()
