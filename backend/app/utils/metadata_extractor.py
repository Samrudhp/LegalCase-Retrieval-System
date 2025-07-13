"""
Metadata extraction utilities for legal documents
"""

import re
from datetime import datetime
from typing import Dict, List, Optional, Any
import spacy
from app.config.settings import settings
from app.utils.logger import setup_logger

logger = setup_logger()

class MetadataExtractor:
    """Extract metadata from legal documents using NER and regex"""
    
    def __init__(self):
        try:
            self.nlp = spacy.load(settings.SPACY_MODEL)
        except OSError:
            logger.warning(f"SpaCy model {settings.SPACY_MODEL} not found, using regex only")
            self.nlp = None
    
    def extract_metadata(self, text: str, filename: str = None) -> Dict[str, Any]:
        """
        Extract comprehensive metadata from legal document
        
        Args:
            text: Document text
            filename: Optional filename for additional context
            
        Returns:
            Dictionary containing extracted metadata
        """
        metadata = {
            'filename': filename,
            'extraction_date': datetime.now().isoformat(),
            'case_number': self._extract_case_number(text),
            'court': self._extract_court(text),
            'judge': self._extract_judge(text),
            'parties': self._extract_parties(text),
            'date': self._extract_date(text),
            'case_type': self._classify_case_type(text),
            'legal_topics': self._extract_legal_topics(text),
            'statutes': self._extract_statutes(text),
            'citations': self._extract_citations(text),
            'attorneys': self._extract_attorneys(text),
            'jurisdiction': self._extract_jurisdiction(text),
            'document_type': self._classify_document_type(text),
            'outcome': self._extract_outcome(text),
        }
        
        # Add NER entities if spaCy is available
        if self.nlp:
            ner_entities = self._extract_ner_entities(text)
            metadata.update(ner_entities)
        
        return metadata
    
    def _extract_case_number(self, text: str) -> Optional[str]:
        """Extract case number"""
        patterns = [
            r'Case No\.?\s*:?\s*([A-Z0-9\-]+)',
            r'Civil Action No\.?\s*:?\s*([A-Z0-9\-]+)',
            r'Criminal Case No\.?\s*:?\s*([A-Z0-9\-]+)',
            r'Docket No\.?\s*:?\s*([A-Z0-9\-]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return None
    
    def _extract_court(self, text: str) -> Optional[str]:
        """Extract court name"""
        patterns = [
            r'IN THE (.+?) COURT',
            r'UNITED STATES DISTRICT COURT FOR THE (.+?)(?:\n|$)',
            r'SUPERIOR COURT OF (.+?)(?:\n|$)',
            r'CIRCUIT COURT FOR (.+?)(?:\n|$)',
            r'COURT OF (.+?)(?:\n|$)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return None
    
    def _extract_judge(self, text: str) -> Optional[str]:
        """Extract judge name"""
        patterns = [
            r'(?:Judge|Justice|Magistrate Judge)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            r'Honorable\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            r'THE HONORABLE\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return None
    
    def _extract_parties(self, text: str) -> Dict[str, List[str]]:
        """Extract parties (plaintiff, defendant, etc.)"""
        parties = {'plaintiff': [], 'defendant': [], 'appellant': [], 'appellee': []}
        
        # Extract plaintiffs
        plaintiff_match = re.search(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+Plaintiff', text, re.IGNORECASE)
        if plaintiff_match:
            parties['plaintiff'].append(plaintiff_match.group(1).strip())
        
        # Extract defendants
        defendant_match = re.search(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+Defendant', text, re.IGNORECASE)
        if defendant_match:
            parties['defendant'].append(defendant_match.group(1).strip())
        
        # Extract appellants
        appellant_match = re.search(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+Appellant', text, re.IGNORECASE)
        if appellant_match:
            parties['appellant'].append(appellant_match.group(1).strip())
        
        # Extract appellees
        appellee_match = re.search(r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+Appellee', text, re.IGNORECASE)
        if appellee_match:
            parties['appellee'].append(appellee_match.group(1).strip())
        
        return parties
    
    def _extract_date(self, text: str) -> Optional[str]:
        """Extract document date"""
        date_patterns = [
            r'(?:Filed|Decided|Dated)[\s:]+([A-Za-z]+ \d{1,2},? \d{4})',
            r'(\d{1,2}/\d{1,2}/\d{4})',
            r'([A-Za-z]+ \d{1,2},? \d{4})',
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text)
            if match:
                return match.group(1).strip()
        
        return None
    
    def _classify_case_type(self, text: str) -> Optional[str]:
        """Classify the type of legal case"""
        case_types = {
            'criminal': ['criminal', 'prosecution', 'indictment', 'felony', 'misdemeanor'],
            'civil': ['civil action', 'damages', 'contract', 'tort', 'negligence'],
            'family': ['divorce', 'custody', 'marriage', 'adoption', 'domestic'],
            'corporate': ['corporation', 'securities', 'merger', 'business', 'commercial'],
            'constitutional': ['constitutional', 'amendment', 'rights', 'due process'],
            'tax': ['tax', 'irs', 'revenue', 'deduction', 'exemption'],
            'employment': ['employment', 'discrimination', 'harassment', 'wrongful termination'],
            'intellectual_property': ['patent', 'trademark', 'copyright', 'trade secret'],
            'bankruptcy': ['bankruptcy', 'debtor', 'creditor', 'discharge'],
            'immigration': ['immigration', 'deportation', 'asylum', 'visa'],
        }
        
        text_lower = text.lower()
        for case_type, keywords in case_types.items():
            if any(keyword in text_lower for keyword in keywords):
                return case_type
        
        return None
    
    def _extract_legal_topics(self, text: str) -> List[str]:
        """Extract legal topics and concepts"""
        legal_topics = []
        
        # Legal concepts to look for
        concepts = [
            'due process', 'equal protection', 'search and seizure', 'miranda rights',
            'probable cause', 'reasonable doubt', 'burden of proof', 'summary judgment',
            'injunctive relief', 'damages', 'liability', 'negligence', 'breach of contract',
            'jurisdiction', 'standing', 'statute of limitations', 'res judicata',
            'collateral estoppel', 'discovery', 'motion to dismiss', 'appeal',
        ]
        
        text_lower = text.lower()
        for concept in concepts:
            if concept in text_lower:
                legal_topics.append(concept)
        
        return legal_topics
    
    def _extract_statutes(self, text: str) -> List[str]:
        """Extract statute references"""
        statute_patterns = [
            r'\b\d+\s+U\.?S\.?C\.?\s+§?\s*\d+',  # US Code
            r'\bSection\s+\d+\s+of\s+[A-Za-z\s]+Act',
            r'\b\d+\s+C\.?F\.?R\.?\s+§?\s*\d+',  # Code of Federal Regulations
            r'\bRule\s+\d+',  # Federal Rules
        ]
        
        statutes = []
        for pattern in statute_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            statutes.extend(matches)
        
        return list(set(statutes))  # Remove duplicates
    
    def _extract_citations(self, text: str) -> List[str]:
        """Extract case citations"""
        citation_patterns = [
            r'\b\d+\s+[A-Z][a-z]*\.?\s+\d+',  # Basic citation pattern
            r'\b\d+\s+F\.\s*\d+d?\s+\d+',  # Federal Reporter
            r'\b\d+\s+U\.S\.\s+\d+',  # US Reports
            r'\b\d+\s+S\.\s*Ct\.\s+\d+',  # Supreme Court Reporter
        ]
        
        citations = []
        for pattern in citation_patterns:
            matches = re.findall(pattern, text)
            citations.extend(matches)
        
        return list(set(citations))  # Remove duplicates
    
    def _extract_attorneys(self, text: str) -> List[str]:
        """Extract attorney names"""
        attorney_patterns = [
            r'Attorney for [A-Za-z\s]+:\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)',
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+Esq\.',
            r'([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*),?\s+Attorney',
        ]
        
        attorneys = []
        for pattern in attorney_patterns:
            matches = re.findall(pattern, text)
            attorneys.extend(matches)
        
        return list(set(attorneys))  # Remove duplicates
    
    def _extract_jurisdiction(self, text: str) -> Optional[str]:
        """Extract jurisdiction information"""
        jurisdiction_patterns = [
            r'jurisdiction of (.+?)(?:\n|\.)',
            r'STATE OF ([A-Z]+)',
            r'DISTRICT OF ([A-Z\s]+)',
        ]
        
        for pattern in jurisdiction_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        
        return None
    
    def _classify_document_type(self, text: str) -> Optional[str]:
        """Classify the type of legal document"""
        doc_types = {
            'opinion': ['opinion', 'decision', 'ruling'],
            'motion': ['motion', 'petition', 'request'],
            'order': ['order', 'decree', 'judgment'],
            'brief': ['brief', 'memorandum', 'argument'],
            'complaint': ['complaint', 'petition', 'filing'],
            'transcript': ['transcript', 'proceeding', 'hearing'],
        }
        
        text_lower = text.lower()
        for doc_type, keywords in doc_types.items():
            if any(keyword in text_lower for keyword in keywords):
                return doc_type
        
        return None
    
    def _extract_outcome(self, text: str) -> Optional[str]:
        """Extract case outcome or disposition"""
        outcome_patterns = [
            r'(?:ORDERED|ADJUDGED|DECREED).*?that (.+?)(?:\.|$)',
            r'(?:IT IS HEREBY|NOW THEREFORE).*?that (.+?)(?:\.|$)',
            r'(?:JUDGMENT|VERDICT).*?for (.+?)(?:\.|$)',
        ]
        
        for pattern in outcome_patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
            if match:
                return match.group(1).strip()[:200]  # Limit length
        
        return None
    
    def _extract_ner_entities(self, text: str) -> Dict[str, List[str]]:
        """Extract named entities using spaCy"""
        entities = {
            'persons': [],
            'organizations': [],
            'locations': [],
            'dates': [],
            'money': [],
            'laws': [],
        }
        
        try:
            doc = self.nlp(text)
            
            for ent in doc.ents:
                if ent.label_ == "PERSON":
                    entities['persons'].append(ent.text)
                elif ent.label_ in ["ORG", "NORP"]:
                    entities['organizations'].append(ent.text)
                elif ent.label_ in ["GPE", "LOC"]:
                    entities['locations'].append(ent.text)
                elif ent.label_ == "DATE":
                    entities['dates'].append(ent.text)
                elif ent.label_ == "MONEY":
                    entities['money'].append(ent.text)
                elif ent.label_ == "LAW":
                    entities['laws'].append(ent.text)
            
            # Remove duplicates
            for key in entities:
                entities[key] = list(set(entities[key]))
            
        except Exception as e:
            logger.warning(f"NER extraction failed: {e}")
        
        return entities
