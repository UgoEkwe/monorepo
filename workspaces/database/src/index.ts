// Export the Prisma client
export { prisma, default } from './client'

// Export utilities and types
export * from './utils'

// Re-export Prisma types for convenience
export type {
  User,
  Project,
  Entity,
  Prisma
} from '@prisma/client'