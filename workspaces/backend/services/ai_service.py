"""
AI service for content generation and agent integration
"""
import os
import sys
import asyncio
from typing import Optional, Dict, Any
from models.schemas import AIGenerateResponse
from database.client import get_db_client

# Add the AI workspace to the path for imports
ai_workspace_path = os.path.join(os.path.dirname(__file__), '../../ai/src')
if ai_workspace_path not in sys.path:
    sys.path.append(ai_workspace_path)

AI_AVAILABLE = False
try:
    from modular_agent import ModularAgent
    from types import AgentConfig
    AI_AVAILABLE = True
except ImportError:
    try:
        # Try alternative import path
        sys.path.append(os.path.join(os.path.dirname(__file__), '../../../ai/src'))
        from modular_agent import ModularAgent
        from types import AgentConfig
        AI_AVAILABLE = True
    except ImportError:
        AI_AVAILABLE = False
        print("Warning: AI workspace not available. AI generation will be mocked.")

class AIService:
    """Service for AI content generation and agent operations"""
    
    def __init__(self):
        self.agent = None
        if AI_AVAILABLE:
            try:
                self.agent = ModularAgent()
                asyncio.create_task(self._initialize_agent())
            except Exception as e:
                print(f"Warning: Could not initialize AI agent: {e}")
    
    async def _initialize_agent(self):
        """Initialize the AI agent"""
        if self.agent:
            try:
                await self.agent.initialize()
            except Exception as e:
                print(f"Warning: Could not initialize AI agent: {e}")
    
    async def generate_content(
        self,
        prompt: str,
        project_id: Optional[str] = None,
        user_id: Optional[str] = None,
        save_as_entity: bool = False,
        entity_name: Optional[str] = None,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None
    ) -> AIGenerateResponse:
        """Generate content using AI"""
        
        # If AI is not available, return mock content
        if not AI_AVAILABLE or not self.agent:
            content = self._generate_mock_content(prompt)
            model_used = "mock-model"
        else:
            try:
                # Configure agent if custom parameters provided
                config = {}
                if model:
                    config['model'] = model
                if temperature is not None:
                    config['temperature'] = temperature
                if max_tokens:
                    config['maxTokens'] = max_tokens
                
                if config:
                    # Create a new agent instance with custom config
                    custom_agent = ModularAgent(config)
                    await custom_agent.initialize()
                    result = await custom_agent.runLoop(prompt, project_id)
                else:
                    result = await self.agent.runLoop(prompt, project_id)
                
                content = result.response
                model_used = result.metadata.get('model', 'openai/gpt-4o-mini')
                
            except Exception as e:
                print(f"AI generation failed, falling back to mock: {e}")
                content = self._generate_mock_content(prompt)
                model_used = "mock-model-fallback"
        
        entity_id = None
        
        # Save as entity if requested
        if save_as_entity and project_id and user_id:
            try:
                entity_id = await self._save_as_entity(
                    content=content,
                    project_id=project_id,
                    user_id=user_id,
                    entity_name=entity_name or "AI Generated Content",
                    prompt=prompt
                )
            except Exception as e:
                print(f"Failed to save as entity: {e}")
        
        return AIGenerateResponse(
            content=content,
            prompt=prompt,
            model=model_used,
            entity_id=entity_id,
            metadata={
                "project_id": project_id,
                "user_id": user_id,
                "saved_as_entity": save_as_entity,
                "generation_timestamp": asyncio.get_event_loop().time()
            }
        )
    
    async def run_agent_loop(
        self,
        prompt: str,
        project_id: Optional[str] = None,
        config: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Run the full agent loop with tools"""
        
        if not AI_AVAILABLE or not self.agent:
            return {
                "response": self._generate_mock_content(prompt),
                "toolCalls": [],
                "metadata": {"model": "mock-model", "project_id": project_id}
            }
        
        try:
            # Create custom agent if config provided
            if config:
                agent = ModularAgent(config)
                await agent.initialize()
                result = await agent.runLoop(prompt, project_id)
            else:
                result = await self.agent.runLoop(prompt, project_id)
            
            return {
                "response": result.response,
                "toolCalls": result.toolCalls,
                "metadata": result.metadata
            }
            
        except Exception as e:
            print(f"Agent loop failed: {e}")
            return {
                "response": f"Agent execution failed: {str(e)}",
                "toolCalls": [],
                "metadata": {"error": str(e), "project_id": project_id}
            }
    
    def _generate_mock_content(self, prompt: str) -> str:
        """Generate mock content when AI is not available"""
        mock_responses = {
            "blog": "This is a sample blog post generated in response to your prompt. In a real implementation, this would be generated by an AI model.",
            "product": "Sample Product Name\n\nThis is a sample product description that would normally be generated by AI based on your specifications.",
            "content": "This is sample content generated in response to your prompt. The AI service would normally process your request and return relevant, contextual content.",
            "story": "Once upon a time, there was a sample story that would be generated by AI. This is just a placeholder for demonstration purposes.",
            "code": "# Sample code that would be generated by AI\ndef sample_function():\n    return 'This is mock generated code'",
        }
        
        # Try to match prompt to content type
        prompt_lower = prompt.lower()
        for content_type, response in mock_responses.items():
            if content_type in prompt_lower:
                return f"{response}\n\n[Generated in response to: {prompt[:100]}...]"
        
        # Default response
        return f"This is sample AI-generated content in response to your prompt: '{prompt[:100]}...'\n\nIn a real implementation, this would be generated by an AI model based on your specific requirements."
    
    async def _save_as_entity(
        self,
        content: str,
        project_id: str,
        user_id: str,
        entity_name: str,
        prompt: str
    ) -> str:
        """Save generated content as an entity"""
        db = get_db_client()
        
        # Verify project exists and user has access
        project = await db.project.find_first(
            where={
                "id": project_id,
                "ownerId": user_id
            }
        )
        
        if not project:
            raise ValueError("Project not found or access denied")
        
        # Generate slug from entity name
        import re
        slug = re.sub(r'[^\w\s-]', '', entity_name.lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        slug = slug.strip('-')
        
        if not slug:
            import uuid
            slug = str(uuid.uuid4())[:8]
        
        # Ensure slug is unique
        original_slug = slug
        counter = 1
        while True:
            existing = await db.entity.find_first(
                where={
                    "projectId": project_id,
                    "slug": slug
                }
            )
            if not existing:
                break
            slug = f"{original_slug}-{counter}"
            counter += 1
        
        # Create entity
        entity = await db.entity.create(
            data={
                "name": entity_name,
                "description": content,
                "slug": slug,
                "status": "published",
                "metadata": {
                    "generated_by": "ai",
                    "original_prompt": prompt,
                    "generation_type": "ai_content"
                },
                "projectId": project_id
            }
        )
        
        return entity.id
    
    def get_available_tools(self) -> list:
        """Get list of available AI tools"""
        if not AI_AVAILABLE or not self.agent:
            return []
        
        try:
            return self.agent.getAvailableTools()
        except Exception:
            return []
    
    async def call_tool(self, tool_name: str, args: Dict[str, Any]) -> Any:
        """Call a specific AI tool"""
        if not AI_AVAILABLE or not self.agent:
            raise ValueError("AI agent not available")
        
        return await self.agent.callTool(tool_name, args)