"""
Database client configuration and connection management with fallback support
"""
import os
from typing import Optional, Any

# Try to import Prisma with fallback
try:
    from prisma import Prisma
    PRISMA_AVAILABLE = True
except ImportError:
    print("Warning: Prisma not available, using fallback client")
    PRISMA_AVAILABLE = False
    
    # Fallback Prisma client
    class Prisma:
        def __init__(self):
            self._connected = False
            
        async def connect(self):
            print("Warning: Database not available - connect() is no-op")
            self._connected = True
            
        async def disconnect(self):
            print("Warning: Database not available - disconnect() is no-op")
            self._connected = False
            
        def is_connected(self):
            return self._connected
            
        def __getattr__(self, name):
            # Return a mock table client for any table access
            return MockTable(name)

    class MockTable:
        def __init__(self, table_name: str):
            self.table_name = table_name
            
        async def find_many(self, *args, **kwargs):
            print(f"Warning: Database not available - {self.table_name}.find_many() returning empty list")
            return []
            
        async def find_unique(self, *args, **kwargs):
            print(f"Warning: Database not available - {self.table_name}.find_unique() returning None")
            return None
            
        async def find_first(self, *args, **kwargs):
            print(f"Warning: Database not available - {self.table_name}.find_first() returning None")
            return None
            
        async def create(self, *args, **kwargs):
            print(f"Warning: Database not available - {self.table_name}.create() failed")
            raise Exception("Database not available")
            
        async def update(self, *args, **kwargs):
            print(f"Warning: Database not available - {self.table_name}.update() failed")
            raise Exception("Database not available")
            
        async def delete(self, *args, **kwargs):
            print(f"Warning: Database not available - {self.table_name}.delete() failed")
            raise Exception("Database not available")
            
        async def count(self, *args, **kwargs):
            print(f"Warning: Database not available - {self.table_name}.count() returning 0")
            return 0

# Global database client instance
_db_client: Optional[Prisma] = None

def get_db_client() -> Prisma:
    """Get the global database client instance"""
    global _db_client
    
    if _db_client is None:
        _db_client = Prisma()
    
    return _db_client

def is_database_available() -> bool:
    """Check if database is available"""
    return PRISMA_AVAILABLE and bool(os.getenv("DATABASE_URL"))

async def connect_db():
    """Connect to the database"""
    if not is_database_available():
        print("Warning: Database not configured, using fallback client")
        return
        
    db = get_db_client()
    if not db.is_connected():
        await db.connect()

async def disconnect_db():
    """Disconnect from the database"""
    db = get_db_client()
    if db.is_connected():
        await db.disconnect()