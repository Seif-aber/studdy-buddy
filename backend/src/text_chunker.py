"""Text chunking utilities for RAG."""

from typing import List, Dict
from langchain_text_splitters import RecursiveCharacterTextSplitter
from src.config import Config


class TextChunker:
    """Split text into chunks for embedding and retrieval."""

    def __init__(
        self,
        chunk_size: int = Config.CHUNK_SIZE,
        chunk_overlap: int = Config.CHUNK_OVERLAP
    ):

        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )

    def chunk_text(self, text: str, metadata: Dict = None) -> List[Dict[str, any]]:
        """
        Split text into chunks.
        """
        chunks = self.text_splitter.split_text(text)
        
        result = []
        for i, chunk in enumerate(chunks):
            chunk_data = {
                "text": chunk,
                "chunk_index": i,
                "metadata": metadata or {}
            }
            result.append(chunk_data)
        
        return result

    def chunk_pages(self, pages: List[Dict[str, any]], doc_metadata: Dict = None) -> List[Dict[str, any]]:
        """
        Split pages into chunks while preserving page numbers.
        """
        all_chunks = []
        chunk_id = 0

        for page in pages:
            page_text = page["text"]
            page_number = page["page_number"]
            
            chunks = self.text_splitter.split_text(page_text)
            
            for chunk in chunks:
                chunk_metadata = {
                    "page_number": page_number,
                    "chunk_id": chunk_id,
                    **(doc_metadata or {})
                }
                
                all_chunks.append({
                    "text": chunk,
                    "metadata": chunk_metadata
                })
                
                chunk_id += 1

        return all_chunks
