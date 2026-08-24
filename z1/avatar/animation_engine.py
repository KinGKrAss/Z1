from __future__ import annotations

import math
import random
import time

from .schemas import TransformState


class AnimationEngine:
    def __init__(self, blink_probability: float = 0.03) -> None:
        self.blink_probability = blink_probability

    def frame(self) -> TransformState:
        t = time.monotonic()
        breath = (math.sin(t * 1.5) + 1.0) / 2.0
        blink = 1.0 if random.random() < self.blink_probability else 0.0
        return TransformState(
            breath_chest=round(breath, 3),
            eye_blink_left=blink,
            eye_blink_right=blink,
        )
