import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { env } from './config/env.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import devRoute from './routes/dev.route.js';
import healthRoute from './routes/health.route.js';
import leadRoute from './routes/lead.route.js';
import metaWebhookRoute from './routes/metaWebhook.route.js';
import { httpLogger } from './utils/logger.js';

export const buildApp = (): Express => {
  const app = express();

  app.disable('x-powered-by');
  // Two hops in deployment (host nginx, then the web container's nginx). A count rather than
  // `true` so a client cannot forge its own address by sending X-Forwarded-For.
  app.set('trust proxy', 2);

  app.use(httpLogger);
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(',').map((origin) => origin.trim()),
      methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    }),
  );
  // Mounted before express.json() so the webhook keeps the raw bytes its signature covers.
  app.use('/webhook/meta-lead', metaWebhookRoute);

  app.use(express.json({ limit: '1mb' }));

  app.use('/health', healthRoute);
  app.use('/leads', leadRoute);

  if (env.ENABLE_DEMO_TOOLS) {
    app.use('/dev', devRoute);
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
