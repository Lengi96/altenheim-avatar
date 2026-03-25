# Altenheim Avatar — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a full-stack AI avatar companion for nursing home residents with touch+voice kiosk UI, conversation via Claude API, medication reminders, video calls, games, music, and a staff admin panel.

**Architecture:** React+Vite frontend (kiosk + `/admin`) talking to an Express+TypeScript backend. PostgreSQL via Prisma. Claude API streams conversation over SSE. node-cron fires reminders pushed to kiosk via SSE event bus.

**Tech Stack:** React 18, Vite 5, TypeScript, Express 5, Prisma, PostgreSQL, `@anthropic-ai/sdk`, `node-cron`, `ws`, `jsonwebtoken`, `bcryptjs`, `zod`, Tailwind CSS, `react-router-dom`, `react-i18next`, Vitest, Supertest, Playwright.

---

## Prerequisites

Before starting any task, ensure:
- Docker Desktop running (for PostgreSQL)
- Node.js 20+ installed
- `ANTHROPIC_API_KEY` env var available
- Daily.co account for video calls (free tier is fine)

---

## Task 1: Monorepo Root Setup

**Files:**
- Create: `package.json`
- Create: `.env.example`
- Create: `.gitignore`

**Step 1: Create root package.json**

```json
{
  "name": "altenheim-avatar",
  "private": true,
  "workspaces": ["apps/*"],
  "scripts": {
    "dev": "concurrently -n server,web -c blue,green \"npm run dev -w apps/server\" \"npm run dev -w apps/web\"",
    "build": "npm run build -w apps/server && npm run build -w apps/web",
    "test": "npm run test -w apps/server && npm run test -w apps/web",
    "db:migrate": "npm run db:migrate -w apps/server",
    "db:seed": "npm run db:seed -w apps/server"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
```

**Step 2: Create `.env.example`**

```
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/altenheim"
TEST_DATABASE_URL="postgresql://postgres:password@localhost:5432/altenheim_test"

# Auth
JWT_SECRET="change-me-in-production-32-chars-min"

# AI
ANTHROPIC_API_KEY="sk-ant-..."

# Server
PORT=3001
NODE_ENV=development
```

**Step 3: Create `.gitignore`**

```
node_modules/
dist/
.env
*.local
.DS_Store
```

**Step 4: Install root deps**

```bash
cd D:/projects/Altenheim_avatar
npm install
```

Expected: `node_modules/concurrently` installed.

**Step 5: Commit**

```bash
git init
git add package.json .env.example .gitignore
git commit -m "feat: monorepo root setup"
```

---

## Task 2: Server — Package + TypeScript Config

**Files:**
- Create: `apps/server/package.json`
- Create: `apps/server/tsconfig.json`
- Create: `apps/server/src/index.ts` (placeholder)

**Step 1: Create `apps/server/package.json`**

```json
{
  "name": "@altenheim/server",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:migrate": "prisma migrate dev",
    "db:migrate:prod": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:generate": "prisma generate"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.27.0",
    "@prisma/client": "^5.22.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.21.1",
    "helmet": "^8.0.0",
    "jsonwebtoken": "^9.0.2",
    "node-cron": "^3.0.3",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/node": "^22.0.0",
    "@types/node-cron": "^3.0.11",
    "@types/supertest": "^6.0.2",
    "prisma": "^5.22.0",
    "supertest": "^7.0.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  }
}
```

**Step 2: Create `apps/server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 3: Create `apps/server/src/index.ts`**

```typescript
import app from './app';

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

**Step 4: Create `apps/server/src/app.ts`**

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
```

**Step 5: Install server deps**

```bash
cd D:/projects/Altenheim_avatar/apps/server
npm install
```

**Step 6: Write health check test**

Create `apps/server/src/__tests__/health.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('GET /health', () => {
  it('returns ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
```

**Step 7: Run test**

```bash
cd apps/server && npm test
```

Expected: 1 test passing.

**Step 8: Commit**

```bash
git add apps/server/
git commit -m "feat: server foundation with Express + TypeScript"
```

---

## Task 3: Web — Vite + React + Tailwind

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`

**Step 1: Create `apps/web/package.json`**

```json
{
  "name": "@altenheim/web",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.28.0",
    "react-i18next": "^15.1.3",
    "i18next": "^23.16.4"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0",
    "@testing-library/react": "^16.1.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.16",
    "typescript": "^5.7.2",
    "vite": "^5.4.11",
    "vitest": "^2.1.8"
  }
}
```

**Step 2: Create `apps/web/vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
  },
});
```

**Step 3: Create `apps/web/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

**Step 4: Create `apps/web/postcss.config.js`**

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

**Step 5: Create `apps/web/tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontSize: {
        'kiosk-sm': ['1.125rem', '1.75rem'],
        'kiosk-base': ['1.25rem', '2rem'],
        'kiosk-lg': ['1.5rem', '2.25rem'],
        'kiosk-xl': ['2rem', '2.5rem'],
        'kiosk-2xl': ['2.5rem', '3rem'],
      },
      minHeight: {
        touch: '48px',
      },
      minWidth: {
        touch: '48px',
      },
    },
  },
  plugins: [],
};
```

**Step 6: Create `apps/web/index.html`**

```html
<!doctype html>
<html lang="de">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Altenheim Avatar</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

**Step 7: Create `apps/web/src/index.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  -webkit-tap-highlight-color: transparent;
}

body {
  @apply bg-gray-950 text-white;
  font-size: 1.25rem;
  touch-action: manipulation;
}
```

**Step 8: Create `apps/web/src/main.tsx`**

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

**Step 9: Create `apps/web/src/App.tsx`** (placeholder, replaced in Task 13)

```tsx
export default function App() {
  return (
    <div className="flex h-screen items-center justify-center">
      <h1 className="text-kiosk-2xl">Altenheim Avatar</h1>
    </div>
  );
}
```

**Step 10: Create `apps/web/src/test-setup.ts`**

```typescript
import '@testing-library/jest-dom';
```

Note: install `@testing-library/jest-dom` too — add to devDeps and run `npm install`.

Actually, add to package.json devDependencies:
```
"@testing-library/jest-dom": "^6.6.3"
```

**Step 11: Install web deps**

```bash
cd D:/projects/Altenheim_avatar/apps/web
npm install
```

**Step 12: Write smoke test**

Create `apps/web/src/__tests__/App.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText('Altenheim Avatar')).toBeInTheDocument();
  });
});
```

**Step 13: Run test**

```bash
cd apps/web && npm test
```

Expected: 1 test passing.

**Step 14: Commit**

```bash
git add apps/web/
git commit -m "feat: web app scaffold with React + Vite + Tailwind"
```

---

## Task 4: PostgreSQL + Prisma Schema

**Files:**
- Create: `apps/server/prisma/schema.prisma`
- Create: `apps/server/prisma/seed.ts`

**Step 1: Start PostgreSQL via Docker**

```bash
docker run -d \
  --name altenheim-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=altenheim \
  -p 5432:5432 \
  postgres:16-alpine

# Also create test database
docker exec altenheim-postgres psql -U postgres -c "CREATE DATABASE altenheim_test;"
```

**Step 2: Copy `.env.example` to `.env` in server**

```bash
cp D:/projects/Altenheim_avatar/.env.example D:/projects/Altenheim_avatar/apps/server/.env
```

Verify `DATABASE_URL` matches Docker setup (it should).

**Step 3: Initialize Prisma**

```bash
cd apps/server && npx prisma init --datasource-provider postgresql
```

This creates `prisma/schema.prisma`. Replace its contents:

**Step 4: Write `apps/server/prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Resident {
  id          String   @id @default(uuid())
  name        String
  roomNumber  String
  language    String   @default("de")
  avatarName  String   @default("Lena")
  photoUrl    String?
  preferences Json     @default("{}")
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())

  schedules     Schedule[]
  conversations Conversation[]
}

enum UserRole {
  admin
  staff
}

model User {
  id           String   @id @default(uuid())
  name         String
  email        String   @unique
  passwordHash String
  role         UserRole @default(staff)
  createdAt    DateTime @default(now())
}

enum ScheduleType {
  medication
  appointment
  activity
}

model Schedule {
  id              String       @id @default(uuid())
  residentId      String
  type            ScheduleType
  title           String
  cronExpression  String
  active          Boolean      @default(true)
  lastTriggeredAt DateTime?

  resident Resident @relation(fields: [residentId], references: [id])
}

model Conversation {
  id         String    @id @default(uuid())
  residentId String
  startedAt  DateTime  @default(now())
  endedAt    DateTime?
  messages   Json      @default("[]")

  resident Resident @relation(fields: [residentId], references: [id])
}

model Notification {
  id          String   @id @default(uuid())
  residentId  String
  scheduleId  String?
  title       String
  type        String
  acknowledged Boolean @default(false)
  createdAt   DateTime @default(now())
}
```

**Step 5: Run migration**

```bash
cd apps/server && npx prisma migrate dev --name init
```

Expected: Migration created and applied. Prisma client generated.

