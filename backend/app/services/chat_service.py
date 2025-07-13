"""
Chat service using LangChain ConversationalRetrievalChain
"""

from typing import List, Dict, Optional, Any, Tuple
import asyncio
from datetime import datetime
import uuid

from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain.schema import BaseRetriever, Document
from langchain.llms.base import LLM
from langchain.callbacks.manager import CallbackManagerForLLMRun
from groq import AsyncGroq

from app.config.database import db_manager
from app.services.retrieval_service import RetrievalService
from app.utils.intent_detector import IntentDetector
from app.utils.logger import setup_logger
from app.config.settings import settings

logger = setup_logger()

class GroqLLM(LLM):
    """Custom LangChain LLM wrapper for Groq"""
    
    def __init__(self):
        super().__init__()
        self.groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
    
    @property
    def _llm_type(self) -> str:
        return "groq"
    
    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        """Synchronous call to Groq (required by LangChain)"""
        import asyncio
        return asyncio.run(self._acall(prompt, stop, run_manager, **kwargs))
    
    async def _acall(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
        **kwargs: Any,
    ) -> str:
        """Asynchronous call to Groq"""
        try:
            response = await self.groq_client.chat.completions.create(
                model="mixtral-8x7b-32768",
                messages=[
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1000,
                temperature=0.3,
                stop=stop
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logger.error(f"Groq API call failed: {e}")
            return "I apologize, but I'm having trouble processing your request right now."

class LegalCaseRetriever(BaseRetriever):
    """Custom retriever for legal cases using our RetrievalService"""
    
    def __init__(self, retrieval_service: RetrievalService):
        super().__init__()
        self.retrieval_service = retrieval_service
    
    def _get_relevant_documents(self, query: str, *, run_manager=None) -> List[Document]:
        """Synchronous document retrieval (required by LangChain)"""
        import asyncio
        return asyncio.run(self._aget_relevant_documents(query, run_manager=run_manager))
    
    async def _aget_relevant_documents(self, query: str, *, run_manager=None) -> List[Document]:
        """Asynchronous document retrieval"""
        try:
            # Search for similar cases
            similar_cases = await self.retrieval_service.search_similar_cases(
                query_text=query,
                limit=5,
                include_metadata=True,
                include_sections=True
            )
            
            # Convert to LangChain Documents
            documents = []
            for case in similar_cases:
                # Combine content from sections if available
                content_parts = []
                if case.sections:
                    for section_name, section_content in case.sections.items():
                        if section_content:
                            content_parts.append(f"{section_name.upper()}:\n{section_content}")
                
                content = '\n\n'.join(content_parts) if content_parts else "No detailed content available."
                
                # Create metadata
                metadata = {
                    'case_id': case.case_id,
                    'title': case.title,
                    'similarity_score': case.similarity_score,
                    'court': case.metadata.court,
                    'case_type': case.metadata.case_type,
                    'date': case.metadata.date,
                    'source': f"Legal Case: {case.title}"
                }
                
                document = Document(
                    page_content=content,
                    metadata=metadata
                )
                documents.append(document)
            
            return documents
            
        except Exception as e:
            logger.error(f"Document retrieval failed: {e}")
            return []

class ChatService:
    """Legal chat service using LangChain and conversational memory"""
    
    def __init__(self):
        self.retrieval_service = RetrievalService()
        self.intent_detector = IntentDetector()
        self.llm = GroqLLM()
        self.retriever = LegalCaseRetriever(self.retrieval_service)
        self.active_sessions = {}  # In-memory session storage
    
    async def chat(
        self,
        message: str,
        session_id: Optional[str] = None,
        context: Optional[Dict[str, Any]] = None,
        include_sources: bool = True
    ) -> Dict[str, Any]:
        """
        Process chat message and return response
        
        Args:
            message: User message
            session_id: Chat session ID
            context: Additional context
            include_sources: Whether to include source references
            
        Returns:
            Chat response with intent, sources, and suggestions
        """
        try:
            # Generate session ID if not provided
            if not session_id:
                session_id = str(uuid.uuid4())
            
            # Detect intent
            intent, confidence = self.intent_detector.detect_intent(message)
            
            # Get or create conversation chain
            conversation_chain = await self._get_conversation_chain(session_id)
            
            # Process message based on intent
            if intent in ['case_search', 'precedent_search']:
                response = await self._handle_search_intent(message, conversation_chain, include_sources)
            elif intent == 'legal_advice':
                response = await self._handle_advice_intent(message, conversation_chain, include_sources)
            elif intent == 'document_analysis':
                response = await self._handle_analysis_intent(message, conversation_chain, include_sources)
            elif intent == 'summarization_request':
                response = await self._handle_summarization_intent(message, conversation_chain)
            elif intent == 'question_generation':
                response = await self._handle_question_intent(message, conversation_chain)
            else:
                response = await self._handle_general_intent(message, conversation_chain, include_sources)
            
            # Save conversation to MongoDB
            await self._save_conversation(session_id, message, response['response'], intent, confidence)
            
            # Generate follow-up suggestions
            follow_up_suggestions = await self._generate_follow_up_suggestions(message, intent, response['response'])
            
            return {
                'status': 'success',
                'response': response['response'],
                'intent': intent,
                'confidence': confidence,
                'sources': response.get('sources', []),
                'follow_up_suggestions': follow_up_suggestions,
                'session_id': session_id
            }
            
        except Exception as e:
            logger.error(f"Chat processing failed: {e}")
            return {
                'status': 'error',
                'response': "I apologize, but I encountered an error processing your message. Please try again.",
                'intent': None,
                'confidence': 0.0,
                'sources': [],
                'follow_up_suggestions': [],
                'session_id': session_id or str(uuid.uuid4())
            }
    
    async def _get_conversation_chain(self, session_id: str) -> ConversationalRetrievalChain:
        """Get or create conversation chain for session"""
        
        if session_id not in self.active_sessions:
            # Create memory
            memory = ConversationBufferMemory(
                memory_key="chat_history",
                return_messages=True,
                output_key="answer"
            )
            
            # Load previous conversation from MongoDB
            await self._load_conversation_history(session_id, memory)
            
            # Create conversation chain
            conversation_chain = ConversationalRetrievalChain.from_llm(
                llm=self.llm,
                retriever=self.retriever,
                memory=memory,
                return_source_documents=True,
                verbose=False
            )
            
            self.active_sessions[session_id] = conversation_chain
        
        return self.active_sessions[session_id]
    
    async def _handle_search_intent(
        self,
        message: str,
        conversation_chain: ConversationalRetrievalChain,
        include_sources: bool
    ) -> Dict[str, Any]:
        """Handle case search and precedent search intents"""
        
        # Create search-focused prompt
        search_prompt = f"""
        You are a legal research assistant. The user is looking for legal cases or precedents.
        
        User query: {message}
        
        Based on the retrieved legal documents, provide:
        1. A summary of relevant cases found
        2. Key legal principles or precedents
        3. How these cases might apply to the user's situation
        4. Suggestions for further research
        
        Be specific about case citations, holdings, and legal reasoning.
        """
        
        # Get response from conversation chain
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            conversation_chain,
            {"question": search_prompt}
        )
        
        sources = []
        if include_sources and result.get('source_documents'):
            sources = [
                {
                    'title': doc.metadata.get('title', 'Unknown Case'),
                    'case_id': doc.metadata.get('case_id'),
                    'court': doc.metadata.get('court'),
                    'similarity_score': doc.metadata.get('similarity_score', 0.0)
                }
                for doc in result['source_documents']
            ]
        
        return {
            'response': result['answer'],
            'sources': sources
        }
    
    async def _handle_advice_intent(
        self,
        message: str,
        conversation_chain: ConversationalRetrievalChain,
        include_sources: bool
    ) -> Dict[str, Any]:
        """Handle legal advice requests"""
        
        advice_prompt = f"""
        You are a legal research assistant. The user is seeking legal guidance.
        
        IMPORTANT: Always include appropriate disclaimers about not providing legal advice.
        
        User query: {message}
        
        Based on relevant legal precedents and information, provide:
        1. General legal principles that may apply
        2. Relevant case law or statutes
        3. Important considerations
        4. Recommendation to consult with a qualified attorney
        
        Include this disclaimer: "This information is for educational purposes only and does not constitute legal advice. Please consult with a qualified attorney for advice specific to your situation."
        """
        
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            conversation_chain,
            {"question": advice_prompt}
        )
        
        sources = []
        if include_sources and result.get('source_documents'):
            sources = [
                {
                    'title': doc.metadata.get('title', 'Unknown Case'),
                    'case_id': doc.metadata.get('case_id'),
                    'relevance': 'Legal precedent'
                }
                for doc in result['source_documents']
            ]
        
        return {
            'response': result['answer'],
            'sources': sources
        }
    
    async def _handle_analysis_intent(
        self,
        message: str,
        conversation_chain: ConversationalRetrievalChain,
        include_sources: bool
    ) -> Dict[str, Any]:
        """Handle document analysis requests"""
        
        analysis_prompt = f"""
        You are a legal document analysis expert.
        
        User query: {message}
        
        Based on the legal documents and cases available, provide:
        1. Key legal concepts and terms explained
        2. Document structure and important sections
        3. Legal implications and significance
        4. Related cases or precedents
        
        Focus on making complex legal concepts accessible and understandable.
        """
        
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            conversation_chain,
            {"question": analysis_prompt}
        )
        
        sources = []
        if include_sources and result.get('source_documents'):
            sources = [
                {
                    'title': doc.metadata.get('title', 'Unknown Document'),
                    'case_id': doc.metadata.get('case_id'),
                    'type': 'Legal document'
                }
                for doc in result['source_documents']
            ]
        
        return {
            'response': result['answer'],
            'sources': sources
        }
    
    async def _handle_summarization_intent(
        self,
        message: str,
        conversation_chain: ConversationalRetrievalChain
    ) -> Dict[str, Any]:
        """Handle summarization requests"""
        
        summary_prompt = f"""
        The user is requesting a summary of legal documents or cases.
        
        User request: {message}
        
        Provide a concise but comprehensive summary that includes:
        1. Key facts and procedural history
        2. Legal issues presented
        3. Court's holding and reasoning
        4. Significance and implications
        
        Keep the summary clear and well-organized.
        """
        
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            conversation_chain,
            {"question": summary_prompt}
        )
        
        return {
            'response': result['answer'],
            'sources': []
        }
    
    async def _handle_question_intent(
        self,
        message: str,
        conversation_chain: ConversationalRetrievalChain
    ) -> Dict[str, Any]:
        """Handle question generation requests"""
        
        question_prompt = f"""
        The user wants you to generate questions about legal cases or documents.
        
        User request: {message}
        
        Generate thoughtful questions that would help understand:
        1. Key legal principles
        2. Case facts and reasoning
        3. Broader implications
        4. Practical applications
        
        Format the questions clearly and explain their purpose.
        """
        
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            conversation_chain,
            {"question": question_prompt}
        )
        
        return {
            'response': result['answer'],
            'sources': []
        }
    
    async def _handle_general_intent(
        self,
        message: str,
        conversation_chain: ConversationalRetrievalChain,
        include_sources: bool
    ) -> Dict[str, Any]:
        """Handle general conversation and questions"""
        
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            conversation_chain,
            {"question": message}
        )
        
        sources = []
        if include_sources and result.get('source_documents'):
            sources = [
                {
                    'title': doc.metadata.get('title', 'Legal Resource'),
                    'type': 'Reference material'
                }
                for doc in result['source_documents'][:3]  # Limit to top 3
            ]
        
        return {
            'response': result['answer'],
            'sources': sources
        }
    
    async def _save_conversation(
        self,
        session_id: str,
        user_message: str,
        bot_response: str,
        intent: str,
        confidence: float
    ):
        """Save conversation to MongoDB"""
        try:
            collection = db_manager.get_chat_collection()
            
            conversation_entry = {
                'session_id': session_id,
                'timestamp': datetime.now(),
                'user_message': user_message,
                'bot_response': bot_response,
                'intent': intent,
                'confidence': confidence
            }
            
            await collection.insert_one(conversation_entry)
            
        except Exception as e:
            logger.error(f"Failed to save conversation: {e}")
    
    async def _load_conversation_history(self, session_id: str, memory: ConversationBufferMemory):
        """Load previous conversation history from MongoDB"""
        try:
            collection = db_manager.get_chat_collection()
            
            # Get last 10 messages for context
            cursor = collection.find(
                {'session_id': session_id}
            ).sort('timestamp', -1).limit(10)
            
            messages = await cursor.to_list(length=10)
            
            # Add messages to memory in chronological order
            for message in reversed(messages):
                memory.chat_memory.add_user_message(message['user_message'])
                memory.chat_memory.add_ai_message(message['bot_response'])
            
        except Exception as e:
            logger.error(f"Failed to load conversation history: {e}")
    
    async def _generate_follow_up_suggestions(
        self,
        user_message: str,
        intent: str,
        bot_response: str
    ) -> List[str]:
        """Generate contextual follow-up suggestions"""
        
        suggestions = []
        
        if intent in ['case_search', 'precedent_search']:
            suggestions = [
                "Can you explain the legal reasoning in these cases?",
                "What are the key differences between these precedents?",
                "How might these cases apply to my specific situation?",
                "Are there any recent developments in this area of law?"
            ]
        
        elif intent == 'legal_advice':
            suggestions = [
                "What documents would I need for this legal matter?",
                "What are the potential risks or consequences?",
                "How long does this type of legal process typically take?",
                "What questions should I ask a lawyer about this?"
            ]
        
        elif intent == 'document_analysis':
            suggestions = [
                "Can you summarize the key points of this document?",
                "What are the most important clauses to pay attention to?",
                "Are there any potential issues or red flags?",
                "How does this compare to standard legal documents?"
            ]
        
        else:
            suggestions = [
                "Can you provide more details about this topic?",
                "What are some related legal concepts I should know?",
                "Are there any important cases related to this?",
                "How does this apply in practice?"
            ]
        
        return suggestions[:3]  # Return top 3 suggestions
    
    async def get_session_history(self, session_id: str) -> List[Dict[str, Any]]:
        """Get conversation history for a session"""
        try:
            collection = db_manager.get_chat_collection()
            
            cursor = collection.find(
                {'session_id': session_id},
                {'_id': 0}  # Exclude MongoDB _id
            ).sort('timestamp', 1)
            
            history = await cursor.to_list(length=None)
            return history
            
        except Exception as e:
            logger.error(f"Failed to get session history: {e}")
            return []
    
    async def clear_session(self, session_id: str) -> bool:
        """Clear conversation history for a session"""
        try:
            # Remove from active sessions
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]
            
            # Remove from MongoDB
            collection = db_manager.get_chat_collection()
            await collection.delete_many({'session_id': session_id})
            
            return True
            
        except Exception as e:
            logger.error(f"Failed to clear session: {e}")
            return False
