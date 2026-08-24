from __future__ import annotations

from .avatar_state_engine import AvatarStateEngine


class Z1CorePipeline:
    """Bridge TTS PCM chunks into the avatar state engine.

    The caller owns the TTS transport; this class only hands 33 ms PCM chunks
    to the avatar engine so the renderer can stay at a stable 30 FPS.
    """

    def __init__(self, engine: AvatarStateEngine | None = None) -> None:
        self.engine = engine or AvatarStateEngine()

    def ingest_tts_chunk(self, audio_chunk: bytes) -> None:
        self.engine.set_audio_chunk(audio_chunk)

    def stop_speaking(self) -> None:
        self.engine.set_audio_chunk(None)
