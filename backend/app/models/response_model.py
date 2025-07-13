"""
Pydantic models for API responses
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
from enum import Enum

class ResponseStatus(str, Enum):
    """Response status enumeration"""
    SUCCESS = "success"
    ERROR = "error"
    PARTIAL = "partial"
    PROCESSING = "processing"

class BaseResponse(BaseModel):
    """Base response model"""
    status: ResponseStatus
    message: str = Field(default="", description="Response message")
    timestamp: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ErrorResponse(BaseResponse):
    """Error response model"""
    status: ResponseStatus = ResponseStatus.ERROR
    error_code: Optional[str] = None
    error_details: Optional[Dict[str, Any]] = None

class CaseSearchResponse(BaseResponse):
    """Case search response model"""
    status: ResponseStatus = ResponseStatus.SUCCESS
    results: List[Dict[str, Any]] = Field(default_factory=list)
    total_found: int = 0
    query_time_ms: float = 0.0
    search_metadata: Optional[Dict[str, Any]] = None

class SummarizationResponse(BaseResponse):
    """Summarization response model"""
    status: ResponseStatus = ResponseStatus.SUCCESS
    summary: str = ""
    summary_type: str = "hybrid"
    length: int = 0
    key_points: List[str] = Field(default_factory=list)
    sources: List[str] = Field(default_factory=list)
    confidence_score: Optional[float] = None

class QuestionGenerationResponse(BaseResponse):
    """Question generation response model"""
    status: ResponseStatus = ResponseStatus.SUCCESS
    questions: List[Dict[str, Any]] = Field(default_factory=list)
    question_type: str = ""
    sources: List[str] = Field(default_factory=list)
    generation_metadata: Optional[Dict[str, Any]] = None

class ChatResponse(BaseResponse):
    """Chat response model"""
    status: ResponseStatus = ResponseStatus.SUCCESS
    response: str = ""
    intent: Optional[str] = None
    confidence: Optional[float] = None
    sources: List[Dict[str, Any]] = Field(default_factory=list)
    follow_up_suggestions: List[str] = Field(default_factory=list)
    session_id: str = ""

class IngestionResponse(BaseResponse):
    """Document ingestion response model"""
    status: ResponseStatus = ResponseStatus.SUCCESS
    case_id: str = ""
    filename: str = ""
    pages_processed: int = 0
    metadata_extracted: bool = False
    embedding_generated: bool = False
    processing_time_ms: float = 0.0

class BatchProcessingResponse(BaseResponse):
    """Batch processing response model"""
    status: ResponseStatus = ResponseStatus.SUCCESS
    total_files: int = 0
    processed_files: int = 0
    failed_files: int = 0
    skipped_files: int = 0
    processing_time_ms: float = 0.0
    failed_file_details: List[Dict[str, str]] = Field(default_factory=list)

class HealthResponse(BaseResponse):
    """Health check response model"""
    status: ResponseStatus = ResponseStatus.SUCCESS
    service_name: str = "Legal Case Analysis System"
    version: str = "1.0.0"
    uptime_seconds: float = 0.0
    database_status: str = "unknown"
    faiss_status: str = "unknown"
    model_status: str = "unknown"

class MetricsResponse(BaseResponse):
    """Metrics response model"""
    status: ResponseStatus = ResponseStatus.SUCCESS
    total_cases: int = 0
    total_queries: int = 0
    average_response_time_ms: float = 0.0
    cache_hit_rate: float = 0.0
    error_rate: float = 0.0
    system_metrics: Dict[str, Any] = Field(default_factory=dict)

class ValidationResponse(BaseResponse):
    """Validation response model"""
    status: ResponseStatus = ResponseStatus.SUCCESS
    is_valid: bool = True
    validation_errors: List[str] = Field(default_factory=list)
    suggestions: List[str] = Field(default_factory=list)
