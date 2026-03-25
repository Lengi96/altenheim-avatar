# Altenheim Avatar — Design Document
_Date: 2026-03-21_

## Overview

An AI avatar companion for nursing home residents. Residents interact via a touch + voice kiosk (large touchscreen tablet). The avatar converses, delivers medication/appointment reminders, enables family video calls, and offers simple games and music. Nursing home staff manage resident profiles and schedules via a web admin panel.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite (TypeScript) |
| Backend | Express + TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| AI | Claude API (claude-sonnet-4-6), swappable via ConversationProvider |
| Voice I/O | Web Speech API (STT) + browser TTS |
| Video calls | Daily.co embedded iframe |
| Scheduling | node-cron |
| Auth | JWT (staff admin) |

Monorepo layout:
```
apps/
  web/    → React + Vite (kiosk UI + /admin routes)
  server/ → Express + Prisma
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER (Kiosk tablet)                  │
│  ┌──────────────────────────┐  ┌──────────────────────────┐ │
│  │   Resident Kiosk UI      │  │   Staff Admin UI         │ │
│  │   React + Vite           │  │   /admin (auth-gated)    │ │
│  │   - Avatar screen        │  │   - Resident profiles    │ │
│  │   - Touch buttons        │  │   - Schedules/meds       │ │
│  │   - Voice + TTS          │  │   - Notifications        │ │
│  └──────────┬───────────────┘  └──────────────────────────┘ │
└─────────────│───────────────────────────────────────────────┘
              │ HTTP / SSE / WebSocket
┌─────────────▼───────────────────────────────────────────────┐
│                     apps/server (Express)                   │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │ REST API    │  │ Conversation │  │  Reminder Engine  │  │
│  │ /residents  │  │ Provider     │  │  (node-cron)      │  │
│  │ /schedules  │  │ (Claude API) │  │  checks schedule  │  │
│  │ /admin      │  │ (swappable)  │  │  → push to kiosk  │  │
│  └──────┬──────┘  └──────┬───────┘  └────────┬──────────┘  │
│         │                │                    │             │
│  ┌──────▼────────────────▼────────────────────▼──────────┐  │
│  │                  Prisma ORM                            │  │
│  └──────────────────────┬─────────────────────────────────┘  │
└────────────────────────│────────────────────────────────────┘
                         │
              ┌──────────▼──────────┐
              │    PostgreSQL       │
              │  residents, users,  │
              │  schedules, convos  │
              └─────────────────────┘

External services:
  Claude API ←→ ConversationProvider
  Daily.co   ←→ VideoCallProvider (WebRTC)
  Web Speech API / TTS ←→ kiosk browser (voice I/O)
```

**Key decisions:**
- Voice I/O stays in the browser (Web Speech API STT + browser TTS) — reduces latency, no audio piped through server
- Conversation streaming via SSE — kiosk opens EventSource to `/api/conversation/stream`
- Reminder engine on server — node-cron checks every minute, pushes events via SSE/WebSocket to kiosk
- Staff admin is the same React app — `/admin/*` routes, JWT-protected, no second deployment
- ConversationProvider interface — wraps Claude API; swap LLM by replacing one file

---

## Data Model

```
residents
  id            UUID PK
  name          STRING
  room_number   STRING
  language      STRING (de | en | ...)  default: de
  avatar_name   STRING
  photo_url     STRING?
  preferences   JSON   { music, games, topics }
  created_at    TIMESTAMP

users (staff)
  id            UUID PK
  name          STRING
  email         STRING UNIQUE
  password_hash STRING
  role          ENUM (admin | staff)
  created_at    TIMESTAMP

schedules
  id                UUID PK
  resident_id       UUID → residents
  type              ENUM (medication | appointment | activity)
  title             STRING
  cron_expression   STRING  (e.g. "0 8 * * *" = 8am daily)
  active            BOOLEAN default true
  last_triggered_at TIMESTAMP?

conversations
  id          UUID PK
  resident_id UUID → residents
  started_at  TIMESTAMP
  ended_at    TIMESTAMP?
  messages    JSON  [ { role, content, timestamp } ]
```

---

## Kiosk UI Screens

```
IDLE SCREEN              ACTIVE CONVERSATION      REMINDER POPUP
─────────────────        ──────────────────────   ──────────────────
[Avatar animation]       [Avatar speaking anim]   [Overlay modal]
[Resident name, lg]      [Transcript scroll]      "Zeit für Ihre
                                                   Medikamente!"
[TAP TO TALK]  ──────▶  [● Mic active]     ◀────
[VIDEO ANRUF]            [Gespräch beenden]       [BESTÄTIGEN]
[SPIELE]                                          [ERINNERE MICH
[MUSIK]                                            SPÄTER]
```

- All touch targets ≥ 48×48px; font ≥ 18px; WCAG AA contrast
- Avatar is a Lottie animation (idle loop / speaking loop / listening loop)
- Auto-returns to idle screen after 2 min of inactivity
- Language of all UI strings follows `resident.language`

---

## Conversation Engine

```
Browser                    Server                       Claude API
───────                    ──────                       ──────────
User speaks
  │
Web Speech API → text
  │
POST /api/conversation/message
  { residentId, message, conversationId }
                           │
                     Load resident context
                     Build system prompt:
                       - resident name, language
                       - avatar persona
                       - today's schedule
                       - conversation history
                           │
                     stream to Claude ─────────────▶ claude-sonnet-4-6
                           │                               │
EventSource ◀──── SSE text/delta chunks ◀─────── streaming response
  │
Browser TTS speaks each chunk as it arrives
```

**ConversationProvider interface:**
```ts
interface ConversationProvider {
  stream(messages: Message[], context: ResidentContext): AsyncIterable<string>
}
```

ClaudeProvider implements this. Swap by injecting a different provider.

---

## Staff Admin

Three views at `/admin` (JWT-protected, staff/admin roles):

1. **Residents** — list, create, edit, deactivate; set name, room, language, avatar, preferences
2. **Schedules** — per-resident medication/appointment reminders; cron recurrence; enable/disable
3. **Notifications** — real-time feed of unacknowledged reminder triggers and flagged conversations

---

## Additional Features

- **Video calls:** Daily.co embedded iframe. Staff/family generates a room URL; resident taps "Video Anruf" and joins.
- **Games:** Client-side only. Memory card matching and trivia (questions loaded from server by language). No server state.
- **Music:** YouTube iframe embed with a curated playlist per resident preference (stored in `preferences` JSON).

---

## Error Handling

| Failure | Response |
|---------|----------|
| Claude API timeout / error | Show localized fallback message to resident; log to server |
| Reminder delivery failure | Retry 3× with exponential backoff; flag in staff notifications if all fail |
| Network loss on kiosk | Show offline banner; queue messages; auto-reconnect SSE |
| Staff auth failure | Return 401; redirect to login |

---

## Testing Strategy

- **Unit:** ConversationProvider logic, reminder cron scheduling, Prisma model validators
- **Integration:** Express API routes against test PostgreSQL DB
- **E2E:** Playwright — idle → voice conversation → reminder popup → dismiss flow; staff admin CRUD

---

## Out of Scope (Phase 2)

- Family portal (data model supports it; UI deferred)
- LLM provider swap (ConversationProvider abstraction is ready; no second provider built)
- Native mobile app
- HIPAA/DSGVO compliance hardening (flag for legal review before production)