**Step 6: Create `apps/server/prisma/seed.ts`**

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Admin user
  const passwordHash = await bcrypt.hash('admin123', 12);
  await prisma.user.upsert({
    where: { email: 'admin@altenheim.de' },
    update: {},
    create: {
      name: 'Admin',
      email: 'admin@altenheim.de',
      passwordHash,
      role: 'admin',
    },
  });

  // Demo resident
  const resident = await prisma.resident.upsert({
    where: { id: 'demo-resident-id-0000-000000000001' },
    update: {},
    create: {
      id: 'demo-resident-id-0000-000000000001',
      name: 'Maria Müller',
      roomNumber: '12A',
      language: 'de',
      avatarName: 'Lena',
      preferences: { music: 'Schlager', games: ['memory'], topics: ['Garten', 'Familie'] },
    },
  });

  // Demo schedule
  await prisma.schedule.upsert({
    where: { id: 'demo-schedule-id-00000-000000000001' },
    update: {},
    create: {
      id: 'demo-schedule-id-00000-000000000001',
      residentId: resident.id,
      type: 'medication',
      title: 'Morgenmedikamente',
      cronExpression: '0 8 * * *',
    },
  });

  console.log('Seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

**Step 7: Run seed**

```bash
cd apps/server && npm run db:seed
```

Expected: "Seed complete"

**Step 8: Commit**

```bash
git add apps/server/prisma/
git commit -m "feat: Prisma schema and seed data"
```

---

## Task 5: Prisma Client Singleton + Env Validation

**Files:**
- Create: `apps/server/src/lib/prisma.ts`
- Create: `apps/server/src/lib/env.ts`

**Step 1: Create `apps/server/src/lib/env.ts`**

```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ANTHROPIC_API_KEY: z.string().min(1),
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

export const env = envSchema.parse(process.env);
```

**Step 2: Create `apps/server/src/lib/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

**Step 3: Update `apps/server/src/app.ts`** to import env at top

```typescript
import './lib/env'; // validates env vars on startup
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
```

**Step 4: Copy `.env` to server dir** (if not done)

```bash
cp .env.example apps/server/.env
# Edit apps/server/.env with real values
```

**Step 5: Run existing tests to verify nothing broke**

```bash
cd apps/server && npm test
```

Expected: 1 passing.

**Step 6: Commit**

```bash
git add apps/server/src/lib/
git commit -m "feat: Prisma singleton and env validation"
```

---

## Task 6: Auth — JWT Login Endpoint

**Files:**
- Create: `apps/server/src/middleware/auth.ts`
- Create: `apps/server/src/routes/auth.ts`
- Create: `apps/server/src/__tests__/auth.test.ts`

**Step 1: Write failing tests first**

Create `apps/server/src/__tests__/auth.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';

describe('POST /api/auth/login', () => {
  it('returns 400 when body is missing', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
  });

  it('returns 401 for wrong credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@test.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@altenheim.de', password: 'admin123' });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
  });
});
```

**Step 2: Run tests — should fail**

```bash
cd apps/server && npm test
```

Expected: auth tests fail with 404.

**Step 3: Create `apps/server/src/middleware/auth.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../lib/env';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing token' });
    return;
  }

  try {
    const token = header.slice(7);
    const payload = jwt.verify(token, env.JWT_SECRET) as { userId: string; role: string };
    req.userId = payload.userId;
    req.userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, () => {
    if (req.userRole !== 'admin') {
      res.status(403).json({ error: 'Admin role required' });
      return;
    }
    next();
  });
}
```

**Step 4: Create `apps/server/src/routes/auth.ts`**

```typescript
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { env } from '../lib/env';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    return;
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: '8h',
  });

  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  });
});

export default router;
```

**Step 5: Register route in `apps/server/src/app.ts`**

```typescript
import './lib/env';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import authRouter from './routes/auth';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);

export default app;
```

**Step 6: Run tests — should pass**

```bash
cd apps/server && npm test
```

Expected: all 4 tests passing (1 health + 3 auth).

**Step 7: Commit**

```bash
git add apps/server/src/
git commit -m "feat: JWT auth with login endpoint"
```

---

## Task 7: Residents API

**Files:**
- Create: `apps/server/src/routes/residents.ts`
- Create: `apps/server/src/__tests__/residents.test.ts`

**Step 1: Write failing tests**

Create `apps/server/src/__tests__/residents.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';

let authToken: string;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@altenheim.de', password: 'admin123' });
  authToken = res.body.token;
});

describe('GET /api/residents', () => {
  it('requires auth', async () => {
    const res = await request(app).get('/api/residents');
    expect(res.status).toBe(401);
  });

  it('returns residents list', async () => {
    const res = await request(app)
      .get('/api/residents')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /api/residents', () => {
  it('creates a resident', async () => {
    const res = await request(app)
      .post('/api/residents')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'Hans Schmidt', roomNumber: '5B', language: 'de' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('Hans Schmidt');
  });

  it('returns 400 for missing name', async () => {
    const res = await request(app)
      .post('/api/residents')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ roomNumber: '5B' });
    expect(res.status).toBe(400);
  });
});
```

**Step 2: Run — expect failures**

```bash
npm test
```

**Step 3: Create `apps/server/src/routes/residents.ts`**

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

const createResidentSchema = z.object({
  name: z.string().min(1),
  roomNumber: z.string().min(1),
  language: z.string().default('de'),
  avatarName: z.string().default('Lena'),
  photoUrl: z.string().url().optional(),
  preferences: z.record(z.unknown()).default({}),
});

const updateResidentSchema = createResidentSchema.partial().extend({
  active: z.boolean().optional(),
});

router.get('/', requireAuth, async (_req, res) => {
  const residents = await prisma.resident.findMany({
    orderBy: { name: 'asc' },
  });
  res.json(residents);
});

router.get('/:id', requireAuth, async (req, res) => {
  const resident = await prisma.resident.findUnique({ where: { id: req.params.id } });
  if (!resident) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(resident);
});

router.post('/', requireAuth, async (req, res) => {
  const parsed = createResidentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    return;
  }
  const resident = await prisma.resident.create({ data: parsed.data });
  res.status(201).json(resident);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const parsed = updateResidentSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    return;
  }
  const resident = await prisma.resident.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(resident);
});

router.delete('/:id', requireAuth, async (req, res) => {
  await prisma.resident.update({
    where: { id: req.params.id },
    data: { active: false },
  });
  res.status(204).send();
});

export default router;
```

**Step 4: Register in `app.ts`**

Add to imports and use:
```typescript
import residentsRouter from './routes/residents';
// ...
app.use('/api/residents', residentsRouter);
```

**Step 5: Run tests — all pass**

```bash
npm test
```

Expected: all passing.

**Step 6: Commit**

```bash
git add apps/server/src/
git commit -m "feat: residents CRUD API with auth"
```

---

## Task 8: Schedules API

**Files:**
- Create: `apps/server/src/routes/schedules.ts`
- Create: `apps/server/src/__tests__/schedules.test.ts`

**Step 1: Write failing tests**

Create `apps/server/src/__tests__/schedules.test.ts`:

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../app';

let authToken: string;
const RESIDENT_ID = 'demo-resident-id-0000-000000000001';

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@altenheim.de', password: 'admin123' });
  authToken = res.body.token;
});

describe('GET /api/schedules?residentId=', () => {
  it('returns schedules for resident', async () => {
    const res = await request(app)
      .get(`/api/schedules?residentId=${RESIDENT_ID}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /api/schedules', () => {
  it('creates a schedule', async () => {
    const res = await request(app)
      .post('/api/schedules')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        residentId: RESIDENT_ID,
        type: 'medication',
        title: 'Abendmedikamente',
        cronExpression: '0 20 * * *',
      });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Abendmedikamente');
  });
});
```

**Step 2: Create `apps/server/src/routes/schedules.ts`**

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

const createScheduleSchema = z.object({
  residentId: z.string().uuid(),
  type: z.enum(['medication', 'appointment', 'activity']),
  title: z.string().min(1),
  cronExpression: z.string().min(1),
  active: z.boolean().default(true),
});

router.get('/', requireAuth, async (req, res) => {
  const { residentId } = req.query;
  const where = residentId ? { residentId: String(residentId) } : {};
  const schedules = await prisma.schedule.findMany({ where, orderBy: { title: 'asc' } });
  res.json(schedules);
});

router.post('/', requireAuth, async (req, res) => {
  const parsed = createScheduleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
    return;
  }
  const schedule = await prisma.schedule.create({ data: parsed.data });
  res.status(201).json(schedule);
});

router.patch('/:id', requireAuth, async (req, res) => {
  const parsed = createScheduleSchema.partial().safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }
  const schedule = await prisma.schedule.update({
    where: { id: req.params.id },
    data: parsed.data,
  });
  res.json(schedule);
});

router.delete('/:id', requireAuth, async (req, res) => {
  await prisma.schedule.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
```

**Step 3: Register in `app.ts`**

```typescript
import schedulesRouter from './routes/schedules';
app.use('/api/schedules', schedulesRouter);
```

**Step 4: Run tests**

```bash
npm test
```

Expected: all passing.

**Step 5: Commit**

```bash
git add apps/server/src/
git commit -m "feat: schedules CRUD API"
```

---

## Task 9: Conversation Provider + Claude Streaming

**Files:**
- Create: `apps/server/src/providers/ConversationProvider.ts`
- Create: `apps/server/src/providers/ClaudeProvider.ts`
- Create: `apps/server/src/routes/conversation.ts`
- Create: `apps/server/src/__tests__/conversationProvider.test.ts`

**Step 1: Create `apps/server/src/providers/ConversationProvider.ts`**

```typescript
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface ResidentContext {
  name: string;
  language: string;
  avatarName: string;
  preferences: Record<string, unknown>;
  todaySchedule: Array<{ title: string; time: string }>;
}

export interface ConversationProvider {
  stream(messages: Message[], context: ResidentContext): AsyncIterable<string>;
}
```

**Step 2: Create `apps/server/src/providers/ClaudeProvider.ts`**

```typescript
import Anthropic from '@anthropic-ai/sdk';
import { ConversationProvider, Message, ResidentContext } from './ConversationProvider';
import { env } from '../lib/env';

export class ClaudeProvider implements ConversationProvider {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }

  async *stream(messages: Message[], context: ResidentContext): AsyncIterable<string> {
    const systemPrompt = this.buildSystemPrompt(context);

    const stream = await this.client.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    });

    for await (const chunk of stream) {
      if (
        chunk.type === 'content_block_delta' &&
        chunk.delta.type === 'text_delta'
      ) {
        yield chunk.delta.text;
      }
    }
  }

  private buildSystemPrompt(ctx: ResidentContext): string {
    const lang = ctx.language === 'de' ? 'Deutsch' : 'English';
    const scheduleText =
      ctx.todaySchedule.length > 0
        ? ctx.todaySchedule.map(s => `- ${s.time}: ${s.title}`).join('\n')
        : 'Keine besonderen Termine heute.';

    return `Du bist ${ctx.avatarName}, ein freundlicher und einfühlsamer KI-Begleiter für ${ctx.name}, einen Bewohner eines Altenheims.
Sprich immer auf ${lang}. Sei warm, geduldig und unterstützend.
Halte deine Antworten kurz (2-3 Sätze), da ${ctx.name} ältere Person ist.
Bevorzugte Themen: ${JSON.stringify(ctx.preferences)}.

Heutiger Tagesplan von ${ctx.name}:
${scheduleText}

Wenn nach Notfällen oder medizinischen Problemen gefragt wird, empfiehl immer, das Pflegepersonal zu rufen.`;
  }
}
```

**Step 3: Write unit test for ClaudeProvider (mock)**

Create `apps/server/src/__tests__/conversationProvider.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ClaudeProvider } from '../providers/ClaudeProvider';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        stream: vi.fn().mockReturnValue({
          [Symbol.asyncIterator]: async function* () {
            yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Hallo ' } };
            yield { type: 'content_block_delta', delta: { type: 'text_delta', text: 'Maria!' } };
            yield { type: 'message_stop' };
          },
        }),
      },
    })),
  };
});

