// Database client wrapper for AI workspace
import { PrismaClient } from '@prisma/client';

// Create a singleton Prisma client instance for the AI workspace
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// Note: Do not re-export model types here to keep this workspace buildable
// without requiring Prisma schema generation. Use local interfaces instead.