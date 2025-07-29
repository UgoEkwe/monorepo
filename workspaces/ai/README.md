# AI Workspace

Modular AI agents with OpenRouter integration and extensible tool system.

## Features
- **ModularAgent class** with OpenRouter integration and hook system
- **Extensible tool system** with automatic tool discovery and loading
- **Built-in tools**: `fs_read`, `fs_write`, `db_query`
- **Pre/post-chat hooks** for extensibility
- **Demo content generation** that saves to Entity model
- **Agentic loop** with tool calling capabilities

## Architecture

### Core Components
- `ModularAgent`: Main agent class with OpenRouter integration
- `agent-tools/`: Directory containing extensible tools
- `DemoContentGenerator`: Showcase implementation for content generation
- `database.ts`: Database client wrapper for AI workspace

### Built-in Tools
- **fs_read**: Read files from the file system
- **fs_write**: Write files to the file system  
- **db_query**: Query the database (users, projects, entities)

## Setup
```bash
npm install
npm run build
```

## Usage

### Basic Agent Usage
```typescript
import { ModularAgent } from '@modular-scaffold/ai';

const agent = new ModularAgent({
  model: 'openai/gpt-4o-mini',
  temperature: 0.7,
  hooks: {
    preChat: async (prompt) => {
      console.log('Processing:', prompt);
      return prompt;
    },
    postChat: async (response) => {
      console.log('Generated:', response);
    }
  }
});

await agent.initialize();
const result = await agent.runLoop('Generate a blog post about AI', projectId);
```

### Demo Content Generation
```typescript
import { DemoContentGenerator } from '@modular-scaffold/ai';

const generator = new DemoContentGenerator();
await generator.initialize();
await generator.generateDemoData(projectId);
```

### Verification
```bash
npm run build
node dist/verify.js
```

## Environment Variables
- `OPENROUTER_API_KEY`: Your OpenRouter API key
- `DATABASE_URL`: PostgreSQL database connection string

See `.env.example` in the root directory for complete configuration.

## Extension

### Adding Custom Tools
Create a new file in `src/agent-tools/` following this pattern:

```typescript
import { AgentTool } from '../types';

export const myCustomTool: AgentTool = {
  name: 'my_custom_tool',
  description: 'Description of what this tool does',
  parameters: {
    type: 'object',
    properties: {
      input: { type: 'string', description: 'Input parameter' }
    },
    required: ['input']
  },
  execute: async (args) => {
    // Tool implementation
    return { success: true, result: 'Tool result' };
  }
};
```

### Custom Hooks
```typescript
const agent = new ModularAgent({
  hooks: {
    preToolCall: async (tool, args) => {
      console.log(`Executing ${tool} with:`, args);
      return args;
    },
    postToolCall: async (tool, result) => {
      console.log(`${tool} completed:`, result);
    }
  }
});
```