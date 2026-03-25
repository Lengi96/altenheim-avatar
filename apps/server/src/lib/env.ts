import { config } from 'dotenv';
import { z } from 'zod';

// Load .env before parsing — override system vars so local .env always wins
config({ override: true });

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  ANTHROPIC_API_KEY: z.string().min(1),
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

export const env = envSchema.parse(process.env);
