# Z1 Speak 1.0.0 — Z1-SPEAK-001 und Meta-Vorbereitung

Speak ist ein tatsächlicher WAV-Sprachdienst auf Basis von `espeak` (keine simulierte Erfolgsantwort). Er hält die Z1-PEACE-001-Aktionsprüfung ein. Der Text wird nicht in den lokalen Audit-Einträgen gespeichert. Sprachsynthese ohne installierte Engine schlägt **sichtbar fehl**.

## Anforderungen und Start

- Node.js 22, Linux und `espeak` als ausführbares Programm auf dem Server.
- `Z1_SPEAK_API_KEY` als langes, zufälliges Geheimnis **in der Serverumgebung**, niemals im GitHub-Repository oder in Meta-Posts.
- Optional `Z1_SPEAK_AUDIT_PATH` (Standard `data/z1_speak_audit.jsonl`). Datenträger und Backups absichern; Zugriffe beschränken.
- `npm run z1:api` starten. Standardmäßig bindet die API nur an `127.0.0.1:3001`.
- `npm run test:speak` führt Funktionstests und einen lokalen WAV-Test durch (falls `espeak` installiert).

`GET /api/z1/speak/voices` listet verfügbare Sprachcodes. `POST /api/z1/speak` erzeugt WAV-Audio für JSON wie `{"text":"Guten Tag","voice":"de-DE","scope":"education"}`. Header: `x-z1-speak-key: <server-secret>` und `content-type: application/json`. Die Antwort ist `audio/wav`. Browser und Android können WAV abspielen. Unterstützt werden tatsächlich `de-DE` und `en-US`; Neural-Stimmen sind ohne Cloud-Dienst **nicht** verfügbar. Auf Android ist kein ungültiges Gradle-Artefakt `androidx.speech:speech:1.0.0` erforderlich.

## Sicherheitsgrenzen

Der öffentliche Endpunkt ist auf den serverseitig festgelegten Verwendungszweck `education` beschränkt. Die Angabe `scope` aus dem Client ist keine Berechtigung. Ohne Schlüssel wird kein Audio erzeugt. Der serverseitige Audit-Eintrag enthält Metadaten (Scope, Stimme, Textlänge, Erfolg oder Fehler), nicht den gesprochenen Text. Der Dienst bewertet jedoch **nicht automatisch den Bedeutungsinhalt** des Textes. Für eine umfassende militärische Missbrauchssperre sind zusätzliche vertrauenswürdige Inhaltsmoderation, Identitätskontrollen und verpflichtende Durchsetzung an allen Aktionen notwendig. Den Dienst nur hinter HTTPS, Authentifizierung und Ratenbegrenzung öffentlich anbieten.

## Meta-Integration

`core/meta_speak_bridge.mjs` erzeugt das Payload-Format einer Meta-Messenger-Audionachricht **ohne sie zu senden**. Für den tatsächlichen Versand brauchst du einen gültigen Meta Page Access Token, `pages_messaging`, einen berechtigten Empfänger im Messenger-Nachrichtenfenster und eine **öffentlich zugängliche HTTPS-Audio-URL**. Der private API-Endpunkt mit geheimem Header ist nicht direkt als Anhangs-URL verwendbar. Zur Veröffentlichung bei Facebook oder Instagram sind zusätzliche Video-/Publishing-Verfahren und Berechtigungen nötig; eine isolierte WAV-Datei ist kein automatisch veröffentlichbarer Reel. Meta AI selbst wird dadurch nicht umprogrammiert. Es erfolgt keinerlei automatische Veröffentlichung.
