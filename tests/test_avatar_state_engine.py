import unittest

from z1.avatar.avatar_state_engine import AvatarStateEngine
from z1.avatar.schemas import AvatarFrame


class AvatarStateEngineTests(unittest.TestCase):
    def test_frame_has_valid_animation_state(self):
        engine = AvatarStateEngine()
        frame = engine.frame()
        self.assertIsInstance(frame, AvatarFrame)
        self.assertGreaterEqual(frame.transform.breath_chest, 0.0)
        self.assertLessEqual(frame.transform.breath_chest, 1.0)
        self.assertEqual(frame.visemes.AA, 0.0)

    def test_pcm_chunk_drives_visemes(self):
        engine = AvatarStateEngine()
        engine.set_audio_chunk((b"\xff\x7f" * 256))
        frame = engine.frame()
        self.assertGreater(frame.visemes.AA, 0.0)
        self.assertGreater(frame.visemes.O, 0.0)

    def test_stop_speaking_clears_visemes(self):
        engine = AvatarStateEngine()
        engine.set_audio_chunk((b"\xff\x7f" * 256))
        engine.set_audio_chunk(None)
        self.assertEqual(engine.frame().visemes.AA, 0.0)


if __name__ == "__main__":
    unittest.main()
