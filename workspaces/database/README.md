# Database Workspace

Prisma database layer with abstract schema and migration management.

## Features
- **Prisma ORM**: Type-safe database client with auto-generated types
- **Abstract Schema**: Flexible User, Project, and Entity models that can represent any use case
- **Migration System**: Version-controlled database schema changes
- **Seed Scripts**: Demo data for AI Content Generator showcase
- **Database Utilities**: Helper functions for common operations
- **TypeScript Support**: Full type safety with generated Prisma types

## Abstract Schema Design

The database uses three core models that can be extended for any use case:

- **User**: Represents any type of user/account with extensible metadata
- **Project**: Container/workspace model that can represent any project type
- **Entity**: Generic content model that can represent blog posts, products, tasks, etc.

## Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npm run db:generate

# Run migrations (requires DATABASE_URL)
npm run db:migrate

# Seed with demo data
npm run db:seed

# Open Prisma Studio
npm run db:studio
```

## Development

```bash
# Build TypeScript
npm run build

# Watch mode
npm run dev

# Run tests
npm test

# Clean build artifacts
npm run clean
```

## Environment Variables

Set `DATABASE_URL` in your `.env` file:
```
DATABASE_URL="postgresql://username:password@localhost:5432/modular_ai_scaffold"
```

See `.env.example` in the root directory for all required variables.

## Usage

```typescript
import { prisma, DatabaseUtils, User, Project, Entity } from '@modular-ai-scaffold/database'

// Test connection
const isHealthy = await DatabaseUtils.testConnection()

// Create a user
const user = await prisma.user.create({
  data: {
    email: 'user@example.com',
    name: 'John Doe',
    metadata: { role: 'admin' }
  }
})

// Create a project
const project = await prisma.project.create({
  data: {
    name: 'My Project',
    ownerId: user.id,
    slug: await DatabaseUtils.ensureUniqueProjectSlug('My Project')
  }
})
```