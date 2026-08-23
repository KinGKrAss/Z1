"""GAIA project registry for Z1 real-estate assets.

Project figures may be estimates or plan values. The registry deliberately
tracks verification status so projections cannot silently become facts.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class VerificationStatus(str, Enum):
    UNVERIFIED = "unverified"
    PARTIALLY_VERIFIED = "partially_verified"
    VERIFIED = "verified"


class ValueStatus(str, Enum):
    PLAN = "plan"
    ESTIMATE = "estimate"
    DOCUMENTED = "documented"


@dataclass(frozen=True, slots=True)
class GAIAProject:
    project_id: str
    name: str
    city: str
    country: str
    status: str
    verification_status: VerificationStatus
    value_status: ValueStatus
    area_m2: float | None = None
    floors: int | None = None
    target_completion_year: int | None = None
    planned_monthly_rent_eur: float | None = None
    currency: str = "EUR"
    source_refs: tuple[str, ...] = field(default_factory=tuple)
    notes: tuple[str, ...] = field(default_factory=tuple)
    version: str = "1.0"

    def with_verification(self, status: VerificationStatus) -> "GAIAProject":
        return GAIAProject(
            project_id=self.project_id,
            name=self.name,
            city=self.city,
            country=self.country,
            status=self.status,
            verification_status=status,
            value_status=self.value_status,
            area_m2=self.area_m2,
            floors=self.floors,
            target_completion_year=self.target_completion_year,
            planned_monthly_rent_eur=self.planned_monthly_rent_eur,
            currency=self.currency,
            source_refs=self.source_refs,
            notes=self.notes,
            version=self.version,
        )

    def to_record(self) -> dict[str, Any]:
        return {
            "project_id": self.project_id,
            "name": self.name,
            "city": self.city,
            "country": self.country,
            "status": self.status,
            "verification_status": self.verification_status.value,
            "value_status": self.value_status.value,
            "area_m2": self.area_m2,
            "floors": self.floors,
            "target_completion_year": self.target_completion_year,
            "planned_monthly_rent_eur": self.planned_monthly_rent_eur,
            "currency": self.currency,
            "source_refs": list(self.source_refs),
            "notes": list(self.notes),
            "version": self.version,
        }


# Seeded only with information previously supplied for the Frankfurt project.
# It is explicitly marked unverified until primary project documents are added.
FRANKFURT_PROJECTS: tuple[GAIAProject, ...] = (
    GAIAProject(
        project_id="fra-mainzer-landstrasse-001",
        name="Mainzer Landstraße",
        city="Frankfurt am Main",
        country="DE",
        status="planning / development",
        verification_status=VerificationStatus.UNVERIFIED,
        value_status=ValueStatus.PLAN,
        area_m2=37_000,
        floors=11,
        target_completion_year=2028,
        planned_monthly_rent_eur=1_800_000,
        notes=(
            "All seeded figures are user-provided planning values and are not independently verified.",
            "Do not treat planned rent as realized revenue or documented asset value.",
        ),
    ),
)


def validate_project(project: GAIAProject) -> None:
    if not project.project_id or not project.name or not project.city:
        raise ValueError("GAIA project requires project_id, name and city")
    if project.area_m2 is not None and project.area_m2 <= 0:
        raise ValueError("area_m2 must be positive")
    if project.floors is not None and project.floors <= 0:
        raise ValueError("floors must be positive")
    if project.planned_monthly_rent_eur is not None and project.planned_monthly_rent_eur < 0:
        raise ValueError("planned_monthly_rent_eur cannot be negative")


def validate_registry(projects: tuple[GAIAProject, ...] = FRANKFURT_PROJECTS) -> None:
    ids = [project.project_id for project in projects]
    if len(ids) != len(set(ids)):
        raise ValueError("GAIA project_id values must be unique")
    for project in projects:
        validate_project(project)


def get_frankfurt_project(project_id: str) -> GAIAProject:
    for project in FRANKFURT_PROJECTS:
        if project.project_id == project_id:
            return project
    raise KeyError(f"Unknown Frankfurt GAIA project: {project_id}")


validate_registry()
