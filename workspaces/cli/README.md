# CLI Workspace

Interactive CLI for project management, initialization, and deployment.

## Features

- Project initialization
- Template cloning
- Deployment automation
- GitHub export
- **Secrets Management** - Validate and manage environment configuration

## Setup

```bash
npm install
npm link
```

## Usage

```bash
modular-ai new my-project
modular-ai deploy
modular-ai export
modular-ai secrets --validate
modular-ai secrets --setup
modular-ai secrets --export .env.backup
```

## Secrets Management

The CLI includes comprehensive secrets management capabilities:

### Validation
```bash
modular-ai secrets --validate
```
Validates that all required environment variables are present and properly configured.

### Interactive Setup
```bash
modular-ai secrets --setup
```
Guides you through setting up all required secrets interactively.

### Export Configuration
```bash
modular-ai secrets --export .env.backup
```
Exports current configuration with placeholders for sharing.

## Environment Variables

See `.env.example` in the root directory for all required environment variables.

## Development

```bash
npm run dev      # Watch mode
npm run build    # Build distribution
npm run lint     # Lint code
npm run test     # Run tests
