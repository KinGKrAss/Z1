# Z1 Browser Deployment

## Ziel

Z1 bekommt eine getrennte Browser- und Runtime-Struktur:

```text
Browser
  -> GitHub Pages (statische React/Vite-Oberfläche)
  -> Z1 API / Runtime (separater Server)
  -> Gitta / Textract / Z1 Core
```

GitHub Pages ist für die statische Browseroberfläche geeignet. Es hostet keine serverseitigen Python-/Node-Prozesse; die Z1-API bleibt deshalb außerhalb von Pages.

## Browser URL

Für `KinGKrAss/Z1` ist die projektbezogene Pages-URL nach erfolgreichem Deployment:

```text
https://kingkrass.github.io/Z1/
```

Die Vite-Produktionsbasis ist dafür auf `/Z1/` gesetzt.

## Deployment

`.github/workflows/z1-pages.yml` führt bei Pull Requests einen Type-Check und Browser-Build aus. Nach einem Push auf `main` wird das `dist/`-Artefakt zusätzlich über GitHub Pages veröffentlicht.

Damit wird ein fehlerhafter Browser-Build vor dem Deployment erkannt.

## API-Verbindung

Die Browseroberfläche und die Z1-API sind bewusst getrennt. Für einen echten produktiven API-Zugang muss eine HTTPS-API-Adresse als Deployment-Konfiguration hinterlegt werden; GitHub Pages darf nicht als Backend missverstanden werden.

Empfohlene Produktionsarchitektur:

```text
https://kingkrass.github.io/Z1/
          |
          | HTTPS
          v
Z1 API / Control Plane
          |
          +-- Gitta / Textract
          +-- Z1 Core
          +-- Asset Validation
```

## Stabilität

Die Browseroberfläche selbst hat keinen festen Port wie `8088` oder `8443`. GitHub Pages stellt HTTPS bereit. Ein separater API-Port bleibt eine Server-/Deployment-Frage.

Für die API sollten zusätzlich Health-Checks, Keepalive, kontrollierte Timeouts und Client-Reconnect verwendet werden.
