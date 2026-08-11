#!/usr/bin/env python3
"""Extract typed, provenance-aware memory candidates from Z1 conversation exports.

The extraction engine is deliberately side-effect free: it reads conversations,
produces candidate memories, and writes JSONL only. Persistence/promotion belongs
to the Z1 Memory Core/API layer.

Provenance types:
- ORIGINAL: directly stated in a source message.
- BENUTZERBESTÄTIGT: explicit confirmation such as "ja, das stimmt".
- REKONSTRUKTION: conservative reconstruction from multiple source messages.
- AKTUELLEDEFINITION: explicit current/final definition such as "ab jetzt" or
  "aktuell gilt".

Only conversations not present in the optional state file are processed.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


PROVENANCE = {
    "ORIGINAL",
    "BENUTZERBESTÄTIGT",
    "REKONSTRUKTION",
    "AKTUELLEDEFINITION",
}

_CONFIRMATION_RE = re.compile(
    r"\b(ja|genau|richtig|stimmt|bestätigt|bestätige|korrekt|so ist es|genau so)\b",
    re.I,
)
_CURRENT_RE = re.compile(
    r"\b(ab jetzt|von jetzt an|aktuell gilt|derzeit gilt|final|endgültig|jetzt gilt|gilt ab heute)\b",
    re.I,
)
_RECONSTRUCTION_RE = re.compile(
    r"\b(also|damit|daraus folgt|zusammengefasst|wie vereinbart|entsprechend)\b",
    re.I,
)
_IMPORTANCE_RE = re.compile(
    r"\b(merk dir|erinner|wichtig|entscheidung|beschlossen|vereinbart|prinzip|grundsatz|projekt|phase|roadmap|nicht vergessen)\b",
    re.I,
)


@dataclass(frozen=True)
class SourceReference:
    conversation_id: str
    message_id: str
    role: str
    text: str
    timestamp: Any = None


@dataclass(frozen=True)
class MemoryCandidate:
    candidate_id: str
    title: str
    content: str
    memory_type: str
    provenance_type: str
    confidence: float
    source_references: list[SourceReference]


def _candidate_id(conversation_id: str, message_id: str, content: str) -> str:
    raw = f"{conversation_id}:{message_id}:{content}".encode("utf-8")
    return hashlib.sha256(raw).hexdigest()[:24]


def _memory_type(text: str) -> str:
    t = text.lower()
    if re.search(r"\b(entscheidung|beschlossen|vereinbart)\b", t):
        return "decision"
    if re.search(r"\b(prinzip|grundsatz|regel)\b", t):
        return "principle"
    if re.search(r"\b(projekt|roadmap|phase|modul|system)\b", t):
        return "project"
    if re.search(r"\b(preis|€|eur|euro|mio|mrd|milliarde|million)\b", t):
        return "financial"
    return "fact"


def _title(text: str) -> str:
    line = re.sub(r"\s+", " ", text.strip()).split("\n", 1)[0]
    return line[:117] + "..." if len(line) > 120 else line


def _confidence(provenance: str, text: str) -> float:
    base = {
        "ORIGINAL": 0.82,
        "BENUTZERBESTÄTIGT": 0.94,
        "REKONSTRUKTION": 0.68,
        "AKTUELLEDEFINITION": 0.97,
    }[provenance]
    if len(text) > 300:
        base += 0.02
    return round(min(base, 0.99), 4)


def _provenance(message: dict[str, Any]) -> str:
    text = str(message.get("message") or message.get("content") or "").strip()
    if _CURRENT_RE.search(text):
        return "AKTUELLEDEFINITION"
    if message.get("role") in {"user", "human"} and _CONFIRMATION_RE.search(text):
        return "BENUTZERBESTÄTIGT"
    if _RECONSTRUCTION_RE.search(text):
        return "REKONSTRUKTION"
    return "ORIGINAL"


def extract_conversation(conversation: dict[str, Any]) -> list[MemoryCandidate]:
    conversation_id = str(
        conversation.get("external_conversation_id")
        or conversation.get("conversation_id")
        or conversation.get("id")
        or "unknown"
    )
    candidates: list[MemoryCandidate] = []
    messages = conversation.get("messages") or []

    for index, raw in enumerate(messages):
        if not isinstance(raw, dict):
            continue
        text = str(raw.get("message") or raw.get("content") or raw.get("text") or "").strip()
        if not text or len(text) < 12:
            continue
        if not _IMPORTANCE_RE.search(text) and not _CURRENT_RE.search(text):
            continue

        message_id = str(raw.get("external_message_id") or raw.get("message_id") or raw.get("id") or f"{conversation_id}-{index}")
        provenance = _provenance(raw)
        source = SourceReference(
            conversation_id=conversation_id,
            message_id=message_id,
            role=str(raw.get("role") or "unknown"),
            text=text,
            timestamp=raw.get("timestamp"),
        )
        candidates.append(
            MemoryCandidate(
                candidate_id=_candidate_id(conversation_id, message_id, text),
                title=_title(text),
                content=text,
                memory_type=_memory_type(text),
                provenance_type=provenance,
                confidence=_confidence(provenance, text),
                source_references=[source],
            )
        )
    return candidates


def load_conversations(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as handle:
        data = [json.loads(line) for line in handle if line.strip()] if path.suffix.lower() == ".jsonl" else json.load(handle)
    if isinstance(data, dict):
        data = [data]
    if not isinstance(data, list):
        raise ValueError("Input muss ein JSON-Objekt oder eine JSON-Liste enthalten.")
    return [item for item in data if isinstance(item, dict)]


def load_state(path: Path | None) -> set[str]:
    if path is None or not path.exists():
        return set()
    data = json.loads(path.read_text(encoding="utf-8"))
    return set(data.get("processed_conversation_ids", []))


def save_state(path: Path, processed_ids: set[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps({"processed_conversation_ids": sorted(processed_ids)}, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def run(input_path: Path, output_path: Path, state_path: Path | None = None, dry_run: bool = False) -> dict[str, int]:
    conversations = load_conversations(input_path)
    processed = load_state(state_path)
    fresh = []
    for conversation in conversations:
        conversation_id = str(conversation.get("external_conversation_id") or conversation.get("conversation_id") or conversation.get("id") or "")
        if conversation_id and conversation_id in processed:
            continue
        fresh.append(conversation)

    candidates = [candidate for conversation in fresh for candidate in extract_conversation(conversation)]
    counts = {kind: sum(c.provenance_type == kind for c in candidates) for kind in sorted(PROVENANCE)}
    stats = {
        "conversations_total": len(conversations),
        "conversations_new": len(fresh),
        "conversations_skipped": len(conversations) - len(fresh),
        "candidates": len(candidates),
        **{f"candidates_{k.lower()}": v for k, v in counts.items()},
    }

    if not dry_run:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with output_path.open("w", encoding="utf-8") as handle:
            for candidate in candidates:
                handle.write(json.dumps(asdict(candidate), ensure_ascii=False) + "\n")
        if state_path is not None:
            processed.update(
                str(c.get("external_conversation_id") or c.get("conversation_id") or c.get("id"))
                for c in fresh
                if c.get("external_conversation_id") or c.get("conversation_id") or c.get("id")
            )
            save_state(state_path, processed)
    return stats


def main() -> int:
    parser = argparse.ArgumentParser(description="Extrahiert provenance-aware Memory-Kandidaten für Z1.")
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, default=Path("z1_memory_candidates.jsonl"))
    parser.add_argument("--state", type=Path, default=Path(".z1/extraction_state.json"))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    stats = run(args.input, args.output, args.state, args.dry_run)
    print(json.dumps(stats, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
