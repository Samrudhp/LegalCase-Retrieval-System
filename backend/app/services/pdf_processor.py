"""
PDF processing service for legal documents
Handles PDF extraction, cleaning, and metadata extraction with multiple parsing methods
"""

import os
import io
from typing import Dict, List, Optional, Tuple
import PyPDF2
import pdfplumber
import pytesseract
from PIL import Image
import fitz  # PyMuPDF for better PDF handling
import asyncio
from concurrent.futures import ThreadPoolExecutor

from app.utils.text_cleaner import TextCleaner
from app.utils.metadata_extractor import MetadataExtractor
from app.utils.logger import setup_logger
from app.config.settings import settings

logger = setup_logger()

class PDFProcessor:
    """PDF processing with multiple extraction methods and error handling"""
    
    def __init__(self):
        self.text_cleaner = TextCleaner()
        self.metadata_extractor = MetadataExtractor()
        self.executor = ThreadPoolExecutor(max_workers=settings.MAX_WORKERS)
    
    async def process_pdf(self, file_path: str, filename: str = None) -> Dict:
        """
        Process a PDF file completely
        
        Args:
            file_path: Path to PDF file
            filename: Optional filename override
            
        Returns:
            Dictionary containing processed data
        """
        if not filename:
            filename = os.path.basename(file_path)
        
        logger.info(f"Processing PDF: {filename}")
        
        try:
            # Extract text using multiple methods
            text_content = await self._extract_text_multi_method(file_path)
            
            if not text_content.strip():
                logger.warning(f"No text extracted from {filename}")
                return self._create_empty_result(filename, "No text could be extracted")
            
            # Clean the text
            cleaned_text = self.text_cleaner.clean_text(text_content)
            
            # Extract metadata
            metadata = self.metadata_extractor.extract_metadata(cleaned_text, filename)
            
            # Extract sections
            sections = self.text_cleaner.extract_sections(cleaned_text)
            
            # Generate case ID
            case_id = self._generate_case_id(filename, metadata)
            
            result = {
                'case_id': case_id,
                'filename': filename,
                'title': self._extract_title(cleaned_text, metadata),
                'content': text_content,
                'cleaned_content': cleaned_text,
                'metadata': metadata,
                'sections': sections,
                'processing_status': 'success',
                'pages_processed': self._count_pages(file_path),
            }
            
            logger.info(f"Successfully processed PDF: {filename}")
            return result
            
        except Exception as e:
            logger.error(f"Failed to process PDF {filename}: {e}")
            return self._create_empty_result(filename, str(e))
    
    async def _extract_text_multi_method(self, file_path: str) -> str:
        """Extract text using multiple methods with fallbacks"""
        
        # Method 1: Try pdfplumber (best for structured PDFs)
        try:
            text = await self._extract_with_pdfplumber(file_path)
            if text and len(text.strip()) > 100:  # Minimum content threshold
                logger.debug(f"Extracted text with pdfplumber: {len(text)} chars")
                return text
        except Exception as e:
            logger.warning(f"pdfplumber extraction failed: {e}")
        
        # Method 2: Try PyMuPDF (good for complex layouts)
        try:
            text = await self._extract_with_pymupdf(file_path)
            if text and len(text.strip()) > 100:
                logger.debug(f"Extracted text with PyMuPDF: {len(text)} chars")
                return text
        except Exception as e:
            logger.warning(f"PyMuPDF extraction failed: {e}")
        
        # Method 3: Try PyPDF2 (basic extraction)
        try:
            text = await self._extract_with_pypdf2(file_path)
            if text and len(text.strip()) > 100:
                logger.debug(f"Extracted text with PyPDF2: {len(text)} chars")
                return text
        except Exception as e:
            logger.warning(f"PyPDF2 extraction failed: {e}")
        
        # Method 4: OCR with Tesseract (last resort)
        try:
            text = await self._extract_with_ocr(file_path)
            if text and len(text.strip()) > 50:
                logger.debug(f"Extracted text with OCR: {len(text)} chars")
                return text
        except Exception as e:
            logger.warning(f"OCR extraction failed: {e}")
        
        return ""
    
    async def _extract_with_pdfplumber(self, file_path: str) -> str:
        """Extract text using pdfplumber"""
        def extract():
            text_parts = []
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
            return '\n'.join(text_parts)
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, extract)
    
    async def _extract_with_pymupdf(self, file_path: str) -> str:
        """Extract text using PyMuPDF"""
        def extract():
            text_parts = []
            pdf_document = fitz.open(file_path)
            for page_num in range(pdf_document.page_count):
                page = pdf_document[page_num]
                text_parts.append(page.get_text())
            pdf_document.close()
            return '\n'.join(text_parts)
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, extract)
    
    async def _extract_with_pypdf2(self, file_path: str) -> str:
        """Extract text using PyPDF2"""
        def extract():
            text_parts = []
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text_parts.append(page.extract_text())
            return '\n'.join(text_parts)
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, extract)
    
    async def _extract_with_ocr(self, file_path: str) -> str:
        """Extract text using OCR with Tesseract"""
        def extract():
            text_parts = []
            pdf_document = fitz.open(file_path)
            
            for page_num in range(min(pdf_document.page_count, 10)):  # Limit OCR pages
                page = pdf_document[page_num]
                pix = page.get_pixmap()
                img_data = pix.tobytes("png")
                
                # Convert to PIL Image
                image = Image.open(io.BytesIO(img_data))
                
                # OCR with Tesseract
                ocr_text = pytesseract.image_to_string(image, config='--psm 6')
                if ocr_text.strip():
                    text_parts.append(ocr_text)
            
            pdf_document.close()
            return '\n'.join(text_parts)
        
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(self.executor, extract)
    
    def _count_pages(self, file_path: str) -> int:
        """Count pages in PDF"""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                return len(pdf_reader.pages)
        except:
            return 0
    
    def _generate_case_id(self, filename: str, metadata: Dict) -> str:
        """Generate unique case ID"""
        # Use case number if available
        if metadata.get('case_number'):
            return f"case_{metadata['case_number'].replace(' ', '_')}"
        
        # Use filename as fallback
        base_name = os.path.splitext(filename)[0]
        return f"case_{base_name.replace(' ', '_').replace('-', '_')}"
    
    def _extract_title(self, text: str, metadata: Dict) -> str:
        """Extract or generate document title"""
        # Try to use case information from metadata
        if metadata.get('parties'):
            parties = metadata['parties']
            if parties.get('plaintiff') and parties.get('defendant'):
                plaintiff = parties['plaintiff'][0] if parties['plaintiff'] else 'Unknown'
                defendant = parties['defendant'][0] if parties['defendant'] else 'Unknown'
                return f"{plaintiff} v. {defendant}"
        
        # Extract title from first lines of text
        lines = text.split('\n')[:10]
        for line in lines:
            line = line.strip()
            if len(line) > 10 and len(line) < 200:
                # Check if it looks like a title
                if not line.isupper() and not line.islower():
                    return line
        
        return "Legal Document"
    
    def _create_empty_result(self, filename: str, error_msg: str) -> Dict:
        """Create empty result for failed processing"""
        return {
            'case_id': f"failed_{filename.replace('.', '_')}",
            'filename': filename,
            'title': f"Failed: {filename}",
            'content': "",
            'cleaned_content': "",
            'metadata': {},
            'sections': {},
            'processing_status': 'failed',
            'error_message': error_msg,
            'pages_processed': 0,
        }
    
    async def process_multiple_pdfs(
        self, 
        file_paths: List[str], 
        batch_size: int = None
    ) -> List[Dict]:
        """
        Process multiple PDFs in batches
        
        Args:
            file_paths: List of PDF file paths
            batch_size: Number of files to process in parallel
            
        Returns:
            List of processed results
        """
        if not batch_size:
            batch_size = settings.BATCH_SIZE
        
        results = []
        total_files = len(file_paths)
        
        logger.info(f"Processing {total_files} PDFs in batches of {batch_size}")
        
        for i in range(0, total_files, batch_size):
            batch = file_paths[i:i + batch_size]
            batch_results = await asyncio.gather(
                *[self.process_pdf(file_path) for file_path in batch],
                return_exceptions=True
            )
            
            # Handle exceptions in results
            for j, result in enumerate(batch_results):
                if isinstance(result, Exception):
                    logger.error(f"Failed to process {batch[j]}: {result}")
                    results.append(self._create_empty_result(
                        os.path.basename(batch[j]), 
                        str(result)
                    ))
                else:
                    results.append(result)
            
            logger.info(f"Processed batch {i//batch_size + 1}/{(total_files-1)//batch_size + 1}")
        
        successful = len([r for r in results if r.get('processing_status') == 'success'])
        logger.info(f"Successfully processed {successful}/{total_files} PDFs")
        
        return results
    
    def validate_pdf(self, file_path: str) -> Tuple[bool, str]:
        """
        Validate if file is a readable PDF
        
        Args:
            file_path: Path to PDF file
            
        Returns:
            Tuple of (is_valid, error_message)
        """
        try:
            # Check file exists
            if not os.path.exists(file_path):
                return False, "File does not exist"
            
            # Check file extension
            if not file_path.lower().endswith('.pdf'):
                return False, "File is not a PDF"
            
            # Try to open with PyPDF2
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                if len(pdf_reader.pages) == 0:
                    return False, "PDF has no pages"
            
            return True, "Valid PDF"
            
        except Exception as e:
            return False, f"PDF validation failed: {e}"
