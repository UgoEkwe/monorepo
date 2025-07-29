"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseUtils = void 0;
const client_1 = require("./client");
// Database connection utilities
class DatabaseUtils {
    /**
     * Test database connection
     */
    static async testConnection() {
        try {
            await client_1.prisma.$queryRaw `SELECT 1`;
            return true;
        }
        catch (error) {
            console.error('Database connection failed:', error);
            return false;
        }
    }
    /**
     * Get database health status
     */
    static async getHealthStatus() {
        try {
            const start = Date.now();
            await client_1.prisma.$queryRaw `SELECT 1`;
            const responseTime = Date.now() - start;
            const userCount = await client_1.prisma.user.count();
            const projectCount = await client_1.prisma.project.count();
            const entityCount = await client_1.prisma.entity.count();
            return {
                status: 'healthy',
                responseTime,
                counts: {
                    users: userCount,
                    projects: projectCount,
                    entities: entityCount
                }
            };
        }
        catch (error) {
            return {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    /**
     * Create a slug from a string
     */
    static createSlug(text) {
        return text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    /**
     * Ensure unique slug for a project
     */
    static async ensureUniqueProjectSlug(name, excludeId) {
        let baseSlug = this.createSlug(name);
        let slug = baseSlug;
        let counter = 1;
        while (true) {
            const existing = await client_1.prisma.project.findUnique({
                where: { slug },
                select: { id: true }
            });
            if (!existing || (excludeId && existing.id === excludeId)) {
                return slug;
            }
            slug = `${baseSlug}-${counter}`;
            counter++;
        }
    }
}
exports.DatabaseUtils = DatabaseUtils;
//# sourceMappingURL=utils.js.map