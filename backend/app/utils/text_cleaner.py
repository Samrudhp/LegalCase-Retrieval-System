"""
Text cleaning utilities for legal documents
"""

import re
import string
from typing import List, Dict, Any
import spacy
from app.config.settings import settings
from app.utils.logger import setup_logger

logger = setup_logger()

class TextCleaner:
    """Text cleaning utilities for legal documents"""
    
    def __init__(self):
        try:
            self.nlp = spacy.load(settings.SPACY_MODEL)
        except OSError:
            logger.warning(f"SpaCy model {settings.SPACY_MODEL} not found, using basic cleaning")
            self.nlp = None
    
    def clean_text(self, text: str, remove_boilerplate: bool = True) -> str:
        """
        Clean legal document text
        
        Args:
            text: Raw text to clean
            remove_boilerplate: Whether to remove boilerplate text
            
        Returns:
            Cleaned text
        """
        if not text:
            return ""
        
        # Basic cleaning
        text = self._basic_clean(text)
        
        # Remove boilerplate if requested
        if remove_boilerplate:
            text = self._remove_boilerplate(text)
        
        # Advanced cleaning with spaCy if available
        if self.nlp:
            text = self._advanced_clean(text)
        
        return text.strip()
    
    def _basic_clean(self, text: str) -> str:
        """Basic text cleaning"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove special characters but keep legal punctuation
        text = re.sub(r'[^\w\s\.\,\;\:\!\?\-\(\)\[\]\"\'\$\%\&]', ' ', text)
        
        # Fix common OCR errors
        text = self._fix_ocr_errors(text)
        
        # Remove URLs
        text = re.sub(r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+', '', text)
        
        # Remove email addresses
        text = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '', text)
        
        return text
    
    def _fix_ocr_errors(self, text: str) -> str:
        """Fix common OCR errors in legal documents"""
        # Common OCR substitutions
        ocr_fixes = {
            r'\bl\b': 'I',  # lowercase l -> I
            r'\bO\b': '0',  # uppercase O -> 0 in certain contexts
            r'rn': 'm',     # rn -> m
            r'li': 'h',     # li -> h in certain contexts
            r'\bf\b': 't',  # f -> t in certain contexts
        }
        
        for pattern, replacement in ocr_fixes.items():
            text = re.sub(pattern, replacement, text)
        
        return text
    
    def _remove_boilerplate(self, text: str) -> str:
        """Remove common boilerplate text from legal documents"""
        # Patterns for common boilerplate
        boilerplate_patterns = [
            r'ELECTRONICALLY FILED.*?STATE OF.*?',
            r'Filed with the Clerk of.*?',
            r'This document is an electronic filing.*?',
            r'The following constitutes the order of the Court.*?',
            r'Attorney for.*?Bar No\..*?',
            r'Address:.*?Phone:.*?Email:.*?',
            r'CERTIFICATE OF SERVICE.*?',
            r'I hereby certify.*?',
            r'Page \d+ of \d+',
            r'Case No\..*?\n',
            r'COMES NOW.*?and respectfully.*?',
        ]
        
        for pattern in boilerplate_patterns:
            text = re.sub(pattern, '', text, flags=re.IGNORECASE | re.DOTALL)
        
        return text
    
    def _advanced_clean(self, text: str) -> str:
        """Advanced cleaning using spaCy"""
        try:
            doc = self.nlp(text)
            
            # Remove stop words and punctuation while preserving legal terms
            legal_terms = {'plaintiff', 'defendant', 'court', 'judge', 'attorney', 
                          'motion', 'order', 'statute', 'regulation', 'rule', 'law'}
            
            tokens = []
            for token in doc:
                if (not token.is_stop and not token.is_punct) or token.text.lower() in legal_terms:
                    tokens.append(token.text)
            
            return ' '.join(tokens)
            
        except Exception as e:
            logger.warning(f"Advanced cleaning failed: {e}")
            return text
    
    def extract_sections(self, text: str) -> Dict[str, str]:
        """Extract different sections from legal documents"""
        sections = {}
        
        # Common legal document sections
        section_patterns = {
            'facts': r'FACTS?[:\n](.*?)(?=PROCEDURAL|DISCUSSION|ANALYSIS|CONCLUSION|\Z)',
            'procedural_history': r'PROCEDURAL HISTORY[:\n](.*?)(?=FACTS|DISCUSSION|ANALYSIS|CONCLUSION|\Z)',
            'discussion': r'DISCUSSION[:\n](.*?)(?=CONCLUSION|ORDER|\Z)',
            'analysis': r'ANALYSIS[:\n](.*?)(?=CONCLUSION|ORDER|\Z)',
            'conclusion': r'CONCLUSION[:\n](.*?)(?=ORDER|\Z)',
            'order': r'ORDER[:\n](.*?)(?=\Z)',
        }
        
        for section_name, pattern in section_patterns.items():
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                sections[section_name] = self.clean_text(match.group(1))
        
        return sections
    
    def anonymize_text(self, text: str) -> str:
        """Anonymize sensitive information for GDPR compliance"""
        if not settings.ANONYMIZE_DATA:
            return text
        
        # Anonymize names (simple pattern-based approach)
        text = re.sub(r'\b[A-Z][a-z]+ [A-Z][a-z]+\b', '[NAME]', text)
        
        # Anonymize social security numbers
        text = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[SSN]', text)
        
        # Anonymize phone numbers
        text = re.sub(r'\b\d{3}-\d{3}-\d{4}\b', '[PHONE]', text)
        
        # Anonymize addresses (basic pattern)
        text = re.sub(r'\b\d+\s+[A-Za-z\s]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b', '[ADDRESS]', text)
        
        return text
