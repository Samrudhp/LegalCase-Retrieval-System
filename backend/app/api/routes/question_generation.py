"""
Question generation API routes
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List, Optional
import tempfile
import os

from app.services.question_service import QuestionService
from app.services.pdf_processor import PDFProcessor
from app.models.query_model import QuestionGenerationRequest
from app.models.response_model import QuestionGenerationResponse
from app.utils.logger import setup_logger

logger = setup_logger()
router = APIRouter()

# Initialize services
question_service = QuestionService()
pdf_processor = PDFProcessor()

@router.post("/qa-common", response_model=QuestionGenerationResponse)
async def generate_common_questions(
    case_ids: Optional[List[str]] = None,
    text_content: Optional[str] = None,
    num_questions: int = 5,
    focus_areas: Optional[List[str]] = None
):
    """
    Generate common legal questions focusing on basic legal elements
    
    Args:
        case_ids: List of case IDs to generate questions for
        text_content: Direct text content
        num_questions: Number of questions to generate (1-20)
        focus_areas: Specific areas to focus on
        
    Returns:
        Generated common questions
    """
    try:
        if not case_ids and not text_content:
            raise HTTPException(
                status_code=400, 
                detail="Either case_ids or text_content must be provided"
            )
        
        if num_questions < 1 or num_questions > 20:
            raise HTTPException(
                status_code=400, 
                detail="num_questions must be between 1 and 20"
            )
        
        result = await question_service.generate_common_questions(
            case_ids=case_ids,
            text_content=text_content,
            num_questions=num_questions,
            focus_areas=focus_areas
        )
        
        if result['status'] == 'error':
            raise HTTPException(status_code=422, detail=result['message'])
        
        return QuestionGenerationResponse(
            status="success",
            message=f"Generated {len(result['questions'])} common questions",
            questions=result['questions'],
            question_type="common",
            sources=result.get('sources', []),
            generation_metadata=result.get('generation_metadata', {})
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Common question generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")

@router.post("/qa-rare", response_model=QuestionGenerationResponse)
async def generate_rare_questions(
    case_ids: Optional[List[str]] = None,
    text_content: Optional[str] = None,
    num_questions: int = 5,
    focus_areas: Optional[List[str]] = None
):
    """
    Generate rare, insightful questions focusing on niche legal aspects
    
    Args:
        case_ids: List of case IDs to generate questions for
        text_content: Direct text content
        num_questions: Number of questions to generate (1-20)
        focus_areas: Specific areas to focus on
        
    Returns:
        Generated rare questions
    """
    try:
        if not case_ids and not text_content:
            raise HTTPException(
                status_code=400, 
                detail="Either case_ids or text_content must be provided"
            )
        
        if num_questions < 1 or num_questions > 20:
            raise HTTPException(
                status_code=400, 
                detail="num_questions must be between 1 and 20"
            )
        
        result = await question_service.generate_rare_questions(
            case_ids=case_ids,
            text_content=text_content,
            num_questions=num_questions,
            focus_areas=focus_areas
        )
        
        if result['status'] == 'error':
            raise HTTPException(status_code=422, detail=result['message'])
        
        return QuestionGenerationResponse(
            status="success",
            message=f"Generated {len(result['questions'])} rare questions",
            questions=result['questions'],
            question_type="rare",
            sources=result.get('sources', []),
            generation_metadata=result.get('generation_metadata', {})
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Rare question generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")

@router.post("/qa-unexpected", response_model=QuestionGenerationResponse)
async def generate_unexpected_questions(
    case_ids: Optional[List[str]] = None,
    text_content: Optional[str] = None,
    num_questions: int = 5,
    focus_areas: Optional[List[str]] = None
):
    """
    Generate unexpected, judge-like probing questions
    
    Args:
        case_ids: List of case IDs to generate questions for
        text_content: Direct text content
        num_questions: Number of questions to generate (1-20)
        focus_areas: Specific areas to focus on
        
    Returns:
        Generated unexpected questions
    """
    try:
        if not case_ids and not text_content:
            raise HTTPException(
                status_code=400, 
                detail="Either case_ids or text_content must be provided"
            )
        
        if num_questions < 1 or num_questions > 20:
            raise HTTPException(
                status_code=400, 
                detail="num_questions must be between 1 and 20"
            )
        
        result = await question_service.generate_unexpected_questions(
            case_ids=case_ids,
            text_content=text_content,
            num_questions=num_questions,
            focus_areas=focus_areas
        )
        
        if result['status'] == 'error':
            raise HTTPException(status_code=422, detail=result['message'])
        
        return QuestionGenerationResponse(
            status="success",
            message=f"Generated {len(result['questions'])} unexpected questions",
            questions=result['questions'],
            question_type="unexpected",
            sources=result.get('sources', []),
            generation_metadata=result.get('generation_metadata', {})
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected question generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")

@router.post("/generate-from-upload", response_model=QuestionGenerationResponse)
async def generate_questions_from_upload(
    file: UploadFile = File(...),
    question_type: str = Form("common"),
    num_questions: int = Form(5),
    focus_areas: Optional[str] = Form(None)
):
    """
    Generate questions from an uploaded PDF document
    
    Args:
        file: PDF file to generate questions for
        question_type: Type of questions (common, rare, unexpected)
        num_questions: Number of questions to generate
        focus_areas: Comma-separated focus areas
        
    Returns:
        Generated questions from uploaded document
    """
    try:
        # Validate inputs
        if not file.filename.lower().endswith('.pdf'):
            raise HTTPException(status_code=400, detail="Only PDF files are supported")
        
        if question_type not in ["common", "rare", "unexpected"]:
            raise HTTPException(
                status_code=400, 
                detail="question_type must be one of: common, rare, unexpected"
            )
        
        if num_questions < 1 or num_questions > 20:
            raise HTTPException(
                status_code=400, 
                detail="num_questions must be between 1 and 20"
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
            
            # Generate questions based on type
            if question_type == "common":
                result = await question_service.generate_common_questions(
                    text_content=pdf_result['cleaned_content'],
                    num_questions=num_questions,
                    focus_areas=focus_areas_list
                )
            elif question_type == "rare":
                result = await question_service.generate_rare_questions(
                    text_content=pdf_result['cleaned_content'],
                    num_questions=num_questions,
                    focus_areas=focus_areas_list
                )
            else:  # unexpected
                result = await question_service.generate_unexpected_questions(
                    text_content=pdf_result['cleaned_content'],
                    num_questions=num_questions,
                    focus_areas=focus_areas_list
                )
            
            if result['status'] == 'error':
                raise HTTPException(status_code=422, detail=result['message'])
            
            return QuestionGenerationResponse(
                status="success",
                message=f"Generated {len(result['questions'])} {question_type} questions from uploaded document",
                questions=result['questions'],
                question_type=question_type,
                sources=[file.filename],
                generation_metadata=result.get('generation_metadata', {})
            )
        
        finally:
            # Clean up temporary file
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Question generation from upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")

@router.post("/generate", response_model=QuestionGenerationResponse)
async def generate_questions(request: QuestionGenerationRequest):
    """
    Generate questions using a structured request
    
    Args:
        request: Question generation request with all parameters
        
    Returns:
        Generated questions
    """
    try:
        if not request.case_ids and not request.text_content:
            raise HTTPException(
                status_code=400, 
                detail="Either case_ids or text_content must be provided"
            )
        
        # Generate questions based on type
        if request.question_type.value == "common":
            result = await question_service.generate_common_questions(
                case_ids=request.case_ids,
                text_content=request.text_content,
                num_questions=request.num_questions,
                focus_areas=request.focus_areas
            )
        elif request.question_type.value == "rare":
            result = await question_service.generate_rare_questions(
                case_ids=request.case_ids,
                text_content=request.text_content,
                num_questions=request.num_questions,
                focus_areas=request.focus_areas
            )
        else:  # unexpected
            result = await question_service.generate_unexpected_questions(
                case_ids=request.case_ids,
                text_content=request.text_content,
                num_questions=request.num_questions,
                focus_areas=request.focus_areas
            )
        
        if result['status'] == 'error':
            raise HTTPException(status_code=422, detail=result['message'])
        
        return QuestionGenerationResponse(
            status="success",
            message=f"Generated {len(result['questions'])} {request.question_type.value} questions",
            questions=result['questions'],
            question_type=request.question_type.value,
            sources=result.get('sources', []),
            generation_metadata=result.get('generation_metadata', {})
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Question generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Question generation failed: {str(e)}")

@router.get("/types")
async def get_question_types():
    """Get available question types and their descriptions"""
    return {
        "status": "success",
        "question_types": [
            {
                "type": "common",
                "name": "Common Questions",
                "description": "Basic legal questions focusing on statutes, legal standards, facts, and holdings",
                "difficulty": "Basic"
            },
            {
                "type": "rare",
                "name": "Rare Questions", 
                "description": "Insightful questions exploring dissenting opinions, procedural nuances, and doctrine",
                "difficulty": "Advanced"
            },
            {
                "type": "unexpected",
                "name": "Unexpected Questions",
                "description": "Judge-like probing questions with hypotheticals and challenging scenarios",
                "difficulty": "Expert"
            }
        ]
    }

@router.get("/focus-areas")
async def get_question_focus_areas():
    """Get common focus areas for question generation"""
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
            "evidence",
            "jurisdiction",
            "constitutional_issues",
            "civil_procedure",
            "criminal_law",
            "contract_law",
            "tort_law",
            "administrative_law",
            "appellate_procedure"
        ]
    }

@router.get("/case/{case_id}/questions")
async def get_case_questions(
    case_id: str,
    question_type: Optional[str] = None,
    limit: int = 10
):
    """
    Get previously generated questions for a case (if any)
    This would require a separate storage mechanism for generated questions
    """
    try:
        # This is a placeholder - you might want to store generated questions
        # in MongoDB for future retrieval
        return {
            "status": "success",
            "case_id": case_id,
            "message": "Question history not implemented - questions are generated on demand",
            "questions": []
        }
    
    except Exception as e:
        logger.error(f"Failed to get case questions: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve questions")
