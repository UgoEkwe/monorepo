# Core Workspace

The core workspace contains shared utilities, types, and configurations used across all workspaces in the modular AI scaffold monorepo.

## Purpose

This workspace serves as the foundation for the modular monorepo architecture by providing:

- **Shared Types**: Common interfaces and type definitions used across workspaces
- **Utility Functions**: Reusable functions for string manipulation, validation, and styling
- **Configuration Management**: Workspace configuration and environment-based feature flags
- **Build Templates**: Configuration templates for different workspace types

## Structure

```
src/
├── types/           # Shared TypeScript interfaces and types
├── utils/           # Utility functions
│   ├── string-utils.ts      # String manipulation functions
│   ├── validation-utils.ts  # Validation helpers
│   └── style-utils.ts       # Styling utilities (Tailwind CSS)
├── configs/         # Configuration management
│   ├── workspace-config.ts  # Workspace configuration and feature flags
│   └── build-config.ts      # Build configuration templates
└── index.ts         # Main export file
```

## Usage

Import shared utilities in other workspaces:

```typescript
// Import types
import type { User, Project, WorkspaceConfig } from '@modular-ai-scaffold/core';

// Import utilities
import { createSlug, isValidEmail, cn } from '@modular-ai-scaffold/core';

// Import configurations
import { getSharedConfig, isWorkspaceEnabled } from '@modular-ai-scaffold/core';
```

## Features

### Environment-Based Configuration

The core workspace provides environment-based feature flags:

```bash
# Enable/disable workspaces
ENABLE_WEB=true
ENABLE_MOBILE=true
ENABLE_BACKEND=true
ENABLE_AI=true
ENABLE_PAYMENTS=true
ENABLE_CLI=true

# Enable/disable features
ENABLE_DATABASE=true
ENABLE_SUPABASE=true
```

### Shared Types

- **Database Types**: User, Project, Entity interfaces
- **Agent Types**: AI agent configuration and tool interfaces
- **Payment Types**: Payment processing interfaces
- **Workspace Types**: Workspace metadata and configuration types

### Utility Functions

- **String Utils**: Slug creation, case conversion, text truncation
- **Validation Utils**: Email, URL, workspace name validation
- **Style Utils**: Tailwind CSS class merging with `cn()` function

## Development

```bash
# Build the core workspace
npm run build:core

# Watch for changes during development
npm run dev:core

# Type check
npm run type-check
```

## Dependencies

- **clsx**: Class name utility
- **tailwind-merge**: Tailwind CSS class merging
- **@types/node**: Node.js type definitions
- **typescript**: TypeScript compiler