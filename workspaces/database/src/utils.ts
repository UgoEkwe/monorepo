import { prisma } from './client'
import type { User, Project, Entity } from '@prisma/client'

// Database connection utilities
export class DatabaseUtils {
  /**
   * Test database connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`
      return true
    } catch (error) {
      console.error('Database connection failed:', error)
      return false
    }
  }

  /**
   * Get database health status
   */
  static async getHealthStatus() {
    try {
      const start = Date.now()
      await prisma.$queryRaw`SELECT 1`
      const responseTime = Date.now() - start

      const userCount = await prisma.user.count()
      const projectCount = await prisma.project.count()
      const entityCount = await prisma.entity.count()

      return {
        status: 'healthy',
        responseTime,
        counts: {
          users: userCount,
          projects: projectCount,
          entities: entityCount
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Create a slug from a string
   */
  static createSlug(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  /**
   * Ensure unique slug for a project
   */
  static async ensureUniqueProjectSlug(name: string, excludeId?: string): Promise<string> {
    let baseSlug = this.createSlug(name)
    let slug = baseSlug
    let counter = 1

    while (true) {
      const existing = await prisma.project.findUnique({
        where: { slug },
        select: { id: true }
      })

      if (!existing || (excludeId && existing.id === excludeId)) {
        return slug
      }

      slug = `${baseSlug}-${counter}`
      counter++
    }
  }
}

// Type exports for better TypeScript support
export type { User, Project, Entity }
export type UserWithProjects = User & { projects: Project[] }
export type ProjectWithEntities = Project & { entities: Entity[] }
export type ProjectWithOwner = Project & { owner: User }
export type EntityWithProject = Entity & { project: Project }