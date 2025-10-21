import PDFViewer from './PDFViewer';

function LeftPanel({ documents, selectedDocument, onSelectDocument }) {
  return (
    <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
      {/* Document List */}
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">My Documents</h2>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {documents.length === 0 ? (
            <p className="text-gray-500 text-sm">No documents uploaded yet</p>
          ) : (
            documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onSelectDocument(doc)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedDocument?.id === doc.id
                    ? 'bg-blue-50 border border-blue-200'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-start space-x-2">
                  <span className="text-xl">📄</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {doc.name}
                    </p>
                    <p className="text-xs text-gray-500">{doc.uploadDate}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* PDF Viewer */}
      <div className="flex-1 overflow-hidden">
        {selectedDocument ? (
          <PDFViewer document={selectedDocument} />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <p className="text-4xl mb-2">📄</p>
              <p>Select a document to view</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default LeftPanel;
