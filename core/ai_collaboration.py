"""Cross-provider AI collaboration over Z1.

Z1 remains the shared state owner. Providers exchange proposals, evidence and
confirmations through explicit envelopes. No provider can mutate authoritative
state through this layer.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4


READ_ROLES = {"read", "review", "propose"}


@dataclass(frozen=True, slots=True)
class CollaborationMessage:
    sender: str
    recipient: str
    kind: str
    subject: str
    payload: dict[str, Any] = field(default_factory=dict)
    message_id: str = field(default_factory=lambda: str(uuid4()))
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    authorization: str = "read"


@dataclass(frozen=True, slots=True)
class KnowledgeAssertion:
    subject: str
    value: Any
    source: str
    provider: str
    confidence: float = 0.0
    verified: bool = False
    evidence: tuple[str, ...] = ()
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def __post_init__(self) -> None:
        if not self.subject.strip():
            raise ValueError("subject is required")
        if not 0.0 <= self.confidence <= 1.0:
            raise ValueError("confidence must be between 0 and 1")
        if not self.source.strip():
            raise ValueError("source is required")


class AICollaborationBus:
    """In-process collaboration bus with an auditable assertion ledger."""

    def __init__(self) -> None:
        self._providers: set[str] = set()
        self._messages: list[CollaborationMessage] = []
        self._assertions: list[KnowledgeAssertion] = []

    def register_provider(self, provider_id: str) -> None:
        provider_id = provider_id.strip().lower()
        if not provider_id:
            raise ValueError("provider_id is required")
        self._providers.add(provider_id)

    def publish(self, message: CollaborationMessage) -> CollaborationMessage:
        if message.sender.strip().lower() not in self._providers:
            raise KeyError(f"Provider not registered: {message.sender}")
        if message.authorization not in READ_ROLES:
            raise PermissionError("Collaboration bus is read/review/propose only")
        self._messages.append(message)
        return message

    def assert_knowledge(self, assertion: KnowledgeAssertion) -> KnowledgeAssertion:
        if assertion.provider.strip().lower() not in self._providers:
            raise KeyError(f"Provider not registered: {assertion.provider}")
        self._assertions.append(assertion)
        return assertion

    def messages(self, subject: str | None = None) -> tuple[CollaborationMessage, ...]:
        if subject is None:
            return tuple(self._messages)
        return tuple(m for m in self._messages if m.subject == subject)

    def assertions(self, subject: str | None = None) -> tuple[KnowledgeAssertion, ...]:
        if subject is None:
            return tuple(self._assertions)
        return tuple(a for a in self._assertions if a.subject == subject)

    def compare(self, subject: str) -> dict[str, Any]:
        """Compare provider assertions without silently choosing a winner."""
        assertions = self.assertions(subject)
        values: dict[str, list[dict[str, Any]]] = {}
        for assertion in assertions:
            key = repr(assertion.value)
            values.setdefault(key, []).append({
                "provider": assertion.provider,
                "confidence": assertion.confidence,
                "verified": assertion.verified,
                "source": assertion.source,
                "evidence": assertion.evidence,
            })
        return {
            "subject": subject,
            "assertion_count": len(assertions),
            "agreement": len(values) <= 1 and bool(assertions),
            "values": values,
        }

    def snapshot(self) -> dict[str, Any]:
        return {
            "providers": tuple(sorted(self._providers)),
            "message_count": len(self._messages),
            "assertion_count": len(self._assertions),
        }
