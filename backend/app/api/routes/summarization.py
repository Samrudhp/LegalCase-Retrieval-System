"""
Document summarization API routes
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional
import tempfile
import os

from app.services.summarization_service import SummarizationService
from app.services.pdf_processor import PDFProcessor
from app.models.query_model import SummarizationRequest
from app.models.response_model import SummarizationResponse
from app.utils.logger import setup_logger

logger = setup_logger()
router = APIRouter()

# Initialize services
summarization_service = SummarizationService()
pdf_processor = PDFProcessor()

@router.post("/summarize1", response_model=SummarizationResponse)
async def summarize_single_case(
    case_id: str,
    length: str = "300",
    focus_areas: Optional[List[str]] = None,
    extractive: bool = True,
    abstractive: bool = True
):
    """
    Summarize a single legal case by case ID
    
    Args:
        case_id: Case identifier
        length: Target summary length (100, 300, 500)
        focus_areas: Specific areas to focus on
        extractive: Use extractive summarization
        abstractive: Use abstractive summarization
        
    Returns:
        Summary response
    """
    try:
        if length not in ["100", "300", "500"]:
            raise HTTPException(
                status_code=400, 
                detail="Length must be one of: 100, 300, 500"
            )
        
        result = await summarization_service.summarize_single_case(
            case_id=case_id,
            length=length,
            focus_areas=focus_areas,
            extractive=extractive,
            abstractive=abstractive
        )
        
        if result['status'] == 'error':
            if 'not found' in result['message']:
                raise HTTPException(status_code=404, detail=result['message'])
            else:
                raise HTTPException(status_code=422, detail=result['message'])
        
        return SummarizationResponse(
            status="success",
            message="Case summarized successfully",
            summary=result['summary'],
            summary_type=result.get('summary_type', 'hybrid'),
            length=result.get('length', 0),
            key_points=result.get('key_points', []),
            sources=result.get('sources', []),
            confidence_score=result.get('confidence_score')
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Single case summarization failed: {e}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@router.post("/summarize-many", response_model=SummarizationResponse)
async def summarize_multiple_cases(request: SummarizationRequest):
    """
    Summarize multiple legal cases
    
    Args:
        request: Summarization request with case IDs and parameters
        
    Returns:
        Combined summary response
    """
    try:
        if not request.case_ids:
            raise HTTPException(
                status_code=400, 
                detail="case_ids list is required for multiple case summarization"
            )
        
        if len(request.case_ids) > 20:
            raise HTTPException(
                status_code=400, 
                detail="Maximum 20 cases can be summarized at once"
            )
        
        result = await summarization_service.summarize_multiple_cases(
            case_ids=request.case_ids,
            length=request.length.value,
            focus_areas=request.focus_areas,
            extractive=request.extractive,
            abstractive=request.abstractive
        )
        
        if result['status'] == 'error':
            raise HTTPException(status_code=422, detail=result['message'])
        
        return SummarizationResponse(
            status="success",
            message=f"Summarized {result.get('total_cases', len(request.case_ids))} cases",
            summary=result['summary'],
            summary_type=result.get('summary_type', 'hybrid'),
            length=result.get('length', 0),
            key_points=result.get('key_points', []),
            sources=result.get('sources', []),
            confidence_score=result.get('confidence_score')
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Multiple case summarization failed: {e}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@router.post("/summarize-uploaded", response_model=SummarizationResponse)
async def summarize_uploaded_document(
    file: UploadFile = File(...),
    length: str = Form("300"),
    focus_areas: Optional[str] = Form(None),
    extractive: bool = Form(True),
    abstractive: bool = Form(True)
):
    """
    Summarize an uploaded PDF document
    
    Args:
        file: PDF file to summarize
        length: Target summary length (100, 300, 500)
        focus_areas: Comma-separated focus areas
        extractive: Use extractive summarization
        abstractive: Use abstractive summarization
        
    Returns:
        Summary response
    """
    try:
        # Validate inputs
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        if length not in ["100", "300", "500"]:
            raise HTTPException(
                status_code=400, 
                detail="Length must be one of: 100, 300, 500"
            )
        
        # Parse focus areas
        focus_areas_list = None
        if focus_areas:
            focus_areas_list = [area.strip() for area in focus_areas.split(',') if area.strip()]
        
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
            
            # Process PDF to extract text
            pdf_result = await pdf_processor.process_pdf(temp_file_path, file.filename)
            
            if pdf_result.get('processing_status') == 'failed':
                raise HTTPException(
                    status_code=422, 
                    detail=f"PDF processing failed: {pdf_result.get('error_message', 'Unknown error')}"
                )
            
            # Summarize the extracted content
            result = await summarization_service.summarize_uploaded_document(
                content=pdf_result['cleaned_content'],
                filename=file.filename,
                length=length,
                focus_areas=focus_areas_list,
                extractive=extractive,
                abstractive=abstractive
            )
            
            if result['status'] == 'error':
                raise HTTPException(status_code=422, detail=result['message'])
            
            return SummarizationResponse(
                status="success",
                message="Document summarized successfully",
                summary=result['summary'],
                summary_type=result.get('summary_type', 'hybrid'),
                length=result.get('length', 0),
                key_points=result.get('key_points', []),
                sources=result.get('sources', []),
                confidence_score=result.get('confidence_score')
            )
        
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Uploaded document summarization failed: {e}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@router.post("/summarize-text", response_model=SummarizationResponse)
async def summarize_text_content(
    text_content: str,
    length: str = "300",
    focus_areas: Optional[List[str]] = None,
    extractive: bool = True,
    abstractive: bool = True
):
    """
    Summarize provided text content
    
    Args:
        text_content: Text content to summarize
        length: Target summary length (100, 300, 500)
        focus_areas: Specific areas to focus on
        extractive: Use extractive summarization
        abstractive: Use abstractive summarization
        
    Returns:
        Summary response
    """
    try:
        if not text_content or not text_content.strip():
            raise HTTPException(status_code=400, detail="Text content is required")
        
        if len(text_content) < 100:
            raise HTTPException(
                status_code=400, 
                detail="Text content must be at least 100 characters long"
            )
        
        if length not in ["100", "300", "500"]:
            raise HTTPException(
                status_code=400, 
                detail="Length must be one of: 100, 300, 500"
            )
        
        result = await summarization_service.summarize_uploaded_document(
            content=text_content,
            filename="text_input",
            length=length,
            focus_areas=focus_areas,
            extractive=extractive,
            abstractive=abstractive
        )
        
        if result['status'] == 'error':
            raise HTTPException(status_code=422, detail=result['message'])
        
        return SummarizationResponse(
            status="success",
            message="Text summarized successfully",
            summary=result['summary'],
            summary_type=result.get('summary_type', 'hybrid'),
            length=result.get('length', 0),
            key_points=result.get('key_points', []),
            sources=result.get('sources', []),
            confidence_score=result.get('confidence_score')
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Text summarization failed: {e}")
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")

@router.get("/summary/{case_id}")
async def get_existing_summary(case_id: str):
    """
    Get existing summary for a case if available
    
    Args:
        case_id: Case identifier
        
    Returns:
        Existing summary or indication that none exists
    """
    try:
        from app.config.database import db_manager
        collection = db_manager.get_cases_collection()
        
        case_doc = await collection.find_one(
            {'case_id': case_id},
            {'summary': 1, 'title': 1}
        )
        
        if not case_doc:
            raise HTTPException(status_code=404, detail="Case not found")
        
        existing_summary = case_doc.get('summary')
        
        if existing_summary:
            return {
                "status": "success",
                "case_id": case_id,
                "title": case_doc.get('title'),
                "summary": existing_summary,
                "has_summary": True
            }
        else:
            return {
                "status": "success",
                "case_id": case_id,
                "title": case_doc.get('title'),
                "summary": None,
                "has_summary": False,
                "message": "No existing summary found for this case"
            }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get existing summary: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve summary")

@router.get("/supported-lengths")
async def get_supported_lengths():
    """Get list of supported summary lengths"""
    return {
        "status": "success",
        "supported_lengths": [
            {"value": "100", "description": "Short summary (approximately 100 words)"},
            {"value": "300", "description": "Medium summary (approximately 300 words)"},
            {"value": "500", "description": "Long summary (approximately 500 words)"}
        ],
        "default": "300"
    }

@router.get("/focus-areas")
async def get_common_focus_areas():
    """Get list of common focus areas for summarization"""
    return {
        "status": "success",
        "focus_areas": [
            "facts",
            "procedural_history", 
            "legal_issues",
            "holdings",
            "reasoning",
            "dissenting_opinions",
            "concurring_opinions",
            "statutes_cited",
            "precedents",
            "outcome",
            "implications",
            "damages",
            "evidence",
            "jurisdiction"
        ]
    }
