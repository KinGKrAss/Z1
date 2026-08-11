#!/usr/bin/env python3
"""Import ChatGPT JSON/JSONL exports into the Z1 Memory Core.

The importer writes only through the authenticated Z1 API. It never modifies
memory tables directly, and it preserves external conversation/message IDs.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Iterable

import requests


class Z1CloudMemoryImporter:
    def __init__(self, api_base_url: str, api_token: str | None = None, timeout: int = 60):
        self.api_url = api_base_url.rstrip("/") + "/memory/conversations/import"
        self.timeout = timeout
        self.session = requests.Session()
        if api_token:
            self.session.headers.update({"Authorization": f"Bearer {api_token}"})

    @staticmethod
    def _text_from_content(content: Any) -> str:
        if isinstance(content, str):
            return content.strip()
        if isinstance(content, dict):
            parts = content.get("parts")
            if isinstance(parts, list):
                return "\n".join(str(p) for p in parts if isinstance(p, str)).strip()
            text = content.get("text")
            if isinstance(text, str):
                return text.strip()
        if isinstance(content, list):
            return "\n".join(str(p) for p in content if isinstance(p, str)).strip()
        return ""

    @classmethod
    def _messages_from_mapping(cls, mapping: dict[str, Any]) -> list[dict[str, Any]]:
        result: list[dict[str, Any]] = []
        for node_id, node in mapping.items():
            if not isinstance(node, dict):
                continue
            msg = node.get("message")
            if not isinstance(msg, dict):
                continue
            text = cls._text_from_content(msg.get("content"))
            if not text:
                continue
            author = msg.get("author") or {}
            role = author.get("role", "user") if isinstance(author, dict) else "user"
            result.append({
                "external_message_id": str(node_id),
                "role": role,
                "message": text,
                "timestamp": msg.get("create_time"),
            })
        return result

    @classmethod
    def _messages_from_list(cls, raw: list[Any], conversation_id: str) -> list[dict[str, Any]]:
        result: list[dict[str, Any]] = []
        for index, item in enumerate(raw):
            if not isinstance(item, dict):
                continue
            text = cls._text_from_content(item.get("message", item.get("content", item.get("text", ""))))
            if not text:
                continue
            result.append({
                "external_message_id": str(item.get("id") or item.get("message_id") or f"{conversation_id}-{index}"),
                "role": item.get("role") or item.get("rolle") or "user",
                "message": text,
                "timestamp": item.get("timestamp") or item.get("zeitstempel"),
            })
        return result

    @classmethod
    def normalize_conversation(cls, chat: dict[str, Any], index: int) -> dict[str, Any] | None:
        external_id = str(chat.get("id") or chat.get("conversation_id") or f"import-{index}")
        title = chat.get("title") or chat.get("titel") or f"Importiertes Gespräch {index}"
        raw = chat.get("messages")
        if raw is None:
            raw = chat.get("mapping", {})

        if isinstance(raw, dict):
            messages = cls._messages_from_mapping(raw)
        elif isinstance(raw, list):
            messages = cls._messages_from_list(raw, external_id)
        else:
            messages = []

        if not messages:
            return None
        return {
            "external_conversation_id": external_id,
            "title": str(title),
            "source": "chatgpt_export",
            "messages": messages,
        }

    @staticmethod
    def load(path: Path) -> list[dict[str, Any]]:
        with path.open("r", encoding="utf-8") as handle:
            if path.suffix.lower() == ".jsonl":
                data = [json.loads(line) for line in handle if line.strip()]
            else:
                data = json.load(handle)
        if isinstance(data, dict):
            data = [data]
        if not isinstance(data, list):
            raise ValueError("Export muss ein JSON-Objekt oder eine JSON-Liste enthalten.")
        return [item for item in data if isinstance(item, dict)]

    def import_file(self, path: Path, dry_run: bool = False) -> tuple[int, int]:
        conversations = self.load(path)
        imported = 0
        skipped = 0
        for index, chat in enumerate(conversations, 1):
            payload = self.normalize_conversation(chat, index)
            if payload is None:
                skipped += 1
                print(f"SKIP [{index}/{len(conversations)}] keine importierbaren Nachrichten")
                continue
            if dry_run:
                imported += 1
                print(f"DRY-RUN [{index}/{len(conversations)}] {payload['title']} ({len(payload['messages'])} Nachrichten)")
                continue
            response = self.session.post(self.api_url, json=payload, timeout=self.timeout)
            if response.ok:
                imported += 1
                print(f"OK [{index}/{len(conversations)}] {payload['title']} ({len(payload['messages'])} Nachrichten)")
            else:
                raise RuntimeError(f"Import fehlgeschlagen ({response.status_code}): {response.text[:1000]}")
        return imported, skipped


def main() -> int:
    parser = argparse.ArgumentParser(description="Importiert ChatGPT JSON/JSONL in den Z1 Memory Core.")
    parser.add_argument("export", type=Path)
    parser.add_argument("--api", default=os.getenv("Z1_API_URL", "http://localhost:8000"))
    parser.add_argument("--token", default=os.getenv("Z1_API_TOKEN"))
    parser.add_argument("--timeout", type=int, default=60)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    try:
        importer = Z1CloudMemoryImporter(args.api, args.token, args.timeout)
        imported, skipped = importer.import_file(args.export, args.dry_run)
        print(f"Fertig: {imported} importiert, {skipped} übersprungen.")
        return 0
    except (OSError, ValueError, requests.RequestException, RuntimeError) as exc:
        print(f"Fehler: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
