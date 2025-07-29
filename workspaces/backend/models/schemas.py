"""
Pydantic schemas for API request/response models
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

# Base schemas
class BaseSchema(BaseModel):
    class Config:
        from_attributes = True

# Health check
class HealthResponse(BaseSchema):
    status: str
    message: str
    version: str

# Entity schemas
class EntityBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    slug: Optional[str] = None
    status: str = Field(default="draft")
    metadata: Optional[Dict[str, Any]] = None

class EntityCreate(EntityBase):
    project_id: str = Field(..., description="ID of the project this entity belongs to")

class EntityUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    slug: Optional[str] = None
    status: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class EntityResponse(EntityBase):
    id: str
    project_id: str
    created_at: datetime
    updated_at: datetime

# Project schemas
class ProjectBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    slug: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseSchema):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    slug: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class ProjectResponse(ProjectBase):
    id: str
    owner_id: str
    created_at: datetime
    updated_at: datetime
    entity_count: Optional[int] = None

# User schemas
class UserResponse(BaseSchema):
    id: str
    email: str
    name: Optional[str] = None
    avatar: Optional[str] = None
    created_at: datetime
    updated_at: datetime

# AI generation schemas
class AIGenerateRequest(BaseSchema):
    prompt: str = Field(..., min_length=1, description="The prompt for AI generation")
    project_id: Optional[str] = Field(None, description="Project ID to associate generated content with")
    save_as_entity: bool = Field(default=False, description="Whether to save the generated content as an entity")
    entity_name: Optional[str] = Field(None, description="Name for the entity if saving")
    model: Optional[str] = Field(None, description="AI model to use for generation")
    temperature: Optional[float] = Field(None, ge=0.0, le=2.0, description="Temperature for AI generation")
    max_tokens: Optional[int] = Field(None, gt=0, description="Maximum tokens for AI generation")

class AIGenerateResponse(BaseSchema):
    content: str = Field(..., description="The generated content")
    prompt: str = Field(..., description="The original prompt")
    model: str = Field(..., description="The AI model used")
    entity_id: Optional[str] = Field(None, description="ID of created entity if saved")
    metadata: Optional[Dict[str, Any]] = Field(None, description="Additional metadata about the generation")

# Authentication schemas
class TokenData(BaseSchema):
    user_id: Optional[str] = None
    email: Optional[str] = None

class AuthUser(BaseSchema):
    id: str
    email: str
    name: Optional[str] = None