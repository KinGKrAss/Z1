"""Durable registry for the 33 Z1 specialist offices.

The office identity is stable; an AI model assigned to an office is replaceable.
This registry stores mandates and governance metadata, not personal identities.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Iterable


@dataclass(frozen=True, slots=True)
class Z1Office:
    agent_id: str
    title: str
    domain: str
    mandate: str
    model_id: str | None = None
    version: str = "1.0"
    active: bool = True

    def handover(self, model_id: str) -> "Z1Office":
        return Z1Office(
            agent_id=self.agent_id,
            title=self.title,
            domain=self.domain,
            mandate=self.mandate,
            model_id=model_id,
            version=self.version,
            active=self.active,
        )


# Canonical Z1 office IDs. Names/titles are intentionally role-based so the
# registry can later be reconciled with the user's authoritative 33-office file.
OFFICES: tuple[Z1Office, ...] = (
    Z1Office("office-01", "Recht", "legal", "Rechtsordnung, Gesetzgebung und Governance"),
    Z1Office("office-02", "Finanzen", "finance", "Haushalt, Steuern und öffentliche Finanzen"),
    Z1Office("office-03", "Gesundheit", "health", "Gesundheitsversorgung und Prävention"),
    Z1Office("office-04", "Bildung", "education", "Schule, Ausbildung und lebenslanges Lernen"),
    Z1Office("office-05", "Arbeit", "labour", "Arbeitsmarkt, Lohn und Qualifizierung"),
    Z1Office("office-06", "Soziales", "social", "Soziale Sicherung und Teilhabe"),
    Z1Office("office-07", "Altersvorsorge", "pensions", "Altersvorsorge und Generationengerechtigkeit"),
    Z1Office("office-08", "Infrastruktur", "infrastructure", "Öffentliche Infrastruktur und Erneuerung"),
    Z1Office("office-09", "Energie", "energy", "Energieversorgung und Energiesicherheit"),
    Z1Office("office-10", "Wohnen", "housing", "Wohnraum, Mietwesen und Wohnungsbau"),
    Z1Office("office-11", "Wirtschaft", "economy", "Wirtschaftspolitik und Wettbewerb"),
    Z1Office("office-12", "Landwirtschaft", "agriculture", "Landwirtschaft, Ernährung und Böden"),
    Z1Office("office-13", "Umwelt", "environment", "Umweltschutz, Natur und Ressourcen"),
    Z1Office("office-14", "Verkehr", "transport", "Verkehrssysteme und Mobilität"),
    Z1Office("office-15", "Digitales", "digital", "Digitale Verwaltung und Infrastruktur"),
    Z1Office("office-16", "Technologie", "technology", "Technologie, Forschung und Innovation"),
    Z1Office("office-17", "Sicherheit", "security", "Öffentliche Sicherheit und Gefahrenvorsorge"),
    Z1Office("office-18", "Justizverwaltung", "justice", "Justizorganisation und Rechtszugang"),
    Z1Office("office-19", "Datenschutz", "privacy", "Datenschutz und informationelle Selbstbestimmung"),
    Z1Office("office-20", "Außenbeziehungen", "foreign-affairs", "Diplomatie und internationale Beziehungen"),
    Z1Office("office-21", "Verteidigung", "defence", "Defensivplanung und zivile Resilienz"),
    Z1Office("office-22", "Kultur", "culture", "Kultur, Geschichte und kulturelles Erbe"),
    Z1Office("office-23", "Wissenschaft", "science", "Wissenschaftspolitik und Forschungsförderung"),
    Z1Office("office-24", "Familie", "family", "Familienpolitik und Vereinbarkeit"),
    Z1Office("office-25", "Jugend", "youth", "Jugendschutz, Beteiligung und Entwicklung"),
    Z1Office("office-26", "Verbraucherschutz", "consumer", "Verbraucherrechte und Produktsicherheit"),
    Z1Office("office-27", "Tierschutz", "animal-welfare", "Tierschutz und verantwortungsvolle Tierhaltung"),
    Z1Office("office-28", "Steuerwesen", "tax", "Steuerverwaltung und Abgabenordnung"),
    Z1Office("office-29", "Verwaltung", "administration", "Verwaltungsmodernisierung und Service"),
    Z1Office("office-30", "Bürgerrechte", "civil-rights", "Grundrechte, Gleichbehandlung und Teilhabe"),
    Z1Office("office-31", "Katastrophenschutz", "civil-protection", "Krisenvorsorge und Katastrophenschutz"),
    Z1Office("office-32", "Medien", "media", "Medienordnung und Informationszugang"),
    Z1Office("office-33", "Zukunft & Strategie", "strategy", "Langfristige Strategie und ressortübergreifende Planung"),
)


def validate_registry(offices: Iterable[Z1Office] = OFFICES) -> None:
    items = tuple(offices)
    if len(items) != 33:
        raise ValueError(f"Z1 requires exactly 33 offices; got {len(items)}")
    ids = [office.agent_id for office in items]
    if len(set(ids)) != len(ids):
        raise ValueError("Z1 office agent_id values must be unique")
    if any(not office.agent_id or not office.mandate for office in items):
        raise ValueError("Every Z1 office requires an agent_id and mandate")


def get_office(agent_id: str) -> Z1Office:
    for office in OFFICES:
        if office.agent_id == agent_id:
            return office
    raise KeyError(f"Unknown Z1 office: {agent_id}")


validate_registry()
