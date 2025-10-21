import { useState } from 'react';
import Header from './components/Header';
import LeftPanel from './components/LeftPanel';
import RightPanel from './components/RightPanel';

function App() {
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'quiz'

  const handleUpload = (file) => {
    // TODO: Upload to backend
    const newDoc = {
      id: Date.now(),
      name: file.name,
      file: file,
      uploadDate: new Date().toLocaleDateString()
    };
    setDocuments([...documents, newDoc]);
    setSelectedDocument(newDoc);
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
    </div>
  );
}

export default App;
