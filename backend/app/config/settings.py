"""
Configuration settings for Legal Case Analysis System
"""

from pydantic_settings import BaseSettings
from typing import Optional
import os
from pathlib import Path

class Settings(BaseSettings):
    """Application settings"""
    
    # MongoDB Configuration
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "legal_case_analysis"
    MONGODB_COLLECTION_CASES: str = "cases"
    MONGODB_COLLECTION_CHAT_HISTORY: str = "chat_history"
    
    # Groq API Configuration
    GROQ_API_KEY: str
    
    # FAISS Configuration
    FAISS_INDEX_PATH: str = "./data/faiss_index/legal_cases.index"
    FAISS_DIMENSION: int = 768
    
    # Model Configuration
    EMBEDDING_MODEL: str = "nlpaueb/legal-bert-small-uncased"
    SPACY_MODEL: str = "en_core_web_sm"
    
    # File Paths
    DATA_DIR: str = "./data"
    CASES_DIR: str = "./data/cases"
    LOGS_DIR: str = "./logs"
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_WORKERS: int = 4
    
    # Processing Configuration
    BATCH_SIZE: int = 100
    MAX_WORKERS: int = 4
    CHUNK_SIZE: int = 512
    CHUNK_OVERLAP: int = 50
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60
    
    # Security
    SECRET_KEY: str
    GDPR_COMPLIANCE: bool = True
    ANONYMIZE_DATA: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Create directories if they don't exist
        Path(self.DATA_DIR).mkdir(parents=True, exist_ok=True)
        Path(self.CASES_DIR).mkdir(parents=True, exist_ok=True)
        Path(self.LOGS_DIR).mkdir(parents=True, exist_ok=True)
        Path(os.path.dirname(self.FAISS_INDEX_PATH)).mkdir(parents=True, exist_ok=True)

# Global settings instance
settings = Settings()
