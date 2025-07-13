"""
Embedding service using LegalBERT and FAISS for vector storage
"""

import os
import numpy as np
import faiss
from typing import List, Dict, Optional, Tuple
from sentence_transformers import SentenceTransformer
import asyncio
from concurrent.futures import ThreadPoolExecutor
import pickle
import json

from app.config.settings import settings
from app.utils.logger import setup_logger

logger = setup_logger()

class EmbeddingService:
    """LegalBERT embedding generation and FAISS vector storage"""
    
    def __init__(self):
        self.model = None
        self.faiss_index = None
        self.case_id_mapping = {}  # Maps FAISS index to case_id
        self.executor = ThreadPoolExecutor(max_workers=settings.MAX_WORKERS)
        self._load_model()
        self._load_or_create_index()
    
    def _load_model(self):
        """Load LegalBERT sentence transformer model"""
        try:
            self.model = SentenceTransformer(settings.EMBEDDING_MODEL)
            logger.info(f"Loaded embedding model: {settings.EMBEDDING_MODEL}")
        except Exception as e:
            logger.error(f"Failed to load embedding model: {e}")
            raise
    
    def _load_or_create_index(self):
        """Load existing FAISS index or create new one"""
        index_path = settings.FAISS_INDEX_PATH
        mapping_path = index_path.replace('.index', '_mapping.pkl')
        
        try:
            if os.path.exists(index_path) and os.path.exists(mapping_path):
                # Load existing index
                self.faiss_index = faiss.read_index(index_path)
                with open(mapping_path, 'rb') as f:
                    self.case_id_mapping = pickle.load(f)
                logger.info(f"Loaded FAISS index with {self.faiss_index.ntotal} vectors")
            else:
                # Create new HNSW index
                self.faiss_index = faiss.IndexHNSWFlat(settings.FAISS_DIMENSION, 32)
                self.faiss_index.hnsw.efConstruction = 200
                self.faiss_index.hnsw.efSearch = 100
                self.case_id_mapping = {}
                logger.info("Created new HNSW FAISS index")
                
        except Exception as e:
            logger.error(f"Failed to load/create FAISS index: {e}")
            raise
    
    async def generate_embedding(self, text: str) -> np.ndarray:
        """
        Generate embedding for text using LegalBERT
        
        Args:
            text: Input text
            
        Returns:
            Embedding vector as numpy array
        """
        if not text or not text.strip():
            return np.zeros(settings.FAISS_DIMENSION, dtype=np.float32)
        
        try:
            # Run embedding generation in thread pool
            loop = asyncio.get_event_loop()
            embedding = await loop.run_in_executor(
                self.executor, 
                self._generate_embedding_sync, 
                text
            )
            return embedding
            
        except Exception as e:
            logger.error(f"Failed to generate embedding: {e}")
            return np.zeros(settings.FAISS_DIMENSION, dtype=np.float32)
    
    def _generate_embedding_sync(self, text: str) -> np.ndarray:
        """Synchronous embedding generation"""
        # Truncate text if too long
        max_length = 512
        if len(text.split()) > max_length:
            text = ' '.join(text.split()[:max_length])
        
        embedding = self.model.encode(text, convert_to_numpy=True)
        return embedding.astype(np.float32)
    
    async def generate_embeddings_batch(self, texts: List[str]) -> List[np.ndarray]:
        """
        Generate embeddings for multiple texts in batch
        
        Args:
            texts: List of input texts
            
        Returns:
            List of embedding vectors
        """
        if not texts:
            return []
        
        try:
            loop = asyncio.get_event_loop()
            embeddings = await loop.run_in_executor(
                self.executor,
                self._generate_embeddings_batch_sync,
                texts
            )
            return embeddings
            
        except Exception as e:
            logger.error(f"Failed to generate batch embeddings: {e}")
            return [np.zeros(settings.FAISS_DIMENSION, dtype=np.float32) for _ in texts]
    
    def _generate_embeddings_batch_sync(self, texts: List[str]) -> List[np.ndarray]:
        """Synchronous batch embedding generation"""
        # Truncate texts if too long
        max_length = 512
        processed_texts = []
        for text in texts:
            if len(text.split()) > max_length:
                text = ' '.join(text.split()[:max_length])
            processed_texts.append(text)
        
        embeddings = self.model.encode(processed_texts, convert_to_numpy=True)
        return [emb.astype(np.float32) for emb in embeddings]
    
    async def add_to_index(self, case_id: str, embedding: np.ndarray) -> int:
        """
        Add embedding to FAISS index
        
        Args:
            case_id: Unique case identifier
            embedding: Embedding vector
            
        Returns:
            Index position in FAISS
        """
        try:
            # Ensure embedding is the right shape and type
            if embedding.shape != (settings.FAISS_DIMENSION,):
                embedding = embedding.reshape(settings.FAISS_DIMENSION).astype(np.float32)
            
            # Add to index
            embedding_2d = embedding.reshape(1, -1)
            index_position = self.faiss_index.ntotal
            self.faiss_index.add(embedding_2d)
            
            # Update mapping
            self.case_id_mapping[index_position] = case_id
            
            logger.debug(f"Added case {case_id} to FAISS index at position {index_position}")
            return index_position
            
        except Exception as e:
            logger.error(f"Failed to add embedding to index: {e}")
            raise
    
    async def add_batch_to_index(self, case_embeddings: List[Tuple[str, np.ndarray]]) -> List[int]:
        """
        Add multiple embeddings to FAISS index in batch
        
        Args:
            case_embeddings: List of (case_id, embedding) tuples
            
        Returns:
            List of index positions
        """
        if not case_embeddings:
            return []
        
        try:
            # Prepare embeddings matrix
            embeddings_matrix = np.vstack([emb for _, emb in case_embeddings]).astype(np.float32)
            
            # Add batch to index
            start_position = self.faiss_index.ntotal
            self.faiss_index.add(embeddings_matrix)
            
            # Update mapping
            positions = []
            for i, (case_id, _) in enumerate(case_embeddings):
                position = start_position + i
                self.case_id_mapping[position] = case_id
                positions.append(position)
            
            logger.info(f"Added {len(case_embeddings)} embeddings to FAISS index")
            return positions
            
        except Exception as e:
            logger.error(f"Failed to add batch embeddings to index: {e}")
            raise
    
    async def search_similar(
        self, 
        query_embedding: np.ndarray, 
        k: int = 5
    ) -> List[Tuple[str, float]]:
        """
        Search for similar cases using FAISS
        
        Args:
            query_embedding: Query embedding vector
            k: Number of similar cases to return
            
        Returns:
            List of (case_id, similarity_score) tuples
        """
        if self.faiss_index.ntotal == 0:
            logger.warning("FAISS index is empty")
            return []
        
        try:
            # Ensure embedding is the right shape
            if query_embedding.shape != (settings.FAISS_DIMENSION,):
                query_embedding = query_embedding.reshape(1, settings.FAISS_DIMENSION)
            else:
                query_embedding = query_embedding.reshape(1, -1)
            
            query_embedding = query_embedding.astype(np.float32)
            
            # Search FAISS index
            distances, indices = self.faiss_index.search(query_embedding, min(k, self.faiss_index.ntotal))
            
            # Convert distances to similarity scores (FAISS returns L2 distances)
            # Convert L2 distance to cosine similarity approximation
            similarities = 1 / (1 + distances[0])
            
            # Get case IDs and scores
            results = []
            for idx, score in zip(indices[0], similarities):
                if idx in self.case_id_mapping:
                    case_id = self.case_id_mapping[idx]
                    results.append((case_id, float(score)))
            
            logger.debug(f"Found {len(results)} similar cases")
            return results
            
        except Exception as e:
            logger.error(f"Failed to search FAISS index: {e}")
            return []
    
    def save_index(self):
        """Save FAISS index and mapping to disk"""
        try:
            index_path = settings.FAISS_INDEX_PATH
            mapping_path = index_path.replace('.index', '_mapping.pkl')
            
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(index_path), exist_ok=True)
            
            # Save FAISS index
            faiss.write_index(self.faiss_index, index_path)
            
            # Save case ID mapping
            with open(mapping_path, 'wb') as f:
                pickle.dump(self.case_id_mapping, f)
            
            logger.info(f"Saved FAISS index with {self.faiss_index.ntotal} vectors")
            
        except Exception as e:
            logger.error(f"Failed to save FAISS index: {e}")
            raise
    
    def get_index_stats(self) -> Dict[str, any]:
        """Get statistics about the FAISS index"""
        return {
            'total_vectors': self.faiss_index.ntotal if self.faiss_index else 0,
            'dimension': settings.FAISS_DIMENSION,
            'index_type': 'HNSW',
            'model_name': settings.EMBEDDING_MODEL,
            'case_count': len(self.case_id_mapping),
        }
    
    async def remove_from_index(self, case_id: str) -> bool:
        """
        Remove case from index (Note: FAISS doesn't support efficient removal)
        This is a placeholder for future implementation with a different index type
        """
        logger.warning("FAISS index removal not implemented - consider rebuilding index")
        return False
    
    def clear_index(self):
        """Clear the entire FAISS index"""
        self.faiss_index = faiss.IndexHNSWFlat(settings.FAISS_DIMENSION, 32)
        self.faiss_index.hnsw.efConstruction = 200
        self.faiss_index.hnsw.efSearch = 100
        self.case_id_mapping = {}
        logger.info("Cleared FAISS index")
    
    async def update_case_embedding(self, case_id: str, new_text: str) -> bool:
        """
        Update embedding for a case (adds new embedding, doesn't remove old one)
        """
        try:
            new_embedding = await self.generate_embedding(new_text)
            await self.add_to_index(case_id, new_embedding)
            return True
        except Exception as e:
            logger.error(f"Failed to update embedding for case {case_id}: {e}")
            return False
