"""
Database client configuration and connection management
"""
import os
from prisma import Prisma
from typing import Optional

# Global database client instance
_db_client: Optional[Prisma] = None

def get_db_client() -> Prisma:
    """Get the global database client instance"""
    global _db_client
    
    if _db_client is None:
        _db_client = Prisma()
    
    return _db_client

async def connect_db():
    """Connect to the database"""
    db = get_db_client()
    if not db.is_connected():
        await db.connect()

async def disconnect_db():
    """Disconnect from the database"""
    db = get_db_client()
    if db.is_connected():
        await db.disconnect()