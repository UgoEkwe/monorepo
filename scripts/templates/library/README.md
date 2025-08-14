# {{WORKSPACE_NAME}}

{{DESCRIPTION}}

## Installation

This library is part of the modular AI scaffold monorepo. It's automatically available to other workspaces via workspace dependencies.

```bash
# In another workspace's package.json
{
  "dependencies": {
    "{{PACKAGE_NAME}}": "workspace:*"
  }
}
```

## Usage

```typescript
import { exampleFunction } from '{{PACKAGE_NAME}}';
import { ExampleType } from '{{PACKAGE_NAME}}/types';
import { exampleUtil } from '{{PACKAGE_NAME}}/utils';

// Use the library functions
const result = exampleFunction('hello world');
console.log(result);
```

## Development

```bash
# Start development (watch mode)
npm run dev:{{WORKSPACE_NAME}}

# Build the library
npm run build:{{WORKSPACE_NAME}}

# Run tests
npm run test:{{WORKSPACE_NAME}}

# Type check
npm run type-check --workspace={{WORKSPACE_NAME}}
```

## Features

- 🔧 TypeScript support with full type definitions
- 📦 Multiple export paths (main, utils, types)
- 🧪 Vitest for testing
- 🔄 Watch mode for development
- 📚 Comprehensive documentation

## API Reference

### Functions

#### `exampleFunction(input: string): string`

Example function that processes a string input.

**Parameters:**
- `input` (string): The input string to process

**Returns:**
- `string`: The processed result

**Example:**
```typescript
const result = exampleFunction('hello');
// Returns: "Processed: hello"
```

### Types

#### `ExampleType`

Example type definition for the library.

```typescript
interface ExampleType {
  id: string;
  name: string;
  value: number;
  optional?: boolean;
}
```

### Utilities

#### `exampleUtil(data: any): boolean`

Example utility function for data validation.

**Parameters:**
- `data` (any): Data to validate

**Returns:**
- `boolean`: True if valid, false otherwise

## Contributing

1. Make your changes in the `src/` directory
2. Add tests for new functionality
3. Run `npm run test:{{WORKSPACE_NAME}}` to ensure tests pass
4. Run `npm run build:{{WORKSPACE_NAME}}` to ensure it builds correctly
5. Update this README if you add new public APIs

## License

MIT