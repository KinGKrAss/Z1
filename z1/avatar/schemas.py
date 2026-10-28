from __future__ import annotations

import json
from dataclasses import asdict, dataclass, field


class _Model:
    """Pydantic-compatible serialization helpers without the dependency."""

    def model_dump(self) -> dict:
        return asdict(self)

    def model_dump_json(self) -> str:
        return json.dumps(self.model_dump())


def _check(name: str, value: float, low: float, high: float) -> None:
    if not low <= value <= high:
        raise ValueError(f"{name} must be between {low} and {high}, got {value}")


@dataclass
class TransformState(_Model):
    breath_chest: float
    eye_blink_left: float
    eye_blink_right: float

    def __post_init__(self) -> None:
        for name in ("breath_chest", "eye_blink_left", "eye_blink_right"):
            _check(name, getattr(self, name), 0.0, 1.0)


@dataclass
class VisemeState(_Model):
    AA: float = 0.0
    O: float = 0.0
    EE: float = 0.0

    def __post_init__(self) -> None:
        for name in ("AA", "O", "EE"):
            _check(name, getattr(self, name), 0.0, 1.0)


@dataclass
class AvatarFrame(_Model):
    timestamp: float
    transform: TransformState
    visemes: VisemeState
    type: str = "avatar_frame"


@dataclass
class AudioMessage(_Model):
    pcm_s16le_base64: str
    type: str = "tts_audio"
    sample_rate: int = 24000
    channels: int = 1

    def __post_init__(self) -> None:
        _check("sample_rate", self.sample_rate, 8000, 96000)
        _check("channels", self.channels, 1, 2)


@dataclass
class AvatarCommand(_Model):
    type: str
    is_speaking: bool | None = None
