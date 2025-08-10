// Export the Prisma client
export { prisma, default } from './client'

// Export utilities and types
export * from './utils'

// Note: Do not re-export Prisma model types to keep this package buildable
// without requiring local Prisma schema generation.