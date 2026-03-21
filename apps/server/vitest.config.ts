import { defineConfig } from 'vitest/config';
import { config } from 'dotenv';
import path from 'path';

config({ path: path.resolve(__dirname, '.env'), override: true });

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
  },
});
