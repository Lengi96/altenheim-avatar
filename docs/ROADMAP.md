# Rebuild Roadmap

Stand: 2026-03-01

## Delivery-Regeln pro Phase

Jede Phase endet mit:
- aktualisierten Docs
- angepassten/ergaenzten Tests
- aktualisierter manueller Test-Checkliste
- kurzer "What changed / How to verify" Notiz

Commit-Strategie:
- kleine, reviewbare Commits je Teilaufgabe
- Feature Flags fuer risikoreiche Aktivierungen

---

## Phase 1 - Safety Foundation

### Ziel
Zentrale Safety-Schicht + technische Eskalation als unverzichtbarer Gatekeeper fuer Chat.

### Tasks
1. Safety domain anlegen (`apps/server/src/safety/*`)
- Trigger-Regeln (regex/keyword + pattern sets)
- Decision Engine (`allow`, `safe_refuse`, `escalate`)
- Standardisierte Safe-Response Templates

2. Chat-Route auf Safety Layer umstellen
- Vor LLM: Input klassifizieren
- Nach LLM: Output validieren/sanitizen
- Bei Eskalation: kein normaler LLM-Flow

3. EscalationEvent Modell + API (minimal)
- neue Tabelle `escalation_events`
- `POST/GET/PATCH` Endpunkte fuer Staff Queue
- Basiskachel/Indikator im Staff-Bereich

4. Tests
- Unit: Trigger detection + decision matrix
- API: escalation creation + RBAC
- Regression: normale Chat-Pfade bleiben funktional

### Acceptance Criteria
- kein Chat-Request umgeht Safety Layer
- medizinische Diagnose/Medikationsanfragen erhalten sichere, nicht-anweisende Antworten
- kritische Trigger erzeugen persistierte Eskalationseintraege
- staff kann Eskalationen sehen und status aendern

---

## Phase 2 - Data Model Rework

### Ziel
Datengrundlage fuer Consent, Mood, Escalation, Audit, Retention.

### Tasks
1. Schema erweitern
- `consent_records`, `mood_entries`, `escalation_events`, `audit_logs`, `facility_settings`

2. Migrationen
- reversible/defensive Migrationen
- Backfill/Defaults fuer bestehende Daten

3. Repository-Layer/Services
- tenant-safe queries zentralisieren
- helper fuer consent checks

4. Tests
- migration tests (up/down sofern moeglich)
- RBAC + tenant isolation tests

### Acceptance Criteria
- neue Tabellen produktiv nutzbar
- tenant/isolation und consent checks testabgedeckt
- keine Datenmigration zerstoert bestehende Flows

---

## Phase 3 - Senior UI Redesign

### Ziel
Resident Home mit 3 Primaraktionen und voice-first, seniorengerechter UX.

### Tasks
1. Neue Resident Home Page
- Actions: Talk / Activities / Help
- max 3 Navigationsebenen

2. Accessibility/Usability
- grosse typografie und touch targets
- kontrastvalidierung
- einfache Sprache ("explain like I'm 80")

3. Voice + Read Aloud
- mikrofon-start klar und robust
- read-aloud toggle pro resident session

4. Tests
- component tests fuer key interactions
- basic e2e resident happy path

### Acceptance Criteria
- resident kann ohne komplexes Menü in <= 2 taps starten
- Help ist jederzeit prominent verfuegbar
- UX ist auf Tablet robust nutzbar

---

## Phase 4 - Chat Experience

### Ziel
Personalisierter, nicht-manipulativer Chat mit consent-gesteuerter Biografie-Nutzung.

### Tasks
1. Prompt/Context policy
- Biografie nur bei aktivem Consent
- klare Transparenzhinweise

2. Modi
- free talk
- guided daily check-in
- reminiscence prompts

3. Dependency-language filter
- manipulative Formulierungen blockieren/ersetzen

4. Staff handoff Hinweise
- wenn sinnvoll, proaktiv auf Personal verweisen

5. Tests
- policy tests fuer consent/no-consent
- output policy tests

### Acceptance Criteria
- ohne Consent keine Personalisierungsdaten im Kontext
- keine manipulativen Bindungsformulierungen
- modus-spezifische Antworten sind konsistent

---

## Phase 5 - Staff Dashboard MVP

### Ziel
Arbeitsfaehiges Dashboard fuer Versorgung und Aufsicht.

### Tasks
1. Residents overview (pseudonymisierbar)
2. Mood trend views (aggregiert)
3. Escalation queue (ack/resolve)
4. Biography editor mit RBAC
5. Settings page
- topics enable/disable
- quiet hours
- retention policy

### Acceptance Criteria
- staff kann Prioritaeten (eskalationen) abarbeiten
- mood trends ohne rohe Chatinhalte sichtbar
- settings wirken auf chat/safety behavior

---

## Phase 6 - Testing + Prod Readiness

### Ziel
Produktionsreife in Sicherheit, Betrieb und Compliance.

### Tasks
1. Testausbau
- unit: safety, rbac, api
- integration/e2e: resident/staff kritische flows

2. Security & compliance docs
- `docs/PROD_READINESS.md`
- `docs/THREAT_MODEL.md`

3. Monitoring/alerts
- escalation SLA alarms
- auth abuse detection

4. Deployment checklist
- env hardening, secrets, backup/restore, incident runbooks

### Acceptance Criteria
- release checklist gruene Kriterien
- threat model und mitigations dokumentiert
- observability fuer kritische Pfade aktiv

---

## Sequenzierte Umsetzung (empfohlen)

1. Phase 1.1: Safety module skeleton + tests (ohne API-Contract-Bruch)
2. Phase 1.2: EscalationEvent schema + persistence
3. Phase 1.3: Staff escalation read/ack UI
4. Phase 1.4: tighten guardrails + regression tests

Diese Sequenz minimiert Risiko und haelt das System jederzeit lauffaehig.
