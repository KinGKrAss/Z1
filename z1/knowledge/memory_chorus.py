"""Dynamic contextual memory chorus for Z1."""
from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any, Dict, List


@dataclass(frozen=True, slots=True)
class MemoryRecord:
    content: str
    context: str
    timestamp: float


class ChorusVoice:
    def __init__(self, name: str, weight: float) -> None:
        self.name = name
        self.weight = weight
        self.memories: List[MemoryRecord] = []

    def imprint(self, content: str, context: str) -> None:
        self.memories.append(MemoryRecord(content, context, time.time()))

    def resonate(self, query: str) -> List[Dict[str, Any]]:
        needle = query.casefold()
        results: List[Dict[str, Any]] = []
        for memory in self.memories:
            if needle in memory.content.casefold() or needle in memory.context.casefold():
                results.append({
                    "voice": self.name,
                    "weight": self.weight,
                    "content": memory.content,
                    "context": memory.context,
                    "timestamp": memory.timestamp,
                })
        return results


class MemoryChorus:
    def __init__(self) -> None:
        self.voices = [
            ChorusVoice("Bass_Facts", 1.0),
            ChorusVoice("Tenor_Context", 0.8),
            ChorusVoice("Alto_Association", 0.6),
        ]

    def imprint(self, content: str, context: str) -> None:
        for voice in self.voices:
            voice.imprint(content, context)

    def query(self, query: str) -> List[Dict[str, Any]]:
        results: List[Dict[str, Any]] = []
        for voice in self.voices:
            results.extend(voice.resonate(query))
        return sorted(results, key=lambda item: item["weight"], reverse=True)
