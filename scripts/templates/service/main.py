#!/usr/bin/env python3
"""
{{WORKSPACE_NAME}} Service

{{DESCRIPTION}}
"""

import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional

# Initialize FastAPI app
app = FastAPI(
    title="{{WORKSPACE_NAME}}",
    description="{{DESCRIPTION}}",
    version="{{VERSION}}"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class HealthResponse(BaseModel):
    status: str
    service: str
    version: str

class ServiceRequest(BaseModel):
    data: Dict[str, Any]
    options: Optional[Dict[str, Any]] = None

class ServiceResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None

# Routes
@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint - health check"""
    return HealthResponse(
        status="healthy",
        service="{{WORKSPACE_NAME}}",
        version="{{VERSION}}"
    )

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    return HealthResponse(
        status="healthy",
        service="{{WORKSPACE_NAME}}",
        version="{{VERSION}}"
    )

@app.post("/process", response_model=ServiceResponse)
async def process_data(request: ServiceRequest):
    """Process data endpoint - implement your business logic here"""
    try:
        # TODO: Implement your service logic here
        processed_data = {
            "input": request.data,
            "processed": True,
            "timestamp": "2024-01-01T00:00:00Z"
        }
        
        return ServiceResponse(
            success=True,
            data=processed_data,
            message="Data processed successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Environment configuration
def get_config():
    """Get configuration from environment variables"""
    return {
        "host": os.getenv("HOST", "0.0.0.0"),
        "port": int(os.getenv("PORT", 8000)),
        "debug": os.getenv("DEBUG", "false").lower() == "true",
        "reload": os.getenv("RELOAD", "true").lower() == "true"
    }

if __name__ == "__main__":
    config = get_config()
    
    print(f"🚀 Starting {{WORKSPACE_NAME}} service...")
    print(f"📍 Server will be available at http://{config['host']}:{config['port']}")
    print(f"📚 API docs at http://{config['host']}:{config['port']}/docs")
    
    uvicorn.run(
        "main:app",
        host=config["host"],
        port=config["port"],
        reload=config["reload"]
    )