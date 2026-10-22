from __future__ import annotations

import math
import time

from .schemas import TransformState


class AnimationEngine:
    """Generate smooth, repeatable movement channels for the avatar renderer."""

    def __init__(
        self,
        *,
        breath_period: float = 4.2,
        blink_interval: float = 4.6,
        blink_duration: float = 0.18,
        staff_glow_period: float = 3.4,
    ) -> None:
        if breath_period <= 0 or blink_interval <= 0 or staff_glow_period <= 0:
            raise ValueError("animation periods must be positive")
        if blink_duration <= 0 or blink_duration > blink_interval:
            raise ValueError("blink_duration must be positive and no longer than blink_interval")
        self.breath_period = breath_period
        self.blink_interval = blink_interval
        self.blink_duration = blink_duration
        self.staff_glow_period = staff_glow_period

    def frame(self, now: float | None = None) -> TransformState:
        """Return normalized animation values; now makes frames testable."""
        t = time.monotonic() if now is None else now

        breath = (1.0 - math.cos(2.0 * math.pi * t / self.breath_period)) / 2.0

        blink_phase = t % self.blink_interval
        if blink_phase < self.blink_duration:
            blink = (1.0 - math.cos(math.pi * blink_phase / self.blink_duration)) / 2.0
        else:
            blink = 0.0

        glow_phase = (1.0 - math.cos(2.0 * math.pi * t / self.staff_glow_period)) / 2.0
        staff_tip_glow = 0.15 + 0.85 * glow_phase

        return TransformState(
            breath_chest=round(breath, 3),
            eye_blink_left=round(blink, 3),
            eye_blink_right=round(blink, 3),
            staff_tip_glow=round(staff_tip_glow, 3),
        )
