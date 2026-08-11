from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.db.models import AuditLog, MemoryConversation, MemoryEntry, MemoryMessage, MemoryVersion, Property, PropertyAddress, PropertyDocument, SourceReference


class PropertyRepository:
    def __init__(self, db: Session): self.db = db
    def list(self, limit=50): return list(self.db.scalars(select(Property).options(selectinload(Property.address), selectinload(Property.units)).order_by(Property.created_at.desc()).limit(limit)))
    def get(self, property_id): return self.db.scalar(select(Property).options(selectinload(Property.address), selectinload(Property.units)).where(Property.id == property_id))
    def search(self, query, limit=50):
        pattern = f"%{query}%"
        stmt = select(Property).options(selectinload(Property.address), selectinload(Property.units)).outerjoin(PropertyAddress, PropertyAddress.property_id == Property.id).where(or_(Property.object_code.ilike(pattern), Property.name.ilike(pattern), PropertyAddress.city.ilike(pattern), PropertyAddress.street.ilike(pattern))).order_by(Property.created_at.desc()).limit(limit)
        return list(self.db.scalars(stmt).unique())
    def create(self, data):
        address = data.pop("address", None); obj = Property(**data)
        if address: obj.address = PropertyAddress(**address)
        self.db.add(obj); self.db.flush(); return obj


class MemoryRepository:
    def __init__(self, db: Session): self.db = db
    def create(self, data, sources=None):
        obj = MemoryEntry(**data)
        for source in sources or []: obj.sources.append(SourceReference(**source))
        self.db.add(obj); self.db.flush(); return obj
    def search(self, query, limit=20):
        pattern = f"%{query}%"
        stmt = select(MemoryEntry).options(selectinload(MemoryEntry.sources)).where(or_(MemoryEntry.title.ilike(pattern), MemoryEntry.content.ilike(pattern), MemoryEntry.category.ilike(pattern))).order_by(MemoryEntry.priority.desc(), MemoryEntry.updated_at.desc()).limit(limit)
        return list(self.db.scalars(stmt).unique())
    def get(self, memory_id): return self.db.scalar(select(MemoryEntry).options(selectinload(MemoryEntry.sources)).where(MemoryEntry.id == memory_id))
    def current_by_key(self, memory_key): return self.db.scalar(select(MemoryEntry).where(MemoryEntry.memory_key == memory_key, MemoryEntry.is_current.is_(True)))
    def next_version(self, memory_key):
        value = self.db.scalar(select(func.coalesce(func.max(MemoryEntry.version), 0) + 1).where(MemoryEntry.memory_key == memory_key))
        return int(value or 1)
    def add_version(self, data): obj = MemoryVersion(**data); self.db.add(obj); self.db.flush(); return obj
    def create_conversation(self, external_id, title, source, started_at=None, ended_at=None):
        existing = self.db.scalar(select(MemoryConversation).where(MemoryConversation.conversation_external_id == external_id))
        if existing: return existing
        obj = MemoryConversation(conversation_external_id=external_id, title=title, source=source, started_at=started_at, ended_at=ended_at); self.db.add(obj); self.db.flush(); return obj
    def add_message(self, conversation_id, role, content, external_message_id=None, message_timestamp=None, metadata=None):
        obj = MemoryMessage(conversation_id=conversation_id, role=role, content=content, external_message_id=external_message_id, message_timestamp=message_timestamp, metadata_json=metadata or {}); self.db.add(obj); self.db.flush(); return obj
    def conversation_messages(self, conversation_id, limit=100):
        return list(self.db.scalars(select(MemoryMessage).where(MemoryMessage.conversation_id == conversation_id).order_by(MemoryMessage.message_timestamp.asc().nulls_last(), MemoryMessage.id.asc()).limit(limit)))


class DocumentRepository:
    def __init__(self, db): self.db = db
    def list_for_property(self, property_id, limit=100): return list(self.db.scalars(select(PropertyDocument).where(PropertyDocument.property_id == property_id).order_by(PropertyDocument.created_at.desc()).limit(limit)))
    def create(self, data): obj = PropertyDocument(**data); self.db.add(obj); self.db.flush(); return obj


class AuditRepository:
    def __init__(self, db): self.db = db
    def record(self, action, entity_type, entity_id, before, after, user_id=None):
        obj = AuditLog(action=action, entity_type=entity_type, entity_id=entity_id, before_data=before, after_data=after, user_id=user_id); self.db.add(obj); self.db.flush(); return obj
