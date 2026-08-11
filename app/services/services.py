from __future__ import annotations

from typing import Any
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.repositories import AuditRepository, DocumentRepository, MemoryRepository, PropertyRepository


class PropertyService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = PropertyRepository(db)
        self.audit = AuditRepository(db)

    def list_properties(self, limit: int = 50) -> list[dict[str, Any]]:
        return [self._serialize(p) for p in self.repo.list(limit)]

    def search(self, query: str, limit: int = 50) -> list[dict[str, Any]]:
        return [self._serialize(p) for p in self.repo.search(query, limit)]

    def get(self, property_id: UUID) -> dict[str, Any] | None:
        obj = self.repo.get(property_id)
        return self._serialize(obj) if obj else None

    def create(self, data: dict[str, Any], user_id: UUID | None = None) -> dict[str, Any]:
        obj = self.repo.create(dict(data))
        self.audit.record("create", "property", str(obj.id), None, self._serialize(obj), user_id)
        self.db.commit()
        self.db.refresh(obj)
        return self._serialize(obj)

    @staticmethod
    def _serialize(obj) -> dict[str, Any]:
        if obj is None:
            return {}
        return {
            "id": str(obj.id), "object_code": obj.object_code, "name": obj.name, "status": obj.status,
            "address": ({"street": obj.address.street, "house_number": obj.address.house_number, "postal_code": obj.address.postal_code, "city": obj.address.city, "country": obj.address.country, "latitude": obj.address.latitude, "longitude": obj.address.longitude} if obj.address else None),
            "units": [{"id": str(u.id), "unit_code": u.unit_code, "area_m2": float(u.area_m2) if u.area_m2 is not None else None, "status": u.status} for u in obj.units],
        }


class MemoryService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = MemoryRepository(db)
        self.audit = AuditRepository(db)

    def save(self, title: str, content: str, memory_type: str = "fact", confidence: float = 1.0, sources: list[dict[str, Any]] | None = None, user_id: UUID | None = None) -> dict[str, Any]:
        obj = self.repo.create({"title": title, "content": content, "memory_type": memory_type, "confidence": confidence}, sources)
        self.audit.record("create", "memory", str(obj.id), None, self._serialize(obj), user_id)
        self.db.commit()
        return self._serialize(obj)

    def search(self, query: str, limit: int = 20) -> list[dict[str, Any]]:
        return [self._serialize(m) for m in self.repo.search(query, limit)]

    def get(self, memory_id: UUID) -> dict[str, Any] | None:
        obj = self.repo.get(memory_id)
        return self._serialize(obj) if obj else None

    @staticmethod
    def _serialize(obj) -> dict[str, Any]:
        return {"id": str(obj.id), "title": obj.title, "content": obj.content, "memory_type": obj.memory_type, "confidence": float(obj.confidence), "sources": [{"type": s.source_type, "id": s.source_id, "text": s.source_text} for s in obj.sources]}


class DocumentService:
    def __init__(self, db: Session):
        self.db = db
        self.repo = DocumentRepository(db)
        self.audit = AuditRepository(db)

    def list(self, property_id: UUID, limit: int = 100) -> list[dict[str, Any]]:
        return [self._serialize(d) for d in self.repo.list_for_property(property_id, limit)]

    def save(self, property_id: UUID, data: dict[str, Any], user_id: UUID | None = None) -> dict[str, Any]:
        data = dict(data)
        data["property_id"] = property_id
        obj = self.repo.create(data)
        result = self._serialize(obj)
        self.audit.record("create", "property_document", str(obj.id), None, result, user_id)
        self.db.commit()
        return result

    @staticmethod
    def _serialize(obj) -> dict[str, Any]:
        return {"id": str(obj.id), "property_id": str(obj.property_id), "drive_file_id": obj.drive_file_id, "name": obj.name, "mime_type": obj.mime_type, "version": obj.version}
