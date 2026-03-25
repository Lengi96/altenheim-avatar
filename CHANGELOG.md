# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-03-25

### Added
- Full-stack MVP: React+Vite kiosk frontend + Express+TypeScript backend
- Kiosk UI: IdleScreen with avatar animation, resident greeting, nav buttons
- ConversationScreen with Web Speech API STT + Claude streaming TTS via SSE
- GamesScreen: Memory card game (4×4 grid, move counter) + Trivia quiz (4 questions)
- VideoScreen: Daily.co iframe embed with room-link input
- MusicScreen: YouTube playlist embed by genre (Schlager/Klassik/Jazz)
- ReminderOverlay: acknowledge + snooze, triggered via SSE event bus
- Admin panel: login, residents CRUD, schedules CRUD, notifications list
- PostgreSQL via Prisma with migrations + seed data (Maria Müller demo resident)
- JWT auth (login endpoint + Bearer token middleware)
- SSE event bus + node-cron reminder engine
- Claude API streaming conversation (SSE chunks → client)
- i18n: German + English via react-i18next
- Playwright E2E tests for kiosk and admin flows
- Vitest unit tests: 14 server tests + 1 web smoke test (all passing)
- Tailwind CSS kiosk font scale (`kiosk-sm` → `kiosk-2xl`) + 48px touch targets
- Viewport zoom lock (`user-scalable=no`) for kiosk deployment

### Fixed
- Admin table text invisible (white text on white bg — `text-gray-900` added to AdminLayout)
- Test teardown: `afterAll` cleanup prevents test data accumulating in dev DB
- `env.ts`: dotenv loaded before Zod schema parse so `.env` values are resolved
- `vite.config.ts`: e2e specs excluded from Vitest runner
