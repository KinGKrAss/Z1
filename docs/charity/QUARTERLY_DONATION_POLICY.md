# Z1 — Quartals-Spendenregel

Zum Ende jedes Kalenderquartals werden 25 % des belegten, realisierten positiven
Cashflows aus erwirtschafteten Einnahmen als Hilfsbudget reserviert. Vermögenswerte,
unrealisierte Gewinne und reine Bilanzsteigerungen sind keine Berechnungsbasis.
Die Berechnung verwendet EUR, Decimal und kaufmännische Cent-Rundung.

DRK und Malteser erhalten Mittel nach dokumentiertem Bedarf. Es gibt keine feste
50/50-Verteilung und keine automatische Vergabe von Restcents. Ohne Aufteilung
bleibt das Gesamtbudget reserviert (`allocations={}`). Eine explizite Aufteilung
muss beide Empfänger enthalten, nichtnegative volle Centbeträge verwenden und
exakt dem Budget entsprechen. Auch eine Nullzuweisung ist möglich.

## Quartalsabschluss

`build_core()` bindet den Handler für `finance.quarter.closed` ein. Der autorisierte
Finanzprozess sendet nach Abschluss und Abstimmung des Quartals beispielsweise:

```python
await core.dispatch('finance.quarter.closed', {
    'scope': 'royal-krass-group',
    'period_end': '2026-09-30',
    'realized_cashflow': '100000.00',
    'currency': 'EUR',
    'source_refs': ['ledger:2026-Q3:approved-close'],
    'allocations': {'DRK': '20000.00', 'Malteser': '5000.00'},
    'allocation_reason': 'Dokumentierter Bedarf im Quartal',
})
```

Nur 31.03., 30.06., 30.09. und 31.12. sind zulässig. Der gesamte Abschlusstag muss
vorbei sein (UTC). Quellenreferenzen sind verpflichtend. Der Handler überprüft
nicht die Echtheit externer Belege: deren Abstimmung und Zugriffsschutz gehören
zum aufrufenden Finanzprozess. Ein Bank- oder Buchhaltungsdatenimport und ein
zeitgesteuerter Abschlussjob sind damit nicht eingerichtet.

Verpflichtung und vollständiger Audit-Eintrag werden atomar in `charity.sqlite3`
im Verzeichnis des konfigurierten Core-Auditlogs gespeichert. Dieses Verzeichnis
muss produktiv auf einem dauerhaften Datenträger liegen. Der eindeutige Schlüssel
besteht aus Geltungsbereich, Quartal und Währung. Identische Wiederholungen sind
wirkungslos; abweichende Wiederholungen erfordern eine gesonderte Abstimmung.
Der Audit-Eintrag enthält Quellen, Basis, Quote, Betrag, Aufteilung und Status
`PENDING_APPROVAL`. Auch Nullbudgets werden für die Abschlussvollständigkeit erfasst.

Es gibt keine automatische Überweisung. Freigabe und Zahlung sind nachgelagerte,
autorisierte Finanzaktionen. `PENDING_APPROVAL` belegt keine Zahlung oder Freigabe.

## Tests

`npm run test:core` führt alle Python-Tests über unittest aus; die Charity- und
Trust-Wallet-Tests sind mit diesem Runner kompatibel. Finanztests prüfen Datum,
Beträge, Aufteilung, Wiederholungen, Neustarts und dauerhafte Audit-Einträge.
