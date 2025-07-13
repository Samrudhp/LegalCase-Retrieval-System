# Phase 3: Backend Engineering & Architecture

## ⚙️ Overview

This phase provides a comprehensive exploration of the backend engineering architecture, covering FastAPI implementation, database design, API architecture, microservices patterns, and production-ready engineering practices that power the Legal Case Retrieval System.

## 🏗️ Backend Architecture Overview

### Microservices Architecture
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Backend Microservices Architecture                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   API Gateway (FastAPI)                     External Services              │
│         │                                         │                        │
│         ▼                                         ▼                        │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │   Ingestion     │    │   Retrieval     │    │      Chat       │        │
│  │   Service       │    │   Service       │    │    Service      │        │
│  │                 │    │                 │    │                 │        │
│  │ • PDF Process  │    │ • Vector Search │    │ • RAG Pipeline  │        │
│  │ • OCR Extract  │    │ • FAISS Query   │    │ • LLM Interface │        │
│  │ • Embedding    │    │ • Result Rank   │    │ • Context Mgmt  │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│         │                       │                       │                │
│         ▼                       ▼                       ▼                │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐        │
│  │ Summarization   │    │ Question Gen    │    │   Embedding     │        │
│  │   Service       │    │   Service       │    │   Service       │        │
│  │                 │    │                 │    │                 │        │
│  │ • Multi-method  │    │ • Smart Q&A     │    │ • LegalBERT     │        │
│  │ • Content Anal  │    │ • Difficulty    │    │ • Vector Mgmt   │        │
│  │ • Key Extract   │    │ • Type Diverse  │    │ • FAISS Ops     │        │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘        │
│         │                       │                       │                │
│         └───────────────────────┼───────────────────────┘                │
│                                 │                                        │
│           ┌─────────────────────────────────────────────────────────────┐  │
│           │                   Data Access Layer                        │  │
│           │                                                             │  │
│           │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │  │
│           │  │   MongoDB   │  │    FAISS    │  │ File System │        │  │
│           │  │  Database   │  │ Vector DB   │  │   Storage   │        │  │
│           │  │             │  │             │  │             │        │  │
│           │  │ • Metadata  │  │ • Embeddings│  │ • PDFs      │        │  │
│           │  │ • Sessions  │  │ • Index     │  │ • Logs      │        │  │
│           │  │ • History   │  │ • Mappings  │  │ • Cache     │        │  │
│           │  └─────────────┘  └─────────────┘  └─────────────┘        │  │
│           └─────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 🚀 FastAPI Framework Implementation

### Core Application Structure
```python
# app/main.py
"""
Production-grade FastAPI application with advanced features
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import uvicorn
from contextlib import asynccontextmanager
import time
import logging
from typing import Optional

from app.api.routes import (
    ingestion_router,
    retrieval_router,
    summarization_router,
    question_generation_router,
    chat_router
)
from app.config.settings import settings
from app.config.database import init_database, close_database
from app.utils.logger import setup_logger, get_logger
from app.middleware.security import SecurityMiddleware
from app.middleware.rate_limiting import RateLimitMiddleware
from app.middleware.monitoring import MonitoringMiddleware

# Setup structured logging
logger = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan management with proper startup/shutdown
    """
    # Startup
    logger.info("🚀 Starting Legal Case Analysis System")
    
    try:
        # Initialize database connections
        await init_database()
        logger.info("✅ Database connections established")
        
        # Initialize AI/ML services
        await init_ai_services()
        logger.info("✅ AI/ML services initialized")
        
        # Initialize monitoring
        await init_monitoring()
        logger.info("✅ Monitoring systems active")
        
        yield
        
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise
    finally:
        # Shutdown
        logger.info("🛑 Shutting down Legal Case Analysis System")
        
        await close_database()
        await cleanup_ai_services()
        await cleanup_monitoring()
        
        logger.info("✅ Shutdown complete")

# Create FastAPI application with production configuration
app = FastAPI(
    title="Legal Case Analysis System API",
    description="Advanced AI-powered legal document analysis and retrieval system",
    version="2.0.0",
    docs_url="/api/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/api/redoc" if settings.ENVIRONMENT != "production" else None,
    openapi_url="/api/openapi.json" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan,
    # Production optimizations
    swagger_ui_parameters={
        "defaultModelsExpandDepth": 2,
        "defaultModelExpandDepth": 2,
        "displayRequestDuration": True,
    }
)

# Security Middleware Stack
app.add_middleware(SecurityMiddleware)
app.add_middleware(RateLimitMiddleware, calls=100, period=60)  # 100 calls per minute
app.add_middleware(MonitoringMiddleware)
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.ALLOWED_HOSTS)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Process-Time", "X-Request-ID"],
)

# Global Exception Handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Enhanced HTTP exception handling with logging"""
    
    logger.warning(
        f"HTTP {exc.status_code}: {exc.detail}",
        extra={
            "path": request.url.path,
            "method": request.method,
            "client_ip": request.client.host,
            "user_agent": request.headers.get("user-agent"),
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "timestamp": time.time(),
                "request_id": request.state.request_id if hasattr(request.state, 'request_id') else None
            }
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Global exception handler for unhandled exceptions"""
    
    logger.error(
        f"Unhandled exception: {str(exc)}",
        exc_info=True,
        extra={
            "path": request.url.path,
            "method": request.method,
            "client_ip": request.client.host,
        }
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": 500,
                "message": "Internal server error",
                "timestamp": time.time(),
            }
        }
    )

# Health Check Endpoints
@app.get("/health", tags=["System"])
async def health_check():
    """Comprehensive system health check"""
    
    health_status = {
        "status": "healthy",
        "timestamp": time.time(),
        "version": "2.0.0",
        "services": {}
    }
    
    # Check database connectivity
    try:
        db_status = await check_database_health()
        health_status["services"]["database"] = db_status
    except Exception as e:
        health_status["services"]["database"] = {"status": "unhealthy", "error": str(e)}
        health_status["status"] = "degraded"
    
    # Check AI services
    try:
        ai_status = await check_ai_services_health()
        health_status["services"]["ai_ml"] = ai_status
    except Exception as e:
        health_status["services"]["ai_ml"] = {"status": "unhealthy", "error": str(e)}
        health_status["status"] = "degraded"
    
    return health_status

@app.get("/health/ready", tags=["System"])
async def readiness_check():
    """Kubernetes readiness probe"""
    return {"status": "ready", "timestamp": time.time()}

@app.get("/health/live", tags=["System"])
async def liveness_check():
    """Kubernetes liveness probe"""
    return {"status": "alive", "timestamp": time.time()}

# Include API routers with versioning
app.include_router(
    ingestion_router,
    prefix="/api/v1/ingestion",
    tags=["Document Ingestion"]
)

app.include_router(
    retrieval_router,
    prefix="/api/v1/retrieval",
    tags=["Case Retrieval"]
)

app.include_router(
    summarization_router,
    prefix="/api/v1/summarization",
    tags=["Summarization"]
)

app.include_router(
    question_generation_router,
    prefix="/api/v1/questions",
    tags=["Question Generation"]
)

app.include_router(
    chat_router,
    prefix="/api/v1/chat",
    tags=["AI Chat"]
)

# Root endpoint
@app.get("/", tags=["System"])
async def root():
    """API root endpoint with system information"""
    return {
        "name": "Legal Case Analysis System API",
        "version": "2.0.0",
        "documentation": "/api/docs",
        "health": "/health",
        "status": "operational"
    }

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        workers=settings.API_WORKERS,
        log_level="info",
        access_log=True,
        reload=settings.ENVIRONMENT == "development"
    )
```

