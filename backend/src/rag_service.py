"""RAG (Retrieval Augmented Generation) service for chat functionality."""

from typing import List, Dict, Optional
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from src.vector_store import VectorStore
from src.config import Config


class RAGService:
    """RAG service for answering questions about documents."""

    def __init__(self):
        """Initialize RAG service."""
        self.vector_store = VectorStore()
        
        # Initialize GROQ LLM
        self.llm = ChatGroq(
            api_key=Config.GROQ_API_KEY,
            model_name="openai/gpt-oss-20b",
            temperature=0.3,  # Lower temperature for more focused answers
            max_tokens=2048
        )
        
        # System prompt for RAG
        self.system_prompt = """You are a helpful AI study assistant. You answer questions based on the provided document context.

Guidelines:
- Answer questions accurately based on the provided context
- If the context doesn't contain enough information, say so
- Cite page numbers when referencing specific information
- Be concise but thorough
- If asked about something not in the context, acknowledge the limitation"""

    def retrieve_context(
        self,
        query: str,
        collection_name: str = "documents",
        n_results: int = 5,
        document_id: Optional[str] = None
    ) -> List[Dict[str, any]]:
        """
        Retrieve relevant context chunks for a query.
        """
        
        # Build filter if document_id specified
        filter_dict = {"document_id": document_id} if document_id else None
        
        # Query vector store
        results = self.vector_store.query(
            collection_name=collection_name,
            query_text=query,
            n_results=n_results,
            filter_dict=filter_dict
        )
        
        # Format results
        context_chunks = []
        for doc, metadata, distance in zip(
            results["documents"],
            results["metadatas"],
            results["distances"]
        ):
            context_chunks.append({
                "text": doc,
                "page_number": metadata.get("page_number"),
                "document_id": metadata.get("document_id"),
                "filename": metadata.get("filename"),
                "similarity": 1 - distance  # Convert distance to similarity
            })
        
        return context_chunks

    def format_context(self, context_chunks: List[Dict[str, any]]) -> str:
        """
        Format context chunks into a readable string for the LLM.
        """
        if not context_chunks:
            return "No relevant context found in the documents."
        
        context_parts = []
        for i, chunk in enumerate(context_chunks, 1):
            page = chunk.get("page_number", "N/A")
            filename = chunk.get("filename", "Unknown")
            text = chunk["text"]
            
            context_parts.append(
                f"[Source {i} - {filename}, Page {page}]\n{text}"
            )
        
        return "\n\n---\n\n".join(context_parts)

    def generate_answer(
        self,
        query: str,
        context_chunks: List[Dict[str, any]],
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, any]:
        """
        Generate an answer using the LLM with retrieved context.

        Args:
            query: User's question
            context_chunks: Retrieved context chunks
            conversation_history: Optional previous messages

        Returns:
            Dictionary with answer and sources
        """
        # Format context
        context = self.format_context(context_chunks)
        
        # Build prompt
        prompt = f"""Context from documents:

{context}

---

Question: {query}

Answer the question based on the context above. If you reference specific information, mention the page number."""

        # Build message history
        messages = [SystemMessage(content=self.system_prompt)]
        
        # Add conversation history if provided
        if conversation_history:
            for msg in conversation_history[-6:]:  # Last 3 exchanges
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
        
        # Add current query
        messages.append(HumanMessage(content=prompt))
        
        # Generate response
        response = self.llm.invoke(messages)
        
        # Extract sources (unique page numbers)
        sources = []
        seen = set()
        for chunk in context_chunks:
            key = (chunk.get("document_id"), chunk.get("page_number"))
            if key not in seen and chunk.get("page_number"):
                seen.add(key)
                sources.append({
                    "document_id": chunk.get("document_id"),
                    "filename": chunk.get("filename"),
                    "page_number": chunk.get("page_number"),
                    "similarity": chunk.get("similarity")
                })
        
        return {
            "answer": response.content,
            "sources": sources,
            "context_used": len(context_chunks)
        }

    def generate_answer_stream(
        self,
        query: str,
        context_chunks: List[Dict[str, any]],
        conversation_history: Optional[List[Dict[str, str]]] = None
    ):
        """
        Generate an answer using the LLM with streaming.
        """
        # Format context
        context = self.format_context(context_chunks)
        
        # Build prompt
        prompt = f"""Context from documents:

{context}

---

Question: {query}

Answer the question based on the context above. If you reference specific information, mention the page number."""

        # Build message history
        messages = [SystemMessage(content=self.system_prompt)]
        
        # Add conversation history if provided
        if conversation_history:
            for msg in conversation_history[-6:]:  # Last 3 exchanges
                if msg["role"] == "user":
                    messages.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    messages.append(AIMessage(content=msg["content"]))
        
        # Add current query
        messages.append(HumanMessage(content=prompt))
        
        # Extract sources (unique page numbers)
        sources = []
        seen = set()
        for chunk in context_chunks:
            key = (chunk.get("document_id"), chunk.get("page_number"))
            if key not in seen and chunk.get("page_number"):
                seen.add(key)
                sources.append({
                    "document_id": chunk.get("document_id"),
                    "filename": chunk.get("filename"),
                    "page_number": chunk.get("page_number"),
                    "similarity": chunk.get("similarity")
                })
        
        # Stream response from LLM
        for chunk in self.llm.stream(messages):
            if chunk.content:
                yield {
                    "type": "content",
                    "data": chunk.content
                }
        
        # Send sources at the end
        yield {
            "type": "sources",
            "data": {
                "sources": sources,
                "context_used": len(context_chunks)
            }
        }

    def chat(
        self,
        query: str,
        collection_name: str = "documents",
        document_id: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        n_results: int = 5
    ) -> Dict[str, any]:
        """
        Complete RAG chat pipeline: retrieve context and generate answer.

        Args:
            query: User's question
            collection_name: Vector store collection name
            document_id: Optional filter by specific document
            conversation_history: Optional previous conversation messages
            n_results: Number of context chunks to retrieve

        Returns:
            Dictionary with answer, sources, and metadata
        """
        # Step 1: Retrieve relevant context
        context_chunks = self.retrieve_context(
            query=query,
            collection_name=collection_name,
            n_results=n_results,
            document_id=document_id
        )
        
        # Step 2: Generate answer with LLM
        result = self.generate_answer(
            query=query,
            context_chunks=context_chunks,
            conversation_history=conversation_history
        )
        
        return result

    def chat_stream(
        self,
        query: str,
        collection_name: str = "documents",
        document_id: Optional[str] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
        n_results: int = 5
    ):
        """
        Complete RAG chat pipeline with streaming: retrieve context and generate answer.
        """
        # Step 1: Retrieve relevant context
        context_chunks = self.retrieve_context(
            query=query,
            collection_name=collection_name,
            n_results=n_results,
            document_id=document_id
        )
        
        # Step 2: Stream answer with LLM
        for chunk in self.generate_answer_stream(
            query=query,
            context_chunks=context_chunks,
            conversation_history=conversation_history
        ):
            yield chunk
