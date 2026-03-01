# Target Architecture: Production-Ready Senior Companion

Stand: 2026-03-01

## 1) Leitprinzipien

- Safety first: kein medizinischer Rat, klare Eskalation bei Risikoindikatoren
- Privacy by design: Datenminimierung, Zweckbindung, Retention
- Senior-first UX: tablet-first, einfache Sprache, max 3 Navigationsebenen
- Transparenz: Assistent ist digital, nicht menschlich; Grenzen klar sichtbar
- Multi-tenant by default: Facility-Isolation auf Daten- und Zugriffsebene

## 2) Zielmodule und Verantwortlichkeiten

```text
[apps/web]
  |- resident-app
  |   |- Home (Talk / Activities / Help)
  |   |- Chat UI + read aloud + voice input
  |   |- Mood check
  |
  |- staff-app
      |- Residents overview
      |- Escalation queue
      |- Mood trends
      |- Biography editor
      |- Settings

[apps/server]
  |- auth-service (JWT/session, RBAC, tenant scoping)
  |- resident-service
  |- biography-service
  |- mood-service
  |- escalation-service
  |- safety-layer (input/output policy engine)
  |- chat-orchestrator (LLM calls through safety layer)
  |- audit-service
  |- consent-service
  |- retention-jobs

[storage]
  |- Postgres (tenant-scoped data, audit, consent, events)
  |- optional queue/notification adapter (email/SMS/push)

[external]
  |- LLM provider (Claude)
  |- optional notification providers
```

## 3) Modulgrenzen (Backend)

- `safety-layer` (zentral, verpflichtend)
  - Eingangs-Klassifikation (Rule-based + optional classifier)
  - Policy-Entscheidung: allow, safe-answer, refuse, escalate
  - Ausgangs-Pruefung (z. B. medizinische Anweisung blocken)

- `chat-orchestrator`
  - Kein direkter LLM-Call ohne Safety Layer
  - Kontextaufbereitung (nur consented + minimal Daten)

- `escalation-service`
  - Erstellt `escalation_events`
  - Leitet an Staff-Queue/Benachrichtigung weiter
  - Fuehrt idempotente Zustandsmaschine (`new -> acknowledged -> resolved`)

- `consent-service`
  - Zweckbezogene Consent-Pruefung vor Personalisierung
  - Historisierung inkl. Widerruf

- `audit-service`
  - Protokolliert alle staff-kritischen Aktionen

- `retention-jobs`
  - Loeschung/Anonymisierung nach Policy

## 4) Datenmodell (Ziel)

Bestehend weiterverwenden/erweitern:
- `facilities`, `users`, `residents`, `biographies`, `conversations`, `messages`

Neu/zu ergaenzen:
- `consent_records` (subject, scope, purpose, status, timestamp, actor)
- `mood_entries` (residentId, score1to5, lonelyFlag, optional note, date)
- `escalation_events` (residentId, facilityId, triggerType, severity, source, metadata, status)
- `audit_logs` (actor, action, target, before/after hashes, timestamp)
- `facility_settings` (topics, quiet_hours, language, retention_days)

Wichtig:
- Tenant keys auf allen sensiblen Tabellen
- Indizes fuer queue/trends
- Soft-delete/retention kompatibel

## 5) Datenfluesse

### 5.1 Resident Chat Flow (sicher)

```text
Resident UI -> POST /chat
  -> safety-layer.classifyInput
  -> if high-risk: escalation-service.create + safe-escalation-response
  -> else: chat-orchestrator -> LLM
  -> safety-layer.validateOutput
  -> persist minimal chat (policy aware)
  -> stream response
```

### 5.2 Eskalation

```text
Trigger detected
  -> escalation_events(new)
  -> notify staff channel(s)
  -> dashboard queue updates
  -> staff acknowledges/resolves
  -> audit log
```

### 5.3 Mood

```text
Resident mood check
  -> mood_entries write
  -> aggregated trends materialized/query
  -> staff dashboard trend cards
```

## 6) RBAC-Modell (Ziel)

- `admin`
  - Full facility management, settings, user management, audit read
- `caregiver`
  - Residents, biographies, mood, escalations, constrained chat operations
- `family`
  - Nur explizit freigegebene resident-bezogene Daten/aktionen
- `resident`
  - Eigener Chat, mood check, help action

Ergaenzung:
- Alle Queries strikt `facilityId`-scoped
- Family zusaetzlich `family_links + consent scope` geprueft

## 7) Guardrails + Eskalationsdesign

Hard constraints:
- Keine Diagnose, keine Medikationsempfehlung, keine Therapieanweisung
- Bei Krise/Notfall: kurze sichere Antwort + unmittelbare Personal-Eskalation
- Keine manipulative Bindungssprache (Abhaengigkeit vermeiden)
- Klare Selbstbeschreibung als digitaler Assistent

Trigger-Kategorien:
- Schmerz/akuter Notfall
- Suizid-/Selbstverletzungsindikatoren
- Missbrauch/Gewaltindikatoren
- Schwere Verzweiflung/Dissoziation/akute Verwirrung
- Medikations-/Diagnoseanfragen

Escalation event metadata (minimal):
- `triggerType`, `severity`, `confidence`, `conversationId`, `residentId`, `facilityId`, `createdAt`
- Kein Volltext standardmaessig; optional nur mit Zweck + rechtlicher Basis

## 8) Privacy/Compliance Architektur

- Verschluesselung in Transit: TLS verpflichtend
- Verschluesselung at rest: DB-Verschluesselung + volume encryption
- Datenminimierung:
  - Chat-Retention kurz + optional Redaction
  - Aggregationen statt Rohtext im Dashboard
- Consent:
  - Personalisierung nur bei aktiver Zustimmung
  - Widerruf wirkt sofort
- Auditierbarkeit:
  - Unveraenderliche Audit-Events fuer Staff-Aktionen
- EU-Hosting-Kompatibilitaet:
  - Regionale Infrastruktur, AVV/DPA, dokumentierte Datenfluesse

## 9) API-Zielbild (high level)

- `POST /api/chat` (durch Safety Layer erzwungen)
- `POST /api/escalations`, `GET /api/escalations`, `PATCH /api/escalations/:id`
- `POST /api/moods`, `GET /api/moods/resident/:id`, `GET /api/moods/trends`
- `GET/POST/PATCH /api/consents`
- `GET /api/audit` (admin only)
- `GET/PATCH /api/settings`

## 10) UI-Informationsarchitektur (Senior)

Resident Home (max 3 Ebenen):
1. Talk
2. Activities
3. Help

Globale UI-Regeln:
- grosse touch targets, hohe Kontraste, klare Icons + 1-2 Worte Labels
- klare Fehlerbehandlung mit eindeutiger naechster Aktion
- sichtbare Disclaimer: "Ich bin ein digitaler Assistent."

## 11) Observability & Operations

- Strukturierte Logs pro request + correlation id
- Security/Event logging (inkl. escalation outcomes)
- Monitoring:
  - API latency/error rate
  - escalation throughput/ack time
  - failed auth attempts
- Runbooks fuer Notfallkanaele und Ausfaelle