### Advanced Middleware Implementation

#### Security Middleware
```python
# app/middleware/security.py
"""
Comprehensive security middleware for production deployment
"""

import time
import uuid
from typing import Callable
from fastapi import Request, Response
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
import hashlib
import hmac
from app.config.settings import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

class SecurityMiddleware(BaseHTTPMiddleware):
    """
    Advanced security middleware implementing multiple security measures
    """
    
    def __init__(self, app, secret_key: str = None):
        super().__init__(app)
        self.secret_key = secret_key or settings.SECRET_KEY
        self.security_headers = {
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
            "Content-Security-Policy": "default-src 'self'",
            "Referrer-Policy": "strict-origin-when-cross-origin",
        }
        
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request through security pipeline
        """
        start_time = time.time()
        
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Security validations
        security_check = self._perform_security_checks(request)
        if security_check["blocked"]:
            logger.warning(
                f"Security check failed: {security_check['reason']}",
                extra={"request_id": request_id, "ip": request.client.host}
            )
            return Response(
                content="Access Denied",
                status_code=403,
                headers={"X-Request-ID": request_id}
            )
        
        # Process request
        response = await call_next(request)
        
        # Add security headers
        for header, value in self.security_headers.items():
            response.headers[header] = value
            
        # Add processing time and request ID
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        response.headers["X-Request-ID"] = request_id
        
        return response
        
    def _perform_security_checks(self, request: Request) -> dict:
        """
        Comprehensive security validation
        """
        # Check for suspicious patterns
        path = str(request.url.path)
        
        # SQL injection patterns
        sql_patterns = ["'", "union", "select", "insert", "delete", "drop"]
        if any(pattern in path.lower() for pattern in sql_patterns):
            return {"blocked": True, "reason": "Potential SQL injection"}
            
        # XSS patterns
        xss_patterns = ["<script", "javascript:", "onload=", "onerror="]
        if any(pattern in path.lower() for pattern in xss_patterns):
            return {"blocked": True, "reason": "Potential XSS attack"}
            
        # Path traversal
        if "../" in path or "..%2f" in path.lower():
            return {"blocked": True, "reason": "Path traversal attempt"}
            
        return {"blocked": False, "reason": None}
```

