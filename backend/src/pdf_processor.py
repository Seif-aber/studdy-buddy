"""Main PDF processing pipeline."""

import shutil
from pathlib import Path
from typing import Dict, Optional
from datetime import datetime

from src.pdf_parser import PDFParser
from src.text_chunker import TextChunker
from src.vector_store import VectorStore
from src.config import Config


class PDFProcessor:
    """Process PDF files for RAG system."""

    def __init__(self):
        """Initialize PDF processor."""
        self.pdf_parser = PDFParser()
        self.text_chunker = TextChunker()
        self.vector_store = VectorStore()
        self.uploads_dir = Config.UPLOADS_PATH
        
    def process_pdf(
        self,
        pdf_path: Path,
        document_id: Optional[str] = None,
        collection_name: str = "documents"
    ) -> Dict[str, any]:
        """
        Process a PDF file: extract text, chunk it, and store embeddings.
        """
        # Generate document ID if not provided
        if document_id is None:
            document_id = pdf_path.stem
        
        print(f"Processing PDF: {pdf_path.name}")
        
        # Step 1: Extract text from PDF
        pdf_data = self.pdf_parser.extract_text(pdf_path)
        
        # Step 2: Chunk the text
        doc_metadata = {
            "document_id": document_id,
            "filename": pdf_path.name,
            "title": pdf_data["metadata"].get("title", pdf_path.stem),
            "author": pdf_data["metadata"].get("author", ""),
            "num_pages": pdf_data["num_pages"],
            "processed_at": datetime.now().isoformat()
        }
        
        chunks = self.text_chunker.chunk_pages(
            pages=pdf_data["pages"],
            doc_metadata=doc_metadata
        )
        
        # Step 3: Store embeddings in vector database
        self.vector_store.add_documents(
            collection_name=collection_name,
            chunks=chunks,
            document_id=document_id
        )
        
        # Step 4: Copy PDF to uploads directory
        destination = self.uploads_dir / f"{document_id}.pdf"
        if pdf_path != destination:
            shutil.copy2(pdf_path, destination)
        
        result = {
            "document_id": document_id,
            "filename": pdf_path.name,
            "num_pages": pdf_data["num_pages"],
            "num_chunks": len(chunks),
            "metadata": doc_metadata,
            "collection": collection_name,
            "status": "success"
        }
        
        print(f"✓ Successfully processed: {pdf_path.name}")
        return result

    def delete_document(
        self,
        document_id: str,
        collection_name: str = "documents"
    ) -> Dict[str, any]:
        """
        Delete a document from the vector store and uploads directory.
        """
        # Delete from vector store
        self.vector_store.delete_document(collection_name, document_id)
        
        # Delete PDF file
        pdf_path = self.uploads_dir / f"{document_id}.pdf"
        if pdf_path.exists():
            pdf_path.unlink()
        
        return {
            "document_id": document_id,
            "status": "deleted"
        }

    def query_documents(
        self,
        query: str,
        collection_name: str = "documents",
        n_results: int = 5
    ) -> Dict[str, any]:
        """
        Query the vector store for relevant document chunks.
        """
        return self.vector_store.query(
            collection_name=collection_name,
            query_text=query,
            n_results=n_results
        )

    def list_documents(self, collection_name: str = "documents") -> Dict[str, any]:
        """
        List all processed documents.
        """
        count = self.vector_store.get_collection_count(collection_name)
        
        # List PDF files in uploads directory
        pdf_files = list(self.uploads_dir.glob("*.pdf"))
        
        return {
            "collection": collection_name,
            "total_chunks": count,
            "documents": [
                {
                    "document_id": pdf.stem,
                    "filename": pdf.name,
                    "size_bytes": pdf.stat().st_size
                }
                for pdf in pdf_files
            ]
        }
