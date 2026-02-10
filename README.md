# Anni — KI-Begleiterin für Altenheim-Bewohner

Anni ist eine freundliche KI-Avatar-Begleiterin, die mit älteren Menschen in Altenheimen spricht. Sie hört zu, antwortet in einfacher Sprache und kann auch von Pflegepersonal genutzt werden.

## Features

- **Sprachgesteuert** — Spracheingabe und Sprachausgabe auf Deutsch (Web Speech API)
- **Animierter Avatar** — SVG-Gesicht mit Blinzeln, Atmen und Lippenbewegung
- **Zwei Modi:**
  - **Bewohner-Modus** — Warme, einfache Sprache. Geduldiger Umgang mit Wiederholungen und Verwirrtheit.
  - **Pfleger-Modus** — Strukturierte Antworten, Hilfe bei Dokumentation und Übergabeberichten.
- **Streaming-Antworten** — Text erscheint Wort für Wort
- **Barrierefreiheit** — WCAG AA Kontrast, ARIA-Attribute, einstellbare Schriftgröße und Sprechgeschwindigkeit
- **Hilfe-Button** — Immer sichtbar, signalisiert Pflegepersonal
- **Offline-Erkennung** — Hinweis wenn keine Internetverbindung besteht
- **Session-Persistenz** — Chat-Verlauf bleibt beim Neuladen erhalten

## Tech-Stack

| Technologie | Einsatz |
|---|---|
| Node.js + Express 5 | Backend-Server |
| Anthropic Claude API | KI-Antworten (Haiku für Bewohner, Sonnet für Pfleger) |
| Web Speech API | Spracheingabe (STT) und Sprachausgabe (TTS) |
| SVG + JavaScript | Animierter Avatar |
| Vanilla HTML/CSS/JS | Frontend (keine Frameworks) |

## Voraussetzungen

- **Node.js** >= 18.0.0
- **Anthropic API Key** — [Hier erstellen](https://console.anthropic.com/)
- **Chrome/Edge** empfohlen (beste Sprachunterstützung)

## Installation

```bash
# Repository klonen
git clone https://github.com/Lengi96/altenheim-avatar.git
cd altenheim-avatar

# Abhängigkeiten installieren
npm install

# Umgebungsvariablen konfigurieren
cp .env.example .env
# Dann .env öffnen und ANTHROPIC_API_KEY eintragen

# Server starten
npm start
```

Dann im Browser öffnen: **http://localhost:3000**

## Konfiguration

| Variable | Beschreibung | Standard |
|---|---|---|
| `ANTHROPIC_API_KEY` | Dein Anthropic API-Schlüssel | (erforderlich) |
| `PORT` | Server-Port | `3000` |

## Sicherheit

- **Helmet** — Security-Header (CSP, X-Frame-Options, etc.)
- **Rate-Limiting** — Max. 15 Anfragen pro Minute
- **Input-Validierung** — Nachrichtenlänge und Modus werden geprüft
- **Body-Size-Limit** — Max. 10KB pro Anfrage
- **API-Key** wird nur serverseitig verwendet, nie an den Browser gesendet

## Pfleger-Modus

Der Pfleger-Modus ist versteckt, um Bewohner nicht zu verwirren. Zugang:

1. **3 Sekunden lang** auf den Avatar tippen/klicken
2. Modus-Umschalter erscheint
3. Bestätigungsdialog vor dem Wechsel

## Lizenz

ISC
