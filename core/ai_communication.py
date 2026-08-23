"""Z1 AI Communication Layer.

Provider-agnostic message contracts for Zoë, Gemini, Perplexity and Siri.
External providers are adapters and do not own Z1 state.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Protocol
from uuid import uuid4


@dataclass(frozen=True, slots=True)
class AIMessage:
    sender: str
    recipient: str
    task: str
    payload: dict[str, Any] = field(default_factory=dict)
    message_id: str = field(default_factory=lambda: str(uuid4()))
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    authorization: str = "read"


@dataclass(frozen=True, slots=True)
class AIResponse:
    provider: str
    message_id: str
    status: str
    payload: dict[str, Any] = field(default_factory=dict)
    error: str | None = None


class AIAdapter(Protocol):
    provider_id: str

    async def health(self) -> bool: ...
    async def send(self, message: AIMessage) -> AIResponse: ...


class AICommunicationLayer:
    """Routes messages through registered adapters and keeps an audit trail."""

    def __init__(self) -> None:
        self._adapters: dict[str, AIAdapter] = {}
        self._audit: list[dict[str, Any]] = []

    def register(self, adapter: AIAdapter) -> None:
        provider_id = adapter.provider_id.strip().lower()
        if not provider_id:
            raise ValueError("provider_id is required")
        if provider_id in self._adapters:
            raise ValueError(f"Adapter already registered: {provider_id}")
        self._adapters[provider_id] = adapter

    async def send(self, message: AIMessage) -> AIResponse:
        recipient = message.recipient.strip().lower()
        adapter = self._adapters.get(recipient)
        if adapter is None:
            raise KeyError(f"No AI adapter registered for: {recipient}")

        # External adapters default to read-only communication.
        if message.authorization not in {"read", "review"}:
            raise PermissionError("External AI adapters may not receive write authorization")

        response = await adapter.send(message)
        self._audit.append({
            "message_id": message.message_id,
            "sender": message.sender,
            "recipient": message.recipient,
            "task": message.task,
            "authorization": message.authorization,
            "response_status": response.status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })
        return response

    def audit(self) -> tuple[dict[str, Any], ...]:
        return tuple(self._audit)

    def providers(self) -> tuple[str, ...]:
        return tuple(sorted(self._adapters))
