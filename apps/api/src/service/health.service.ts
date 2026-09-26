import { prismaClient } from '../config/db.js';
import { env } from '../config/env.js';
import ApiError from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

export const checkHealth = async () => {
  try {
    await prismaClient.$queryRaw`SELECT 1`;
  } catch (error) {
    logger.error({ err: error }, 'Database health check failed');
    throw new ApiError(503, 'Database unavailable');
  }

  return {
    database: 'up',
    uptimeSeconds: Math.round(process.uptime()),
    demoTools: env.ENABLE_DEMO_TOOLS,
  };
};