#### Rate Limiting Middleware
```python
# app/middleware/rate_limiting.py
"""
Advanced rate limiting with Redis backend
"""

import time
import json
from typing import Dict, Optional
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import asyncio
import redis.asyncio as redis
from app.config.settings import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Production-grade rate limiting with multiple strategies
    """
    
    def __init__(self, app, calls: int = 100, period: int = 60):
        super().__init__(app)
        self.calls = calls
        self.period = period
        self.redis_client = None
        self.memory_store = {}  # Fallback for Redis unavailability
        
    async def setup_redis(self):
        """Initialize Redis connection for distributed rate limiting"""
        try:
            self.redis_client = redis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True
            )
            await self.redis_client.ping()
            logger.info("✅ Redis connected for rate limiting")
        except Exception as e:
            logger.warning(f"Redis unavailable, using memory store: {e}")
            self.redis_client = None
            
    async def dispatch(self, request: Request, call_next):
        """
        Rate limiting with sliding window algorithm
        """
        if not self.redis_client:
            await self.setup_redis()
            
        # Get client identifier
        client_id = self._get_client_id(request)
        
        # Check rate limit
        if await self._is_rate_limited(client_id, request):
            logger.warning(
                f"Rate limit exceeded for {client_id}",
                extra={"path": request.url.path, "method": request.method}
            )
            raise HTTPException(
                status_code=429,
                detail="Rate limit exceeded. Please try again later.",
                headers={
                    "Retry-After": str(self.period),
                    "X-RateLimit-Limit": str(self.calls),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(int(time.time()) + self.period)
                }
            )
            
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        remaining = await self._get_remaining_calls(client_id)
        response.headers["X-RateLimit-Limit"] = str(self.calls)
        response.headers["X-RateLimit-Remaining"] = str(remaining)
        
        return response
        
    def _get_client_id(self, request: Request) -> str:
        """
        Generate client identifier for rate limiting
        """
        # Use API key if available, otherwise IP
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            return f"api_key:{auth_header[7:10]}..."  # First 3 chars of key
        
        # Use IP address with forwarded headers consideration
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return f"ip:{forwarded_for.split(',')[0].strip()}"
        
        return f"ip:{request.client.host}"
        
    async def _is_rate_limited(self, client_id: str, request: Request) -> bool:
        """
        Sliding window rate limiting implementation
        """
        current_time = time.time()
        window_start = current_time - self.period
        
        if self.redis_client:
            return await self._redis_rate_limit(client_id, current_time, window_start)
        else:
            return await self._memory_rate_limit(client_id, current_time, window_start)
            
    async def _redis_rate_limit(self, client_id: str, current_time: float, window_start: float) -> bool:
        """Redis-based distributed rate limiting"""
        key = f"rate_limit:{client_id}"
        
        try:
            # Use Redis sorted set for sliding window
            pipe = self.redis_client.pipeline()
            
            # Remove old entries
            pipe.zremrangebyscore(key, 0, window_start)
            
            # Count current entries
            pipe.zcard(key)
            
            # Add current request
            pipe.zadd(key, {str(current_time): current_time})
            
            # Set expiration
            pipe.expire(key, self.period)
            
            results = await pipe.execute()
            current_count = results[1]
            
            return current_count >= self.calls
            
        except Exception as e:
            logger.error(f"Redis rate limiting error: {e}")
            return False  # Fail open
```

## 🗄️ Database Architecture & Design

