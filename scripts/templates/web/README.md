# {{WORKSPACE_NAME}}

{{DESCRIPTION}}

## Getting Started

This is a Next.js web application workspace in the modular AI scaffold.

### Development

```bash
# Start development server
npm run dev:{{WORKSPACE_NAME}}

# Build for production
npm run build:{{WORKSPACE_NAME}}

# Run tests
npm run test:{{WORKSPACE_NAME}}
```

### Features

- ⚡ Next.js 14 with App Router
- 🎨 Tailwind CSS for styling
- 🧩 Radix UI components
- 🔧 TypeScript support
- 🧪 Vitest for testing
- 📦 Shared utilities from @modular-ai-scaffold/core

### Optional Dependencies

This workspace supports optional integration with:

- **Supabase**: For authentication and database (via peer dependencies)
- **Database**: Shared database utilities from the database workspace

Enable these features by setting the appropriate environment variables:

```bash
ENABLE_SUPABASE=true
ENABLE_DATABASE=true
```

### Project Structure

```
src/
├── app/           # Next.js app directory
├── components/    # React components
├── lib/          # Utility functions
└── types/        # TypeScript type definitions
```

### Environment Variables

Create a `.env.local` file with your configuration:

```bash
# Optional: Supabase configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Database configuration
DATABASE_URL=your_database_url
```