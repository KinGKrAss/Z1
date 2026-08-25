import unittest

from z1.knowledge import KnowledgeEntry, SystemZ1Memory, VerificationStatus


class MetaWikiTests(unittest.TestCase):
    def test_core_knowledge_is_available(self):
        z1 = SystemZ1Memory()
        result = z1.query("System Z1")
        self.assertIsNotNone(result["knowledge"])
        self.assertEqual(result["knowledge"]["verification_status"], "verified")

    def test_historical_entry_supports_period_and_source(self):
        z1 = SystemZ1Memory()
        z1.add_knowledge(KnowledgeEntry(
            term="Beispielereignis",
            definition="Historischer Testeintrag.",
            category="history",
            source="test source",
            period_start="1945-01-01",
            period_end="1945-12-31",
            verification_status=VerificationStatus.VERIFIED,
        ))
        result = z1.query("Beispielereignis")
        self.assertEqual(result["knowledge"]["category"], "history")
        self.assertEqual(result["knowledge"]["source"], "test source")
        self.assertEqual(result["knowledge"]["period_start"], "1945-01-01")

    def test_memory_chorus_is_separate_from_meta_wiki(self):
        z1 = SystemZ1Memory()
        z1.remember("System Z1 nutzt einen Gedächtnis-Chor.", "Architektur")
        result = z1.query("Gedächtnis-Chor")
        self.assertIsNone(result["knowledge"])
        self.assertEqual(len(result["memory_resonances"]), 3)


if __name__ == "__main__":
    unittest.main()