### MongoDB Schema Design
```python
# app/models/schemas.py
"""
Comprehensive MongoDB schema definitions for legal case system
"""

from typing import List, Dict, Any, Optional, Union
from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field, validator
from bson import ObjectId

class PyObjectId(ObjectId):
    """Custom ObjectId type for Pydantic models"""
    
    @classmethod
    def __get_validators__(cls):
        yield cls.validate
        
    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)
        
    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class CaseType(str, Enum):
    """Legal case type enumeration"""
    CIVIL = "civil"
    CRIMINAL = "criminal"
    ADMINISTRATIVE = "administrative"
    CONSTITUTIONAL = "constitutional"
    COMMERCIAL = "commercial"
    FAMILY = "family"
    TAX = "tax"
    LABOR = "labor"
    PROPERTY = "property"
    OTHER = "other"

class DocumentProcessingStatus(str, Enum):
    """Document processing pipeline status"""
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    OCR_COMPLETE = "ocr_complete"
    EMBEDDING_COMPLETE = "embedding_complete"
    INDEXED = "indexed"
    FAILED = "failed"
    ARCHIVED = "archived"

class LegalCaseMetadata(BaseModel):
    """Comprehensive legal case metadata schema"""
    
    # Case identification
    case_number: Optional[str] = Field(None, description="Official case number")
    title: str = Field(..., description="Case title or name")
    court: Optional[str] = Field(None, description="Court name")
    jurisdiction: Optional[str] = Field(None, description="Legal jurisdiction")
    
    # Case details
    case_type: CaseType = Field(CaseType.OTHER, description="Type of legal case")
    date_filed: Optional[datetime] = Field(None, description="Case filing date")
    date_decided: Optional[datetime] = Field(None, description="Decision date")
    
    # Parties involved
    plaintiffs: List[str] = Field(default_factory=list, description="Plaintiff names")
    defendants: List[str] = Field(default_factory=list, description="Defendant names")
    judges: List[str] = Field(default_factory=list, description="Judge names")
    attorneys: List[str] = Field(default_factory=list, description="Attorney names")
    
    # Legal concepts
    legal_issues: List[str] = Field(default_factory=list, description="Key legal issues")
    citations: List[str] = Field(default_factory=list, description="Legal citations")
    precedents: List[str] = Field(default_factory=list, description="Referenced precedents")
    statutes: List[str] = Field(default_factory=list, description="Relevant statutes")
    
    # Document properties
    page_count: Optional[int] = Field(None, description="Number of pages")
    word_count: Optional[int] = Field(None, description="Word count")
    language: str = Field("en", description="Document language")
    
    # Quality metrics
    ocr_confidence: Optional[float] = Field(None, ge=0, le=1, description="OCR confidence score")
    embedding_quality: Optional[float] = Field(None, ge=0, le=1, description="Embedding quality score")
    
    class Config:
        use_enum_values = True
        json_encoders = {ObjectId: str}

class DocumentSection(BaseModel):
    """Document section schema for structured content"""
    
    section_id: str = Field(..., description="Unique section identifier")
    section_type: str = Field(..., description="Type of section (facts, holding, etc.)")
    title: Optional[str] = Field(None, description="Section title")
    content: str = Field(..., description="Section content")
    page_numbers: List[int] = Field(default_factory=list, description="Page numbers")
    start_position: Optional[int] = Field(None, description="Character start position")
    end_position: Optional[int] = Field(None, description="Character end position")
    confidence_score: Optional[float] = Field(None, ge=0, le=1, description="Section extraction confidence")

class LegalCaseDocument(BaseModel):
    """Complete legal case document schema"""
    
    # Document identification
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    case_id: str = Field(..., description="Unique case identifier")
    document_hash: str = Field(..., description="SHA-256 hash of original document")
    
    # Document content
    title: str = Field(..., description="Document title")
    content: str = Field(..., description="Full document content")
    cleaned_content: str = Field(..., description="Cleaned and preprocessed content")
    
    # Document structure
    sections: Dict[str, DocumentSection] = Field(
        default_factory=dict, 
        description="Structured document sections"
    )
    
    # Metadata
    metadata: LegalCaseMetadata = Field(..., description="Case metadata")
    
    # Processing information
    processing_status: DocumentProcessingStatus = Field(
        DocumentProcessingStatus.UPLOADED,
        description="Current processing status"
    )
    processing_log: List[Dict[str, Any]] = Field(
        default_factory=list,
        description="Processing step log"
    )
    
    # File information
    original_filename: str = Field(..., description="Original file name")
    file_size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type")
    
    # Embedding information
    embedding_model: Optional[str] = Field(None, description="Model used for embeddings")
    embedding_dimension: Optional[int] = Field(None, description="Embedding vector dimension")
    faiss_index_position: Optional[int] = Field(None, description="Position in FAISS index")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Creation timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    processed_at: Optional[datetime] = Field(None, description="Processing completion timestamp")
    
    # Search and analytics
    search_count: int = Field(0, description="Number of times retrieved in searches")
    last_accessed: Optional[datetime] = Field(None, description="Last access timestamp")
    
    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str, datetime: lambda dt: dt.isoformat()}
        
    @validator('updated_at', pre=True, always=True)
    def set_updated_at(cls, v):
        return datetime.utcnow()

class ChatSession(BaseModel):
    """Chat session schema for conversation management"""
    
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    session_id: str = Field(..., description="Unique session identifier")
    user_id: Optional[str] = Field(None, description="User identifier")
    
    # Session metadata
    title: Optional[str] = Field(None, description="Session title")
    description: Optional[str] = Field(None, description="Session description")
    
    # Conversation data
    messages: List[Dict[str, Any]] = Field(default_factory=list, description="Chat messages")
    context_cases: List[str] = Field(default_factory=list, description="Referenced case IDs")
    
    # Session state
    is_active: bool = Field(True, description="Session active status")
    total_messages: int = Field(0, description="Total message count")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_activity: datetime = Field(default_factory=datetime.utcnow)
    
    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str, datetime: lambda dt: dt.isoformat()}
```

