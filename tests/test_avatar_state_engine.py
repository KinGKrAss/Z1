import unittest

from z1.avatar.animation_engine import AnimationEngine
from z1.avatar.avatar_state_engine import AvatarStateEngine
from z1.avatar.schemas import AvatarFrame


class AvatarStateEngineTests(unittest.TestCase):
    def test_frame_has_valid_animation_state(self):
        engine = AvatarStateEngine()
        frame = engine.frame()
        self.assertIsInstance(frame, AvatarFrame)
        self.assertGreaterEqual(frame.transform.breath_chest, 0.0)
        self.assertLessEqual(frame.transform.breath_chest, 1.0)
        self.assertGreaterEqual(frame.transform.staff_tip_glow, 0.0)
        self.assertLessEqual(frame.transform.staff_tip_glow, 1.0)
        self.assertEqual(frame.visemes.AA, 0.0)

    def test_animation_cycles_are_smooth_and_deterministic(self):
        engine = AnimationEngine(
            breath_period=4.0,
            blink_interval=4.0,
            blink_duration=0.2,
            staff_glow_period=4.0,
        )

        start = engine.frame(now=0.0)
        inhale_peak = engine.frame(now=2.0)
        blink_peak = engine.frame(now=0.1)
        blink_end = engine.frame(now=0.2)

        self.assertEqual(start.breath_chest, 0.0)
        self.assertEqual(inhale_peak.breath_chest, 1.0)
        self.assertEqual(blink_peak.eye_blink_left, 1.0)
        self.assertEqual(blink_peak.eye_blink_right, 1.0)
        self.assertEqual(blink_end.eye_blink_left, 0.0)
        self.assertAlmostEqual(start.staff_tip_glow, 0.15)
        self.assertEqual(inhale_peak.staff_tip_glow, 1.0)

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
