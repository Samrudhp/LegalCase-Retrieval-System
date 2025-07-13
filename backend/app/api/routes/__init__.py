"""
API routes package - imports all routers for main.py
"""

from .ingestion import router as ingestion_router
from .retrieval import router as retrieval_router
from .summarization import router as summarization_router
from .question_generation import router as question_generation_router
from .chat import router as chat_router

__all__ = [
    "ingestion_router",
    "retrieval_router", 
    "summarization_router",
    "question_generation_router",
    "chat_router"
]
