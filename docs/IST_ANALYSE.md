# IST-Analyse: Altenheim Avatar

Stand: 2026-03-01

## 1) Aktueller Technologie-Stack

- Monorepo mit npm workspaces
- Frontend: React 19, React Router 7, TypeScript, Vite 6
- Backend: Node.js, Express 5, TypeScript
- Datenbank: PostgreSQL + Drizzle ORM/Drizzle Kit
- Auth: JWT (`jsonwebtoken`), Passwort/PIN-Hashing mit `bcrypt`
- LLM: Anthropic SDK (Claude Modelle, Streaming)
- Tests: Vitest + Supertest (aktuell wenige Security-Guard Tests)
- Deployment-Hinweise: Docker Compose vorhanden, aber keine produktionsreife IaC/ops-Dokumentation

## 2) Ordnerstruktur (relevant)

- `apps/web`: React-Webapp (Resident + Staff UI)
- `apps/server`: Express-API, DB-Schema, Seed, Routen
- `packages/shared`: geteilte Typen
- `legacy`: alte Implementierung (nicht Teil der neuen Produktbasis)

## 3) Entrypoints

### Frontend

- `apps/web/src/main.tsx`: React Root + Router + AuthProvider
- `apps/web/src/App.tsx`: Routing-Entscheidung nach Rolle (`resident` vs staff)

### Backend

- `apps/server/src/index.ts`: Env-Validierung + API-Key-Pflicht + App Start
- `apps/server/src/app.ts`: Middleware, Rate Limits, Route-Mounts

## 4) Aktuelle Features

- Resident Login via `facilitySlug + PIN`
- Staff Login via `email + password`
- Rollenbasiertes Routing in der UI
- Chat mit SSE-Streaming (Bewohner- und Pflegermodus)
- Basis-Biografie-Verwaltung (CRUD)
- Bewohner-Verwaltung (CRUD/Soft Delete)
- Gesprächshistorie abrufbar/beendbar
- Basis-Dashboard (Bewohnerliste)
- Avatar mit auswählbarem Stil (frontendseitig, lokal gespeichert)

## 5) Architektur-Ueberblick

```text
[React Web App]
  |- AuthContext (token in localStorage)
  |- Pages: ResidentLogin, Login, Chat, Dashboard
  |- API client (/api/*)
        |
        v
[Express API]
  |- Middleware: helmet, cors, rate-limit, JWT auth, role checks
  |- Routes:
      /api/auth
      /api/residents
      /api/biographies
      /api/chat (SSE)
      /api/conversations
        |
        v
[Safety currently embedded in prompts only]
        |
        v
[Anthropic Claude API]

[PostgreSQL + Drizzle]
  |- facilities, users, residents
  |- biographies, conversations, messages
  |- family_links, usage_stats
```

## 6) Auth, RBAC, Datenmodell, API-Routen (IST)

### Auth/RBAC

- JWT mit Rollen: `admin`, `caregiver`, `family`, `resident`
- `requireAuth` + `requireRole` Middleware vorhanden
- Resident hat reduzierte Rechte, staff erweitert
- Multi-Tenant-Grundlage via `facilityId` vorhanden

### Datenmodell (IST)

- Tabellen: `facilities`, `users`, `residents`, `biographies`, `conversations`, `messages`, `family_links`, `usage_stats`
- Noch fehlend fuer Zielbild: `mood_entries`, `escalation_events`, `consent_records`, `audit_log`, `settings/guardrails config`

### API-Routen (IST)

- `GET /health`
- `POST /api/auth/login`
- `POST /api/auth/resident-login`
- `GET/POST/PUT/DELETE /api/residents`
- `GET/POST/PUT/DELETE /api/biographies`
- `POST /api/chat` (SSE)
- `GET /api/conversations/...`, `POST /api/conversations/:id/end`

## 7) Security- und Privacy-Risiken (priorisiert)

1. Safety Layer nicht zentral erzwungen
- Sicherheitsregeln stecken im Prompttext, nicht in harter Serverlogik.
- Risiko: Modell kann in Grenzfaellen unerwuenschte Inhalte liefern.

2. Keine formale Eskalations-Pipeline
- Kein `EskalationEvent`, keine Staff-Queue, kein Notfall-Dispatch.
- Risiko: kritische Signale werden nicht technisch abgesichert verarbeitet.

