import asyncio
import unittest

from server_bridge import Z1GoddessService


class GoddessAgentTests(unittest.TestCase):
    def test_all_33_goddesses_boot_and_dispatch(self):
        async def run():
            service = Z1GoddessService()
            status = await service.handle_api_status_request()
            self.assertEqual(status["active_goddesses_count"], 33)
            self.assertTrue(all(a["status"] == "active" for a in status["agents"]))
            result = await service.handle_dispatch_request("nyx", "SCAN", {"x": 1})
            self.assertEqual(result["agent_id"], "nyx")
            self.assertEqual(result["payload_echo"], {"x": 1})
            self.assertEqual(service.registry.get_agent("nyx").active_tasks, [])
            with self.assertRaises(ValueError):
                await service.handle_dispatch_request("unknown", "SCAN", {})

        asyncio.run(run())


if __name__ == "__main__":
    unittest.main()
