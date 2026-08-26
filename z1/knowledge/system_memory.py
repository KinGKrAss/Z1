"""Unified Z1 knowledge facade: Meta-Wiki + memory + curiosity."""
from __future__ import annotations

from typing import Any, Dict

from .curiosity import CuriosityEngine
from .memory_chorus import MemoryChorus
from .meta_wiki import KnowledgeEntry, MetaWiki, VerificationStatus


class SystemZ1Memory:
    def __init__(self) -> None:
        self.meta_wiki = MetaWiki()
        self.memory_chorus = MemoryChorus()
        self.curiosity = CuriosityEngine()
        self.meta_wiki.seed_core_knowledge()

    def add_knowledge(self, entry: KnowledgeEntry) -> None:
        self.meta_wiki.add(entry)

    def remember(self, content: str, context: str) -> None:
        self.memory_chorus.imprint(content, context)

    def wonder(
        self,
        question: str,
        reason: str,
        *,
        priority: float = 0.5,
        domain: str = "general",
        agent: str = "Z1",
    ) -> Dict[str, Any]:
        """Record an inspectable curiosity signal for an authorized orchestrator."""
        signal = self.curiosity.wonder(
            question,
            reason,
            priority=priority,
            domain=domain,
            agent=agent,
        )
        return {
            "agent": signal.agent,
            "question": signal.question,
            "reason": signal.reason,
            "priority": signal.priority,
            "domain": signal.domain,
            "created_at": signal.created_at,
        }

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
            "curiosity": self.curiosity.pending(domain=term),
        }

    def curiosity_snapshot(self) -> Dict[str, object]:
        return self.curiosity.snapshot()


__all__ = ["KnowledgeEntry", "SystemZ1Memory", "VerificationStatus"]
