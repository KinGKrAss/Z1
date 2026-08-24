from __future__ import annotations

import math
import struct

from .schemas import VisemeState


class VisemeEngine:
    """Small, dependency-free PCM analyser for realtime avatar mouth motion."""

    def calculate(self, audio_chunk: bytes | None) -> VisemeState:
        if not audio_chunk or len(audio_chunk) < 2:
            return VisemeState()

        sample_count = len(audio_chunk) // 2
        samples = struct.unpack(f"<{sample_count}h", audio_chunk[: sample_count * 2])
        rms = math.sqrt(sum(sample * sample for sample in samples) / sample_count) / 32768.0
        level = min(rms * 4.0, 1.0)

        return VisemeState(
            AA=round(level, 3),
            O=round(min(level * 0.65, 1.0), 3),
            EE=round(min(level * 0.45, 1.0), 3),
        )