describe('ClaudeProvider', () => {
  it('streams text chunks', async () => {
    const provider = new ClaudeProvider();
    const chunks: string[] = [];

    const stream = provider.stream(
      [{ role: 'user', content: 'Hallo' }],
      {
        name: 'Maria',
        language: 'de',
        avatarName: 'Lena',
        preferences: {},
        todaySchedule: [],
      }
    );

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    expect(chunks.join('')).toBe('Hallo Maria!');
  });
});
```

**Step 4: Create `apps/server/src/routes/conversation.ts`**

```typescript
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma';
import { ClaudeProvider } from '../providers/ClaudeProvider';
import type { Message } from '../providers/ConversationProvider';

const router = Router();
const provider = new ClaudeProvider();

const messageSchema = z.object({
  residentId: z.string().uuid(),
  message: z.string().min(1),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() }))
    .default([]),
});

// SSE streaming endpoint — no auth required (kiosk calls this)
router.post('/stream', async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid request' });
    return;
  }

  const { residentId, message, history } = parsed.data;
  const resident = await prisma.resident.findUnique({ where: { id: residentId } });
  if (!resident) {
    res.status(404).json({ error: 'Resident not found' });
    return;
  }

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const messages: Message[] = [
    ...history,
    { role: 'user', content: message },
  ];

  try {
    let fullResponse = '';

    for await (const chunk of provider.stream(messages, {
      name: resident.name,
      language: resident.language,
      avatarName: resident.avatarName,
      preferences: resident.preferences as Record<string, unknown>,
      todaySchedule: [],
    })) {
      fullResponse += chunk;
      res.write(`data: ${JSON.stringify({ type: 'delta', text: chunk })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();

    // Persist conversation async (fire and forget)
    prisma.conversation
      .create({
        data: {
          residentId,
          messages: [
            ...messages,
            { role: 'assistant', content: fullResponse, timestamp: new Date().toISOString() },
          ],
        },
      })
      .catch(console.error);
  } catch (err) {
    console.error('Conversation stream error:', err);
    res.write(`data: ${JSON.stringify({ type: 'error', message: 'Entschuldigung, ich habe einen Fehler. Bitte versuchen Sie es erneut.' })}\n\n`);
    res.end();
  }
});

export default router;
```

**Step 5: Register in `app.ts`**

```typescript
import conversationRouter from './routes/conversation';
app.use('/api/conversation', conversationRouter);
```

**Step 6: Run tests**

```bash
npm test
```

Expected: provider test passes (mocked).

**Step 7: Commit**

```bash
git add apps/server/src/
git commit -m "feat: ConversationProvider + Claude streaming SSE"
```

---

## Task 10: SSE Event Bus + Reminder Engine

**Files:**
- Create: `apps/server/src/lib/eventBus.ts`
- Create: `apps/server/src/lib/reminderEngine.ts`
- Create: `apps/server/src/routes/events.ts`
- Create: `apps/server/src/__tests__/reminderEngine.test.ts`

**Step 1: Create `apps/server/src/lib/eventBus.ts`**

```typescript
import { Response } from 'express';

type ResidentId = string;

interface ReminderEvent {
  type: 'reminder';
  scheduleId: string;
  title: string;
  scheduleType: string;
}

class EventBus {
  private connections = new Map<ResidentId, Response>();

  register(residentId: ResidentId, res: Response): void {
    this.connections.set(residentId, res);
    res.on('close', () => this.connections.delete(residentId));
  }

  send(residentId: ResidentId, event: ReminderEvent): boolean {
    const res = this.connections.get(residentId);
    if (!res) return false;
    try {
      res.write(`data: ${JSON.stringify(event)}\n\n`);
      return true;
    } catch {
      this.connections.delete(residentId);
      return false;
    }
  }

  isConnected(residentId: ResidentId): boolean {
    return this.connections.has(residentId);
  }
}

export const eventBus = new EventBus();
```

**Step 2: Create `apps/server/src/routes/events.ts`**

```typescript
import { Router } from 'express';
import { eventBus } from '../lib/eventBus';

const router = Router();

// Kiosk subscribes to this SSE stream on startup
router.get('/stream', (req, res) => {
  const { residentId } = req.query;
  if (!residentId || typeof residentId !== 'string') {
    res.status(400).json({ error: 'residentId required' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Keep-alive ping every 30s
  const pingInterval = setInterval(() => {
    res.write(': ping\n\n');
  }, 30_000);

  res.on('close', () => clearInterval(pingInterval));

  eventBus.register(residentId, res);
  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);
});

export default router;
```

**Step 3: Create `apps/server/src/lib/reminderEngine.ts`**

```typescript
import cron from 'node-cron';
import { prisma } from './prisma';
import { eventBus } from './eventBus';

function parseCronToReadableTime(expression: string): string {
  const parts = expression.split(' ');
  if (parts.length >= 2) {
    const hour = parts[1].padStart(2, '0');
    const minute = parts[0].padStart(2, '0');
    return `${hour}:${minute}`;
  }
  return expression;
}

export function startReminderEngine(): void {
  // Check every minute
  cron.schedule('* * * * *', async () => {
    const now = new Date();
    const currentCron = `${now.getMinutes()} ${now.getHours()} * * *`;

    try {
      const due = await prisma.schedule.findMany({
        where: { active: true, cronExpression: currentCron },
      });

      for (const schedule of due) {
        const sent = eventBus.send(schedule.residentId, {
          type: 'reminder',
          scheduleId: schedule.id,
          title: schedule.title,
          scheduleType: schedule.type,
        });

        // Create notification record
        await prisma.notification.create({
          data: {
            residentId: schedule.residentId,
            scheduleId: schedule.id,
            title: schedule.title,
            type: schedule.type,
            acknowledged: false,
          },
        });

        // Update last triggered
        await prisma.schedule.update({
          where: { id: schedule.id },
          data: { lastTriggeredAt: now },
        });

        if (!sent) {
          console.warn(`Reminder sent but kiosk not connected for resident ${schedule.residentId}`);
        }
      }
    } catch (err) {
      console.error('Reminder engine error:', err);
    }
  });

  console.log('Reminder engine started');
}
```

**Step 4: Write test**

Create `apps/server/src/__tests__/reminderEngine.test.ts`:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { eventBus } from '../lib/eventBus';

describe('EventBus', () => {
  it('returns false when resident not connected', () => {
    const result = eventBus.send('nonexistent-id', {
      type: 'reminder',
      scheduleId: 'test',
      title: 'Test',
      scheduleType: 'medication',
    });
    expect(result).toBe(false);
  });

  it('reports not connected for unknown resident', () => {
    expect(eventBus.isConnected('unknown')).toBe(false);
  });
});
```

**Step 5: Register events route and start engine in `app.ts`**

```typescript
import eventsRouter from './routes/events';
app.use('/api/events', eventsRouter);
```

Update `apps/server/src/index.ts`:
```typescript
import app from './app';
import { startReminderEngine } from './lib/reminderEngine';

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  startReminderEngine();
});
```

**Step 6: Run tests**

```bash
npm test
```

Expected: all passing.

**Step 7: Commit**

```bash
git add apps/server/src/
git commit -m "feat: SSE event bus and reminder engine with node-cron"
```

---

## Task 11: Notifications API

**Files:**
- Create: `apps/server/src/routes/notifications.ts`

**Step 1: Create `apps/server/src/routes/notifications.ts`**

```typescript
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';

const router = Router();

// Staff: get all unacknowledged notifications
router.get('/', requireAuth, async (_req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { acknowledged: false },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  res.json(notifications);
});

// Kiosk: acknowledge a reminder
router.patch('/:id/acknowledge', async (req, res) => {
  await prisma.notification.update({
    where: { id: req.params.id },
    data: { acknowledged: true },
  });
  res.status(204).send();
});

export default router;
```

**Step 2: Register in `app.ts`**

```typescript
import notificationsRouter from './routes/notifications';
app.use('/api/notifications', notificationsRouter);
```

**Step 3: Run tests + commit**

```bash
npm test
git add apps/server/src/
git commit -m "feat: notifications API"
```

---

## Task 12: i18n Setup (Web)

**Files:**
- Create: `apps/web/src/i18n/index.ts`
- Create: `apps/web/src/i18n/de.json`
- Create: `apps/web/src/i18n/en.json`

**Step 1: Create `apps/web/src/i18n/de.json`**

```json
{
  "idle": {
    "greeting": "Hallo, {{name}}!",
    "tapToTalk": "Tippen zum Sprechen",
    "videoCall": "Video Anruf",
    "games": "Spiele",
    "music": "Musik"
  },
  "conversation": {
    "listening": "Ich höre zu...",
    "thinking": "Ich denke...",
    "endCall": "Gespräch beenden",
    "error": "Entschuldigung, ich habe Sie nicht verstanden. Bitte versuchen Sie es erneut."
  },
  "reminder": {
    "title": "Erinnerung",
    "medication": "Zeit für Ihre Medikamente",
    "appointment": "Sie haben einen Termin",
    "activity": "Zeit für eine Aktivität",
    "confirm": "Bestätigen",
    "snooze": "Später erinnern"
  },
  "games": {
    "memory": "Memory",
    "trivia": "Quiz",
    "backToHome": "Zurück"
  },
  "music": {
    "title": "Musik",
    "backToHome": "Zurück"
  },
  "video": {
    "title": "Video Anruf",
    "backToHome": "Zurück",
    "roomPlaceholder": "Raum-Link eingeben"
  },
  "admin": {
    "login": "Anmelden",
    "email": "E-Mail",
    "password": "Passwort",
    "residents": "Bewohner",
    "schedules": "Termine",
    "notifications": "Benachrichtigungen",
    "logout": "Abmelden"
  },
  "offline": "Keine Verbindung — wird wiederhergestellt..."
}
```

**Step 2: Create `apps/web/src/i18n/en.json`**

```json
{
  "idle": {
    "greeting": "Hello, {{name}}!",
    "tapToTalk": "Tap to Talk",
    "videoCall": "Video Call",
    "games": "Games",
    "music": "Music"
  },
  "conversation": {
    "listening": "I'm listening...",
    "thinking": "Thinking...",
    "endCall": "End conversation",
    "error": "Sorry, I didn't understand. Please try again."
  },
  "reminder": {
    "title": "Reminder",
    "medication": "Time for your medication",
    "appointment": "You have an appointment",
    "activity": "Time for an activity",
    "confirm": "Confirm",
    "snooze": "Remind me later"
  },
  "games": {
    "memory": "Memory",
    "trivia": "Trivia",
    "backToHome": "Back"
  },
  "music": {
    "title": "Music",
    "backToHome": "Back"
  },
  "video": {
    "title": "Video Call",
    "backToHome": "Back",
    "roomPlaceholder": "Enter room link"
  },
  "admin": {
    "login": "Sign in",
    "email": "Email",
    "password": "Password",
    "residents": "Residents",
    "schedules": "Schedules",
    "notifications": "Notifications",
    "logout": "Sign out"
  },
  "offline": "No connection — reconnecting..."
}
```

**Step 3: Create `apps/web/src/i18n/index.ts`**

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import de from './de.json';
import en from './en.json';

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
  },
  lng: 'de',
  fallbackLng: 'de',
  interpolation: { escapeValue: false },
});

export default i18n;
```

**Step 4: Import in `apps/web/src/main.tsx`**

Add `import './i18n';` before the App import.

**Step 5: Run web tests**

```bash
cd apps/web && npm test
```

**Step 6: Commit**

```bash
git add apps/web/src/i18n/ apps/web/src/main.tsx
git commit -m "feat: i18n setup with German and English translations"
```

---

## Task 13: Kiosk App Shell + Routing

**Files:**
- Create: `apps/web/src/App.tsx` (replace placeholder)
- Create: `apps/web/src/context/ResidentContext.tsx`
- Create: `apps/web/src/hooks/useEventStream.ts`

**Step 1: Create `apps/web/src/context/ResidentContext.tsx`**

```tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Resident {
  id: string;
  name: string;
  language: string;
  avatarName: string;
  preferences: Record<string, unknown>;
}

interface ReminderEvent {
  type: 'reminder';
  scheduleId: string;
  title: string;
  scheduleType: string;
}

interface ResidentContextValue {
  resident: Resident | null;
  setResidentId: (id: string) => void;
  pendingReminder: ReminderEvent | null;
  clearReminder: () => void;
}

const ResidentCtx = createContext<ResidentContextValue | null>(null);

const DEMO_RESIDENT_ID = 'demo-resident-id-0000-000000000001';

export function ResidentProvider({ children }: { children: ReactNode }) {
  const [resident, setResident] = useState<Resident | null>(null);
  const [residentId, setResidentId] = useState(DEMO_RESIDENT_ID);
  const [pendingReminder, setPendingReminder] = useState<ReminderEvent | null>(null);

  useEffect(() => {
    fetch(`/api/residents/${residentId}`)
      .then(r => r.json())
      .then(setResident)
      .catch(console.error);
  }, [residentId]);

  // SSE event stream for reminders
  useEffect(() => {
    if (!residentId) return;
    const es = new EventSource(`/api/events/stream?residentId=${residentId}`);
    es.onmessage = (e) => {
      const event = JSON.parse(e.data);
      if (event.type === 'reminder') {
        setPendingReminder(event);
      }
    };
    es.onerror = () => {
      setTimeout(() => es.close(), 5000);
    };
    return () => es.close();
  }, [residentId]);

  return (
    <ResidentCtx.Provider
      value={{
        resident,
        setResidentId,
        pendingReminder,
        clearReminder: () => setPendingReminder(null),
      }}
    >
      {children}
    </ResidentCtx.Provider>
  );
}

export function useResident() {
  const ctx = useContext(ResidentCtx);
  if (!ctx) throw new Error('useResident must be inside ResidentProvider');
  return ctx;
}
```

**Step 2: Replace `apps/web/src/App.tsx`**

```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ResidentProvider } from './context/ResidentContext';
import IdleScreen from './screens/IdleScreen';
import ConversationScreen from './screens/ConversationScreen';
import VideoScreen from './screens/VideoScreen';
import GamesScreen from './screens/GamesScreen';
import MusicScreen from './screens/MusicScreen';
import AdminLogin from './screens/admin/AdminLogin';
import AdminLayout from './screens/admin/AdminLayout';
import AdminResidents from './screens/admin/AdminResidents';
import AdminSchedules from './screens/admin/AdminSchedules';
import AdminNotifications from './screens/admin/AdminNotifications';
import ReminderOverlay from './components/ReminderOverlay';

export default function App() {
  return (
    <BrowserRouter>
      <ResidentProvider>
        <ReminderOverlay />
        <Routes>
          {/* Kiosk routes */}
          <Route path="/" element={<IdleScreen />} />
          <Route path="/conversation" element={<ConversationScreen />} />
          <Route path="/video" element={<VideoScreen />} />
          <Route path="/games" element={<GamesScreen />} />
          <Route path="/music" element={<MusicScreen />} />
          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/residents" replace />} />
            <Route path="residents" element={<AdminResidents />} />
            <Route path="schedules" element={<AdminSchedules />} />
            <Route path="notifications" element={<AdminNotifications />} />
          </Route>
        </Routes>
      </ResidentProvider>
    </BrowserRouter>
  );
}
```

**Step 3: Create placeholder screen files** (all will be filled in subsequent tasks)

Create each of these with a minimal placeholder:

`apps/web/src/screens/IdleScreen.tsx`:
```tsx
export default function IdleScreen() {
  return <div className="flex h-screen items-center justify-center text-kiosk-2xl">Idle</div>;
}
```

Do the same for: `ConversationScreen.tsx`, `VideoScreen.tsx`, `GamesScreen.tsx`, `MusicScreen.tsx`.

`apps/web/src/screens/admin/AdminLogin.tsx`:
```tsx
export default function AdminLogin() {
  return <div>Admin Login</div>;
}
```

Do the same for: `AdminLayout.tsx`, `AdminResidents.tsx`, `AdminSchedules.tsx`, `AdminNotifications.tsx`.

`apps/web/src/components/ReminderOverlay.tsx`:
```tsx
export default function ReminderOverlay() {
  return null;
}
```

**Step 4: Run web tests (App now imports unimplemented screens, test should still pass structurally)**

```bash
cd apps/web && npm test
```

**Step 5: Commit**

```bash
git add apps/web/src/
git commit -m "feat: app shell with routing and resident context"
```

---

## Task 14: IdleScreen Component

**Files:**
- Modify: `apps/web/src/screens/IdleScreen.tsx`
- Create: `apps/web/src/components/AvatarAnimation.tsx`

**Step 1: Create `apps/web/src/components/AvatarAnimation.tsx`**

```tsx
interface Props {
  state: 'idle' | 'listening' | 'speaking';
  name: string;
}

export default function AvatarAnimation({ state, name }: Props) {
  const colors = {
    idle: 'bg-blue-500',
    listening: 'bg-green-500',
    speaking: 'bg-purple-500',
  };

  const animations = {
    idle: 'animate-pulse',
    listening: 'animate-bounce',
    speaking: 'animate-ping',
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="relative flex h-48 w-48 items-center justify-center">
        <div
          className={`absolute h-48 w-48 rounded-full opacity-30 ${colors[state]} ${animations[state]}`}
        />
        <div className={`h-36 w-36 rounded-full ${colors[state]} flex items-center justify-center shadow-2xl`}>
          <span className="text-6xl">🤖</span>
        </div>
      </div>
      <p className="text-kiosk-base text-gray-300">{name}</p>
    </div>
  );
}
```

**Step 2: Replace `apps/web/src/screens/IdleScreen.tsx`**

```tsx
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useResident } from '../context/ResidentContext';
import AvatarAnimation from '../components/AvatarAnimation';

const INACTIVITY_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

export default function IdleScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resident } = useResident();
  const inactivityTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const resetTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    // On idle screen inactivity just keeps us here; timer is more relevant on other screens
  };

  useEffect(() => {
    window.addEventListener('pointerdown', resetTimer);
    return () => window.removeEventListener('pointerdown', resetTimer);
  }, []);

  if (!resident) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-between bg-gray-950 p-8">
      {/* Avatar */}
      <div className="flex flex-1 flex-col items-center justify-center gap-4">
        <AvatarAnimation state="idle" name={resident.avatarName} />
        <h1 className="text-kiosk-2xl font-bold text-white">
          {t('idle.greeting', { name: resident.name })}
        </h1>
      </div>

      {/* Action buttons */}
      <div className="grid w-full max-w-2xl grid-cols-2 gap-4">
        <button
          className="col-span-2 flex min-h-touch items-center justify-center rounded-2xl bg-blue-600 p-6 text-kiosk-xl font-bold text-white shadow-lg active:bg-blue-700"
          onClick={() => navigate('/conversation')}
        >
          🎤 {t('idle.tapToTalk')}
        </button>
        <button
          className="flex min-h-touch items-center justify-center rounded-2xl bg-green-600 p-4 text-kiosk-lg font-semibold text-white shadow-lg active:bg-green-700"
          onClick={() => navigate('/video')}
        >
          📹 {t('idle.videoCall')}
        </button>
        <button
          className="flex min-h-touch items-center justify-center rounded-2xl bg-yellow-600 p-4 text-kiosk-lg font-semibold text-white shadow-lg active:bg-yellow-700"
          onClick={() => navigate('/games')}
        >
          🎮 {t('idle.games')}
        </button>
        <button
          className="col-span-2 flex min-h-touch items-center justify-center rounded-2xl bg-purple-600 p-4 text-kiosk-lg font-semibold text-white shadow-lg active:bg-purple-700"
          onClick={() => navigate('/music')}
        >
          🎵 {t('idle.music')}
        </button>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add apps/web/src/
git commit -m "feat: idle screen with avatar animation and nav buttons"
```

---

## Task 15: Conversation Screen

**Files:**
- Modify: `apps/web/src/screens/ConversationScreen.tsx`
- Create: `apps/web/src/hooks/useVoice.ts`
- Create: `apps/web/src/hooks/useConversationStream.ts`

**Step 1: Create `apps/web/src/hooks/useVoice.ts`**

```typescript
import { useState, useCallback, useRef } from 'react';

export function useVoice(language: string) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback((): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SpeechRecognition =
        window.SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = language === 'de' ? 'de-DE' : 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognitionRef.current = recognition;
      setIsListening(true);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        resolve(transcript);
      };

      recognition.onerror = (event) => {
        reject(new Error(event.error));
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    });
  }, [language]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const speak = useCallback((text: string, lang: string): Promise<void> => {
    return new Promise((resolve) => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'de' ? 'de-DE' : 'en-US';
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  return { isListening, startListening, stopListening, speak };
}
```

**Step 2: Create `apps/web/src/hooks/useConversationStream.ts`**

```typescript
import { useCallback } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useConversationStream() {
  const sendMessage = useCallback(
    async (
      residentId: string,
      message: string,
      history: Message[],
      onChunk: (chunk: string) => void,
      onDone: (fullText: string) => void,
      onError: (msg: string) => void
    ) => {
      const response = await fetch('/api/conversation/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ residentId, message, history }),
      });

      if (!response.ok || !response.body) {
        onError('Verbindungsfehler');
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === 'delta') {
              fullText += event.text;
              onChunk(event.text);
            } else if (event.type === 'done') {
              onDone(fullText);
            } else if (event.type === 'error') {
              onError(event.message);
            }
          } catch {
            // ignore parse errors
          }
        }
      }
    },
    []
  );

  return { sendMessage };
}
```

**Step 3: Replace `apps/web/src/screens/ConversationScreen.tsx`**

```tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useResident } from '../context/ResidentContext';
import { useVoice } from '../hooks/useVoice';
import { useConversationStream } from '../hooks/useConversationStream';
import AvatarAnimation from '../components/AvatarAnimation';

type State = 'idle' | 'listening' | 'thinking' | 'speaking';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const INACTIVITY_MS = 2 * 60 * 1000;

export default function ConversationScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resident } = useResident();
  const [state, setState] = useState<State>('idle');
  const [transcript, setTranscript] = useState('');
  const [history, setHistory] = useState<Message[]>([]);
  const [avatarText, setAvatarText] = useState('');
  const inactivityTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const { isListening, startListening, stopListening, speak } = useVoice(
    resident?.language ?? 'de'
  );
  const { sendMessage } = useConversationStream();

  const resetInactivity = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => navigate('/'), INACTIVITY_MS);
  };

  useEffect(() => {
    resetInactivity();
    return () => { if (inactivityTimer.current) clearTimeout(inactivityTimer.current); };
  }, []);

  const handleListen = async () => {
    if (!resident || state !== 'idle') return;
    resetInactivity();

    try {
      setState('listening');
      const userText = await startListening();
      setTranscript(userText);
      setState('thinking');
      setAvatarText('');

      const newHistory: Message[] = [...history, { role: 'user', content: userText }];
      let fullResponse = '';

      await sendMessage(
        resident.id,
        userText,
        history,
        (chunk) => {
          fullResponse += chunk;
          setAvatarText(prev => prev + chunk);
        },
        async (full) => {
          setState('speaking');
          setHistory([...newHistory, { role: 'assistant', content: full }]);
          await speak(full, resident.language);
          setState('idle');
          setAvatarText('');
        },
        (err) => {
          console.error(err);
          setState('idle');
          setAvatarText(t('conversation.error'));
        }
      );
    } catch (err) {
      console.error(err);
      setState('idle');
    }
  };

  if (!resident) return null;

  return (
    <div className="flex h-screen flex-col items-center justify-between bg-gray-950 p-8"
      onPointerDown={resetInactivity}
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-6 w-full max-w-2xl">
        <AvatarAnimation state={state === 'idle' ? 'idle' : state === 'listening' ? 'listening' : 'speaking'} name={resident.avatarName} />

        {avatarText && (
          <div className="rounded-2xl bg-gray-800 p-6 text-kiosk-base text-white max-h-48 overflow-y-auto w-full">
            {avatarText}
          </div>
        )}

        {state === 'listening' && (
          <p className="text-kiosk-base text-green-400">{t('conversation.listening')}</p>
        )}
        {state === 'thinking' && (
          <p className="text-kiosk-base text-blue-400 animate-pulse">{t('conversation.thinking')}</p>
        )}
        {transcript && state !== 'listening' && (
          <p className="text-kiosk-sm text-gray-400 italic">"{transcript}"</p>
        )}
      </div>

      <div className="flex w-full max-w-2xl gap-4">
        <button
          disabled={state !== 'idle'}
          className="flex-1 min-h-touch rounded-2xl bg-blue-600 p-6 text-kiosk-xl font-bold text-white shadow-lg active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleListen}
        >
          {state === 'listening' ? '🔴' : '🎤'} {state === 'idle' ? t('idle.tapToTalk') : '...'}
        </button>
        <button
          className="min-h-touch rounded-2xl bg-gray-700 px-6 text-kiosk-base text-white shadow-lg active:bg-gray-600"
          onClick={() => { stopListening(); navigate('/'); }}
        >
          {t('conversation.endCall')}
        </button>
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add apps/web/src/
git commit -m "feat: conversation screen with voice STT + Claude streaming TTS"
```

---

## Task 16: Reminder Overlay Component

**Files:**
- Modify: `apps/web/src/components/ReminderOverlay.tsx`

**Step 1: Replace `apps/web/src/components/ReminderOverlay.tsx`**

```tsx
import { useTranslation } from 'react-i18next';
import { useResident } from '../context/ResidentContext';

export default function ReminderOverlay() {
  const { t } = useTranslation();
  const { pendingReminder, clearReminder } = useResident();

  if (!pendingReminder) return null;

  const message = t(`reminder.${pendingReminder.scheduleType}`, pendingReminder.title);

  const handleAcknowledge = async () => {
    try {
      await fetch(`/api/notifications/${pendingReminder.scheduleId}/acknowledge`, {
        method: 'PATCH',
      });
    } catch {
      // best effort
    }
    clearReminder();
  };

  const handleSnooze = () => {
    setTimeout(() => {
      // re-show after 5 min
    }, 5 * 60 * 1000);
    clearReminder();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-8">
      <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-2xl">
        <div className="mb-4 text-6xl">🔔</div>
        <h2 className="mb-2 text-kiosk-xl font-bold text-gray-900">{t('reminder.title')}</h2>
        <p className="mb-8 text-kiosk-lg text-gray-700">{pendingReminder.title}</p>
        <p className="mb-8 text-kiosk-base text-gray-500">{message}</p>
        <div className="flex gap-4">
          <button
            className="flex-1 min-h-touch rounded-2xl bg-blue-600 p-4 text-kiosk-lg font-bold text-white active:bg-blue-700"
            onClick={handleAcknowledge}
          >
            ✅ {t('reminder.confirm')}
          </button>
          <button
            className="flex-1 min-h-touch rounded-2xl bg-gray-200 p-4 text-kiosk-lg font-semibold text-gray-800 active:bg-gray-300"
            onClick={handleSnooze}
          >
            ⏰ {t('reminder.snooze')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/components/ReminderOverlay.tsx
git commit -m "feat: reminder overlay with acknowledge and snooze"
```

---

## Task 17: Video Call Screen

**Files:**
- Modify: `apps/web/src/screens/VideoScreen.tsx`

**Step 1: Replace `apps/web/src/screens/VideoScreen.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useResident } from '../context/ResidentContext';

export default function VideoScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resident } = useResident();
  const [roomUrl, setRoomUrl] = useState('');
  const [joined, setJoined] = useState(false);

  // Use resident's preferred video room if configured
  const defaultRoom = (resident?.preferences as any)?.videoRoom ?? '';

  const handleJoin = () => {
    const url = roomUrl || defaultRoom;
    if (url) setJoined(true);
  };

  if (joined) {
    const url = roomUrl || defaultRoom;
    return (
      <div className="flex h-screen flex-col bg-black">
        <div className="flex items-center justify-between bg-gray-900 p-4">
          <h1 className="text-kiosk-lg text-white">{t('video.title')}</h1>
          <button
            className="min-h-touch rounded-xl bg-red-600 px-6 text-kiosk-base text-white"
            onClick={() => { setJoined(false); navigate('/'); }}
          >
            {t('video.backToHome')}
          </button>
        </div>
        <iframe
          src={url}
          className="flex-1 w-full border-0"
          allow="camera; microphone; fullscreen; speaker; display-capture"
          title="Video Call"
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8 bg-gray-950 p-8">
      <h1 className="text-kiosk-2xl text-white">📹 {t('video.title')}</h1>

      {defaultRoom ? (
        <button
          className="min-h-touch rounded-2xl bg-green-600 px-12 py-6 text-kiosk-xl font-bold text-white"
          onClick={() => setJoined(true)}
        >
          {t('idle.videoCall')} starten
        </button>
      ) : (
        <div className="flex w-full max-w-lg flex-col gap-4">
          <input
            type="url"
            placeholder={t('video.roomPlaceholder')}
            className="w-full rounded-xl border-2 border-gray-600 bg-gray-800 p-4 text-kiosk-base text-white"
            value={roomUrl}
            onChange={e => setRoomUrl(e.target.value)}
          />
          <button
            disabled={!roomUrl}
            className="min-h-touch rounded-2xl bg-green-600 p-4 text-kiosk-lg font-bold text-white disabled:opacity-50"
            onClick={handleJoin}
          >
            Beitreten
          </button>
        </div>
      )}

      <button
        className="min-h-touch rounded-xl bg-gray-700 px-8 py-4 text-kiosk-base text-white"
        onClick={() => navigate('/')}
      >
        {t('video.backToHome')}
      </button>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/screens/VideoScreen.tsx
git commit -m "feat: video call screen with Daily.co iframe"
```

---

## Task 18: Games Screen — Memory Card

**Files:**
- Modify: `apps/web/src/screens/GamesScreen.tsx`
- Create: `apps/web/src/games/MemoryGame.tsx`
- Create: `apps/web/src/games/TriviaGame.tsx`

**Step 1: Create `apps/web/src/games/MemoryGame.tsx`**

```tsx
import { useState, useCallback } from 'react';

const EMOJIS = ['🌸', '🌺', '🌼', '🌻', '🍎', '🍊', '🍋', '🍇'];
const CARDS = [...EMOJIS, ...EMOJIS]
  .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
  .sort(() => Math.random() - 0.5);

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

export default function MemoryGame() {
  const [cards, setCards] = useState<Card[]>(CARDS);
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [won, setWon] = useState(false);

  const handleFlip = useCallback(
    (id: number) => {
      if (selected.length === 2) return;
      const card = cards[id];
      if (card.flipped || card.matched) return;

      const newCards = cards.map((c, i) => (i === id ? { ...c, flipped: true } : c));
      const newSelected = [...selected, id];
      setCards(newCards);
      setSelected(newSelected);

      if (newSelected.length === 2) {
        setMoves(m => m + 1);
        const [a, b] = newSelected;
        if (newCards[a].emoji === newCards[b].emoji) {
          const matched = newCards.map((c, i) =>
            i === a || i === b ? { ...c, matched: true } : c
          );
          setCards(matched);
          setSelected([]);
          if (matched.every(c => c.matched)) setWon(true);
        } else {
          setTimeout(() => {
            setCards(prev =>
              prev.map((c, i) => (i === a || i === b ? { ...c, flipped: false } : c))
            );
            setSelected([]);
          }, 1000);
        }
      }
    },
    [cards, selected]
  );

  if (won) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <p className="text-kiosk-2xl">🎉 Gewonnen!</p>
        <p className="text-kiosk-lg text-gray-300">{moves} Züge</p>
        <button
          className="min-h-touch rounded-2xl bg-blue-600 px-8 py-4 text-kiosk-lg text-white"
          onClick={() => {
            setCards(
              [...EMOJIS, ...EMOJIS]
                .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
                .sort(() => Math.random() - 0.5)
            );
            setSelected([]);
            setMoves(0);
            setWon(false);
          }}
        >
          Nochmal spielen
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <p className="text-kiosk-base text-gray-400">Züge: {moves}</p>
      <div className="grid grid-cols-4 gap-3">
        {cards.map((card, i) => (
          <button
            key={card.id}
            className={`h-20 w-20 rounded-xl text-4xl shadow-md transition-all ${
              card.flipped || card.matched
                ? 'bg-blue-600'
                : 'bg-gray-700'
            }`}
            onClick={() => handleFlip(i)}
          >
            {card.flipped || card.matched ? card.emoji : '?'}
          </button>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Create `apps/web/src/games/TriviaGame.tsx`**

```tsx
import { useState } from 'react';

const QUESTIONS_DE = [
  {
    q: 'Was ist die Hauptstadt von Deutschland?',
    answers: ['Berlin', 'München', 'Hamburg', 'Frankfurt'],
    correct: 0,
  },
  {
    q: 'Wie viele Monate hat ein Jahr?',
    answers: ['10', '11', '12', '13'],
    correct: 2,
  },
  {
    q: 'Welche Farbe hat der Himmel bei gutem Wetter?',
    answers: ['Grün', 'Blau', 'Rot', 'Gelb'],
    correct: 1,
  },
  {
    q: 'Was schwimmt auf dem Wasser?',
    answers: ['Stein', 'Holz', 'Eisen', 'Blei'],
    correct: 1,
  },
];

export default function TriviaGame() {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const question = QUESTIONS_DE[current];

  const handleAnswer = (idx: number) => {
    if (answered !== null) return;
    setAnswered(idx);
    if (idx === question.correct) setScore(s => s + 1);
    setTimeout(() => {
      if (current + 1 >= QUESTIONS_DE.length) {
        setDone(true);
      } else {
        setCurrent(c => c + 1);
        setAnswered(null);
      }
    }, 1500);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <p className="text-kiosk-2xl">Quiz beendet!</p>
        <p className="text-kiosk-xl text-yellow-400">
          {score} / {QUESTIONS_DE.length} richtig 🏆
        </p>
        <button
          className="min-h-touch rounded-2xl bg-blue-600 px-8 py-4 text-kiosk-lg text-white"
          onClick={() => { setCurrent(0); setScore(0); setAnswered(null); setDone(false); }}
        >
          Nochmal spielen
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-4">
      <p className="text-kiosk-sm text-gray-400">Frage {current + 1} / {QUESTIONS_DE.length}</p>
      <p className="text-kiosk-lg font-semibold text-white">{question.q}</p>
      <div className="grid grid-cols-2 gap-3">
        {question.answers.map((a, i) => {
          const isCorrect = i === question.correct;
          const isSelected = i === answered;
          let bg = 'bg-gray-700 active:bg-gray-600';
          if (answered !== null) {
            if (isCorrect) bg = 'bg-green-600';
            else if (isSelected) bg = 'bg-red-600';
          }
          return (
            <button
              key={i}
              className={`min-h-touch rounded-xl p-4 text-kiosk-base text-white ${bg}`}
              onClick={() => handleAnswer(i)}
            >
              {a}
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

**Step 3: Replace `apps/web/src/screens/GamesScreen.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MemoryGame from '../games/MemoryGame';
import TriviaGame from '../games/TriviaGame';

type GameView = 'menu' | 'memory' | 'trivia';

export default function GamesScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [view, setView] = useState<GameView>('menu');

  if (view === 'memory') {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-kiosk-xl text-white">🃏 {t('games.memory')}</h1>
          <button className="min-h-touch rounded-xl bg-gray-700 px-6 py-3 text-kiosk-base text-white" onClick={() => setView('menu')}>
            {t('games.backToHome')}
          </button>
        </div>
        <MemoryGame />
      </div>
    );
  }

  if (view === 'trivia') {
    return (
      <div className="min-h-screen bg-gray-950 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-kiosk-xl text-white">🧠 {t('games.trivia')}</h1>
          <button className="min-h-touch rounded-xl bg-gray-700 px-6 py-3 text-kiosk-base text-white" onClick={() => setView('menu')}>
            {t('games.backToHome')}
          </button>
        </div>
        <TriviaGame />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-6 bg-gray-950 p-8">
      <h1 className="text-kiosk-2xl text-white">🎮 {t('idle.games')}</h1>
      <div className="flex w-full max-w-lg flex-col gap-4">
        <button className="min-h-touch rounded-2xl bg-blue-600 p-6 text-kiosk-xl font-bold text-white" onClick={() => setView('memory')}>
          🃏 {t('games.memory')}
        </button>
        <button className="min-h-touch rounded-2xl bg-green-600 p-6 text-kiosk-xl font-bold text-white" onClick={() => setView('trivia')}>
          🧠 {t('games.trivia')}
        </button>
        <button className="min-h-touch rounded-xl bg-gray-700 p-4 text-kiosk-base text-white" onClick={() => navigate('/')}>
          {t('games.backToHome')}
        </button>
      </div>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add apps/web/src/
git commit -m "feat: games screen with Memory and Trivia"
```

---

## Task 19: Music Screen

**Files:**
- Modify: `apps/web/src/screens/MusicScreen.tsx`

**Step 1: Replace `apps/web/src/screens/MusicScreen.tsx`**

```tsx
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useResident } from '../context/ResidentContext';

// Curated YouTube playlists by genre
const PLAYLISTS: Record<string, { label: string; url: string }[]> = {
  Schlager: [
    { label: 'Schlager Hits', url: 'https://www.youtube.com/embed/videoseries?list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSK' },
  ],
  Klassik: [
    { label: 'Klassische Musik', url: 'https://www.youtube.com/embed/videoseries?list=PLhQjrBAgIEJub-ZB1VR4fRWWCuXbLQ7EN' },
  ],
  Jazz: [
    { label: 'Entspannender Jazz', url: 'https://www.youtube.com/embed/videoseries?list=PLkqz3S84Tw-QHIfcPHKqS-F5Pj5_4WrDT' },
  ],
};

const DEFAULT_PLAYLIST = { label: 'Entspannende Musik', url: 'https://www.youtube.com/embed/videoseries?list=PLhQjrBAgIEJub-ZB1VR4fRWWCuXbLQ7EN' };

export default function MusicScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { resident } = useResident();

  const genre = (resident?.preferences as any)?.music ?? 'Schlager';
  const playlists = PLAYLISTS[genre] ?? [DEFAULT_PLAYLIST];
  const playlist = playlists[0];

  return (
    <div className="flex h-screen flex-col bg-gray-950">
      <div className="flex items-center justify-between p-4">
        <h1 className="text-kiosk-xl text-white">🎵 {t('music.title')}</h1>
        <button
          className="min-h-touch rounded-xl bg-gray-700 px-6 py-3 text-kiosk-base text-white"
          onClick={() => navigate('/')}
        >
          {t('music.backToHome')}
        </button>
      </div>
      <p className="px-4 text-kiosk-sm text-gray-400">{genre} — {playlist.label}</p>
      <div className="flex-1 p-4">
        <iframe
          src={playlist.url}
          className="h-full w-full rounded-2xl border-0"
          allow="autoplay; encrypted-media"
          title="Music Player"
        />
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/screens/MusicScreen.tsx
git commit -m "feat: music screen with YouTube playlist embed"
```

---

## Task 20: Admin — Auth Context + Login Page

**Files:**
- Create: `apps/web/src/context/AdminAuthContext.tsx`
- Modify: `apps/web/src/screens/admin/AdminLogin.tsx`
- Modify: `apps/web/src/screens/admin/AdminLayout.tsx`

**Step 1: Create `apps/web/src/context/AdminAuthContext.tsx`**

```tsx
import { createContext, useContext, useState, ReactNode } from 'react';

interface AuthState {
  token: string | null;
  user: { name: string; role: string } | null;
}

interface AdminAuthContextValue extends AuthState {
  login: (token: string, user: AuthState['user']) => void;
  logout: () => void;
}

const AdminAuthCtx = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    const token = sessionStorage.getItem('admin_token');
    const userStr = sessionStorage.getItem('admin_user');
    return {
      token,
      user: userStr ? JSON.parse(userStr) : null,
    };
  });

  const login = (token: string, user: AuthState['user']) => {
    sessionStorage.setItem('admin_token', token);
    sessionStorage.setItem('admin_user', JSON.stringify(user));
    setAuth({ token, user });
  };

  const logout = () => {
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('admin_user');
    setAuth({ token: null, user: null });
  };

  return (
    <AdminAuthCtx.Provider value={{ ...auth, login, logout }}>
      {children}
    </AdminAuthCtx.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthCtx);
  if (!ctx) throw new Error('useAdminAuth must be inside AdminAuthProvider');
  return ctx;
}
```

**Step 2: Update `App.tsx`** to wrap admin routes with AdminAuthProvider

Add `import { AdminAuthProvider } from './context/AdminAuthContext';` and wrap the `/admin` routes:

```tsx
<Route path="/admin/login" element={<AdminAuthProvider><AdminLogin /></AdminAuthProvider>} />
<Route path="/admin" element={<AdminAuthProvider><AdminLayout /></AdminAuthProvider>}>
```

**Step 3: Replace `apps/web/src/screens/admin/AdminLogin.tsx`**

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Anmeldung fehlgeschlagen');
        return;
      }
      login(data.token, data.user);
      navigate('/admin/residents');
    } catch {
      setError('Verbindungsfehler');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl"
      >
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Altenheim Admin</h1>
        {error && <p className="mb-4 rounded-lg bg-red-100 p-3 text-red-700">{error}</p>}
        <div className="mb-4">
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('admin.email')}</label>
          <input
            type="email"
            required
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-6">
          <label className="mb-1 block text-sm font-medium text-gray-700">{t('admin.password')}</label>
          <input
            type="password"
            required
            className="w-full rounded-lg border border-gray-300 p-3 text-gray-900"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 p-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? '...' : t('admin.login')}
        </button>
      </form>
    </div>
  );
}
```

**Step 4: Replace `apps/web/src/screens/admin/AdminLayout.tsx`**

```tsx
import { Navigate, Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLayout() {
  const { t } = useTranslation();
  const { token, user, logout } = useAdminAuth();
  const navigate = useNavigate();

  if (!token) return <Navigate to="/admin/login" replace />;

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-56 bg-gray-900 p-4 flex flex-col">
        <h2 className="mb-6 text-lg font-bold text-white">Altenheim Admin</h2>
        <nav className="flex flex-col gap-2 flex-1">
          <Link to="/admin/residents" className="rounded-lg p-3 text-gray-300 hover:bg-gray-700">
            👥 {t('admin.residents')}
          </Link>
          <Link to="/admin/schedules" className="rounded-lg p-3 text-gray-300 hover:bg-gray-700">
            📅 {t('admin.schedules')}
          </Link>
          <Link to="/admin/notifications" className="rounded-lg p-3 text-gray-300 hover:bg-gray-700">
            🔔 {t('admin.notifications')}
          </Link>
        </nav>
        <div className="border-t border-gray-700 pt-4">
          <p className="mb-2 text-sm text-gray-400">{user?.name}</p>
          <button
            onClick={handleLogout}
            className="w-full rounded-lg bg-gray-700 p-2 text-sm text-gray-300 hover:bg-gray-600"
          >
            {t('admin.logout')}
          </button>
        </div>
      </div>
      {/* Main */}
      <div className="flex-1 overflow-auto p-8">
        <Outlet />
      </div>
    </div>
  );
}
```

**Step 5: Commit**

```bash
git add apps/web/src/
git commit -m "feat: admin auth context, login page, and layout"
```

---

## Task 21: Admin — Residents Page

**Files:**
- Modify: `apps/web/src/screens/admin/AdminResidents.tsx`

**Step 1: Replace `apps/web/src/screens/admin/AdminResidents.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface Resident {
  id: string;
  name: string;
  roomNumber: string;
  language: string;
  avatarName: string;
  active: boolean;
}

export default function AdminResidents() {
  const { token } = useAdminAuth();
  const [residents, setResidents] = useState<Resident[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', roomNumber: '', language: 'de', avatarName: 'Lena' });

  const fetchResidents = async () => {
    const res = await fetch('/api/residents', {
      headers: { Authorization: `Bearer ${token}` },
    });
    setResidents(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchResidents(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/residents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    setForm({ name: '', roomNumber: '', language: 'de', avatarName: 'Lena' });
    fetchResidents();
  };

  const handleDeactivate = async (id: string) => {
    await fetch(`/api/residents/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchResidents();
  };

  if (loading) return <div className="text-gray-600">Laden...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Bewohner</h1>
        <button
          onClick={() => setShowForm(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          + Bewohner hinzufügen
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold">Neuer Bewohner</h2>
          <div className="grid grid-cols-2 gap-4">
            <input required placeholder="Name" className="rounded-lg border p-2" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            <input required placeholder="Zimmer" className="rounded-lg border p-2" value={form.roomNumber} onChange={e => setForm({...form, roomNumber: e.target.value})} />
            <select className="rounded-lg border p-2" value={form.language} onChange={e => setForm({...form, language: e.target.value})}>
              <option value="de">Deutsch</option>
              <option value="en">English</option>
            </select>
            <input placeholder="Avatar Name" className="rounded-lg border p-2" value={form.avatarName} onChange={e => setForm({...form, avatarName: e.target.value})} />
          </div>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white">Speichern</button>
            <button type="button" className="rounded-lg bg-gray-200 px-4 py-2" onClick={() => setShowForm(false)}>Abbrechen</button>
          </div>
        </form>
      )}

      <div className="rounded-xl bg-white shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm text-gray-600">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4">Zimmer</th>
              <th className="p-4">Sprache</th>
              <th className="p-4">Avatar</th>
              <th className="p-4">Status</th>
              <th className="p-4">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {residents.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-4 font-medium">{r.name}</td>
                <td className="p-4">{r.roomNumber}</td>
                <td className="p-4">{r.language.toUpperCase()}</td>
                <td className="p-4">{r.avatarName}</td>
                <td className="p-4">
                  <span className={`rounded-full px-2 py-1 text-xs ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.active ? 'Aktiv' : 'Inaktiv'}
                  </span>
                </td>
                <td className="p-4">
                  {r.active && (
                    <button
                      onClick={() => handleDeactivate(r.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Deaktivieren
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add apps/web/src/screens/admin/AdminResidents.tsx
git commit -m "feat: admin residents management page"
```

---

## Task 22: Admin — Schedules + Notifications Pages

**Files:**
- Modify: `apps/web/src/screens/admin/AdminSchedules.tsx`
- Modify: `apps/web/src/screens/admin/AdminNotifications.tsx`

**Step 1: Replace `apps/web/src/screens/admin/AdminSchedules.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface Resident { id: string; name: string; }
interface Schedule { id: string; residentId: string; type: string; title: string; cronExpression: string; active: boolean; }

export default function AdminSchedules() {
  const { token } = useAdminAuth();
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ residentId: '', type: 'medication', title: '', cronExpression: '0 8 * * *' });

  const fetchAll = async () => {
    const [s, r] = await Promise.all([
      fetch('/api/schedules', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch('/api/residents', { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]);
    setSchedules(s);
    setResidents(r);
    if (r.length > 0 && !form.residentId) setForm(f => ({ ...f, residentId: r[0].id }));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/schedules', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    setShowForm(false);
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/schedules/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchAll();
  };

  const residentName = (id: string) => residents.find(r => r.id === id)?.name ?? id;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Termine & Erinnerungen</h1>
        <button onClick={() => setShowForm(true)} className="rounded-lg bg-blue-600 px-4 py-2 text-white">
          + Termin hinzufügen
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl bg-white p-6 shadow">
          <div className="grid grid-cols-2 gap-4">
            <select className="rounded-lg border p-2" value={form.residentId} onChange={e => setForm({...form, residentId: e.target.value})}>
              {residents.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
            <select className="rounded-lg border p-2" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              <option value="medication">Medikament</option>
              <option value="appointment">Termin</option>
              <option value="activity">Aktivität</option>
            </select>
            <input required placeholder="Titel" className="rounded-lg border p-2" value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
            <input required placeholder="Cron (z.B. 0 8 * * *)" className="rounded-lg border p-2 font-mono" value={form.cronExpression} onChange={e => setForm({...form, cronExpression: e.target.value})} />
          </div>
          <p className="mt-2 text-xs text-gray-500">Cron-Format: Minute Stunde * * * (Täglich um 8:00 = "0 8 * * *")</p>
          <div className="mt-4 flex gap-2">
            <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-white">Speichern</button>
            <button type="button" className="rounded-lg bg-gray-200 px-4 py-2" onClick={() => setShowForm(false)}>Abbrechen</button>
          </div>
        </form>
      )}

      <div className="rounded-xl bg-white shadow overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-sm text-gray-600">
            <tr>
              <th className="p-4">Bewohner</th>
              <th className="p-4">Typ</th>
              <th className="p-4">Titel</th>
              <th className="p-4">Cron</th>
              <th className="p-4">Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {schedules.map(s => (
              <tr key={s.id} className="border-t">
                <td className="p-4">{residentName(s.residentId)}</td>
                <td className="p-4 capitalize">{s.type}</td>
                <td className="p-4 font-medium">{s.title}</td>
                <td className="p-4 font-mono text-sm">{s.cronExpression}</td>
                <td className="p-4">
                  <button onClick={() => handleDelete(s.id)} className="text-sm text-red-600 hover:underline">Löschen</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

**Step 2: Replace `apps/web/src/screens/admin/AdminNotifications.tsx`**

```tsx
import { useState, useEffect } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';

interface Notification { id: string; residentId: string; title: string; type: string; acknowledged: boolean; createdAt: string; }

export default function AdminNotifications() {
  const { token } = useAdminAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications', { headers: { Authorization: `Bearer ${token}` } });
    setNotifications(await res.json());
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Benachrichtigungen</h1>
        <button onClick={fetchNotifications} className="rounded-lg bg-gray-200 px-4 py-2 text-sm">
          Aktualisieren
        </button>
      </div>

      {notifications.length === 0 && (
        <p className="text-gray-500">Keine offenen Benachrichtigungen.</p>
      )}

      <div className="flex flex-col gap-3">
        {notifications.map(n => (
          <div key={n.id} className="rounded-xl bg-white p-4 shadow flex items-center justify-between">
            <div>
              <p className="font-semibold text-gray-900">{n.title}</p>
              <p className="text-sm text-gray-500 capitalize">{n.type} · {new Date(n.createdAt).toLocaleString('de-DE')}</p>
            </div>
            <span className="rounded-full bg-yellow-100 px-3 py-1 text-sm text-yellow-700">Ausstehend</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add apps/web/src/screens/admin/
git commit -m "feat: admin schedules and notifications pages"
```

---

## Task 23: Playwright E2E Tests

**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/kiosk.spec.ts`
- Create: `apps/web/e2e/admin.spec.ts`

**Step 1: Create `apps/web/playwright.config.ts`**

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
  },
});
```

**Step 2: Create `apps/web/e2e/kiosk.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test('idle screen loads with greeting and buttons', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText(/Hallo/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/Tippen zum Sprechen/i)).toBeVisible();
  await expect(page.getByText(/Video Anruf/i)).toBeVisible();
  await expect(page.getByText(/Spiele/i)).toBeVisible();
  await expect(page.getByText(/Musik/i)).toBeVisible();
});

test('navigates to games screen and shows game options', async ({ page }) => {
  await page.goto('/');
  await page.getByText(/Spiele/i).click();
  await expect(page.getByText(/Memory/i)).toBeVisible();
  await expect(page.getByText(/Quiz/i)).toBeVisible();
});

test('navigates to music screen', async ({ page }) => {
  await page.goto('/');
  await page.getByText(/Musik/i).click();
  await expect(page.getByText(/Musik/i).first()).toBeVisible();
});

test('memory game card flip works', async ({ page }) => {
  await page.goto('/games');
  await page.getByText(/Memory/i).click();
  const cards = page.locator('button:has-text("?")');
  await expect(cards.first()).toBeVisible();
  await cards.first().click();
  // After click, at least one card shows emoji (not ?)
  const flipped = page.locator('button').filter({ hasNotText: '?' });
  await expect(flipped.first()).toBeVisible();
});
```

**Step 3: Create `apps/web/e2e/admin.spec.ts`**

```typescript
import { test, expect } from '@playwright/test';

test('admin login page loads', async ({ page }) => {
  await page.goto('/admin/login');
  await expect(page.getByText('Altenheim Admin')).toBeVisible();
  await expect(page.locator('input[type="email"]')).toBeVisible();
});

test('admin login with valid credentials redirects to residents', async ({ page }) => {
  await page.goto('/admin/login');
  await page.locator('input[type="email"]').fill('admin@altenheim.de');
  await page.locator('input[type="password"]').fill('admin123');
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL('/admin/residents', { timeout: 10_000 });
  await expect(page.getByText('Bewohner')).toBeVisible();
});

test('admin shows residents table', async ({ page }) => {
  await page.goto('/admin/login');
  await page.locator('input[type="email"]').fill('admin@altenheim.de');
  await page.locator('input[type="password"]').fill('admin123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL('/admin/residents');
  await expect(page.getByText('Maria Müller')).toBeVisible();
});
```

**Step 4: Install Playwright browsers**

```bash
cd apps/web && npx playwright install chromium
```

**Step 5: Commit**

```bash
git add apps/web/playwright.config.ts apps/web/e2e/
git commit -m "feat: Playwright E2E tests for kiosk and admin"
```

---

## Task 24: Local Run + Verification

**Step 1: Copy `.env` to server if not done**

```bash
cp D:/projects/Altenheim_avatar/.env.example D:/projects/Altenheim_avatar/apps/server/.env
```

Edit `apps/server/.env` and fill in real values:
- `ANTHROPIC_API_KEY` — real key
- `JWT_SECRET` — at least 32 random chars (e.g. `openssl rand -hex 32`)
- `DATABASE_URL` — `postgresql://postgres:password@localhost:5432/altenheim`

**Step 2: Ensure PostgreSQL is running**

```bash
docker ps | grep altenheim-postgres
# If not running:
docker start altenheim-postgres
```

**Step 3: Run migrations and seed**

```bash
cd D:/projects/Altenheim_avatar/apps/server
npm run db:migrate
npm run db:seed
```

**Step 4: Start both apps**

```bash
cd D:/projects/Altenheim_avatar
npm run dev
```

Expected output:
```
[server] Server running on http://localhost:3001
[server] Reminder engine started
[web]    Local: http://localhost:5173
```

**Step 5: Verify server health**

```bash
curl http://localhost:3001/health
```

Expected: `{"status":"ok","timestamp":"..."}`

**Step 6: Run server unit tests**

```bash
cd apps/server && npm test
```

Expected: all green.

**Step 7: Run E2E tests**

```bash
cd apps/web && npm run test:e2e
```

Expected: all Playwright tests passing.

**Step 8: Manual smoke test**

Open browser to `http://localhost:5173`:
- [ ] Idle screen shows resident name "Maria Müller"
- [ ] Avatar animation visible
- [ ] Tap "Spiele" → Games menu appears
- [ ] Tap Memory → cards appear, flip works
- [ ] Tap "Zurück" → back to games menu
- [ ] Open `http://localhost:5173/admin/login`
- [ ] Login with `admin@altenheim.de` / `admin123`
- [ ] Residents table shows Maria Müller
- [ ] Navigate to Termine → see demo schedule
- [ ] Navigate to Benachrichtigungen → empty (no triggered reminders yet)

**Step 9: Final commit**

```bash
cd D:/projects/Altenheim_avatar
git add .
git commit -m "feat: complete Altenheim Avatar MVP — kiosk + admin + conversation + reminders"
```

---

## Summary

| Task | What it builds |
|------|---------------|
| 1 | Monorepo root (workspaces, concurrently) |
| 2 | Server: Express + TypeScript scaffold |
| 3 | Web: React + Vite + Tailwind scaffold |
| 4 | PostgreSQL via Docker + Prisma schema + migration |
| 5 | Prisma singleton + env validation (Zod) |
| 6 | JWT auth — login endpoint |
| 7 | Residents CRUD API |
| 8 | Schedules CRUD API |
| 9 | ConversationProvider interface + ClaudeProvider (SSE streaming) |
| 10 | SSE event bus + reminder engine (node-cron) |
| 11 | Notifications API |
| 12 | i18n (de/en) |
| 13 | App shell + routing + ResidentContext |
| 14 | Idle screen |
| 15 | Conversation screen (voice STT + TTS + streaming) |
| 16 | Reminder overlay |
| 17 | Video call screen (Daily.co iframe) |
| 18 | Games: Memory + Trivia |
| 19 | Music screen (YouTube embed) |
| 20 | Admin: auth context + login + layout |
| 21 | Admin: residents page |
| 22 | Admin: schedules + notifications pages |
| 23 | Playwright E2E tests |
| 24 | Local run + verification |
