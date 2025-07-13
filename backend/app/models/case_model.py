"""
Pydantic models for legal case data
"""

from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
from datetime import datetime

class CaseMetadata(BaseModel):
    """Legal case metadata model"""
    filename: Optional[str] = None
    extraction_date: str = Field(default_factory=lambda: datetime.now().isoformat())
    case_number: Optional[str] = None
    court: Optional[str] = None
    judge: Optional[str] = None
    parties: Dict[str, List[str]] = Field(default_factory=dict)
    date: Optional[str] = None
    case_type: Optional[str] = None
    legal_topics: List[str] = Field(default_factory=list)
    statutes: List[str] = Field(default_factory=list)
    citations: List[str] = Field(default_factory=list)
    attorneys: List[str] = Field(default_factory=list)
    jurisdiction: Optional[str] = None
    document_type: Optional[str] = None
    outcome: Optional[str] = None
    persons: List[str] = Field(default_factory=list)
    organizations: List[str] = Field(default_factory=list)
    locations: List[str] = Field(default_factory=list)
    dates: List[str] = Field(default_factory=list)
    money: List[str] = Field(default_factory=list)
    laws: List[str] = Field(default_factory=list)

class LegalCase(BaseModel):
    """Complete legal case model"""
    case_id: str
    title: str
    content: str
    cleaned_content: str
    summary: Optional[str] = None
    metadata: CaseMetadata
    embedding_vector: Optional[List[float]] = None
    sections: Dict[str, str] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class CaseSearchResult(BaseModel):
    """Search result for case retrieval"""
    case_id: str
    title: str
    summary: Optional[str] = None
    metadata: CaseMetadata
    similarity_score: float
    sections: Dict[str, str] = Field(default_factory=dict)

class CaseCollection(BaseModel):
    """Collection of cases with pagination"""
    cases: List[CaseSearchResult]
    total_count: int
    page: int
    page_size: int
    has_next: bool
