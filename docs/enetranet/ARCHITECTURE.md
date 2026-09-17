# Z1 Entranet Backbone

## Ziel

Geschlossenes Z1-Backbone für interne Dienste. Das Design verhindert unbeabsichtigtes Internet-Routing und trennt Netzwerkidentität, Dienstidentität und Secrets.

## Adressierung

- IPv4: `10.42.0.0/16`
- Core: `10.42.0.0/24`
- Services: `10.42.10.0/24`
- Management: `10.42.20.0/24`
- WireGuard: `10.42.30.0/24`
- Kein Default-Gateway auf isolierten Backbone-Knoten.
- IPv6 muss entweder vollständig intern geroutet oder auf den betroffenen Interfaces deaktiviert werden; kein unkontrollierter IPv6-Uplink.

## Sicherheitsmodell

1. Default-deny Firewall.
2. Nur explizit erlaubte interne Ports.
3. WireGuard für verschlüsselte Node-zu-Node-Verbindungen.
4. Private Schlüssel verbleiben auf dem jeweiligen Knoten.
5. Keine Secrets in Git.
6. Dienst-Credentials kommen aus Environment/Secret-Store und werden nicht in Quellcode oder normalen Konfigurationsdateien committed.
7. Z1 Auth prüft Identität, Rolle und Berechtigung vor dem Zugriff.
8. Sicherheitsrelevante Ereignisse werden auditiert.

## Verifikation

Der Backbone ist erst abgenommen, wenn folgende Tests erfolgreich sind:

- interne Knoten erreichen sich über die freigegebenen Netze;
- externe DNS/IP-Ziele sind vom isolierten Segment nicht routbar;
- keine unerwartete Default-Route vorhanden;
- WireGuard-Peers sind nur mit hinterlegten Public Keys erreichbar;
- nicht autorisierte Dienste werden abgewiesen;
- Authentifizierungsfehler werden protokolliert;
- keine privaten Schlüssel oder API-Secrets erscheinen in Logs, Health-Endpunkten oder Repository-Inhalten.

## Deployment-Hinweis

Dieses Repository-Change definiert die reproduzierbare Konfiguration und Prüfregeln. Die tatsächliche Netztrennung muss auf den physischen/virtuellen Hosts, Firewalls und Switches umgesetzt und anschließend vor Ort bzw. auf den Zielsystemen verifiziert werden.
