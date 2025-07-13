"""
Document ingestion API routes
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form, BackgroundTasks
from typing import List, Optional
import os
import tempfile
import time
from datetime import datetime

from app.services.pdf_processor import PDFProcessor
from app.services.embedding_service import EmbeddingService
from app.models.query_model import BatchProcessingRequest, FileUploadQuery
from app.models.response_model import IngestionResponse, BatchProcessingResponse
from app.config.database import db_manager
from app.utils.logger import setup_logger

logger = setup_logger()
router = APIRouter()

# Initialize services
pdf_processor = PDFProcessor()
embedding_service = EmbeddingService()

@router.post("/upload", response_model=IngestionResponse)
async def upload_pdf(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    process_immediately: bool = Form(True),
    extract_metadata: bool = Form(True),
    generate_summary: bool = Form(False)
):
    """
    Upload and process a single PDF file
    
    Args:
        file: PDF file to upload
        process_immediately: Whether to process the file immediately
        extract_metadata: Whether to extract metadata
        generate_summary: Whether to generate a summary
        
    Returns:
        Ingestion response with processing status
    """
    start_time = time.time()
    
    try:
        # Validate file
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name
        
        try:
            # Validate PDF
            is_valid, error_msg = pdf_processor.validate_pdf(temp_file_path)
            if not is_valid:
                raise HTTPException(status_code=400, detail=f"Invalid PDF: {error_msg}")
            
            if process_immediately:
                # Process PDF
                result = await pdf_processor.process_pdf(temp_file_path, file.filename)
                
                if result.get('processing_status') == 'failed':
                    raise HTTPException(
                        status_code=422, 
                        detail=f"PDF processing failed: {result.get('error_message', 'Unknown error')}"
                    )
                
                # Generate embedding
                embedding = await embedding_service.generate_embedding(result['cleaned_content'])
                result['embedding_vector'] = embedding.tolist()
                
                # Add to FAISS index
                await embedding_service.add_to_index(result['case_id'], embedding)
                
                # Store in MongoDB
                await _store_case_in_mongodb(result)
                
                # Save FAISS index
                embedding_service.save_index()
                
                processing_time = (time.time() - start_time) * 1000
                
                return IngestionResponse(
                    status="success",
                    message="PDF processed and indexed successfully",
                    case_id=result['case_id'],
                    filename=file.filename,
                    pages_processed=result.get('pages_processed', 0),
                    metadata_extracted=bool(result.get('metadata')),
                    embedding_generated=True,
                    processing_time_ms=processing_time
                )
            
            else:
                # Queue for background processing
                background_tasks.add_task(
                    _background_process_pdf,
                    temp_file_path,
                    file.filename,
                    extract_metadata,
                    generate_summary
                )
                
                return IngestionResponse(
                    status="processing",
                    message="PDF queued for background processing",
                    case_id="",
                    filename=file.filename,
                    pages_processed=0,
                    metadata_extracted=False,
                    embedding_generated=False,
                    processing_time_ms=0.0
                )
        
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/batch", response_model=BatchProcessingResponse)
async def batch_process_pdfs(request: BatchProcessingRequest):
    """
    Process multiple PDF files in batch
    
    Args:
        request: Batch processing request with file paths and options
        
    Returns:
        Batch processing response with statistics
    """
    start_time = time.time()
    
    try:
        logger.info(f"Starting batch processing of {len(request.file_paths)} files")
        
        # Validate file paths
        valid_files = []
        for file_path in request.file_paths:
            if os.path.exists(file_path) and file_path.lower().endswith('.pdf'):
                if request.skip_existing:
                    # Check if already processed
                    case_id = _generate_case_id_from_path(file_path)
                    if not await _case_exists(case_id):
                        valid_files.append(file_path)
                else:
                    valid_files.append(file_path)
        
        if not valid_files:
            return BatchProcessingResponse(
                status="success",
                message="No files to process",
                total_files=len(request.file_paths),
                processed_files=0,
                failed_files=0,
                skipped_files=len(request.file_paths),
                processing_time_ms=0.0
            )
        
        # Process files in batches
        results = await pdf_processor.process_multiple_pdfs(
            valid_files,
            request.batch_size
        )
        
        # Generate embeddings and store results
        successful_results = []
        failed_results = []
        
        for result in results:
            try:
                if result.get('processing_status') == 'success':
                    # Generate embedding
                    embedding = await embedding_service.generate_embedding(result['cleaned_content'])
                    result['embedding_vector'] = embedding.tolist()
                    
                    # Store in MongoDB
                    await _store_case_in_mongodb(result)
                    successful_results.append(result)
                else:
                    failed_results.append(result)
            
            except Exception as e:
                logger.error(f"Failed to process result for {result.get('filename', 'unknown')}: {e}")
                failed_results.append(result)
        
        # Add embeddings to FAISS index in batch
        if successful_results and request.update_index:
            try:
                case_embeddings = [
                    (result['case_id'], result['embedding_vector']) 
                    for result in successful_results
                ]
                await embedding_service.add_batch_to_index(case_embeddings)
                embedding_service.save_index()
                logger.info(f"Added {len(case_embeddings)} embeddings to FAISS index")
            except Exception as e:
                logger.error(f"Failed to update FAISS index: {e}")
        
        processing_time = (time.time() - start_time) * 1000
        
        return BatchProcessingResponse(
            status="success",
            message=f"Batch processing completed: {len(successful_results)} successful, {len(failed_results)} failed",
            total_files=len(request.file_paths),
            processed_files=len(successful_results),
            failed_files=len(failed_results),
            skipped_files=len(request.file_paths) - len(valid_files),
            processing_time_ms=processing_time,
            failed_file_details=[
                {"filename": r.get('filename', 'unknown'), "error": r.get('error_message', 'unknown error')}
                for r in failed_results
            ]
        )
    
    except Exception as e:
        logger.error(f"Batch processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")

@router.get("/status/{case_id}")
async def get_ingestion_status(case_id: str):
    """Get the processing status of a case"""
    try:
        collection = db_manager.get_cases_collection()
        case_doc = await collection.find_one(
            {'case_id': case_id},
            {'case_id': 1, 'title': 1, 'created_at': 1, 'metadata.filename': 1}
        )
        
        if not case_doc:
            raise HTTPException(status_code=404, detail="Case not found")
        
        return {
            "status": "success",
            "case_id": case_id,
            "title": case_doc.get('title'),
            "filename": case_doc.get('metadata', {}).get('filename'),
            "created_at": case_doc.get('created_at'),
            "indexed": True  # If it exists in MongoDB, it's indexed
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get ingestion status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get status")

@router.get("/stats")
async def get_ingestion_stats():
    """Get statistics about ingested documents"""
    try:
        collection = db_manager.get_cases_collection()
        
        # Total documents
        total_docs = await collection.count_documents({})
        
        # Documents by type
        pipeline = [
            {'$group': {'_id': '$metadata.document_type', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]
        doc_types = await collection.aggregate(pipeline).to_list(length=None)
        
        # Recent documents (last 7 days)
        from datetime import timedelta
        week_ago = datetime.now() - timedelta(days=7)
        recent_docs = await collection.count_documents({
            'created_at': {'$gte': week_ago}
        })
        
        # FAISS index stats
        faiss_stats = embedding_service.get_index_stats()
        
        return {
            "status": "success",
            "total_documents": total_docs,
            "recent_documents_7days": recent_docs,
            "document_types": doc_types,
            "faiss_index": faiss_stats
        }
    
    except Exception as e:
        logger.error(f"Failed to get ingestion stats: {e}")
        raise HTTPException(status_code=500, detail="Failed to get statistics")

async def _background_process_pdf(
    file_path: str,
    filename: str,
    extract_metadata: bool,
    generate_summary: bool
):
    """Background task for processing PDF files"""
    try:
        logger.info(f"Background processing: {filename}")
        
        # Process PDF
        result = await pdf_processor.process_pdf(file_path, filename)
        
        if result.get('processing_status') == 'success':
            # Generate embedding
            embedding = await embedding_service.generate_embedding(result['cleaned_content'])
            result['embedding_vector'] = embedding.tolist()
            
            # Add to FAISS index
            await embedding_service.add_to_index(result['case_id'], embedding)
            
            # Store in MongoDB
            await _store_case_in_mongodb(result)
            
            # Save FAISS index
            embedding_service.save_index()
            
            logger.info(f"Background processing completed: {filename}")
        else:
            logger.error(f"Background processing failed: {filename} - {result.get('error_message')}")
    
    except Exception as e:
        logger.error(f"Background processing error for {filename}: {e}")

async def _store_case_in_mongodb(case_data: dict):
    """Store processed case data in MongoDB"""
    try:
        collection = db_manager.get_cases_collection()
        
        # Prepare document for MongoDB
        case_doc = {
            'case_id': case_data['case_id'],
            'title': case_data['title'],
            'content': case_data['content'],
            'cleaned_content': case_data['cleaned_content'],
            'metadata': case_data.get('metadata', {}),
            'sections': case_data.get('sections', {}),
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        
        # Upsert document
        await collection.replace_one(
            {'case_id': case_data['case_id']},
            case_doc,
            upsert=True
        )
        
        logger.debug(f"Stored case in MongoDB: {case_data['case_id']}")
    
    except Exception as e:
        logger.error(f"Failed to store case in MongoDB: {e}")
        raise

def _generate_case_id_from_path(file_path: str) -> str:
    """Generate case ID from file path"""
    filename = os.path.basename(file_path)
    base_name = os.path.splitext(filename)[0]
    return f"case_{base_name.replace(' ', '_').replace('-', '_')}"

async def _case_exists(case_id: str) -> bool:
    """Check if case already exists in MongoDB"""
    try:
        collection = db_manager.get_cases_collection()
        count = await collection.count_documents({'case_id': case_id})
        return count > 0
    except:
        return False
