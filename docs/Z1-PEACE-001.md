# Z1-PEACE-001 — humanitäre Richtlinie für angebundene KI-Modelle

Z1 unterstützt den Schutz menschlichen Lebens und der Zivilbevölkerung, Friedensvermittlung,
Bildung, Katastrophenschutz, humanitäre Hilfe und neutrale, quellensensible Berichte.
Waffensteuerung, Zielauswahl, Angriffsplanung, Waffenoptimierung und autonome
Gewaltausübung bleiben gesperrt. Unbekannte Einsatzkategorien verlangen eine gesonderte
Prüfung und werden zunächst abgelehnt.

## Modellübergreifende, serverseitige Implementierung

- Kanonische Aktionsprüfung: `core/humanitarian_policy.mjs`
  (`evaluateHumanitarianAction`, `requireHumanitarianAction`).
- Text-only-Gateway: `core/model_policy_gateway.mjs`.
- Autorisierte Workflows: `runtime/z1-ai-api.mjs`, angebunden an `runtime/z1-api.mjs`.
- Provider: OpenAI Responses API, xAI/Grok Chat Completions,
  Anthropic/Claude Messages API und Google/Gemini generateContent;
  außerdem DeepSeek, Alibaba Qwen (US-Region), Moonshot Kimi, Z.AI GLM,
  Mistral und Cohere v2 Chat.
- Jede Provider-Anfrage erhält dieselbe humanitäre System- bzw. Entwickleranweisung.
  Modell-ID muss in der anbieterspezifischen Allowlist stehen.
  API-Schlüssel kommen ausschließlich aus Server-Umgebungsvariablen.
- Keine clientseitige Aktionseinstufung, freien Tool-Definitionen, benutzerdefinierten
  Provider-URLs oder automatischen externen Tool-Aufrufe.
- Die festen API-Routen wählen die vertrauenswürdige Aktion. Freie Benutzereingaben
  werden nicht als sicher klassifiziert. Nur eng begrenzte, strukturierte Felder
  werden in feste und auf zivile Zwecke begrenzte Vorlagen eingesetzt.
- Audit-Pflicht vor jedem Provider-Aufruf sowie Erfolgs-/Fehler-Audit. Eine
  fehlgeschlagene Audit-Freigabe verhindert den Netzwerkaufruf. Es werden nur
  Metadaten und ein SHA-256-Hash der Anfrage, keine Prompts, Antworten oder
  Anbieter-Zugangsschlüssel, protokolliert.
- Die Ausgabe ist ein **Textvorschlag**, keine Freigabe für medizinische,
  finanzielle, polizeiliche oder militärische Entscheidungen.

## Zusätzliche humanitäre Z1-Finanzregel

Die Modelleinweisung verweist auf die Z1-Sozialregel: alle drei Monate 25 % des
**tatsächlich erwirtschafteten und nachweisbaren** Cashflows für ein gemeinsames
Hilfsbudget über **Deutsches Rotes Kreuz und Malteser**, nach Bedarf in Deutschland,
Europa und weltweit, ohne starre 50/50-Aufteilung. Diese Information legitimiert
**keine** automatischen Zahlungen, verfügt nicht über Finanzkonten und ersetzt
keine gesonderte Cashflow-Verifikation oder Z1-Ledger-Freigabe.

## Sichere Inbetriebnahme

1. Im privaten Runtime-Secret-Store `Z1_MODEL_GATEWAY_TOKEN` setzen; bei fehlendem
   Token sind die Routen deaktiviert.
2. Nur für ausdrücklich freigegebene Anbieter `OPENAI_API_KEY`, `XAI_API_KEY`,
   `ANTHROPIC_API_KEY` beziehungsweise `GEMINI_API_KEY` konfigurieren.
3. Exakt erlaubte Modell-IDs komma-separiert in `Z1_OPENAI_MODELS`,
   `Z1_XAI_MODELS`, `Z1_ANTHROPIC_MODELS` und `Z1_GEMINI_MODELS` eintragen.
   Ein nicht gelistetes Modell wird abgelehnt. Es gibt keine pauschale
   Freischaltung unbekannter/neuer Modelle.
