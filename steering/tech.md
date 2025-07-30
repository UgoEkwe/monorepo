# Technology Stack & Build System

## Build System
- **Turborepo**: Monorepo build system with caching and parallel execution
- **Node.js**: >=18.0.0 required
- **npm**: >=8.0.0 for workspace management

## Core Technologies

### Frontend
- **Next.js 14**: Web application with App Router
- **Expo/React Native**: Mobile application
- **React 18**: UI library with hooks and modern patterns
- **TypeScript 5**: Type safety across all workspaces
- **Tailwind CSS**: Utility-first styling with shadcn/ui components

### Backend
- **FastAPI**: Python web framework for REST APIs
- **Prisma**: Database ORM with PostgreSQL
- **Modal**: Serverless deployment platform
- **Supabase**: Authentication and database hosting

### AI & Payments
- **OpenRouter**: LLM API integration
- **Stripe**: Payment processing with webhooks
- **OpenAI SDK**: For AI agent tool calling

## Common Commands

### Setup & Development
```bash
# Initial setup
npm install
npm run setup  # Installs deps + db setup

# Development
npm run dev    # Start all workspaces
npm run build  # Build all workspaces
npm run test   # Run all tests
```

### Database Operations
```bash
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Run migrations
npm run db:seed      # Seed with demo data
npm run db:studio    # Open Prisma Studio
```

### Testing & Validation
```bash
npm run workspace:check     # Check workspace status
npm run test:auth          # Test authentication
npm run test:integration   # Integration tests
npm run workspace:test     # Workspace resilience tests
```

### Deployment
```bash
npm run deploy  # Deploy all workspaces
```

## Package Management
- Use `npm` for all package operations
- Workspaces are managed via npm workspaces
- Dependencies should be installed at workspace level when possible
- Shared dependencies go in root package.json