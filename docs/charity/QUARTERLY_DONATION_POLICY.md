# Z1 — Quartals-Spendenregel

Z1 reserviert zum Ende jedes Kalenderquartals 25 % des **realisierten positiven Cashflows aus erwirtschafteten Einnahmen** für gemeinnützige Zwecke.

Die 25-%-Quote wird zu gleichen Teilen aufgeteilt:

- 12,5 % des anrechenbaren Cashflows für das Deutsche Rote Kreuz (DRK)
- 12,5 % des anrechenbaren Cashflows für die Malteser

Für die Berechnung werden keine unrealisierten Kursgewinne, reine Bilanzwertsteigerungen oder bereits ausgegebenen Mittel als Cashflow angesetzt.

## Governance

Z1 erzeugt eine prüfbare Quartalsverpflichtung mit Quartal, Berechnungsbasis, Quote, Gesamtbetrag, Empfängeraufteilung, Währung und Status.

Der Status startet mit `PENDING_APPROVAL`.

Z1 führt **keine automatische Überweisung** aus. Die tatsächliche Zahlung bleibt eine autorisierte Finanzaktion und muss vor Ausführung geprüft und freigegeben werden. Dadurch bleibt die Regel auditierbar und verhindert eine unbeabsichtigte oder doppelte Zahlung.

## Beispiel

Bei 100.000 EUR anrechenbarem realisiertem positivem Quartals-Cashflow:

Gesamtspende: 25.000 EUR.

DRK: 12.500 EUR.

Malteser: 12.500 EUR.

Die Berechnung ist in `z1/finance/charity_policy.py` implementiert und durch Tests abgesichert.