### Database Connection Management
```python
# app/config/database.py
"""
Production-grade MongoDB connection management
"""

import asyncio
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo.errors import ServerSelectionTimeoutError, ConfigurationError
import certifi
from app.config.settings import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)

class DatabaseManager:
    """
    Singleton database manager with connection pooling and health monitoring
    """
    
    _instance = None
    _client: Optional[AsyncIOMotorClient] = None
    _database: Optional[AsyncIOMotorDatabase] = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
        return cls._instance
    
    async def connect(self) -> None:
        """
        Establish database connection with production configuration
        """
        try:
            # MongoDB connection with production settings
            self._client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                maxPoolSize=50,  # Maximum connections in pool
                minPoolSize=10,  # Minimum connections in pool
                maxIdleTimeMS=30000,  # 30 seconds idle timeout
                serverSelectionTimeoutMS=5000,  # 5 seconds selection timeout
                socketTimeoutMS=20000,  # 20 seconds socket timeout
                connectTimeoutMS=10000,  # 10 seconds connection timeout
                retryWrites=True,  # Enable retry writes
                w="majority",  # Write concern
                tlsCAFile=certifi.where() if settings.MONGODB_TLS_ENABLED else None,
            )
            
            # Verify connection
            await self._client.admin.command('ping')
            
            # Get database
            self._database = self._client[settings.MONGODB_DB_NAME]
            
            # Create indexes
            await self._create_indexes()
            
            logger.info(f"✅ Connected to MongoDB: {settings.MONGODB_DB_NAME}")
            
        except ServerSelectionTimeoutError:
            logger.error("❌ MongoDB connection timeout")
            raise
        except ConfigurationError as e:
            logger.error(f"❌ MongoDB configuration error: {e}")
            raise
        except Exception as e:
            logger.error(f"❌ Unexpected MongoDB connection error: {e}")
            raise
    
    async def _create_indexes(self) -> None:
        """
        Create optimized indexes for production performance
        """
        try:
            # Cases collection indexes
            cases_collection = self._database[settings.MONGODB_COLLECTION_CASES]
            
            # Core search indexes
            await cases_collection.create_index("case_id", unique=True)
            await cases_collection.create_index("document_hash", unique=True)
            
            # Text search index
            await cases_collection.create_index([
                ("title", "text"),
                ("content", "text"),
                ("cleaned_content", "text"),
                ("metadata.legal_issues", "text"),
                ("metadata.citations", "text")
            ])
            
            # Metadata search indexes
            await cases_collection.create_index("metadata.case_type")
            await cases_collection.create_index("metadata.court")
            await cases_collection.create_index("metadata.jurisdiction")
            await cases_collection.create_index("metadata.date_filed")
            await cases_collection.create_index("metadata.date_decided")
            
            # Performance indexes
            await cases_collection.create_index("processing_status")
            await cases_collection.create_index("created_at")
            await cases_collection.create_index("search_count")
            await cases_collection.create_index("last_accessed")
            
            # Compound indexes for common queries
            await cases_collection.create_index([
                ("metadata.case_type", 1),
                ("metadata.court", 1),
                ("created_at", -1)
            ])
            
            # Chat sessions collection indexes
            chat_collection = self._database[settings.MONGODB_COLLECTION_CHAT_HISTORY]
            await chat_collection.create_index("session_id", unique=True)
            await chat_collection.create_index("user_id")
            await chat_collection.create_index("created_at")
            await chat_collection.create_index("last_activity")
            await chat_collection.create_index("is_active")
            
            logger.info("✅ Database indexes created successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to create indexes: {e}")
            raise
    
    async def close(self) -> None:
        """Close database connection"""
        if self._client:
            self._client.close()
            logger.info("✅ Database connection closed")
    
    @property
    def client(self) -> AsyncIOMotorClient:
        """Get MongoDB client"""
        if not self._client:
            raise RuntimeError("Database not connected")
        return self._client
    
    @property
    def database(self) -> AsyncIOMotorDatabase:
        """Get database instance"""
        if not self._database:
            raise RuntimeError("Database not connected")
        return self._database
    
    def get_collection(self, collection_name: str):
        """Get collection instance"""
        return self.database[collection_name]
    
    def get_cases_collection(self):
        """Get cases collection"""
        return self.get_collection(settings.MONGODB_COLLECTION_CASES)
    
    def get_chat_collection(self):
        """Get chat sessions collection"""
        return self.get_collection(settings.MONGODB_COLLECTION_CHAT_HISTORY)
    
    async def health_check(self) -> Dict[str, Any]:
        """
        Comprehensive database health check
        """
        try:
            # Basic connectivity
            await self._client.admin.command('ping')
            
            # Get server info
            server_info = await self._client.admin.command('buildInfo')
            
            # Get database stats
            db_stats = await self._database.command('dbStats')
            
            # Collection counts
            cases_count = await self.get_cases_collection().count_documents({})
            chat_count = await self.get_chat_collection().count_documents({})
            
            return {
                "status": "healthy",
                "mongodb_version": server_info.get("version"),
                "database_name": self._database.name,
                "database_size_mb": round(db_stats.get("dataSize", 0) / 1024 / 1024, 2),
                "collections": {
                    "cases": cases_count,
                    "chat_sessions": chat_count
                }
            }
            
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }

# Global database manager instance
db_manager = DatabaseManager()

async def init_database():
    """Initialize database connection"""
    await db_manager.connect()

async def close_database():
    """Close database connection"""
    await db_manager.close()

async def check_database_health():
    """Check database health"""
    return await db_manager.health_check()
```

## 🔄 API Design & Service Architecture

