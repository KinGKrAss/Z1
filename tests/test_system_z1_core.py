import asyncio
import tempfile
import unittest

from core.system_z1_core import Event, ModuleHealth, SystemZ1Core, Z1Config


class DemoModule:
    name = "gaia"
    version = "1.0.0"

    async def health(self):
        return ModuleHealth(self.name, "online", self.version, detail="ok")


class FailingModule:
    name = "fortuna"
    version = "1.0.0"

    async def health(self):
        raise RuntimeError("simulated failure")


class SystemZ1CoreTests(unittest.IsolatedAsyncioTestCase):
    async def test_lifecycle_and_status(self):
        with tempfile.TemporaryDirectory() as tmp:
            config = Z1Config(audit_path=f"{tmp}/audit.jsonl")
            core = SystemZ1Core(config)
            self.assertFalse(core.status()["started"])
            await core.start()
            self.assertTrue(core.status()["started"])
            await core.stop()
            self.assertFalse(core.status()["started"])

    async def test_module_registration_and_health(self):
        with tempfile.TemporaryDirectory() as tmp:
            core = SystemZ1Core(Z1Config(audit_path=f"{tmp}/audit.jsonl"))
            core.register_module(DemoModule())
            await core.start()
            health = await core.health()
            self.assertEqual(health["status"], "online")
            self.assertEqual(health["modules"][0]["name"], "gaia")

    async def test_failed_module_isolated(self):
        with tempfile.TemporaryDirectory() as tmp:
            core = SystemZ1Core(Z1Config(audit_path=f"{tmp}/audit.jsonl"))
            core.register_module(DemoModule())
            core.register_module(FailingModule())
            await core.start()
            health = await core.health()
            self.assertEqual(health["status"], "degraded")
            fortuna = next(item for item in health["modules"] if item["name"] == "fortuna")
            self.assertEqual(fortuna["status"], "offline")

    async def test_event_bus(self):
        with tempfile.TemporaryDirectory() as tmp:
            core = SystemZ1Core(Z1Config(audit_path=f"{tmp}/audit.jsonl"))
            received = []

            async def handler(event: Event):
                received.append(event.payload["value"])

            core.events.subscribe("test.event", handler)
            await core.start()
            await core.dispatch("test.event", {"value": 42})
            self.assertEqual(received, [42])
            self.assertEqual(core.events.history()[-1].type, "test.event")


if __name__ == "__main__":
    unittest.main()
