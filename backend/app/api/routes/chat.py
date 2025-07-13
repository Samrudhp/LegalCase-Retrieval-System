"""
Legal chat bot API routes
"""

from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any

from app.services.chat_service import ChatService
from app.models.query_model import ChatMessage
from app.models.response_model import ChatResponse
from app.utils.logger import setup_logger

logger = setup_logger()
router = APIRouter()

# Initialize service
chat_service = ChatService()

@router.post("/message", response_model=ChatResponse)
async def send_chat_message(message: ChatMessage):
    """
    Send a message to the legal chat bot
    
    Args:
        message: Chat message with content and optional session ID
        
    Returns:
        Chat response with bot reply and metadata
    """
    try:
        if not message.message or not message.message.strip():
            raise HTTPException(status_code=400, detail="Message content is required")
        
        if len(message.message) > 2000:
            raise HTTPException(
                status_code=400, 
                detail="Message is too long. Maximum 2000 characters allowed."
            )
        
        result = await chat_service.chat(
            message=message.message,
            session_id=message.session_id,
            context=message.context,
            include_sources=message.include_sources
        )
        
        if result['status'] == 'error':
            raise HTTPException(status_code=422, detail="Chat processing failed")
        
        return ChatResponse(
            status="success",
            message="Message processed successfully",
            response=result['response'],
            intent=result.get('intent'),
            confidence=result.get('confidence'),
            sources=result.get('sources', []),
            follow_up_suggestions=result.get('follow_up_suggestions', []),
            session_id=result['session_id']
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Chat message processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@router.get("/conversation/{session_id}")
async def get_conversation_history(
    session_id: str,
    limit: int = Query(50, ge=1, le=200, description="Number of messages to retrieve")
):
    """
    Get conversation history for a session
    
    Args:
        session_id: Chat session ID
        limit: Maximum number of messages to return
        
    Returns:
        Conversation history
    """
    try:
        history = await chat_service.get_session_history(session_id)
        
        # Limit results
        if len(history) > limit:
            history = history[-limit:]  # Get most recent messages
        
        return {
            "status": "success",
            "session_id": session_id,
            "message_count": len(history),
            "conversation": history
        }
    
    except Exception as e:
        logger.error(f"Failed to get conversation history: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve conversation history")

@router.delete("/conversation/{session_id}")
async def clear_conversation(session_id: str):
    """
    Clear conversation history for a session
    
    Args:
        session_id: Chat session ID to clear
        
    Returns:
        Confirmation of clearing
    """
    try:
        success = await chat_service.clear_session(session_id)
        
        if not success:
            raise HTTPException(status_code=422, detail="Failed to clear conversation")
        
        return {
            "status": "success",
            "message": f"Conversation history cleared for session {session_id}",
            "session_id": session_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to clear conversation: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear conversation")

@router.post("/ask", response_model=ChatResponse)
async def quick_ask(
    question: str,
    include_sources: bool = Query(True, description="Include source references"),
    session_id: Optional[str] = Query(None, description="Optional session ID for context")
):
    """
    Quick ask endpoint for simple questions without full message structure
    
    Args:
        question: Question to ask
        include_sources: Whether to include sources
        session_id: Optional session ID for context
        
    Returns:
        Chat response
    """
    try:
        if not question or not question.strip():
            raise HTTPException(status_code=400, detail="Question is required")
        
        if len(question) > 1000:
            raise HTTPException(
                status_code=400, 
                detail="Question is too long. Maximum 1000 characters allowed."
            )
        
        result = await chat_service.chat(
            message=question,
            session_id=session_id,
            context=None,
            include_sources=include_sources
        )
        
        if result['status'] == 'error':
            raise HTTPException(status_code=422, detail="Question processing failed")
        
        return ChatResponse(
            status="success",
            message="Question answered successfully",
            response=result['response'],
            intent=result.get('intent'),
            confidence=result.get('confidence'),
            sources=result.get('sources', []),
            follow_up_suggestions=result.get('follow_up_suggestions', []),
            session_id=result['session_id']
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Quick ask processing failed: {e}")
        raise HTTPException(status_code=500, detail=f"Question processing failed: {str(e)}")

@router.get("/intents")
async def get_supported_intents():
    """Get list of supported intents and their descriptions"""
    return {
        "status": "success",
        "intents": [
            {
                "intent": "case_search",
                "description": "Search for similar legal cases and precedents",
                "example": "Find cases similar to Brown v. Board of Education"
            },
            {
                "intent": "legal_advice",
                "description": "Request legal guidance (with disclaimers)",
                "example": "What are my rights if my landlord enters without permission?"
            },
            {
                "intent": "document_analysis",
                "description": "Analyze and explain legal documents",
                "example": "Can you explain what this contract clause means?"
            },
            {
                "intent": "precedent_search",
                "description": "Search for legal precedents and case law",
                "example": "What precedents exist for Fourth Amendment violations?"
            },
            {
                "intent": "statute_lookup",
                "description": "Look up statutes, regulations, and legal codes",
                "example": "What does 42 USC 1983 say about civil rights?"
            },
            {
                "intent": "procedure_query",
                "description": "Ask about legal procedures and court processes",
                "example": "How do I file a motion to dismiss?"
            },
            {
                "intent": "general_question",
                "description": "General questions about law and legal concepts",
                "example": "What is the difference between civil and criminal law?"
            },
            {
                "intent": "summarization_request",
                "description": "Request summaries of legal documents or cases",
                "example": "Can you summarize this Supreme Court decision?"
            },
            {
                "intent": "question_generation",
                "description": "Generate questions about legal cases or documents",
                "example": "Generate study questions for this case"
            },
            {
                "intent": "chat_conversation",
                "description": "General conversational interactions",
                "example": "Hello, can you help me with legal research?"
            }
        ]
    }

@router.get("/suggestions")
async def get_conversation_starters():
    """Get sample conversation starters for users"""
    return {
        "status": "success",
        "conversation_starters": [
            "Find cases similar to employment discrimination based on age",
            "What are the elements of a negligence claim?",
            "Explain the Miranda rights and when they apply",
            "How do I research federal regulations on environmental law?",
            "What's the difference between summary judgment and directed verdict?",
            "Find precedents for search and seizure in digital devices",
            "Summarize the key holdings in Marbury v. Madison",
            "What procedures are required for filing an appeal?",
            "Generate questions about contract formation",
            "Analyze the constitutional issues in this case"
        ]
    }

@router.get("/session/new")
async def create_new_session():
    """Create a new chat session"""
    import uuid
    
    new_session_id = str(uuid.uuid4())
    
    return {
        "status": "success",
        "session_id": new_session_id,
        "message": "New chat session created",
        "expires": "Sessions are kept active for the duration of the conversation"
    }

@router.get("/health")
async def chat_health_check():
    """Health check for chat service"""
    try:
        # Test basic functionality
        test_result = await chat_service.chat(
            message="Test message",
            session_id=None,
            context=None,
            include_sources=False
        )
        
        return {
            "status": "healthy",
            "service": "Legal Chat Bot",
            "intent_detection": "available",
            "conversation_memory": "available",
            "retrieval_integration": "available",
            "test_response": "passed" if test_result['status'] == 'success' else "failed"
        }
    
    except Exception as e:
        logger.error(f"Chat health check failed: {e}")
        return {
            "status": "unhealthy",
            "service": "Legal Chat Bot",
            "error": str(e)
        }