### Service Layer Implementation
```python
# app/services/base_service.py
"""
Base service class with common functionality
"""

import asyncio
import time
from typing import Any, Dict, List, Optional, Union
from abc import ABC, abstractmethod
from dataclasses import dataclass
from app.utils.logger import get_logger
from app.config.database import db_manager

logger = get_logger(__name__)

@dataclass
class ServiceResult:
    """Standardized service result container"""
    success: bool
    data: Any = None
    error: Optional[str] = None
    metadata: Dict[str, Any] = None
    execution_time: Optional[float] = None

class BaseService(ABC):
    """
    Base service class with common patterns and utilities
    """
    
    def __init__(self):
        self.db = db_manager
        self.logger = get_logger(self.__class__.__name__)
        
    async def execute_with_timing(self, operation_name: str, func, *args, **kwargs) -> ServiceResult:
        """
        Execute operation with timing and error handling
        """
        start_time = time.time()
        
        try:
            self.logger.info(f"Starting operation: {operation_name}")
            
            result = await func(*args, **kwargs)
            execution_time = time.time() - start_time
            
            self.logger.info(
                f"Operation completed: {operation_name}",
                extra={"execution_time": execution_time}
            )
            
            return ServiceResult(
                success=True,
                data=result,
                execution_time=execution_time,
                metadata={"operation": operation_name}
            )
            
        except Exception as e:
            execution_time = time.time() - start_time
            
            self.logger.error(
                f"Operation failed: {operation_name}",
                exc_info=True,
                extra={"execution_time": execution_time}
            )
            
            return ServiceResult(
                success=False,
                error=str(e),
                execution_time=execution_time,
                metadata={"operation": operation_name}
            )
    
    async def batch_process(self, items: List[Any], process_func, 
                          batch_size: int = 10, max_concurrent: int = 5) -> List[ServiceResult]:
        """
        Process items in batches with concurrency control
        """
        results = []
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def process_item(item):
            async with semaphore:
                return await process_func(item)
        
        # Process in batches
        for i in range(0, len(items), batch_size):
            batch = items[i:i + batch_size]
            
            # Create tasks for current batch
            tasks = [process_item(item) for item in batch]
            
            # Execute batch concurrently
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            # Handle results and exceptions
            for item, result in zip(batch, batch_results):
                if isinstance(result, Exception):
                    results.append(ServiceResult(
                        success=False,
                        error=str(result),
                        metadata={"item": str(item)}
                    ))
                else:
                    results.append(result)
        
        return results
    
    @abstractmethod
    async def health_check(self) -> Dict[str, Any]:
        """Service-specific health check"""
        pass
```

