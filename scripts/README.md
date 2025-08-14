# Workspace Injection System

A secure, template-based system for dynamically adding new workspaces to the modular monorepo architecture.

## Overview

The workspace injection system allows developers to quickly scaffold new workspaces with predefined templates, automatic configuration updates, and built-in security validation. It implements requirements 4.2, 4.3, and 4.4 from the modular monorepo architecture specification.

## Features

- 🔒 **Security Validation**: Prevents path traversal, reserved names, and invalid formats
- 📋 **Template System**: Pre-built templates for web, mobile, service, and library workspaces
- ⚡ **Automatic Configuration**: Updates root package.json and turbo.json automatically
- 🔄 **Rollback Mechanism**: Automatic rollback on failure with backup/restore
- 🧪 **Comprehensive Testing**: Built-in validation and testing framework
- 📦 **Dependency Management**: Automatic dependency installation with workspace scoping

## Usage

### Basic Usage

```bash
# Create a new library workspace
npm run inject-workspace my-utils library

# Create a web application
npm run inject-workspace admin-dashboard web

# Create a mobile app
npm run inject-workspace mobile-client mobile

# Create a backend service
npm run inject-workspace api-gateway service
```

### Advanced Options

```bash
# Skip automatic dependency installation
npm run inject-workspace my-lib library --skip-install

# Custom description and metadata
npm run inject-workspace my-dashboard web \
  --description "Admin dashboard for user management" \
  --author "Your Name" \
  --version "1.0.0"
```

### Help

```bash
npm run inject-workspace --help
```

## Workspace Types

### Library (`library`)
- **Purpose**: Shared utilities, types, and reusable code
- **Framework**: TypeScript with full type definitions
- **Features**: Multiple export paths, comprehensive testing, watch mode
- **Use Cases**: Utility functions, shared components, type definitions

### Web Application (`web`)
- **Purpose**: Next.js web applications
- **Framework**: Next.js 14 with App Router, Tailwind CSS, Radix UI
- **Features**: SSR/SSG, TypeScript, responsive design, optional Supabase integration
- **Use Cases**: Admin dashboards, marketing sites, web applications

### Mobile Application (`mobile`)
- **Purpose**: React Native/Expo mobile applications
- **Framework**: Expo with Expo Router, React Native
- **Features**: Cross-platform, navigation, optional Supabase integration
- **Use Cases**: Mobile apps, cross-platform applications

### Backend Service (`service`)
- **Purpose**: Hybrid Python/Node.js backend services
- **Framework**: FastAPI (Python) with TypeScript utilities
- **Features**: REST API, hybrid dependency management, comprehensive testing
- **Use Cases**: Microservices, API gateways, data processing services

## Security Features

### Name Validation
- Must start with a letter
- Only lowercase letters, numbers, and hyphens allowed
- Length between 2-50 characters
- No path traversal characters (`..`, `/`, `\\`)

### Reserved Names
The following names are reserved and cannot be used:
- `core`, `scripts`, `node_modules`, `dist`, `build`
- `.git`, `.turbo`, `.next`, `coverage`, `public`

### Conflict Detection
- Checks for existing workspace directories
- Validates against current package.json workspaces
- Prevents duplicate workspace names

### Rollback Mechanism
- Creates backup of configuration files before changes
- Automatic rollback on any failure
- Preserves original state if injection fails

## Template Structure

### Template Variables
All templates support the following variable substitutions:

- `{{WORKSPACE_NAME}}`: The workspace name
- `{{WORKSPACE_TYPE}}`: The workspace type (web, mobile, service, library)
- `{{PACKAGE_NAME}}`: Full package name (@modular-ai-scaffold/workspace-name)
- `{{DESCRIPTION}}`: Workspace description
- `{{AUTHOR}}`: Author name
- `{{VERSION}}`: Initial version

### Template Locations
Templates are stored in `scripts/templates/`:

```
scripts/templates/
├── web/           # Next.js web application template
├── mobile/        # React Native/Expo mobile template
├── service/       # Python/Node.js service template
└── library/       # TypeScript library template
```

