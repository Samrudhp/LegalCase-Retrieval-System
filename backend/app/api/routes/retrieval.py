"""
Case retrieval API routes
"""

from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional, Dict, Any
import time

from app.services.retrieval_service import RetrievalService
from app.models.query_model import CaseSearchQuery, TextQuery
from app.models.response_model import CaseSearchResponse
from app.utils.logger import setup_logger

logger = setup_logger()
router = APIRouter()

# Initialize service
retrieval_service = RetrievalService()

@router.post("/search", response_model=CaseSearchResponse)
async def search_cases(query: CaseSearchQuery):
    """
    Search for similar legal cases
    
    Args:
        query: Search query with parameters
        
    Returns:
        Search results with similar cases
    """
    start_time = time.time()
    
    try:
        if query.query_type == "text" and query.text_query:
            # Text-based similarity search
            results = await retrieval_service.search_similar_cases(
                query_text=query.text_query,
                limit=query.limit,
                filters=query.filters,
                include_metadata=query.include_metadata,
                include_sections=query.include_sections
            )
        
        elif query.query_type == "case_id" and query.case_id:
            # Direct case lookup
            result = await retrieval_service.search_by_case_id(
                case_id=query.case_id,
                include_metadata=query.include_metadata,
                include_sections=query.include_sections
            )
            results = [result] if result else []
        
        else:
            raise HTTPException(
                status_code=400, 
                detail="Invalid query: provide either text_query or case_id"
            )
        
        # Convert results to response format
        formatted_results = []
        for result in results:
            formatted_result = {
                'case_id': result.case_id,
                'title': result.title,
                'summary': result.summary,
                'similarity_score': result.similarity_score,
                'metadata': result.metadata.dict() if query.include_metadata else {},
                'sections': result.sections if query.include_sections else {}
            }
            formatted_results.append(formatted_result)
        
        query_time = (time.time() - start_time) * 1000
        
        return CaseSearchResponse(
            status="success",
            message=f"Found {len(results)} similar cases",
            results=formatted_results,
            total_found=len(results),
            query_time_ms=query_time,
            search_metadata={
                'query_type': query.query_type,
                'filters_applied': bool(query.filters),
                'include_metadata': query.include_metadata,
                'include_sections': query.include_sections
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Case search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/search/text", response_model=CaseSearchResponse)
async def search_cases_by_text(
    q: str = Query(..., description="Search query text"),
    limit: int = Query(5, ge=1, le=20, description="Number of results to return"),
    include_metadata: bool = Query(True, description="Include case metadata"),
    include_sections: bool = Query(False, description="Include document sections"),
    court: Optional[str] = Query(None, description="Filter by court"),
    case_type: Optional[str] = Query(None, description="Filter by case type"),
    date_from: Optional[str] = Query(None, description="Filter by date from (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter by date to (YYYY-MM-DD)")
):
    """
    Search cases by text query with optional filters
    
    Args:
        q: Search query text
        limit: Number of results to return
        include_metadata: Whether to include metadata
        include_sections: Whether to include document sections
        court: Optional court filter
        case_type: Optional case type filter
        date_from: Optional date range start
        date_to: Optional date range end
        
    Returns:
        Search results
    """
    start_time = time.time()
    
    try:
        # Build filters
        filters = {}
        if court:
            filters['metadata.court'] = {'$regex': court, '$options': 'i'}
        if case_type:
            filters['metadata.case_type'] = case_type
        if date_from or date_to:
            date_filter = {}
            if date_from:
                date_filter['$gte'] = date_from
            if date_to:
                date_filter['$lte'] = date_to
            if date_filter:
                filters['metadata.date'] = date_filter
        
        # Search for similar cases
        results = await retrieval_service.search_similar_cases(
            query_text=q,
            limit=limit,
            filters=filters if filters else None,
            include_metadata=include_metadata,
            include_sections=include_sections
        )
        
        # Format results
        formatted_results = []
        for result in results:
            formatted_result = {
                'case_id': result.case_id,
                'title': result.title,
                'summary': result.summary,
                'similarity_score': result.similarity_score,
                'metadata': result.metadata.dict() if include_metadata else {},
                'sections': result.sections if include_sections else {}
            }
            formatted_results.append(formatted_result)
        
        query_time = (time.time() - start_time) * 1000
        
        return CaseSearchResponse(
            status="success",
            message=f"Found {len(results)} similar cases",
            results=formatted_results,
            total_found=len(results),
            query_time_ms=query_time,
            search_metadata={
                'query': q,
                'filters_applied': bool(filters),
                'include_metadata': include_metadata,
                'include_sections': include_sections
            }
        )
    
    except Exception as e:
        logger.error(f"Text search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

@router.get("/case/{case_id}")
async def get_case_by_id(
    case_id: str,
    include_metadata: bool = Query(True, description="Include case metadata"),
    include_sections: bool = Query(False, description="Include document sections")
):
    """
    Get a specific case by its ID
    
    Args:
        case_id: Case identifier
        include_metadata: Whether to include metadata
        include_sections: Whether to include document sections
        
    Returns:
        Case details
    """
    try:
        result = await retrieval_service.search_by_case_id(
            case_id=case_id,
            include_metadata=include_metadata,
            include_sections=include_sections
        )
        
        if not result:
            raise HTTPException(status_code=404, detail=f"Case {case_id} not found")
        
        return {
            "status": "success",
            "case": {
                'case_id': result.case_id,
                'title': result.title,
                'summary': result.summary,
                'metadata': result.metadata.dict() if include_metadata else {},
                'sections': result.sections if include_sections else {}
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get case {case_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve case: {str(e)}")

@router.get("/filter", response_model=CaseSearchResponse)
async def filter_cases(
    court: Optional[str] = Query(None, description="Filter by court"),
    case_type: Optional[str] = Query(None, description="Filter by case type"),
    judge: Optional[str] = Query(None, description="Filter by judge"),
    date_from: Optional[str] = Query(None, description="Filter by date from (YYYY-MM-DD)"),
    date_to: Optional[str] = Query(None, description="Filter by date to (YYYY-MM-DD)"),
    limit: int = Query(20, ge=1, le=100, description="Number of results to return"),
    skip: int = Query(0, ge=0, description="Number of results to skip"),
    include_metadata: bool = Query(True, description="Include case metadata"),
    include_sections: bool = Query(False, description="Include document sections")
):
    """
    Filter cases by metadata fields
    
    Args:
        court: Court name filter
        case_type: Case type filter
        judge: Judge name filter
        date_from: Date range start
        date_to: Date range end
        limit: Number of results to return
        skip: Number of results to skip (pagination)
        include_metadata: Whether to include metadata
        include_sections: Whether to include document sections
        
    Returns:
        Filtered search results
    """
    start_time = time.time()
    
    try:
        # Build filters
        filters = {}
        
        if court:
            filters['metadata.court'] = {'$regex': court, '$options': 'i'}
        
        if case_type:
            filters['metadata.case_type'] = case_type
        
        if judge:
            filters['metadata.judge'] = {'$regex': judge, '$options': 'i'}
        
        if date_from or date_to:
            date_filter = {}
            if date_from:
                date_filter['$gte'] = date_from
            if date_to:
                date_filter['$lte'] = date_to
            if date_filter:
                filters['metadata.date'] = date_filter
        
        if not filters:
            raise HTTPException(status_code=400, detail="At least one filter parameter is required")
        
        # Search with filters
        results = await retrieval_service.search_with_filters(
            filters=filters,
            limit=limit,
            skip=skip,
            include_metadata=include_metadata,
            include_sections=include_sections
        )
        
        # Format results
        formatted_results = []
        for result in results:
            formatted_result = {
                'case_id': result.case_id,
                'title': result.title,
                'summary': result.summary,
                'similarity_score': result.similarity_score,
                'metadata': result.metadata.dict() if include_metadata else {},
                'sections': result.sections if include_sections else {}
            }
            formatted_results.append(formatted_result)
        
        query_time = (time.time() - start_time) * 1000
        
        return CaseSearchResponse(
            status="success",
            message=f"Found {len(results)} cases matching filters",
            results=formatted_results,
            total_found=len(results),
            query_time_ms=query_time,
            search_metadata={
                'filters': filters,
                'pagination': {'limit': limit, 'skip': skip},
                'include_metadata': include_metadata,
                'include_sections': include_sections
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Filter search failed: {e}")
        raise HTTPException(status_code=500, detail=f"Filter search failed: {str(e)}")

@router.get("/stats")
async def get_case_statistics():
    """Get statistics about the case collection"""
    try:
        stats = await retrieval_service.get_case_statistics()
        
        return {
            "status": "success",
            "statistics": stats
        }
    
    except Exception as e:
        logger.error(f"Failed to get case statistics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get statistics")

@router.get("/metadata/courts")
async def get_available_courts():
    """Get list of available courts"""
    try:
        from app.config.database import db_manager
        collection = db_manager.get_cases_collection()
        
        pipeline = [
            {'$group': {'_id': '$metadata.court', 'count': {'$sum': 1}}},
            {'$match': {'_id': {'$ne': None}}},
            {'$sort': {'count': -1}},
            {'$limit': 50}
        ]
        
        courts = await collection.aggregate(pipeline).to_list(length=50)
        
        return {
            "status": "success",
            "courts": [{'name': court['_id'], 'count': court['count']} for court in courts]
        }
    
    except Exception as e:
        logger.error(f"Failed to get available courts: {e}")
        raise HTTPException(status_code=500, detail="Failed to get courts")

@router.get("/metadata/case-types")
async def get_available_case_types():
    """Get list of available case types"""
    try:
        from app.config.database import db_manager
        collection = db_manager.get_cases_collection()
        
        pipeline = [
            {'$group': {'_id': '$metadata.case_type', 'count': {'$sum': 1}}},
            {'$match': {'_id': {'$ne': None}}},
            {'$sort': {'count': -1}},
            {'$limit': 20}
        ]
        
        case_types = await collection.aggregate(pipeline).to_list(length=20)
        
        return {
            "status": "success",
            "case_types": [{'name': ct['_id'], 'count': ct['count']} for ct in case_types]
        }
    
    except Exception as e:
        logger.error(f"Failed to get available case types: {e}")
        raise HTTPException(status_code=500, detail="Failed to get case types")
