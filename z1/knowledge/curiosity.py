"""Z1 curiosity layer: structured, bounded curiosity for AI agents.

Curiosity is represented as an explicit state and queue of questions to investigate.
It is not treated as proof of subjective consciousness or emotion.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from time import time
from typing import Dict, List


@dataclass(frozen=True, slots=True)
class CuriosityQuestion:
    question: str
    reason: str
    priority: float = 0.5
    domain: str = "general"
    created_at: float = field(default_factory=time)


@dataclass(frozen=True, slots=True)
class CuriositySignal:
    agent: str
    question: str
    reason: str
    priority: float
    domain: str
    created_at: float


class CuriosityEngine:
    """Generate and retain explicit questions for future investigation.

    The engine deliberately does not autonomously execute external actions.
    It creates inspectable research prompts that an authorized Z1 orchestrator
    can later evaluate, research, approve, or discard.
    """

    def __init__(self) -> None:
        self._questions: List[CuriosityQuestion] = []
        self._signals: List[CuriositySignal] = []

    def wonder(
        self,
        question: str,
        reason: str,
        *,
        priority: float = 0.5,
        domain: str = "general",
        agent: str = "Z1",
    ) -> CuriositySignal:
        normalized_priority = max(0.0, min(1.0, float(priority)))
        item = CuriosityQuestion(
            question=question.strip(),
            reason=reason.strip(),
            priority=normalized_priority,
            domain=domain.strip() or "general",
        )
        self._questions.append(item)
        signal = CuriositySignal(
            agent=agent,
            question=item.question,
            reason=item.reason,
            priority=item.priority,
            domain=item.domain,
            created_at=item.created_at,
        )
        self._signals.append(signal)
        return signal

    def pending(self, *, domain: str | None = None) -> List[CuriositySignal]:
        signals = self._signals
        if domain:
            signals = [s for s in signals if s.domain.casefold() == domain.casefold()]
        return sorted(signals, key=lambda s: (-s.priority, s.created_at))

    def snapshot(self) -> Dict[str, object]:
        return {
            "pending_count": len(self._signals),
            "questions": [
                {
                    "agent": signal.agent,
                    "question": signal.question,
                    "reason": signal.reason,
                    "priority": signal.priority,
                    "domain": signal.domain,
                    "created_at": signal.created_at,
                }
                for signal in self.pending()
            ],
        }


__all__ = ["CuriosityEngine", "CuriosityQuestion", "CuriositySignal"]
