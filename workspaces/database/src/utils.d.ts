import type { User, Project, Entity } from '@prisma/client';
export declare class DatabaseUtils {
    /**
     * Test database connection
     */
    static testConnection(): Promise<boolean>;
    /**
     * Get database health status
     */
    static getHealthStatus(): Promise<{
        status: string;
        responseTime: number;
        counts: {
            users: number;
            projects: number;
            entities: number;
        };
        error?: undefined;
    } | {
        status: string;
        error: string;
        responseTime?: undefined;
        counts?: undefined;
    }>;
    /**
     * Create a slug from a string
     */
    static createSlug(text: string): string;
    /**
     * Ensure unique slug for a project
     */
    static ensureUniqueProjectSlug(name: string, excludeId?: string): Promise<string>;
}
export type { User, Project, Entity };
export type UserWithProjects = User & {
    projects: Project[];
};
export type ProjectWithEntities = Project & {
    entities: Entity[];
};
export type ProjectWithOwner = Project & {
    owner: User;
};
export type EntityWithProject = Entity & {
    project: Project;
};
//# sourceMappingURL=utils.d.ts.map