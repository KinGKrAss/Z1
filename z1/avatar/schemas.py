from __future__ import annotations

from pydantic import BaseModel, Field


class TransformState(BaseModel):
    breath_chest: float = Field(ge=0.0, le=1.0)
    eye_blink_left: float = Field(ge=0.0, le=1.0)
    eye_blink_right: float = Field(ge=0.0, le=1.0)


class VisemeState(BaseModel):
    AA: float = Field(default=0.0, ge=0.0, le=1.0)
    O: float = Field(default=0.0, ge=0.0, le=1.0)
    EE: float = Field(default=0.0, ge=0.0, le=1.0)


class AvatarFrame(BaseModel):
    type: str = "avatar_frame"
    timestamp: float
    transform: TransformState
    visemes: VisemeState


class AudioMessage(BaseModel):
    type: str = "tts_audio"
    sample_rate: int = Field(default=24000, ge=8000, le=96000)
    channels: int = Field(default=1, ge=1, le=2)
    pcm_s16le_base64: str


class AvatarCommand(BaseModel):
    type: str
    is_speaking: bool | None = None