### Advanced API Route Implementation
```python
# app/api/routes/ingestion.py
"""
Advanced document ingestion API with comprehensive features
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks, Depends
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any
import asyncio
import hashlib
import tempfile
import os
from datetime import datetime

from app.services.pdf_processor import PDFProcessorService
from app.services.embedding_service import EmbeddingService
from app.models.schemas import LegalCaseDocument, DocumentProcessingStatus
from app.models.request_models import DocumentUploadRequest, BatchProcessingRequest
from app.models.response_models import (
    DocumentUploadResponse,
    BatchProcessingResponse,
    ProcessingStatusResponse
)
from app.utils.validation import validate_file, validate_batch_request
from app.utils.rate_limiting import RateLimit
from app.config.settings import settings
from app.utils.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

# Service instances
pdf_processor = PDFProcessorService()
embedding_service = EmbeddingService()

@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="PDF document to upload"),
    title: Optional[str] = Form(None, description="Document title"),
    case_type: Optional[str] = Form(None, description="Type of legal case"),
    court: Optional[str] = Form(None, description="Court name"),
    jurisdiction: Optional[str] = Form(None, description="Legal jurisdiction"),
    process_immediately: bool = Form(True, description="Process document immediately"),
    extract_metadata: bool = Form(True, description="Extract legal metadata"),
    generate_summary: bool = Form(False, description="Generate document summary"),
    rate_limit: RateLimit = Depends(RateLimit(max_calls=10, window=60))
):
    """
    Upload and process a legal document with comprehensive options
    
    Features:
    - File validation and security checks
    - Duplicate detection
    - Background processing
    - Metadata extraction
    - Vector embedding generation
    """
    
    operation_id = f"upload_{int(datetime.utcnow().timestamp())}"
    
    try:
        # Validate uploaded file
        validation_result = await validate_file(file)
        if not validation_result.is_valid:
            raise HTTPException(
                status_code=400,
                detail=f"File validation failed: {validation_result.error}"
            )
        
        # Generate file hash for duplicate detection
        file_content = await file.read()
        file_hash = hashlib.sha256(file_content).hexdigest()
        
        # Check for duplicates
        existing_doc = await pdf_processor.check_duplicate(file_hash)
        if existing_doc:
            logger.info(f"Duplicate document detected: {file_hash}")
            return DocumentUploadResponse(
                success=True,
                case_id=existing_doc["case_id"],
                message="Document already exists",
                duplicate=True,
                processing_status=existing_doc["processing_status"]
            )
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as temp_file:
            temp_file.write(file_content)
            temp_file_path = temp_file.name
        
        # Create document record
        document_data = {
            "original_filename": file.filename,
            "file_size": len(file_content),
            "mime_type": file.content_type,
            "document_hash": file_hash,
            "title": title or file.filename,
            "metadata": {
                "case_type": case_type,
                "court": court,
                "jurisdiction": jurisdiction
            },
            "processing_status": DocumentProcessingStatus.UPLOADED
        }
        
        # Save initial document record
        case_id = await pdf_processor.create_document_record(document_data)
        
        # Schedule background processing
        if process_immediately:
            background_tasks.add_task(
                process_document_pipeline,
                case_id,
                temp_file_path,
                extract_metadata,
                generate_summary
            )
            
            processing_status = DocumentProcessingStatus.PROCESSING
        else:
            processing_status = DocumentProcessingStatus.UPLOADED
        
        logger.info(
            f"Document uploaded successfully: {case_id}",
            extra={
                "operation_id": operation_id,
                "filename": file.filename,
                "file_size": len(file_content),
                "case_id": case_id
            }
        )
        
        return DocumentUploadResponse(
            success=True,
            case_id=case_id,
            message="Document uploaded successfully",
            file_size=len(file_content),
            processing_status=processing_status,
            estimated_processing_time=_estimate_processing_time(len(file_content))
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"Document upload failed",
            exc_info=True,
            extra={"operation_id": operation_id, "filename": file.filename}
        )
        
        # Clean up temporary file
        if 'temp_file_path' in locals():
            try:
                os.unlink(temp_file_path)
            except:
                pass
        
        raise HTTPException(
            status_code=500,
            detail=f"Document upload failed: {str(e)}"
        )

async def process_document_pipeline(
    case_id: str,
    file_path: str,
    extract_metadata: bool = True,
    generate_summary: bool = False
):
    """
    Comprehensive document processing pipeline
    """
    try:
        # Update status
        await pdf_processor.update_processing_status(
            case_id, 
            DocumentProcessingStatus.PROCESSING
        )
        
        # Step 1: OCR and text extraction
        logger.info(f"Starting OCR processing for {case_id}")
        text_result = await pdf_processor.extract_text_and_structure(file_path)
        
        if not text_result.success:
            raise Exception(f"OCR processing failed: {text_result.error}")
        
        await pdf_processor.update_processing_status(
            case_id,
            DocumentProcessingStatus.OCR_COMPLETE
        )
        
        # Step 2: Metadata extraction
        if extract_metadata:
            logger.info(f"Extracting metadata for {case_id}")
            metadata_result = await pdf_processor.extract_legal_metadata(
                text_result.data["cleaned_text"]
            )
            
            if metadata_result.success:
                await pdf_processor.update_document_metadata(
                    case_id,
                    metadata_result.data
                )
        
        # Step 3: Generate embeddings
        logger.info(f"Generating embeddings for {case_id}")
        embedding_result = await embedding_service.generate_and_store_embedding(
            case_id,
            text_result.data["cleaned_text"]
        )
        
        if not embedding_result.success:
            raise Exception(f"Embedding generation failed: {embedding_result.error}")
        
        await pdf_processor.update_processing_status(
            case_id,
            DocumentProcessingStatus.EMBEDDING_COMPLETE
        )
        
        # Step 4: Add to search index
        logger.info(f"Adding to search index: {case_id}")
        index_result = await embedding_service.add_to_faiss_index(
            case_id,
            embedding_result.data["embedding"]
        )
        
        if not index_result.success:
            raise Exception(f"Index addition failed: {index_result.error}")
        
        # Step 5: Generate summary (if requested)
        if generate_summary:
            logger.info(f"Generating summary for {case_id}")
            # Summary generation implementation
            pass
        
        # Final status update
        await pdf_processor.update_processing_status(
            case_id,
            DocumentProcessingStatus.INDEXED,
            processing_completed_at=datetime.utcnow()
        )
        
        logger.info(f"Document processing completed successfully: {case_id}")
        
    except Exception as e:
        logger.error(
            f"Document processing failed for {case_id}",
            exc_info=True
        )
        
        await pdf_processor.update_processing_status(
            case_id,
            DocumentProcessingStatus.FAILED,
            error_message=str(e)
        )
    
    finally:
        # Clean up temporary file
        try:
            os.unlink(file_path)
        except:
            pass

def _estimate_processing_time(file_size: int) -> int:
    """
    Estimate processing time based on file size
    """
    # Rough estimation: 1MB takes ~30 seconds
    mb_size = file_size / (1024 * 1024)
    estimated_seconds = max(30, int(mb_size * 30))
    return min(estimated_seconds, 600)  # Cap at 10 minutes
```

## 📊 Performance Optimization & Monitoring

