import { execFileSync } from 'node:child_process';
import { config as loadDotenv } from 'dotenv';

loadDotenv({ path: '.env.test', quiet: true });
loadDotenv({ quiet: true });

const databaseUrl = process.env['TEST_DATABASE_URL'];

if (!databaseUrl) {
  console.error('TEST_DATABASE_URL is not set. Copy .env.example to .env first.');
  process.exit(1);
}

execFileSync('npx', ['prisma', 'migrate', 'deploy'], {
  stdio: 'inherit',
  env: { ...process.env, DATABASE_URL: databaseUrl },
});
