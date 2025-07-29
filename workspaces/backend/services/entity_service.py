"""
Entity service for managing entities and projects
"""
import uuid
from typing import List, Optional, Dict, Any
from database.client import get_db_client
from models.schemas import (
    EntityCreate, EntityUpdate, EntityResponse,
    ProjectCreate, ProjectResponse
)

class EntityService:
    """Service for managing entities and projects"""
    
    def __init__(self):
        pass
    
    async def create_entity(self, entity_data: EntityCreate, user_id: str) -> EntityResponse:
        """Create a new entity"""
        db = get_db_client()
        
        # Verify project exists and user has access
        project = await db.project.find_first(
            where={
                "id": entity_data.project_id,
                "ownerId": user_id
            }
        )
        
        if not project:
            raise ValueError("Project not found or access denied")
        
        # Generate slug if not provided
        slug = entity_data.slug
        if not slug:
            slug = self._generate_slug(entity_data.name)
        
        # Ensure slug is unique within project
        slug = await self._ensure_unique_slug(entity_data.project_id, slug)
        
        # Create entity
        entity = await db.entity.create(
            data={
                "name": entity_data.name,
                "description": entity_data.description,
                "slug": slug,
                "status": entity_data.status,
                "metadata": entity_data.metadata or {},
                "projectId": entity_data.project_id
            }
        )
        
        return EntityResponse.model_validate(entity)
    
    async def get_entities(
        self, 
        user_id: str, 
        project_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[EntityResponse]:
        """Get entities with optional filtering"""
        db = get_db_client()
        
        # Build where clause
        where_clause = {
            "project": {
                "ownerId": user_id
            }
        }
        
        if project_id:
            where_clause["projectId"] = project_id
        
        entities = await db.entity.find_many(
            where=where_clause,
            skip=offset,
            take=limit,
            order_by={"createdAt": "desc"}
        )
        
        return [EntityResponse.model_validate(entity) for entity in entities]
    
    async def get_entity(self, entity_id: str, user_id: str) -> Optional[EntityResponse]:
        """Get a specific entity by ID"""
        db = get_db_client()
        
        entity = await db.entity.find_first(
            where={
                "id": entity_id,
                "project": {
                    "ownerId": user_id
                }
            }
        )
        
        if not entity:
            return None
        
        return EntityResponse.model_validate(entity)
    
    async def update_entity(
        self, 
        entity_id: str, 
        entity_data: EntityUpdate, 
        user_id: str
    ) -> Optional[EntityResponse]:
        """Update an existing entity"""
        db = get_db_client()
        
        # Verify entity exists and user has access
        existing_entity = await db.entity.find_first(
            where={
                "id": entity_id,
                "project": {
                    "ownerId": user_id
                }
            }
        )
        
        if not existing_entity:
            return None
        
        # Prepare update data
        update_data = {}
        
        if entity_data.name is not None:
            update_data["name"] = entity_data.name
        
        if entity_data.description is not None:
            update_data["description"] = entity_data.description
        
        if entity_data.slug is not None:
            # Ensure slug is unique within project
            slug = await self._ensure_unique_slug(
                existing_entity.projectId, 
                entity_data.slug,
                exclude_entity_id=entity_id
            )
            update_data["slug"] = slug
        
        if entity_data.status is not None:
            update_data["status"] = entity_data.status
        
        if entity_data.metadata is not None:
            update_data["metadata"] = entity_data.metadata
        
        # Update entity
        entity = await db.entity.update(
            where={"id": entity_id},
            data=update_data
        )
        
        return EntityResponse.model_validate(entity)
    
    async def delete_entity(self, entity_id: str, user_id: str) -> bool:
        """Delete an entity"""
        db = get_db_client()
        
        # Verify entity exists and user has access
        entity = await db.entity.find_first(
            where={
                "id": entity_id,
                "project": {
                    "ownerId": user_id
                }
            }
        )
        
        if not entity:
            return False
        
        # Delete entity
        await db.entity.delete(where={"id": entity_id})
        return True
    
    async def create_project(self, project_data: ProjectCreate, user_id: str) -> ProjectResponse:
        """Create a new project"""
        db = get_db_client()
        
        # Generate slug if not provided
        slug = project_data.slug
        if not slug:
            slug = self._generate_slug(project_data.name)
        
        # Ensure slug is unique for user
        slug = await self._ensure_unique_project_slug(user_id, slug)
        
        # Create project
        project = await db.project.create(
            data={
                "name": project_data.name,
                "description": project_data.description,
                "slug": slug,
                "metadata": project_data.metadata or {},
                "ownerId": user_id
            }
        )
        
        return ProjectResponse.model_validate(project)
    
    async def get_user_projects(self, user_id: str) -> List[ProjectResponse]:
        """Get all projects for a user"""
        db = get_db_client()
        
        projects = await db.project.find_many(
            where={"ownerId": user_id},
            order_by={"createdAt": "desc"},
            include={"_count": {"select": {"entities": True}}}
        )
        
        result = []
        for project in projects:
            project_dict = project.model_dump()
            project_dict["entity_count"] = project._count.entities if hasattr(project, '_count') else 0
            result.append(ProjectResponse.model_validate(project_dict))
        
        return result
    
    def _generate_slug(self, name: str) -> str:
        """Generate a URL-friendly slug from a name"""
        import re
        
        # Convert to lowercase and replace spaces/special chars with hyphens
        slug = re.sub(r'[^\w\s-]', '', name.lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        slug = slug.strip('-')
        
        # Ensure slug is not empty
        if not slug:
            slug = str(uuid.uuid4())[:8]
        
        return slug
    
    async def _ensure_unique_slug(
        self, 
        project_id: str, 
        slug: str, 
        exclude_entity_id: Optional[str] = None
    ) -> str:
        """Ensure slug is unique within a project"""
        db = get_db_client()
        
        original_slug = slug
        counter = 1
        
        while True:
            where_clause = {
                "projectId": project_id,
                "slug": slug
            }
            
            if exclude_entity_id:
                where_clause["NOT"] = {"id": exclude_entity_id}
            
            existing = await db.entity.find_first(where=where_clause)
            
            if not existing:
                return slug
            
            slug = f"{original_slug}-{counter}"
            counter += 1
    
    async def _ensure_unique_project_slug(self, user_id: str, slug: str) -> str:
        """Ensure project slug is unique for a user"""
        db = get_db_client()
        
        original_slug = slug
        counter = 1
        
        while True:
            existing = await db.project.find_first(
                where={
                    "ownerId": user_id,
                    "slug": slug
                }
            )
            
            if not existing:
                return slug
            
            slug = f"{original_slug}-{counter}"
            counter += 1