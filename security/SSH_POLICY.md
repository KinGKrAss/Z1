# Z1/Lion SSH-Key-Architektur

Für Z1/Lion ist die SSH-Struktur strikt getrennt: Entwicklung, Automatisierung, Produktionsserver und Android-Gerätezugriff bekommen niemals denselben Schlüssel.

Ziel: Ein kompromittierter Schlüssel darf nicht das komplette System gefährden.

## Architektur

```text
Z1-Lion/
├── GitHub
│   └── z1-dev-ed25519
├── Cloud / Server
│   ├── z1-prod-ed25519
│   ├── z1-staging-ed25519
│   └── z1-backup-ed25519
├── Android Control Device
│   └── z1-android-ed25519
└── CI/CD Automation
    └── z1-actions-ed25519
```

## 1. GitHub Schlüssel (Entwicklung)
**Name:** `~/.ssh/id_ed25519_z1_github`
**Verwendung:** 
- Repository KinGKrAss/Lion
- Repository KinGKrAss/Z1
- Pull Requests
- Codeverwaltung

## 2. Produktionsserver Schlüssel
**Name:** `~/.ssh/id_ed25519_z1_prod`
**Server:** `/home/z1/.ssh/authorized_keys`
Nur dieser Schlüssel darf:
- Backend starten
- Datenbanken verwalten
- Z1 Core aktualisieren

## 3. Staging/Test-System
**Name:** `~/.ssh/id_ed25519_z1_stage`
Darf: 
- neue Features testen
- Datenbanken spiegeln
- KI-Agenten testen
Darf NICHT: 
- Produktionsdaten ändern

## 4. Android Z1 Control App
**Name:** `~/.ssh/id_ed25519_z1_android`
Einsatz: `Android App -> SSH Tunnel -> Z1 API Gateway -> Backend`
Empfehlung: Android bekommt nur API-Zugriff, Tunnelrechte, keine Root-Rechte.

## 5. GitHub Actions / Automatisierung
**Name:** `~/.ssh/id_ed25519_z1_ci`
Nur für: automatische Builds, APK-Erstellung, Tests, Deployment.
Nicht für manuellen Login verwenden.

## SSH-Agent Struktur
Auf dem Entwicklungsgerät:
```bash
ssh-add ~/.ssh/id_ed25519_z1_github
ssh-add ~/.ssh/id_ed25519_z1_stage
```
Produktions-Key nur bei Bedarf:
```bash
ssh-add ~/.ssh/id_ed25519_z1_prod
```

## Empfohlene Z1-Schlüsselmatrix

| Schlüssel | Gerät | Zugriff |
| :--- | :--- | :--- |
| `z1_github` | Entwickler-PC | GitHub |
| `z1_stage` | Testserver | Entwicklung |
| `z1_prod` | Admin-System | Produktion |
| `z1_android` | Smartphone | Control Panel |
| `z1_ci` | GitHub Actions | Automatisierung |

## Rechte setzen
Private Keys:
```bash
chmod 600 ~/.ssh/id_ed25519_*
```
SSH-Ordner:
```bash
chmod 700 ~/.ssh
```
