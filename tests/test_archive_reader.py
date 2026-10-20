import json
import tempfile
import unittest
import zipfile
from pathlib import Path

from z1.knowledge.archive_reader import read_chatgpt_archive


class ArchiveReaderTests(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp_dir.cleanup)
        self.root = Path(self.temp_dir.name)

    def write_zip(self, members, filename="export.zip", compression=zipfile.ZIP_DEFLATED):
        path = self.root / filename
        with zipfile.ZipFile(path, "w", compression=compression) as archive:
            for name, contents in members:
                archive.writestr(name, contents)
        return path

    def test_reads_nested_chatgpt_export(self):
        conversations = [{"id": "chat-1", "title": "Zoë"}]
        archive_path = self.write_zip([
            ("ChatGPT export/conversations.json", json.dumps(conversations))
        ])

        result = read_chatgpt_archive(archive_path)

        self.assertEqual(result, {"conversations": conversations})

    def test_accepts_export_object_with_conversations(self):
        conversations = [{"id": "chat-2"}]
        archive_path = self.write_zip([
            ("conversations.json", json.dumps({"conversations": conversations}))
        ])

        self.assertEqual(
            read_chatgpt_archive(archive_path),
            {"conversations": conversations},
        )

    def test_rejects_duplicate_conversation_files(self):
        archive_path = self.write_zip([
            ("one/conversations.json", "[]"),
            ("two/conversations.json", "[]"),
        ])

        with self.assertRaisesRegex(ValueError, "exactly one"):
            read_chatgpt_archive(archive_path)

    def test_rejects_invalid_json(self):
        archive_path = self.write_zip([("conversations.json", "{bad json")])

        with self.assertRaisesRegex(ValueError, "valid UTF-8 JSON"):
            read_chatgpt_archive(archive_path)

    def test_rejects_unexpected_json_shape(self):
        archive_path = self.write_zip([("conversations.json", '{"items": []}')])

        with self.assertRaisesRegex(ValueError, "conversations array"):
            read_chatgpt_archive(archive_path)

    def test_rejects_unsafe_member_path(self):
        archive_path = self.write_zip([("../conversations.json", "[]")])

        with self.assertRaisesRegex(ValueError, "found 0"):
            read_chatgpt_archive(archive_path)

    def test_rejects_compression_ratio_bomb(self):
        archive_path = self.write_zip([("conversations.json", " " * 500_000)])

        with self.assertRaisesRegex(ValueError, "compression-ratio"):
            read_chatgpt_archive(archive_path)

    def test_rejects_unsupported_extension(self):
        archive_path = self.write_zip(
            [("conversations.json", "[]")],
            filename="export.7z",
        )

        with self.assertRaisesRegex(ValueError, "supported archive extensions"):
            read_chatgpt_archive(archive_path)


if __name__ == "__main__":
    unittest.main()
