"""FastAPI server for PDF processing."""

import asyncio
import uuid
from pathlib import Path
from typing import Dict
from datetime import datetime

from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from src.pdf_processor import PDFProcessor
from src.config import Config

app = FastAPI(title="AI Study Buddy API", version="0.1.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global storage for processing status
processing_status: Dict[str, Dict] = {}

# Initialize processor
processor = PDFProcessor()


class ProcessingProgress:
    """Track processing progress."""
    
    def __init__(self, task_id: str):
        self.task_id = task_id
        self.stages = [
            "Uploading file",
            "Extracting text",
            "Chunking text",
            "Generating embeddings",
            "Storing in database",
            "Complete"
        ]
        self.current_stage = 0
        self.update_status("started", "Initializing...", 0)
    
    def update_status(self, status: str, message: str, progress: int):
        """Update the processing status."""
        processing_status[self.task_id] = {
            "status": status,
            "message": message,
            "progress": progress,
            "current_stage": self.stages[min(self.current_stage, len(self.stages) - 1)],
            "timestamp": datetime.now().isoformat()
        }
    
    def next_stage(self, message: str = None):
        """Move to the next processing stage."""
        self.current_stage += 1
        progress = int((self.current_stage / len(self.stages)) * 100)
        stage_message = message or self.stages[min(self.current_stage, len(self.stages) - 1)]
        self.update_status("processing", stage_message, progress)
    
    def complete(self, result: Dict):
        """Mark processing as complete."""
        self.current_stage = len(self.stages) - 1
        processing_status[self.task_id] = {
            "status": "completed",
            "message": "Processing complete",
            "progress": 100,
            "current_stage": "Complete",
            "result": result,
            "timestamp": datetime.now().isoformat()
        }
    
    def error(self, error_message: str):
        """Mark processing as failed."""
        processing_status[self.task_id] = {
            "status": "failed",
            "message": error_message,
            "progress": int((self.current_stage / len(self.stages)) * 100),
            "current_stage": self.stages[self.current_stage],
            "timestamp": datetime.now().isoformat()
        }


async def process_pdf_background(task_id: str, file_path: Path, document_id: str):
    """Process PDF in the background with progress tracking."""
    progress = ProcessingProgress(task_id)
    
    try:
        progress.next_stage("File uploaded successfully")
        await asyncio.sleep(0.5)
        
        progress.next_stage("Extracting text from PDF...")
        await asyncio.sleep(0.3)
        
        progress.next_stage("Chunking text for processing...")
        await asyncio.sleep(0.3)
        
        progress.next_stage("Generating embeddings...")
        
        result = await asyncio.to_thread(
            processor.process_pdf,
            file_path,
            document_id
        )
        
        progress.next_stage("Finalizing...")
        await asyncio.sleep(0.3)
        
        # Stage 6: Complete
        progress.complete(result)
        
    except Exception as e:
        progress.error(f"Error processing PDF: {str(e)}")
        # Clean up file on error
        if file_path.exists():
            file_path.unlink()


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "message": "AI Study Buddy API",
        "version": "0.1.0",
        "status": "running"
    }


@app.post("/api/documents/upload")
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Upload and process a PDF document.
    
    Returns a task_id to track processing progress.
    """
    # Validate file type
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    # Generate unique IDs
    task_id = str(uuid.uuid4())
    document_id = str(uuid.uuid4())
    
    # Save uploaded file temporarily
    temp_path = Config.UPLOADS_PATH / f"temp_{document_id}.pdf"
    
    try:
        # Save file
        with open(temp_path, "wb") as f:
            content = await file.read()
            f.write(content)
        
        # Start background processing
        background_tasks.add_task(
            process_pdf_background,
            task_id,
            temp_path,
            document_id
        )
        
        return {
            "task_id": task_id,
            "document_id": document_id,
            "filename": file.filename,
            "message": "Processing started"
        }
        
    except Exception as e:
        if temp_path.exists():
            temp_path.unlink()
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.get("/api/documents/status/{task_id}")
async def get_processing_status(task_id: str):
    """
    Get the processing status for a task.
    """
    if task_id not in processing_status:
        raise HTTPException(status_code=404, detail="Task not found")
    
    return processing_status[task_id]


@app.get("/api/documents")
async def list_documents():
    """
    List all processed documents.
    """
    try:
        result = processor.list_documents()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str):
    """
    Delete a document and its embeddings.
    """
    try:
        result = processor.delete_document(document_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/query")
async def query_documents(query: str, n_results: int = 5):
    """
    Query documents for relevant information.
    """
    try:
        results = processor.query_documents(query, n_results=n_results)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
