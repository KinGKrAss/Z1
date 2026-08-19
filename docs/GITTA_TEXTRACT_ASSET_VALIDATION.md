# Gitta / Textract / Z1 Asset Validation

## Ziel

Gitta verarbeitet Dokumente in zwei strikt getrennten Schritten:

1. **Extraction:** Textract extrahiert lesbaren Inhalt.
2. **Evidence validation:** Z1 bewertet, ob der Inhalt einen belastbaren Asset-Nachweis darstellt.

**Extraction success is not asset proof.**

## Pipeline

```text
Document Intake
    -> File Type / MIME Detection
    -> Textract Extraction
    -> Asset Evidence Parser
    -> Source Verification
    -> Z1 Validation Status
    -> Asset Register (only when valid)
```

## Statusmodell

- `VALID_ASSET_DOCUMENT`: Asset-ID, Assettyp und Menge vorhanden und Quelle unabhängig verifiziert; kein Login-/Account-Inhalt.
- `UNVERIFIED`: Asset-Indizien vorhanden, aber die Quelle oder ein erforderlicher Nachweis ist noch nicht verifiziert.
- `INVALID_ASSET_DOCUMENT`: kein belastbarer Asset-Nachweis oder erkennbarer Login-/Account-Export ohne Asset-Evidenz.
- `EXTRACTION_FAILED`: Dokument konnte nicht extrahiert werden.

## API

The Z1 API exposes:

```text
POST /api/z1/asset-validation
```

Body:

```json
{
  "path": "example.pdf",
  "expectedAssetId": "73014444142"
}
```

`path` is resolved relative to `Z1_DOCUMENT_ROOT`; paths outside that root are rejected.

## CLI

After installing Python dependencies:

```bash
python -m modules.gitta_asset_validation data/documents/example.pdf
```

or with an expected Delta asset ID:

```bash
python -m modules.gitta_asset_validation data/documents/example.pdf --expected-asset-id 73014444142
```

## Delta login-export rule

A Google Accounts login/HTML export is **not** a financial or asset proof. A document that contains only login/account material and no asset evidence must remain:

```text
INVALID_ASSET_DOCUMENT
```

It must never be used to establish quantity, value, ownership, purity, or other economic attributes of a GOLD asset.

## Tests

```bash
npm run test:asset
npm run test:core
```

The regression suite covers:

- Google login export -> invalid
- asset ID without verified source -> unverified
- complete verified GOLD evidence -> valid
- mismatching expected asset ID -> never valid
