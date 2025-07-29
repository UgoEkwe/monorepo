"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Create a singleton Prisma client instance
// In development, we use a global variable to prevent multiple instances
// In production, we create a new instance each time
exports.prisma = globalThis.__prisma || new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
});
// Store the instance globally in development to prevent hot reload issues
if (process.env.NODE_ENV === 'development') {
    globalThis.__prisma = exports.prisma;
}
// Graceful shutdown handler
process.on('beforeExit', async () => {
    await exports.prisma.$disconnect();
});
exports.default = exports.prisma;
//# sourceMappingURL=client.js.map