"""Unified Z1 knowledge facade: Meta-Wiki + contextual Memory Chorus."""
from __future__ import annotations

from typing import Any, Dict

from .memory_chorus import MemoryChorus
from .meta_wiki import KnowledgeEntry, MetaWiki, VerificationStatus


class SystemZ1Memory:
    def __init__(self) -> None:
        self.meta_wiki = MetaWiki()
        self.memory_chorus = MemoryChorus()
        self.meta_wiki.seed_core_knowledge()

    def add_knowledge(self, entry: KnowledgeEntry) -> None:
        self.meta_wiki.add(entry)

    def remember(self, content: str, context: str) -> None:
        self.memory_chorus.imprint(content, context)

    def query(self, term: str) -> Dict[str, Any]:
        entry = self.meta_wiki.lookup(term)
        return {
            "knowledge": {
                "term": entry.term,
                "definition": entry.definition,
                "category": entry.category,
                "source": entry.source,
                "period_start": entry.period_start,
                "period_end": entry.period_end,
                "verification_status": entry.verification_status.value,
            } if entry else None,
            "memory_resonances": self.memory_chorus.query(term),
        }


__all__ = ["KnowledgeEntry", "SystemZ1Memory", "VerificationStatus"]
