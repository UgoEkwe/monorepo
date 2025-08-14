# {{WORKSPACE_NAME}}

{{DESCRIPTION}}

## Getting Started

This is a hybrid Python/Node.js service workspace in the modular AI scaffold.

### Development

```bash
# Start development server
npm run dev:{{WORKSPACE_NAME}}

# Build the service
npm run build:{{WORKSPACE_NAME}}

# Run tests
npm run test:{{WORKSPACE_NAME}}
```

### Features

- 🐍 Python backend with FastAPI
- 🔧 TypeScript utilities support
- 🧪 Testing with pytest and Vitest
- 📦 Shared utilities from @modular-ai-scaffold/core
- 🔄 Hybrid dependency management

### Setup

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install --workspace={{WORKSPACE_NAME}}
   ```

### Project Structure

```
├── main.py           # Main Python application
├── requirements.txt  # Python dependencies
├── src/             # TypeScript utilities
│   ├── utils/       # Utility functions
│   └── types/       # Type definitions
├── tests/           # Test files
│   ├── test_*.py    # Python tests
│   └── *.test.ts    # TypeScript tests
└── package.json     # Node.js configuration
```

### Environment Variables

Create a `.env` file with your configuration:

```bash
# Service configuration
PORT=8000
HOST=0.0.0.0

# Optional: Database configuration
DATABASE_URL=your_database_url

# Optional: External API keys
API_KEY=your_api_key
```

### API Documentation

When running in development mode, API documentation is available at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc