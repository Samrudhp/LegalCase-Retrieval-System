"""
Initialize FAISS index and ingest 50,000 PDFs with batch processing and multiprocessing
"""

import os
import asyncio
import time
from pathlib import Path
from typing import List
import multiprocessing as mp
from concurrent.futures import ProcessPoolExecutor
import signal
import sys

# Add the parent directory to the path so we can import from app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.pdf_processor import PDFProcessor
from app.services.embedding_service import EmbeddingService
from app.config.database import init_database, db_manager
from app.config.settings import settings
from app.utils.logger import setup_logger

logger = setup_logger()

class FAISSInitializer:
    """Initialize FAISS index and process large datasets of PDFs"""
    
    def __init__(self):
        self.pdf_processor = PDFProcessor()
        self.embedding_service = EmbeddingService()
        self.processed_count = 0
        self.failed_count = 0
        self.skipped_count = 0
        self.start_time = None
    
    async def initialize_and_ingest(
        self,
        data_directory: str = None,
        batch_size: int = None,
        max_workers: int = None,
        skip_existing: bool = True
    ):
        """
        Initialize FAISS and ingest PDFs from data directory
        
        Args:
            data_directory: Directory containing PDF files
            batch_size: Number of files to process per batch
            max_workers: Number of parallel workers
            skip_existing: Skip files already in database
        """
        self.start_time = time.time()
        
        try:
            # Use settings defaults if not provided
            if not data_directory:
                data_directory = settings.CASES_DIR
            if not batch_size:
                batch_size = settings.BATCH_SIZE
            if not max_workers:
                max_workers = settings.MAX_WORKERS
            
            logger.info("Starting FAISS initialization and PDF ingestion")
            logger.info(f"Data directory: {data_directory}")
            logger.info(f"Batch size: {batch_size}")
            logger.info(f"Max workers: {max_workers}")
            
            # Initialize database connection
            await init_database()
            logger.info("Database connection established")
            
            # Clear FAISS index if starting fresh
            if not skip_existing:
                self.embedding_service.clear_index()
                logger.info("FAISS index cleared for fresh start")
            
            # Find all PDF files
            pdf_files = self._find_pdf_files(data_directory)
            total_files = len(pdf_files)
            
            if total_files == 0:
                logger.warning(f"No PDF files found in {data_directory}")
                return
            
            logger.info(f"Found {total_files} PDF files to process")
            
            # Filter existing files if skip_existing is True
            if skip_existing:
                pdf_files = await self._filter_existing_files(pdf_files)
                logger.info(f"After filtering existing files: {len(pdf_files)} files to process")
            
            if not pdf_files:
                logger.info("No new files to process")
                return
            
            # Process files in batches
            await self._process_files_in_batches(pdf_files, batch_size, max_workers)
            
            # Final save of FAISS index
            self.embedding_service.save_index()
            logger.info("FAISS index saved successfully")
            
            # Print final statistics
            self._print_final_statistics(total_files)
            
        except KeyboardInterrupt:
            logger.info("Process interrupted by user")
            await self._graceful_shutdown()
        except Exception as e:
            logger.error(f"Initialization failed: {e}")
            raise
    
    def _find_pdf_files(self, directory: str) -> List[str]:
        """Find all PDF files in directory and subdirectories"""
        pdf_files = []
        
        for root, dirs, files in os.walk(directory):
            for file in files:
                if file.lower().endswith('.pdf'):
                    pdf_files.append(os.path.join(root, file))
        
        return sorted(pdf_files)
    
    async def _filter_existing_files(self, pdf_files: List[str]) -> List[str]:
        """Filter out files that are already processed"""
        filtered_files = []
        
        for file_path in pdf_files:
            case_id = self._generate_case_id_from_path(file_path)
            if not await self._case_exists(case_id):
                filtered_files.append(file_path)
        
        return filtered_files
    
    async def _process_files_in_batches(
        self,
        pdf_files: List[str],
        batch_size: int,
        max_workers: int
    ):
        """Process PDF files in batches with multiprocessing"""
        total_files = len(pdf_files)
        num_batches = (total_files + batch_size - 1) // batch_size
        
        logger.info(f"Processing {total_files} files in {num_batches} batches")
        
        for batch_num in range(num_batches):
            start_idx = batch_num * batch_size
            end_idx = min(start_idx + batch_size, total_files)
            batch_files = pdf_files[start_idx:end_idx]
            
            logger.info(f"Processing batch {batch_num + 1}/{num_batches} ({len(batch_files)} files)")
            
            # Process batch
            batch_results = await self._process_batch(batch_files, max_workers)
            
            # Store successful results
            successful_results = [r for r in batch_results if r and r.get('processing_status') == 'success']
            
            if successful_results:
                await self._store_batch_results(successful_results)
            
            # Update counters
            self.processed_count += len(successful_results)
            self.failed_count += len(batch_results) - len(successful_results)
            
            # Progress update
            elapsed_time = time.time() - self.start_time
            avg_time_per_file = elapsed_time / max(1, self.processed_count + self.failed_count)
            remaining_files = total_files - (self.processed_count + self.failed_count)
            estimated_remaining_time = remaining_files * avg_time_per_file
            
            logger.info(
                f"Batch {batch_num + 1} completed. "
                f"Progress: {self.processed_count + self.failed_count}/{total_files} "
                f"({((self.processed_count + self.failed_count) / total_files * 100):.1f}%). "
                f"Success: {self.processed_count}, Failed: {self.failed_count}. "
                f"Estimated remaining time: {estimated_remaining_time / 3600:.1f} hours"
            )
    
    async def _process_batch(self, batch_files: List[str], max_workers: int) -> List[dict]:
        """Process a batch of files using multiprocessing"""
        
        # For very small batches, process sequentially
        if len(batch_files) <= 2:
            results = []
            for file_path in batch_files:
                try:
                    result = await self.pdf_processor.process_pdf(file_path)
                    results.append(result)
                except Exception as e:
                    logger.error(f"Failed to process {file_path}: {e}")
                    results.append(None)
            return results
        
        # Use process pool for larger batches
        loop = asyncio.get_event_loop()
        
        # Limit workers to avoid overwhelming the system
        num_workers = min(max_workers, len(batch_files), mp.cpu_count())
        
        with ProcessPoolExecutor(max_workers=num_workers) as executor:
            # Submit all files for processing
            futures = [
                loop.run_in_executor(executor, process_single_pdf_sync, file_path)
                for file_path in batch_files
            ]
            
            # Wait for all to complete
            results = await asyncio.gather(*futures, return_exceptions=True)
            
            # Handle exceptions
            processed_results = []
            for i, result in enumerate(results):
                if isinstance(result, Exception):
                    logger.error(f"Failed to process {batch_files[i]}: {result}")
                    processed_results.append(None)
                else:
                    processed_results.append(result)
            
            return processed_results
    
    async def _store_batch_results(self, results: List[dict]):
        """Store batch results in MongoDB and FAISS"""
        try:
            # Generate embeddings for all results
            contents = [result['cleaned_content'] for result in results]
            embeddings = await self.embedding_service.generate_embeddings_batch(contents)
            
            # Prepare case embeddings for FAISS
            case_embeddings = []
            documents_for_mongo = []
            
            for result, embedding in zip(results, embeddings):
                # Add embedding to result
                result['embedding_vector'] = embedding.tolist()
                
                # Prepare for FAISS
                case_embeddings.append((result['case_id'], embedding))
                
                # Prepare document for MongoDB
                doc = {
                    'case_id': result['case_id'],
                    'title': result['title'],
                    'content': result['content'],
                    'cleaned_content': result['cleaned_content'],
                    'metadata': result.get('metadata', {}),
                    'sections': result.get('sections', {}),
                    'created_at': result.get('created_at'),
                    'updated_at': result.get('updated_at')
                }
                documents_for_mongo.append(doc)
            
            # Store in MongoDB
            if documents_for_mongo:
                collection = db_manager.get_cases_collection()
                await collection.insert_many(documents_for_mongo)
                logger.debug(f"Stored {len(documents_for_mongo)} documents in MongoDB")
            
            # Add to FAISS index
            if case_embeddings:
                await self.embedding_service.add_batch_to_index(case_embeddings)
                logger.debug(f"Added {len(case_embeddings)} embeddings to FAISS index")
        
        except Exception as e:
            logger.error(f"Failed to store batch results: {e}")
            raise
    
    def _generate_case_id_from_path(self, file_path: str) -> str:
        """Generate case ID from file path"""
        filename = os.path.basename(file_path)
        base_name = os.path.splitext(filename)[0]
        return f"case_{base_name.replace(' ', '_').replace('-', '_')}"
    
    async def _case_exists(self, case_id: str) -> bool:
        """Check if case already exists in MongoDB"""
        try:
            collection = db_manager.get_cases_collection()
            count = await collection.count_documents({'case_id': case_id})
            return count > 0
        except:
            return False
    
    def _print_final_statistics(self, total_files: int):
        """Print final processing statistics"""
        elapsed_time = time.time() - self.start_time
        
        logger.info("=" * 60)
        logger.info("FINAL PROCESSING STATISTICS")
        logger.info("=" * 60)
        logger.info(f"Total files found: {total_files}")
        logger.info(f"Successfully processed: {self.processed_count}")
        logger.info(f"Failed processing: {self.failed_count}")
        logger.info(f"Skipped (existing): {self.skipped_count}")
        logger.info(f"Total processing time: {elapsed_time / 3600:.2f} hours")
        logger.info(f"Average time per file: {elapsed_time / max(1, self.processed_count + self.failed_count):.2f} seconds")
        logger.info(f"Files per hour: {(self.processed_count + self.failed_count) / (elapsed_time / 3600):.1f}")
        
        # FAISS statistics
        faiss_stats = self.embedding_service.get_index_stats()
        logger.info(f"FAISS index vectors: {faiss_stats['total_vectors']}")
        logger.info("=" * 60)
    
    async def _graceful_shutdown(self):
        """Graceful shutdown on interruption"""
        logger.info("Performing graceful shutdown...")
        
        # Save current progress
        try:
            self.embedding_service.save_index()
            logger.info("FAISS index saved")
        except Exception as e:
            logger.error(f"Failed to save FAISS index: {e}")
        
        # Print current statistics
        if self.start_time:
            elapsed_time = time.time() - self.start_time
            logger.info(f"Processed {self.processed_count} files before interruption")
            logger.info(f"Runtime: {elapsed_time / 3600:.2f} hours")

