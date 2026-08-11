from __future__ import annotations

import re
from dataclasses import dataclass
from datetime import datetime, timezone
from typing import Any, Iterable
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import MemoryEntry, SourceReference


@dataclass(frozen=True)
class MessageInput:
    role: str
    content: str
    external_id: str | None = None
    occurred_at: datetime | None = None
    metadata: dict[str, Any] | None = None


class MemoryCoreService:
    """Cloud-backed short-term -> long-term memory pipeline.

    Raw conversations/messages are never replaced by summaries. Promotion creates
    a durable MemoryEntry with explicit provenance back to the original message.
    """

    def __init__(self, db: Session):
        self.db = db

    def ingest_conversation(
        self,
        title: str | None,
        messages: Iterable[MessageInput],
        source: str = "manual",
        external_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        conversation = self._find_or_create_conversation(title, source, external_id, metadata)
        inserted = []
        from app.db.models import MemoryConversation, MemoryMessage, MemoryBuffer

        for item in messages:
            if not item.content.strip():
                continue
            occurred = item.occurred_at or datetime.now(timezone.utc)
            message = None
            if item.external_id:
                message = self.db.scalar(
                    select(MemoryMessage).where(
                        MemoryMessage.conversation_id == conversation.id,
                        MemoryMessage.external_id == item.external_id,
                    )
                )
            if message is None:
                message = MemoryMessage(
                    conversation_id=conversation.id,
                    external_id=item.external_id,
                    role=item.role,
                    content=item.content,
                    occurred_at=occurred,
                    metadata=item.metadata or {},
                )
                self.db.add(message)
                self.db.flush()
                score = self._importance_score(item.content)
                self.db.add(MemoryBuffer(conversation_id=conversation.id, message_id=message.id, score=score))
                inserted.append(message.id)

            conversation.last_message_at = max(conversation.last_message_at or occurred, occurred)

        self.db.commit()
        return {
            "conversation_id": str(conversation.id),
            "messages_ingested": len(inserted),
            "status": "short_term_buffered",
        }

    def promote(self, message_ids: list[UUID] | None = None, min_score: float = 0.70, limit: int = 100) -> dict[str, Any]:
        from app.db.models import MemoryBuffer, MemoryMessage

        stmt = (
            select(MemoryBuffer, MemoryMessage)
            .join(MemoryMessage, MemoryMessage.id == MemoryBuffer.message_id)
            .where(MemoryBuffer.status == "short_term", MemoryBuffer.score >= min_score)
            .order_by(MemoryBuffer.score.desc(), MemoryBuffer.created_at.asc())
            .limit(limit)
        )
        if message_ids:
            stmt = stmt.where(MemoryBuffer.message_id.in_(message_ids))

        rows = list(self.db.execute(stmt).all())
        promoted = []
        for buffer, message in rows:
            title = self._memory_title(message.content)
            memory = MemoryEntry(
                title=title,
                content=message.content,
                memory_type=self._memory_type(message.content),
                confidence=min(1.0, max(0.0, float(buffer.score))),
                status="active",
                origin="conversation_promotion",
            )
            memory.sources.append(
                SourceReference(
                    source_type="conversation_message",
                    source_id=str(message.id),
                    source_text=message.content,
                    provenance_type="original",
                    confidence=float(buffer.score),
                )
            )
            self.db.add(memory)
            self.db.flush()
            buffer.status = "promoted"
            buffer.promoted_at = datetime.now(timezone.utc)
            promoted.append(str(memory.id))

        self.db.commit()
        return {"promoted": len(promoted), "memory_ids": promoted}

    def build_context(self, query: str, limit: int = 20) -> dict[str, Any]:
        pattern = f"%{query.strip()}%"
        memories = list(
            self.db.scalars(
                select(MemoryEntry)
                .where(MemoryEntry.status == "active")
                .where((MemoryEntry.title.ilike(pattern)) | (MemoryEntry.content.ilike(pattern)))
                .order_by(MemoryEntry.confidence.desc(), MemoryEntry.updated_at.desc())
                .limit(limit)
            )
        )
        return {
            "query": query,
            "memories": [
                {
                    "id": str(m.id),
                    "title": m.title,
                    "content": m.content,
                    "memory_type": m.memory_type,
                    "confidence": float(m.confidence),
                    "origin": m.origin,
                    "status": m.status,
                }
                for m in memories
            ],
        }

    def _find_or_create_conversation(self, title, source, external_id, metadata):
        from app.db.models import MemoryConversation
        if external_id:
            existing = self.db.scalar(
                select(MemoryConversation).where(
                    MemoryConversation.source == source,
                    MemoryConversation.external_id == external_id,
                )
            )
            if existing:
                return existing
        conversation = MemoryConversation(
            title=title,
            source=source,
            external_id=external_id,
            metadata=metadata or {},
        )
        self.db.add(conversation)
        self.db.flush()
        return conversation

    @staticmethod
    def _importance_score(text: str) -> float:
        normalized = text.lower()
        score = 0.35
        markers = [
            "merk dir", "erinner", "dauerhaft", "wichtig", "entscheidung",
            "prinzip", "projekt", "vereinbart", "beschlossen", "nicht vergessen",
        ]
        score += min(0.45, sum(0.10 for marker in markers if marker in normalized))
        if len(text) > 300:
            score += 0.05
        if any(ch.isdigit() for ch in text):
            score += 0.05
        return round(min(score, 1.0), 5)

    @staticmethod
    def _memory_type(text: str) -> str:
        t = text.lower()
        if any(x in t for x in ("entscheidung", "beschlossen", "vereinbart")):
            return "decision"
        if any(x in t for x in ("prinzip", "grundsatz", "regel")):
            return "principle"
        if any(x in t for x in ("projekt", "roadmap", "phase")):
            return "project"
        return "fact"

    @staticmethod
    def _memory_title(text: str) -> str:
        first = re.sub(r"\s+", " ", text.strip()).split("\n", 1)[0]
        return (first[:117] + "...") if len(first) > 120 else first
