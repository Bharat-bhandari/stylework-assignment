import { config as loadDotenv } from 'dotenv';
import { z } from 'zod';

loadDotenv({ quiet: true });

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().max(65535).default(4000),
    LOG_LEVEL: z
      .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
      .default('info'),
    DATABASE_URL: z.string().min(1).startsWith('postgres'),
    META_APP_SECRET: z.string().min(1),
    META_VERIFY_TOKEN: z.string().min(1),
    META_ACCESS_TOKEN: z.string().optional(),
    META_GRAPH_API_VERSION: z.string().regex(/^v\d+\.\d+$/).default('v23.0'),
    LEAD_PROVIDER: z.enum(['mock', 'graph']).default('mock'),
    ENABLE_DEMO_TOOLS: z
      .enum(['true', 'false'])
      .default('false')
      .transform((value) => value === 'true'),
    CORS_ORIGIN: z.string().min(1).default('http://localhost:5173'),
  })
  .refine((value) => value.LEAD_PROVIDER !== 'graph' || Boolean(value.META_ACCESS_TOKEN), {
    path: ['META_ACCESS_TOKEN'],
    message: 'required when LEAD_PROVIDER=graph',
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Field names and rules only, never values: this output ends up in CI logs.
  console.error('Invalid environment configuration:', z.flattenError(parsed.error).fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
