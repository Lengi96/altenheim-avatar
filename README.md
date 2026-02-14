# Anni Platform

Monorepo for the Anni platform with:

- `apps/server`: Node.js/TypeScript backend API
- `apps/web`: React + Vite frontend
- `packages/shared`: shared types/utilities
- `legacy`: archived legacy app implementation

## Prerequisites

- Node.js 20+
- npm 10+

## Quick Start

```bash
npm install
npm run dev
```

This starts backend and frontend in parallel.

## Useful Scripts

- `npm run dev`: start all app dev servers
- `npm run dev:server`: start backend only
- `npm run dev:web`: start frontend only
- `npm run build`: build frontend
- `npm run db:generate`: generate database migrations
- `npm run db:migrate`: run database migrations
- `npm run db:seed`: seed database

## Environment

Use `.env.example` as the template for local environment variables.

## License

This project is licensed under the MIT License. See `LICENSE`.
