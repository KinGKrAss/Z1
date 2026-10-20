# Import a ChatGPT archive into Z1

The archive reader accepts a ChatGPT export in \`.zip\` or \`.rar\` form. It reads only
one \`conversations.json\` member and prepares a JSON file for Z1's existing memory
import. It does not access the ChatGPT account, upload data, or write to the Z1
memory store by itself.

## ZIP

ZIP support uses Python's standard \`zipfile\` module.

## RAR

Install the Python package and a supported external RAR utility on the server:

\`\`\`sh
python -m pip install -r requirements.txt
\`\`\`

The \`rarfile\` package uses an external utility such as \`unrar\` or \`unar\` to
decompress RAR members. Confirm that the utility is installed and available on
\`PATH\`. Encrypted archives are not supported by this import flow.

## Prepare an import file

Run the command from the repository root and choose a private output location:

\`\`\`sh
python -m z1.knowledge.archive_reader /path/to/chatgpt-export.zip --output /private/path/z1_import_ready.json
\`\`\`

The output contains the normalized \`{"conversations": [...]}\` object accepted by
the connected Z1 memory-import interface. The output file contains private chat
data. Keep it outside the repository and delete it when the import is complete.

The reader accepts one archive member named \`conversations.json\`, limits the
archive to 1 GiB and the JSON member to 128 MiB, rejects suspicious compression
ratios, and never extracts archive paths to disk. The JSON is fully parsed in
memory after the bounded read. Very large exports need a separately designed
streaming importer.

After review, provide the output JSON to Z1's authenticated memory-import flow.
That step is separate; this CLI only prepares the payload.
