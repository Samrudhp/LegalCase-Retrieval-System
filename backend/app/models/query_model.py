"""
Pydantic models for user queries and requests
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum

class QueryType(str, Enum):
    """Types of queries supported"""
    TEXT = "text"
    PDF_UPLOAD = "pdf_upload"
    CASE_ID = "case_id"

class SummaryLength(str, Enum):
    """Summary length options"""
    SHORT = "100"
    MEDIUM = "300"
    LONG = "500"

class QuestionType(str, Enum):
    """Types of questions to generate"""
    COMMON = "common"
    RARE = "rare"
    UNEXPECTED = "unexpected"

class TextQuery(BaseModel):
    """Text-based query model"""
    query: str = Field(..., description="Text query for case search")
    limit: int = Field(default=5, ge=1, le=20, description="Number of results to return")
    filters: Optional[Dict[str, Any]] = Field(default=None, description="Additional filters")

class CaseSearchQuery(BaseModel):
    """Case search query model"""
    query_type: QueryType
    text_query: Optional[str] = None
    case_id: Optional[str] = None
    limit: int = Field(default=5, ge=1, le=20)
    filters: Optional[Dict[str, Any]] = None
    include_metadata: bool = Field(default=True, description="Include metadata in results")
    include_sections: bool = Field(default=False, description="Include document sections")

class SummarizationRequest(BaseModel):
    """Summarization request model"""
    case_ids: Optional[List[str]] = None
    text_content: Optional[str] = None
    length: SummaryLength = SummaryLength.MEDIUM
    focus_areas: Optional[List[str]] = Field(default=None, description="Specific areas to focus on")
    extractive: bool = Field(default=True, description="Use extractive summarization")
    abstractive: bool = Field(default=True, description="Use abstractive summarization")

class QuestionGenerationRequest(BaseModel):
    """Question generation request model"""
    case_ids: Optional[List[str]] = None
    text_content: Optional[str] = None
    question_type: QuestionType = QuestionType.COMMON
    num_questions: int = Field(default=5, ge=1, le=20)
    focus_areas: Optional[List[str]] = None

class ChatMessage(BaseModel):
    """Chat message model"""
    message: str = Field(..., description="User message")
    session_id: Optional[str] = Field(default=None, description="Chat session ID")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Additional context")
    include_sources: bool = Field(default=True, description="Include source references")

class FileUploadQuery(BaseModel):
    """File upload query model"""
    filename: str
    content_type: str = Field(default="application/pdf")
    process_immediately: bool = Field(default=True, description="Process file immediately")
    extract_metadata: bool = Field(default=True, description="Extract metadata from file")
    generate_summary: bool = Field(default=True, description="Generate summary after processing")

class BatchProcessingRequest(BaseModel):
    """Batch processing request model"""
    file_paths: List[str] = Field(..., description="List of file paths to process")
    batch_size: int = Field(default=100, ge=1, le=1000)
    parallel_workers: int = Field(default=4, ge=1, le=16)
    skip_existing: bool = Field(default=True, description="Skip files already processed")
    update_index: bool = Field(default=True, description="Update FAISS index after processing")
