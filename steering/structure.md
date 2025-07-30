# Project Structure & Organization

## Monorepo Architecture

The project follows a **hub-and-spoke architecture** where the database workspace serves as the central data layer, with all other workspaces being independently removable while maintaining system functionality.

## Root Structure

```
modular-ai-scaffold/
├── workspaces/           # All application workspaces
├── scripts/             # Utility and testing scripts
├── docs/               # Documentation
├── .kiro/              # Kiro configuration and specs
├── package.json        # Root package with workspace definitions
├── turbo.json         # Turborepo configuration
└── .env.example       # Environment variable template
```

## Workspace Organization

### Core Workspaces (7 total)

1. **`workspaces/web/`** - Next.js web application
   - App Router structure (`src/app/`)
   - Components in `src/components/` (ui/ and custom)
   - Supabase integration in `src/lib/`
   - Tailwind + shadcn/ui styling

2. **`workspaces/mobile/`** - Expo React Native app
   - Expo Router structure (`app/`)
   - Components in `src/components/`
   - Shared UI components with web where possible

3. **`workspaces/backend/`** - FastAPI Python server
   - `main.py` - FastAPI application entry point
   - `models/` - Pydantic schemas
   - `services/` - Business logic layer
   - `middleware/` - Authentication and CORS
   - `utils/` - Utility functions

4. **`workspaces/database/`** - Prisma database layer
   - `prisma/schema.prisma` - Database schema
   - `prisma/migrations/` - Database migrations
   - `src/` - Database client and utilities
   - Shared across all workspaces

5. **`workspaces/ai/`** - Modular AI agents
   - `src/agent-tools/` - Extensible tool system
   - `src/modular-agent.ts` - Core agent class
   - OpenRouter integration with tool calling

6. **`workspaces/payments/`** - Stripe integration
   - `src/stripe-client.ts` - Stripe API wrapper
   - `src/webhook-handler.ts` - Webhook processing
   - `src/__tests__/` - Payment testing suite

7. **`workspaces/cli/`** - Command line interface
   - Interactive project management tools
   - Deployment utilities

## Key Architectural Patterns

### Abstract Data Model
- **User**: Generic user/account representation
- **Project**: Container/workspace concept
- **Entity**: Flexible content model (posts, products, etc.)
- All models use `metadata: Json` for extensibility

### Workspace Independence
- Each workspace has its own `package.json`
- Workspaces can be removed without breaking others
- Graceful fallbacks when dependencies are missing
- Turbo.json handles missing workspace filtering

### Shared Dependencies
- Database client shared via `@modular-ai-scaffold/database`
- TypeScript configurations extend from root
- Environment variables managed globally

## File Naming Conventions

### TypeScript/JavaScript
- Components: PascalCase (`AuthButton.tsx`)
- Utilities: camelCase (`supabase-client.ts`)
- Pages/Routes: kebab-case (`auth-code-error/`)
- Types: PascalCase interfaces (`AgentTool`)

### Python
- Files: snake_case (`secrets_manager.py`)
- Classes: PascalCase (`EntityService`)
- Functions: snake_case (`get_user_entities`)

### Configuration
- Config files: kebab-case (`next.config.js`)
- Environment: UPPER_SNAKE_CASE (`.env.example`)

## Import Patterns

### Internal Imports
```typescript
// Relative imports within workspace
import { Button } from '../ui/button'

// Workspace-to-workspace
import { prisma } from '@modular-ai-scaffold/database'
```

### External Dependencies
- UI: shadcn/ui components, Tailwind classes
- Icons: lucide-react
- State: Zustand stores
- Animation: Framer Motion

## Testing Structure
- Unit tests: `__tests__/` or `.test.ts` files
- Integration tests: `scripts/test-*.js`
- Each workspace maintains its own test configuration
- Shared test utilities in root `scripts/`