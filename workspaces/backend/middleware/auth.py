"""
Authentication middleware for FastAPI
"""
import os
import jwt
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
from database.client import get_db_client

# Try to import secrets manager, fall back to basic environment variables
try:
    from utils.secrets_manager import get_secrets_manager
    secrets_manager = get_secrets_manager()
    SUPABASE_JWT_SECRET = secrets_manager.get_supabase_config().get('jwt_secret')
except ImportError:
    SUPABASE_JWT_SECRET = os.getenv("SUPABASE_JWT_SECRET")

security = HTTPBearer()

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Verify JWT token from Supabase
    """
    try:
        token = credentials.credentials
        
        # For development, allow a simple bypass token
        if os.getenv("NODE_ENV") == "development" and token == "dev-token":
            return {
                "id": "dev-user-id",
                "email": "dev@example.com",
                "name": "Development User"
            }
        
        # Use the JWT secret from secrets manager or environment
        supabase_jwt_secret = SUPABASE_JWT_SECRET or os.getenv("SUPABASE_JWT_SECRET")
        
        if not supabase_jwt_secret:
            # For now, we'll use a simple verification
            # In production, implement proper Supabase JWT verification
            payload = jwt.decode(
                token, 
                options={"verify_signature": False}  # Disable for demo
            )
            return payload
        
        payload = jwt.decode(
            token,
            supabase_jwt_secret,
            algorithms=["HS256"]
        )
        
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(token_data: Dict[str, Any] = Depends(verify_token)) -> Dict[str, Any]:
    """
    Get current user from token data and ensure user exists in database
    """
    try:
        user_id = token_data.get("sub") or token_data.get("id")
        email = token_data.get("email")
        
        if not user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token data"
            )
        
        db = get_db_client()
        
        # Try to find existing user
        user = await db.user.find_unique(where={"id": user_id})
        
        # If user doesn't exist, create them
        if not user:
            user = await db.user.create(
                data={
                    "id": user_id,
                    "email": email,
                    "name": token_data.get("name") or token_data.get("user_metadata", {}).get("name"),
                    "avatar": token_data.get("avatar_url") or token_data.get("user_metadata", {}).get("avatar_url"),
                    "metadata": token_data.get("user_metadata", {})
                }
            )
        
        return {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar": user.avatar
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate user: {str(e)}"
        )

async def get_optional_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[Dict[str, Any]]:
    """
    Get current user if token is provided, otherwise return None
    """
    if not credentials:
        return None
    
    try:
        token_data = await verify_token(credentials)
        return await get_current_user(token_data)
    except HTTPException:
        return None
