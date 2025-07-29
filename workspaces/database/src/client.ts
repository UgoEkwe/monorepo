import { PrismaClient } from '@prisma/client'

// Global variable to store the Prisma client instance
declare global {
  var __prisma: PrismaClient | undefined
}

// Create a singleton Prisma client instance
// In development, we use a global variable to prevent multiple instances
// In production, we create a new instance each time
export const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
})

// Store the instance globally in development to prevent hot reload issues
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

// Graceful shutdown handler
process.on('beforeExit', async () => {
  await prisma.$disconnect()
})

export default prisma