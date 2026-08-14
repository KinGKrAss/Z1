import tempfile
import unittest

from modules.bootstrap import build_core
from core.system_z1_core import Z1Config


class Z1DomainModulesTests(unittest.IsolatedAsyncioTestCase):
    async def test_all_first_party_modules_register_and_report_online(self):
        with tempfile.TemporaryDirectory() as tmp:
            core = build_core(Z1Config(audit_path=f"{tmp}/audit.jsonl"))
            await core.start()
            try:
                self.assertEqual(
                    core.registry.names(),
                    ("diplomatie", "electra", "fortuna", "gaia", "ppt", "zoe"),
                )
                health = await core.health()
                self.assertEqual(health["status"], "online")
                self.assertEqual(health["module_count"], 6)
                self.assertTrue(all(item["status"] == "online" for item in health["modules"]))
            finally:
                await core.stop()


if __name__ == "__main__":
    unittest.main()
