"""Z1 Meta-Wiki: controlled static knowledge for general and historical facts."""
from __future__ import annotations

from dataclasses import dataclass
from enum import Enum
from typing import Dict, Optional


class VerificationStatus(str, Enum):
    VERIFIED = "verified"
    PARTIAL = "partial"
    UNVERIFIED = "unverified"
    CONFLICTING = "conflicting"
    MISSING = "missing"
    REJECTED = "rejected"


@dataclass(frozen=True, slots=True)
class KnowledgeEntry:
    term: str
    definition: str
    category: str
    source: Optional[str] = None
    period_start: Optional[str] = None
    period_end: Optional[str] = None
    verification_status: VerificationStatus = VerificationStatus.UNVERIFIED


class MetaWiki:
    """Case-insensitive lookup store for curated Z1 general knowledge."""

    def __init__(self) -> None:
        self._entries: Dict[str, KnowledgeEntry] = {}

    def add(self, entry: KnowledgeEntry) -> None:
        self._entries[entry.term.casefold()] = entry

    def lookup(self, term: str) -> Optional[KnowledgeEntry]:
        return self._entries.get(term.casefold())

    def all_entries(self) -> tuple[KnowledgeEntry, ...]:
        return tuple(self._entries.values())

    def seed_core_knowledge(self) -> None:
        self.add(KnowledgeEntry(
            term="System Z1",
            definition="Kontroll- und Orchestrierungsschicht für Z1-Zustand, Module, Agenten und Verifikation.",
            category="z1-system",
            verification_status=VerificationStatus.VERIFIED,
            source="Z1 architecture specification",
        ))
        self.add(KnowledgeEntry(
            term="Meta-Wiki",
            definition="Kuratierte Nachschlagewerk-Schicht für allgemeines, historisches und systembezogenes Grundwissen.",
            category="z1-system",
            verification_status=VerificationStatus.VERIFIED,
            source="Z1 knowledge architecture",
        ))
        self.add(KnowledgeEntry(
            term="Serum Regalis",
            definition="Persistenter Z1-Projektstand für das modulare pflanzen-/naturbasierte Regalis-Konzept; Forschungsannahmen, Evidenzstatus und regulatorische Leitplanken müssen getrennt geführt werden.",
            category="z1-project",
            verification_status=VerificationStatus.PARTIAL,
            source="Z1-REGALIS-2026-08-25-v1",
        ))
        self.add(KnowledgeEntry(
            term="Lion Essence",
            definition="Alternativbezeichnung des Projekts Serum Regalis / Lion Essence; gehört zum Regalis-Projektkontext und nicht zum Musikprojekt Königsblut.",
            category="z1-project",
            verification_status=VerificationStatus.PARTIAL,
            source="Z1-REGALIS-2026-08-25-v1",
        ))
        self.add(KnowledgeEntry(
            term="Königsblut",
            definition="Eigenständiges Rap-/Musikprojekt; nicht mit Serum Regalis / Lion Essence zu verwechseln.",
            category="z1-project",
            verification_status=VerificationStatus.PARTIAL,
            source="owner project distinction",
        ))
