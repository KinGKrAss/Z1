from typing import Any
from pydantic import BaseModel, Field


class PropertyAddressInput(BaseModel):
    street: str | None = None
    house_number: str | None = None
    postal_code: str | None = None
    city: str | None = None
    country: str = "DE"
    latitude: float | None = None
    longitude: float | None = None


class PropertyCreate(BaseModel):
    object_code: str
    name: str | None = None
    status: str = "active"
    address: PropertyAddressInput | None = None


class MemoryCreate(BaseModel):
    title: str
    content: str
    memory_type: str = "fact"
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    sources: list[dict[str, Any]] = Field(default_factory=list)


class DocumentCreate(BaseModel):
    name: str
    drive_file_id: str | None = None
    mime_type: str | None = None
    version: str | None = None