### Adding Custom Templates

1. Create a new directory in `scripts/templates/`
2. Add template files with variable placeholders
3. Update the `validTypes` array in `inject-workspace.js`
4. Add turbo pipeline configuration in `getTurboPipelineConfig()`

## Configuration Updates

### Root package.json
- Adds workspace to `workspaces` array
- Creates scoped scripts (`dev:workspace`, `build:workspace`, `test:workspace`)
- Maintains alphabetical sorting

### turbo.json
- Adds workspace-specific pipeline tasks
- Configures appropriate caching and dependencies
- Sets environment variables and outputs based on workspace type

## Testing

### Automated Testing
Run the comprehensive test suite:

```bash
node scripts/test-injection.js
```

The test suite validates:
- All workspace types can be created successfully
- Template variable substitution works correctly
- Security validation prevents invalid inputs
- Rollback mechanism works on failures
- Configuration files are updated correctly

### Manual Testing
Test individual workspace creation:

```bash
# Test library creation
npm run inject-workspace test-lib library --skip-install

# Verify workspace was created
ls workspaces/test-lib

# Clean up
rm -rf workspaces/test-lib
```

## Troubleshooting

### Common Issues

**"Workspace already exists"**
- Check if a directory with that name exists in `workspaces/`
- Verify the name isn't already in package.json workspaces array

**"Invalid workspace name format"**
- Ensure name starts with a letter
- Use only lowercase letters, numbers, and hyphens
- Keep length between 2-50 characters

**"Template not found"**
- Verify the workspace type is valid (web, mobile, service, library)
- Check that the template directory exists in `scripts/templates/`

**"Failed to install dependencies"**
- Use `--skip-install` flag and install manually
- Check network connectivity and npm registry access

### Recovery

If injection fails and rollback doesn't work:

1. Restore configuration files from git:
   ```bash
   git checkout HEAD -- package.json turbo.json
   ```

2. Remove any partially created workspace:
   ```bash
   rm -rf workspaces/failed-workspace-name
   ```

3. Clean up any backup files:
   ```bash
   rm -rf .workspace-injection-backup
   ```

## Architecture

### Class Structure

```typescript
class SecureWorkspaceInjector {
  // Core injection logic
  async injectWorkspace(name, type, options)
  
  // Validation methods
  async validateWorkspaceName(name)
  async validateWorkspaceType(type)
  async validateExistingWorkspace(name)
  
  // Template processing
  async createWorkspaceFromTemplate(path, name, type, options)
  async copyTemplateFiles(templatePath, workspacePath, ...)
  substituteTemplateVariables(content, name, type, options)
  
  // Configuration updates
  async updateRootPackageJson(name)
  async updateTurboConfig(name, type)
  getTurboPipelineConfig(type)
  
  // Backup and rollback
  async createBackup()
  async rollback()
  async cleanupBackup()
  
  // Dependency management
  async installDependencies(name)
}
```

### Security Model

1. **Input Validation**: All inputs are validated before processing
2. **Path Safety**: Prevents path traversal and directory escape
3. **Backup/Restore**: Configuration changes are backed up before modification
4. **Atomic Operations**: Either all changes succeed or all are rolled back
5. **Error Handling**: Comprehensive error handling with meaningful messages

## Contributing

### Adding New Templates

1. Create template directory in `scripts/templates/`
2. Add all necessary template files with variable placeholders
3. Update `validTypes` array in the injector class
4. Add turbo pipeline configuration for the new type
5. Test the new template thoroughly
6. Update documentation

### Modifying Existing Templates

1. Edit files in the appropriate `scripts/templates/` directory
2. Test changes with the test suite
3. Verify variable substitution works correctly
4. Update documentation if new variables are added

### Security Considerations

- Always validate user inputs
- Use path.join() for file operations
- Avoid eval() or dynamic code execution
- Sanitize template variables
- Test security validation thoroughly

## License

MIT - Part of the modular AI scaffold monorepo system.