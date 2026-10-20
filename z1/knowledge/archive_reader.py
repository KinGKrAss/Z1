"""Read ChatGPT conversation exports from ZIP or RAR without extracting paths.

The importer reads only one conversations.json member, applies size and
compression-ratio limits, and returns the shape accepted by Z1's memory import.
It does not execute archive contents or write conversations into Z1 storage.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import zipfile
from pathlib import Path, PurePosixPath
from typing import BinaryIO, Iterable, Any

MAX_ARCHIVE_BYTES = 1024 * 1024 * 1024
MAX_JSON_BYTES = 128 * 1024 * 1024
MAX_COMPRESSION_RATIO = 200
CHUNK_SIZE = 1024 * 1024


def _is_conversations_json(name: str) -> bool:
    normalized = name.replace("\\", "/")
    member_path = PurePosixPath(normalized)
    return (
        not member_path.is_absolute()
        and ".." not in member_path.parts
        and member_path.name.casefold() == "conversations.json"
    )


def _read_limited(stream: BinaryIO, limit: int = MAX_JSON_BYTES) -> bytes:
    chunks: list[bytes] = []
    total = 0
    while True:
        chunk = stream.read(min(CHUNK_SIZE, limit + 1 - total))
        if not chunk:
            break
        chunks.append(chunk)
        total += len(chunk)
        if total > limit:
            raise ValueError("conversations.json exceeds the configured size limit")
    return b"".join(chunks)


def _check_member_size(file_size: int, compressed_size: int) -> None:
    if file_size < 0 or file_size > MAX_JSON_BYTES:
        raise ValueError("conversations.json exceeds the configured size limit")
    if file_size and (
        compressed_size <= 0
        or file_size > compressed_size * MAX_COMPRESSION_RATIO
    ):
        raise ValueError("archive member exceeds the compression-ratio limit")


def _one_member(infos: Iterable[Any]) -> Any:
    matches = [
        info for info in infos
        if not info.is_dir() and _is_conversations_json(info.filename)
    ]
    if len(matches) != 1:
        raise ValueError(
            "expected exactly one conversations.json; "
            f"found {len(matches)}"
        )
    return matches[0]


def _normalize_export(raw: bytes) -> dict[str, list[Any]]:
    try:
        data = json.loads(raw.decode("utf-8-sig"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise ValueError("conversations.json is not valid UTF-8 JSON") from exc

    if isinstance(data, list):
        conversations = data
    elif isinstance(data, dict) and isinstance(data.get("conversations"), list):
        conversations = data["conversations"]
    else:
        raise ValueError("export must be an array or contain a conversations array")

    return {"conversations": conversations}


def _read_zip(path: Path) -> dict[str, list[Any]]:
    with zipfile.ZipFile(path, "r") as archive:
        info = _one_member(archive.infolist())
        if info.flag_bits & 0x1:
            raise ValueError("password-protected ZIP archives are not supported")
        _check_member_size(info.file_size, info.compress_size)
        with archive.open(info, "r") as member:
            return _normalize_export(_read_limited(member))


def _read_rar(path: Path) -> dict[str, list[Any]]:
    try:
        import rarfile
    except ImportError as exc:
        raise RuntimeError(
            "RAR support requires the optional 'rarfile' package"
        ) from exc

    with rarfile.RarFile(path) as archive:
        info = _one_member(archive.infolist())
        _check_member_size(info.file_size, info.compress_size)
        with archive.open(info) as member:
            return _normalize_export(_read_limited(member))


def read_chatgpt_archive(filename: str | os.PathLike[str]) -> dict[str, list[Any]]:
    """Return a normalized conversations object from a .zip or .rar export."""
    path = Path(filename)
    if not path.is_file():
        raise FileNotFoundError(f"archive not found: {path}")
    if path.stat().st_size > MAX_ARCHIVE_BYTES:
        raise ValueError("archive exceeds the configured size limit")

    suffix = path.suffix.casefold()
    if suffix == ".zip":
        return _read_zip(path)
    if suffix == ".rar":
        return _read_rar(path)
    raise ValueError("supported archive extensions are .zip and .rar")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Prepare a ChatGPT ZIP/RAR export for Z1 memory import."
    )
    parser.add_argument("archive", help="path to a .zip or .rar export")
    parser.add_argument(
        "--output",
        required=True,
        help="new JSON file to create; existing files are never overwritten",
    )
    args = parser.parse_args(argv)

    try:
        export_data = read_chatgpt_archive(args.archive)
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        encoded = json.dumps(export_data, ensure_ascii=False, separators=(",", ":"))

        # Create exclusively with owner-only permissions on POSIX systems.
        flags = os.O_WRONLY | os.O_CREAT | os.O_EXCL
        fd = os.open(output_path, flags, 0o600)
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as output:
                output.write(encoded)
                output.write("\n")
        except Exception:
            output_path.unlink(missing_ok=True)
            raise

        print(
            f"Prepared {len(export_data['conversations'])} conversations "
            f"at {output_path}"
        )
        return 0
    except Exception as exc:  # CLI reports a concise error; library callers get exceptions.
        print(f"archive import preparation failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