### Connection Pooling & Resource Management
```python
# app/utils/connection_pool.py
"""
Advanced connection pooling and resource management
"""

import asyncio
import time
from typing import Dict, Any, Optional, List
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from app.utils.logger import get_logger

logger = get_logger(__name__)

@dataclass
class PoolStats:
    """Connection pool statistics"""
    total_connections: int = 0
    active_connections: int = 0
    idle_connections: int = 0
    peak_connections: int = 0
    total_requests: int = 0
    failed_requests: int = 0
    average_response_time: float = 0.0
    created_at: float = field(default_factory=time.time)

class ConnectionPool:
    """
    Generic connection pool implementation
    """
    
    def __init__(self, 
                 create_connection_func,
                 max_connections: int = 50,
                 min_connections: int = 5,
                 max_idle_time: int = 300,
                 health_check_interval: int = 60):
        
        self.create_connection = create_connection_func
        self.max_connections = max_connections
        self.min_connections = min_connections
        self.max_idle_time = max_idle_time
        self.health_check_interval = health_check_interval
        
        self._pool: List[Dict[str, Any]] = []
        self._active_connections: Dict[int, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()
        self._stats = PoolStats()
        self._health_check_task = None
        
    async def initialize(self):
        """Initialize connection pool with minimum connections"""
        async with self._lock:
            for _ in range(self.min_connections):
                try:
                    connection = await self.create_connection()
                    self._pool.append({
                        'connection': connection,
                        'created_at': time.time(),
                        'last_used': time.time(),
                        'usage_count': 0
                    })
                    self._stats.total_connections += 1
                except Exception as e:
                    logger.error(f"Failed to create initial connection: {e}")
        
        # Start health check task
        self._health_check_task = asyncio.create_task(self._health_check_loop())
        logger.info(f"Connection pool initialized with {len(self._pool)} connections")
    
    @asynccontextmanager
    async def get_connection(self):
        """Get connection from pool with automatic return"""
        connection_data = await self._acquire_connection()
        
        try:
            yield connection_data['connection']
            # Connection used successfully
            connection_data['last_used'] = time.time()
            connection_data['usage_count'] += 1
            
        finally:
            await self._release_connection(connection_data)
    
    async def _acquire_connection(self) -> Dict[str, Any]:
        """Acquire connection from pool"""
        start_time = time.time()
        
        async with self._lock:
            # Try to get from pool
            if self._pool:
                connection_data = self._pool.pop()
                connection_id = id(connection_data['connection'])
                self._active_connections[connection_id] = connection_data
                self._stats.active_connections += 1
                self._stats.idle_connections = len(self._pool)
                return connection_data
            
            # Create new connection if under limit
            if self._stats.total_connections < self.max_connections:
                try:
                    connection = await self.create_connection()
                    connection_data = {
                        'connection': connection,
                        'created_at': time.time(),
                        'last_used': time.time(),
                        'usage_count': 0
                    }
                    
                    connection_id = id(connection)
                    self._active_connections[connection_id] = connection_data
                    
                    self._stats.total_connections += 1
                    self._stats.active_connections += 1
                    
                    if self._stats.total_connections > self._stats.peak_connections:
                        self._stats.peak_connections = self._stats.total_connections
                    
                    return connection_data
                    
                except Exception as e:
                    self._stats.failed_requests += 1
                    logger.error(f"Failed to create new connection: {e}")
                    raise
        
        # Pool exhausted
        self._stats.failed_requests += 1
        raise RuntimeError("Connection pool exhausted")
    
    async def _release_connection(self, connection_data: Dict[str, Any]):
        """Release connection back to pool"""
        async with self._lock:
            connection_id = id(connection_data['connection'])
            
            if connection_id in self._active_connections:
                del self._active_connections[connection_id]
                self._stats.active_connections -= 1
                
                # Check if connection is still healthy
                if await self._is_connection_healthy(connection_data['connection']):
                    self._pool.append(connection_data)
                    self._stats.idle_connections = len(self._pool)
                else:
                    # Connection unhealthy, discard it
                    self._stats.total_connections -= 1
                    await self._close_connection(connection_data['connection'])
    
    async def _health_check_loop(self):
        """Periodic health check and cleanup"""
        while True:
            try:
                await asyncio.sleep(self.health_check_interval)
                await self._cleanup_idle_connections()
                await self._ensure_minimum_connections()
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Health check failed: {e}")
    
    async def _cleanup_idle_connections(self):
        """Remove idle connections that exceed max idle time"""
        current_time = time.time()
        
        async with self._lock:
            healthy_connections = []
            
            for conn_data in self._pool:
                idle_time = current_time - conn_data['last_used']
                
                if idle_time > self.max_idle_time or not await self._is_connection_healthy(conn_data['connection']):
                    await self._close_connection(conn_data['connection'])
                    self._stats.total_connections -= 1
                else:
                    healthy_connections.append(conn_data)
            
            self._pool = healthy_connections
            self._stats.idle_connections = len(self._pool)
    
    async def get_stats(self) -> PoolStats:
        """Get current pool statistics"""
        return self._stats
    
    async def close(self):
        """Close all connections and cleanup"""
        if self._health_check_task:
            self._health_check_task.cancel()
        
        async with self._lock:
            # Close all idle connections
            for conn_data in self._pool:
                await self._close_connection(conn_data['connection'])
            
            # Close all active connections
            for conn_data in self._active_connections.values():
                await self._close_connection(conn_data['connection'])
            
            self._pool.clear()
            self._active_connections.clear()
            self._stats.total_connections = 0
            self._stats.active_connections = 0
            self._stats.idle_connections = 0
```

---

## 🔗 Next Steps

This phase covered the complete backend engineering architecture. Continue to:

- **[Phase 4: Frontend Development](./Phase-4-Frontend-Development.md)** - Explore the React frontend
- **[Phase 5: DevOps & Deployment](./Phase-5-DevOps-Deployment.md)** - Learn deployment strategies
- **[Phase 6: Complete Workflows](./Phase-6-Complete-Workflows.md)** - See end-to-end system operation

---

*This documentation provides comprehensive coverage of the backend engineering patterns, database design, and production-ready implementation strategies.*
