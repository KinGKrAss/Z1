"""Gitta document extraction and Z1 asset-evidence validation.

Extraction and validation are deliberately separate: successfully extracting text
never means that an asset has been proven.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Optional


STATUS_VALID = "VALID_ASSET_DOCUMENT"
STATUS_UNVERIFIED = "UNVERIFIED"
STATUS_INVALID = "INVALID_ASSET_DOCUMENT"
STATUS_EXTRACTION_FAILED = "EXTRACTION_FAILED"

ASSET_ID_PATTERNS = (
    re.compile(r"(?:delta[-_ ]asset[-_ ]id|asset[-_ ]id)\s*[:=#]?\s*(\d+)", re.I),
    re.compile(r"/asset/(\d+)(?:/|$)", re.I),
)
QUANTITY_PATTERN = re.compile(
    r"(?:quantity|menge|amount|bestand)\s*[:=]?\s*([0-9][0-9.,]*)\s*([a-zA-ZäöüÄÖÜ€]+)?",
    re.I,
)

LOGIN_MARKERS = (
    "accounts.google.com",
    "google sign in",
    "sign in with google",
    "anmelden mit google",
    "google-accounts",
    "login",
    "passwort",
)

ASSET_MARKERS = (
    "delta asset",
    "asset id",
    "asset-id",
    "vermögensnachweis",
    "asset proof",
    "gold",
    "feingehalt",
    "quantity",
    "menge",
)


@dataclass
class ExtractionResult:
    file_name: str
    mime_type: str
    sha256: str
    extraction_status: str
    text: str
    method: str
    error: Optional[str] = None


@dataclass
class AssetEvidence:
    document_id: str
    file_name: str
    extraction_status: str
    asset_id: Optional[str]
    asset_type: Optional[str]
    quantity: Optional[str]
    unit: Optional[str]
    source: Optional[str]
    source_verified: bool
    asset_evidence: bool
    validation_status: str
    reasons: list[str]


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def extract_document(path: str | Path) -> ExtractionResult:
    """Extract document text using textract.

    The import is lazy so the validation module can still be imported in a
    minimal test environment; production extraction requires textract.
    """
    file_path = Path(path)
    mime_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
    digest = _sha256(file_path)

    try:
        import textract  # type: ignore

        raw = textract.process(str(file_path), encoding="utf-8")
        text = raw.decode("utf-8", errors="replace") if isinstance(raw, bytes) else str(raw)
        return ExtractionResult(
            file_name=file_path.name,
            mime_type=mime_type,
            sha256=digest,
            extraction_status="SUCCESS",
            text=text,
            method="textract",
        )
    except Exception as exc:  # extraction is an explicit evidence state
        return ExtractionResult(
            file_name=file_path.name,
            mime_type=mime_type,
            sha256=digest,
            extraction_status=STATUS_EXTRACTION_FAILED,
            text="",
            method="textract",
            error=f"{type(exc).__name__}: {exc}",
        )


def _find_asset_id(text: str) -> Optional[str]:
    for pattern in ASSET_ID_PATTERNS:
        match = pattern.search(text)
        if match:
            return match.group(1)
    return None


def _find_quantity(text: str) -> tuple[Optional[str], Optional[str]]:
    match = QUANTITY_PATTERN.search(text)
    if not match:
        return None, None
    return match.group(1), match.group(2)


def validate_asset_evidence(
    extraction: ExtractionResult,
    *,
    source_verified: bool = False,
    expected_asset_id: Optional[str] = None,
) -> AssetEvidence:
    """Convert extracted content into a conservative Z1 evidence decision."""
    text = extraction.text or ""
    normalized = text.lower()
    asset_id = _find_asset_id(text)
    quantity, unit = _find_quantity(text)
    asset_type = "GOLD" if "gold" in normalized else None
    source = None

    reasons: list[str] = []
    if extraction.extraction_status != "SUCCESS":
        reasons.append("document extraction failed")
        return AssetEvidence(
            document_id=extraction.sha256,
            file_name=extraction.file_name,
            extraction_status=extraction.extraction_status,
            asset_id=None,
            asset_type=None,
            quantity=None,
            unit=None,
            source=None,
            source_verified=False,
            asset_evidence=False,
            validation_status=STATUS_EXTRACTION_FAILED,
            reasons=reasons,
        )

    if any(marker in normalized for marker in LOGIN_MARKERS):
        reasons.append("login/account content detected")

    if not asset_id:
        reasons.append("no Delta/asset ID found")
    elif expected_asset_id and asset_id != expected_asset_id:
        reasons.append("asset ID does not match expected asset")

    if not asset_type:
        reasons.append("asset type not identified")
    if not quantity:
        reasons.append("asset quantity not identified")
    if not source_verified:
        reasons.append("source not independently verified")

    marker_count = sum(marker in normalized for marker in ASSET_MARKERS)
    evidence_complete = bool(asset_id and asset_type and quantity and source_verified)

    if evidence_complete and not any(marker in normalized for marker in LOGIN_MARKERS):
        status = STATUS_VALID
        has_evidence = True
    elif asset_id or marker_count >= 2:
        status = STATUS_UNVERIFIED
        has_evidence = True
    else:
        status = STATUS_INVALID
        has_evidence = False

    return AssetEvidence(
        document_id=extraction.sha256,
        file_name=extraction.file_name,
        extraction_status=extraction.extraction_status,
        asset_id=asset_id,
        asset_type=asset_type,
        quantity=quantity,
        unit=unit,
        source=source,
        source_verified=source_verified,
        asset_evidence=has_evidence,
        validation_status=status,
        reasons=reasons,
    )


def validate_file(path: str | Path, *, expected_asset_id: Optional[str] = None) -> AssetEvidence:
    extraction = extract_document(path)
    return validate_asset_evidence(extraction, expected_asset_id=expected_asset_id)


def main() -> int:
    parser = argparse.ArgumentParser(description="Gitta Textract + Z1 asset evidence validator")
    parser.add_argument("path")
    parser.add_argument("--expected-asset-id")
    args = parser.parse_args()
    result = validate_file(args.path, expected_asset_id=args.expected_asset_id)
    print(json.dumps(asdict(result), ensure_ascii=False, indent=2))
    return 0 if result.validation_status in {STATUS_VALID, STATUS_UNVERIFIED} else 2


if __name__ == "__main__":
    raise SystemExit(main())
