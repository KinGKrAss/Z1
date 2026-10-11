# Z1 Speak – Browser Command Center

Ein mobiloptimiertes, eigenständiges Frontend für die bereits existierende Z1-Speak-Server-API. Erreichbar unter `/speak.html`, sofern die Z1-Web-App entsprechend gebaut und bereitgestellt ist. Die bestehende Startseite wird nicht ersetzt.

## Arbeitsweise

Die Seite benutzt `window.speechSynthesis` und `SpeechSynthesisUtterance` für eine **lokale** Vorlesefunktion. Die tatsächlich verfügbare Stimme richtet sich nach Browser und Gerät (etwa Android Chrome). Es gibt Sprachwahl Deutsch/Englisch, Start/Stopp, eine Textlängenbegrenzung und eine Scope-Auswahl mit prüfbarer unbekannter Kategorie.

`speak-ui-policy.mjs` enthält eine clientseitige Nachbildung der Aktionskategorien aus `Z1-PEACE-001`. Diese lokale Prüfung kann von einem Nutzer manipuliert werden und ist **keine verbindliche serverseitige Enforcement-Instanz**. Das UI bewertet außerdem nicht den Inhalt des eingegebenen Textes. Für geschützte Backend-Verarbeitung gelten `core/humanitarian_policy.mjs` und `runtime/z1-speak-api.mjs`; API-Schlüssel gehören nie in Browsercode.

## Audit

Die Ansicht zeigt nur lokale Ereignisse `z1_speak_request`, `z1_speak_denied`, `z1_speak_completed`, `z1_speak_stopped` und `z1_speak_error`. Die Liste bleibt im Arbeitsspeicher des Tabs, speichert **keine Texte** und wird beim Schließen gelöscht. Das serverseitige, persistente JSONL-Audit des Node-Speak-Dienstes ist hiervon ausdrücklich getrennt.

## Installation / Prüfung

`npm install`, `npm run dev`, anschließend `/speak.html` aufrufen. Für Deployment `npm run build` und die erzeugte `dist/speak.html` gemeinsam mit den Assets veröffentlichen. Ein Abnahmetest auf einem echten Android-Gerät ist erforderlich, denn Web Speech wird nicht von allen Browsern gleich unterstützt.

`npm run test:speak-ui` prüft die browserseitigen Scope- und Eingaberegeln. `npm run test:speak` prüft den separaten serverseitigen Dienst.

Der Ursprungstext im Chat war ein **abgeschnittener kompilierter React-Ausschnitt**, keine vollständig importierbare Quelldatei. Deshalb wurde eine lesbare, eigenständige Oberfläche nach der beschriebenen Funktion rekonstruiert, nicht die minifizierte Version unverändert übernommen.

**Meta:** Diese Seite ist nicht mit Meta AI verbunden und sendet nichts an Facebook, Instagram oder Messenger. Hierfür ist eine gesondert autorisierte Meta-Integration nötig.
