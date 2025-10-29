"""Vector store management with ChromaDB and GROQ embeddings."""

from typing import List, Dict, Optional
from pathlib import Path
import chromadb
from chromadb.config import Settings
from src.config import Config


class VectorStore:
    """Manage vector storage with ChromaDB."""

    def __init__(self, persist_directory: Path = Config.CHROMA_DB_PATH):

        self.persist_directory = persist_directory
        
        # Initialize ChromaDB client with persistence
        self.client = chromadb.PersistentClient(
            path=str(persist_directory),
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )

    def create_collection(self, collection_name: str, replace: bool = False) -> chromadb.Collection:
        """
        Create or get a collection.
        """
        if replace:
            try:
                self.client.delete_collection(collection_name)
            except Exception:
                pass
        
        collection = self.client.get_or_create_collection(
            name=collection_name,
            metadata={"hnsw:space": "cosine"}  # Use cosine similarity
        )
        
        return collection

    def add_documents(
        self,
        collection_name: str,
        chunks: List[Dict[str, any]],
        document_id: str
    ) -> None:
        """
        Add document chunks to the vector store.
        """
        collection = self.create_collection(collection_name)
        
        # Prepare data for ChromaDB
        ids = []
        documents = []
        metadatas = []
        
        for i, chunk in enumerate(chunks):
            chunk_id = f"{document_id}_chunk_{i}"
            ids.append(chunk_id)
            documents.append(chunk["text"])
            
            # Add document_id to metadata
            metadata = chunk.get("metadata", {}).copy()
            metadata["document_id"] = document_id
            metadata["chunk_index"] = i
            metadatas.append(metadata)
        
        # Add to collection (ChromaDB will handle embeddings automatically)
        collection.add(
            ids=ids,
            documents=documents,
            metadatas=metadatas
        )

    def query(
        self,
        collection_name: str,
        query_text: str,
        n_results: int = 5,
        filter_dict: Optional[Dict] = None
    ) -> Dict[str, any]:
        """
        Query the vector store.
        """
        try:
            collection = self.client.get_collection(collection_name)
        except Exception:
            return {
                "documents": [],
                "metadatas": [],
                "distances": [],
                "ids": []
            }
        
        results = collection.query(
            query_texts=[query_text],
            n_results=n_results,
            where=filter_dict
        )
        
        return {
            "documents": results["documents"][0] if results["documents"] else [],
            "metadatas": results["metadatas"][0] if results["metadatas"] else [],
            "distances": results["distances"][0] if results["distances"] else [],
            "ids": results["ids"][0] if results["ids"] else []
        }

    def delete_document(self, collection_name: str, document_id: str) -> None:
        """
        Delete all chunks of a document from the collection.
        """
        try:
            collection = self.client.get_collection(collection_name)
            collection.delete(where={"document_id": document_id})
        except Exception as e:
            print(f"Error deleting document {document_id}: {e}")

    def list_collections(self) -> List[str]:
        """List all collections in the vector store."""
        collections = self.client.list_collections()
        return [col.name for col in collections]

    def get_collection_count(self, collection_name: str) -> int:
        """Get the number of documents in a collection."""
        try:
            collection = self.client.get_collection(collection_name)
            return collection.count()
        except Exception:
            return 0
