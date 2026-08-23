import unittest

from core.ai_communication import AICommunicationLayer, AIMessage, AIResponse


class FakeAdapter:
    def __init__(self, provider_id):
        self.provider_id = provider_id

    async def health(self):
        return True

    async def send(self, message):
        return AIResponse(self.provider_id, message.message_id, "ok", {"echo": message.task})


class AICommunicationTests(unittest.IsolatedAsyncioTestCase):
    async def test_routes_and_audits_read_request(self):
        layer = AICommunicationLayer()
        layer.register(FakeAdapter("gemini"))
        response = await layer.send(AIMessage("zoe", "gemini", "cross-check"))
        self.assertEqual(response.status, "ok")
        self.assertEqual(layer.providers(), ("gemini",))
        self.assertEqual(len(layer.audit()), 1)

    async def test_external_write_is_blocked(self):
        layer = AICommunicationLayer()
        layer.register(FakeAdapter("perplexity"))
        with self.assertRaises(PermissionError):
            await layer.send(AIMessage("z1", "perplexity", "write state", authorization="write"))

    async def test_unknown_provider_is_rejected(self):
        layer = AICommunicationLayer()
        with self.assertRaises(KeyError):
            await layer.send(AIMessage("zoe", "siri", "hello"))


if __name__ == "__main__":
    unittest.main()
