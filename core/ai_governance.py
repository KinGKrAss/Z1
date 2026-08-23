"""Z1 AI governance registry.

Keeps durable office/agent identities separate from replaceable AI models.
External AI systems are adapters; they never own Z1 state.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Literal

Provider = Literal["z1", "gemini", "siri", "perplexity"]


@dataclass(frozen=True)
class AIProvider:
    provider_id: str
    name: str
    provider: Provider
    role: str
    capabilities: tuple[str, ...]
    read_only_by_default: bool = True


@dataclass(frozen=True)
class Office:
    agent_id: str
    name: str
    mandate: str
    capabilities: tuple[str, ...] = field(default_factory=tuple)
    model_id: str | None = None

    def handover(self, model_id: str) -> "Office":
        """Return the same durable office with a replacement model."""
        return Office(
            agent_id=self.agent_id,
            name=self.name,
            mandate=self.mandate,
            capabilities=self.capabilities,
            model_id=model_id,
        )


AI_PROVIDERS: tuple[AIProvider, ...] = (
    AIProvider("zoe", "Zoë", "z1", "coordination", ("orchestration", "state-interpretation")),
    AIProvider("gemini", "Gemini", "gemini", "cross-check", ("analysis", "review")),
    AIProvider("siri", "Siri", "siri", "voice/device-assistance", ("voice", "device-assistance")),
    AIProvider("perplexity", "Perplexity", "perplexity", "research", ("research", "source-discovery")),
)


# Seed registry: additional offices are loaded from the durable Z1 registry.
CORE_OFFICES: tuple[Office, ...] = (
    Office("zoe", "Zoë", "Z1 coordination and continuity"),
    Office("jurena", "Jurena", "legal analysis and governance"),
)


def get_provider(provider_id: str) -> AIProvider:
    for provider in AI_PROVIDERS:
        if provider.provider_id == provider_id:
            return provider
    raise KeyError(f"Unknown Z1 AI provider: {provider_id}")


def get_office(agent_id: str) -> Office:
    for office in CORE_OFFICES:
        if office.agent_id == agent_id:
            return office
    raise KeyError(f"Unknown Z1 office: {agent_id}")
