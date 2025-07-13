"""
Summarization service using hybrid extractive-abstractive methods
"""

from typing import List, Dict, Optional, Any
import asyncio
from groq import AsyncGroq
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import re

from app.config.settings import settings
from app.utils.logger import setup_logger
from app.services.retrieval_service import RetrievalService

logger = setup_logger()

class SummarizationService:
    """Hybrid summarization service using LegalBERT and Groq"""
    
    def __init__(self):
        self.groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        self.embedding_model = None
        self.retrieval_service = RetrievalService()
        self._load_embedding_model()
    
    def _load_embedding_model(self):
        """Load LegalBERT model for extractive summarization"""
        try:
            self.embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
            logger.info("Loaded LegalBERT model for extractive summarization")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
    
    async def summarize_single_case(
        self,
        case_id: str,
        length: str = "300",
        focus_areas: Optional[List[str]] = None,
        extractive: bool = True,
        abstractive: bool = True
    ) -> Dict[str, Any]:
        """
        Summarize a single legal case
        
        Args:
            case_id: Case identifier
            length: Target summary length (100, 300, 500)
            focus_areas: Specific areas to focus on
            extractive: Use extractive summarization
            abstractive: Use abstractive summarization
            
        Returns:
            Summary result with metadata
        """
        try:
            # Retrieve case data
            case_data = await self.retrieval_service.search_by_case_id(
                case_id, 
                include_metadata=True, 
                include_sections=True
            )
            
            if not case_data:
                return {
                    'status': 'error',
                    'message': f'Case {case_id} not found',
                    'summary': '',
                    'key_points': [],
                    'sources': []
                }
            
            # Get case content
            # Note: We'll need to get the full content from MongoDB separately
            collection = self.retrieval_service.embedding_service.case_id_mapping
            case_content = await self._get_case_content(case_id)
            
            if not case_content:
                return {
                    'status': 'error',
                    'message': f'No content found for case {case_id}',
                    'summary': '',
                    'key_points': [],
                    'sources': [case_id]
                }
            
            # Generate summary
            summary_result = await self._generate_hybrid_summary(
                case_content,
                length,
                focus_areas,
                extractive,
                abstractive
            )
            
            summary_result.update({
                'status': 'success',
                'sources': [case_id],
                'case_title': case_data.title,
                'case_metadata': case_data.metadata.dict()
            })
            
            return summary_result
            
        except Exception as e:
            logger.error(f"Failed to summarize case {case_id}: {e}")
            return {
                'status': 'error',
                'message': str(e),
                'summary': '',
                'key_points': [],
                'sources': [case_id]
            }
    
    async def summarize_multiple_cases(
        self,
        case_ids: List[str],
        length: str = "300",
        focus_areas: Optional[List[str]] = None,
        extractive: bool = True,
        abstractive: bool = True
    ) -> Dict[str, Any]:
        """
        Summarize multiple legal cases
        
        Args:
            case_ids: List of case identifiers
            length: Target summary length
            focus_areas: Specific areas to focus on
            extractive: Use extractive summarization
            abstractive: Use abstractive summarization
            
        Returns:
            Combined summary result
        """
        try:
            # Retrieve all case contents
            case_contents = []
            valid_case_ids = []
            
            for case_id in case_ids:
                content = await self._get_case_content(case_id)
                if content:
                    case_contents.append(content)
                    valid_case_ids.append(case_id)
            
            if not case_contents:
                return {
                    'status': 'error',
                    'message': 'No valid case content found',
                    'summary': '',
                    'key_points': [],
                    'sources': case_ids
                }
            
            # Combine case contents
            combined_content = '\n\n--- CASE SEPARATOR ---\n\n'.join(case_contents)
            
            # Generate summary
            summary_result = await self._generate_hybrid_summary(
                combined_content,
                length,
                focus_areas,
                extractive,
                abstractive
            )
            
            summary_result.update({
                'status': 'success',
                'sources': valid_case_ids,
                'total_cases': len(valid_case_ids)
            })
            
            return summary_result
            
        except Exception as e:
            logger.error(f"Failed to summarize multiple cases: {e}")
            return {
                'status': 'error',
                'message': str(e),
                'summary': '',
                'key_points': [],
                'sources': case_ids
            }
    
    async def summarize_uploaded_document(
        self,
        content: str,
        filename: str,
        length: str = "300",
        focus_areas: Optional[List[str]] = None,
        extractive: bool = True,
        abstractive: bool = True
    ) -> Dict[str, Any]:
        """
        Summarize uploaded document content
        
        Args:
            content: Document text content
            filename: Original filename
            length: Target summary length
            focus_areas: Specific areas to focus on
            extractive: Use extractive summarization
            abstractive: Use abstractive summarization
            
        Returns:
            Summary result
        """
        try:
            if not content or not content.strip():
                return {
                    'status': 'error',
                    'message': 'No content provided',
                    'summary': '',
                    'key_points': [],
                    'sources': [filename]
                }
            
            # Generate summary
            summary_result = await self._generate_hybrid_summary(
                content,
                length,
                focus_areas,
                extractive,
                abstractive
            )
            
            summary_result.update({
                'status': 'success',
                'sources': [filename],
                'document_filename': filename
            })
            
            return summary_result
            
        except Exception as e:
            logger.error(f"Failed to summarize uploaded document: {e}")
            return {
                'status': 'error',
                'message': str(e),
                'summary': '',
                'key_points': [],
                'sources': [filename]
            }
    
    async def _generate_hybrid_summary(
        self,
        content: str,
        length: str,
        focus_areas: Optional[List[str]],
        extractive: bool,
        abstractive: bool
    ) -> Dict[str, Any]:
        """
        Generate hybrid extractive-abstractive summary
        
        Args:
            content: Text content to summarize
            length: Target summary length
            focus_areas: Areas to focus on
            extractive: Use extractive summarization
            abstractive: Use abstractive summarization
            
        Returns:
            Summary result dictionary
        """
        result = {
            'summary': '',
            'summary_type': 'hybrid',
            'length': 0,
            'key_points': [],
            'confidence_score': 0.0
        }
        
        try:
            # Step 1: Extractive summarization (if enabled)
            extractive_sentences = []
            if extractive and self.embedding_model:
                extractive_sentences = await self._extractive_summarization(
                    content, 
                    int(length) // 2 if abstractive else int(length),
                    focus_areas
                )
                result['key_points'] = extractive_sentences[:5]  # Top 5 as key points
            
            # Step 2: Abstractive summarization (if enabled)
            if abstractive:
                # Use extractive sentences as input if available, otherwise full content
                input_text = ' '.join(extractive_sentences) if extractive_sentences else content
                
                # Limit input length for Groq API
                if len(input_text) > 4000:
                    input_text = input_text[:4000] + "..."
                
                abstractive_summary = await self._abstractive_summarization(
                    input_text,
                    length,
                    focus_areas
                )
                
                if abstractive_summary:
                    result['summary'] = abstractive_summary
                    result['summary_type'] = 'abstractive' if not extractive else 'hybrid'
            
            # Fallback to extractive if abstractive failed
            if not result['summary'] and extractive_sentences:
                result['summary'] = ' '.join(extractive_sentences[:3])
                result['summary_type'] = 'extractive'
            
            # Calculate length and confidence
            result['length'] = len(result['summary'].split())
            result['confidence_score'] = min(0.9, len(result['summary']) / (int(length) * 1.2))
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to generate hybrid summary: {e}")
            result['summary'] = "Summary generation failed."
            return result
    
    async def _extractive_summarization(
        self,
        content: str,
        target_words: int,
        focus_areas: Optional[List[str]]
    ) -> List[str]:
        """
        Extractive summarization using LegalBERT sentence ranking
        """
        try:
            # Split into sentences
            sentences = self._split_into_sentences(content)
            
            if len(sentences) <= 3:
                return sentences
            
            # Generate embeddings for all sentences
            sentence_embeddings = self.embedding_model.encode(sentences)
            
            # Calculate sentence scores
            scores = []
            for i, sentence in enumerate(sentences):
                score = 0.0
                
                # Legal importance scoring
                score += self._calculate_legal_importance(sentence)
                
                # Focus area scoring
                if focus_areas:
                    score += self._calculate_focus_score(sentence, focus_areas)
                
                # Position scoring (favor sentences from beginning and end)
                position_score = 1.0 - abs(0.5 - i / len(sentences))
                score += position_score * 0.3
                
                scores.append((score, i, sentence))
            
            # Sort by score and select top sentences
            scores.sort(reverse=True)
            
            # Select sentences until target word count
            selected_sentences = []
            word_count = 0
            
            for score, idx, sentence in scores:
                sentence_words = len(sentence.split())
                if word_count + sentence_words <= target_words:
                    selected_sentences.append((idx, sentence))
                    word_count += sentence_words
                
                if word_count >= target_words * 0.8:  # 80% of target
                    break
            
            # Sort selected sentences by original order
            selected_sentences.sort(key=lambda x: x[0])
            
            return [sentence for _, sentence in selected_sentences]
            
        except Exception as e:
            logger.error(f"Extractive summarization failed: {e}")
            return []
    
    async def _abstractive_summarization(
        self,
        content: str,
        length: str,
        focus_areas: Optional[List[str]]
    ) -> str:
        """
        Abstractive summarization using Groq
        """
        try:
            # Build prompt
            focus_text = ""
            if focus_areas:
                focus_text = f"Focus particularly on: {', '.join(focus_areas)}. "
            
            prompt = f"""
            You are a legal expert tasked with summarizing legal documents. 
            Create a comprehensive yet concise summary of approximately {length} words.
            {focus_text}
            
            Include:
            - Key legal issues and holdings
            - Important facts and procedural history
            - Court's reasoning and conclusions
            - Legal precedents or statutes cited
            
            Legal Document:
            {content}
            
            Summary:
            """
            
            # Call Groq API
            response = await self.groq_client.chat.completions.create(
                model="mixtral-8x7b-32768",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a legal expert specializing in case analysis and summarization."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=min(800, int(int(length) * 1.5)),
                temperature=0.3
            )
            
            summary = response.choices[0].message.content.strip()
            return summary
            
        except Exception as e:
            logger.error(f"Abstractive summarization failed: {e}")
            return ""
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences using legal-aware patterns"""
        # Legal-specific sentence boundaries
        text = re.sub(r'(\w+)\s*v\.\s*(\w+)', r'\1 v. \2', text)  # Case names
        text = re.sub(r'(\d+)\s*U\.S\.\s*(\d+)', r'\1 U.S. \2', text)  # Citations
        
        # Split on sentence boundaries
        sentences = re.split(r'(?<=[.!?])\s+(?=[A-Z])', text)
        
        # Filter out very short or long sentences
        filtered = []
        for sentence in sentences:
            sentence = sentence.strip()
            if 10 <= len(sentence) <= 500 and not sentence.isupper():
                filtered.append(sentence)
        
        return filtered
    
    def _calculate_legal_importance(self, sentence: str) -> float:
        """Calculate legal importance score for a sentence"""
        importance_keywords = {
            'high': ['held', 'holding', 'conclude', 'decision', 'ruling', 'judgment', 'order'],
            'medium': ['court', 'plaintiff', 'defendant', 'evidence', 'statute', 'law'],
            'low': ['background', 'procedural', 'factual', 'context']
        }
        
        sentence_lower = sentence.lower()
        score = 0.0
        
        for keyword in importance_keywords['high']:
            if keyword in sentence_lower:
                score += 2.0
        
        for keyword in importance_keywords['medium']:
            if keyword in sentence_lower:
                score += 1.0
        
        for keyword in importance_keywords['low']:
            if keyword in sentence_lower:
                score += 0.5
        
        return score
    
    def _calculate_focus_score(self, sentence: str, focus_areas: List[str]) -> float:
        """Calculate focus area relevance score"""
        sentence_lower = sentence.lower()
        score = 0.0
        
        for focus_area in focus_areas:
            if focus_area.lower() in sentence_lower:
                score += 3.0
        
        return score
    
    async def _get_case_content(self, case_id: str) -> Optional[str]:
        """Retrieve full case content from MongoDB"""
        try:
            from app.config.database import db_manager
            collection = db_manager.get_cases_collection()
            
            case_doc = await collection.find_one(
                {'case_id': case_id},
                {'cleaned_content': 1, 'content': 1}
            )
            
            if case_doc:
                return case_doc.get('cleaned_content') or case_doc.get('content', '')
            
            return None
            
        except Exception as e:
            logger.error(f"Failed to get case content for {case_id}: {e}")
            return None
