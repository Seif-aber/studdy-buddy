import { useState } from 'react';
import Header from './components/Header';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';
import ProgressTracker from './components/ProgressTracker';

function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'quiz'
  const [processingTask, setProcessingTask] = useState(null);

  const handleUpload = async (file) => {
    try {
      // Create form data
      const formData = new FormData();
      formData.append('file', file);

      // Upload to backend
      const response = await fetch('http://localhost:8000/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Start tracking progress
      setProcessingTask({
        taskId: data.task_id,
        documentId: data.document_id,
        filename: data.filename,
        file: file
      });

    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document: ' + error.message);
    }
  };

  const handleProcessingComplete = (result) => {
    // Add document to list
    const newDoc = {
      id: processingTask.documentId,
      name: processingTask.filename,
      file: processingTask.file,
      uploadDate: new Date().toLocaleDateString(),
      numPages: result.num_pages,
      numChunks: result.num_chunks
    };
    
    setDocuments([...documents, newDoc]);
    setSelectedDocument(newDoc);
    setProcessingTask(null);
    
    console.log('Processing complete:', result);
  };

  const handleProcessingError = (error) => {
    alert('Processing failed: ' + error);
    setProcessingTask(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <Header onUpload={handleUpload} />
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Document Viewer */}
        <LeftPanel 
          documents={documents}
          selectedDocument={selectedDocument}
          onSelectDocument={setSelectedDocument}
        />
        
        {/* Right Panel - Chat/Quiz Interface */}
        <RightPanel 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          selectedDocument={selectedDocument}
        />
      </div>

      {/* Progress Tracker Modal */}
      {processingTask && (
        <ProgressTracker
          taskId={processingTask.taskId}
          onComplete={handleProcessingComplete}
          onError={handleProcessingError}
        />
      )}
    </div>
  );
}

export default App;
