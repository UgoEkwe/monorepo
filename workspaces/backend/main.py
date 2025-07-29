"""
FastAPI Backend Server for Modular AI Scaffold
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
from dotenv import load_dotenv

from services.entity_service import EntityService
from services.ai_service import AIService
from models.schemas import (
    EntityCreate, EntityUpdate, EntityResponse,
    ProjectCreate, ProjectResponse,
    AIGenerateRequest, AIGenerateResponse,
    HealthResponse
)
from middleware.auth import verify_token, get_current_user
from database.client import get_db_client
from utils.secrets_manager import get_secrets_manager

# Load environment variables
load_dotenv()

# Initialize secrets manager and validate configuration
secrets_manager = get_secrets_manager()
secrets_valid = secrets_manager.validate_and_setup()

if not secrets_valid and os.getenv('NODE_ENV') != 'development':
    raise RuntimeError("Missing required secrets. Please check your environment configuration.")

# Initialize services
entity_service = EntityService()
ai_service = AIService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    await get_db_client().connect()
    print("Database connected")
    
    # Log configuration status
    config = secrets_manager.get_all_config()
    print("Configuration loaded:")
    for category, settings in config.items():
        present_settings = {k: v for k, v in settings.items() if v is not None}
        if present_settings:
            print(f"  {category}: {len(present_settings)} settings configured")
    
    yield
    
    # Shutdown
    await get_db_client().disconnect()
    print("Database disconnected")

# Create FastAPI app
app = FastAPI(
    title="Modular AI Scaffold API",
    description="Backend API for the Modular AI Scaffold with entity management and AI integration",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Health check endpoint
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        db = get_db_client()
        await db.user.count()
        
        return HealthResponse(
            status="healthy",
            message="API is running and database is connected",
            version="1.0.0"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unhealthy: {str(e)}"
        )

# Entity endpoints
@app.post("/entities", response_model=EntityResponse)
async def create_entity(
    entity_data: EntityCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new entity"""
    try:
        entity = await entity_service.create_entity(entity_data, current_user["id"])
        return entity
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@app.get("/entities", response_model=List[EntityResponse])
async def get_entities(
    project_id: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    current_user: dict = Depends(get_current_user)
):
    """Get entities with optional filtering"""
    try:
        entities = await entity_service.get_entities(
            user_id=current_user["id"],
            project_id=project_id,
            limit=limit,
            offset=offset
        )
        return entities
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@app.get("/entities/{entity_id}", response_model=EntityResponse)
async def get_entity(
    entity_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific entity by ID"""
    try:
        entity = await entity_service.get_entity(entity_id, current_user["id"])
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entity not found"
            )
        return entity
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@app.put("/entities/{entity_id}", response_model=EntityResponse)
async def update_entity(
    entity_id: str,
    entity_data: EntityUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update an existing entity"""
    try:
        entity = await entity_service.update_entity(entity_id, entity_data, current_user["id"])
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entity not found"
            )
        return entity
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@app.delete("/entities/{entity_id}")
async def delete_entity(
    entity_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete an entity"""
    try:
        success = await entity_service.delete_entity(entity_id, current_user["id"])
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Entity not found"
            )
        return {"message": "Entity deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# AI generation endpoints
@app.post("/generate", response_model=AIGenerateResponse)
async def generate_content(
    request: AIGenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    """Generate content using AI and optionally save as entity"""
    try:
        result = await ai_service.generate_content(
            prompt=request.prompt,
            project_id=request.project_id,
            user_id=current_user["id"],
            save_as_entity=request.save_as_entity,
            entity_name=request.entity_name
        )
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"AI generation failed: {str(e)}"
        )

@app.post("/generate/batch", response_model=List[AIGenerateResponse])
async def generate_batch_content(
    requests: List[AIGenerateRequest],
    current_user: dict = Depends(get_current_user)
):
    """Generate multiple pieces of content in batch"""
    try:
        results = []
        for request in requests:
            result = await ai_service.generate_content(
                prompt=request.prompt,
                project_id=request.project_id,
                user_id=current_user["id"],
                save_as_entity=request.save_as_entity,
                entity_name=request.entity_name
            )
            results.append(result)
        return results
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch AI generation failed: {str(e)}"
        )

# Project endpoints
@app.get("/projects", response_model=List[ProjectResponse])
async def get_projects(
    current_user: dict = Depends(get_current_user)
):
    """Get user's projects"""
    try:
        projects = await entity_service.get_user_projects(current_user["id"])
        return projects
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@app.post("/projects", response_model=ProjectResponse)
async def create_project(
    project_data: ProjectCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create a new project"""
    try:
        project = await entity_service.create_project(project_data, current_user["id"])
        return project
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

if __name__ == "__main__":
    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True if os.getenv("NODE_ENV") == "development" else False
    )
