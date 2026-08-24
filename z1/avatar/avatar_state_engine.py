from __future__ import annotations

import time

from .animation_engine import AnimationEngine
from .schemas import AvatarFrame
from .viseme_engine import VisemeEngine


class AvatarStateEngine:
    def __init__(self) -> None:
        self.animation = AnimationEngine()
        self.visemes = VisemeEngine()
        self.is_speaking = False
        self._audio_chunk: bytes | None = None

    def set_audio_chunk(self, audio_chunk: bytes | None) -> None:
        self._audio_chunk = audio_chunk
        self.is_speaking = bool(audio_chunk)

    def frame(self) -> AvatarFrame:
        visemes = self.visemes.calculate(self._audio_chunk if self.is_speaking else None)
        return AvatarFrame(
            timestamp=time.time(),
            transform=self.animation.frame(),
            visemes=visemes,
        )
