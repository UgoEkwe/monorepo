# Modular AI Scaffold

A comprehensive, generic monorepo starter template designed to serve as a foundation for any type of application. Built with modularity in mind, featuring AI agents, multiple frontend options, and extensible architecture.

## 🚀 Features

- **Modular Architecture**: 6 core workspaces (+ CLI) that can be removed without breaking the system
- **AI-Powered**: Extensible AI agents with OpenRouter integration and custom tool system
- **Multiple Frontends**: Next.js web app and Expo React Native mobile app
- **Robust Backend**: FastAPI server with Prisma database integration
- **Payment Ready**: Stripe integration with webhook handling
- **Developer Friendly**: Interactive CLI for project management and deployment

## 📁 Workspace Structure

```
├── workspaces/
│   ├── web/          # Next.js web application
│   ├── mobile/       # Expo React Native mobile app
│   ├── backend/      # FastAPI server
│   ├── database/     # Prisma database layer
│   ├── ai/           # Modular AI agents
│   ├── payments/     # Stripe integration
│   └── cli/          # Interactive CLI tools
├── scripts/          # Utility scripts
└── scripts/          # (Optional) your own project scripts
```

## 🛠 Quick Start

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd modular-ai-scaffold
   npm install
   ```

2. **Configure environment (optional for initial build)**:
   - Copy sample env files and fill in values when ready to integrate services.
   - Web: `cp workspaces/web/.env.local.example workspaces/web/.env.local`
   - Mobile: `cp workspaces/mobile/.env.example workspaces/mobile/.env`
   - Payments: `cp workspaces/payments/.env.example workspaces/payments/.env`
   - Database: `cp workspaces/database/.env.example workspaces/database/.env`
   - Backend: `cp workspaces/backend/.env.example workspaces/backend/.env`

3. **Initialize database**:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

4. **Start development**:
   ```bash
   npm run dev
   ```

## 🔧 Available Scripts

- `npm run dev` - Start all workspaces in development mode
- `npm run build` - Build all workspaces
- `npm run test` - Run tests across all workspaces
- `npm run deploy` - Deploy all workspaces
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with demo data
- `npm run workspace:check` - Check workspace status

## 🏗 Architecture

The scaffold uses a hub-and-spoke architecture. All workspaces are designed to be independently removable while maintaining system functionality. Database tasks are fully decoupled from default dev/build so fresh clones build without a database.

### Core Concepts

- **Entity Model**: Abstract data container that can represent any type (posts, products, content, etc.)
- **Modular Agents**: AI agents with extensible tool system and hook architecture
- **Workspace Independence**: Remove any workspace without breaking others
- **Graceful Fallbacks**: Turbo configuration adapts to missing workspaces

## 🤖 AI Agent System

The AI workspace provides a modular agent architecture with:

- OpenRouter LLM integration
- Extensible tool system (fs_read, fs_write, db_query)
- Pre/post-chat hooks for custom logic
- Automatic tool discovery and loading

## 🗄 Database Schema

Abstract schema designed for maximum flexibility:

```prisma
model Entity {
  id          String   @id @default(uuid())
  name        String   // Generic title/name
  description String?  // Generic content/body
  metadata    Json?    // Extensible data
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
}
```

## 🚀 Deployment

Each workspace supports different deployment targets:

- **Web**: Vercel, Netlify
- **Mobile**: Expo EAS Build
- **Backend**: Modal, Railway, Fly.io
- **Database**: Supabase, PlanetScale

## 📚 Documentation

This scaffold is intentionally minimal and safe by default. Add your own docs as your project evolves.

## 🤝 Contributing

This is a template repository. Fork it and customize for your specific needs!

## 📄 License

MIT License - see LICENSE file for details.