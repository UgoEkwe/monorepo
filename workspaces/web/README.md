# Web Workspace

Next.js web application with Supabase authentication and entity management dashboard.

## Features
- **Next.js 14** with App Router
- **Supabase Authentication** with GitHub OAuth
- **Entity Dashboard** for displaying AI-generated content
- **Responsive Design** with Tailwind CSS
- **TypeScript** for type safety
- **Modular Components** for extensibility

## Components

### AuthButton
- Handles GitHub OAuth authentication flow
- Shows user info and sign out when authenticated
- Responsive design with loading states

### EntityList
- Displays entities from the database with real-time updates
- Shows entity metadata, status, and creation dates
- Refresh functionality and error handling
- Empty state for when no content exists

### Dashboard Page
- Main application interface
- Feature showcase with gradient design
- Authentication-gated content
- Professional layout with hero section

## Setup
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Environment Variables
Create a `.env.local` file with:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

See `.env.example` in the root directory for all available variables.

## Design System

This workspace follows the **[Design System Documentation](../../docs/design-system.md)** for consistent styling, theming, and component guidelines.

**Key Design Principles:**
- Uses design tokens for colors, typography, and spacing
- Leverages shadcn/ui components with Tailwind CSS
- Follows accessibility guidelines and responsive patterns
- Maintains consistent component architecture

**Important:** When building or modifying UI components, always reference the design system document. If you need to implement specific design patterns or components not covered in the current system, update the design document accordingly to maintain consistency across the platform.

## Architecture
- Uses Supabase SSR for server-side authentication
- Middleware handles auth state across routes
- Client-side components for interactive features
- Shared database package for type safety
- Design system integration for consistent UI/UX