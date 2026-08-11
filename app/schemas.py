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


class MemorySourceInput(BaseModel):
    source_type: str
    source_id: str | None = None
    source_text: str | None = None
    conversation_id: str | None = None
    message_id: str | None = None
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    provenance_type: str = "source"


class MemoryCreate(BaseModel):
    title: str
    content: str
    memory_type: str = "fact"
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    category: str = "general"
    priority: int = Field(default=5, ge=0, le=10)
    memory_key: str | None = None
    sources: list[MemorySourceInput] = Field(default_factory=list)


class ConversationMessageInput(BaseModel):
    id: str | None = None
    role: str
    content: str
    timestamp: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)


class ConversationImport(BaseModel):
    conversation_id: str
    title: str | None = None
    source: str = "chat_import"
    messages: list[ConversationMessageInput]


class DocumentCreate(BaseModel):
    name: str
    drive_file_id: str | None = None
    mime_type: str | None = None
    version: str | None = None
