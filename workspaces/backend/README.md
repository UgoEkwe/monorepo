# Backend Workspace

FastAPI backend with entity management and AI integration.

## Features
- FastAPI server with health check and CRUD endpoints
- Prisma database integration with User, Project, and Entity models
- AI service with content generation and agent integration
- Authentication middleware with Supabase JWT support
- Modal deployment configuration for serverless deployment
- Error handling and CORS support

## Setup

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Generate Prisma Client
```bash
prisma generate
```

### 3. Set Environment Variables
Create a `.env` file with:
```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
OPENROUTER_API_KEY="your-openrouter-key"
SUPABASE_URL="your-supabase-url"
SUPABASE_ANON_KEY="your-supabase-key"
```

### 4. Run the Server
```bash
python main.py
```

The server will start on `http://localhost:8000` with automatic API documentation at `/docs`.

## API Endpoints

### Health Check
- `GET /health` - Server health status

### Entities
- `GET /entities` - List entities (with optional project filtering)
- `POST /entities` - Create new entity
- `GET /entities/{id}` - Get specific entity
- `PUT /entities/{id}` - Update entity
- `DELETE /entities/{id}` - Delete entity

### AI Generation
- `POST /generate` - Generate content using AI
- `POST /generate/batch` - Generate multiple pieces of content

### Projects
- `GET /projects` - List user projects
- `POST /projects` - Create new project

## Deployment

### Modal Deployment
```bash
modal deploy modal_app.py
```

### Development Mode
```bash
modal serve modal_app.py
```

## Architecture

The backend follows a service-oriented architecture:

- **FastAPI App** (`main.py`) - API routes and middleware
- **Services** - Business logic (EntityService, AIService)
- **Models** - Pydantic schemas for request/response validation
- **Database** - Prisma client and connection management
- **Middleware** - Authentication and error handling

## Environment Variables
See `.env.example` in the root directory for all available configuration options.