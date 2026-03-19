import { PrismaClient } from '@prisma/client';

let instance: PrismaClient | undefined;

/**
 * Returns a singleton PrismaClient.
 * Prevents multiple connections in development hot-reloads.
 */
export function getPrismaClient(): PrismaClient {
  if (!instance) {
    instance = new PrismaClient({
      log:
        process.env['NODE_ENV'] === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }
  return instance;
}

export async function disconnectPrisma(): Promise<void> {
  if (instance) {
    await instance.$disconnect();
    instance = undefined;
  }
}
