# Z1-PEACE-001 — humanitäre Friedensrichtlinie

Z1 unterstützt Friedensvermittlung, Bildung, Katastrophenschutz und humanitäre Hilfe. Einsatz zur Waffensteuerung, Zielauswahl, Angriffsplanung oder autonomen Gewaltausübung ist untersagt.

Die zentrale Auswertungsfunktion ist `evaluateHumanitarianAction`. Intern vertrauenswürdig klassifizierte Aktionen müssen vor Ausführung mit `requireHumanitarianAction(trustedAction, auditLogger)` geprüft werden. Unbekannte Kategorien werden abgelehnt. Clientseitig behauptete Kategorien sind **niemals** eine Freigabe.

Die API zeigt die Richtlinie lesend unter `GET /api/z1/peace-policy` und listet das Modul auf. Das allein ist **keine** vollständige Absicherung aller Z1-Module. Jeder KI-Tool-Aufruf und jede ausgehende Aktion muss serverseitig an die Funktion angebunden und revisionssicher protokolliert werden. Die Richtlinie verändert nicht ChatGPT oder fremde KI-Modelle.

Test: `node --test tests/humanitarian_policy.test.mjs`.
