# Z1 SSH Key Rotation Policy

Alle SSH-Schlüssel im Z1/Lion-Ökosystem unterliegen einem strikten Rotations- und Lebenszyklus-Management.

## Intervalle
- **Reguläre Rotation:** Alle 180 Tage.
- **Bei Kompromittierung:** Sofortiger Austausch und Sperrung aller betroffenen Schlüssel in den `authorized_keys` und Systemen.

## Prozess
1. Generierung eines neuen ed25519 Schlüssels.
2. Registrierung des neuen Schlüssels in den entsprechenden `authorized_keys`.
3. Verteilung an das jeweilige System/Gerät.
4. Testen der neuen Verbindung.
5. Löschen und Deaktivieren des alten Schlüssels in allen Systemen.
