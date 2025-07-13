"""
Intent detection using LegalBERT for chat functionality
"""

from transformers import AutoTokenizer, AutoModel
import torch
import numpy as np
from typing import Dict, List, Tuple
from sklearn.metrics.pairwise import cosine_similarity
from app.config.settings import settings
from app.utils.logger import setup_logger

logger = setup_logger()

class IntentDetector:
    """LegalBERT-based intent detection for legal chat queries"""
    
    def __init__(self):
        self.tokenizer = None
        self.model = None
        self.intent_embeddings = {}
        self.intent_labels = [
            'case_search',
            'legal_advice',
            'document_analysis',
            'precedent_search',
            'statute_lookup',
            'procedure_query',
            'general_question',
            'summarization_request',
            'question_generation',
            'chat_conversation'
        ]
        self._load_model()
        self._create_intent_embeddings()
    
    def _load_model(self):
        """Load LegalBERT model and tokenizer"""
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(settings.EMBEDDING_MODEL)
            self.model = AutoModel.from_pretrained(settings.EMBEDDING_MODEL)
            self.model.eval()
            logger.info(f"Loaded LegalBERT model: {settings.EMBEDDING_MODEL}")
        except Exception as e:
            logger.error(f"Failed to load LegalBERT model: {e}")
            # Fallback to basic rule-based detection
            self.tokenizer = None
            self.model = None
    
    def _create_intent_embeddings(self):
        """Create embeddings for predefined intents"""
        if not self.model:
            return
        
        intent_descriptions = {
            'case_search': 'Find similar legal cases and precedents based on case facts',
            'legal_advice': 'Provide legal guidance and advice on legal matters',
            'document_analysis': 'Analyze and explain legal documents and their contents',
            'precedent_search': 'Search for legal precedents and case law',
            'statute_lookup': 'Look up statutes, regulations, and legal codes',
            'procedure_query': 'Ask about legal procedures and court processes',
            'general_question': 'General questions about law and legal concepts',
            'summarization_request': 'Summarize legal documents or cases',
            'question_generation': 'Generate questions about legal cases or documents',
            'chat_conversation': 'Conversational chat about legal topics'
        }
        
        try:
            for intent, description in intent_descriptions.items():
                embedding = self._get_embedding(description)
                self.intent_embeddings[intent] = embedding
            logger.info("Created intent embeddings successfully")
        except Exception as e:
            logger.error(f"Failed to create intent embeddings: {e}")
    
    def _get_embedding(self, text: str) -> np.ndarray:
        """Get embedding for text using LegalBERT"""
        if not self.model:
            return np.zeros(768)  # Default embedding size
        
        try:
            inputs = self.tokenizer(
                text, 
                return_tensors="pt", 
                truncation=True, 
                padding=True, 
                max_length=512
            )
            
            with torch.no_grad():
                outputs = self.model(**inputs)
                # Use mean pooling of last hidden states
                embeddings = outputs.last_hidden_state.mean(dim=1)
                return embeddings.squeeze().numpy()
        
        except Exception as e:
            logger.warning(f"Embedding generation failed: {e}")
            return np.zeros(768)
    
    def detect_intent(self, query: str) -> Tuple[str, float]:
        """
        Detect intent from user query
        
        Args:
            query: User query text
            
        Returns:
            Tuple of (intent_label, confidence_score)
        """
        if not self.model:
            return self._rule_based_intent_detection(query)
        
        try:
            # Get query embedding
            query_embedding = self._get_embedding(query)
            
            # Calculate similarities with intent embeddings
            similarities = {}
            for intent, intent_embedding in self.intent_embeddings.items():
                similarity = cosine_similarity(
                    [query_embedding], 
                    [intent_embedding]
                )[0][0]
                similarities[intent] = similarity
            
            # Get best match
            best_intent = max(similarities, key=similarities.get)
            confidence = similarities[best_intent]
            
            logger.debug(f"Intent detection: {best_intent} (confidence: {confidence:.3f})")
            
            return best_intent, confidence
            
        except Exception as e:
            logger.warning(f"Intent detection failed, using rule-based fallback: {e}")
            return self._rule_based_intent_detection(query)
    
    def _rule_based_intent_detection(self, query: str) -> Tuple[str, float]:
        """Fallback rule-based intent detection"""
        query_lower = query.lower()
        
        # Define keyword patterns for each intent
        intent_patterns = {
            'case_search': ['find case', 'similar case', 'search case', 'cases like', 'precedent'],
            'legal_advice': ['legal advice', 'what should i', 'can i', 'is it legal', 'rights'],
            'document_analysis': ['analyze document', 'explain document', 'what does this mean'],
            'precedent_search': ['precedent', 'case law', 'similar ruling', 'past case'],
            'statute_lookup': ['statute', 'law says', 'regulation', 'code section', 'usc'],
            'procedure_query': ['how to', 'procedure', 'process', 'steps', 'file'],
            'summarization_request': ['summarize', 'summary', 'brief overview', 'tldr'],
            'question_generation': ['generate questions', 'create questions', 'ask about'],
            'chat_conversation': ['hello', 'hi', 'thanks', 'thank you', 'help']
        }
        
        # Calculate scores based on keyword matches
        scores = {}
        for intent, keywords in intent_patterns.items():
            score = sum(1 for keyword in keywords if keyword in query_lower)
            if score > 0:
                scores[intent] = score / len(keywords)  # Normalize
        
        if scores:
            best_intent = max(scores, key=scores.get)
            confidence = scores[best_intent]
            return best_intent, confidence
        
        # Default to general question
        return 'general_question', 0.5
    
    def get_intent_suggestions(self, query: str, top_k: int = 3) -> List[Tuple[str, float]]:
        """Get top-k intent suggestions for a query"""
        if not self.model:
            intent, confidence = self._rule_based_intent_detection(query)
            return [(intent, confidence)]
        
        try:
            query_embedding = self._get_embedding(query)
            
            similarities = []
            for intent, intent_embedding in self.intent_embeddings.items():
                similarity = cosine_similarity(
                    [query_embedding], 
                    [intent_embedding]
                )[0][0]
                similarities.append((intent, similarity))
            
            # Sort by similarity and return top-k
            similarities.sort(key=lambda x: x[1], reverse=True)
            return similarities[:top_k]
            
        except Exception as e:
            logger.warning(f"Intent suggestions failed: {e}")
            intent, confidence = self._rule_based_intent_detection(query)
            return [(intent, confidence)]
    
    def is_legal_query(self, query: str) -> bool:
        """Determine if query is legal-related"""
        legal_keywords = [
            'law', 'legal', 'court', 'judge', 'attorney', 'lawyer', 'case', 'statute',
            'regulation', 'contract', 'liability', 'rights', 'plaintiff', 'defendant',
            'appeal', 'trial', 'verdict', 'judgment', 'precedent', 'jurisdiction'
        ]
        
        query_lower = query.lower()
        return any(keyword in query_lower for keyword in legal_keywords)
