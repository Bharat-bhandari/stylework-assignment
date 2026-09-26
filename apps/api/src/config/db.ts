import { PrismaClient } from '@prisma/client';
import { env } from './env.js';

const globalForPrisma = globalThis as unknown as { prismaClient?: PrismaClient };

// Reused across tsx and Vitest reloads, which would otherwise open a pool each time.
export const prismaClient =
  globalForPrisma.prismaClient ??
  new PrismaClient({ log: env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'] });

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prismaClient = prismaClient;
}

export const disconnectDatabase = async (): Promise<void> => {
  await prismaClient.$disconnect();
  delete globalForPrisma.prismaClient;
};
