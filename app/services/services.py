from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.models import MemoryEntry
from app.db.repositories import AuditRepository, DocumentRepository, MemoryRepository, PropertyRepository


class PropertyService:
    def __init__(self, db: Session): self.db = db; self.repo = PropertyRepository(db); self.audit = AuditRepository(db)
    def list_properties(self, limit=50): return [self._serialize(p) for p in self.repo.list(limit)]
    def search(self, query, limit=50): return [self._serialize(p) for p in self.repo.search(query, limit)]
    def get(self, property_id):
        obj = self.repo.get(property_id); return self._serialize(obj) if obj else None
    def create(self, data, user_id=None):
        obj = self.repo.create(dict(data)); result = self._serialize(obj)
        self.audit.record("create", "property", str(obj.id), None, result, user_id); self.db.commit(); self.db.refresh(obj); return result
    @staticmethod
    def _serialize(obj):
        return {"id": str(obj.id), "object_code": obj.object_code, "name": obj.name, "status": obj.status,
                "address": ({"street": obj.address.street, "house_number": obj.address.house_number, "postal_code": obj.address.postal_code, "city": obj.address.city, "country": obj.address.country, "latitude": obj.address.latitude, "longitude": obj.address.longitude} if obj.address else None),
                "units": [{"id": str(u.id), "unit_code": u.unit_code, "area_m2": float(u.area_m2) if u.area_m2 is not None else None, "status": u.status} for u in obj.units]}


class MemoryService:
    """Z1 Memory Core service: durable memories, provenance, versions and chat ingestion."""
    MEMORY_TYPES = {"ORIGINAL", "REKONSTRUKTION", "INTERPRETATION", "AKTUELLE_DEFINITION", "BENUTZERBESTÄTIGT", "fact"}

    def __init__(self, db: Session): self.db = db; self.repo = MemoryRepository(db); self.audit = AuditRepository(db)

    def save(self, title, content, memory_type="fact", confidence=1.0, sources=None, category="general", priority=5, memory_key=None, user_id=None):
        if not title.strip() or not content.strip(): raise ValueError("title and content are required")
        memory_key = memory_key or self._make_key(title)
        current = self.repo.current_by_key(memory_key)
        version = self.repo.next_version(memory_key)
        if current: current.is_current = False
        obj = self.repo.create({"title": title, "content": content, "memory_type": memory_type, "confidence": confidence, "memory_key": memory_key, "version": version, "is_current": True, "category": category, "priority": priority}, sources)
        self.repo.add_version({"memory_id": obj.id, "memory_key": memory_key, "version": version, "title": title, "content": content, "memory_type": memory_type, "category": category, "confidence": confidence, "priority": priority, "change_reason": "new memory" if version == 1 else "updated memory"})
        result = self._serialize(obj); self.audit.record("create" if version == 1 else "version", "memory", str(obj.id), None, result, user_id); self.db.commit(); return result

    def ingest_conversation(self, conversation_id, title, messages, source="chat_import", user_id=None):
        conv = self.repo.create_conversation(conversation_id, title, source)
        imported = 0
        for message in messages:
            content = str(message.get("content", "")).strip()
            if not content: continue
            self.repo.add_message(conv.id, str(message.get("role", "unknown")), content, message.get("id"), self._parse_ts(message.get("timestamp")), message.get("metadata"))
            imported += 1
        self.audit.record("import", "memory_conversation", str(conv.id), None, {"messages": imported, "external_id": conversation_id}, user_id)
        self.db.commit()
        return {"conversation_id": str(conv.id), "external_id": conversation_id, "messages_imported": imported}

    def search(self, query, limit=20): return [self._serialize(m) for m in self.repo.search(query, limit)]
    def get(self, memory_id):
        obj = self.repo.get(memory_id); return self._serialize(obj) if obj else None

    def context(self, topic, limit=20):
        memories = self.search(topic, limit)
        return {"topic": topic, "memory_count": len(memories), "memories": memories, "rules": ["Original sources are never replaced by reconstructions.", "Reconstructed information must be labelled as reconstruction.", "Every durable memory should have provenance when a source is available."]}

    @staticmethod
    def _make_key(title):
        slug = "-".join("".join(c.lower() if c.isalnum() else " " for c in title).split())[:80]
        return f"memory:{slug or 'untitled'}"

    @staticmethod
    def _parse_ts(value):
        if not value: return None
        if isinstance(value, datetime): return value
        try: return datetime.fromisoformat(str(value).replace("Z", "+00:00"))
        except ValueError: return None

    @staticmethod
    def _serialize(obj):
        return {"id": str(obj.id), "memory_key": obj.memory_key, "version": obj.version, "is_current": obj.is_current, "title": obj.title, "content": obj.content, "memory_type": obj.memory_type, "category": obj.category, "priority": obj.priority, "confidence": float(obj.confidence), "sources": [{"type": s.source_type, "id": s.source_id, "text": s.source_text, "provenance_type": s.provenance_type, "confidence": float(s.confidence)} for s in obj.sources]}


class DocumentService:
    def __init__(self, db): self.db = db; self.repo = DocumentRepository(db); self.audit = AuditRepository(db)
    def list(self, property_id, limit=100): return [self._serialize(d) for d in self.repo.list_for_property(property_id, limit)]
    def save(self, property_id, data, user_id=None):
        data = dict(data); data["property_id"] = property_id; obj = self.repo.create(data); result = self._serialize(obj); self.audit.record("create", "property_document", str(obj.id), None, result, user_id); self.db.commit(); return result
    @staticmethod
    def _serialize(obj): return {"id": str(obj.id), "property_id": str(obj.property_id), "drive_file_id": obj.drive_file_id, "name": obj.name, "mime_type": obj.mime_type, "version": obj.version}