def process_single_pdf_sync(file_path: str) -> dict:
    """
    Synchronous PDF processing function for multiprocessing
    Note: This function runs in a separate process
    """
    import asyncio
    
    # Create new event loop for this process
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    
    try:
        # Import here to avoid issues with multiprocessing
        from app.services.pdf_processor import PDFProcessor
        
        processor = PDFProcessor()
        filename = os.path.basename(file_path)
        
        # Run the async function in this process's event loop
        result = loop.run_until_complete(processor.process_pdf(file_path, filename))
        return result
    
    except Exception as e:
        return {
            'case_id': f"failed_{os.path.basename(file_path)}",
            'filename': os.path.basename(file_path),
            'processing_status': 'failed',
            'error_message': str(e)
        }
    finally:
        loop.close()

async def main():
    """Main function to run the initialization"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Initialize FAISS index and ingest PDFs")
    parser.add_argument(
        "--data-dir", 
        default=settings.CASES_DIR,
        help=f"Directory containing PDF files (default: {settings.CASES_DIR})"
    )
    parser.add_argument(
        "--batch-size", 
        type=int, 
        default=settings.BATCH_SIZE,
        help=f"Batch size for processing (default: {settings.BATCH_SIZE})"
    )
    parser.add_argument(
        "--max-workers", 
        type=int, 
        default=settings.MAX_WORKERS,
        help=f"Maximum number of parallel workers (default: {settings.MAX_WORKERS})"
    )
    parser.add_argument(
        "--skip-existing", 
        action="store_true", 
        default=True,
        help="Skip files already processed (default: True)"
    )
    parser.add_argument(
        "--fresh-start", 
        action="store_true",
        help="Clear existing index and start fresh"
    )
    
    args = parser.parse_args()
    
    # Ensure data directory exists
    if not os.path.exists(args.data_dir):
        logger.error(f"Data directory does not exist: {args.data_dir}")
        logger.info(f"Please create the directory and add PDF files to process")
        logger.info(f"Example: mkdir -p {args.data_dir}")
        return
    
    # Override skip_existing if fresh_start is requested
    if args.fresh_start:
        args.skip_existing = False
        logger.info("Fresh start requested - will reprocess all files")
    
    # Initialize and run
    initializer = FAISSInitializer()
    
    try:
        await initializer.initialize_and_ingest(
            data_directory=args.data_dir,
            batch_size=args.batch_size,
            max_workers=args.max_workers,
            skip_existing=args.skip_existing
        )
        logger.info("Initialization completed successfully!")
        
    except Exception as e:
        logger.error(f"Initialization failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    # Handle Ctrl+C gracefully
    def signal_handler(sig, frame):
        logger.info("Interrupt signal received")
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    # Run the main function
    asyncio.run(main())