3. Datenminimierung/Retention nicht implementiert
- Volle Nachrichtentexte werden gespeichert, keine Loeschfristen/Redaktion.
- Risiko: uebermaessige Datenspeicherung, Compliance-Luecken.

4. Consent unvollstaendig
- `family_links.consentGiven` ist zu grob.
- Kein Nachweis fuer Zweck, Umfang, Zeitstempel, Widerrufshistorie.

5. Audit Trail fehlt
- Staff-Aktionen (CRUD/Biografie/Settings) werden nicht revisionssicher protokolliert.

6. Token-Speicherung in `localStorage`
- Erhoehtes XSS-Risiko (statt HttpOnly-Cookies + CSRF-Konzept).

7. Fehlende harte Trennung sensibler Datenzugriffe
- Family-Rolle ist im Token vorhanden, aber kaum feingranulare Endpunktpolitik sichtbar.

8. Secrets/Operational Hardening
- API-Key ist Startvoraussetzung, aber es fehlt dokumentiertes Secrets-Management, Rotation, KMS-Strategie.

9. Encoding/UX-Textqualitaet
- Mehrere Mojibake/Placeholder-Fehler in UI-Texten (`â€¦`, `?` statt `...`).
- Risiko: Vertrauensverlust bei Senioren und Pflegepersonal.

## 8) UX-Bewertung fuer 80+ Nutzer

Positiv:
- Groessere Buttons/Typografie vorhanden
- Klare Resident-Login-Route
- Fokus-Styles und reduzierte Navigation in Chat

Probleme:
- Resident Startflow nicht als 3-Kachel-Home (Talk/Activities/Help)
- Facility-Slug + PIN ist fuer manche Bewohner zu komplex
- Kein prominenter "Ich brauche jetzt Hilfe"-Button
- Kein Voice-first End-to-End Flow (nur Basiselemente, keine robuste UX-Fuehrung)
- Fehlertexte teilweise technisch/inkonsistent
- Keine klar sichtbaren Transparenz-/Nicht-Medizin-Hinweise im Resident-Flow
- Kein "Read aloud" Schalter

Klick-/Flow-Sicht:
- Resident: Login -> Chat direkt (kein Home Hub)
- Staff: Login -> Dashboard (rudimentaer, keine Eskalationsqueue/Mood Trends)

## 9) Gap-Analyse vs Zielanforderungen

### A) Senior UI (Tablet first)
- Teilweise vorhanden: grosse UI-Elemente
- Fehlt: Home mit 3 Primaraktionen, read-aloud, klarer Voice-first Pfad, vereinfachter Kioskmodus

### B) Guardrails + Escalation
- Teilweise vorhanden: Prompt-Sicherheitsregeln
- Fehlt: serverseitiger Safety Layer, Trigger-Engine, Eskalationsmodell, Staff-Benachrichtigung

### C) Biography / Memory
- Vorhanden: Biografie CRUD
- Fehlt: feingranulare Consent-/Zwecksteuerung und Transparenzanzeige

### D) Mood Check
- Fehlt komplett: Datenerfassung, Trends, Staff-UI

### E) Help / Emergency
- Fehlt komplett: SOS-Button, Notfallkanal, Queue

### F) Staff Dashboard MVP
- Teilweise vorhanden: Bewohnerliste
- Fehlt: Eskalationsqueue, Mood Trends, Biografie-Editor UX, Settings (Topics/Quiet Hours/Retention)

## 10) Testabdeckung (IST)

- Vorhanden: einzelne API-Security-Guard Tests (`apps/server/tests/security.routes.test.ts`)
- Fehlend: Safety-Layer-Unit-Tests, RBAC-Matrix-Tests, Eskalationsflows, Frontend-Flow/E2E, Retention-/Consent-Tests

## 11) Fazit

Die Codebasis ist ein guter funktionaler Prototyp mit Multi-Tenant-Ansatz und Basis-RBAC, aber noch nicht produktionsreif fuer einen sensiblen Senior-Care-Kontext. Hauptluecken liegen in zentraler Safety-Architektur, Eskalation, Datenschutz-Compliance, Auditierbarkeit und seniorengerechtem Produktfluss.
