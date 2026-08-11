from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import or_, select, text
from sqlalchemy.orm import Session, selectinload

from app.db.models import (
    AuditLog, MemoryConversation, MemoryEntry, MemoryMessage, MemoryVersion,
    Property, PropertyAddress, PropertyDocument, SourceReference,
)


class PropertyRepository:
    def __init__(self, db: Session): self.db = db

    def list(self, limit: int = 50) -> list[Property]:
        stmt = select(Property).options(selectinload(Property.address), selectinload(Property.units)).order_by(Property.created_at.desc()).limit(limit)
        return list(self.db.scalars(stmt))

    def get(self, property_id: UUID) -> Property | None:
        stmt = select(Property).options(selectinload(Property.address), selectinload(Property.units)).where(Property.id == property_id)
        return self.db.scalar(stmt)

    def search(self, query: str, limit: int = 50) -> list[Property]:
        pattern = f"%{query}%"
        stmt = (select(Property).options(selectinload(Property.address), selectinload(Property.units))
                .outerjoin(PropertyAddress, PropertyAddress.property_id == Property.id)
                .where(or_(Property.object_code.ilike(pattern), Property.name.ilike(pattern), PropertyAddress.city.ilike(pattern), PropertyAddress.street.ilike(pattern)))
                .order_by(Property.created_at.desc()).limit(limit))
        return list(self.db.scalars(stmt).unique())

    def create(self, data: dict[str, Any]) -> Property:
        address = data.pop("address", None)
        obj = Property(**data)
        if address: obj.address = PropertyAddress(**address)
        self.db.add(obj); self.db.flush(); return obj


class MemoryRepository:
    def __init__(self, db: Session): self.db = db

    def create(self, data: dict[str, Any], sources: list[dict[str, Any]] | None = None) -> MemoryEntry:
        obj = MemoryEntry(**data)
        for source in sources or []: obj.sources.append(SourceReference(**source))
        self.db.add(obj); self.db.flush(); return obj

    def search(self, query: str, limit: int = 20) -> list[MemoryEntry]:
        pattern = f"%{query}%"
        stmt = select(MemoryEntry).options(selectinload(MemoryEntry.sources)).where(
            or_(MemoryEntry.title.ilike(pattern), MemoryEntry.content.ilike(pattern), MemoryEntry.category.ilike(pattern))
        ).order_by(MemoryEntry.priority.desc(), MemoryEntry.updated_at.desc()).limit(limit)
        return list(self.db.scalars(stmt).unique())

    def get(self, memory_id: UUID) -> MemoryEntry | None:
        return self.db.scalar(select(MemoryEntry).options(selectinload(MemoryEntry.sources)).where(MemoryEntry.id == memory_id))

    def current_by_key(self, memory_key: str) -> MemoryEntry | None:
        return self.db.scalar(select(MemoryEntry).where(MemoryEntry.memory_key == memory_key, MemoryEntry.is_current.is_(True)))

    def next_version(self, memory_key: str) -> int:
        value = self.db.scalar(select(text("COALESCE(MAX(version), 0) + 1")).select_from(MemoryEntry).where(MemoryEntry.memory_key == memory_key))
        return int(value or 1)

    def add_version(self, data: dict[str, Any]) -> MemoryVersion:
        obj = MemoryVersion(**data); self.db.add(obj); self.db.flush(); return obj

    def create_conversation(self, external_id: str, title: str | None, source: str, started_at=None, ended_at=None) -> MemoryConversation:
        existing = self.db.scalar(select(MemoryConversation).where(MemoryConversation.conversation_external_id == external_id))
        if existing: return existing
        obj = MemoryConversation(conversation_external_id=external_id, title=title, source=source, started_at=started_at, ended_at=ended_at)
        self.db.add(obj); self.db.flush(); return obj

    def add_message(self, conversation_id: UUID, role: str, content: str, external_message_id: str | None = None, message_timestamp=None, metadata: dict[str, Any] | None = None) -> MemoryMessage:
        obj = MemoryMessage(conversation_id=conversation_id, role=role, content=content, external_message_id=external_message_id, message_timestamp=message_timestamp, metadata_json=metadata or {})
        self.db.add(obj); self.db.flush(); return obj

    def conversation_messages(self, conversation_id: UUID, limit: int = 100) -> list[MemoryMessage]:
        stmt = select(MemoryMessage).where(MemoryMessage.conversation_id == conversation_id).order_by(MemoryMessage.message_timestamp.asc().nulls_last(), MemoryMessage.id.asc()).limit(limit)
        return list(self.db.scalars(stmt))


class DocumentRepository:
    def __init__(self, db: Session): self.db = db
    def list_for_property(self, property_id: UUID, limit: int = 100) -> list[PropertyDocument]:
        return list(self.db.scalars(select(PropertyDocument).where(PropertyDocument.property_id == property_id).order_by(PropertyDocument.created_at.desc()).limit(limit)))
    def create(self, data: dict[str, Any]) -> PropertyDocument:
        obj = PropertyDocument(**data); self.db.add(obj); self.db.flush(); return obj


class AuditRepository:
    def __init__(self, db: Session): self.db = db
    def record(self, action: str, entity_type: str, entity_id: str | None, before: dict | None, after: dict | None, user_id: UUID | None = None) -> AuditLog:
        obj = AuditLog(action=action, entity_type=entity_type, entity_id=entity_id, before_data=before, after_data=after, user_id=user_id)
        self.db.add(obj); self.db.flush(); return obj
