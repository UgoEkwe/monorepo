// Conditional Prisma client with fallback for when database is disabled
let PrismaClient: any;
let prismaAvailable = false;

try {
  const prismaModule = require('@prisma/client');
  PrismaClient = prismaModule.PrismaClient;
  prismaAvailable = true;
} catch (error) {
  console.warn('Prisma client not available, using fallback');
  // Fallback client that provides no-op implementations
  PrismaClient = class FallbackPrismaClient {
    constructor() {
      console.warn('Database disabled - using fallback client');
    }
    
    async $connect() { return Promise.resolve(); }
    async $disconnect() { return Promise.resolve(); }
    
    // Create proxy for any table access
    [key: string]: any;
  };
  
  // Add proxy to handle dynamic property access
  PrismaClient = new Proxy(PrismaClient, {
    construct(target, args) {
      const instance = new target(...args);
      return new Proxy(instance, {
        get(target, prop) {
          if (typeof prop === 'string' && !prop.startsWith('$')) {
            // Return a mock table client
            return {
              findMany: () => Promise.resolve([]),
              findUnique: () => Promise.resolve(null),
              findFirst: () => Promise.resolve(null),
              create: () => Promise.reject(new Error('Database not available')),
              update: () => Promise.reject(new Error('Database not available')),
              delete: () => Promise.reject(new Error('Database not available')),
              count: () => Promise.resolve(0),
            };
          }
          return target[prop];
        }
      });
    }
  });
}

// Global variable to store the Prisma client instance
declare global {
  var __prisma: any | undefined
}

// Create a singleton Prisma client instance
// In development, we use a global variable to prevent multiple instances
// In production, we create a new instance each time
export const prisma = globalThis.__prisma || (prismaAvailable ? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
}) : new PrismaClient());

// Store the instance globally in development to prevent hot reload issues
if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma
}

// Graceful shutdown handler
if (prismaAvailable) {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}

export default prisma
export { prismaAvailable }