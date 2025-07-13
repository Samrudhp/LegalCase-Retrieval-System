"""
Case retrieval service using FAISS and MongoDB
"""

from typing import List, Dict, Optional, Any, Tuple
import asyncio
from datetime import datetime

from app.services.embedding_service import EmbeddingService
from app.config.database import db_manager
from app.models.case_model import CaseSearchResult, CaseMetadata
from app.utils.logger import setup_logger
from app.config.settings import settings

logger = setup_logger()

class RetrievalService:
    """Service for retrieving similar legal cases using FAISS and MongoDB"""
    
    def __init__(self):
        self.embedding_service = EmbeddingService()
    
    async def search_similar_cases(
        self,
        query_text: str,
        limit: int = 5,
        filters: Optional[Dict[str, Any]] = None,
        include_metadata: bool = True,
        include_sections: bool = False
    ) -> List[CaseSearchResult]:
        """
        Search for similar cases based on query text
        
        Args:
            query_text: Text query for similarity search
            limit: Maximum number of results to return
            filters: Optional filters for MongoDB query
            include_metadata: Whether to include metadata in results
            include_sections: Whether to include document sections
            
        Returns:
            List of similar cases with similarity scores
        """
        try:
            start_time = datetime.now()
            
            # Generate embedding for query
            query_embedding = await self.embedding_service.generate_embedding(query_text)
            
            # Search FAISS for similar cases
            similar_cases = await self.embedding_service.search_similar(query_embedding, limit * 2)
            
            if not similar_cases:
                logger.info("No similar cases found in FAISS index")
                return []
            
            # Get case IDs and scores
            case_ids = [case_id for case_id, _ in similar_cases]
            scores_dict = {case_id: score for case_id, score in similar_cases}
            
            # Retrieve case details from MongoDB
            cases_data = await self._get_cases_from_mongodb(
                case_ids, 
                filters, 
                include_metadata, 
                include_sections
            )
            
            # Create search results with scores
            results = []
            for case_data in cases_data:
                case_id = case_data.get('case_id')
                if case_id in scores_dict:
                    # Create metadata object
                    metadata = CaseMetadata(**case_data.get('metadata', {}))
                    
                    # Create search result
                    result = CaseSearchResult(
                        case_id=case_id,
                        title=case_data.get('title', 'Unknown'),
                        summary=case_data.get('summary'),
                        metadata=metadata,
                        similarity_score=scores_dict[case_id],
                        sections=case_data.get('sections', {}) if include_sections else {}
                    )
                    results.append(result)
            
            # Sort by similarity score and limit results
            results.sort(key=lambda x: x.similarity_score, reverse=True)
            results = results[:limit]
            
            elapsed_time = (datetime.now() - start_time).total_seconds()
            logger.info(f"Found {len(results)} similar cases in {elapsed_time:.3f}s")
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to search similar cases: {e}")
            return []
    
    async def search_by_case_id(
        self,
        case_id: str,
        include_metadata: bool = True,
        include_sections: bool = False
    ) -> Optional[CaseSearchResult]:
        """
        Retrieve a specific case by its ID
        
        Args:
            case_id: Case identifier
            include_metadata: Whether to include metadata
            include_sections: Whether to include document sections
            
        Returns:
            Case data if found, None otherwise
        """
        try:
            cases_data = await self._get_cases_from_mongodb(
                [case_id], 
                None, 
                include_metadata, 
                include_sections
            )
            
            if not cases_data:
                return None
            
            case_data = cases_data[0]
            metadata = CaseMetadata(**case_data.get('metadata', {}))
            
            result = CaseSearchResult(
                case_id=case_id,
                title=case_data.get('title', 'Unknown'),
                summary=case_data.get('summary'),
                metadata=metadata,
                similarity_score=1.0,  # Perfect match for direct lookup
                sections=case_data.get('sections', {}) if include_sections else {}
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to retrieve case {case_id}: {e}")
            return None
    
    async def search_with_filters(
        self,
        filters: Dict[str, Any],
        limit: int = 20,
        skip: int = 0,
        include_metadata: bool = True,
        include_sections: bool = False
    ) -> List[CaseSearchResult]:
        """
        Search cases using MongoDB filters without similarity scoring
        
        Args:
            filters: MongoDB query filters
            limit: Maximum number of results
            skip: Number of results to skip (for pagination)
            include_metadata: Whether to include metadata
            include_sections: Whether to include document sections
            
        Returns:
            List of matching cases
        """
        try:
            collection = db_manager.get_cases_collection()
            
            # Build projection
            projection = {
                'case_id': 1,
                'title': 1,
                'summary': 1,
                'created_at': 1,
                'updated_at': 1
            }
            
            if include_metadata:
                projection['metadata'] = 1
            
            if include_sections:
                projection['sections'] = 1
            
            # Execute query
            cursor = collection.find(filters, projection).skip(skip).limit(limit)
            cases_data = await cursor.to_list(length=limit)
            
            # Convert to search results
            results = []
            for case_data in cases_data:
                metadata = CaseMetadata(**case_data.get('metadata', {}))
                
                result = CaseSearchResult(
                    case_id=case_data.get('case_id'),
                    title=case_data.get('title', 'Unknown'),
                    summary=case_data.get('summary'),
                    metadata=metadata,
                    similarity_score=0.0,  # No similarity scoring for filter-based search
                    sections=case_data.get('sections', {}) if include_sections else {}
                )
                results.append(result)
            
            logger.info(f"Found {len(results)} cases matching filters")
            return results
            
        except Exception as e:
            logger.error(f"Failed to search with filters: {e}")
            return []
    
    async def _get_cases_from_mongodb(
        self,
        case_ids: List[str],
        filters: Optional[Dict[str, Any]],
        include_metadata: bool,
        include_sections: bool
    ) -> List[Dict[str, Any]]:
        """
        Retrieve case data from MongoDB
        
        Args:
            case_ids: List of case IDs to retrieve
            filters: Additional filters to apply
            include_metadata: Whether to include metadata
            include_sections: Whether to include sections
            
        Returns:
            List of case documents
        """
        try:
            collection = db_manager.get_cases_collection()
            
            # Build query
            query = {'case_id': {'$in': case_ids}}
            if filters:
                query.update(filters)
            
            # Build projection
            projection = {
                'case_id': 1,
                'title': 1,
                'summary': 1,
                'created_at': 1,
                'updated_at': 1,
                '_id': 0  # Exclude MongoDB _id field
            }
            
            if include_metadata:
                projection['metadata'] = 1
            
            if include_sections:
                projection['sections'] = 1
            
            # Execute query
            cursor = collection.find(query, projection)
            cases_data = await cursor.to_list(length=len(case_ids))
            
            # Maintain order based on case_ids input
            ordered_cases = []
            case_data_dict = {case['case_id']: case for case in cases_data}
            
            for case_id in case_ids:
                if case_id in case_data_dict:
                    ordered_cases.append(case_data_dict[case_id])
            
            return ordered_cases
            
        except Exception as e:
            logger.error(f"Failed to retrieve cases from MongoDB: {e}")
            return []
    
    async def get_case_statistics(self) -> Dict[str, Any]:
        """Get statistics about the case collection"""
        try:
            collection = db_manager.get_cases_collection()
            
            # Get total count
            total_cases = await collection.count_documents({})
            
            # Get cases by type
            pipeline = [
                {'$group': {'_id': '$metadata.case_type', 'count': {'$sum': 1}}},
                {'$sort': {'count': -1}}
            ]
            case_types = await collection.aggregate(pipeline).to_list(length=None)
            
            # Get cases by court
            pipeline = [
                {'$group': {'_id': '$metadata.court', 'count': {'$sum': 1}}},
                {'$sort': {'count': -1}},
                {'$limit': 10}
            ]
            courts = await collection.aggregate(pipeline).to_list(length=None)
            
            # Get recent cases
            recent_cases = await collection.count_documents({
                'created_at': {'$gte': datetime.now().replace(day=1)}  # This month
            })
            
            return {
                'total_cases': total_cases,
                'case_types': case_types,
                'top_courts': courts,
                'recent_cases_this_month': recent_cases,
                'faiss_index_stats': self.embedding_service.get_index_stats()
            }
            
        except Exception as e:
            logger.error(f"Failed to get case statistics: {e}")
            return {}
    
    async def find_cases_by_metadata(
        self,
        court: Optional[str] = None,
        case_type: Optional[str] = None,
        date_range: Optional[Tuple[str, str]] = None,
        judge: Optional[str] = None,
        limit: int = 20
    ) -> List[CaseSearchResult]:
        """
        Find cases by metadata fields
        
        Args:
            court: Court name to filter by
            case_type: Case type to filter by
            date_range: Tuple of (start_date, end_date) in ISO format
            judge: Judge name to filter by
            limit: Maximum number of results
            
        Returns:
            List of matching cases
        """
        filters = {}
        
        if court:
            filters['metadata.court'] = {'$regex': court, '$options': 'i'}
        
        if case_type:
            filters['metadata.case_type'] = case_type
        
        if date_range:
            start_date, end_date = date_range
            filters['metadata.date'] = {'$gte': start_date, '$lte': end_date}
        
        if judge:
            filters['metadata.judge'] = {'$regex': judge, '$options': 'i'}
        
        return await self.search_with_filters(
            filters=filters,
            limit=limit,
            include_metadata=True,
            include_sections=False
        )
