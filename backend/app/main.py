"""
Legal Case Analysis System - Main FastAPI Application
Handles PDF ingestion, case retrieval, summarization, question generation, and chat functionality.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from contextlib import asynccontextmanager

from app.api.routes import (
    ingestion_router,
    retrieval_router,
    summarization_router,
    question_generation_router,
    chat_router
)
from app.config.settings import settings
from app.config.database import init_database
from app.utils.logger import setup_logger

# Setup logging
logger = setup_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Legal Case Analysis System")
    try:
        await init_database()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Database initialization failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Legal Case Analysis System")

# Create FastAPI application
app = FastAPI(
    title="Legal Case Analysis System",
    description="API for processing and analyzing legal case documents with AI-powered features",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "Legal Case Analysis System"}

# Include routers
app.include_router(ingestion_router, prefix="/api/v1/ingestion", tags=["Document Ingestion"])
app.include_router(retrieval_router, prefix="/api/v1/retrieval", tags=["Case Retrieval"])
app.include_router(summarization_router, prefix="/api/v1/summarization", tags=["Document Summarization"])
app.include_router(question_generation_router, prefix="/api/v1/questions", tags=["Question Generation"])
app.include_router(chat_router, prefix="/api/v1/chat", tags=["Legal Chat Bot"])

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        workers=settings.API_WORKERS,
        log_level="info"
    )
