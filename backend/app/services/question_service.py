"""
Question generation service using Groq for different types of legal questions
"""

from typing import List, Dict, Optional, Any
import asyncio
from groq import AsyncGroq
import random

from app.config.settings import settings
from app.utils.logger import setup_logger
from app.services.retrieval_service import RetrievalService

logger = setup_logger()

class QuestionService:
    """Question generation service for legal documents"""
    
    def __init__(self):
        self.groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)
        self.retrieval_service = RetrievalService()
    
    async def generate_common_questions(
        self,
        case_ids: Optional[List[str]] = None,
        text_content: Optional[str] = None,
        num_questions: int = 5,
        focus_areas: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate common legal questions focusing on basic legal elements
        
        Args:
            case_ids: List of case IDs to generate questions for
            text_content: Direct text content
            num_questions: Number of questions to generate
            focus_areas: Specific areas to focus on
            
        Returns:
            Dictionary containing generated questions and metadata
        """
        try:
            # Get content
            content = await self._get_content(case_ids, text_content)
            if not content:
                return self._empty_result("No content available for question generation")
            
            # Generate questions using Groq
            questions = await self._generate_questions_with_groq(
                content,
                "common",
                num_questions,
                focus_areas
            )
            
            return {
                'status': 'success',
                'questions': questions,
                'question_type': 'common',
                'sources': case_ids or ['uploaded_content'],
                'generation_metadata': {
                    'num_requested': num_questions,
                    'num_generated': len(questions),
                    'focus_areas': focus_areas
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to generate common questions: {e}")
            return self._empty_result(str(e))
    
    async def generate_rare_questions(
        self,
        case_ids: Optional[List[str]] = None,
        text_content: Optional[str] = None,
        num_questions: int = 5,
        focus_areas: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate rare, insightful questions focusing on niche legal aspects
        
        Args:
            case_ids: List of case IDs to generate questions for
            text_content: Direct text content
            num_questions: Number of questions to generate
            focus_areas: Specific areas to focus on
            
        Returns:
            Dictionary containing generated questions and metadata
        """
        try:
            # Get content
            content = await self._get_content(case_ids, text_content)
            if not content:
                return self._empty_result("No content available for question generation")
            
            # Generate questions using Groq
            questions = await self._generate_questions_with_groq(
                content,
                "rare",
                num_questions,
                focus_areas
            )
            
            return {
                'status': 'success',
                'questions': questions,
                'question_type': 'rare',
                'sources': case_ids or ['uploaded_content'],
                'generation_metadata': {
                    'num_requested': num_questions,
                    'num_generated': len(questions),
                    'focus_areas': focus_areas
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to generate rare questions: {e}")
            return self._empty_result(str(e))
    
    async def generate_unexpected_questions(
        self,
        case_ids: Optional[List[str]] = None,
        text_content: Optional[str] = None,
        num_questions: int = 5,
        focus_areas: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate unexpected, judge-like probing questions
        
        Args:
            case_ids: List of case IDs to generate questions for
            text_content: Direct text content
            num_questions: Number of questions to generate
            focus_areas: Specific areas to focus on
            
        Returns:
            Dictionary containing generated questions and metadata
        """
        try:
            # Get content
            content = await self._get_content(case_ids, text_content)
            if not content:
                return self._empty_result("No content available for question generation")
            
            # Generate questions using Groq
            questions = await self._generate_questions_with_groq(
                content,
                "unexpected",
                num_questions,
                focus_areas
            )
            
            return {
                'status': 'success',
                'questions': questions,
                'question_type': 'unexpected',
                'sources': case_ids or ['uploaded_content'],
                'generation_metadata': {
                    'num_requested': num_questions,
                    'num_generated': len(questions),
                    'focus_areas': focus_areas
                }
            }
            
        except Exception as e:
            logger.error(f"Failed to generate unexpected questions: {e}")
            return self._empty_result(str(e))
    
    async def _generate_questions_with_groq(
        self,
        content: str,
        question_type: str,
        num_questions: int,
        focus_areas: Optional[List[str]]
    ) -> List[Dict[str, Any]]:
        """
        Generate questions using Groq API based on question type
        """
        try:
            # Build prompt based on question type
            prompt = self._build_prompt(content, question_type, num_questions, focus_areas)
            
            # Call Groq API
            response = await self.groq_client.chat.completions.create(
                model="mixtral-8x7b-32768",
                messages=[
                    {
                        "role": "system",
                        "content": self._get_system_prompt(question_type)
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=1500,
                temperature=0.7 if question_type == "unexpected" else 0.5
            )
            
            # Parse response
            questions_text = response.choices[0].message.content.strip()
            questions = self._parse_questions_response(questions_text, question_type)
            
            return questions[:num_questions]  # Limit to requested number
            
        except Exception as e:
            logger.error(f"Failed to generate questions with Groq: {e}")
            return []
    
    def _build_prompt(
        self,
        content: str,
        question_type: str,
        num_questions: int,
        focus_areas: Optional[List[str]]
    ) -> str:
        """Build appropriate prompt for each question type"""
        
        # Truncate content if too long
        if len(content) > 3000:
            content = content[:3000] + "..."
        
        focus_text = ""
        if focus_areas:
            focus_text = f"Focus particularly on: {', '.join(focus_areas)}. "
        
        if question_type == "common":
            return f"""
            Based on the following legal document, generate {num_questions} common legal questions that focus on basic legal elements such as:
            - Statutes and regulations cited
            - Legal standards applied
            - Key facts and evidence
            - Parties' arguments
            - Court's holdings and reasoning
            
            {focus_text}
            
            Format each question as:
            Q: [Question text]
            Category: [Legal category]
            Difficulty: Basic
            
            Legal Document:
            {content}
            """
        
        elif question_type == "rare":
            return f"""
            Based on the following legal document, generate {num_questions} rare and insightful legal questions that explore:
            - Dissenting opinions and their reasoning
            - Procedural nuances and technicalities
            - Broader implications for legal doctrine
            - Interactions between multiple areas of law
            - Subtle distinctions in legal interpretation
            
            {focus_text}
            
            Format each question as:
            Q: [Question text]
            Category: [Legal category]
            Difficulty: Advanced
            
            Legal Document:
            {content}
            """
        
        else:  # unexpected
            return f"""
            Based on the following legal document, generate {num_questions} unexpected, judge-like probing questions that challenge assumptions and explore hypotheticals:
            - "What if" scenarios that test the limits of the ruling
            - Questions that challenge the parties' arguments
            - Hypothetical situations that could change the outcome
            - Probing questions about unstated assumptions
            - Questions that explore alternative legal theories
            
            {focus_text}
            
            Format each question as:
            Q: [Question text]
            Category: [Legal category]
            Difficulty: Expert
            
            Legal Document:
            {content}
            """
    
    def _get_system_prompt(self, question_type: str) -> str:
        """Get system prompt based on question type"""
        
        base_prompt = "You are a legal expert specializing in legal analysis and education."
        
        if question_type == "common":
            return f"{base_prompt} Generate clear, fundamental questions that help understand basic legal concepts and case elements."
        
        elif question_type == "rare":
            return f"{base_prompt} Generate sophisticated questions that reveal deep legal insights and explore complex procedural or doctrinal issues."
        
        else:  # unexpected
            return f"{base_prompt} Think like a probing judge who asks challenging questions to test arguments and explore hypothetical scenarios."
    
    def _parse_questions_response(self, response_text: str, question_type: str) -> List[Dict[str, Any]]:
        """Parse Groq response into structured questions"""
        questions = []
        
        # Split response into individual questions
        lines = response_text.split('\n')
        current_question = {}
        
        for line in lines:
            line = line.strip()
            
            if line.startswith('Q:'):
                if current_question.get('question'):
                    questions.append(current_question)
                
                current_question = {
                    'question': line[2:].strip(),
                    'category': 'General',
                    'difficulty': self._get_default_difficulty(question_type),
                    'type': question_type
                }
            
            elif line.startswith('Category:'):
                if current_question:
                    current_question['category'] = line[9:].strip()
            
            elif line.startswith('Difficulty:'):
                if current_question:
                    current_question['difficulty'] = line[11:].strip()
        
        # Add the last question
        if current_question.get('question'):
            questions.append(current_question)
        
        # If parsing failed, try simpler parsing
        if not questions:
            questions = self._simple_parse_questions(response_text, question_type)
        
        return questions
    
    def _simple_parse_questions(self, response_text: str, question_type: str) -> List[Dict[str, Any]]:
        """Simple fallback parsing for questions"""
        questions = []
        
        # Look for question patterns
        import re
        question_patterns = [
            r'\d+\.\s*(.+?\?)',
            r'Q\d*:?\s*(.+?\?)',
            r'-\s*(.+?\?)',
            r'•\s*(.+?\?)'
        ]
        
        for pattern in question_patterns:
            matches = re.findall(pattern, response_text, re.MULTILINE | re.DOTALL)
            for match in matches:
                question_text = match.strip()
                if len(question_text) > 10:  # Minimum question length
                    questions.append({
                        'question': question_text,
                        'category': self._classify_question_category(question_text),
                        'difficulty': self._get_default_difficulty(question_type),
                        'type': question_type
                    })
        
        return questions[:10]  # Limit to 10 questions max
    
    def _classify_question_category(self, question_text: str) -> str:
        """Classify question into legal category"""
        question_lower = question_text.lower()
        
        categories = {
            'Constitutional Law': ['constitutional', 'amendment', 'rights', 'due process'],
            'Criminal Law': ['criminal', 'prosecution', 'defense', 'guilty', 'sentence'],
            'Civil Procedure': ['motion', 'discovery', 'jurisdiction', 'venue', 'pleading'],
            'Contract Law': ['contract', 'agreement', 'breach', 'consideration'],
            'Tort Law': ['negligence', 'liability', 'damages', 'injury'],
            'Evidence': ['evidence', 'admissible', 'testimony', 'hearsay'],
            'Administrative Law': ['regulation', 'agency', 'administrative'],
            'Corporate Law': ['corporation', 'business', 'securities', 'merger']
        }
        
        for category, keywords in categories.items():
            if any(keyword in question_lower for keyword in keywords):
                return category
        
        return 'General'
    
    def _get_default_difficulty(self, question_type: str) -> str:
        """Get default difficulty based on question type"""
        difficulty_map = {
            'common': 'Basic',
            'rare': 'Advanced',
            'unexpected': 'Expert'
        }
        return difficulty_map.get(question_type, 'Intermediate')
    
    async def _get_content(
        self,
        case_ids: Optional[List[str]],
        text_content: Optional[str]
    ) -> Optional[str]:
        """Get content from case IDs or direct text"""
        
        if text_content:
            return text_content
        
        if case_ids:
            contents = []
            for case_id in case_ids:
                content = await self._get_case_content(case_id)
                if content:
                    contents.append(content)
            
            if contents:
                return '\n\n--- CASE SEPARATOR ---\n\n'.join(contents)
        
        return None
    
    async def _get_case_content(self, case_id: str) -> Optional[str]:
        """Retrieve case content from MongoDB"""
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
    
    def _empty_result(self, error_message: str) -> Dict[str, Any]:
        """Create empty result for error cases"""
        return {
            'status': 'error',
            'message': error_message,
            'questions': [],
            'question_type': '',
            'sources': [],
            'generation_metadata': {}
        }
