from __future__ import annotations

from dataclasses import asdict, dataclass
import json


def _validate_range(name: str, value: float, *, minimum: float, maximum: float) -> None:
    if not minimum <= value <= maximum:
        raise ValueError(f"{name} must be between {minimum} and {maximum}")


class SchemaModel:
    def model_dump(self) -> dict:
        return asdict(self)

    def model_dump_json(self) -> str:
        return json.dumps(self.model_dump())


@dataclass
class TransformState(SchemaModel):
    breath_chest: float
    eye_blink_left: float
    eye_blink_right: float

    def __post_init__(self) -> None:
        _validate_range("breath_chest", self.breath_chest, minimum=0.0, maximum=1.0)
        _validate_range("eye_blink_left", self.eye_blink_left, minimum=0.0, maximum=1.0)
        _validate_range("eye_blink_right", self.eye_blink_right, minimum=0.0, maximum=1.0)


@dataclass
class VisemeState(SchemaModel):
    AA: float = 0.0
    O: float = 0.0
    EE: float = 0.0

    def __post_init__(self) -> None:
        _validate_range("AA", self.AA, minimum=0.0, maximum=1.0)
        _validate_range("O", self.O, minimum=0.0, maximum=1.0)
        _validate_range("EE", self.EE, minimum=0.0, maximum=1.0)


@dataclass
class AvatarFrame(SchemaModel):
    timestamp: float
    transform: TransformState
    visemes: VisemeState
    type: str = "avatar_frame"


@dataclass
class AudioMessage(SchemaModel):
    pcm_s16le_base64: str
    type: str = "tts_audio"
    sample_rate: int = 24000
    channels: int = 1

    def __post_init__(self) -> None:
        _validate_range("sample_rate", float(self.sample_rate), minimum=8000, maximum=96000)
        _validate_range("channels", float(self.channels), minimum=1, maximum=2)


@dataclass
class AvatarCommand(SchemaModel):
    type: str
    is_speaking: bool | None = None
