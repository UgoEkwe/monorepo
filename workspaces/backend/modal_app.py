"""
Modal deployment configuration for the FastAPI backend
"""
import modal
import os
from pathlib import Path

# Create Modal app
app = modal.App("modular-ai-scaffold-backend")

# Define the image with all dependencies
image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install([
        "fastapi==0.104.1",
        "uvicorn[standard]==0.24.0",
        "pydantic==2.5.0",
        "pydantic-settings==2.1.0",
        "prisma==0.11.0",
        "python-multipart==0.0.6",
        "python-jose[cryptography]==3.3.0",
        "passlib[bcrypt]==1.7.4",
        "python-dotenv==1.0.0",
        "httpx==0.25.2"
    ])
    .run_commands([
        "prisma generate"  # Generate Prisma client
    ])
)

# Mount the backend code
backend_mount = modal.Mount.from_local_dir(
    Path(__file__).parent,
    remote_path="/app"
)

# Environment secrets
secrets = [
    modal.Secret.from_name("database-url"),
    modal.Secret.from_name("supabase-config"),
    modal.Secret.from_name("openrouter-config"),
]

@app.function(
    image=image,
    mounts=[backend_mount],
    secrets=secrets,
    keep_warm=1,  # Keep one instance warm
    timeout=300,  # 5 minute timeout
    memory=1024,  # 1GB memory
)
@modal.asgi_app()
def fastapi_app():
    """Create and return the FastAPI app for Modal"""
    import sys
    sys.path.append("/app")
    
    from main import app as fastapi_app
    return fastapi_app

@app.function(
    image=image,
    mounts=[backend_mount],
    secrets=secrets,
    schedule=modal.Cron("0 */6 * * *"),  # Run every 6 hours
)
def keep_warm():
    """Keep the database connection warm"""
    import asyncio
    from database.client import connect_db, disconnect_db
    
    async def ping_db():
        await connect_db()
        print("Database connection warmed up")
        await disconnect_db()
    
    asyncio.run(ping_db())

if __name__ == "__main__":
    # For local development
    import uvicorn
    from main import app as fastapi_app
    
    uvicorn.run(
        fastapi_app,
        host="0.0.0.0",
        port=int(os.getenv("API_PORT", 8000)),
        reload=True
    )