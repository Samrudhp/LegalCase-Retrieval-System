"""
Database configuration and connection setup for MongoDB
"""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError
from typing import Optional
import asyncio

from app.config.settings import settings
from app.utils.logger import setup_logger

logger = setup_logger()

class DatabaseManager:
    """MongoDB database manager"""
    
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.database = None
        self.sync_client: Optional[MongoClient] = None
        self.sync_database = None
    
    async def connect_async(self):
        """Connect to MongoDB asynchronously"""
        try:
            self.client = AsyncIOMotorClient(settings.MONGODB_URI)
            self.database = self.client[settings.MONGODB_DB_NAME]
            
            # Test connection
            await self.client.admin.command('ping')
            logger.info("Connected to MongoDB (async)")
            
            # Create indexes
            await self.create_indexes()
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB (async): {e}")
            raise
    
    def connect_sync(self):
        """Connect to MongoDB synchronously"""
        try:
            self.sync_client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
            self.sync_database = self.sync_client[settings.MONGODB_DB_NAME]
            
            # Test connection
            self.sync_client.admin.command('ping')
            logger.info("Connected to MongoDB (sync)")
            
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB (sync): {e}")
            raise
    
    async def create_indexes(self):
        """Create database indexes for better performance"""
        try:
            # Cases collection indexes
            cases_collection = self.database[settings.MONGODB_COLLECTION_CASES]
            await cases_collection.create_index("case_id", unique=True)
            await cases_collection.create_index("title")
            await cases_collection.create_index("court")
            await cases_collection.create_index("date")
            await cases_collection.create_index("case_type")
            await cases_collection.create_index([("title", "text"), ("content", "text")])
            
            # Chat history collection indexes
            chat_collection = self.database[settings.MONGODB_COLLECTION_CHAT_HISTORY]
            await chat_collection.create_index("session_id")
            await chat_collection.create_index("timestamp")
            
            logger.info("Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"Failed to create indexes: {e}")
    
    async def disconnect(self):
        """Disconnect from MongoDB"""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB (async)")
        
        if self.sync_client:
            self.sync_client.close()
            logger.info("Disconnected from MongoDB (sync)")
    
    def get_cases_collection(self):
        """Get cases collection (async)"""
        return self.database[settings.MONGODB_COLLECTION_CASES]
    
    def get_chat_collection(self):
        """Get chat history collection (async)"""
        return self.database[settings.MONGODB_COLLECTION_CHAT_HISTORY]
    
    def get_sync_cases_collection(self):
        """Get cases collection (sync)"""
        return self.sync_database[settings.MONGODB_COLLECTION_CASES]
    
    def get_sync_chat_collection(self):
        """Get chat history collection (sync)"""
        return self.sync_database[settings.MONGODB_COLLECTION_CHAT_HISTORY]

# Global database manager instance
db_manager = DatabaseManager()

async def init_database():
    """Initialize database connections"""
    await db_manager.connect_async()
    db_manager.connect_sync()

async def get_database():
    """Get database instance"""
    if db_manager.database is None:
        await db_manager.connect_async()
    return db_manager.database

def get_sync_database():
    """Get synchronous database instance"""
    if db_manager.sync_database is None:
        db_manager.connect_sync()
    return db_manager.sync_database
