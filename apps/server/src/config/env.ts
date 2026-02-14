import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// .env liegt im Monorepo-Root (2 Ebenen über apps/server/src/config/)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.resolve(__dirname, '../../../../.env');
dotenv.config({ path: envPath, override: false });

const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().default(''),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL muss gesetzt sein'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET muss mindestens 32 Zeichen lang sein'),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Ungültige Umgebungsvariablen:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

/** Prüft ob der API-Key gesetzt ist (für Server-Start) */
export function requireApiKey(): void {
  if (!env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY.length < 20) {
    console.error('FEHLER: ANTHROPIC_API_KEY ist nicht korrekt gesetzt. Bitte .env Datei prüfen.');
    process.exit(1);
  }
}
