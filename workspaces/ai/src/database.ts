// Database client wrapper for AI workspace
import { PrismaClient } from '@prisma/client';

// Create a singleton Prisma client instance for the AI workspace
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// Export types for convenience
export type {
  User,
  Project,
  Entity,
  Prisma
} from '@prisma/client';