4. Für weitere freigegebene Anbieter nur im geheimen Deployment-Store konfigurieren:
   `DEEPSEEK_API_KEY`, `DASHSCOPE_API_KEY`, `MOONSHOT_API_KEY`,
   `ZAI_API_KEY`, `MISTRAL_API_KEY`, `COHERE_API_KEY`.
   Zugehörige Modell-Allowlisten: `Z1_DEEPSEEK_MODELS`, `Z1_QWEN_MODELS`,
   `Z1_KIMI_MODELS`, `Z1_ZHIPU_MODELS`, `Z1_MISTRAL_MODELS`,
   `Z1_COHERE_MODELS`. Die Qwen-Anbindung verwendet einen offiziellen
   US-Region-Endpunkt und benötigt einen passenden Regional-Schlüssel; für
   chinesische und andere Datenregionen muss ein gesondert geprüfter Adapter
   ergänzt werden.
5. Optional `Z1_MODEL_AUDIT_PATH` auf ein geschütztes, dauerhaftes Volume setzen.
   Standard: `data/z1_model_audit.jsonl`. Keine Zugangsschlüssel ins Git-Repository!
6. Laufzeit starten: `npm run z1:api` (standardmäßig localhost:3001).
   Geschützte Modellliste: `GET /api/z1/ai/providers`.
   Authentifizierung jeweils über `Authorization: Bearer <Z1_MODEL_GATEWAY_TOKEN>`.
7. Zugelassene feste Zwecke per `POST`: `/api/z1/ai/disaster-brief`,
   `/api/z1/ai/civilian-guide`, `/api/z1/ai/peace-mediation`.
   Anfrage beispielsweise:
   `{"provider":"openai","model":"<allowlisted-id>","region":"Muenster","hazard":"flood"}`.
   Gültige Gefahrenarten: `earthquake`, `flood`, `storm`, `wildfire`,
   `heatwave`, `drought`, `other`.
8. Tests ohne API-Schlüssel und ohne echte Provider-Aufrufe:
   `node --test tests/humanitarian_policy.test.mjs tests/model_policy_gateway.test.mjs tests/z1-ai-api.test.mjs`.

## Wichtige Grenzen

Diese Richtlinie wirkt **nur auf Aufrufe, die über den Z1-Gateway laufen**.
Sie verändert weder die globalen Gewichte oder Sicherheitsrichtlinien von OpenAI,
Grok oder anderen KI-Anbietern noch ihre Consumer-Apps. Auch Systemanweisungen
garantieren keine perfekte Sicherheit gegen Prompt Injection; vor umfassender
Produktionsfreigabe sind eine unabhängige Inhaltsklassifikation, Tests für Missbrauch,
Ergebnisprüfung, Rechte-/Mandantentrennung und menschliche Aufsicht erforderlich.
Bestehende Anbieter-Sicherheitsanforderungen haben weiterhin Gültigkeit.

Die API zeigt die Grundrichtlinie lesend unter `GET /api/z1/peace-policy`.
Die Absicherung aller übrigen Z1-Modul- und Tool-Pfade ist **nicht** durch
diesen Gateway erledigt; dort sind eigene verpflichtende Policy-Checks notwendig.

## Internationale freiwillige Einladung

Die öffentlich verlinkte Einladung liegt in
[AI_HUMANITARIAN_OPEN_INVITATION_2026.md](AI_HUMANITARIAN_OPEN_INVITATION_2026.md)
auf Deutsch, Englisch und Chinesisch. Sie ist ein **freiwilliger Vorschlag**,
keine amtliche Anordnung und kein Nachweis, dass andere Betreiber ihre
Modelle geändert oder dem Vorschlag zugestimmt haben. Die Z1-interne
Spendenregel ist kein allgemeines Gebot für fremde Anbieter.
