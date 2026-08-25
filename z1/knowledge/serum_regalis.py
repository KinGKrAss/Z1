"""Authoritative Z1 knowledge record for Serum Regalis / Lion Essence.

This module stores the current project baseline as documented by the owner.
It deliberately contains no formulation quantities, manufacturing steps, or
medical treatment claims. Evidence and regulatory status are explicit so that
future agents do not silently promote hypotheses into facts.
"""
from __future__ import annotations

from dataclasses import asdict, dataclass
from typing import Tuple


@dataclass(frozen=True, slots=True)
class RegalisComponent:
    name: str
    botanical_or_source: str
    intended_role: str
    evidence_status: str
    regulatory_note: str


SERUM_REGALIS_VERSION = "Z1-REGALIS-2026-08-25-v1"
SERUM_REGALIS_NAME = "Serum Regalis / Lion Essence"

CORE_COMPONENTS: Tuple[RegalisComponent, ...] = (
    RegalisComponent("CBD", "Cannabis-derived cannabinoid", "Endocannabinoid-system research/functional support", "requires claim-specific evidence review", "THC/CBD legal and product classification requirements must be checked per jurisdiction"),
    RegalisComponent("THC", "Cannabis-derived cannabinoid", "Functional cannabinoid research component where legally permitted", "requires claim-specific evidence review", "regulated; inclusion is jurisdiction-dependent"),
    RegalisComponent("Lion's Mane", "Hericium erinaceus", "Neuro-support / cognitive-health research direction", "requires human-evidence review before health claims", "food/supplement/product classification must be verified"),
    RegalisComponent("Shilajit", "Purified mineral-organic substance", "Cellular-energy / mineral research direction", "requires quality, contaminant and human-evidence review", "purity and specification are mandatory development gates"),
    RegalisComponent("Mugwort", "Artemisia vulgaris", "Vegetative-balance research direction", "requires evidence and safety review", "species/extract identity and regulatory status must be verified"),
)

VARIANTS = {
    "Serum Regalis – Basis": ("ECS-related functional support", "inflammation-modulation research direction", "general balance/system-care positioning"),
    "Königsruhe": ("stress/HPA-axis research direction", "sleep-support positioning", "Ashwagandha (Withania somnifera) module"),
    "Regalis Balance": ("stress/vegetative-balance research direction", "Ashwagandha (Withania somnifera) module", "not an emergency treatment or bronchodilator"),
    "Regalis Focus / Drive": ("mental clarity and endurance research direction", "Rhodiola rosea + L-Tyrosine + Cordyceps", "optional Panax ginseng; not an ADHD medication or amphetamine"),
}

RESEARCH_ONLY_ONCOLOGY = ("Löwenzahnwurzelextrakt (Taraxacum radix)", "Melittin / Apitoxin")

PROJECT_GUARDRAILS = (
    "No formulation quantities are stored here.",
    "No manufacturing instructions are stored here.",
    "No cancer, Alzheimer, Parkinson or other disease-treatment claim is stored as an established fact.",
    "Research hypotheses must remain explicitly labelled as research until independently validated.",
    "Evidence, safety, interactions and regulatory classification must be reviewed before product claims or formulation decisions.",
)


def regalis_snapshot() -> dict:
    """Return a stable, machine-readable snapshot for Z1 retrieval and audit."""
    return {
        "version": SERUM_REGALIS_VERSION,
        "name": SERUM_REGALIS_NAME,
        "core_components": [asdict(c) for c in CORE_COMPONENTS],
        "variants": {key: list(value) for key, value in VARIANTS.items()},
        "research_only_oncology": list(RESEARCH_ONLY_ONCOLOGY),
        "guardrails": list(PROJECT_GUARDRAILS),
    }
