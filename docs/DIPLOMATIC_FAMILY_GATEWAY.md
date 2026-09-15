# Z1 Diplomatic Family Gateway

## Zweck

Der Diplomatic Family Gateway ist ein getrenntes Z1-Kommunikationsmodul für vertrauliche Familienangelegenheiten. Er ist kein allgemeiner Messenger und erzeugt keinen externen Kontakt von selbst.

## Governance

- Zuständigkeit: `office-20` Außenbeziehungen / Diplomatie
- Fachbezug: `office-24` Familie
- Autorisierung zum Versenden: Principal mit Rolle `sovereign`
- Empfänger: ausschließlich über `Z1_DFG_ALLOWED_RECIPIENTS` allowlistbar
- Verbindliche Erklärungen oder Rechtsakte werden nicht durch das Gateway selbst gültig.

## Kryptografie

- AES-256-GCM mit zufälligem 96-bit Nonce pro Nachricht
- 32-byte Schlüssel ausschließlich aus `Z1_DFG_KEY` (base64url)
- Authenticated Additional Data bindet Version, messageId, Sender, Empfänger und Klassifikation an die Verschlüsselung.
- Schlüssel werden nicht in Git gespeichert.
- Audit-Datei wird mit Dateirechten `0600` angelegt.

## API

- `GET /api/z1/diplomatic-family/status`
- `POST /api/z1/diplomatic-family/seal`
- `POST /api/z1/diplomatic-family/open`

### Seal-Beispiel

```json
{
  "principal": {"id": "sovereign", "role": "sovereign"},
  "recipientId": "family-reem",
  "classification": "FAMILY_CONFIDENTIAL",
  "message": "Vertrauliche Familiennachricht"
}
```

## Externer Transport

Ein tatsächlicher externer Versand ist absichtlich noch nicht aktiviert. Dafür muss ein realer, autorisierter HTTPS-Endpunkt konfiguriert und auf Empfängerseite ebenfalls eine kompatible Identitäts- und Schlüsselverwaltung eingerichtet werden. Der Gateway-Status bleibt bis dahin `prepared`.

## Z1-Prinzip

Z1 bewahrt. Zoë interpretiert. MCP vermittelt. Das Modell rechnet. Der Gateway transportiert nur autorisierte, verschlüsselte Kommunikationsumschläge und darf keine Vermögens- oder Verwaltungsrechte an den Familienkontakt delegieren.
