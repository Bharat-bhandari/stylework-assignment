import { config as loadDotenv } from 'dotenv';
import { defineConfig } from 'vitest/config';

loadDotenv({ path: '.env.test', quiet: true });
loadDotenv({ quiet: true });

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
      DATABASE_URL: process.env['TEST_DATABASE_URL'] ?? process.env['DATABASE_URL'] ?? '',
      META_APP_SECRET: process.env['META_APP_SECRET'] ?? 'test-app-secret',
      META_VERIFY_TOKEN: process.env['META_VERIFY_TOKEN'] ?? 'test-verify-token',
      LEAD_PROVIDER: 'mock',
      ENABLE_DEMO_TOOLS: 'true',
    },
    // Tests share one database, so files must not race each other.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 20_000,
  },
});
