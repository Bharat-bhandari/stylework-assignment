import { buildApp } from './app.js';
import { disconnectDatabase } from './config/db.js';
import { env } from './config/env.js';
import { sweepPendingWebhookEvents } from './service/webhookEvent.service.js';
import { logger } from './utils/logger.js';

const SHUTDOWN_TIMEOUT_MS = 10_000;
const RETRY_SWEEP_INTERVAL_MS = 30_000;

const app = buildApp();

const server = app.listen(env.PORT, () => {
  logger.info(
    { port: env.PORT, nodeEnv: env.NODE_ENV, leadProvider: env.LEAD_PROVIDER },
    'API listening',
  );
});

const retrySweeper = setInterval(() => {
  void sweepPendingWebhookEvents().catch((error: unknown) => {
    logger.error({ err: error }, 'Webhook retry sweep failed');
  });
}, RETRY_SWEEP_INTERVAL_MS);
retrySweeper.unref();

let shuttingDown = false;

const closeServer = async (): Promise<void> => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
    // Idle keep-alive sockets would hold the server open until they time out.
    server.closeIdleConnections();
  });
};

const shutdown = async (reason: string, exitCode = 0): Promise<void> => {
  if (shuttingDown) return;
  shuttingDown = true;

  logger.info({ reason }, 'Shutting down');

  clearInterval(retrySweeper);

  const forceExit = setTimeout(() => {
    logger.error({ reason }, 'Graceful shutdown timed out, exiting');
    process.exit(1);
  }, SHUTDOWN_TIMEOUT_MS);
  forceExit.unref();

  try {
    await closeServer();
    await disconnectDatabase();
    clearTimeout(forceExit);
    logger.info('Shutdown complete');
    process.exit(exitCode);
  } catch (error) {
    logger.error({ err: error, reason }, 'Shutdown failed');
    process.exit(1);
  }
};

for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    void shutdown(signal);
  });
}

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  void shutdown('unhandledRejection', 1);
});

process.on('uncaughtException', (error) => {
  logger.fatal({ err: error }, 'Uncaught exception');
  void shutdown('uncaughtException', 1);
});
